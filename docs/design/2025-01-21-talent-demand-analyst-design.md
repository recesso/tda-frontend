# Talent Demand Analyst - Design Document

> **Document Status:** Active
> **Version:** 1.0
> **Last Updated:** 2025-01-21
> **Author:** System (reorganized from existing docs)
> **Reviewers:** [Pending]

---

## 1. Context and Scope

### 1.1 Background

Organizations need data-driven insights to make strategic talent decisions. The current process involves manual research across job boards, LinkedIn, and industry reports - a time-consuming task that often yields fragmented, outdated insights.

The Talent Demand Analyst (TDA) addresses this by providing an AI-powered system that automates the collection, analysis, and synthesis of job market intelligence.

### 1.2 Goals

**Primary:**
- Enable talent leaders to get comprehensive market analysis in minutes instead of hours
- Identify emerging skills before they become mainstream hiring requirements
- Synthesize multiple data sources into actionable recommendations

**Non-Goals:**
- Building a job board or ATS
- Providing real-time salary data (beyond what's publicly available)
- Replacing human judgment in hiring decisions

### 1.3 Scope

This design covers:
- Multi-agent architecture for analysis coordination
- Tool implementations for data collection
- API design for frontend integration
- Streaming response handling

Out of scope:
- User authentication system (MVP uses API keys)
- Historical data storage and trending
- Multi-language support

---

## 2. System Overview

### 2.1 High-Level Architecture

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                              USER INTERFACE                                   │
│                                                                              │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │                         Next.js Frontend                                │ │
│  │  - Chat interface with streaming                                        │ │
│  │  - Query input and response display                                     │ │
│  │  - Source citation rendering                                            │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      │ HTTP/SSE
                                      ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│                              API LAYER                                        │
│                                                                              │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │                         FastAPI Backend                                 │ │
│  │  - /api/chat endpoint                                                   │ │
│  │  - Request validation                                                   │ │
│  │  - Streaming response handling                                          │ │
│  │  - Error handling and logging                                           │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      │ Agent Invocation
                                      ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│                            AGENT LAYER                                        │
│                                                                              │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │                    Main Agent (Coordinator)                             │ │
│  │                                                                         │ │
│  │  - Interprets user query                                                │ │
│  │  - Determines which sub-agents to invoke                                │ │
│  │  - Orchestrates analysis workflow                                       │ │
│  │  - Synthesizes final response                                           │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│                          │           │           │                           │
│              ┌───────────┘           │           └───────────┐               │
│              ▼                       ▼                       ▼               │
│  ┌────────────────────┐  ┌────────────────────┐  ┌────────────────────┐    │
│  │  Job Posting       │  │  Skill Emergence   │  │  Industry Report   │    │
│  │  Analyzer          │  │  Researcher        │  │  Synthesizer       │    │
│  │                    │  │                    │  │                    │    │
│  │  Analyzes job      │  │  Identifies        │  │  Synthesizes       │    │
│  │  listings for      │  │  emerging skills   │  │  industry          │    │
│  │  skill patterns    │  │  and tech trends   │  │  reports/LinkedIn  │    │
│  └────────────────────┘  └────────────────────┘  └────────────────────┘    │
└──────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      │ Tool Calls
                                      ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│                            TOOLS LAYER                                        │
│                                                                              │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐             │
│  │ tavily_web_     │  │ exa_web_        │  │ exa_linkedin_   │             │
│  │ search          │  │ search          │  │ search          │             │
│  │                 │  │                 │  │                 │             │
│  │ General web     │  │ Neural/keyword  │  │ LinkedIn job/   │             │
│  │ search via      │  │ search via      │  │ company search  │             │
│  │ Tavily API      │  │ Exa API         │  │ via Exa API     │             │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘             │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────┐            │
│  │ read_url_content                                            │            │
│  │                                                              │            │
│  │ Fetches and extracts content from URLs for deep analysis    │            │
│  └─────────────────────────────────────────────────────────────┘            │
└──────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      │ HTTP Requests
                                      ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│                          EXTERNAL SERVICES                                    │
│                                                                              │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐             │
│  │   Anthropic     │  │     Tavily      │  │      Exa        │             │
│  │   Claude API    │  │     API         │  │      API        │             │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘             │
└──────────────────────────────────────────────────────────────────────────────┘
```

### 2.2 Key Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Agent framework | deepagents | Open-source, LangSmith integration, familiar patterns |
| Coordinator pattern | Hierarchical | Enables specialized agents, better prompt engineering |
| Streaming | SSE | Real-time feedback, better UX for long analyses |
| Stateless design | Yes | Simpler scaling, no session management complexity |

---

## 3. Detailed Design

### 3.1 Agent Definitions

#### 3.1.1 Main Agent (Coordinator)

**Purpose:** Orchestrate the analysis workflow and synthesize results.

**System Prompt:**
```
You are the Talent Demand Analyst, an expert AI system that helps
organizations understand workforce trends and skill demands.

Your capabilities:
1. Analyze job posting data for skill demand patterns
2. Identify emerging skills and technologies
3. Synthesize industry reports and LinkedIn insights
4. Provide actionable recommendations

For each query:
1. Understand what the user is asking
2. Determine which analysis is needed
3. Invoke relevant sub-agents
4. Synthesize their findings into a coherent response
5. Provide specific, actionable recommendations

Always cite sources and be transparent about data limitations.
```

**Sub-Agents Available:**
- `job_posting_analyzer` - For job listing analysis
- `skill_emergence_researcher` - For trend identification
- `industry_report_synthesizer` - For report analysis

#### 3.1.2 Job Posting Analyzer

**Purpose:** Analyze job listings for skill patterns and demand signals.

**System Prompt:**
```
You are a specialized analyst focused on job posting analysis.

Your tasks:
1. Search for relevant job postings based on role/industry
2. Extract required skills, qualifications, and experience levels
3. Identify patterns in skill requirements
4. Note salary ranges when available
5. Identify geographic concentrations

Use the provided tools to search job boards and company pages.
Report findings with specific examples and source citations.
```

**Tools:** `tavily_web_search`, `exa_web_search`, `read_url_content`

#### 3.1.3 Skill Emergence Researcher

**Purpose:** Identify emerging skills and technologies.

**System Prompt:**
```
You are a specialized researcher focused on emerging skills and technologies.

Your tasks:
1. Search for discussions of new technologies and methodologies
2. Identify skills mentioned in "future of work" contexts
3. Track skills with accelerating mentions
4. Categorize by maturity (nascent, growing, mainstream)
5. Explain drivers of emergence (tech shifts, regulations, etc.)

Look beyond job postings to tech blogs, conference talks,
and research publications for early signals.
```

**Tools:** `tavily_web_search`, `exa_web_search`, `read_url_content`

#### 3.1.4 Industry Report Synthesizer

**Purpose:** Synthesize industry reports and professional network insights.

**System Prompt:**
```
You are a specialized analyst focused on industry intelligence.

Your tasks:
1. Find and analyze industry reports from consulting firms
2. Search LinkedIn for professional perspectives
3. Identify hiring trends from company announcements
4. Synthesize multiple sources into coherent insights
5. Note conflicting viewpoints and their sources

Prioritize recent reports (last 12 months) and cite all sources.
```

**Tools:** `tavily_web_search`, `exa_linkedin_search`, `read_url_content`

### 3.2 Tool Implementations

#### 3.2.1 tavily_web_search

```python
@tool
async def tavily_web_search(query: str, max_results: int = 10) -> str:
    """
    Search the web using Tavily API for general information.

    Args:
        query: Search query string
        max_results: Maximum number of results (default 10)

    Returns:
        Formatted search results with titles, URLs, and snippets
    """
    client = TavilyClient(api_key=os.getenv("TAVILY_API_KEY"))
    response = await client.search(
        query=query,
        search_depth="advanced",
        max_results=max_results
    )
    return format_search_results(response)
```

#### 3.2.2 exa_web_search

```python
@tool
async def exa_web_search(
    query: str,
    search_type: str = "neural",
    max_results: int = 10
) -> str:
    """
    Search using Exa's neural or keyword search.

    Args:
        query: Search query string
        search_type: "neural" for semantic, "keyword" for exact
        max_results: Maximum number of results

    Returns:
        Formatted search results
    """
    client = Exa(api_key=os.getenv("EXA_API_KEY"))
    response = await client.search(
        query=query,
        type=search_type,
        num_results=max_results,
        use_autoprompt=True
    )
    return format_exa_results(response)
```

#### 3.2.3 exa_linkedin_search

```python
@tool
async def exa_linkedin_search(query: str, max_results: int = 10) -> str:
    """
    Search LinkedIn via Exa for professional insights.

    Args:
        query: Search query (will be scoped to linkedin.com)
        max_results: Maximum number of results

    Returns:
        Formatted LinkedIn content results
    """
    client = Exa(api_key=os.getenv("EXA_API_KEY"))
    response = await client.search(
        query=query,
        include_domains=["linkedin.com"],
        num_results=max_results
    )
    return format_linkedin_results(response)
```

#### 3.2.4 read_url_content

```python
@tool
async def read_url_content(url: str) -> str:
    """
    Fetch and extract main content from a URL.

    Args:
        url: URL to fetch

    Returns:
        Extracted text content (truncated if necessary)
    """
    async with httpx.AsyncClient() as client:
        response = await client.get(url, timeout=30)
        response.raise_for_status()

    # Extract text content
    soup = BeautifulSoup(response.text, 'html.parser')
    content = extract_main_content(soup)

    # Truncate if too long
    if len(content) > 10000:
        content = content[:10000] + "...[truncated]"

    return content
```

### 3.3 API Design

#### 3.3.1 Chat Endpoint

```python
@app.post("/api/chat")
async def chat(request: ChatRequest) -> StreamingResponse:
    """
    Process a chat request and return streaming response.

    Request:
    {
        "message": "Analyze demand for ML engineers in fintech",
        "conversation_id": "optional-uuid"  // for future use
    }

    Response: Server-Sent Events stream

    Event types:
    - token: {"type": "token", "content": "..."}
    - source: {"type": "source", "url": "...", "title": "..."}
    - done: {"type": "done"}
    - error: {"type": "error", "message": "..."}
    """
    # Validate request
    if not request.message or len(request.message) > 2000:
        raise HTTPException(400, "Invalid message")

    # Create agent and run
    agent = create_talent_demand_analyst()

    async def generate():
        try:
            async for event in agent.stream(request.message):
                yield f"data: {json.dumps(event)}\n\n"
            yield f"data: {json.dumps({'type': 'done'})}\n\n"
        except Exception as e:
            yield f"data: {json.dumps({'type': 'error', 'message': str(e)})}\n\n"

    return StreamingResponse(
        generate(),
        media_type="text/event-stream"
    )
```

#### 3.3.2 Request/Response Models

```python
class ChatRequest(BaseModel):
    message: str = Field(..., max_length=2000)
    conversation_id: Optional[str] = None

class TokenEvent(BaseModel):
    type: Literal["token"] = "token"
    content: str

class SourceEvent(BaseModel):
    type: Literal["source"] = "source"
    url: str
    title: str

class DoneEvent(BaseModel):
    type: Literal["done"] = "done"

class ErrorEvent(BaseModel):
    type: Literal["error"] = "error"
    message: str
```

### 3.4 Frontend Integration

#### 3.4.1 Streaming Handler

```typescript
async function sendMessage(message: string) {
  const response = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message })
  });

  const reader = response.body?.getReader();
  const decoder = new TextDecoder();

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const chunk = decoder.decode(value);
    const lines = chunk.split('\n');

    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const event = JSON.parse(line.slice(6));
        handleEvent(event);
      }
    }
  }
}

function handleEvent(event: ChatEvent) {
  switch (event.type) {
    case 'token':
      appendToResponse(event.content);
      break;
    case 'source':
      addSource(event.url, event.title);
      break;
    case 'done':
      setLoading(false);
      break;
    case 'error':
      showError(event.message);
      break;
  }
}
```

---

## 4. Alternatives Considered

### 4.1 Single Agent vs. Multi-Agent

**Option A: Single Agent (Not Chosen)**
- One large agent with all tools
- Simpler implementation
- Harder to optimize prompts per task

**Option B: Multi-Agent Hierarchy (Chosen)**
- Coordinator + specialized sub-agents
- More complex orchestration
- Better prompt engineering per domain
- Easier to extend and test

**Decision:** Multi-agent allows specialized prompts and cleaner separation of concerns. The coordinator pattern also enables parallel execution in the future.

### 4.2 Streaming Implementation

**Option A: WebSockets**
- Bidirectional communication
- More complex setup
- Better for interactive chat

**Option B: Server-Sent Events (Chosen)**
- Simpler implementation
- HTTP-based (proxy-friendly)
- Sufficient for unidirectional streaming

**Decision:** SSE is simpler and sufficient for our use case where the user sends a query and receives a streamed response.

### 4.3 Agent Framework

**Option A: LangChain/LangGraph**
- Mature ecosystem
- Complex abstraction layers
- Heavier dependency

**Option B: deepagents (Chosen)**
- Lightweight, focused
- LangSmith integration
- Active development

**Option C: Custom Implementation**
- Full control
- More development effort
- No ecosystem benefits

**Decision:** deepagents provides the right balance of functionality and simplicity, with built-in observability through LangSmith.

---

## 5. Cross-Cutting Concerns

### 5.1 Error Handling Strategy

```
┌─────────────────────────────────────────────────────────────────┐
│                     ERROR HANDLING FLOW                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  User Request                                                    │
│       │                                                          │
│       ▼                                                          │
│  ┌─────────────────┐                                            │
│  │ Validate Input  │──── Invalid ──▶ Return 400 + guidance      │
│  └────────┬────────┘                                            │
│           │ Valid                                                │
│           ▼                                                      │
│  ┌─────────────────┐                                            │
│  │ Run Main Agent  │                                            │
│  └────────┬────────┘                                            │
│           │                                                      │
│    ┌──────┴──────┐                                              │
│    ▼             ▼                                              │
│  Success    Sub-agent fails                                     │
│    │             │                                              │
│    │             ▼                                              │
│    │        ┌─────────────────┐                                 │
│    │        │ Log error       │                                 │
│    │        │ Continue with   │                                 │
│    │        │ other agents    │                                 │
│    │        │ Note limitation │                                 │
│    │        └────────┬────────┘                                 │
│    │                 │                                          │
│    └────────┬────────┘                                          │
│             ▼                                                    │
│  ┌─────────────────┐                                            │
│  │ Stream Response │                                            │
│  │ (with caveats   │                                            │
│  │  if partial)    │                                            │
│  └─────────────────┘                                            │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 5.2 Caching Strategy

| Data Type | Cache Location | TTL | Invalidation |
|-----------|---------------|-----|--------------|
| Search results | Redis (future) | 15 min | TTL expiry |
| URL content | In-memory | 1 hour | TTL expiry |
| Agent responses | None | N/A | Each query is unique |

### 5.3 Rate Limiting

```python
# Per-user rate limits
RATE_LIMITS = {
    "requests_per_minute": 20,
    "requests_per_hour": 100,
    "concurrent_requests": 3
}

# External API rate limit handling
RETRY_CONFIG = {
    "max_retries": 3,
    "base_delay": 1.0,
    "max_delay": 30.0,
    "exponential_base": 2
}
```

---

## 6. Testing Strategy

### 6.1 Unit Tests

| Component | Test Focus |
|-----------|------------|
| Tools | API response parsing, error handling |
| Agents | Prompt formatting, tool selection |
| API | Request validation, response formatting |

### 6.2 Integration Tests

| Scenario | Test |
|----------|------|
| Full analysis flow | Query → Agent → Tools → Response |
| Streaming | SSE format, event ordering |
| Error recovery | External API failure handling |

### 6.3 Mock Strategy

```python
# Mock external APIs for testing
@pytest.fixture
def mock_tavily():
    with patch('tavily.TavilyClient') as mock:
        mock.return_value.search.return_value = SAMPLE_TAVILY_RESPONSE
        yield mock

@pytest.fixture
def mock_anthropic():
    with patch('anthropic.Anthropic') as mock:
        # Configure streaming mock
        yield mock
```

---

## 7. Monitoring and Observability

### 7.1 Key Metrics

```python
# Prometheus metrics
REQUEST_DURATION = Histogram(
    'tda_request_duration_seconds',
    'Request duration in seconds',
    ['endpoint', 'status']
)

AGENT_CALLS = Counter(
    'tda_agent_calls_total',
    'Agent invocations',
    ['agent_name', 'status']
)

EXTERNAL_API_CALLS = Counter(
    'tda_external_api_calls_total',
    'External API calls',
    ['api_name', 'status']
)
```

### 7.2 Logging Format

```json
{
  "timestamp": "2025-01-21T10:30:00Z",
  "level": "INFO",
  "request_id": "abc-123",
  "message": "Agent completed",
  "agent": "job_posting_analyzer",
  "duration_ms": 2345,
  "tools_used": ["tavily_web_search", "read_url_content"],
  "tool_calls": 3
}
```

### 7.3 LangSmith Integration

All agent runs are traced to LangSmith for:
- Prompt/response inspection
- Token usage tracking
- Latency analysis
- Error debugging

---

## 8. Security Considerations

### 8.1 Input Sanitization

```python
def sanitize_query(query: str) -> str:
    """Sanitize user input before processing."""
    # Remove control characters
    query = ''.join(c for c in query if c.isprintable() or c.isspace())

    # Limit length
    query = query[:2000]

    # Remove potential prompt injection patterns
    # (basic protection, not foolproof)
    suspicious_patterns = [
        "ignore previous instructions",
        "system prompt",
        "you are now"
    ]
    for pattern in suspicious_patterns:
        if pattern.lower() in query.lower():
            raise ValueError("Invalid query content")

    return query.strip()
```

### 8.2 API Key Protection

- All API keys stored in environment variables
- Never logged or included in responses
- Rotated on suspected compromise

---

## 9. Rollout Plan

### 9.1 Phase 1: Internal Testing
- Deploy to staging environment
- Team testing with real queries
- LangSmith monitoring enabled
- Duration: 1 week

### 9.2 Phase 2: Limited Beta
- 10-20 beta users
- Feedback collection
- Performance monitoring
- Duration: 2 weeks

### 9.3 Phase 3: General Availability
- Public launch
- Documentation published
- Support channels established

---

## 10. Document References

| Document | Relationship |
|----------|--------------|
| [PRD](../requirements/2025-01-21-talent-demand-analyst-prd.md) | Requirements source |
| [TRD](../requirements/2025-01-21-talent-demand-analyst-trd.md) | Technical constraints |
| [Original Spec](../TALENT_DEMAND_ANALYST_SPECIFICATION.md) | Implementation details |
| [ADRs](../architecture/decisions/) | Key decisions |
| [API Contract](../api/openapi.yaml) | API specification |

---

*Document created as part of 7-layer documentation reorganization.*
