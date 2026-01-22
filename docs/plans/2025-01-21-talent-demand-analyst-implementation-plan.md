# Talent Demand Analyst - Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a multi-agent AI system that analyzes job market data and provides talent insights through a conversational interface.

**Architecture:** Coordinator agent pattern with 3 specialized sub-agents, FastAPI backend, Next.js frontend, streaming SSE responses.

**Tech Stack:** Python 3.11+, FastAPI, deepagents, Next.js 14+, React 18+, Tailwind CSS

---

## Task Dependency Graph

```
                            ┌─────────────────────────────────────────┐
                            │          PARALLEL WORK STREAMS          │
                            └─────────────────────────────────────────┘

BACKEND TRACK                              FRONTEND TRACK
═════════════                              ══════════════

Task 1: Project Setup ──────────────────── Task 6: Frontend Setup
        │                                          │
        ▼                                          │
Task 2: Models ◄────────────────────────────────── │ (needs API contract)
        │                                          │
        ├───────────┬───────────┐                  │
        ▼           ▼           ▼                  │
Task 3a:      Task 3b:     Task 3c:               │
Tavily Tool   Exa Tool     URL Tool               │
        │           │           │                  │
        └───────────┴───────────┘                  │
                    │                              │
                    ▼                              │
        Task 4: Agents ◄───────────────────────────┤
        (needs prompts from docs/prompts/)         │
                    │                              │
                    ▼                              ▼
        Task 5: Chat Endpoint ───────────► Task 7: Chat Component
                    │                              │
                    │                              │
        ════════════╪══════════════════════════════╪════════════
                    │         INTEGRATION          │
                    │                              │
                    └──────────────┬───────────────┘
                                   ▼
                        Task 8: Integration Tests
                                   │
                                   ▼
                        Task 9: Deploy Backend
                                   │
                                   ▼
                        Task 10: Deploy Frontend
```

## Parallel Execution Opportunities

| Stream | Tasks | Can Run In Parallel With |
|--------|-------|--------------------------|
| **Backend Core** | 1, 2, 4, 5 | Frontend Stream |
| **Backend Tools** | 3a, 3b, 3c | Each other |
| **Frontend** | 6, 7 | Backend Core |
| **Integration** | 8, 9, 10 | Sequential |

## Task Dependencies Matrix

| Task | Depends On | Blocks |
|------|------------|--------|
| 1. Project Setup | - | 2, 3a, 3b, 3c |
| 2. Models | 1 | 4, 5 |
| 3a. Tavily Tool | 1 | 4 |
| 3b. Exa Tool | 1 | 4 |
| 3c. URL Tool | 1 | 4 |
| 4. Agents | 2, 3a, 3b, 3c | 5 |
| 5. Chat Endpoint | 4 | 7, 8 |
| 6. Frontend Setup | - | 7 |
| 7. Chat Component | 5, 6 | 8 |
| 8. Integration Tests | 5, 7 | 9 |
| 9. Deploy Backend | 8 | 10 |
| 10. Deploy Frontend | 9 | - |

## Critical Path

The critical path (longest sequential chain) is:

```
Task 1 → Task 2 → Task 4 → Task 5 → Task 7 → Task 8 → Task 9 → Task 10
```

Optimizing tasks on the critical path has the most impact on total delivery time.

---

## Phase 1: Backend Foundation

### Task 1: Project Setup

**Files:**
- Create: `backend/pyproject.toml`
- Create: `backend/app/__init__.py`
- Create: `backend/app/main.py`
- Create: `backend/.env.example`

**Step 1: Initialize Python project**

```bash
mkdir -p backend/app
cd backend
```

**Step 2: Create pyproject.toml**

```toml
[project]
name = "tda-backend"
version = "0.1.0"
requires-python = ">=3.11"
dependencies = [
    "fastapi>=0.100.0",
    "uvicorn[standard]>=0.23.0",
    "pydantic>=2.0.0",
    "httpx>=0.24.0",
    "anthropic>=0.18.0",
    "deepagents>=1.0.0",
    "python-dotenv>=1.0.0",
]

[project.optional-dependencies]
dev = [
    "pytest>=7.4.0",
    "pytest-asyncio>=0.21.0",
    "pytest-cov>=4.1.0",
    "ruff>=0.1.0",
    "mypy>=1.5.0",
]
```

**Step 3: Create main.py**

```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="Talent Demand Analyst API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure for production
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/api/health")
async def health():
    return {"status": "healthy"}
```

**Step 4: Create .env.example**

```bash
ANTHROPIC_API_KEY=sk-ant-...
TAVILY_API_KEY=tvly-...
EXA_API_KEY=...
LANGSMITH_API_KEY=...
```

**Step 5: Verify setup**

```bash
pip install -e .
uvicorn app.main:app --reload
curl http://localhost:8000/api/health
# Expected: {"status": "healthy"}
```

**Step 6: Commit**

```bash
git add .
git commit -m "feat: initialize backend project structure"
```

---

### Task 2: Implement Request/Response Models

**Files:**
- Create: `backend/app/models/__init__.py`
- Create: `backend/app/models/chat.py`

**Step 1: Write test for models**

```python
# backend/tests/test_models.py
import pytest
from app.models.chat import ChatRequest

def test_chat_request_valid():
    req = ChatRequest(message="Test query")
    assert req.message == "Test query"

def test_chat_request_empty_fails():
    with pytest.raises(ValueError):
        ChatRequest(message="")

def test_chat_request_too_long_fails():
    with pytest.raises(ValueError):
        ChatRequest(message="x" * 2001)
```

**Step 2: Run test to verify it fails**

```bash
pytest tests/test_models.py -v
# Expected: FAIL (module not found)
```

**Step 3: Implement models**

```python
# backend/app/models/chat.py
from typing import Optional, Literal, Union
from pydantic import BaseModel, Field, HttpUrl

class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=2000)
    conversation_id: Optional[str] = None

class TokenEvent(BaseModel):
    type: Literal["token"] = "token"
    content: str

class SourceEvent(BaseModel):
    type: Literal["source"] = "source"
    url: HttpUrl
    title: str
    snippet: Optional[str] = None

class ProgressEvent(BaseModel):
    type: Literal["progress"] = "progress"
    agent: str
    status: Literal["started", "completed", "failed"]
    message: Optional[str] = None

class DoneEvent(BaseModel):
    type: Literal["done"] = "done"
    total_tokens: Optional[int] = None
    duration_ms: Optional[int] = None

class ErrorEvent(BaseModel):
    type: Literal["error"] = "error"
    message: str
    code: Optional[str] = None
    recoverable: bool = False

StreamEvent = Union[TokenEvent, SourceEvent, ProgressEvent, DoneEvent, ErrorEvent]
```

**Step 4: Run test to verify it passes**

```bash
pytest tests/test_models.py -v
# Expected: PASS
```

**Step 5: Commit**

```bash
git add .
git commit -m "feat: add request/response models"
```

---

### Task 3: Implement Tools

**Files:**
- Create: `backend/app/tools/__init__.py`
- Create: `backend/app/tools/tavily.py`
- Create: `backend/app/tools/exa.py`
- Create: `backend/app/tools/url_reader.py`

**Step 1: Write test for tavily tool**

```python
# backend/tests/test_tools.py
import pytest
from unittest.mock import patch, AsyncMock
from app.tools.tavily import tavily_web_search

@pytest.mark.asyncio
async def test_tavily_search_returns_results():
    mock_response = {
        'results': [
            {'title': 'Test', 'url': 'https://example.com', 'content': 'Content'}
        ]
    }
    with patch('app.tools.tavily.TavilyClient') as mock:
        mock.return_value.search = AsyncMock(return_value=mock_response)
        result = await tavily_web_search("test query")
        assert "Test" in result
        assert "https://example.com" in result
```

**Step 2: Implement tavily tool**

```python
# backend/app/tools/tavily.py
import os
from tavily import TavilyClient

async def tavily_web_search(query: str, max_results: int = 10) -> str:
    """Search the web using Tavily API."""
    client = TavilyClient(api_key=os.getenv("TAVILY_API_KEY"))
    response = client.search(
        query=query,
        search_depth="advanced",
        max_results=max_results
    )

    results = []
    for r in response.get('results', []):
        results.append(f"**{r['title']}**\n{r['url']}\n{r['content'][:200]}...")

    return "\n\n".join(results) if results else "No results found."
```

**Step 3: Implement exa tools**

```python
# backend/app/tools/exa.py
import os
from exa_py import Exa

async def exa_web_search(
    query: str,
    search_type: str = "neural",
    max_results: int = 10
) -> str:
    """Search using Exa's neural or keyword search."""
    client = Exa(api_key=os.getenv("EXA_API_KEY"))
    response = client.search(
        query=query,
        type=search_type,
        num_results=max_results,
        use_autoprompt=True
    )

    results = []
    for r in response.results:
        results.append(f"**{r.title}**\n{r.url}")

    return "\n\n".join(results) if results else "No results found."

async def exa_linkedin_search(query: str, max_results: int = 10) -> str:
    """Search LinkedIn via Exa."""
    client = Exa(api_key=os.getenv("EXA_API_KEY"))
    response = client.search(
        query=query,
        include_domains=["linkedin.com"],
        num_results=max_results
    )

    results = []
    for r in response.results:
        results.append(f"**{r.title}**\n{r.url}")

    return "\n\n".join(results) if results else "No LinkedIn results found."
```

**Step 4: Implement URL reader**

```python
# backend/app/tools/url_reader.py
import httpx
from bs4 import BeautifulSoup

async def read_url_content(url: str) -> str:
    """Fetch and extract main content from a URL."""
    async with httpx.AsyncClient() as client:
        response = await client.get(url, timeout=30, follow_redirects=True)
        response.raise_for_status()

    soup = BeautifulSoup(response.text, 'html.parser')

    # Remove script and style elements
    for element in soup(['script', 'style', 'nav', 'footer', 'header']):
        element.decompose()

    # Get text
    text = soup.get_text(separator='\n', strip=True)

    # Truncate if too long
    if len(text) > 10000:
        text = text[:10000] + "\n...[truncated]"

    return text
```

**Step 5: Run tests**

```bash
pytest tests/test_tools.py -v
```

**Step 6: Commit**

```bash
git add .
git commit -m "feat: implement search and URL tools"
```

---

### Task 4: Implement Agents

**Files:**
- Create: `backend/app/agents/__init__.py`
- Create: `backend/app/agents/coordinator.py`
- Create: `backend/app/agents/job_analyzer.py`
- Create: `backend/app/agents/skill_researcher.py`
- Create: `backend/app/agents/report_synthesizer.py`

**Step 1: Implement coordinator agent**

See [TALENT_DEMAND_ANALYST_SPECIFICATION.md](../TALENT_DEMAND_ANALYST_SPECIFICATION.md) for full agent prompts.

```python
# backend/app/agents/coordinator.py
from deepagents import Agent
from app.agents.job_analyzer import job_posting_analyzer
from app.agents.skill_researcher import skill_emergence_researcher
from app.agents.report_synthesizer import industry_report_synthesizer

COORDINATOR_PROMPT = """
You are the Talent Demand Analyst, an expert AI system that helps
organizations understand workforce trends and skill demands.

Your capabilities:
1. Analyze job posting data for skill demand patterns
2. Identify emerging skills and technologies
3. Synthesize industry reports and LinkedIn insights
4. Provide actionable recommendations

For each query, invoke the appropriate sub-agents and synthesize their findings.
"""

def create_coordinator():
    return Agent(
        name="talent_demand_analyst",
        model="claude-sonnet-4-5-20241022",
        system_prompt=COORDINATOR_PROMPT,
        sub_agents=[
            job_posting_analyzer,
            skill_emergence_researcher,
            industry_report_synthesizer
        ]
    )
```

**Step 2: Implement sub-agents**

Follow similar pattern for each sub-agent. See original specification for full prompts.

**Step 3: Test agent creation**

```bash
python -c "from app.agents.coordinator import create_coordinator; print(create_coordinator())"
```

**Step 4: Commit**

```bash
git add .
git commit -m "feat: implement multi-agent system"
```

---

### Task 5: Implement Chat Endpoint

**Files:**
- Create: `backend/app/api/__init__.py`
- Create: `backend/app/api/chat.py`
- Modify: `backend/app/main.py`

**Step 1: Implement streaming chat endpoint**

```python
# backend/app/api/chat.py
import json
from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from app.models.chat import ChatRequest
from app.agents.coordinator import create_coordinator

router = APIRouter()

@router.post("/chat")
async def chat(request: ChatRequest):
    """Process chat request and stream response."""

    agent = create_coordinator()

    async def generate():
        try:
            async for event in agent.stream(request.message):
                yield f"data: {json.dumps(event)}\n\n"
            yield f"data: {json.dumps({'type': 'done'})}\n\n"
        except Exception as e:
            yield f"data: {json.dumps({'type': 'error', 'message': str(e)})}\n\n"

    return StreamingResponse(
        generate(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive"
        }
    )
```

**Step 2: Register router**

```python
# backend/app/main.py
from app.api.chat import router as chat_router

app.include_router(chat_router, prefix="/api")
```

**Step 3: Test endpoint**

```bash
curl -X POST http://localhost:8000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Test query"}'
```

**Step 4: Commit**

```bash
git add .
git commit -m "feat: implement streaming chat endpoint"
```

---

## Phase 2: Frontend Implementation

### Task 6: Setup Next.js Project

**Files:**
- Modify: `package.json` (update dependencies)
- Create: `app/page.tsx` (main chat interface)
- Create: `components/Chat.tsx`

**Step 1: Install dependencies**

```bash
npm install
```

**Step 2: Implement chat component**

See existing frontend code and enhance with streaming support.

**Step 3: Test locally**

```bash
npm run dev
# Open http://localhost:3000
```

**Step 4: Commit**

```bash
git add .
git commit -m "feat: implement chat interface with streaming"
```

---

## Phase 3: Integration & Testing

### Task 7: Integration Testing

**Files:**
- Create: `backend/tests/test_integration.py`

**Step 1: Write integration tests**

Test the full flow from API request through agent execution.

**Step 2: Run tests**

```bash
pytest tests/test_integration.py -v
```

**Step 3: Commit**

```bash
git add .
git commit -m "test: add integration tests"
```

---

## Phase 4: Deployment

### Task 8: Deploy Backend

**Files:**
- Create: `backend/Dockerfile`
- Create: `backend/railway.toml`

Follow [deploy-backend.md](../runbooks/deployment/deploy-backend.md) runbook.

### Task 9: Deploy Frontend

Follow [deploy-frontend.md](../runbooks/deployment/deploy-frontend.md) runbook.

---

## Implementation Notes

- Each task follows TDD: write test, verify fail, implement, verify pass, commit
- Refer to original specification documents for full code and prompts
- Run tests frequently: `pytest tests/ -v`
- Commit after each completed task

## Document References

| Document | Content |
|----------|---------|
| [Original Spec](../TALENT_DEMAND_ANALYST_SPECIFICATION.md) | Full agent prompts, tool code |
| [Original Plan](../IMPLEMENTATION_PLAN.md) | Additional implementation details |
| [Design Doc](../design/2025-01-21-talent-demand-analyst-design.md) | Architecture decisions |
| [API Contract](../api/openapi.yaml) | API specification |

---

*Implementation Plan - Part of 7-layer documentation. Reorganized from IMPLEMENTATION_PLAN.md*
