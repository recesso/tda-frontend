# Talent Demand Analyst - Production Readiness Specification

> **Engineering Standard**: Google/Palantir L5+ Production Grade
> **Status**: Pre-Implementation Review
> **Author**: Architecture Team
> **Reviewers**: [Pending External Review]

---

## Executive Summary

This document specifies the production infrastructure, security controls, reliability patterns, and operational procedures required to deploy the Talent Demand Analyst at enterprise scale. It addresses 8 critical gap areas identified in the production readiness assessment.

---

## Table of Contents

1. [SLOs and Error Budgets](#1-slos-and-error-budgets)
2. [Security Architecture](#2-security-architecture)
3. [Reliability Patterns](#3-reliability-patterns)
4. [Observability Stack](#4-observability-stack)
5. [Scalability Design](#5-scalability-design)
6. [Data Quality Framework](#6-data-quality-framework)
7. [Testing Strategy](#7-testing-strategy)
8. [Operational Runbooks](#8-operational-runbooks)
9. [Architecture Decision Records](#9-architecture-decision-records)
10. [Implementation Phases](#10-implementation-phases)

---

## 1. SLOs and Error Budgets

### Service Level Objectives

| Metric | SLO Target | Measurement | Alerting Threshold |
|--------|-----------|-------------|-------------------|
| **Availability** | 99.5% | Successful responses / Total requests | < 99% over 5 min |
| **Latency (p50)** | < 5s | Time to first token | > 8s over 5 min |
| **Latency (p99)** | < 30s | Time to complete response | > 45s over 5 min |
| **Error Rate** | < 1% | 5xx responses / Total requests | > 2% over 5 min |
| **Token Efficiency** | < 20k tokens/query | Avg tokens per comprehensive research | > 30k sustained |

### Error Budget Policy

```yaml
# error-budget-policy.yaml
monthly_error_budget_minutes: 216  # 99.5% = 43200 min * 0.005

escalation_thresholds:
  - budget_consumed: 50%
    actions:
      - notify: engineering-lead
      - action: review_recent_deployments

  - budget_consumed: 75%
    actions:
      - notify: engineering-team
      - action: freeze_non_critical_deploys

  - budget_consumed: 90%
    actions:
      - notify: engineering-director
      - action: freeze_all_deploys
      - action: initiate_incident_review

recovery_criteria:
  - 24_hours_without_incident
  - root_cause_documented
  - fix_deployed_and_validated
```

### SLI Definitions

```python
# backend/metrics/sli.py
"""Service Level Indicator Definitions"""

from prometheus_client import Counter, Histogram, Gauge

# Availability SLI
requests_total = Counter(
    'tda_requests_total',
    'Total requests',
    ['endpoint', 'status_code']
)

# Latency SLI
request_latency = Histogram(
    'tda_request_duration_seconds',
    'Request latency in seconds',
    ['endpoint'],
    buckets=[0.5, 1, 2, 5, 10, 30, 60, 120]
)

time_to_first_token = Histogram(
    'tda_ttft_seconds',
    'Time to first token',
    buckets=[0.5, 1, 2, 3, 5, 8, 10]
)

# Error Rate SLI
errors_total = Counter(
    'tda_errors_total',
    'Total errors',
    ['error_type', 'source']  # source: tavily, exa, anthropic, internal
)

# Token Efficiency SLI
tokens_used = Counter(
    'tda_tokens_total',
    'Total tokens consumed',
    ['model', 'operation']  # operation: main_agent, subagent, summarization
)

# Subagent Performance
subagent_duration = Histogram(
    'tda_subagent_duration_seconds',
    'Subagent execution time',
    ['subagent_name'],
    buckets=[5, 10, 20, 30, 60, 120]
)
```

---

## 2. Security Architecture

### 2.1 Authentication & Authorization

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        AUTHENTICATION FLOW                               │
│                                                                          │
│   User           Frontend          API Gateway        Backend            │
│    │                │                   │                │               │
│    │──Login────────►│                   │                │               │
│    │                │──Get Token───────►│                │               │
│    │                │◄──JWT Token───────│                │               │
│    │◄──Token────────│                   │                │               │
│    │                │                   │                │               │
│    │──API Call─────►│──Bearer Token────►│                │               │
│    │                │                   │──Verify JWT───►│               │
│    │                │                   │◄──User Claims──│               │
│    │                │                   │──Forward Req──►│               │
│    │                │◄──Response────────│◄──Response─────│               │
│    │◄──Response─────│                   │                │               │
└─────────────────────────────────────────────────────────────────────────┘
```

### 2.2 JWT Implementation

```python
# backend/security/auth.py
"""JWT Authentication with Tenant Isolation"""

import os
from datetime import datetime, timedelta
from typing import Optional

import jwt
from fastapi import HTTPException, Security, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel

JWT_SECRET = os.environ["JWT_SECRET"]
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_HOURS = 24

security = HTTPBearer()


class UserClaims(BaseModel):
    """JWT payload structure"""
    user_id: str
    tenant_id: str
    email: str
    roles: list[str]
    exp: datetime
    iat: datetime

    @property
    def is_admin(self) -> bool:
        return "admin" in self.roles


def verify_token(credentials: HTTPAuthorizationCredentials = Security(security)) -> UserClaims:
    """Verify JWT token and extract user claims.

    Raises:
        HTTPException: 401 if token invalid/expired, 403 if insufficient permissions
    """
    token = credentials.credentials

    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        claims = UserClaims(**payload)

        # Check expiration
        if datetime.utcnow() > claims.exp:
            raise HTTPException(status_code=401, detail="Token expired")

        return claims

    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError as e:
        raise HTTPException(status_code=401, detail=f"Invalid token: {str(e)}")


def require_role(required_role: str):
    """Decorator to require specific role."""
    def dependency(claims: UserClaims = Depends(verify_token)):
        if required_role not in claims.roles and not claims.is_admin:
            raise HTTPException(status_code=403, detail=f"Role '{required_role}' required")
        return claims
    return dependency


# Tenant-isolated thread ID generation
def generate_tenant_thread_id(tenant_id: str) -> str:
    """Generate thread ID scoped to tenant to prevent cross-tenant access."""
    import secrets
    return f"{tenant_id}:{secrets.token_urlsafe(16)}"


def validate_thread_access(thread_id: str, claims: UserClaims) -> bool:
    """Verify user has access to thread (tenant isolation)."""
    if ":" not in thread_id:
        return False  # Legacy format, deny
    tenant_prefix = thread_id.split(":")[0]
    return tenant_prefix == claims.tenant_id or claims.is_admin
```

### 2.3 Input Validation

```python
# backend/security/validation.py
"""Input validation middleware and schemas"""

import re
from typing import Optional

from fastapi import HTTPException, Request
from pydantic import BaseModel, Field, validator

# Constants
MAX_MESSAGE_LENGTH = 10_000  # 10KB
MAX_THREAD_ID_LENGTH = 100
ALLOWED_THREAD_ID_PATTERN = re.compile(r'^[a-zA-Z0-9_:-]+$')


class ChatRequest(BaseModel):
    """Validated chat request schema."""
    message: str = Field(
        ...,
        min_length=1,
        max_length=MAX_MESSAGE_LENGTH,
        description="User message for analysis"
    )
    thread_id: Optional[str] = Field(
        None,
        max_length=MAX_THREAD_ID_LENGTH,
        description="Thread ID for conversation continuity"
    )

    @validator('message')
    def sanitize_message(cls, v):
        # Remove null bytes and control characters
        v = v.replace('\x00', '').strip()
        if not v:
            raise ValueError("Message cannot be empty")
        return v

    @validator('thread_id')
    def validate_thread_id(cls, v):
        if v is None:
            return v
        if not ALLOWED_THREAD_ID_PATTERN.match(v):
            raise ValueError("Invalid thread_id format")
        return v


class StateRequest(BaseModel):
    """Validated state request schema."""
    thread_id: str = Field(
        ...,
        min_length=1,
        max_length=MAX_THREAD_ID_LENGTH,
        pattern=r'^[a-zA-Z0-9_:-]+$'
    )


async def validate_request_size(request: Request, max_size: int = 50_000):
    """Middleware to reject oversized requests (DoS protection)."""
    content_length = request.headers.get('content-length')
    if content_length and int(content_length) > max_size:
        raise HTTPException(status_code=413, detail="Request too large")


# Path traversal protection for file downloads
def validate_file_path(file_path: str) -> str:
    """Sanitize file path to prevent traversal attacks."""
    # Normalize and check for traversal
    normalized = os.path.normpath(file_path)
    if '..' in normalized or normalized.startswith('/'):
        raise HTTPException(status_code=400, detail="Invalid file path")
    return normalized
```

### 2.4 Rate Limiting

```python
# backend/security/rate_limit.py
"""Multi-tier rate limiting"""

from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

def get_user_identifier(request):
    """Extract user identifier for rate limiting.

    Priority:
    1. User ID from JWT (per-user limiting)
    2. Tenant ID from JWT (per-tenant limiting)
    3. IP address (anonymous limiting)
    """
    # Try to get user claims from request state
    if hasattr(request.state, 'user_claims'):
        return request.state.user_claims.user_id

    # Fall back to IP
    return get_remote_address(request)


limiter = Limiter(key_func=get_user_identifier)

# Rate limit configurations
RATE_LIMITS = {
    "chat": "20/minute",           # 20 research queries per minute
    "state": "60/minute",          # 60 state checks per minute
    "files": "100/minute",         # 100 file downloads per minute
    "health": "1000/minute",       # Health checks (monitoring)
}

# Tenant-level limits (higher tier)
TENANT_LIMITS = {
    "free": {"chat": "10/minute", "daily": "100/day"},
    "pro": {"chat": "50/minute", "daily": "1000/day"},
    "enterprise": {"chat": "200/minute", "daily": "unlimited"},
}
```

### 2.5 Security Headers

```python
# backend/security/headers.py
"""Security headers middleware"""

from fastapi import FastAPI
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import Response


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request, call_next):
        response: Response = await call_next(request)

        # Prevent XSS
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-XSS-Protection"] = "1; mode=block"

        # Prevent clickjacking
        response.headers["X-Frame-Options"] = "DENY"

        # HSTS (only in production)
        if request.url.scheme == "https":
            response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"

        # CSP for API responses
        response.headers["Content-Security-Policy"] = "default-src 'none'; frame-ancestors 'none'"

        # Prevent MIME sniffing
        response.headers["X-Permitted-Cross-Domain-Policies"] = "none"

        # Referrer policy
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"

        return response


def configure_security(app: FastAPI):
    """Apply all security middleware."""
    app.add_middleware(SecurityHeadersMiddleware)

    # CORS with specific origins (not *)
    from fastapi.middleware.cors import CORSMiddleware
    app.add_middleware(
        CORSMiddleware,
        allow_origins=[
            "https://tda.skillbridgetalent.ai",
            "https://hub.skillbridgetalent.ai",
        ],
        allow_credentials=True,
        allow_methods=["GET", "POST"],
        allow_headers=["Authorization", "Content-Type"],
        expose_headers=["X-Thread-Id", "X-Request-Id"],
    )
```

---

## 3. Reliability Patterns

### 3.1 Circuit Breaker Implementation

```python
# backend/reliability/circuit_breaker.py
"""Circuit breakers for external service calls"""

import asyncio
import logging
from datetime import datetime, timedelta
from enum import Enum
from typing import Callable, TypeVar, Generic
from functools import wraps

logger = logging.getLogger(__name__)

T = TypeVar('T')


class CircuitState(Enum):
    CLOSED = "closed"      # Normal operation
    OPEN = "open"          # Failing, reject requests
    HALF_OPEN = "half_open"  # Testing recovery


class CircuitBreaker(Generic[T]):
    """Circuit breaker with async support and metrics."""

    def __init__(
        self,
        name: str,
        failure_threshold: int = 5,
        recovery_timeout: int = 60,
        half_open_max_calls: int = 3,
    ):
        self.name = name
        self.failure_threshold = failure_threshold
        self.recovery_timeout = timedelta(seconds=recovery_timeout)
        self.half_open_max_calls = half_open_max_calls

        self._state = CircuitState.CLOSED
        self._failure_count = 0
        self._last_failure_time: datetime | None = None
        self._half_open_calls = 0

    @property
    def state(self) -> CircuitState:
        if self._state == CircuitState.OPEN:
            # Check if recovery timeout has passed
            if datetime.utcnow() - self._last_failure_time > self.recovery_timeout:
                self._state = CircuitState.HALF_OPEN
                self._half_open_calls = 0
                logger.info(f"Circuit {self.name} entering HALF_OPEN state")
        return self._state

    def _record_success(self):
        """Record successful call."""
        if self._state == CircuitState.HALF_OPEN:
            self._half_open_calls += 1
            if self._half_open_calls >= self.half_open_max_calls:
                self._state = CircuitState.CLOSED
                self._failure_count = 0
                logger.info(f"Circuit {self.name} CLOSED (recovered)")
        elif self._state == CircuitState.CLOSED:
            self._failure_count = 0

    def _record_failure(self, error: Exception):
        """Record failed call."""
        self._failure_count += 1
        self._last_failure_time = datetime.utcnow()

        if self._state == CircuitState.HALF_OPEN:
            self._state = CircuitState.OPEN
            logger.warning(f"Circuit {self.name} OPEN (failed in half-open)")
        elif self._failure_count >= self.failure_threshold:
            self._state = CircuitState.OPEN
            logger.warning(f"Circuit {self.name} OPEN (threshold reached: {error})")

    async def call(self, func: Callable[..., T], *args, **kwargs) -> T:
        """Execute function with circuit breaker protection."""
        if self.state == CircuitState.OPEN:
            raise CircuitOpenError(f"Circuit {self.name} is OPEN")

        try:
            result = await func(*args, **kwargs) if asyncio.iscoroutinefunction(func) else func(*args, **kwargs)
            self._record_success()
            return result
        except Exception as e:
            self._record_failure(e)
            raise


class CircuitOpenError(Exception):
    """Raised when circuit is open."""
    pass


# Pre-configured circuit breakers
tavily_circuit = CircuitBreaker("tavily", failure_threshold=5, recovery_timeout=60)
exa_circuit = CircuitBreaker("exa", failure_threshold=5, recovery_timeout=60)
anthropic_circuit = CircuitBreaker("anthropic", failure_threshold=3, recovery_timeout=120)


def with_circuit_breaker(circuit: CircuitBreaker):
    """Decorator to wrap function with circuit breaker."""
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            return await circuit.call(func, *args, **kwargs)
        return wrapper
    return decorator
```

### 3.2 Retry with Exponential Backoff

```python
# backend/reliability/retry.py
"""Retry logic with exponential backoff and jitter"""

import asyncio
import random
import logging
from functools import wraps
from typing import Callable, Type, Tuple

logger = logging.getLogger(__name__)


class RetryConfig:
    """Configuration for retry behavior."""
    def __init__(
        self,
        max_attempts: int = 3,
        base_delay: float = 1.0,
        max_delay: float = 30.0,
        exponential_base: float = 2.0,
        jitter: float = 0.1,
        retryable_exceptions: Tuple[Type[Exception], ...] = (Exception,),
    ):
        self.max_attempts = max_attempts
        self.base_delay = base_delay
        self.max_delay = max_delay
        self.exponential_base = exponential_base
        self.jitter = jitter
        self.retryable_exceptions = retryable_exceptions


def calculate_delay(attempt: int, config: RetryConfig) -> float:
    """Calculate delay with exponential backoff and jitter."""
    delay = min(
        config.base_delay * (config.exponential_base ** attempt),
        config.max_delay
    )
    # Add jitter: ±jitter%
    jitter_range = delay * config.jitter
    delay += random.uniform(-jitter_range, jitter_range)
    return max(0, delay)


def retry_async(config: RetryConfig = RetryConfig()):
    """Decorator for async functions with retry logic."""
    def decorator(func: Callable):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            last_exception = None

            for attempt in range(config.max_attempts):
                try:
                    return await func(*args, **kwargs)
                except config.retryable_exceptions as e:
                    last_exception = e

                    if attempt < config.max_attempts - 1:
                        delay = calculate_delay(attempt, config)
                        logger.warning(
                            f"Retry {attempt + 1}/{config.max_attempts} for {func.__name__} "
                            f"after {delay:.2f}s. Error: {e}"
                        )
                        await asyncio.sleep(delay)
                    else:
                        logger.error(
                            f"All {config.max_attempts} attempts failed for {func.__name__}: {e}"
                        )

            raise last_exception
        return wrapper
    return decorator


# Pre-configured retry configs
SEARCH_RETRY_CONFIG = RetryConfig(
    max_attempts=3,
    base_delay=1.0,
    max_delay=10.0,
    retryable_exceptions=(TimeoutError, ConnectionError, Exception),
)

LLM_RETRY_CONFIG = RetryConfig(
    max_attempts=2,
    base_delay=2.0,
    max_delay=30.0,
    retryable_exceptions=(TimeoutError,),
)
```

### 3.3 Graceful Degradation

```python
# backend/reliability/degradation.py
"""Graceful degradation and fallback chains"""

import logging
from typing import Callable, List, Any, Optional
from dataclasses import dataclass

logger = logging.getLogger(__name__)


@dataclass
class FallbackResult:
    """Result from fallback chain execution."""
    value: Any
    source: str
    degraded: bool = False
    errors: List[str] = None

    def __post_init__(self):
        if self.errors is None:
            self.errors = []


class FallbackChain:
    """Execute operations with fallback to alternatives."""

    def __init__(self, name: str):
        self.name = name
        self._handlers: List[tuple[str, Callable]] = []
        self._cache: Optional[Callable] = None

    def add_handler(self, name: str, handler: Callable) -> "FallbackChain":
        """Add a handler to the fallback chain."""
        self._handlers.append((name, handler))
        return self

    def with_cache(self, cache_lookup: Callable) -> "FallbackChain":
        """Add cache as final fallback."""
        self._cache = cache_lookup
        return self

    async def execute(self, *args, **kwargs) -> FallbackResult:
        """Execute chain, trying each handler until one succeeds."""
        errors = []

        for name, handler in self._handlers:
            try:
                result = await handler(*args, **kwargs)
                degraded = name != self._handlers[0][0]  # Not primary

                if degraded:
                    logger.warning(f"Fallback chain {self.name} degraded to {name}")

                return FallbackResult(
                    value=result,
                    source=name,
                    degraded=degraded,
                    errors=errors,
                )
            except Exception as e:
                errors.append(f"{name}: {str(e)}")
                logger.warning(f"Fallback chain {self.name}: {name} failed: {e}")
                continue

        # All handlers failed, try cache
        if self._cache:
            try:
                cached_result = await self._cache(*args, **kwargs)
                if cached_result:
                    logger.warning(f"Fallback chain {self.name} using cached result")
                    return FallbackResult(
                        value=cached_result,
                        source="cache",
                        degraded=True,
                        errors=errors,
                    )
            except Exception as e:
                errors.append(f"cache: {str(e)}")

        # Complete failure
        raise FallbackExhaustedError(
            f"All fallbacks exhausted for {self.name}: {errors}"
        )


class FallbackExhaustedError(Exception):
    """Raised when all fallback options are exhausted."""
    pass


# Search fallback chain
search_chain = (
    FallbackChain("web_search")
    .add_handler("tavily", tavily_search)
    .add_handler("exa", exa_search)
    .with_cache(cached_search_lookup)
)
```

### 3.4 Timeout Management

```python
# backend/reliability/timeouts.py
"""Timeout configuration and enforcement"""

import asyncio
from functools import wraps
from typing import Callable, TypeVar

T = TypeVar('T')


class TimeoutConfig:
    """Centralized timeout configuration."""

    # External API calls
    TAVILY_SEARCH_TIMEOUT = 15.0  # seconds
    EXA_SEARCH_TIMEOUT = 20.0
    EXA_CONTENT_TIMEOUT = 30.0

    # LLM calls
    ANTHROPIC_STREAM_TIMEOUT = 120.0
    SUBAGENT_TIMEOUT = 180.0  # 3 minutes per subagent

    # Overall request
    TOTAL_REQUEST_TIMEOUT = 300.0  # 5 minutes max

    # Healthchecks
    HEALTH_CHECK_TIMEOUT = 5.0


def with_timeout(seconds: float):
    """Decorator to enforce timeout on async functions."""
    def decorator(func: Callable[..., T]) -> Callable[..., T]:
        @wraps(func)
        async def wrapper(*args, **kwargs) -> T:
            try:
                return await asyncio.wait_for(
                    func(*args, **kwargs),
                    timeout=seconds
                )
            except asyncio.TimeoutError:
                raise TimeoutError(
                    f"{func.__name__} timed out after {seconds}s"
                )
        return wrapper
    return decorator


# Usage example:
# @with_timeout(TimeoutConfig.TAVILY_SEARCH_TIMEOUT)
# async def search_tavily(query: str) -> str:
#     ...
```

---

## 4. Observability Stack

### 4.1 Structured Logging

```python
# backend/observability/logging.py
"""Structured JSON logging with correlation IDs"""

import json
import logging
import sys
import uuid
from contextvars import ContextVar
from datetime import datetime
from typing import Any

# Context variable for request correlation
correlation_id: ContextVar[str] = ContextVar('correlation_id', default='')
user_id: ContextVar[str] = ContextVar('user_id', default='')
tenant_id: ContextVar[str] = ContextVar('tenant_id', default='')


class JSONFormatter(logging.Formatter):
    """JSON log formatter for structured logging."""

    def format(self, record: logging.LogRecord) -> str:
        log_data = {
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
            "correlation_id": correlation_id.get() or None,
            "user_id": user_id.get() or None,
            "tenant_id": tenant_id.get() or None,
        }

        # Add exception info if present
        if record.exc_info:
            log_data["exception"] = self.formatException(record.exc_info)

        # Add extra fields
        if hasattr(record, 'extra_fields'):
            log_data.update(record.extra_fields)

        return json.dumps(log_data, default=str)


def configure_logging():
    """Configure structured logging for production."""
    # Root logger
    root_logger = logging.getLogger()
    root_logger.setLevel(logging.INFO)

    # Remove existing handlers
    root_logger.handlers.clear()

    # JSON handler for stdout
    handler = logging.StreamHandler(sys.stdout)
    handler.setFormatter(JSONFormatter())
    root_logger.addHandler(handler)

    # Suppress noisy loggers
    logging.getLogger("httpx").setLevel(logging.WARNING)
    logging.getLogger("httpcore").setLevel(logging.WARNING)


class StructuredLogger:
    """Logger wrapper for structured logging with context."""

    def __init__(self, name: str):
        self._logger = logging.getLogger(name)

    def _log(self, level: int, message: str, **kwargs):
        record = self._logger.makeRecord(
            self._logger.name, level, "", 0, message, (), None
        )
        record.extra_fields = kwargs
        self._logger.handle(record)

    def info(self, message: str, **kwargs):
        self._log(logging.INFO, message, **kwargs)

    def warning(self, message: str, **kwargs):
        self._log(logging.WARNING, message, **kwargs)

    def error(self, message: str, **kwargs):
        self._log(logging.ERROR, message, **kwargs)

    def debug(self, message: str, **kwargs):
        self._log(logging.DEBUG, message, **kwargs)


# Usage:
# logger = StructuredLogger(__name__)
# logger.info("Search completed", query=query, results_count=len(results), latency_ms=120)
```

### 4.2 Metrics Collection

```python
# backend/observability/metrics.py
"""Prometheus metrics for monitoring"""

from prometheus_client import Counter, Histogram, Gauge, Info
from prometheus_client import generate_latest, CONTENT_TYPE_LATEST
from fastapi import Response

# Service info
service_info = Info('tda_service', 'Service information')
service_info.info({
    'version': '2.0.0',
    'environment': 'production',
})

# Request metrics
requests_total = Counter(
    'tda_requests_total',
    'Total HTTP requests',
    ['method', 'endpoint', 'status_code']
)

request_duration_seconds = Histogram(
    'tda_request_duration_seconds',
    'Request latency',
    ['method', 'endpoint'],
    buckets=[0.1, 0.5, 1.0, 2.0, 5.0, 10.0, 30.0, 60.0, 120.0]
)

# Agent metrics
agent_invocations_total = Counter(
    'tda_agent_invocations_total',
    'Total agent invocations',
    ['agent_type']  # main, job_posting_analyzer, skill_emergence_researcher, industry_report_synthesizer
)

agent_duration_seconds = Histogram(
    'tda_agent_duration_seconds',
    'Agent execution time',
    ['agent_type'],
    buckets=[5, 10, 20, 30, 60, 120, 180, 300]
)

# Token metrics (critical for cost)
tokens_consumed = Counter(
    'tda_tokens_consumed_total',
    'Total tokens consumed',
    ['model', 'type']  # type: input, output
)

token_cost_dollars = Counter(
    'tda_token_cost_dollars_total',
    'Estimated token cost in USD',
    ['model']
)

# Tool metrics
tool_invocations_total = Counter(
    'tda_tool_invocations_total',
    'Total tool invocations',
    ['tool_name', 'status']  # status: success, error, timeout
)

tool_duration_seconds = Histogram(
    'tda_tool_duration_seconds',
    'Tool execution time',
    ['tool_name'],
    buckets=[0.5, 1.0, 2.0, 5.0, 10.0, 20.0, 30.0]
)

# Circuit breaker metrics
circuit_state = Gauge(
    'tda_circuit_state',
    'Circuit breaker state (0=closed, 1=half-open, 2=open)',
    ['circuit_name']
)

# Active connections
active_requests = Gauge(
    'tda_active_requests',
    'Currently active requests'
)

# Error metrics
errors_total = Counter(
    'tda_errors_total',
    'Total errors',
    ['error_type', 'source']
)


def get_metrics() -> Response:
    """Endpoint to expose Prometheus metrics."""
    return Response(
        content=generate_latest(),
        media_type=CONTENT_TYPE_LATEST
    )
```

### 4.3 Distributed Tracing

```python
# backend/observability/tracing.py
"""OpenTelemetry tracing configuration"""

import os
from opentelemetry import trace
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import BatchSpanProcessor
from opentelemetry.exporter.otlp.proto.grpc.trace_exporter import OTLPSpanExporter
from opentelemetry.sdk.resources import Resource
from opentelemetry.instrumentation.fastapi import FastAPIInstrumentor
from opentelemetry.instrumentation.httpx import HTTPXClientInstrumentor


def configure_tracing(app):
    """Configure OpenTelemetry tracing."""

    # Skip in development
    if os.getenv("ENV") == "development":
        return

    # Create resource with service info
    resource = Resource.create({
        "service.name": "talent-demand-analyst",
        "service.version": "2.0.0",
        "deployment.environment": os.getenv("ENV", "production"),
    })

    # Create tracer provider
    provider = TracerProvider(resource=resource)

    # Add OTLP exporter (to Jaeger, Zipkin, or other)
    otlp_endpoint = os.getenv("OTLP_ENDPOINT", "http://localhost:4317")
    exporter = OTLPSpanExporter(endpoint=otlp_endpoint)
    provider.add_span_processor(BatchSpanProcessor(exporter))

    # Set global tracer
    trace.set_tracer_provider(provider)

    # Instrument FastAPI
    FastAPIInstrumentor.instrument_app(app)

    # Instrument HTTP clients
    HTTPXClientInstrumentor().instrument()


def get_tracer():
    """Get tracer for manual span creation."""
    return trace.get_tracer("tda-backend")


# Usage:
# tracer = get_tracer()
# with tracer.start_as_current_span("search_tavily") as span:
#     span.set_attribute("query", query)
#     result = await search(query)
#     span.set_attribute("results_count", len(result))
```

### 4.4 Alerting Rules

```yaml
# monitoring/alerts.yaml
# Prometheus alerting rules

groups:
  - name: tda-availability
    rules:
      - alert: TDAHighErrorRate
        expr: |
          (
            sum(rate(tda_requests_total{status_code=~"5.."}[5m]))
            /
            sum(rate(tda_requests_total[5m]))
          ) > 0.02
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "High error rate detected"
          description: "Error rate is {{ $value | humanizePercentage }} (threshold: 2%)"

      - alert: TDAHighLatency
        expr: |
          histogram_quantile(0.99,
            sum(rate(tda_request_duration_seconds_bucket{endpoint="/chat"}[5m])) by (le)
          ) > 45
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "p99 latency exceeding SLO"
          description: "p99 latency is {{ $value }}s (threshold: 45s)"

  - name: tda-external-services
    rules:
      - alert: TDASearchServiceDegraded
        expr: |
          tda_circuit_state{circuit_name=~"tavily|exa"} == 2
        for: 2m
        labels:
          severity: warning
        annotations:
          summary: "Search service circuit open"
          description: "Circuit {{ $labels.circuit_name }} is OPEN"

      - alert: TDAAllSearchServicesDown
        expr: |
          tda_circuit_state{circuit_name="tavily"} == 2
          and
          tda_circuit_state{circuit_name="exa"} == 2
        for: 1m
        labels:
          severity: critical
        annotations:
          summary: "All search services unavailable"
          description: "Both Tavily and Exa circuits are OPEN"

  - name: tda-cost
    rules:
      - alert: TDAHighTokenUsage
        expr: |
          sum(increase(tda_tokens_consumed_total[1h])) > 1000000
        for: 0m
        labels:
          severity: warning
        annotations:
          summary: "High token consumption"
          description: "Consumed {{ $value }} tokens in the last hour"

      - alert: TDATokenBudgetExhausted
        expr: |
          sum(tda_token_cost_dollars_total) > 500  # $500 daily budget
        for: 0m
        labels:
          severity: critical
        annotations:
          summary: "Token budget exceeded"
          description: "Total cost has exceeded $500"

  - name: tda-subagents
    rules:
      - alert: TDASubagentSlowResponse
        expr: |
          histogram_quantile(0.95,
            sum(rate(tda_agent_duration_seconds_bucket{agent_type!="main"}[10m])) by (le, agent_type)
          ) > 120
        for: 10m
        labels:
          severity: warning
        annotations:
          summary: "Subagent responding slowly"
          description: "Subagent {{ $labels.agent_type }} p95 latency is {{ $value }}s"
```

---

## 5. Scalability Design

### 5.1 Caching Layer

```python
# backend/cache/redis_cache.py
"""Redis caching for search results and responses"""

import hashlib
import json
import os
from typing import Optional, Any
from datetime import timedelta

import redis.asyncio as redis


class CacheConfig:
    """Cache configuration."""
    SEARCH_RESULTS_TTL = timedelta(hours=1)
    RESPONSE_CACHE_TTL = timedelta(minutes=15)
    RATE_LIMIT_TTL = timedelta(minutes=1)


class RedisCache:
    """Async Redis cache client."""

    def __init__(self):
        self._client: Optional[redis.Redis] = None

    async def connect(self):
        """Initialize Redis connection."""
        redis_url = os.getenv("REDIS_URL", "redis://localhost:6379")
        self._client = redis.from_url(
            redis_url,
            encoding="utf-8",
            decode_responses=True
        )

    async def close(self):
        """Close Redis connection."""
        if self._client:
            await self._client.close()

    def _hash_key(self, key: str) -> str:
        """Create hash of key for consistent length."""
        return hashlib.sha256(key.encode()).hexdigest()[:16]

    async def get(self, key: str) -> Optional[Any]:
        """Get value from cache."""
        if not self._client:
            return None
        try:
            value = await self._client.get(key)
            return json.loads(value) if value else None
        except Exception:
            return None

    async def set(
        self,
        key: str,
        value: Any,
        ttl: timedelta = CacheConfig.SEARCH_RESULTS_TTL
    ) -> bool:
        """Set value in cache with TTL."""
        if not self._client:
            return False
        try:
            await self._client.setex(
                key,
                int(ttl.total_seconds()),
                json.dumps(value, default=str)
            )
            return True
        except Exception:
            return False

    async def delete(self, key: str) -> bool:
        """Delete key from cache."""
        if not self._client:
            return False
        try:
            await self._client.delete(key)
            return True
        except Exception:
            return False


# Search result cache
async def get_cached_search(query: str) -> Optional[str]:
    """Get cached search results."""
    cache = RedisCache()
    await cache.connect()
    try:
        key = f"search:{cache._hash_key(query)}"
        return await cache.get(key)
    finally:
        await cache.close()


async def cache_search_result(query: str, result: str):
    """Cache search results."""
    cache = RedisCache()
    await cache.connect()
    try:
        key = f"search:{cache._hash_key(query)}"
        await cache.set(key, result, CacheConfig.SEARCH_RESULTS_TTL)
    finally:
        await cache.close()
```

### 5.2 Connection Pooling

```python
# backend/http/client.py
"""HTTP client with connection pooling"""

import httpx
from contextlib import asynccontextmanager


class HTTPClientPool:
    """Managed HTTP client pool."""

    _instance: "HTTPClientPool" = None
    _client: httpx.AsyncClient = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance

    async def start(self):
        """Initialize HTTP client pool."""
        if self._client is None:
            self._client = httpx.AsyncClient(
                timeout=httpx.Timeout(30.0, connect=5.0),
                limits=httpx.Limits(
                    max_connections=100,
                    max_keepalive_connections=20,
                    keepalive_expiry=30.0,
                ),
                http2=True,
            )

    async def stop(self):
        """Close HTTP client pool."""
        if self._client:
            await self._client.aclose()
            self._client = None

    @property
    def client(self) -> httpx.AsyncClient:
        """Get HTTP client."""
        if self._client is None:
            raise RuntimeError("HTTP client not initialized")
        return self._client


@asynccontextmanager
async def get_http_client():
    """Get HTTP client from pool."""
    pool = HTTPClientPool()
    await pool.start()
    try:
        yield pool.client
    finally:
        pass  # Don't close, reuse connection
```

### 5.3 Concurrency Limits

```python
# backend/concurrency/limits.py
"""Concurrency limiting for resource protection"""

import asyncio
from contextlib import asynccontextmanager


class ConcurrencyLimits:
    """Centralized concurrency limits."""

    # Global request limit
    MAX_CONCURRENT_REQUESTS = 50

    # Per-service limits
    MAX_CONCURRENT_SEARCHES = 20
    MAX_CONCURRENT_SUBAGENTS = 10
    MAX_CONCURRENT_LLM_CALLS = 5


# Semaphores for limiting
_request_semaphore = asyncio.Semaphore(ConcurrencyLimits.MAX_CONCURRENT_REQUESTS)
_search_semaphore = asyncio.Semaphore(ConcurrencyLimits.MAX_CONCURRENT_SEARCHES)
_subagent_semaphore = asyncio.Semaphore(ConcurrencyLimits.MAX_CONCURRENT_SUBAGENTS)
_llm_semaphore = asyncio.Semaphore(ConcurrencyLimits.MAX_CONCURRENT_LLM_CALLS)


@asynccontextmanager
async def limit_requests():
    """Limit concurrent requests."""
    async with _request_semaphore:
        yield


@asynccontextmanager
async def limit_searches():
    """Limit concurrent search operations."""
    async with _search_semaphore:
        yield


@asynccontextmanager
async def limit_subagents():
    """Limit concurrent subagent executions."""
    async with _subagent_semaphore:
        yield


@asynccontextmanager
async def limit_llm_calls():
    """Limit concurrent LLM API calls."""
    async with _llm_semaphore:
        yield
```

---

## 6. Data Quality Framework

### 6.1 Output Validation

```python
# backend/validation/output.py
"""Output validation schemas and logic"""

from typing import List, Optional
from pydantic import BaseModel, Field, validator, HttpUrl
from datetime import datetime


class Source(BaseModel):
    """Validated source citation."""
    title: str = Field(..., min_length=1, max_length=500)
    url: HttpUrl
    accessed_date: datetime = Field(default_factory=datetime.utcnow)

    @validator('url')
    def validate_url_not_localhost(cls, v):
        if 'localhost' in str(v) or '127.0.0.1' in str(v):
            raise ValueError("Source URL cannot be localhost")
        return v


class Metric(BaseModel):
    """Validated metric data point."""
    name: str = Field(..., min_length=1, max_length=200)
    value: float
    unit: Optional[str] = None
    change_direction: Optional[str] = Field(None, regex=r'^(increasing|decreasing|stable)$')
    time_period: Optional[str] = None

    @validator('value')
    def validate_reasonable_value(cls, v, values):
        # Percentages should be 0-100
        if values.get('unit') == '%' and (v < 0 or v > 100):
            raise ValueError(f"Percentage must be 0-100, got {v}")
        # Most metrics shouldn't be negative
        if v < 0 and values.get('unit') != 'change':
            raise ValueError(f"Unexpected negative value: {v}")
        return v


class ResearchFinding(BaseModel):
    """Validated research finding."""
    summary: str = Field(..., min_length=20, max_length=1000)
    details: Optional[str] = Field(None, max_length=5000)
    confidence: str = Field(..., regex=r'^(high|medium|low)$')
    sources: List[Source] = Field(..., min_items=1)


class ResearchOutput(BaseModel):
    """Complete validated research output."""
    executive_summary: str = Field(..., min_length=100, max_length=2000)
    key_findings: List[ResearchFinding] = Field(..., min_items=1, max_items=10)
    metrics: List[Metric] = Field(default_factory=list)
    recommendations: List[str] = Field(default_factory=list)
    sources: List[Source] = Field(..., min_items=3)
    generated_at: datetime = Field(default_factory=datetime.utcnow)
    data_freshness: str = Field(..., regex=r'^(real-time|daily|weekly|monthly|stale)$')

    @validator('executive_summary')
    def summary_must_have_content(cls, v):
        # Check it's not just filler
        word_count = len(v.split())
        if word_count < 20:
            raise ValueError(f"Executive summary too short: {word_count} words")
        return v


def validate_agent_output(raw_output: dict) -> ResearchOutput:
    """Validate and structure agent output."""
    try:
        return ResearchOutput(**raw_output)
    except Exception as e:
        # Log validation failure for monitoring
        logger.warning(f"Output validation failed: {e}", raw_output=raw_output)
        raise OutputValidationError(f"Invalid research output: {e}")


class OutputValidationError(Exception):
    """Raised when agent output fails validation."""
    pass
```

### 6.2 Data Freshness Tracking

```python
# backend/validation/freshness.py
"""Track data freshness and staleness"""

from datetime import datetime, timedelta
from typing import Dict
import re


class DataFreshnessTracker:
    """Track freshness of data sources."""

    # Patterns to detect date mentions in content
    DATE_PATTERNS = [
        r'(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},?\s+\d{4}',
        r'\d{1,2}/\d{1,2}/\d{4}',
        r'\d{4}-\d{2}-\d{2}',
        r'Q[1-4]\s+\d{4}',
        r'(?:FY|fiscal year)\s*\d{4}',
    ]

    def __init__(self):
        self._source_timestamps: Dict[str, datetime] = {}

    def extract_date_from_content(self, content: str) -> datetime | None:
        """Try to extract most recent date mentioned in content."""
        dates = []
        for pattern in self.DATE_PATTERNS:
            matches = re.findall(pattern, content, re.IGNORECASE)
            for match in matches:
                try:
                    # Parse various formats
                    parsed = self._parse_date(match)
                    if parsed:
                        dates.append(parsed)
                except:
                    continue

        return max(dates) if dates else None

    def _parse_date(self, date_str: str) -> datetime | None:
        """Parse date string to datetime."""
        from dateutil import parser
        try:
            return parser.parse(date_str)
        except:
            return None

    def assess_freshness(self, content: str) -> str:
        """Assess freshness of content.

        Returns: real-time, daily, weekly, monthly, or stale
        """
        date = self.extract_date_from_content(content)
        if not date:
            return "stale"  # Can't determine, assume stale

        age = datetime.utcnow() - date

        if age < timedelta(days=1):
            return "real-time"
        elif age < timedelta(days=7):
            return "daily"
        elif age < timedelta(days=30):
            return "weekly"
        elif age < timedelta(days=90):
            return "monthly"
        else:
            return "stale"
```

---

## 7. Testing Strategy

### 7.1 Test Pyramid

```
                    ┌─────────────────┐
                    │    E2E Tests    │  ← 10% (Critical paths only)
                    │   (Playwright)   │
                    └────────┬────────┘
                             │
              ┌──────────────┴──────────────┐
              │      Integration Tests       │  ← 30%
              │   (API + Agent + Services)   │
              └──────────────┬──────────────┘
                             │
       ┌─────────────────────┴─────────────────────┐
       │              Unit Tests                    │  ← 60%
       │  (Tools, Validation, Circuits, Utils)     │
       └───────────────────────────────────────────┘
```

### 7.2 Unit Tests

```python
# backend/tests/test_tools.py
"""Unit tests for tools"""

import pytest
from unittest.mock import patch, AsyncMock

from agent.tools import tavily_web_search, exa_web_search


class TestTavilySearch:
    """Tests for Tavily search tool."""

    @pytest.mark.asyncio
    async def test_returns_formatted_results(self):
        """Successful search returns formatted results."""
        with patch('tavily.TavilyClient') as mock:
            mock.return_value.search.return_value = {
                "results": [
                    {"title": "Test", "url": "https://example.com", "content": "Content"}
                ],
                "answer": "Summary"
            }

            result = tavily_web_search("test query")

            assert "Summary" in result
            assert "example.com" in result

    @pytest.mark.asyncio
    async def test_handles_api_error_gracefully(self):
        """API error returns error message, doesn't raise."""
        with patch('tavily.TavilyClient') as mock:
            mock.return_value.search.side_effect = Exception("API Error")

            result = tavily_web_search("test query")

            assert "unavailable" in result.lower() or "error" in result.lower()

    @pytest.mark.asyncio
    async def test_handles_missing_api_key(self):
        """Missing API key returns error message."""
        with patch.dict('os.environ', {}, clear=True):
            result = tavily_web_search("test query")

            assert "not configured" in result.lower()


class TestCircuitBreaker:
    """Tests for circuit breaker."""

    @pytest.mark.asyncio
    async def test_opens_after_threshold_failures(self):
        """Circuit opens after failure threshold."""
        from reliability.circuit_breaker import CircuitBreaker, CircuitOpenError

        circuit = CircuitBreaker("test", failure_threshold=3, recovery_timeout=60)

        async def failing_func():
            raise Exception("Fail")

        # Should allow 3 failures
        for i in range(3):
            with pytest.raises(Exception):
                await circuit.call(failing_func)

        # 4th call should be rejected (circuit open)
        with pytest.raises(CircuitOpenError):
            await circuit.call(failing_func)

    @pytest.mark.asyncio
    async def test_recovers_after_timeout(self):
        """Circuit recovers after timeout."""
        from reliability.circuit_breaker import CircuitBreaker, CircuitState
        from datetime import timedelta

        circuit = CircuitBreaker("test", failure_threshold=1, recovery_timeout=1)

        async def failing_func():
            raise Exception("Fail")

        async def success_func():
            return "OK"

        # Trigger open
        with pytest.raises(Exception):
            await circuit.call(failing_func)

        assert circuit.state == CircuitState.OPEN

        # Wait for recovery
        await asyncio.sleep(1.5)

        # Should be half-open
        assert circuit.state == CircuitState.HALF_OPEN

        # Success should close
        result = await circuit.call(success_func)
        assert result == "OK"
```

### 7.3 Integration Tests

```python
# backend/tests/test_integration.py
"""Integration tests for API and agent"""

import pytest
from httpx import AsyncClient
from main import app


@pytest.fixture
async def client():
    """Get test client."""
    async with AsyncClient(app=app, base_url="http://test") as client:
        yield client


class TestChatEndpoint:
    """Integration tests for /chat endpoint."""

    @pytest.mark.asyncio
    async def test_chat_returns_streaming_response(self, client):
        """Chat endpoint returns SSE stream."""
        response = await client.post(
            "/chat",
            json={"message": "What skills are in demand?"},
            headers={"Authorization": "Bearer test_token"}
        )

        assert response.status_code == 200
        assert "text/event-stream" in response.headers["content-type"]

    @pytest.mark.asyncio
    async def test_chat_requires_authentication(self, client):
        """Chat endpoint rejects unauthenticated requests."""
        response = await client.post(
            "/chat",
            json={"message": "test"}
        )

        assert response.status_code == 401

    @pytest.mark.asyncio
    async def test_chat_validates_message_length(self, client):
        """Chat endpoint rejects oversized messages."""
        long_message = "x" * 15000  # Over 10KB limit

        response = await client.post(
            "/chat",
            json={"message": long_message},
            headers={"Authorization": "Bearer test_token"}
        )

        assert response.status_code == 400


class TestAgentIntegration:
    """Integration tests for agent behavior."""

    @pytest.mark.asyncio
    async def test_agent_uses_subagents_for_complex_query(self, client):
        """Complex queries trigger subagent invocation."""
        response = await client.post(
            "/chat",
            json={"message": "Comprehensive analysis of AI engineer demand trends"},
            headers={"Authorization": "Bearer test_token"}
        )

        # Collect all events
        events = []
        async for line in response.aiter_lines():
            if line.startswith("data:"):
                events.append(json.loads(line[5:]))

        # Should have subagent invocations
        tool_starts = [e for e in events if e.get("type") == "tool_start"]
        task_calls = [t for t in tool_starts if t.get("name") == "task"]

        assert len(task_calls) >= 1, "Complex query should use subagents"
```

### 7.4 Load Tests

```python
# backend/tests/test_load.py
"""Load testing with locust"""

from locust import HttpUser, task, between
import json


class TDAUser(HttpUser):
    """Simulated TDA user for load testing."""

    wait_time = between(5, 15)  # Realistic think time

    def on_start(self):
        """Get auth token."""
        # In real test, get token from auth service
        self.token = "test_token"

    @task(3)
    def simple_query(self):
        """Simple talent demand query."""
        self.client.post(
            "/chat",
            json={"message": "What are the top skills for data engineers?"},
            headers={"Authorization": f"Bearer {self.token}"}
        )

    @task(1)
    def complex_query(self):
        """Complex research query (triggers subagents)."""
        self.client.post(
            "/chat",
            json={
                "message": "Comprehensive analysis of AI/ML engineer demand "
                          "including salary trends, skill requirements, and "
                          "geographic distribution"
            },
            headers={"Authorization": f"Bearer {self.token}"}
        )

    @task(2)
    def get_state(self):
        """Check thread state."""
        self.client.post(
            "/state",
            json={"thread_id": "test_thread"},
            headers={"Authorization": f"Bearer {self.token}"}
        )


# Run with: locust -f test_load.py --host=http://localhost:8000
# Target: 50 concurrent users, p99 < 30s
```

### 7.5 Chaos Tests

```python
# backend/tests/test_chaos.py
"""Chaos testing for resilience"""

import pytest
from unittest.mock import patch, AsyncMock
import asyncio


class TestChaosScenarios:
    """Test system behavior under failure conditions."""

    @pytest.mark.asyncio
    async def test_survives_tavily_outage(self):
        """System continues functioning when Tavily is down."""
        with patch('agent.tools.tavily_web_search') as mock:
            mock.side_effect = Exception("Tavily is down")

            # Agent should still respond (using Exa fallback)
            agent = create_talent_demand_analyst()
            result = await agent.ainvoke({
                "messages": [{"role": "user", "content": "test query"}]
            })

            # Should have response (may be degraded)
            assert len(result.get("messages", [])) > 1

    @pytest.mark.asyncio
    async def test_survives_all_search_outage(self):
        """System handles all search services being down."""
        with patch('agent.tools.tavily_web_search') as tavily_mock, \
             patch('agent.tools.exa_web_search') as exa_mock:

            tavily_mock.side_effect = Exception("Tavily down")
            exa_mock.side_effect = Exception("Exa down")

            agent = create_talent_demand_analyst()
            result = await agent.ainvoke({
                "messages": [{"role": "user", "content": "test query"}]
            })

            # Should gracefully report degraded status
            messages = result.get("messages", [])
            final_message = messages[-1].content if messages else ""
            assert "unavailable" in final_message.lower() or len(messages) > 1

    @pytest.mark.asyncio
    async def test_survives_partial_subagent_failure(self):
        """System continues when one subagent fails."""
        # Mock one subagent to fail
        with patch.object(
            agent._subagent_middleware,
            'run_subagent',
            side_effect=[
                Exception("Subagent 1 failed"),  # First fails
                "Result from subagent 2",        # Second succeeds
                "Result from subagent 3",        # Third succeeds
            ]
        ):
            result = await agent.ainvoke({
                "messages": [{"role": "user", "content": "comprehensive analysis"}]
            })

            # Should synthesize available results
            assert len(result.get("messages", [])) > 1

    @pytest.mark.asyncio
    async def test_handles_slow_responses(self):
        """System handles slow API responses."""
        async def slow_search(*args, **kwargs):
            await asyncio.sleep(25)  # Slow but not timeout
            return "Slow result"

        with patch('agent.tools.tavily_web_search', slow_search):
            start = asyncio.get_event_loop().time()

            result = await agent.ainvoke({
                "messages": [{"role": "user", "content": "test"}]
            })

            elapsed = asyncio.get_event_loop().time() - start

            # Should complete within timeout
            assert elapsed < TimeoutConfig.TOTAL_REQUEST_TIMEOUT
            assert len(result.get("messages", [])) > 1
```

---

## 8. Operational Runbooks

### Runbook 1: API Key Expired

```markdown
# RUNBOOK: API Key Expired

## Detection
- Alert: `TDASearchServiceDegraded` or `TDAHighErrorRate`
- Logs show: `401 Unauthorized` or `403 Forbidden` from external APIs
- Circuit breaker for Tavily/Exa is OPEN

## Severity
- Single service (Tavily OR Exa): P2 - Degraded
- Both services: P1 - Critical
- Anthropic: P1 - Critical (complete outage)

## Immediate Actions

### 1. Identify Failed Service
```bash
# Check which circuit is open
curl -s localhost:8000/metrics | grep tda_circuit_state

# Check recent errors
kubectl logs -l app=tda-backend --tail=100 | grep -i "401\|403\|unauthorized"
```

### 2. Verify Key Status
- Tavily: https://tavily.com/dashboard
- Exa: https://dashboard.exa.ai
- Anthropic: https://console.anthropic.com

### 3. Rotate Key
```bash
# Generate new key from provider dashboard

# Update in secrets manager
aws secretsmanager update-secret --secret-id tda/api-keys \
  --secret-string '{"TAVILY_API_KEY": "new_key"}'

# Or for Railway/Render:
railway variables set TAVILY_API_KEY=new_key
```

### 4. Restart Backend
```bash
# Kubernetes
kubectl rollout restart deployment/tda-backend

# Railway
railway redeploy

# Render
# Trigger via dashboard or webhook
```

### 5. Verify Recovery
```bash
# Check circuit closed
curl -s localhost:8000/metrics | grep tda_circuit_state

# Test search functionality
curl -X POST localhost:8000/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "test query"}'
```

## Prevention
- Set up key expiration alerts (30 days before)
- Implement automatic key rotation
- Monitor for 401/403 errors
```

### Runbook 2: High Error Rate

```markdown
# RUNBOOK: High Error Rate

## Detection
- Alert: `TDAHighErrorRate` (>2% over 5 min)
- Dashboard shows spike in 5xx responses

## Triage

### 1. Check Error Distribution
```bash
# Get error breakdown
curl -s localhost:8000/metrics | grep tda_errors_total

# Sample:
# tda_errors_total{error_type="timeout",source="tavily"} 45
# tda_errors_total{error_type="rate_limit",source="anthropic"} 12
# tda_errors_total{error_type="internal",source="agent"} 3
```

### 2. Identify Root Cause

**If external API errors dominate:**
- Check circuit breaker states
- Verify API key status
- Check provider status pages

**If internal errors dominate:**
- Check recent deployments
- Review logs for stack traces
- Check memory/CPU usage

**If timeout errors dominate:**
- Check latency metrics
- Verify external service latency
- Consider scaling up

### 3. Mitigation Actions

**Immediate:**
```bash
# If recent deploy, rollback
kubectl rollout undo deployment/tda-backend

# If load spike, scale up
kubectl scale deployment/tda-backend --replicas=5

# If external service issue, enable degraded mode
# (Feature flag to skip failing service)
```

**Investigation:**
```bash
# Get logs around error spike
kubectl logs -l app=tda-backend --since=30m | grep -i error

# Check for memory issues
kubectl top pods -l app=tda-backend
```

## Post-Incident
- Document root cause
- Add monitoring for specific error type
- Update runbook if new failure mode
```

### Runbook 3: Token Budget Exceeded

```markdown
# RUNBOOK: Token Budget Exceeded

## Detection
- Alert: `TDATokenBudgetExhausted`
- Cost dashboard shows spike

## Immediate Actions

### 1. Assess Severity
```bash
# Check current spend
curl -s localhost:8000/metrics | grep tda_token_cost

# Check spend rate
# High constant = legitimate traffic
# Sudden spike = possible abuse or bug
```

### 2. If Abuse Suspected
```bash
# Identify high-usage users/tenants
# (Custom query based on your logging)
grep "tokens_consumed" logs | sort | uniq -c | sort -rn | head -20

# Block abusive tenant
# (Via rate limiting or manual ban)
```

### 3. If Legitimate Traffic
- Increase budget temporarily
- Notify stakeholders
- Plan capacity increase

### 4. Emergency Cost Control
```bash
# Enable request throttling
# (Feature flag to reduce requests per user)

# Or enable cheaper model fallback
# (Feature flag to use Haiku instead of Sonnet)
```

## Prevention
- Set up daily budget alerts at 50%, 75%, 90%
- Implement per-user token quotas
- Monitor token-per-request ratio for anomalies
```

---

## 9. Architecture Decision Records

### ADR-001: deepagents Framework Selection

**Status**: Accepted

**Context**: Need to rebuild TDA after LangSmith Agent Builder infrastructure proved unreliable (~40-60% API failure rate).

**Decision**: Use `deepagents` open-source framework.

**Rationale**:
- Same architecture that powers Agent Builder internally
- Full control over infrastructure
- Built-in middleware for subagents, context management, filesystem
- LangGraph integration for streaming and persistence
- Active development by LangChain team

**Alternatives Considered**:
1. **Direct Claude API + custom orchestration**: More control but significant development effort for subagents, summarization, etc.
2. **LangGraph without deepagents**: Would need to reimplement middleware
3. **Other frameworks (CrewAI, AutoGen)**: Less mature, different paradigm

**Consequences**:
- Tied to LangChain ecosystem
- Must monitor for breaking changes in deepagents
- Learning curve for team

---

### ADR-002: Separate Python Backend

**Status**: Accepted

**Context**: Current Next.js frontend proxies to LangSmith. Need to decide architecture for self-hosted agent.

**Decision**: Separate Python FastAPI backend.

**Rationale**:
- Clean separation of concerns
- Python ecosystem for AI/ML tools
- Can scale frontend and backend independently
- Easier to add other clients later (mobile, API-only)

**Alternatives Considered**:
1. **Vercel AI SDK in Next.js**: Single deployment but loses deepagents features
2. **Python in monorepo with Next.js**: Complex deployment
3. **LangGraph Cloud**: Simpler but ties to LangChain infra

**Consequences**:
- Two deployments to manage
- Need CORS configuration
- Slight latency overhead from extra hop

---

### ADR-003: MemorySaver for Conversation Persistence

**Status**: Accepted (for MVP), to be revisited

**Context**: Need conversation persistence across messages within a session.

**Decision**: Use LangGraph `MemorySaver` (in-memory checkpointer) initially.

**Rationale**:
- Simplest option for MVP
- No external dependencies
- Sufficient for single-instance deployment
- Can migrate to persistent store later

**Alternatives Considered**:
1. **PostgresCheckpointer**: Persistent but requires database setup
2. **Redis checkpointer**: Fast but adds infrastructure
3. **SQLite**: Simple but not suitable for distributed deployment

**Consequences**:
- Conversations lost on restart
- Not suitable for horizontal scaling
- **Must migrate to persistent storage before production scale**

**Follow-up**: ADR-003.1 will address persistent storage selection.

---

## 10. Implementation Phases

### Phase 0: Critical (Blocking Production) - 2-3 weeks

| Week | Focus | Deliverables |
|------|-------|--------------|
| 1 | Security | JWT auth, rate limiting, input validation, security headers |
| 1 | Reliability | Circuit breakers, retry logic, timeout management |
| 2 | Observability | Structured logging, Prometheus metrics, alert definitions |
| 2 | Operations | 5 critical runbooks, health checks, graceful shutdown |

### Phase 1: Important (Pre-Production) - 1-2 weeks

| Week | Focus | Deliverables |
|------|-------|--------------|
| 3 | Scalability | Redis caching, connection pooling, concurrency limits |
| 3 | Testing | Load tests (50 concurrent, p99 < 30s), chaos tests |
| 4 | Data Quality | Output validation, freshness tracking |

### Phase 2: Refinement (Post-Launch) - 1 week

| Week | Focus | Deliverables |
|------|-------|--------------|
| 5 | Documentation | OpenAPI spec, remaining ADRs, tuning guides |
| 5 | Optimization | Performance profiling, cost optimization |

---

## Appendix: File Structure for Production Code

```
backend/
├── main.py                      # FastAPI entry point
├── pyproject.toml
├── Dockerfile
│
├── agent/
│   ├── __init__.py
│   ├── agent.py                 # create_talent_demand_analyst()
│   ├── tools.py                 # Tool implementations
│   ├── prompts.py               # System prompts
│   └── subagents.py             # Subagent definitions
│
├── security/
│   ├── __init__.py
│   ├── auth.py                  # JWT authentication
│   ├── validation.py            # Input validation
│   ├── rate_limit.py            # Rate limiting
│   └── headers.py               # Security headers
│
├── reliability/
│   ├── __init__.py
│   ├── circuit_breaker.py       # Circuit breaker implementation
│   ├── retry.py                 # Retry with backoff
│   ├── degradation.py           # Fallback chains
│   └── timeouts.py              # Timeout configuration
│
├── observability/
│   ├── __init__.py
│   ├── logging.py               # Structured logging
│   ├── metrics.py               # Prometheus metrics
│   └── tracing.py               # OpenTelemetry tracing
│
├── cache/
│   ├── __init__.py
│   └── redis_cache.py           # Redis caching
│
├── validation/
│   ├── __init__.py
│   ├── output.py                # Output validation schemas
│   └── freshness.py             # Data freshness tracking
│
├── http/
│   ├── __init__.py
│   └── client.py                # HTTP client pooling
│
├── concurrency/
│   ├── __init__.py
│   └── limits.py                # Concurrency limiting
│
├── tests/
│   ├── __init__.py
│   ├── test_tools.py            # Unit tests
│   ├── test_integration.py      # Integration tests
│   ├── test_load.py             # Load tests (locust)
│   └── test_chaos.py            # Chaos tests
│
└── runbooks/
    ├── api_key_expired.md
    ├── high_error_rate.md
    └── token_budget_exceeded.md
```

---

*Document Version: 1.0*
*Created: January 21, 2026*
*Status: Ready for External Review*
