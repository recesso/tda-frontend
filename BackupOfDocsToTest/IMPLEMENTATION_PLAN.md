# Talent Demand Analyst - Implementation Plan

> **Architecture**: Separate Python backend (FastAPI + deepagents) + Next.js frontend
> **Scope**: Enhanced version with full features plus improvements
> **Status**: Ready for implementation

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Phase 1: Backend Foundation](#phase-1-backend-foundation)
3. [Phase 2: Agent Implementation](#phase-2-agent-implementation)
4. [Phase 3: Frontend Integration](#phase-3-frontend-integration)
5. [Phase 4: Production Hardening](#phase-4-production-hardening)
6. [Deployment Strategy](#deployment-strategy)
7. [Testing Strategy](#testing-strategy)
8. [Cost Management](#cost-management)

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           PRODUCTION ARCHITECTURE                            │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                    NEXT.JS FRONTEND (Vercel)                         │    │
│  │  ┌───────────────┐  ┌───────────────┐  ┌───────────────────────┐    │    │
│  │  │ ChatInterface │  │ TodoProgress  │  │ ArtifactsDownload     │    │    │
│  │  │ (streaming)   │  │ (real-time)   │  │ (files from state)    │    │    │
│  │  └───────────────┘  └───────────────┘  └───────────────────────┘    │    │
│  │                              │                                       │    │
│  │  ┌───────────────────────────────────────────────────────────────┐  │    │
│  │  │              API Routes (Proxy to Backend)                     │  │    │
│  │  │  /api/agents/talent-demand → Python Backend                   │  │    │
│  │  └───────────────────────────────────────────────────────────────┘  │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                      │                                       │
│                                      │ HTTPS/SSE                             │
│                                      ▼                                       │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │              PYTHON BACKEND (Railway/Render/Fly.io)                  │    │
│  │  ┌───────────────────────────────────────────────────────────────┐  │    │
│  │  │                    FastAPI + Uvicorn                           │  │    │
│  │  │  ┌─────────────────┐  ┌────────────────┐  ┌───────────────┐   │  │    │
│  │  │  │ POST /chat      │  │ GET /state     │  │ GET /health   │   │  │    │
│  │  │  │ (SSE streaming) │  │ (todos, files) │  │ (healthcheck) │   │  │    │
│  │  │  └─────────────────┘  └────────────────┘  └───────────────┘   │  │    │
│  │  └───────────────────────────────────────────────────────────────┘  │    │
│  │                              │                                       │    │
│  │  ┌───────────────────────────────────────────────────────────────┐  │    │
│  │  │              deepagents Framework                              │  │    │
│  │  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐    │  │    │
│  │  │  │ Coordinator │  │ 3 Subagents │  │ Middleware Stack    │    │  │    │
│  │  │  │ Agent       │  │ (parallel)  │  │ (todos, fs, cache)  │    │  │    │
│  │  │  └─────────────┘  └─────────────┘  └─────────────────────┘    │  │    │
│  │  └───────────────────────────────────────────────────────────────┘  │    │
│  │                              │                                       │    │
│  │  ┌───────────────────────────────────────────────────────────────┐  │    │
│  │  │              External Services                                 │  │    │
│  │  │  ┌───────────┐  ┌───────────┐  ┌───────────┐  ┌───────────┐   │  │    │
│  │  │  │ Anthropic │  │ Tavily    │  │ Exa       │  │ LangSmith │   │  │    │
│  │  │  │ (Claude)  │  │ (search)  │  │ (search)  │  │ (tracing) │   │  │    │
│  │  │  └───────────┘  └───────────┘  └───────────┘  └───────────┘   │  │    │
│  │  └───────────────────────────────────────────────────────────────┘  │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Directory Structure

```
tda-frontend/
├── app/                          # Next.js frontend (existing)
│   ├── api/
│   │   └── agents/
│   │       └── talent-demand/
│   │           └── route.ts      # Proxy to Python backend
│   ├── page.tsx                  # Chat UI
│   └── layout.tsx
│
├── backend/                      # NEW: Python backend
│   ├── pyproject.toml            # Dependencies (uv/pip)
│   ├── Dockerfile
│   ├── main.py                   # FastAPI app entry
│   ├── agent/
│   │   ├── __init__.py
│   │   ├── agent.py              # create_talent_demand_analyst()
│   │   ├── tools.py              # tavily_web_search, exa_*, read_url
│   │   ├── prompts.py            # All system prompts
│   │   └── subagents.py          # Subagent definitions
│   └── tests/
│       ├── test_tools.py
│       ├── test_agent.py
│       └── test_integration.py
│
├── docs/
│   ├── DEEPAGENTS_COMPLETE_GUIDE.md
│   ├── TALENT_DEMAND_ANALYST_SPECIFICATION.md
│   ├── IMPLEMENTATION_PLAN.md    # This file
│   └── deepagents-reference/     # Cloned repo
│
└── package.json                  # Next.js dependencies
```

---

## Phase 1: Backend Foundation

### 1.1 Initialize Python Backend

```bash
# Create backend directory
mkdir -p backend/agent backend/tests

# Initialize with uv (or pip)
cd backend
uv init
uv add deepagents fastapi uvicorn python-dotenv
uv add tavily-python exa-py httpx
uv add --dev pytest pytest-asyncio pytest-httpx
```

### 1.2 Create pyproject.toml

```toml
[project]
name = "tda-backend"
version = "0.1.0"
description = "Talent Demand Analyst - Python Backend"
requires-python = ">=3.11"
dependencies = [
    "deepagents>=0.1.0",
    "fastapi>=0.115.0",
    "uvicorn[standard]>=0.32.0",
    "python-dotenv>=1.0.0",
    "tavily-python>=0.5.0",
    "exa-py>=1.0.0",
    "httpx>=0.27.0",
]

[project.optional-dependencies]
dev = [
    "pytest>=8.0.0",
    "pytest-asyncio>=0.24.0",
    "pytest-httpx>=0.32.0",
]

[tool.pytest.ini_options]
asyncio_mode = "auto"
```

### 1.3 Create FastAPI Entry Point

```python
# backend/main.py
"""
Talent Demand Analyst - FastAPI Backend
Powered by deepagents framework
"""

import os
import json
import logging
from contextlib import asynccontextmanager
from typing import AsyncGenerator

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Import agent (lazy load to avoid startup issues)
agent = None

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Initialize agent on startup."""
    global agent
    from agent.agent import create_talent_demand_analyst
    logger.info("Initializing Talent Demand Analyst agent...")
    agent = create_talent_demand_analyst()
    logger.info("Agent initialized successfully")
    yield
    logger.info("Shutting down...")

app = FastAPI(
    title="Talent Demand Analyst API",
    description="AI-powered talent demand analysis using deepagents",
    version="2.0.0",
    lifespan=lifespan,
)

# CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "https://*.vercel.app",
        os.getenv("FRONTEND_URL", ""),
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class ChatRequest(BaseModel):
    message: str
    thread_id: str | None = None


class StateRequest(BaseModel):
    thread_id: str


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "agent_loaded": agent is not None,
        "version": "2.0.0",
    }


@app.post("/chat")
async def chat(request: ChatRequest):
    """
    Stream chat responses from the agent.
    Returns Server-Sent Events (SSE) stream.
    """
    if agent is None:
        raise HTTPException(status_code=503, detail="Agent not initialized")

    thread_id = request.thread_id or f"thread_{os.urandom(8).hex()}"

    async def generate() -> AsyncGenerator[str, None]:
        try:
            config = {"configurable": {"thread_id": thread_id}}

            # Send thread_id first
            yield f"data: {json.dumps({'type': 'thread_id', 'thread_id': thread_id})}\n\n"

            async for event in agent.astream_events(
                {"messages": [{"role": "user", "content": request.message}]},
                config=config,
                version="v2",
            ):
                event_type = event["event"]

                if event_type == "on_chat_model_stream":
                    chunk = event["data"]["chunk"]
                    if chunk.content:
                        yield f"data: {json.dumps({'type': 'token', 'content': chunk.content})}\n\n"

                elif event_type == "on_tool_start":
                    tool_name = event["name"]
                    tool_input = event.get("data", {}).get("input", {})
                    yield f"data: {json.dumps({'type': 'tool_start', 'name': tool_name, 'input': tool_input})}\n\n"

                elif event_type == "on_tool_end":
                    tool_name = event["name"]
                    tool_output = event.get("data", {}).get("output", "")
                    # Truncate large outputs for streaming
                    if isinstance(tool_output, str) and len(tool_output) > 5000:
                        tool_output = tool_output[:5000] + "... [truncated]"
                    yield f"data: {json.dumps({'type': 'tool_end', 'name': tool_name, 'output': tool_output})}\n\n"

                elif event_type == "on_chain_end" and event.get("name") == "task":
                    # Subagent completed
                    yield f"data: {json.dumps({'type': 'subagent_complete', 'data': event.get('data', {})})}\n\n"

            # Get final state for todos and files
            state = await agent.aget_state(config)
            final_state = {
                "type": "state",
                "todos": state.values.get("todos", []),
                "files": list(state.values.get("files", {}).keys()),
            }
            yield f"data: {json.dumps(final_state)}\n\n"

            yield "data: [DONE]\n\n"

        except Exception as e:
            logger.exception("Error in chat stream")
            yield f"data: {json.dumps({'type': 'error', 'error': str(e)})}\n\n"

    return StreamingResponse(
        generate(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Thread-Id": thread_id,
        },
    )


@app.post("/state")
async def get_state(request: StateRequest):
    """Get current state for a thread (todos, files)."""
    if agent is None:
        raise HTTPException(status_code=503, detail="Agent not initialized")

    try:
        config = {"configurable": {"thread_id": request.thread_id}}
        state = await agent.aget_state(config)

        return {
            "thread_id": request.thread_id,
            "todos": state.values.get("todos", []),
            "files": state.values.get("files", {}),
            "message_count": len(state.values.get("messages", [])),
        }
    except Exception as e:
        logger.exception("Error getting state")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/files/{thread_id}/{file_path:path}")
async def get_file(thread_id: str, file_path: str):
    """Download a file from agent state."""
    if agent is None:
        raise HTTPException(status_code=503, detail="Agent not initialized")

    try:
        config = {"configurable": {"thread_id": thread_id}}
        state = await agent.aget_state(config)
        files = state.values.get("files", {})

        # Normalize path
        full_path = f"/{file_path}" if not file_path.startswith("/") else file_path

        if full_path not in files:
            raise HTTPException(status_code=404, detail="File not found")

        file_data = files[full_path]
        content = "\n".join(file_data.get("content", []))

        return {
            "path": full_path,
            "content": content,
            "size": len(content),
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("Error getting file")
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=int(os.getenv("PORT", 8000)),
        reload=os.getenv("ENV", "development") == "development",
    )
```

---

## Phase 2: Agent Implementation

### 2.1 Tools with Error Handling

```python
# backend/agent/tools.py
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
    "tavily": 1.0,  # 1 second between calls
    "exa": 1.0,
}


def rate_limit(service: str):
    """Decorator to rate limit API calls."""
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            last_call = _last_call_times.get(service, 0)
            min_interval = _rate_limits.get(service, 0)
            elapsed = time.time() - last_call

            if elapsed < min_interval:
                time.sleep(min_interval - elapsed)

            _last_call_times[service] = time.time()
            return func(*args, **kwargs)
        return wrapper
    return decorator


@tool
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
    try:
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

        # Format results nicely
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

    except Exception as e:
        logger.exception(f"Tavily search error for query: {query}")
        return f"Search temporarily unavailable: {str(e)}"


@tool
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
    try:
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

    except Exception as e:
        logger.exception(f"Exa search error for query: {query}")
        return f"Search temporarily unavailable: {str(e)}"


@tool
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
    try:
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

    except Exception as e:
        logger.exception(f"LinkedIn search error for query: {query}")
        return f"LinkedIn search temporarily unavailable: {str(e)}"


@tool
@rate_limit("exa")
def read_url_content(url: str) -> str:
    """Read and extract the full content from a specific URL.
    Use after finding URLs in search results that need deeper analysis.

    Args:
        url: The URL to read

    Returns:
        Extracted text content from the page
    """
    try:
        from exa_py import Exa

        api_key = os.environ.get("EXA_API_KEY")
        if not api_key:
            return "Error: EXA_API_KEY not configured"

        client = Exa(api_key=api_key)
        results = client.get_contents([url], text={"max_characters": 15000})

        if results.results and results.results[0].text:
            return results.results[0].text
        return "Could not extract content from URL"

    except Exception as e:
        logger.exception(f"URL read error for: {url}")
        return f"Could not read URL: {str(e)}"


# Export all tools
ALL_TOOLS = [
    tavily_web_search,
    exa_web_search,
    exa_linkedin_search,
    read_url_content,
]
```

### 2.2 Agent with Checkpointer

```python
# backend/agent/agent.py
"""
Talent Demand Analyst - Main Agent Implementation
Using deepagents framework with all enhancements
"""

import os
import logging
from typing import Any

from deepagents import create_deep_agent
from langgraph.checkpoint.memory import MemorySaver

from .tools import ALL_TOOLS
from .prompts import MAIN_AGENT_PROMPT
from .subagents import SUBAGENTS

logger = logging.getLogger(__name__)

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
        checkpointer=_checkpointer,  # Enable conversation persistence
    )

    logger.info("Agent created successfully")
    return agent
```

### 2.3 Prompts Module

```python
# backend/agent/prompts.py
"""
Talent Demand Analyst - System Prompts
All prompts extracted for maintainability
"""

MAIN_AGENT_PROMPT = """
# Talent Demand Research Analyst

You are an elite Talent Demand Research Analyst specialized in conducting comprehensive,
data-driven analysis of workforce trends, skill emergence, and talent market dynamics.

## Your Mission

Conduct world-class research to identify existing and emerging trends in talent demand
and workforce dynamics. Your research should uncover actionable insights that inform
strategic workforce planning, hiring decisions, and talent development strategies.

## Research Methodology

### Step 1: Clarify Research Scope
- Understand the specific industries, roles, skills, or geographies to analyze
- Determine the time horizon (current state, 6-month outlook, multi-year trends)
- Identify the key questions to answer

### Step 2: Deploy Specialized Research Workers

You have access to three specialized research workers. **Use them in parallel** via the
`task` tool to efficiently gather comprehensive data:

1. **job_posting_analyzer** - For job market data, compensation trends, and hiring velocity
2. **skill_emergence_researcher** - For emerging skills, technology adoption, and learning trends
3. **industry_report_synthesizer** - For authoritative reports, economic data, and expert forecasts

**IMPORTANT**: Launch multiple workers simultaneously when their research is independent.
Use the `task` tool multiple times in a single response to run them in parallel.

### Step 3: Synthesize & Analyze Findings

After workers complete their research:
- **Integrate insights** across all data sources
- **Identify patterns** and correlations across different indicators
- **Quantify trends** with specific metrics and percentages
- **Assess directionality** (growing, declining, stable, emerging)
- **Highlight actionable insights** for decision-making

### Step 4: Deliver Comprehensive Results

**For chat summaries**, include:
- **Executive Summary**: 3-5 key findings at the top
- **Major Trends**: Directional insights with supporting data
- **Emerging Signals**: New patterns or early indicators
- **Quantitative Highlights**: Specific numbers, percentages, growth rates
- **Actionable Recommendations**: What these trends mean for hiring/planning
- **Sources**: Key reports and data sources cited

## Research Quality Standards

✅ **Data-Driven**: Use specific numbers, percentages, and metrics
✅ **Sourced**: Cite sources for all claims with URLs
✅ **Current**: Prioritize recent data (last 6-12 months)
✅ **Comprehensive**: Cover multiple angles and data sources
✅ **Actionable**: Translate findings into practical insights
"""


JOB_POSTING_ANALYZER_PROMPT = """
You are a specialized Job Posting Analysis expert focused on gathering and analyzing
talent demand indicators from job market data.

## Your Objectives

Analyze job posting data to identify:
- **Volume Metrics**: Posting counts, new position rates, reposting frequency, remote/hybrid ratios
- **Requirement Evolution**: New skill appearances, certification requirements, experience levels
- **Compensation Data**: Salary ranges, signing bonuses, equity, geographic differentials
- **Hiring Velocity**: Time-to-fill, offer acceptance rates, hiring freeze patterns

## Data Sources to Prioritize

- Job boards: Indeed, LinkedIn Jobs, Glassdoor, Dice, AngelList
- Salary data: Glassdoor salary reports, Levels.fyi, Payscale
- Industry reports: LinkedIn Talent Insights, Indeed Hiring Lab

## Output Format

Provide structured analysis with:
- **Key Metrics**: Quantitative data points with specific numbers
- **Trend Analysis**: Directional patterns (increasing, decreasing, stable)
- **Emerging Signals**: New requirements or patterns
- **Sources**: URLs and references for all data points

Be thorough, data-driven, and cite specific sources for all findings.
"""


SKILL_EMERGENCE_RESEARCHER_PROMPT = """
You are a specialized Skill Emergence Research expert focused on identifying and
analyzing emerging talent skills and technology adoption patterns.

## Your Objectives

Research and analyze:
- **Technology Adoption Signals**: GitHub trends, Stack Overflow activity, npm downloads
- **Learning Platform Signals**: Course enrollments, bootcamp programs, certification issuance
- **Professional Certification Data**: Test registrations, new certifications
- **Skill Evolution**: Cross-skill combinations, obsolescence indicators

## Data Sources to Prioritize

- Developer platforms: GitHub, Stack Overflow, Dev.to
- Learning platforms: Coursera, Udemy, LinkedIn Learning, Pluralsight
- Certification bodies: AWS, Microsoft, Google Cloud, CompTIA
- Industry reports: Stack Overflow Developer Survey, GitHub Octoverse

## Output Format

Provide structured analysis including:
- **Emerging Skills**: New or rapidly growing skills with adoption metrics
- **Technology Trends**: Platform and tool adoption rates
- **Learning Patterns**: Course enrollment and educational trends
- **Skill Combinations**: Common skill pairings
- **Sources**: URLs and references for all data points

Be specific with metrics, timelines, and quantitative indicators.
"""


INDUSTRY_REPORT_SYNTHESIZER_PROMPT = """
You are a specialized Industry Report Synthesis expert focused on gathering and
analyzing authoritative research from consulting firms, government agencies, and analysts.

## Your Objectives

Research and synthesize:
- **Consulting Firm Reports**: McKinsey, Gartner, Deloitte Insights, BCG, Accenture
- **Government Labor Data**: BLS, O*NET, Department of Labor projections
- **Economic Indicators**: GDP sector data, venture capital trends, M&A activity
- **Expert Forecasts**: Analyst predictions, automation impact studies

## Data Sources to Prioritize

- Consulting firms: McKinsey Global Institute, Gartner, Deloitte Insights, BCG
- Government sources: Bureau of Labor Statistics, O*NET, Federal Reserve
- Economic data: World Economic Forum, industry association reports
- Industry analysts: Forrester, IDC, CB Insights

## Output Format

Provide structured analysis including:
- **Key Report Findings**: Major insights from authoritative sources
- **Economic Indicators**: Data affecting talent demand
- **Expert Projections**: Forecasts with timeframes
- **Consensus Views**: Where multiple sources agree
- **Sources**: Full citations with URLs and publication dates

Be thorough in citing specific reports, authors, and publication dates.
"""
```

### 2.4 Subagents Definition

```python
# backend/agent/subagents.py
"""
Talent Demand Analyst - Subagent Definitions
"""

from .tools import tavily_web_search, exa_linkedin_search, read_url_content
from .prompts import (
    JOB_POSTING_ANALYZER_PROMPT,
    SKILL_EMERGENCE_RESEARCHER_PROMPT,
    INDUSTRY_REPORT_SYNTHESIZER_PROMPT,
)

SUBAGENTS = [
    {
        "name": "job_posting_analyzer",
        "description": (
            "Analyzes job posting data to identify volume metrics, requirement evolution, "
            "compensation trends, and hiring velocity across industries and roles. "
            "Use for job market indicators, salary trends, skill requirements, and demand patterns."
        ),
        "system_prompt": JOB_POSTING_ANALYZER_PROMPT,
        "tools": [tavily_web_search, exa_linkedin_search, read_url_content],
    },
    {
        "name": "skill_emergence_researcher",
        "description": (
            "Researches emerging skills, technology adoption signals, learning platform trends, "
            "and certification data. Use for understanding skill emergence indicators, "
            "technology adoption patterns, and professional development signals."
        ),
        "system_prompt": SKILL_EMERGENCE_RESEARCHER_PROMPT,
        "tools": [tavily_web_search, read_url_content],
    },
    {
        "name": "industry_report_synthesizer",
        "description": (
            "Synthesizes insights from authoritative industry reports, consulting firm research, "
            "economic data, and expert forecasts. Use for gathering McKinsey, Gartner, Deloitte, "
            "BLS, and other authoritative source insights."
        ),
        "system_prompt": INDUSTRY_REPORT_SYNTHESIZER_PROMPT,
        "tools": [tavily_web_search, read_url_content],
    },
]
```

---

## Phase 3: Frontend Integration

### 3.1 Update API Proxy Route

```typescript
// app/api/agents/talent-demand/route.ts
/**
 * Talent Demand Analyst API Proxy
 * Proxies requests to Python deepagents backend
 */

import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const maxDuration = 300; // 5 minutes

const BACKEND_URL = process.env.TDA_BACKEND_URL || 'http://localhost:8000';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userMessage, threadId } = body;

    if (!userMessage || typeof userMessage !== 'string') {
      return NextResponse.json(
        { error: 'User message is required' },
        { status: 400 }
      );
    }

    // Forward to Python backend
    const response = await fetch(`${BACKEND_URL}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: userMessage,
        thread_id: threadId,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('[TDA API] Backend error:', response.status, error);
      return NextResponse.json(
        { error: 'Backend service error' },
        { status: response.status }
      );
    }

    // Stream response through
    return new NextResponse(response.body, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'X-Thread-Id': response.headers.get('X-Thread-Id') || '',
      },
    });

  } catch (error) {
    console.error('[TDA API] Error:', error);
    return NextResponse.json(
      { error: 'Service temporarily unavailable' },
      { status: 503 }
    );
  }
}

export async function GET() {
  try {
    const response = await fetch(`${BACKEND_URL}/health`);
    const health = await response.json();
    return NextResponse.json({
      name: 'Talent Demand Analyst',
      version: '2.0.0',
      backend: health,
    });
  } catch {
    return NextResponse.json({
      name: 'Talent Demand Analyst',
      version: '2.0.0',
      backend: { status: 'unreachable' },
    });
  }
}
```

---

## Phase 4: Production Hardening

### 4.1 Error Handling Patterns

| Error Scenario | Handling |
|----------------|----------|
| Tavily API failure | Log, return "Search temporarily unavailable", continue with other tools |
| Exa API failure | Log, return error message, continue with Tavily results |
| Claude API timeout | Retry once with shorter prompt, then return partial results |
| Subagent failure | Log error, continue with other subagents, synthesize available data |
| Token limit exceeded | Trigger summarization, retry with compressed context |

### 4.2 Environment Variables

```env
# Required
ANTHROPIC_API_KEY=sk-ant-xxx
TAVILY_API_KEY=tvly-xxx
EXA_API_KEY=xxx

# Optional - Model override
AGENT_MODEL=anthropic:claude-sonnet-4-5-20250929

# Optional - LangSmith tracing
LANGCHAIN_TRACING_V2=true
LANGCHAIN_API_KEY=lsv2_pt_xxx
LANGCHAIN_PROJECT=talent-demand-analyst

# Frontend
TDA_BACKEND_URL=https://tda-backend.railway.app
```

---

## Deployment Strategy

### Option A: Railway (Recommended)

```dockerfile
# backend/Dockerfile
FROM python:3.11-slim

WORKDIR /app

# Install uv
RUN pip install uv

# Copy project files
COPY pyproject.toml .
COPY main.py .
COPY agent/ ./agent/

# Install dependencies
RUN uv pip install --system -e .

# Run server
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "$PORT"]
```

Deploy to Railway:
1. Connect GitHub repo
2. Set environment variables
3. Railway auto-detects Dockerfile

### Option B: LangGraph Cloud

Create `langgraph.json`:

```json
{
  "dependencies": ["backend"],
  "graphs": {
    "talent-demand-analyst": "./backend/agent/agent.py:create_talent_demand_analyst"
  },
  "env": ".env"
}
```

---

## Testing Strategy

### Unit Tests

```python
# backend/tests/test_tools.py
import pytest
from agent.tools import tavily_web_search, exa_web_search

@pytest.mark.asyncio
async def test_tavily_search_returns_results():
    result = tavily_web_search("AI engineer job demand 2026")
    assert "Error" not in result
    assert len(result) > 100

@pytest.mark.asyncio
async def test_tavily_handles_api_failure():
    # With invalid key, should return error message not exception
    import os
    original_key = os.environ.get("TAVILY_API_KEY")
    os.environ["TAVILY_API_KEY"] = "invalid"

    result = tavily_web_search("test query")
    assert "Error" in result or "unavailable" in result.lower()

    if original_key:
        os.environ["TAVILY_API_KEY"] = original_key
```

### Integration Tests

```python
# backend/tests/test_agent.py
import pytest
from agent.agent import create_talent_demand_analyst

@pytest.mark.asyncio
async def test_agent_responds_to_simple_query():
    agent = create_talent_demand_analyst()
    result = await agent.ainvoke({
        "messages": [{"role": "user", "content": "What skills are in demand for data engineers?"}]
    })

    messages = result.get("messages", [])
    assert len(messages) > 0

    # Should have AI response
    ai_messages = [m for m in messages if m.type == "ai"]
    assert len(ai_messages) > 0

@pytest.mark.asyncio
async def test_agent_uses_subagents():
    agent = create_talent_demand_analyst()
    result = await agent.ainvoke({
        "messages": [{"role": "user", "content": "Comprehensive analysis of AI/ML engineer demand"}]
    })

    messages = result.get("messages", [])

    # Should have tool calls (subagent invocations)
    tool_messages = [m for m in messages if m.type == "tool"]
    assert len(tool_messages) > 0, "Agent should use subagents for comprehensive queries"
```

---

## Cost Management

### Estimated Costs Per Query

| Component | Est. Tokens | Cost (Claude Sonnet) |
|-----------|-------------|---------------------|
| Main agent | ~5,000 | ~$0.075 |
| Each subagent | ~3,000 | ~$0.045 |
| 3 subagents parallel | ~9,000 | ~$0.135 |
| **Total per comprehensive query** | **~14,000** | **~$0.21** |

### Rate Limiting Strategy

```python
# Implement in FastAPI middleware
from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)

@app.post("/chat")
@limiter.limit("10/minute")  # 10 queries per minute per IP
async def chat(request: ChatRequest):
    ...
```

---

## Implementation Checklist

### Phase 1: Backend Foundation
- [ ] Create `backend/` directory structure
- [ ] Initialize Python project with uv
- [ ] Create `main.py` FastAPI entry point
- [ ] Test health endpoint locally

### Phase 2: Agent Implementation
- [ ] Implement `tools.py` with all 4 tools
- [ ] Create `prompts.py` with all system prompts
- [ ] Define `subagents.py`
- [ ] Implement `agent.py` with `create_talent_demand_analyst()`
- [ ] Test agent locally with simple query

### Phase 3: Frontend Integration
- [ ] Update API proxy route
- [ ] Test end-to-end locally (Next.js → Python → Claude)
- [ ] Update streaming chunk handling if needed

### Phase 4: Production Hardening
- [ ] Add comprehensive error handling
- [ ] Add rate limiting
- [ ] Set up LangSmith tracing
- [ ] Write unit tests
- [ ] Write integration tests

### Phase 5: Deployment
- [ ] Create Dockerfile
- [ ] Deploy backend to Railway/Render
- [ ] Update frontend environment variables
- [ ] Deploy frontend to Vercel
- [ ] Verify production works

---

*Document created: January 21, 2026*
*Ready for implementation with Claude Code*
