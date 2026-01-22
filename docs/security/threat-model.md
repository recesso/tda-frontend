# Security Threat Model

> **Document Status:** Active
> **Version:** 1.0
> **Last Updated:** 2025-01-21
> **Purpose:** STRIDE-based threat analysis and security controls

---

## 1. Overview

This document provides a comprehensive security threat model for the Talent Demand Analyst system using the STRIDE methodology:

- **S**poofing - Identity/authentication attacks
- **T**ampering - Data integrity attacks
- **R**epudiation - Accountability attacks
- **I**nformation Disclosure - Confidentiality attacks
- **D**enial of Service - Availability attacks
- **E**levation of Privilege - Authorization attacks

---

## 2. System Components and Trust Boundaries

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         INTERNET (Untrusted)                                │
│  ┌─────────────┐                                                            │
│  │   Browser   │ ◄──── End User                                            │
│  └──────┬──────┘                                                            │
└─────────┼───────────────────────────────────────────────────────────────────┘
          │ HTTPS (TLS 1.3)
          │
══════════╪═══════════════════════════════════════════════ TRUST BOUNDARY 1 ══
          │
┌─────────┼───────────────────────────────────────────────────────────────────┐
│         ▼                    FRONTEND (Vercel Edge)                         │
│  ┌─────────────┐                                                            │
│  │  Next.js    │  - Static assets                                           │
│  │  Application│  - API proxy                                               │
│  └──────┬──────┘  - No secrets stored                                       │
└─────────┼───────────────────────────────────────────────────────────────────┘
          │ HTTPS
          │
══════════╪═══════════════════════════════════════════════ TRUST BOUNDARY 2 ══
          │
┌─────────┼───────────────────────────────────────────────────────────────────┐
│         ▼                    BACKEND (Railway)                              │
│  ┌─────────────┐                                                            │
│  │  FastAPI    │  - Request validation                                      │
│  │  Server     │  - Rate limiting                                           │
│  │             │  - API key storage                                         │
│  └──────┬──────┘                                                            │
│         │                                                                   │
│  ┌──────┴──────┐                                                            │
│  │   Agent     │  - LLM orchestration                                       │
│  │   System    │  - Tool invocation                                         │
│  └──────┬──────┘                                                            │
└─────────┼───────────────────────────────────────────────────────────────────┘
          │ HTTPS
          │
══════════╪═══════════════════════════════════════════════ TRUST BOUNDARY 3 ══
          │
┌─────────┼───────────────────────────────────────────────────────────────────┐
│         ▼                    EXTERNAL APIs                                  │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐                                     │
│  │Anthropic│  │ Tavily  │  │   Exa   │                                     │
│  │  Claude │  │ Search  │  │ Search  │                                     │
│  └─────────┘  └─────────┘  └─────────┘                                     │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Asset Inventory

| Asset | Classification | Owner | Location |
|-------|----------------|-------|----------|
| API Keys (Anthropic, Tavily, Exa) | Secret | Backend | Railway env vars |
| User Queries | Internal | User | In-memory only |
| LLM Responses | Internal | System | Transient (streamed) |
| Source URLs | Public | External | Transient |
| Application Code | Confidential | Dev Team | GitHub (private) |
| Logs | Internal | Ops Team | Railway/LangSmith |

---

## 4. STRIDE Threat Analysis

### 4.1 Spoofing (Identity)

| ID | Threat | Component | Risk | Mitigation | Status |
|----|--------|-----------|------|------------|--------|
| S-1 | Attacker impersonates legitimate user | Frontend | Low | No auth in MVP; rate limiting by IP | Accepted |
| S-2 | MITM attack intercepts requests | Network | Medium | TLS 1.3 enforced, HSTS headers | Mitigated |
| S-3 | Attacker spoofs backend API | Frontend | Medium | Vercel rewrites to known backend URL | Mitigated |
| S-4 | Leaked API key used maliciously | External APIs | High | Key rotation, usage monitoring, separate keys per env | Mitigated |

**Recommended Controls:**
```python
# Verify request origin
@app.middleware("http")
async def verify_origin(request: Request, call_next):
    origin = request.headers.get("origin")
    allowed_origins = ["https://tda.vercel.app", "http://localhost:3000"]
    if origin and origin not in allowed_origins:
        return JSONResponse(status_code=403, content={"error": "Invalid origin"})
    return await call_next(request)
```

### 4.2 Tampering (Integrity)

| ID | Threat | Component | Risk | Mitigation | Status |
|----|--------|-----------|------|------------|--------|
| T-1 | Malicious query injection | Backend | High | Input validation, sanitization | Mitigated |
| T-2 | Prompt injection attack | Agent System | High | Prompt hardening, output validation | Mitigated |
| T-3 | Response manipulation in transit | Network | Low | TLS encryption | Mitigated |
| T-4 | Code tampering in deployment | CI/CD | Medium | Branch protection, signed commits | Partial |

**Prompt Injection Defenses:**
```python
# app/agents/security.py

INJECTION_PATTERNS = [
    r"ignore (previous|prior|above) instructions",
    r"disregard (your|the) (system|initial) prompt",
    r"you are now",
    r"new instructions:",
    r"<<<.*>>>",  # Common injection delimiters
]

def sanitize_user_input(query: str) -> str:
    """Sanitize user input to prevent prompt injection."""
    # Check for injection patterns
    for pattern in INJECTION_PATTERNS:
        if re.search(pattern, query, re.IGNORECASE):
            raise ValueError("Query contains potentially malicious content")

    # Normalize whitespace
    query = " ".join(query.split())

    # Escape special characters
    query = query.replace("<", "&lt;").replace(">", "&gt;")

    return query

def validate_llm_output(response: str) -> str:
    """Validate LLM output before returning to user."""
    # Check for sensitive data leakage
    if re.search(r"sk-ant-|tvly-|exa-", response):
        raise SecurityError("Response contains potential API key")

    # Check for instruction leakage
    if "system prompt" in response.lower() or "you are a" in response.lower():
        logger.warning("Potential instruction leakage detected")

    return response
```

### 4.3 Repudiation (Accountability)

| ID | Threat | Component | Risk | Mitigation | Status |
|----|--------|-----------|------|------------|--------|
| R-1 | User denies making query | Logging | Low | Request logging with timestamps | Mitigated |
| R-2 | Attacker covers tracks | Logs | Medium | Append-only logs, external sink | Partial |
| R-3 | Malicious admin modifies logs | Ops | Low | Role separation, audit trail | Planned |

**Audit Logging:**
```python
# app/observability/audit.py
import hashlib
from datetime import datetime

def create_audit_log(request_id: str, action: str, details: dict) -> dict:
    """Create tamper-evident audit log entry."""
    timestamp = datetime.utcnow().isoformat()
    payload = f"{timestamp}|{request_id}|{action}|{json.dumps(details)}"
    signature = hashlib.sha256(payload.encode()).hexdigest()

    return {
        "timestamp": timestamp,
        "request_id": request_id,
        "action": action,
        "details": details,
        "signature": signature
    }
```

### 4.4 Information Disclosure (Confidentiality)

| ID | Threat | Component | Risk | Mitigation | Status |
|----|--------|-----------|------|------------|--------|
| I-1 | API keys exposed in logs | Logging | High | Scrub secrets from logs | Mitigated |
| I-2 | Stack traces leak internals | Error handling | Medium | Generic error messages to users | Mitigated |
| I-3 | LLM reveals system prompts | Agent System | Medium | Output validation | Mitigated |
| I-4 | User queries logged with PII | Logging | Medium | No PII in standard queries; redaction | Partial |
| I-5 | Source code exposed | GitHub | High | Private repo, access controls | Mitigated |

**Secret Scrubbing:**
```python
# app/observability/scrubbing.py
import re

SECRET_PATTERNS = [
    (r"sk-ant-[a-zA-Z0-9-]+", "[ANTHROPIC_KEY_REDACTED]"),
    (r"tvly-[a-zA-Z0-9]+", "[TAVILY_KEY_REDACTED]"),
    (r"exa-[a-zA-Z0-9]+", "[EXA_KEY_REDACTED]"),
    (r"ls-[a-zA-Z0-9]+", "[LANGSMITH_KEY_REDACTED]"),
    (r"Bearer [a-zA-Z0-9-._~+/]+=*", "[BEARER_TOKEN_REDACTED]"),
]

def scrub_secrets(text: str) -> str:
    """Remove sensitive data from text before logging."""
    for pattern, replacement in SECRET_PATTERNS:
        text = re.sub(pattern, replacement, text)
    return text
```

### 4.5 Denial of Service (Availability)

| ID | Threat | Component | Risk | Mitigation | Status |
|----|--------|-----------|------|------------|--------|
| D-1 | Request flooding | Backend | High | Rate limiting (20/min per IP) | Mitigated |
| D-2 | Expensive query attacks | Agent System | High | Token budget, timeouts | Mitigated |
| D-3 | SSE connection exhaustion | Backend | Medium | Connection limits, timeouts | Partial |
| D-4 | External API exhaustion | External | Medium | Circuit breakers, quotas | Mitigated |
| D-5 | Regex DoS (ReDoS) | Input validation | Low | Safe regex patterns, timeouts | Mitigated |

**Rate Limiting Implementation:**
```python
# app/middleware/rate_limit.py
from collections import defaultdict
from time import time
from fastapi import HTTPException

class RateLimiter:
    def __init__(self, requests_per_minute: int = 20):
        self.requests_per_minute = requests_per_minute
        self.requests = defaultdict(list)

    def check(self, client_ip: str) -> bool:
        now = time()
        minute_ago = now - 60

        # Clean old requests
        self.requests[client_ip] = [
            t for t in self.requests[client_ip] if t > minute_ago
        ]

        if len(self.requests[client_ip]) >= self.requests_per_minute:
            return False

        self.requests[client_ip].append(now)
        return True

rate_limiter = RateLimiter()

@app.middleware("http")
async def rate_limit_middleware(request: Request, call_next):
    client_ip = request.client.host
    if not rate_limiter.check(client_ip):
        raise HTTPException(
            status_code=429,
            detail={"error": "Rate limit exceeded", "retry_after": 60}
        )
    return await call_next(request)
```

### 4.6 Elevation of Privilege (Authorization)

| ID | Threat | Component | Risk | Mitigation | Status |
|----|--------|-----------|------|------------|--------|
| E-1 | Access admin endpoints | Backend | Low | No admin endpoints in MVP | N/A |
| E-2 | Escape container sandbox | Infrastructure | Low | Railway managed security | Mitigated |
| E-3 | Agent executes unintended tools | Agent System | Medium | Explicit tool allowlist | Mitigated |
| E-4 | SSRF via URL reader | Tools | High | URL allowlist, no internal access | Mitigated |

**SSRF Prevention:**
```python
# app/tools/url_reader.py
from urllib.parse import urlparse
import ipaddress

BLOCKED_HOSTS = [
    "localhost", "127.0.0.1", "0.0.0.0",
    "169.254.169.254",  # AWS metadata
    "metadata.google.internal",  # GCP metadata
]

BLOCKED_SCHEMES = ["file", "ftp", "gopher"]

def validate_url(url: str) -> bool:
    """Validate URL is safe to fetch."""
    parsed = urlparse(url)

    # Check scheme
    if parsed.scheme not in ["http", "https"]:
        raise ValueError(f"Invalid scheme: {parsed.scheme}")

    # Check host
    hostname = parsed.hostname.lower()

    # Block internal hosts
    if hostname in BLOCKED_HOSTS:
        raise ValueError(f"Blocked host: {hostname}")

    # Block private IP ranges
    try:
        ip = ipaddress.ip_address(hostname)
        if ip.is_private or ip.is_loopback or ip.is_link_local:
            raise ValueError(f"Private IP not allowed: {ip}")
    except ValueError:
        pass  # Not an IP, hostname is fine

    return True
```

---

## 5. Threat Matrix Summary

| Category | Critical | High | Medium | Low | Mitigated | Partial | Planned |
|----------|----------|------|--------|-----|-----------|---------|---------|
| Spoofing | 0 | 1 | 2 | 1 | 3 | 0 | 1 |
| Tampering | 0 | 2 | 1 | 1 | 3 | 1 | 0 |
| Repudiation | 0 | 0 | 1 | 2 | 1 | 1 | 1 |
| Info Disclosure | 0 | 2 | 2 | 0 | 3 | 1 | 0 |
| Denial of Service | 0 | 2 | 2 | 1 | 4 | 1 | 0 |
| Elev. of Privilege | 0 | 1 | 1 | 1 | 2 | 0 | 1 |
| **Total** | **0** | **8** | **9** | **6** | **16** | **4** | **3** |

---

## 6. Security Controls Checklist

### Pre-Deployment
- [ ] All API keys in environment variables only
- [ ] TLS enforced on all endpoints
- [ ] Rate limiting configured
- [ ] Input validation on all user inputs
- [ ] Output validation on LLM responses
- [ ] CORS configured for known origins only
- [ ] Security headers configured (X-Frame-Options, CSP, etc.)
- [ ] Dependency vulnerability scan passed
- [ ] Static code analysis (bandit) passed

### Post-Deployment
- [ ] Penetration testing completed
- [ ] API key rotation schedule established
- [ ] Monitoring and alerting configured
- [ ] Incident response plan documented
- [ ] Security logging to external sink

---

## 7. Incident Response

### Security Incident Severity Levels

| Level | Examples | Response Time | Escalation |
|-------|----------|---------------|------------|
| P1 - Critical | API key compromised, data breach | < 15 min | Immediate |
| P2 - High | Active attack, service compromise | < 1 hour | On-call + lead |
| P3 - Medium | Suspicious activity, failed attacks | < 4 hours | On-call |
| P4 - Low | Policy violation, minor issues | < 24 hours | Team channel |

### API Key Compromise Playbook

1. **Immediate (< 5 min)**
   - Rotate compromised key in provider dashboard
   - Update Railway/Vercel environment variables
   - Redeploy affected service

2. **Short-term (< 1 hour)**
   - Review logs for unauthorized usage
   - Assess impact (cost, data access)
   - Notify affected parties if required

3. **Post-incident**
   - Root cause analysis
   - Strengthen key management
   - Update rotation schedule

---

## 8. Related Documents

- [Error Handling Specification](../design/error-handling-specification.md)
- [TRD - OWASP Mapping](../requirements/2025-01-21-talent-demand-analyst-trd.md#65-owasp-top-10-mapping)
- [Runbook: API Key Rotation](../runbooks/maintenance/rotate-api-keys.md)

---

*Security Threat Model - Part of deployment infrastructure layer*
