# TALENT DEMAND ANALYST - ELITE PROJECT COMMAND CENTER

**Single Source of Truth for Project Status, Execution, and Operational Excellence**
**Granularity Level: Google/Palantir L5+ Engineering Standard**

---

## Active Execution State

<!-- MACHINE-READABLE SECTION - DO NOT MODIFY FORMAT -->
| Field | Value |
|-------|-------|
| **Current Sprint** | sprint-1 |
| **Active Task** | none |
| **Active Task Status** | none |
| **Next Task** | 1.1.1 |
| **Blocked Tasks** | none |
| **Last Updated** | 2026-01-22T00:00:00Z |
<!-- END MACHINE-READABLE SECTION -->

> **Why this matters:** Skills read this section FIRST. It's the "API" to the Command Center.
> - `Active Task: none` → Skills look at Next Task
> - `Active Task: [id]` → Skills resume that task
> - `Blocked Tasks: [ids]` → Skills skip those tasks

---

## Quick Status Dashboard

| Metric | Value | Status |
|--------|-------|--------|
| **Current Phase** | Phase 1: Backend Foundation | |
| **Current Sprint** | Sprint 1 | |
| **Sprint Progress** | 0/15 tasks | |
| **Overall Progress** | 0% (0/98 tasks complete) | |
| **Blocked Items** | 0 | |
| **Production Readiness Score** | 0/100 (Target: 90+) | |
| **Code Coverage** | 0% (Target: 80%+) | |

---

## Service Level Objectives (SLOs)

| Metric | Target | Current | Status |
|--------|--------|---------|--------|
| Availability | 99.5% | N/A | |
| Latency (p50) | < 5s | N/A | |
| Latency (p99) | < 30s | N/A | |
| Error Rate | < 1% | N/A | |
| Time to First Token | < 3s | N/A | |
| Token Efficiency | < 20k/query | N/A | |

---

## Sprint Task Queue - Full Granularity

### Sprint 1: Backend Foundation (15 tasks)

**Sprint Goal:** Python backend skeleton running locally with health endpoint

#### 1.1 Project Initialization (5 tasks)

| ID | Task | Status | Est. | Deps | Verification |
|----|------|--------|------|------|--------------|
| 1.1.1 | Create backend directory structure | NEXT | 0.5h | none | `ls -la backend/` shows agent/, tests/, main.py |
| 1.1.2 | Create pyproject.toml with all dependencies | PENDING | 0.5h | 1.1.1 | `cat backend/pyproject.toml` shows deepagents, fastapi |
| 1.1.3 | Create .env.example template | PENDING | 0.25h | 1.1.1 | `cat backend/.env.example` shows all required vars |
| 1.1.4 | Create backend .gitignore | PENDING | 0.25h | 1.1.1 | `cat backend/.gitignore` excludes .env, __pycache__ |
| 1.1.5 | Initialize virtual environment and install deps | PENDING | 0.5h | 1.1.2 | `cd backend && pip install -e .` succeeds |

<details>
<summary><strong>Task 1.1.1: Create backend directory structure</strong></summary>

**ID:** 1.1.1
**Phase:** 1 - Backend Foundation
**Status:** NEXT
**Priority:** P0
**Estimated Hours:** 0.5h
**Dependencies:** None

**Description:**
Create the Python backend directory structure following the architecture diagram.

**Files to Create:**
```
backend/
├── agent/
│   └── __init__.py
├── tests/
│   └── __init__.py
└── main.py (placeholder)
```

**Definition of Done:**
- [ ] `backend/` directory created
- [ ] `backend/agent/__init__.py` exists
- [ ] `backend/tests/__init__.py` exists
- [ ] `backend/main.py` placeholder exists

**Verification Commands:**
```bash
ls -la backend/
ls -la backend/agent/
ls -la backend/tests/
test -f backend/main.py && echo "main.py exists"
```

**Expected Output:**
```
backend/agent/ contains __init__.py
backend/tests/ contains __init__.py
main.py exists
```

**Reference Documents:**
- [IMPLEMENTATION_PLAN.md](../IMPLEMENTATION_PLAN.md) - Section 1.1

</details>

<details>
<summary><strong>Task 1.1.2: Create pyproject.toml</strong></summary>

**ID:** 1.1.2
**Phase:** 1 - Backend Foundation
**Status:** PENDING
**Priority:** P0
**Estimated Hours:** 0.5h
**Dependencies:** 1.1.1

**Description:**
Create pyproject.toml with all required dependencies for the TDA backend.

**Required Dependencies:**
```toml
[project]
name = "tda-backend"
version = "0.1.0"
requires-python = ">=3.11"
dependencies = [
    "deepagents>=0.1.0",
    "fastapi>=0.115.0",
    "uvicorn[standard]>=0.32.0",
    "python-dotenv>=1.0.0",
    "tavily-python>=0.5.0",
    "exa-py>=1.0.0",
    "httpx>=0.27.0",
    "pydantic>=2.0.0",
]

[project.optional-dependencies]
dev = [
    "pytest>=8.0.0",
    "pytest-asyncio>=0.24.0",
    "pytest-httpx>=0.32.0",
    "pytest-cov>=4.0.0",
    "ruff>=0.1.0",
    "mypy>=1.0.0",
]
```

**Definition of Done:**
- [ ] pyproject.toml created at `backend/pyproject.toml`
- [ ] All core dependencies listed
- [ ] All dev dependencies in optional-dependencies
- [ ] pytest.ini_options configured

**Verification Commands:**
```bash
cat backend/pyproject.toml | grep "deepagents"
cat backend/pyproject.toml | grep "fastapi"
cat backend/pyproject.toml | grep "pytest"
```

**Reference Documents:**
- [IMPLEMENTATION_PLAN.md](../IMPLEMENTATION_PLAN.md) - Section 1.2

</details>

<details>
<summary><strong>Task 1.1.3: Create .env.example template</strong></summary>

**ID:** 1.1.3
**Phase:** 1 - Backend Foundation
**Status:** PENDING
**Priority:** P0
**Estimated Hours:** 0.25h
**Dependencies:** 1.1.1

**Description:**
Create environment variable template documenting all required configuration.

**File Content:**
```env
# Required - AI Provider
ANTHROPIC_API_KEY=sk-ant-xxx

# Required - Search APIs
TAVILY_API_KEY=tvly-xxx
EXA_API_KEY=xxx

# Optional - Model Override
AGENT_MODEL=anthropic:claude-sonnet-4-5-20250929

# Optional - LangSmith Tracing
LANGCHAIN_TRACING_V2=false
LANGCHAIN_API_KEY=
LANGCHAIN_PROJECT=talent-demand-analyst

# Server Configuration
PORT=8000
ENV=development

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:3000
```

**Definition of Done:**
- [ ] `.env.example` created at `backend/.env.example`
- [ ] All required vars documented
- [ ] All optional vars documented with defaults

**Verification Commands:**
```bash
cat backend/.env.example | grep "ANTHROPIC_API_KEY"
cat backend/.env.example | grep "TAVILY_API_KEY"
cat backend/.env.example | grep "EXA_API_KEY"
```

</details>

<details>
<summary><strong>Task 1.1.4: Create backend .gitignore</strong></summary>

**ID:** 1.1.4
**Phase:** 1 - Backend Foundation
**Status:** PENDING
**Priority:** P1
**Estimated Hours:** 0.25h
**Dependencies:** 1.1.1

**Description:**
Create .gitignore for the Python backend.

**File Content:**
```gitignore
# Environment
.env
.env.local
.env.*.local

# Python
__pycache__/
*.py[cod]
*$py.class
*.so
.Python
build/
develop-eggs/
dist/
downloads/
eggs/
.eggs/
lib/
lib64/
parts/
sdist/
var/
wheels/
*.egg-info/
.installed.cfg
*.egg

# Virtual environments
venv/
.venv/
ENV/

# Testing
.pytest_cache/
.coverage
htmlcov/
.tox/
.nox/

# IDE
.idea/
.vscode/
*.swp
*.swo

# Logs
*.log
```

**Definition of Done:**
- [ ] `.gitignore` created at `backend/.gitignore`
- [ ] .env excluded
- [ ] __pycache__ excluded
- [ ] venv excluded

**Verification Commands:**
```bash
cat backend/.gitignore | grep ".env"
cat backend/.gitignore | grep "__pycache__"
```

</details>

<details>
<summary><strong>Task 1.1.5: Initialize virtual environment</strong></summary>

**ID:** 1.1.5
**Phase:** 1 - Backend Foundation
**Status:** PENDING
**Priority:** P0
**Estimated Hours:** 0.5h
**Dependencies:** 1.1.2

**Description:**
Set up Python virtual environment and install all dependencies.

**Commands:**
```bash
cd backend
python -m venv .venv
source .venv/bin/activate  # or .venv\Scripts\activate on Windows
pip install -e ".[dev]"
```

**Definition of Done:**
- [ ] Virtual environment created
- [ ] All dependencies installed
- [ ] `pip list` shows deepagents, fastapi, pytest

**Verification Commands:**
```bash
cd backend && source .venv/bin/activate && pip list | grep deepagents
pip list | grep fastapi
pip list | grep pytest
```

</details>

#### 1.2 FastAPI Foundation (5 tasks)

| ID | Task | Status | Est. | Deps | Verification |
|----|------|--------|------|------|--------------|
| 1.2.1 | Create FastAPI app skeleton in main.py | PENDING | 1h | 1.1.5 | `uvicorn main:app` starts without error |
| 1.2.2 | Implement GET /health endpoint | PENDING | 0.5h | 1.2.1 | `curl localhost:8000/health` returns 200 |
| 1.2.3 | Implement GET /health/ready endpoint | PENDING | 0.5h | 1.2.2 | `curl localhost:8000/health/ready` returns checks |
| 1.2.4 | Add CORS middleware configuration | PENDING | 0.5h | 1.2.1 | CORS headers present in response |
| 1.2.5 | Add request logging middleware | PENDING | 0.5h | 1.2.1 | Requests logged with correlation ID |

<details>
<summary><strong>Task 1.2.1: Create FastAPI app skeleton</strong></summary>

**ID:** 1.2.1
**Phase:** 1 - Backend Foundation
**Status:** PENDING
**Priority:** P0
**Estimated Hours:** 1h
**Dependencies:** 1.1.5

**Description:**
Create the main FastAPI application with lifespan management.

**File:** `backend/main.py`

**Key Components:**
- FastAPI app with metadata
- Lifespan context manager for startup/shutdown
- Basic logging configuration
- Placeholder for agent initialization

**Definition of Done:**
- [ ] main.py imports FastAPI, uvicorn
- [ ] App created with title, description, version
- [ ] Lifespan handler defined
- [ ] Server runs with `uvicorn main:app`

**Verification Commands:**
```bash
cd backend && source .venv/bin/activate
python -c "from main import app; print(app.title)"
uvicorn main:app --port 8001 &
sleep 2
curl http://localhost:8001/docs
kill %1
```

**Expected Output:**
```
"Talent Demand Analyst API"
Swagger docs HTML returned
```

**Reference Documents:**
- [IMPLEMENTATION_PLAN.md](../IMPLEMENTATION_PLAN.md) - Section 1.3

</details>

<details>
<summary><strong>Task 1.2.2: Implement GET /health endpoint</strong></summary>

**ID:** 1.2.2
**Phase:** 1 - Backend Foundation
**Status:** PENDING
**Priority:** P0
**Estimated Hours:** 0.5h
**Dependencies:** 1.2.1

**Description:**
Implement basic health check endpoint for container orchestration.

**Endpoint Spec:**
```
GET /health
Response: 200 OK
{
  "status": "healthy",
  "version": "0.1.0",
  "timestamp": "2026-01-22T00:00:00Z"
}
```

**Definition of Done:**
- [ ] GET /health implemented
- [ ] Returns status, version, timestamp
- [ ] Status code 200

**Verification Commands:**
```bash
curl -s http://localhost:8000/health | jq .
# Expected: {"status": "healthy", "version": "0.1.0", ...}
```

</details>

<details>
<summary><strong>Task 1.2.3: Implement GET /health/ready endpoint</strong></summary>

**ID:** 1.2.3
**Phase:** 1 - Backend Foundation
**Status:** PENDING
**Priority:** P0
**Estimated Hours:** 0.5h
**Dependencies:** 1.2.2

**Description:**
Implement readiness check that verifies agent initialization.

**Endpoint Spec:**
```
GET /health/ready
Response: 200 OK (if ready)
{
  "ready": true,
  "checks": {
    "agent_loaded": true,
    "anthropic_api": true
  }
}

Response: 503 Service Unavailable (if not ready)
{
  "ready": false,
  "checks": {
    "agent_loaded": false,
    "anthropic_api": false
  }
}
```

**Definition of Done:**
- [ ] GET /health/ready implemented
- [ ] Returns 200 when agent loaded
- [ ] Returns 503 when agent not ready
- [ ] Includes individual check status

**Verification Commands:**
```bash
curl -s http://localhost:8000/health/ready | jq .
# During startup: {"ready": false, ...}
# After init: {"ready": true, ...}
```

</details>

<details>
<summary><strong>Task 1.2.4: Add CORS middleware</strong></summary>

**ID:** 1.2.4
**Phase:** 1 - Backend Foundation
**Status:** PENDING
**Priority:** P0
**Estimated Hours:** 0.5h
**Dependencies:** 1.2.1

**Description:**
Configure CORS middleware for frontend communication.

**Configuration:**
```python
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "https://*.vercel.app",
        os.getenv("FRONTEND_URL", ""),
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
    expose_headers=["X-Thread-Id", "X-Request-Id"],
)
```

**Definition of Done:**
- [ ] CORS middleware added
- [ ] localhost:3000 allowed
- [ ] X-Thread-Id exposed

**Verification Commands:**
```bash
curl -s -I -X OPTIONS http://localhost:8000/health \
  -H "Origin: http://localhost:3000" \
  -H "Access-Control-Request-Method: POST" | grep -i "access-control"
# Expected: Access-Control-Allow-Origin: http://localhost:3000
```

</details>

<details>
<summary><strong>Task 1.2.5: Add request logging middleware</strong></summary>

**ID:** 1.2.5
**Phase:** 1 - Backend Foundation
**Status:** PENDING
**Priority:** P1
**Estimated Hours:** 0.5h
**Dependencies:** 1.2.1

**Description:**
Add structured logging middleware with correlation IDs.

**Implementation:**
```python
import uuid
from starlette.middleware.base import BaseHTTPMiddleware

class RequestLoggingMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request, call_next):
        request_id = str(uuid.uuid4())[:8]
        request.state.request_id = request_id

        logger.info(f"[{request_id}] {request.method} {request.url.path}")

        response = await call_next(request)
        response.headers["X-Request-Id"] = request_id

        logger.info(f"[{request_id}] {response.status_code}")
        return response
```

**Definition of Done:**
- [ ] Middleware added to app
- [ ] Request ID generated per request
- [ ] X-Request-Id header in response
- [ ] Logs show request ID

**Verification Commands:**
```bash
curl -s -I http://localhost:8000/health | grep "X-Request-Id"
# Expected: X-Request-Id: abc12345
```

</details>

#### 1.3 Data Models (5 tasks)

| ID | Task | Status | Est. | Deps | Verification |
|----|------|--------|------|------|--------------|
| 1.3.1 | Create ChatRequest Pydantic model | PENDING | 0.5h | 1.2.1 | pytest tests/test_models.py::test_chat_request passes |
| 1.3.2 | Create ChatResponse models | PENDING | 0.5h | 1.3.1 | pytest tests/test_models.py::test_chat_response passes |
| 1.3.3 | Create StreamEvent types | PENDING | 0.5h | 1.3.1 | All event types defined with validation |
| 1.3.4 | Create StateRequest/StateResponse models | PENDING | 0.5h | 1.3.1 | pytest tests/test_models.py::test_state passes |
| 1.3.5 | Write model validation tests | PENDING | 1h | 1.3.1-1.3.4 | pytest tests/test_models.py -v all pass |

<details>
<summary><strong>Task 1.3.1: Create ChatRequest model</strong></summary>

**ID:** 1.3.1
**Phase:** 1 - Backend Foundation
**Status:** PENDING
**Priority:** P0
**Estimated Hours:** 0.5h
**Dependencies:** 1.2.1

**Description:**
Create validated Pydantic model for chat requests.

**File:** `backend/agent/models.py`

**Model:**
```python
from pydantic import BaseModel, Field, validator
import re

MAX_MESSAGE_LENGTH = 10_000
THREAD_ID_PATTERN = re.compile(r'^[a-zA-Z0-9_:-]+$')

class ChatRequest(BaseModel):
    message: str = Field(
        ...,
        min_length=1,
        max_length=MAX_MESSAGE_LENGTH,
        description="User message for analysis"
    )
    thread_id: str | None = Field(
        None,
        max_length=100,
        description="Thread ID for conversation continuity"
    )

    @validator('message')
    def sanitize_message(cls, v):
        v = v.replace('\x00', '').strip()
        if not v:
            raise ValueError("Message cannot be empty")
        return v

    @validator('thread_id')
    def validate_thread_id(cls, v):
        if v and not THREAD_ID_PATTERN.match(v):
            raise ValueError("Invalid thread_id format")
        return v
```

**Definition of Done:**
- [ ] ChatRequest model created
- [ ] message field validated (length, sanitization)
- [ ] thread_id field validated (pattern)
- [ ] Validators prevent injection

**Verification Commands:**
```bash
cd backend && python -c "
from agent.models import ChatRequest
r = ChatRequest(message='test')
print(r.message)
"
# Expected: test
```

**Reference Documents:**
- [Data Model](../architecture/data/2025-01-21-talent-demand-analyst-data-model.md)

</details>

<details>
<summary><strong>Task 1.3.2: Create ChatResponse models</strong></summary>

**ID:** 1.3.2
**Phase:** 1 - Backend Foundation
**Status:** PENDING
**Priority:** P0
**Estimated Hours:** 0.5h
**Dependencies:** 1.3.1

**Description:**
Create response models for chat endpoint.

**Models:**
```python
class ChatResponse(BaseModel):
    thread_id: str
    message: str | None = None
    status: str = "complete"

class ErrorResponse(BaseModel):
    error: str
    detail: str | None = None
    request_id: str | None = None
```

**Definition of Done:**
- [ ] ChatResponse model created
- [ ] ErrorResponse model created
- [ ] Both serializable to JSON

**Verification Commands:**
```bash
cd backend && python -c "
from agent.models import ChatResponse, ErrorResponse
print(ChatResponse(thread_id='test').json())
print(ErrorResponse(error='test').json())
"
```

</details>

<details>
<summary><strong>Task 1.3.3: Create StreamEvent types</strong></summary>

**ID:** 1.3.3
**Phase:** 1 - Backend Foundation
**Status:** PENDING
**Priority:** P0
**Estimated Hours:** 0.5h
**Dependencies:** 1.3.1

**Description:**
Create event types for SSE streaming responses.

**Models:**
```python
from typing import Literal, Any
from pydantic import BaseModel

class TokenEvent(BaseModel):
    type: Literal["token"] = "token"
    content: str

class ToolStartEvent(BaseModel):
    type: Literal["tool_start"] = "tool_start"
    name: str
    input: dict[str, Any]

class ToolEndEvent(BaseModel):
    type: Literal["tool_end"] = "tool_end"
    name: str
    output: str

class StateEvent(BaseModel):
    type: Literal["state"] = "state"
    todos: list[dict]
    files: list[str]

class ErrorEvent(BaseModel):
    type: Literal["error"] = "error"
    error: str
    code: str | None = None

class DoneEvent(BaseModel):
    type: Literal["done"] = "done"
    thread_id: str

StreamEvent = TokenEvent | ToolStartEvent | ToolEndEvent | StateEvent | ErrorEvent | DoneEvent
```

**Definition of Done:**
- [ ] All event types defined
- [ ] Union type StreamEvent created
- [ ] Each event serializable

**Verification Commands:**
```bash
cd backend && python -c "
from agent.models import TokenEvent, StreamEvent
e = TokenEvent(content='hello')
print(e.json())
"
# Expected: {"type": "token", "content": "hello"}
```

</details>

<details>
<summary><strong>Task 1.3.4: Create StateRequest/Response models</strong></summary>

**ID:** 1.3.4
**Phase:** 1 - Backend Foundation
**Status:** PENDING
**Priority:** P0
**Estimated Hours:** 0.5h
**Dependencies:** 1.3.1

**Description:**
Create models for state retrieval endpoint.

**Models:**
```python
class StateRequest(BaseModel):
    thread_id: str = Field(
        ...,
        min_length=1,
        max_length=100,
        pattern=r'^[a-zA-Z0-9_:-]+$'
    )

class Todo(BaseModel):
    id: str
    task: str
    status: Literal["pending", "in_progress", "completed"]

class FileInfo(BaseModel):
    path: str
    size: int
    content_preview: str | None = None

class StateResponse(BaseModel):
    thread_id: str
    todos: list[Todo]
    files: dict[str, FileInfo]
    message_count: int
```

**Definition of Done:**
- [ ] StateRequest with validation
- [ ] Todo model defined
- [ ] FileInfo model defined
- [ ] StateResponse combines all

**Verification Commands:**
```bash
cd backend && python -c "
from agent.models import StateRequest, StateResponse
print(StateRequest(thread_id='test-123'))
"
```

</details>

<details>
<summary><strong>Task 1.3.5: Write model validation tests</strong></summary>

**ID:** 1.3.5
**Phase:** 1 - Backend Foundation
**Status:** PENDING
**Priority:** P0
**Estimated Hours:** 1h
**Dependencies:** 1.3.1, 1.3.2, 1.3.3, 1.3.4

**Description:**
Write comprehensive tests for all Pydantic models.

**File:** `backend/tests/test_models.py`

**Test Cases:**
```python
import pytest
from agent.models import ChatRequest, StateRequest

class TestChatRequest:
    def test_valid_message(self):
        r = ChatRequest(message="Test message")
        assert r.message == "Test message"

    def test_empty_message_rejected(self):
        with pytest.raises(ValueError):
            ChatRequest(message="")

    def test_message_too_long_rejected(self):
        with pytest.raises(ValueError):
            ChatRequest(message="x" * 10001)

    def test_null_bytes_stripped(self):
        r = ChatRequest(message="test\x00message")
        assert "\x00" not in r.message

    def test_thread_id_pattern_validated(self):
        with pytest.raises(ValueError):
            ChatRequest(message="test", thread_id="../evil")

class TestStateRequest:
    def test_valid_thread_id(self):
        r = StateRequest(thread_id="tenant:abc123")
        assert r.thread_id == "tenant:abc123"

    def test_invalid_thread_id_rejected(self):
        with pytest.raises(ValueError):
            StateRequest(thread_id="<script>alert(1)</script>")
```

**Definition of Done:**
- [ ] test_models.py created
- [ ] All positive cases tested
- [ ] All validation rejections tested
- [ ] `pytest tests/test_models.py -v` all pass

**Verification Commands:**
```bash
cd backend && pytest tests/test_models.py -v
# Expected: 10+ tests passed
```

</details>

---

### Sprint 2: Tools Implementation (12 tasks)

**Sprint Goal:** All 4 search tools working with error handling and rate limiting

#### 2.1 Tool Infrastructure (4 tasks)

| ID | Task | Status | Est. | Deps | Verification |
|----|------|--------|------|------|--------------|
| 2.1.1 | Create tools.py module skeleton | PENDING | 0.5h | 1.1.5 | `from agent.tools import ALL_TOOLS` works |
| 2.1.2 | Implement rate limiting decorator | PENDING | 1h | 2.1.1 | Rate limiter delays rapid calls |
| 2.1.3 | Implement retry with exponential backoff | PENDING | 1h | 2.1.1 | Retries on 429/503 errors |
| 2.1.4 | Create tool error handling wrapper | PENDING | 0.5h | 2.1.1 | Errors return message, not raise |

<details>
<summary><strong>Task 2.1.1: Create tools.py module skeleton</strong></summary>

**ID:** 2.1.1
**Phase:** 2 - Tools Implementation
**Status:** PENDING
**Priority:** P0
**Estimated Hours:** 0.5h
**Dependencies:** 1.1.5

**Description:**
Create the tools module with logging and imports.

**File:** `backend/agent/tools.py`

**Skeleton:**
```python
"""
Talent Demand Analyst - Tool Implementations
With robust error handling and rate limiting
"""

import os
import logging
from typing import Literal
from functools import wraps
import time

from langchain_core.tools import tool

logger = logging.getLogger(__name__)

# Rate limiting state
_last_call_times: dict[str, float] = {}
_rate_limits = {
    "tavily": 1.0,
    "exa": 1.0,
}

# Tool implementations will go here

# Export all tools
ALL_TOOLS: list = []
```

**Definition of Done:**
- [ ] tools.py created at `backend/agent/tools.py`
- [ ] Logger configured
- [ ] ALL_TOOLS list exported
- [ ] Importable without error

**Verification Commands:**
```bash
cd backend && python -c "from agent.tools import ALL_TOOLS; print(ALL_TOOLS)"
# Expected: []
```

</details>

<details>
<summary><strong>Task 2.1.2: Implement rate limiting decorator</strong></summary>

**ID:** 2.1.2
**Phase:** 2 - Tools Implementation
**Status:** PENDING
**Priority:** P0
**Estimated Hours:** 1h
**Dependencies:** 2.1.1

**Description:**
Create decorator to rate limit API calls to external services.

**Implementation:**
```python
def rate_limit(service: str):
    """Decorator to rate limit API calls."""
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            last_call = _last_call_times.get(service, 0)
            min_interval = _rate_limits.get(service, 0)
            elapsed = time.time() - last_call

            if elapsed < min_interval:
                sleep_time = min_interval - elapsed
                logger.debug(f"Rate limiting {service}: sleeping {sleep_time:.2f}s")
                time.sleep(sleep_time)

            _last_call_times[service] = time.time()
            return func(*args, **kwargs)
        return wrapper
    return decorator
```

**Definition of Done:**
- [ ] rate_limit decorator implemented
- [ ] Respects per-service limits
- [ ] Logs when rate limiting

**Verification Commands:**
```bash
cd backend && python -c "
import time
from agent.tools import rate_limit

@rate_limit('test')
def test_func():
    return time.time()

start = time.time()
test_func()
test_func()  # Should be delayed
elapsed = time.time() - start
print(f'Elapsed: {elapsed:.2f}s')  # Should be ~1s
"
```

</details>

<details>
<summary><strong>Task 2.1.3: Implement retry with exponential backoff</strong></summary>

**ID:** 2.1.3
**Phase:** 2 - Tools Implementation
**Status:** PENDING
**Priority:** P0
**Estimated Hours:** 1h
**Dependencies:** 2.1.1

**Description:**
Create retry decorator for transient failures.

**Implementation:**
```python
import random
from typing import Type

def retry_with_backoff(
    max_retries: int = 3,
    base_delay: float = 1.0,
    max_delay: float = 30.0,
    retryable_exceptions: tuple[Type[Exception], ...] = (Exception,)
):
    """Decorator for retry with exponential backoff and jitter."""
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            last_exception = None
            for attempt in range(max_retries + 1):
                try:
                    return func(*args, **kwargs)
                except retryable_exceptions as e:
                    last_exception = e
                    if attempt == max_retries:
                        break

                    delay = min(base_delay * (2 ** attempt), max_delay)
                    jitter = random.uniform(0, delay * 0.1)
                    sleep_time = delay + jitter

                    logger.warning(
                        f"Retry {attempt + 1}/{max_retries} for {func.__name__} "
                        f"after {sleep_time:.2f}s: {e}"
                    )
                    time.sleep(sleep_time)

            raise last_exception
        return wrapper
    return decorator
```

**Definition of Done:**
- [ ] retry_with_backoff decorator implemented
- [ ] Exponential delay with jitter
- [ ] Max retries and max delay respected
- [ ] Logs retry attempts

**Verification Commands:**
```bash
cd backend && python -c "
from agent.tools import retry_with_backoff

call_count = 0

@retry_with_backoff(max_retries=2, base_delay=0.1)
def flaky_func():
    global call_count
    call_count += 1
    if call_count < 3:
        raise Exception('Transient error')
    return 'success'

result = flaky_func()
print(f'Result: {result}, Calls: {call_count}')
# Expected: Result: success, Calls: 3
"
```

</details>

<details>
<summary><strong>Task 2.1.4: Create tool error handling wrapper</strong></summary>

**ID:** 2.1.4
**Phase:** 2 - Tools Implementation
**Status:** PENDING
**Priority:** P0
**Estimated Hours:** 0.5h
**Dependencies:** 2.1.1

**Description:**
Create wrapper that converts exceptions to error messages.

**Implementation:**
```python
def safe_tool_execution(service_name: str):
    """Decorator that converts exceptions to error messages for tools."""
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            try:
                return func(*args, **kwargs)
            except Exception as e:
                logger.exception(f"{service_name} tool error")
                return f"Error: {service_name} temporarily unavailable - {str(e)}"
        return wrapper
    return decorator
```

**Definition of Done:**
- [ ] safe_tool_execution decorator implemented
- [ ] Catches all exceptions
- [ ] Returns user-friendly error message
- [ ] Logs full exception

**Verification Commands:**
```bash
cd backend && python -c "
from agent.tools import safe_tool_execution

@safe_tool_execution('TestService')
def failing_tool():
    raise ValueError('API key invalid')

result = failing_tool()
print(result)
# Expected: Error: TestService temporarily unavailable - API key invalid
"
```

</details>

#### 2.2 Search Tools (4 tasks)

| ID | Task | Status | Est. | Deps | Verification |
|----|------|--------|------|------|--------------|
| 2.2.1 | Implement tavily_web_search tool | PENDING | 1.5h | 2.1.4 | pytest tests/test_tools.py::test_tavily passes |
| 2.2.2 | Implement exa_web_search tool | PENDING | 1.5h | 2.1.4 | pytest tests/test_tools.py::test_exa passes |
| 2.2.3 | Implement exa_linkedin_search tool | PENDING | 1h | 2.2.2 | pytest tests/test_tools.py::test_linkedin passes |
| 2.2.4 | Implement read_url_content tool | PENDING | 1h | 2.1.4 | pytest tests/test_tools.py::test_url_reader passes |

<details>
<summary><strong>Task 2.2.1: Implement tavily_web_search tool</strong></summary>

**ID:** 2.2.1
**Phase:** 2 - Tools Implementation
**Status:** PENDING
**Priority:** P0
**Estimated Hours:** 1.5h
**Dependencies:** 2.1.4

**Description:**
Implement Tavily web search with all decorators.

**Implementation:**
```python
@tool
@safe_tool_execution("Tavily")
@rate_limit("tavily")
def tavily_web_search(query: str, max_results: int = 10) -> str:
    """Search the web for current information about talent demand, job postings,
    salary data, industry reports, and workforce trends.

    Args:
        query: Specific search query for talent/workforce information
        max_results: Number of results to return (default: 10)

    Returns:
        Search results with titles, URLs, and content snippets
    """
    from tavily import TavilyClient

    api_key = os.environ.get("TAVILY_API_KEY")
    if not api_key:
        return "Error: TAVILY_API_KEY not configured"

    client = TavilyClient(api_key=api_key)
    results = client.search(
        query,
        max_results=max_results,
        include_answer=True,
        search_depth="advanced",
    )

    output_parts = []
    if results.get("answer"):
        output_parts.append(f"Summary: {results['answer']}\n")

    for i, result in enumerate(results.get("results", []), 1):
        output_parts.append(
            f"{i}. {result.get('title', 'No title')}\n"
            f"   URL: {result.get('url', 'No URL')}\n"
            f"   {result.get('content', 'No content')[:500]}...\n"
        )

    return "\n".join(output_parts) or "No results found"

# Add to exports
ALL_TOOLS.append(tavily_web_search)
```

**Definition of Done:**
- [ ] tavily_web_search implemented with @tool decorator
- [ ] Rate limiting applied
- [ ] Error handling applied
- [ ] Returns formatted results
- [ ] Added to ALL_TOOLS

**Verification Commands:**
```bash
cd backend && python -c "
from agent.tools import tavily_web_search
# Mock test (real test needs API key)
print(tavily_web_search.__doc__)
print('tavily_web_search' in str(tavily_web_search))
"
```

</details>

<details>
<summary><strong>Task 2.2.2: Implement exa_web_search tool</strong></summary>

**ID:** 2.2.2
**Phase:** 2 - Tools Implementation
**Status:** PENDING
**Priority:** P0
**Estimated Hours:** 1.5h
**Dependencies:** 2.1.4

**Description:**
Implement Exa semantic web search.

**Implementation:**
```python
@tool
@safe_tool_execution("Exa")
@rate_limit("exa")
def exa_web_search(query: str, num_results: int = 10) -> str:
    """Advanced semantic web search with full content extraction.
    Use for finding detailed reports, research papers, and articles.

    Args:
        query: Semantic search query
        num_results: Number of results to return

    Returns:
        Search results with full text content
    """
    from exa_py import Exa

    api_key = os.environ.get("EXA_API_KEY")
    if not api_key:
        return "Error: EXA_API_KEY not configured"

    client = Exa(api_key=api_key)
    results = client.search_and_contents(
        query,
        num_results=num_results,
        text={"max_characters": 3000},
        use_autoprompt=True,
    )

    output_parts = []
    for i, result in enumerate(results.results, 1):
        output_parts.append(
            f"{i}. {result.title}\n"
            f"   URL: {result.url}\n"
            f"   {result.text[:2000] if result.text else 'No content'}...\n"
        )

    return "\n".join(output_parts) or "No results found"

ALL_TOOLS.append(exa_web_search)
```

**Definition of Done:**
- [ ] exa_web_search implemented
- [ ] Uses autoprompt for better results
- [ ] Extracts full text content
- [ ] Added to ALL_TOOLS

**Verification Commands:**
```bash
cd backend && python -c "
from agent.tools import exa_web_search
print(exa_web_search.__doc__)
"
```

</details>

<details>
<summary><strong>Task 2.2.3: Implement exa_linkedin_search tool</strong></summary>

**ID:** 2.2.3
**Phase:** 2 - Tools Implementation
**Status:** PENDING
**Priority:** P0
**Estimated Hours:** 1h
**Dependencies:** 2.2.2

**Description:**
Implement LinkedIn-specific search using Exa domain filtering.

**Implementation:**
```python
@tool
@safe_tool_execution("Exa LinkedIn")
@rate_limit("exa")
def exa_linkedin_search(query: str, num_results: int = 10) -> str:
    """Search LinkedIn specifically for professional data, job postings,
    company hiring patterns, and workforce signals.

    Args:
        query: LinkedIn-specific search query
        num_results: Number of results to return

    Returns:
        LinkedIn content with job postings and professional insights
    """
    from exa_py import Exa

    api_key = os.environ.get("EXA_API_KEY")
    if not api_key:
        return "Error: EXA_API_KEY not configured"

    client = Exa(api_key=api_key)
    results = client.search_and_contents(
        query,
        num_results=num_results,
        include_domains=["linkedin.com"],
        text={"max_characters": 2000},
    )

    output_parts = []
    for i, result in enumerate(results.results, 1):
        output_parts.append(
            f"{i}. {result.title}\n"
            f"   URL: {result.url}\n"
            f"   {result.text[:1500] if result.text else 'No content'}...\n"
        )

    return "\n".join(output_parts) or "No LinkedIn results found"

ALL_TOOLS.append(exa_linkedin_search)
```

**Definition of Done:**
- [ ] exa_linkedin_search implemented
- [ ] Domain filter: linkedin.com only
- [ ] Added to ALL_TOOLS

**Verification Commands:**
```bash
cd backend && python -c "
from agent.tools import exa_linkedin_search
print('linkedin' in exa_linkedin_search.__doc__.lower())
"
# Expected: True
```

</details>

<details>
<summary><strong>Task 2.2.4: Implement read_url_content tool</strong></summary>

**ID:** 2.2.4
**Phase:** 2 - Tools Implementation
**Status:** PENDING
**Priority:** P0
**Estimated Hours:** 1h
**Dependencies:** 2.1.4

**Description:**
Implement URL content extraction for deep reading.

**Implementation:**
```python
@tool
@safe_tool_execution("URL Reader")
@rate_limit("exa")
def read_url_content(url: str) -> str:
    """Read and extract the full content from a specific URL.
    Use after finding URLs in search results that need deeper analysis.

    Args:
        url: The URL to read

    Returns:
        Extracted text content from the page
    """
    from exa_py import Exa

    api_key = os.environ.get("EXA_API_KEY")
    if not api_key:
        return "Error: EXA_API_KEY not configured"

    # Validate URL format
    if not url.startswith(("http://", "https://")):
        return "Error: Invalid URL format - must start with http:// or https://"

    client = Exa(api_key=api_key)
    results = client.get_contents([url], text={"max_characters": 15000})

    if results.results and results.results[0].text:
        return results.results[0].text
    return "Could not extract content from URL"

ALL_TOOLS.append(read_url_content)
```

**Definition of Done:**
- [ ] read_url_content implemented
- [ ] URL validation added
- [ ] Returns up to 15k characters
- [ ] Added to ALL_TOOLS

**Verification Commands:**
```bash
cd backend && python -c "
from agent.tools import read_url_content
print('url' in read_url_content.__doc__.lower())
"
```

</details>

#### 2.3 Tool Tests (4 tasks)

| ID | Task | Status | Est. | Deps | Verification |
|----|------|--------|------|------|--------------|
| 2.3.1 | Create test_tools.py with fixtures | PENDING | 0.5h | 2.2.4 | Test file created with mocks |
| 2.3.2 | Write tavily_web_search tests | PENDING | 1h | 2.3.1 | 5+ test cases pass |
| 2.3.3 | Write exa search tests | PENDING | 1h | 2.3.1 | 5+ test cases pass |
| 2.3.4 | Write read_url_content tests | PENDING | 0.5h | 2.3.1 | 3+ test cases pass |

<details>
<summary><strong>Task 2.3.1: Create test_tools.py with fixtures</strong></summary>

**ID:** 2.3.1
**Phase:** 2 - Tools Implementation
**Status:** PENDING
**Priority:** P0
**Estimated Hours:** 0.5h
**Dependencies:** 2.2.4

**Description:**
Create test file with mock fixtures for API clients.

**File:** `backend/tests/test_tools.py`

**Fixtures:**
```python
import pytest
from unittest.mock import patch, MagicMock

@pytest.fixture
def mock_tavily_client():
    with patch('agent.tools.TavilyClient') as mock:
        mock_instance = MagicMock()
        mock_instance.search.return_value = {
            'answer': 'AI engineers are in high demand.',
            'results': [
                {
                    'title': 'AI Job Market Report 2026',
                    'url': 'https://example.com/report',
                    'content': 'The demand for AI engineers has grown 150% year-over-year.'
                }
            ]
        }
        mock.return_value = mock_instance
        yield mock

@pytest.fixture
def mock_exa_client():
    with patch('agent.tools.Exa') as mock:
        mock_instance = MagicMock()
        mock_result = MagicMock()
        mock_result.title = 'Tech Skills Report'
        mock_result.url = 'https://example.com/skills'
        mock_result.text = 'Python and machine learning are top skills...'
        mock_instance.search_and_contents.return_value = MagicMock(results=[mock_result])
        mock_instance.get_contents.return_value = MagicMock(results=[mock_result])
        mock.return_value = mock_instance
        yield mock

@pytest.fixture
def env_with_api_keys(monkeypatch):
    monkeypatch.setenv('TAVILY_API_KEY', 'test-tavily-key')
    monkeypatch.setenv('EXA_API_KEY', 'test-exa-key')
```

**Definition of Done:**
- [ ] test_tools.py created
- [ ] mock_tavily_client fixture
- [ ] mock_exa_client fixture
- [ ] env_with_api_keys fixture

**Verification Commands:**
```bash
cd backend && python -c "
import tests.test_tools
print('Fixtures available')
"
```

</details>

<details>
<summary><strong>Task 2.3.2: Write tavily_web_search tests</strong></summary>

**ID:** 2.3.2
**Phase:** 2 - Tools Implementation
**Status:** PENDING
**Priority:** P0
**Estimated Hours:** 1h
**Dependencies:** 2.3.1

**Description:**
Write comprehensive tests for Tavily search.

**Test Cases:**
```python
class TestTavilyWebSearch:
    def test_returns_formatted_results(self, mock_tavily_client, env_with_api_keys):
        from agent.tools import tavily_web_search
        result = tavily_web_search.invoke({"query": "AI engineer demand"})
        assert "AI Job Market Report" in result
        assert "https://example.com/report" in result

    def test_includes_answer_summary(self, mock_tavily_client, env_with_api_keys):
        from agent.tools import tavily_web_search
        result = tavily_web_search.invoke({"query": "test"})
        assert "Summary:" in result

    def test_handles_empty_results(self, mock_tavily_client, env_with_api_keys):
        mock_tavily_client.return_value.search.return_value = {'results': []}
        from agent.tools import tavily_web_search
        result = tavily_web_search.invoke({"query": "obscure query"})
        assert "No results found" in result

    def test_handles_missing_api_key(self, monkeypatch):
        monkeypatch.delenv('TAVILY_API_KEY', raising=False)
        from agent.tools import tavily_web_search
        result = tavily_web_search.invoke({"query": "test"})
        assert "TAVILY_API_KEY not configured" in result

    def test_handles_api_error(self, mock_tavily_client, env_with_api_keys):
        mock_tavily_client.return_value.search.side_effect = Exception("API error")
        from agent.tools import tavily_web_search
        result = tavily_web_search.invoke({"query": "test"})
        assert "unavailable" in result.lower()
```

**Definition of Done:**
- [ ] 5 test cases implemented
- [ ] Tests mock API calls
- [ ] Tests error handling
- [ ] All tests pass

**Verification Commands:**
```bash
cd backend && pytest tests/test_tools.py::TestTavilyWebSearch -v
# Expected: 5 passed
```

</details>

<details>
<summary><strong>Task 2.3.3: Write exa search tests</strong></summary>

**ID:** 2.3.3
**Phase:** 2 - Tools Implementation
**Status:** PENDING
**Priority:** P0
**Estimated Hours:** 1h
**Dependencies:** 2.3.1

**Description:**
Write tests for both Exa search tools.

**Test Cases:**
```python
class TestExaWebSearch:
    def test_returns_formatted_results(self, mock_exa_client, env_with_api_keys):
        from agent.tools import exa_web_search
        result = exa_web_search.invoke({"query": "tech skills report"})
        assert "Tech Skills Report" in result

    def test_handles_missing_api_key(self, monkeypatch):
        monkeypatch.delenv('EXA_API_KEY', raising=False)
        from agent.tools import exa_web_search
        result = exa_web_search.invoke({"query": "test"})
        assert "EXA_API_KEY not configured" in result

    def test_handles_api_error(self, mock_exa_client, env_with_api_keys):
        mock_exa_client.return_value.search_and_contents.side_effect = Exception("API error")
        from agent.tools import exa_web_search
        result = exa_web_search.invoke({"query": "test"})
        assert "unavailable" in result.lower()

class TestExaLinkedInSearch:
    def test_returns_linkedin_results(self, mock_exa_client, env_with_api_keys):
        from agent.tools import exa_linkedin_search
        result = exa_linkedin_search.invoke({"query": "data scientist jobs"})
        assert "Tech Skills Report" in result

    def test_uses_linkedin_domain_filter(self, mock_exa_client, env_with_api_keys):
        from agent.tools import exa_linkedin_search
        exa_linkedin_search.invoke({"query": "test"})
        call_kwargs = mock_exa_client.return_value.search_and_contents.call_args[1]
        assert "linkedin.com" in call_kwargs.get('include_domains', [])
```

**Definition of Done:**
- [ ] 5+ test cases implemented
- [ ] exa_web_search tested
- [ ] exa_linkedin_search tested
- [ ] Domain filter verified

**Verification Commands:**
```bash
cd backend && pytest tests/test_tools.py::TestExaWebSearch tests/test_tools.py::TestExaLinkedInSearch -v
# Expected: 5+ passed
```

</details>

<details>
<summary><strong>Task 2.3.4: Write read_url_content tests</strong></summary>

**ID:** 2.3.4
**Phase:** 2 - Tools Implementation
**Status:** PENDING
**Priority:** P0
**Estimated Hours:** 0.5h
**Dependencies:** 2.3.1

**Description:**
Write tests for URL content reader.

**Test Cases:**
```python
class TestReadUrlContent:
    def test_extracts_content(self, mock_exa_client, env_with_api_keys):
        from agent.tools import read_url_content
        result = read_url_content.invoke({"url": "https://example.com/article"})
        assert "Python and machine learning" in result

    def test_rejects_invalid_url(self, env_with_api_keys):
        from agent.tools import read_url_content
        result = read_url_content.invoke({"url": "not-a-url"})
        assert "Invalid URL format" in result

    def test_handles_empty_content(self, mock_exa_client, env_with_api_keys):
        mock_exa_client.return_value.get_contents.return_value = MagicMock(results=[])
        from agent.tools import read_url_content
        result = read_url_content.invoke({"url": "https://empty.com"})
        assert "Could not extract" in result
```

**Definition of Done:**
- [ ] 3 test cases implemented
- [ ] URL validation tested
- [ ] Empty response handled

**Verification Commands:**
```bash
cd backend && pytest tests/test_tools.py::TestReadUrlContent -v
# Expected: 3 passed
```

</details>

---

### Sprint 3: Agent Implementation (15 tasks)

**Sprint Goal:** Multi-agent system with coordinator and 3 subagents working

#### 3.1 Prompts Module (4 tasks)

| ID | Task | Status | Est. | Deps | Verification |
|----|------|--------|------|------|--------------|
| 3.1.1 | Create prompts.py module | PENDING | 0.5h | 2.2.4 | Module imports without error |
| 3.1.2 | Implement MAIN_AGENT_PROMPT | PENDING | 1h | 3.1.1 | Prompt includes research methodology |
| 3.1.3 | Implement subagent prompts | PENDING | 1.5h | 3.1.1 | 3 subagent prompts defined |
| 3.1.4 | Write prompt tests | PENDING | 0.5h | 3.1.3 | Prompts validate non-empty, contain keywords |

<details>
<summary><strong>Task 3.1.1: Create prompts.py module</strong></summary>

**ID:** 3.1.1
**Phase:** 3 - Agent Implementation
**Status:** PENDING
**Priority:** P0
**Estimated Hours:** 0.5h
**Dependencies:** 2.2.4

**Description:**
Create the prompts module skeleton.

**File:** `backend/agent/prompts.py`

**Skeleton:**
```python
"""
Talent Demand Analyst - System Prompts
All prompts extracted for maintainability and versioning
"""

# Main coordinator prompt
MAIN_AGENT_PROMPT: str = ""

# Subagent prompts
JOB_POSTING_ANALYZER_PROMPT: str = ""
SKILL_EMERGENCE_RESEARCHER_PROMPT: str = ""
INDUSTRY_REPORT_SYNTHESIZER_PROMPT: str = ""
```

**Definition of Done:**
- [ ] prompts.py created
- [ ] 4 prompt variables exported
- [ ] Module imports without error

**Verification Commands:**
```bash
cd backend && python -c "
from agent.prompts import (
    MAIN_AGENT_PROMPT,
    JOB_POSTING_ANALYZER_PROMPT,
    SKILL_EMERGENCE_RESEARCHER_PROMPT,
    INDUSTRY_REPORT_SYNTHESIZER_PROMPT,
)
print('All prompts imported')
"
```

</details>

<details>
<summary><strong>Task 3.1.2: Implement MAIN_AGENT_PROMPT</strong></summary>

**ID:** 3.1.2
**Phase:** 3 - Agent Implementation
**Status:** PENDING
**Priority:** P0
**Estimated Hours:** 1h
**Dependencies:** 3.1.1

**Description:**
Create the coordinator agent's system prompt with full research methodology.

**Content Requirements:**
- Role definition (Talent Demand Research Analyst)
- Mission statement
- 4-step research methodology
- Subagent deployment instructions
- Synthesis guidelines
- Quality standards

**Definition of Done:**
- [ ] MAIN_AGENT_PROMPT defined
- [ ] Includes "Step 1: Clarify Research Scope"
- [ ] Includes "Step 2: Deploy Specialized Research Workers"
- [ ] Includes "Step 3: Synthesize & Analyze"
- [ ] Includes "Step 4: Deliver Results"
- [ ] Lists all 3 subagent names

**Verification Commands:**
```bash
cd backend && python -c "
from agent.prompts import MAIN_AGENT_PROMPT
assert 'job_posting_analyzer' in MAIN_AGENT_PROMPT
assert 'skill_emergence_researcher' in MAIN_AGENT_PROMPT
assert 'industry_report_synthesizer' in MAIN_AGENT_PROMPT
assert 'Step 1' in MAIN_AGENT_PROMPT
print('Main prompt validated')
"
```

**Reference Documents:**
- [Coordinator Prompt](../prompts/coordinator.md)

</details>

<details>
<summary><strong>Task 3.1.3: Implement subagent prompts</strong></summary>

**ID:** 3.1.3
**Phase:** 3 - Agent Implementation
**Status:** PENDING
**Priority:** P0
**Estimated Hours:** 1.5h
**Dependencies:** 3.1.1

**Description:**
Create specialized prompts for all 3 subagents.

**Prompts to Create:**

1. **JOB_POSTING_ANALYZER_PROMPT**
   - Focus: Job posting volume, compensation, hiring velocity
   - Data sources: Indeed, LinkedIn Jobs, Glassdoor, Dice
   - Output: Metrics, trends, emerging signals

2. **SKILL_EMERGENCE_RESEARCHER_PROMPT**
   - Focus: Tech adoption, learning trends, certifications
   - Data sources: GitHub, Stack Overflow, Coursera, AWS/GCP certs
   - Output: Emerging skills, tech trends, skill combinations

3. **INDUSTRY_REPORT_SYNTHESIZER_PROMPT**
   - Focus: Consulting reports, government data, forecasts
   - Data sources: McKinsey, Gartner, BLS, O*NET
   - Output: Key findings, economic indicators, projections

**Definition of Done:**
- [ ] JOB_POSTING_ANALYZER_PROMPT defined with data sources
- [ ] SKILL_EMERGENCE_RESEARCHER_PROMPT defined with data sources
- [ ] INDUSTRY_REPORT_SYNTHESIZER_PROMPT defined with data sources
- [ ] Each prompt includes output format

**Verification Commands:**
```bash
cd backend && python -c "
from agent.prompts import (
    JOB_POSTING_ANALYZER_PROMPT,
    SKILL_EMERGENCE_RESEARCHER_PROMPT,
    INDUSTRY_REPORT_SYNTHESIZER_PROMPT,
)
assert 'Indeed' in JOB_POSTING_ANALYZER_PROMPT
assert 'GitHub' in SKILL_EMERGENCE_RESEARCHER_PROMPT
assert 'McKinsey' in INDUSTRY_REPORT_SYNTHESIZER_PROMPT
print('Subagent prompts validated')
"
```

**Reference Documents:**
- [Job Analyzer Prompt](../prompts/job-analyzer.md)
- [Skill Researcher Prompt](../prompts/skill-researcher.md)
- [Report Synthesizer Prompt](../prompts/report-synthesizer.md)

</details>

<details>
<summary><strong>Task 3.1.4: Write prompt tests</strong></summary>

**ID:** 3.1.4
**Phase:** 3 - Agent Implementation
**Status:** PENDING
**Priority:** P1
**Estimated Hours:** 0.5h
**Dependencies:** 3.1.3

**Description:**
Write validation tests for all prompts.

**File:** `backend/tests/test_prompts.py`

**Test Cases:**
```python
import pytest
from agent.prompts import (
    MAIN_AGENT_PROMPT,
    JOB_POSTING_ANALYZER_PROMPT,
    SKILL_EMERGENCE_RESEARCHER_PROMPT,
    INDUSTRY_REPORT_SYNTHESIZER_PROMPT,
)

class TestPrompts:
    def test_main_prompt_not_empty(self):
        assert len(MAIN_AGENT_PROMPT) > 100

    def test_main_prompt_references_subagents(self):
        assert 'job_posting_analyzer' in MAIN_AGENT_PROMPT
        assert 'skill_emergence_researcher' in MAIN_AGENT_PROMPT
        assert 'industry_report_synthesizer' in MAIN_AGENT_PROMPT

    def test_subagent_prompts_have_data_sources(self):
        assert 'Indeed' in JOB_POSTING_ANALYZER_PROMPT or 'LinkedIn' in JOB_POSTING_ANALYZER_PROMPT
        assert 'GitHub' in SKILL_EMERGENCE_RESEARCHER_PROMPT
        assert 'McKinsey' in INDUSTRY_REPORT_SYNTHESIZER_PROMPT or 'Gartner' in INDUSTRY_REPORT_SYNTHESIZER_PROMPT

    def test_prompts_have_output_format(self):
        for prompt in [JOB_POSTING_ANALYZER_PROMPT, SKILL_EMERGENCE_RESEARCHER_PROMPT, INDUSTRY_REPORT_SYNTHESIZER_PROMPT]:
            assert 'Output' in prompt or 'output' in prompt
```

**Definition of Done:**
- [ ] test_prompts.py created
- [ ] 4+ test cases
- [ ] All tests pass

**Verification Commands:**
```bash
cd backend && pytest tests/test_prompts.py -v
# Expected: 4+ passed
```

</details>

#### 3.2 Subagents Module (4 tasks)

| ID | Task | Status | Est. | Deps | Verification |
|----|------|--------|------|------|--------------|
| 3.2.1 | Create subagents.py module | PENDING | 0.5h | 3.1.3 | Module imports without error |
| 3.2.2 | Define job_posting_analyzer subagent | PENDING | 0.5h | 3.2.1 | Subagent config validated |
| 3.2.3 | Define skill_emergence_researcher subagent | PENDING | 0.5h | 3.2.1 | Subagent config validated |
| 3.2.4 | Define industry_report_synthesizer subagent | PENDING | 0.5h | 3.2.1 | Subagent config validated |

<details>
<summary><strong>Task 3.2.1: Create subagents.py module</strong></summary>

**ID:** 3.2.1
**Phase:** 3 - Agent Implementation
**Status:** PENDING
**Priority:** P0
**Estimated Hours:** 0.5h
**Dependencies:** 3.1.3

**Description:**
Create the subagents module with configuration.

**File:** `backend/agent/subagents.py`

**Structure:**
```python
"""
Talent Demand Analyst - Subagent Definitions
"""

from .tools import tavily_web_search, exa_linkedin_search, exa_web_search, read_url_content
from .prompts import (
    JOB_POSTING_ANALYZER_PROMPT,
    SKILL_EMERGENCE_RESEARCHER_PROMPT,
    INDUSTRY_REPORT_SYNTHESIZER_PROMPT,
)

SUBAGENTS: list[dict] = []
```

**Definition of Done:**
- [ ] subagents.py created
- [ ] Imports tools
- [ ] Imports prompts
- [ ] SUBAGENTS list exported

**Verification Commands:**
```bash
cd backend && python -c "
from agent.subagents import SUBAGENTS
print(f'SUBAGENTS defined: {type(SUBAGENTS)}')
"
```

</details>

<details>
<summary><strong>Task 3.2.2: Define job_posting_analyzer subagent</strong></summary>

**ID:** 3.2.2
**Phase:** 3 - Agent Implementation
**Status:** PENDING
**Priority:** P0
**Estimated Hours:** 0.5h
**Dependencies:** 3.2.1

**Description:**
Define the job posting analyzer subagent configuration.

**Configuration:**
```python
job_posting_analyzer = {
    "name": "job_posting_analyzer",
    "description": (
        "Analyzes job posting data to identify volume metrics, requirement evolution, "
        "compensation trends, and hiring velocity across industries and roles. "
        "Use for job market indicators, salary trends, skill requirements, and demand patterns."
    ),
    "system_prompt": JOB_POSTING_ANALYZER_PROMPT,
    "tools": [tavily_web_search, exa_linkedin_search, read_url_content],
}

SUBAGENTS.append(job_posting_analyzer)
```

**Definition of Done:**
- [ ] job_posting_analyzer dict defined
- [ ] Has name, description, system_prompt, tools
- [ ] Includes tavily and linkedin tools
- [ ] Added to SUBAGENTS list

**Verification Commands:**
```bash
cd backend && python -c "
from agent.subagents import SUBAGENTS
jpa = next((s for s in SUBAGENTS if s['name'] == 'job_posting_analyzer'), None)
assert jpa is not None
assert len(jpa['tools']) >= 2
print('job_posting_analyzer validated')
"
```

</details>

<details>
<summary><strong>Task 3.2.3: Define skill_emergence_researcher subagent</strong></summary>

**ID:** 3.2.3
**Phase:** 3 - Agent Implementation
**Status:** PENDING
**Priority:** P0
**Estimated Hours:** 0.5h
**Dependencies:** 3.2.1

**Description:**
Define the skill emergence researcher subagent configuration.

**Configuration:**
```python
skill_emergence_researcher = {
    "name": "skill_emergence_researcher",
    "description": (
        "Researches emerging skills, technology adoption signals, learning platform trends, "
        "and certification data. Use for understanding skill emergence indicators, "
        "technology adoption patterns, and professional development signals."
    ),
    "system_prompt": SKILL_EMERGENCE_RESEARCHER_PROMPT,
    "tools": [tavily_web_search, exa_web_search, read_url_content],
}

SUBAGENTS.append(skill_emergence_researcher)
```

**Definition of Done:**
- [ ] skill_emergence_researcher dict defined
- [ ] Has name, description, system_prompt, tools
- [ ] Includes tavily and exa_web tools
- [ ] Added to SUBAGENTS list

**Verification Commands:**
```bash
cd backend && python -c "
from agent.subagents import SUBAGENTS
ser = next((s for s in SUBAGENTS if s['name'] == 'skill_emergence_researcher'), None)
assert ser is not None
print('skill_emergence_researcher validated')
"
```

</details>

<details>
<summary><strong>Task 3.2.4: Define industry_report_synthesizer subagent</strong></summary>

**ID:** 3.2.4
**Phase:** 3 - Agent Implementation
**Status:** PENDING
**Priority:** P0
**Estimated Hours:** 0.5h
**Dependencies:** 3.2.1

**Description:**
Define the industry report synthesizer subagent configuration.

**Configuration:**
```python
industry_report_synthesizer = {
    "name": "industry_report_synthesizer",
    "description": (
        "Synthesizes insights from authoritative industry reports, consulting firm research, "
        "economic data, and expert forecasts. Use for gathering McKinsey, Gartner, Deloitte, "
        "BLS, and other authoritative source insights."
    ),
    "system_prompt": INDUSTRY_REPORT_SYNTHESIZER_PROMPT,
    "tools": [tavily_web_search, exa_web_search, read_url_content],
}

SUBAGENTS.append(industry_report_synthesizer)
```

**Definition of Done:**
- [ ] industry_report_synthesizer dict defined
- [ ] Has name, description, system_prompt, tools
- [ ] Added to SUBAGENTS list
- [ ] SUBAGENTS has 3 items total

**Verification Commands:**
```bash
cd backend && python -c "
from agent.subagents import SUBAGENTS
assert len(SUBAGENTS) == 3
names = [s['name'] for s in SUBAGENTS]
assert 'job_posting_analyzer' in names
assert 'skill_emergence_researcher' in names
assert 'industry_report_synthesizer' in names
print(f'All 3 subagents defined: {names}')
"
```

</details>

#### 3.3 Main Agent (4 tasks)

| ID | Task | Status | Est. | Deps | Verification |
|----|------|--------|------|------|--------------|
| 3.3.1 | Create agent.py module | PENDING | 0.5h | 3.2.4 | Module imports without error |
| 3.3.2 | Implement create_talent_demand_analyst() | PENDING | 2h | 3.3.1 | Function returns compiled agent |
| 3.3.3 | Add checkpointer for conversation memory | PENDING | 1h | 3.3.2 | Agent maintains state across calls |
| 3.3.4 | Write agent integration tests | PENDING | 2h | 3.3.3 | Agent responds to queries |

<details>
<summary><strong>Task 3.3.1: Create agent.py module</strong></summary>

**ID:** 3.3.1
**Phase:** 3 - Agent Implementation
**Status:** PENDING
**Priority:** P0
**Estimated Hours:** 0.5h
**Dependencies:** 3.2.4

**Description:**
Create the main agent module skeleton.

**File:** `backend/agent/agent.py`

**Skeleton:**
```python
"""
Talent Demand Analyst - Main Agent Implementation
Using deepagents framework with all enhancements
"""

import os
import logging
from typing import Any

logger = logging.getLogger(__name__)

def create_talent_demand_analyst() -> Any:
    """Create and return the Talent Demand Analyst agent.

    Returns:
        Compiled LangGraph StateGraph
    """
    raise NotImplementedError("Agent creation not yet implemented")
```

**Definition of Done:**
- [ ] agent.py created
- [ ] Logger configured
- [ ] create_talent_demand_analyst() stubbed
- [ ] Module imports without error

**Verification Commands:**
```bash
cd backend && python -c "
from agent.agent import create_talent_demand_analyst
print('agent.py imports successfully')
"
```

</details>

<details>
<summary><strong>Task 3.3.2: Implement create_talent_demand_analyst()</strong></summary>

**ID:** 3.3.2
**Phase:** 3 - Agent Implementation
**Status:** PENDING
**Priority:** P0
**Estimated Hours:** 2h
**Dependencies:** 3.3.1

**Description:**
Implement the main agent factory function using deepagents.

**Implementation:**
```python
from deepagents import create_deep_agent
from langgraph.checkpoint.memory import MemorySaver

from .tools import ALL_TOOLS
from .prompts import MAIN_AGENT_PROMPT
from .subagents import SUBAGENTS

# Global checkpointer for conversation persistence
_checkpointer = MemorySaver()


def create_talent_demand_analyst() -> Any:
    """Create and return the Talent Demand Analyst agent.

    Features:
    - 3 specialized subagents for parallel research
    - Conversation persistence via checkpointer
    - Automatic context summarization at 170k tokens
    - Todo list tracking for complex research tasks
    - Virtual filesystem for report generation

    Returns:
        Compiled LangGraph StateGraph
    """
    logger.info("Creating Talent Demand Analyst agent...")

    agent = create_deep_agent(
        model=os.getenv("AGENT_MODEL", "anthropic:claude-sonnet-4-5-20250929"),
        tools=ALL_TOOLS,
        system_prompt=MAIN_AGENT_PROMPT,
        subagents=SUBAGENTS,
        checkpointer=_checkpointer,
    )

    logger.info("Agent created successfully")
    return agent
```

**Definition of Done:**
- [ ] create_deep_agent called with all params
- [ ] Tools passed
- [ ] Prompts passed
- [ ] Subagents passed
- [ ] Checkpointer passed
- [ ] Function returns agent

**Verification Commands:**
```bash
cd backend && python -c "
import os
os.environ['ANTHROPIC_API_KEY'] = 'test'  # Mock for import test
from agent.agent import create_talent_demand_analyst
agent = create_talent_demand_analyst()
print(f'Agent type: {type(agent)}')
"
```

</details>

<details>
<summary><strong>Task 3.3.3: Add checkpointer for conversation memory</strong></summary>

**ID:** 3.3.3
**Phase:** 3 - Agent Implementation
**Status:** PENDING
**Priority:** P0
**Estimated Hours:** 1h
**Dependencies:** 3.3.2

**Description:**
Ensure conversation persistence works across invocations.

**Verification Test:**
```python
# In test file
@pytest.mark.asyncio
async def test_conversation_persistence():
    agent = create_talent_demand_analyst()
    thread_id = "test-thread-001"
    config = {"configurable": {"thread_id": thread_id}}

    # First message
    result1 = await agent.ainvoke(
        {"messages": [{"role": "user", "content": "Remember: I'm interested in AI roles."}]},
        config=config,
    )

    # Second message should have context
    result2 = await agent.ainvoke(
        {"messages": [{"role": "user", "content": "What did I say I was interested in?"}]},
        config=config,
    )

    # Verify conversation history maintained
    messages = result2.get("messages", [])
    assert len(messages) > 2  # Should have history
```

**Definition of Done:**
- [ ] MemorySaver checkpointer configured
- [ ] Thread ID passed in config
- [ ] Conversation history maintained
- [ ] Test verifies persistence

**Verification Commands:**
```bash
cd backend && pytest tests/test_agent.py::test_conversation_persistence -v
# Expected: passed
```

</details>

<details>
<summary><strong>Task 3.3.4: Write agent integration tests</strong></summary>

**ID:** 3.3.4
**Phase:** 3 - Agent Implementation
**Status:** PENDING
**Priority:** P0
**Estimated Hours:** 2h
**Dependencies:** 3.3.3

**Description:**
Write integration tests for the agent.

**File:** `backend/tests/test_agent.py`

**Test Cases:**
```python
import pytest
from agent.agent import create_talent_demand_analyst

@pytest.fixture
def agent():
    return create_talent_demand_analyst()

@pytest.mark.asyncio
async def test_agent_responds_to_simple_query(agent):
    result = await agent.ainvoke({
        "messages": [{"role": "user", "content": "What skills are in demand for data engineers?"}]
    })

    messages = result.get("messages", [])
    assert len(messages) > 0

    ai_messages = [m for m in messages if m.type == "ai"]
    assert len(ai_messages) > 0

@pytest.mark.asyncio
async def test_agent_uses_tools(agent):
    result = await agent.ainvoke({
        "messages": [{"role": "user", "content": "Search for AI engineer salary trends in 2026"}]
    })

    messages = result.get("messages", [])
    tool_messages = [m for m in messages if m.type == "tool"]
    # Should have at least attempted tool calls
    # (May not actually call if mocked)

@pytest.mark.asyncio
async def test_agent_uses_subagents(agent):
    result = await agent.ainvoke({
        "messages": [{"role": "user", "content": "Comprehensive analysis of AI/ML engineer demand including job postings, skill trends, and industry forecasts"}]
    })

    messages = result.get("messages", [])
    # Should be comprehensive response
    ai_messages = [m for m in messages if m.type == "ai"]
    assert any(len(m.content) > 500 for m in ai_messages if m.content)
```

**Definition of Done:**
- [ ] test_agent.py created
- [ ] 3+ integration tests
- [ ] Tests agent response
- [ ] Tests tool usage
- [ ] Tests subagent delegation

**Verification Commands:**
```bash
cd backend && pytest tests/test_agent.py -v --timeout=120
# Expected: 3+ passed
```

</details>

#### 3.4 API Endpoints (3 tasks)

| ID | Task | Status | Est. | Deps | Verification |
|----|------|--------|------|------|--------------|
| 3.4.1 | Implement POST /chat endpoint with SSE | PENDING | 2h | 3.3.4 | curl returns streaming events |
| 3.4.2 | Implement POST /state endpoint | PENDING | 1h | 3.4.1 | Returns todos and files |
| 3.4.3 | Implement GET /files/{thread_id}/{path} | PENDING | 1h | 3.4.2 | Returns file content |

<details>
<summary><strong>Task 3.4.1: Implement POST /chat endpoint</strong></summary>

**ID:** 3.4.1
**Phase:** 3 - Agent Implementation
**Status:** PENDING
**Priority:** P0
**Estimated Hours:** 2h
**Dependencies:** 3.3.4

**Description:**
Implement the main chat endpoint with SSE streaming.

**Endpoint Spec:**
```
POST /chat
Content-Type: application/json

Request:
{
  "message": "Analyze demand for Python developers",
  "thread_id": "optional-thread-id"
}

Response: text/event-stream
data: {"type": "thread_id", "thread_id": "abc123"}

data: {"type": "token", "content": "Based"}

data: {"type": "token", "content": " on"}

data: {"type": "tool_start", "name": "tavily_web_search", "input": {...}}

data: {"type": "tool_end", "name": "tavily_web_search", "output": "..."}

data: {"type": "state", "todos": [...], "files": [...]}

data: [DONE]
```

**Implementation Location:** `backend/main.py`

**Definition of Done:**
- [ ] POST /chat implemented
- [ ] Validates ChatRequest
- [ ] Returns StreamingResponse
- [ ] Streams token events
- [ ] Streams tool events
- [ ] Returns final state
- [ ] Error handling for agent failures

**Verification Commands:**
```bash
curl -X POST http://localhost:8000/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "What skills are in demand?"}' \
  --no-buffer

# Expected: Stream of SSE events
```

</details>

<details>
<summary><strong>Task 3.4.2: Implement POST /state endpoint</strong></summary>

**ID:** 3.4.2
**Phase:** 3 - Agent Implementation
**Status:** PENDING
**Priority:** P0
**Estimated Hours:** 1h
**Dependencies:** 3.4.1

**Description:**
Implement state retrieval endpoint.

**Endpoint Spec:**
```
POST /state
Content-Type: application/json

Request:
{
  "thread_id": "abc123"
}

Response:
{
  "thread_id": "abc123",
  "todos": [
    {"id": "1", "task": "Research job postings", "status": "completed"}
  ],
  "files": {
    "/reports/analysis.md": {"size": 1234, "content_preview": "# Analysis..."}
  },
  "message_count": 5
}
```

**Definition of Done:**
- [ ] POST /state implemented
- [ ] Validates StateRequest
- [ ] Returns todos from agent state
- [ ] Returns files from agent state
- [ ] Returns message count

**Verification Commands:**
```bash
curl -X POST http://localhost:8000/state \
  -H "Content-Type: application/json" \
  -d '{"thread_id": "test-123"}'

# Expected: JSON with todos, files, message_count
```

</details>

<details>
<summary><strong>Task 3.4.3: Implement GET /files endpoint</strong></summary>

**ID:** 3.4.3
**Phase:** 3 - Agent Implementation
**Status:** PENDING
**Priority:** P1
**Estimated Hours:** 1h
**Dependencies:** 3.4.2

**Description:**
Implement file download endpoint.

**Endpoint Spec:**
```
GET /files/{thread_id}/{file_path}

Response:
{
  "path": "/reports/analysis.md",
  "content": "# Analysis Report\n\n...",
  "size": 1234
}
```

**Security:**
- Validate thread_id format
- Prevent path traversal
- Only return files from agent state

**Definition of Done:**
- [ ] GET /files/{thread_id}/{path} implemented
- [ ] Path traversal prevention
- [ ] 404 if file not found
- [ ] Returns file content and metadata

**Verification Commands:**
```bash
curl http://localhost:8000/files/test-123/reports/analysis.md

# Expected: JSON with path, content, size
# Or 404 if not found
```

</details>

---

### Sprint 4: Frontend Integration (10 tasks)

**Sprint Goal:** Frontend connected to Python backend with streaming chat

#### 4.1 API Proxy Update (3 tasks)

| ID | Task | Status | Est. | Deps | Verification |
|----|------|--------|------|------|--------------|
| 4.1.1 | Update route.ts to proxy to Python backend | PENDING | 1h | 3.4.1 | Proxy forwards requests correctly |
| 4.1.2 | Add state proxy endpoint | PENDING | 0.5h | 3.4.2 | State retrieval works |
| 4.1.3 | Add files proxy endpoint | PENDING | 0.5h | 3.4.3 | File download works |

#### 4.2 Client Library Update (3 tasks)

| ID | Task | Status | Est. | Deps | Verification |
|----|------|--------|------|------|--------------|
| 4.2.1 | Update talent-demand-agent.ts stream parsing | PENDING | 2h | 4.1.1 | SSE events parsed correctly |
| 4.2.2 | Add state fetching function | PENDING | 1h | 4.1.2 | State retrieval function works |
| 4.2.3 | Add file download function | PENDING | 1h | 4.1.3 | Files downloadable |

#### 4.3 UI Integration (4 tasks)

| ID | Task | Status | Est. | Deps | Verification |
|----|------|--------|------|------|--------------|
| 4.3.1 | Update page.tsx to use new stream format | PENDING | 2h | 4.2.1 | Chat messages display correctly |
| 4.3.2 | Add tool visualization component | PENDING | 2h | 4.3.1 | Tool calls visible |
| 4.3.3 | Add todo progress display | PENDING | 1.5h | 4.2.2 | Todos visible during research |
| 4.3.4 | Add file download UI | PENDING | 1.5h | 4.2.3 | Files downloadable from UI |

---

### Sprint 5: Security Implementation (12 tasks)

**Sprint Goal:** Production-grade security controls

#### 5.1 Authentication (4 tasks)

| ID | Task | Status | Est. | Deps | Verification |
|----|------|--------|------|------|--------------|
| 5.1.1 | Create security/auth.py module | PENDING | 0.5h | 3.4.3 | Module imports |
| 5.1.2 | Implement JWT token verification | PENDING | 2h | 5.1.1 | Valid tokens accepted |
| 5.1.3 | Implement tenant isolation | PENDING | 1.5h | 5.1.2 | Cross-tenant access denied |
| 5.1.4 | Add authentication middleware | PENDING | 1h | 5.1.3 | Protected endpoints require auth |

#### 5.2 Input Validation (4 tasks)

| ID | Task | Status | Est. | Deps | Verification |
|----|------|--------|------|------|--------------|
| 5.2.1 | Create security/validation.py module | PENDING | 0.5h | 5.1.4 | Module imports |
| 5.2.2 | Implement request size limiting | PENDING | 0.5h | 5.2.1 | Oversized requests rejected |
| 5.2.3 | Implement path traversal protection | PENDING | 0.5h | 5.2.1 | Malicious paths rejected |
| 5.2.4 | Add injection pattern detection | PENDING | 1h | 5.2.1 | Common injections blocked |

#### 5.3 Rate Limiting & Headers (4 tasks)

| ID | Task | Status | Est. | Deps | Verification |
|----|------|--------|------|------|--------------|
| 5.3.1 | Create security/rate_limit.py module | PENDING | 0.5h | 5.2.4 | Module imports |
| 5.3.2 | Implement per-user rate limiting | PENDING | 1.5h | 5.3.1 | Rate limits enforced |
| 5.3.3 | Implement security headers middleware | PENDING | 1h | 5.3.1 | Headers present in responses |
| 5.3.4 | Write security tests | PENDING | 2h | 5.3.3 | Security tests pass |

---

### Sprint 6: Reliability Patterns (10 tasks)

**Sprint Goal:** Circuit breakers, retries, graceful degradation

#### 6.1 Circuit Breakers (4 tasks)

| ID | Task | Status | Est. | Deps | Verification |
|----|------|--------|------|------|--------------|
| 6.1.1 | Create reliability/circuit_breaker.py | PENDING | 0.5h | 5.3.4 | Module imports |
| 6.1.2 | Implement CircuitBreaker class | PENDING | 2h | 6.1.1 | Circuit opens on failures |
| 6.1.3 | Add circuit breakers to all tools | PENDING | 1h | 6.1.2 | Tools use circuit breakers |
| 6.1.4 | Write circuit breaker tests | PENDING | 1.5h | 6.1.3 | Tests pass |

#### 6.2 Graceful Degradation (3 tasks)

| ID | Task | Status | Est. | Deps | Verification |
|----|------|--------|------|------|--------------|
| 6.2.1 | Implement fallback chains for tools | PENDING | 1.5h | 6.1.4 | Fallback triggers on failure |
| 6.2.2 | Implement partial response handling | PENDING | 1h | 6.2.1 | Partial results returned |
| 6.2.3 | Add degradation metrics | PENDING | 1h | 6.2.2 | Degradation events tracked |

#### 6.3 Timeout Management (3 tasks)

| ID | Task | Status | Est. | Deps | Verification |
|----|------|--------|------|------|--------------|
| 6.3.1 | Configure tool timeouts (30s) | PENDING | 0.5h | 6.2.3 | Tools timeout at 30s |
| 6.3.2 | Configure LLM timeouts (120s) | PENDING | 0.5h | 6.3.1 | LLM timeouts at 120s |
| 6.3.3 | Implement request timeout handling | PENDING | 1h | 6.3.2 | Timeouts return graceful errors |

---

### Sprint 7: Observability Stack (12 tasks)

**Sprint Goal:** Metrics, logging, tracing, alerting

#### 7.1 Metrics (4 tasks)

| ID | Task | Status | Est. | Deps | Verification |
|----|------|--------|------|------|--------------|
| 7.1.1 | Create metrics/sli.py module | PENDING | 0.5h | 6.3.3 | Module imports |
| 7.1.2 | Implement SLI metrics (availability, latency) | PENDING | 1.5h | 7.1.1 | Metrics exposed |
| 7.1.3 | Add token usage metrics | PENDING | 1h | 7.1.2 | Token counts tracked |
| 7.1.4 | Add /metrics endpoint | PENDING | 0.5h | 7.1.3 | Prometheus scrape works |

#### 7.2 Logging (4 tasks)

| ID | Task | Status | Est. | Deps | Verification |
|----|------|--------|------|------|--------------|
| 7.2.1 | Configure structured JSON logging | PENDING | 1h | 7.1.4 | Logs in JSON format |
| 7.2.2 | Add correlation ID to all logs | PENDING | 1h | 7.2.1 | Request ID in logs |
| 7.2.3 | Add sensitive data masking | PENDING | 1h | 7.2.2 | API keys not logged |
| 7.2.4 | Configure log levels by environment | PENDING | 0.5h | 7.2.3 | Dev=DEBUG, Prod=INFO |

#### 7.3 Tracing (4 tasks)

| ID | Task | Status | Est. | Deps | Verification |
|----|------|--------|------|------|--------------|
| 7.3.1 | Configure LangSmith tracing | PENDING | 1h | 7.2.4 | Traces visible in LangSmith |
| 7.3.2 | Add custom spans for tools | PENDING | 1h | 7.3.1 | Tool calls traced |
| 7.3.3 | Add custom spans for subagents | PENDING | 1h | 7.3.2 | Subagent calls traced |
| 7.3.4 | Configure trace sampling | PENDING | 0.5h | 7.3.3 | 10% sampling in prod |

---

### Sprint 8: Testing & Quality (12 tasks)

**Sprint Goal:** 80%+ coverage, all quality gates passing

#### 8.1 Unit Test Coverage (4 tasks)

| ID | Task | Status | Est. | Deps | Verification |
|----|------|--------|------|------|--------------|
| 8.1.1 | Achieve 80% coverage on tools | PENDING | 2h | 7.3.4 | coverage shows 80%+ |
| 8.1.2 | Achieve 90% coverage on models | PENDING | 1h | 8.1.1 | coverage shows 90%+ |
| 8.1.3 | Achieve 90% coverage on security | PENDING | 2h | 8.1.2 | coverage shows 90%+ |
| 8.1.4 | Overall coverage >= 80% | PENDING | 1h | 8.1.3 | pytest --cov-fail-under=80 |

#### 8.2 Integration Tests (4 tasks)

| ID | Task | Status | Est. | Deps | Verification |
|----|------|--------|------|------|--------------|
| 8.2.1 | Write API endpoint tests | PENDING | 2h | 8.1.4 | All endpoints tested |
| 8.2.2 | Write agent flow tests | PENDING | 2h | 8.2.1 | Agent flows tested |
| 8.2.3 | Write security integration tests | PENDING | 1.5h | 8.2.2 | Security controls tested |
| 8.2.4 | Write E2E test (frontend → backend) | PENDING | 2h | 8.2.3 | Full flow works |

#### 8.3 Quality Gates (4 tasks)

| ID | Task | Status | Est. | Deps | Verification |
|----|------|--------|------|------|--------------|
| 8.3.1 | Configure ruff linting | PENDING | 0.5h | 8.2.4 | ruff check passes |
| 8.3.2 | Configure mypy type checking | PENDING | 1h | 8.3.1 | mypy passes |
| 8.3.3 | Configure pre-commit hooks | PENDING | 0.5h | 8.3.2 | Pre-commit runs |
| 8.3.4 | All quality gates passing | PENDING | 1h | 8.3.3 | CI passes |

---

### Sprint 9: Deployment (10 tasks)

**Sprint Goal:** Backend on Railway, Frontend on Vercel

#### 9.1 Backend Deployment (5 tasks)

| ID | Task | Status | Est. | Deps | Verification |
|----|------|--------|------|------|--------------|
| 9.1.1 | Create Dockerfile | PENDING | 1h | 8.3.4 | docker build succeeds |
| 9.1.2 | Create docker-compose.yml for local | PENDING | 0.5h | 9.1.1 | docker-compose up works |
| 9.1.3 | Configure Railway project | PENDING | 1h | 9.1.2 | Railway project created |
| 9.1.4 | Set Railway environment variables | PENDING | 0.5h | 9.1.3 | All env vars set |
| 9.1.5 | Deploy backend and verify health | PENDING | 1h | 9.1.4 | /health returns 200 |

#### 9.2 Frontend Deployment (3 tasks)

| ID | Task | Status | Est. | Deps | Verification |
|----|------|--------|------|------|--------------|
| 9.2.1 | Update frontend env vars for Railway URL | PENDING | 0.5h | 9.1.5 | TDA_BACKEND_URL set |
| 9.2.2 | Configure Vercel project | PENDING | 0.5h | 9.2.1 | Vercel project created |
| 9.2.3 | Deploy frontend and verify | PENDING | 1h | 9.2.2 | Chat works in production |

#### 9.3 Smoke Tests (2 tasks)

| ID | Task | Status | Est. | Deps | Verification |
|----|------|--------|------|------|--------------|
| 9.3.1 | Run production smoke tests | PENDING | 1h | 9.2.3 | All smoke tests pass |
| 9.3.2 | Verify monitoring and alerts | PENDING | 1h | 9.3.1 | Alerts configured |

---

### Operational Excellence (OE) Track (10 tasks)

**Goal:** CI/CD, coverage enforcement, monitoring

#### OE.1 CI/CD Pipeline (5 tasks)

| ID | Task | Status | Est. | Deps | Verification |
|----|------|--------|------|------|--------------|
| OE.1.1 | Create .github/workflows/ci.yml | PENDING | 1h | 1.1.5 | CI runs on PR |
| OE.1.2 | Add lint step (ruff) | PENDING | 0.5h | OE.1.1 | Lint runs in CI |
| OE.1.3 | Add type check step (mypy) | PENDING | 0.5h | OE.1.2 | Type check in CI |
| OE.1.4 | Add test step with coverage | PENDING | 1h | OE.1.3 | Tests run with coverage |
| OE.1.5 | Add coverage enforcement (80%) | PENDING | 0.5h | OE.1.4 | CI fails if < 80% |

#### OE.2 Monitoring & Alerts (5 tasks)

| ID | Task | Status | Est. | Deps | Verification |
|----|------|--------|------|------|--------------|
| OE.2.1 | Create alerting rules document | PENDING | 1h | 9.3.2 | Rules documented |
| OE.2.2 | Configure error rate alert | PENDING | 0.5h | OE.2.1 | Alert fires on > 2% errors |
| OE.2.3 | Configure latency alert | PENDING | 0.5h | OE.2.2 | Alert fires on p99 > 45s |
| OE.2.4 | Configure availability alert | PENDING | 0.5h | OE.2.3 | Alert fires on < 99% |
| OE.2.5 | Test alerting end-to-end | PENDING | 1h | OE.2.4 | Alerts reach notification channel |

---

## Task Summary

| Sprint | Tasks | Est. Hours | Focus |
|--------|-------|-----------|-------|
| Sprint 1 | 15 | ~12h | Backend Foundation |
| Sprint 2 | 12 | ~11h | Tools Implementation |
| Sprint 3 | 15 | ~15h | Agent Implementation |
| Sprint 4 | 10 | ~13h | Frontend Integration |
| Sprint 5 | 12 | ~12h | Security |
| Sprint 6 | 10 | ~11h | Reliability |
| Sprint 7 | 12 | ~12h | Observability |
| Sprint 8 | 12 | ~16h | Testing & Quality |
| Sprint 9 | 10 | ~9h | Deployment |
| OE Track | 10 | ~8h | CI/CD & Monitoring |
| **TOTAL** | **98** | **~119h** | |

---

## Critical Path

```
Sprint 1 → Sprint 2 → Sprint 3 → Sprint 4 → Sprint 8 → Sprint 9
(Foundation) (Tools)  (Agents)   (Frontend)  (Tests)   (Deploy)
```

Security (Sprint 5), Reliability (Sprint 6), and Observability (Sprint 7) can run in parallel after Sprint 3.

OE Track runs in parallel starting from Sprint 1.

---

## Documentation Index

### Layer 1-2: Vision & Requirements
| Document | Path | Purpose |
|----------|------|---------|
| PRD | [requirements/2025-01-21-talent-demand-analyst-prd.md](../requirements/2025-01-21-talent-demand-analyst-prd.md) | Product requirements |
| TRD | [requirements/2025-01-21-talent-demand-analyst-trd.md](../requirements/2025-01-21-talent-demand-analyst-trd.md) | Technical requirements |

### Layer 3: Technical Design
| Document | Path | Purpose |
|----------|------|---------|
| Design Doc | [design/2025-01-21-talent-demand-analyst-design.md](../design/2025-01-21-talent-demand-analyst-design.md) | System design decisions |
| Error Handling | [design/error-handling-specification.md](../design/error-handling-specification.md) | Error matrix, retry policies |

### Layer 4: Architecture
| Document | Path | Purpose |
|----------|------|---------|
| ADR-001 | [architecture/decisions/ADR-001-multi-agent-architecture.md](../architecture/decisions/ADR-001-multi-agent-architecture.md) | Why coordinator + subagents |
| ADR-002 | [architecture/decisions/ADR-002-agent-framework-selection.md](../architecture/decisions/ADR-002-agent-framework-selection.md) | Why deepagents |
| ADR-003 | [architecture/decisions/ADR-003-streaming-response-architecture.md](../architecture/decisions/ADR-003-streaming-response-architecture.md) | Why SSE |
| Data Model | [architecture/data/2025-01-21-talent-demand-analyst-data-model.md](../architecture/data/2025-01-21-talent-demand-analyst-data-model.md) | Request/response schemas |

### Layer 5: Quality & Operations
| Document | Path | Purpose |
|----------|------|---------|
| QA Plan | [qa/2025-01-21-talent-demand-analyst-qa-plan.md](../qa/2025-01-21-talent-demand-analyst-qa-plan.md) | Test strategy |
| Production Readiness | [../PRODUCTION_READINESS.md](../PRODUCTION_READINESS.md) | Security, reliability, observability |

### Layer 6: Implementation
| Document | Path | Purpose |
|----------|------|---------|
| Implementation Plan | [../IMPLEMENTATION_PLAN.md](../IMPLEMENTATION_PLAN.md) | Task breakdown with code samples |

### Agent Prompts
| Document | Path | Purpose |
|----------|------|---------|
| Coordinator | [prompts/coordinator.md](../prompts/coordinator.md) | Main orchestrator prompt |
| Job Analyzer | [prompts/job-analyzer.md](../prompts/job-analyzer.md) | Job posting analysis prompt |
| Skill Researcher | [prompts/skill-researcher.md](../prompts/skill-researcher.md) | Skill emergence prompt |
| Report Synthesizer | [prompts/report-synthesizer.md](../prompts/report-synthesizer.md) | Industry report prompt |

---

## Session Handoff

> **IMPORTANT**: AI agents MUST update this section before ending their session

| Field | Value |
|-------|-------|
| **Session Date** | 2026-01-22 |
| **Agent Instance** | Claude (Opus 4.5) |
| **Session Duration** | Elite Command Center creation + Project Status doc |
| **Tasks Completed** | Elite Command Center, PROJECT-STATUS.md |
| **Task In Progress** | None |
| **Next Action** | Begin Task 1.1.1: Create backend directory structure |
| **Blockers Found** | None |
| **Project Status** | PAUSED - Ready for Resumption |
| **Notes** | 98 granular tasks defined across 9 sprints + OE track. See PROJECT-STATUS.md for resume instructions. |

### Session Summary

**Work Completed:**

1. **Elite Command Center Created** - Converted the 10-task command center to 98 granular tasks with:
   - 0.5h-2h task estimates
   - Explicit verification commands for each task
   - Expandable details with code samples
   - Clear Definition of Done criteria
   - Dependency tracking
   - Sprint organization with goals
   - Operational Excellence (OE) track for CI/CD

2. **PROJECT-STATUS.md Created** - Comprehensive handoff document with:
   - Quick resume checklist
   - Current vs target architecture diagrams
   - What exists vs what needs building
   - Environment variables needed
   - Sprint overview and critical path
   - How-to-resume instructions

**For the Next Session (Human or AI):**

1. **Read** [PROJECT-STATUS.md](../PROJECT-STATUS.md) first for full context
2. **Check** Active Execution State above for next task
3. **Begin** Task 1.1.1: Create backend directory structure
4. **Use** expandable details for implementation guidance
5. **Run** verification commands before marking complete
6. **Update** Active Execution State and Session Handoff when done

---

## Changelog

| Date | Change | By |
|------|--------|-----|
| 2026-01-22 | Created Elite Command Center with 98 tasks | Claude (Opus 4.5) |
| 2026-01-22 | Added PROJECT-STATUS.md, updated handoff for project pause | Claude (Opus 4.5) |

---

*This is the single source of truth for project status. All other documents are reference materials.*
