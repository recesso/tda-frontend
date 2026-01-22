# Talent Demand Analyst - Data Model

> **Document Status:** Active
> **Version:** 1.0
> **Last Updated:** 2025-01-21

---

## 1. Overview

The Talent Demand Analyst is a **stateless** system by design. It does not persist user data, conversations, or analysis results. All data flows through the system in real-time.

This document describes:
1. Request/Response data structures
2. Internal data models
3. External API data formats
4. Future data model considerations

---

## 2. Core Data Models

### 2.1 Request Models

#### ChatRequest

The primary input to the system.

```python
class ChatRequest(BaseModel):
    """User query for analysis."""

    message: str = Field(
        ...,
        description="Natural language query",
        max_length=2000,
        examples=["Analyze demand for ML engineers in fintech"]
    )
    conversation_id: Optional[str] = Field(
        None,
        description="Reserved for future conversation tracking"
    )
```

```typescript
// TypeScript equivalent
interface ChatRequest {
  message: string;          // Max 2000 chars
  conversation_id?: string; // Future use
}
```

### 2.2 Response Models

#### StreamEvent (Union Type)

Events streamed from the server during analysis.

```python
class TokenEvent(BaseModel):
    """Streaming text token."""
    type: Literal["token"] = "token"
    content: str

class SourceEvent(BaseModel):
    """Source citation."""
    type: Literal["source"] = "source"
    url: HttpUrl
    title: str
    snippet: Optional[str] = None

class ProgressEvent(BaseModel):
    """Analysis progress update."""
    type: Literal["progress"] = "progress"
    agent: str
    status: Literal["started", "completed", "failed"]
    message: Optional[str] = None

class DoneEvent(BaseModel):
    """Stream completion."""
    type: Literal["done"] = "done"
    total_tokens: Optional[int] = None
    duration_ms: Optional[int] = None

class ErrorEvent(BaseModel):
    """Error during analysis."""
    type: Literal["error"] = "error"
    message: str
    code: Optional[str] = None
    recoverable: bool = False

StreamEvent = Union[TokenEvent, SourceEvent, ProgressEvent, DoneEvent, ErrorEvent]
```

```typescript
// TypeScript equivalents
type StreamEvent =
  | { type: "token"; content: string }
  | { type: "source"; url: string; title: string; snippet?: string }
  | { type: "progress"; agent: string; status: "started" | "completed" | "failed"; message?: string }
  | { type: "done"; total_tokens?: number; duration_ms?: number }
  | { type: "error"; message: string; code?: string; recoverable: boolean };
```

### 2.3 Internal Models

#### AgentContext

Context passed between coordinator and sub-agents.

```python
class AgentContext(BaseModel):
    """Context for sub-agent invocation."""

    task: str = Field(..., description="Specific task for sub-agent")
    query_context: str = Field(..., description="Original user query context")
    constraints: Optional[List[str]] = Field(
        None,
        description="Any constraints or focus areas"
    )
    previous_findings: Optional[Dict[str, Any]] = Field(
        None,
        description="Findings from other sub-agents"
    )
```

#### SearchResult

Normalized search result from any API.

```python
class SearchResult(BaseModel):
    """Normalized search result."""

    title: str
    url: HttpUrl
    snippet: str
    source: Literal["tavily", "exa", "exa_linkedin"]
    score: Optional[float] = None
    published_date: Optional[datetime] = None
    domain: Optional[str] = None
```

#### AnalysisResult

Sub-agent analysis output.

```python
class AnalysisResult(BaseModel):
    """Sub-agent analysis result."""

    agent_name: str
    findings: str
    sources: List[SearchResult]
    confidence: float = Field(ge=0.0, le=1.0)
    limitations: Optional[List[str]] = None
    duration_ms: int
```

---

## 3. External API Data Formats

### 3.1 Tavily API

#### Request

```json
{
  "query": "ML engineer jobs fintech 2025",
  "search_depth": "advanced",
  "max_results": 10,
  "include_answer": false,
  "include_raw_content": false
}
```

#### Response

```json
{
  "results": [
    {
      "title": "ML Engineer - Fintech Startup",
      "url": "https://example.com/job/123",
      "content": "We are looking for an ML engineer...",
      "score": 0.95,
      "published_date": "2025-01-15"
    }
  ]
}
```

### 3.2 Exa API

#### Request

```json
{
  "query": "emerging skills artificial intelligence 2025",
  "type": "neural",
  "num_results": 10,
  "use_autoprompt": true,
  "include_domains": ["linkedin.com"]  // Optional
}
```

#### Response

```json
{
  "results": [
    {
      "title": "AI Skills in Demand for 2025",
      "url": "https://example.com/article",
      "text": "The most in-demand AI skills...",
      "score": 0.89,
      "author": "John Doe",
      "published_date": "2025-01-10"
    }
  ]
}
```

### 3.3 Anthropic Claude API

#### Request (Simplified)

```json
{
  "model": "claude-sonnet-4-5-20241022",
  "max_tokens": 8192,
  "messages": [
    {
      "role": "system",
      "content": "You are the Talent Demand Analyst..."
    },
    {
      "role": "user",
      "content": "Analyze demand for ML engineers in fintech"
    }
  ],
  "stream": true
}
```

#### Response (Streaming)

```json
{"type": "content_block_delta", "delta": {"type": "text_delta", "text": "Based on "}}
{"type": "content_block_delta", "delta": {"type": "text_delta", "text": "my analysis"}}
{"type": "message_stop"}
```

---

## 4. Data Flow Diagrams

### 4.1 Request Processing

```
User Query
    │
    ▼
┌─────────────────────────────────────┐
│           ChatRequest               │
│  {message: "...", conversation_id}  │
└─────────────────────────────────────┘
    │
    ▼ Validation
    │
┌─────────────────────────────────────┐
│          AgentContext               │
│  {task, query_context, ...}         │
└─────────────────────────────────────┘
    │
    ▼ Sub-agent Processing
    │
┌─────────────────────────────────────┐
│    List[SearchResult]               │
│  [{title, url, snippet, ...}]       │
└─────────────────────────────────────┘
    │
    ▼ Analysis
    │
┌─────────────────────────────────────┐
│         AnalysisResult              │
│  {findings, sources, ...}           │
└─────────────────────────────────────┘
    │
    ▼ Synthesis & Streaming
    │
┌─────────────────────────────────────┐
│     Stream[StreamEvent]             │
│  TokenEvent | SourceEvent | ...     │
└─────────────────────────────────────┘
```

### 4.2 Multi-Agent Data Flow

```
                    ┌─────────────────┐
                    │   Coordinator   │
                    │   AgentContext  │
                    └────────┬────────┘
                             │
         ┌───────────────────┼───────────────────┐
         │                   │                   │
         ▼                   ▼                   ▼
┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
│  Job Analyzer   │ │ Skill Research  │ │ Report Synth    │
│                 │ │                 │ │                 │
│ SearchResult[]  │ │ SearchResult[]  │ │ SearchResult[]  │
│       ↓         │ │       ↓         │ │       ↓         │
│ AnalysisResult  │ │ AnalysisResult  │ │ AnalysisResult  │
└────────┬────────┘ └────────┬────────┘ └────────┬────────┘
         │                   │                   │
         └───────────────────┼───────────────────┘
                             │
                             ▼
                    ┌─────────────────┐
                    │   Coordinator   │
                    │   Synthesizes   │
                    │   All Results   │
                    └────────┬────────┘
                             │
                             ▼
                    ┌─────────────────┐
                    │  Stream Events  │
                    └─────────────────┘
```

---

## 5. Data Validation Rules

### 5.1 Input Validation

| Field | Rule | Error |
|-------|------|-------|
| message | Required, non-empty | "Message is required" |
| message | Max 2000 characters | "Message too long" |
| message | UTF-8 printable | "Invalid characters" |
| message | No injection patterns | "Invalid content" |

### 5.2 Output Validation

| Field | Rule | Default |
|-------|------|---------|
| source.url | Valid HTTP(S) URL | Omit source |
| source.title | Non-empty string | Use URL as title |
| token.content | Non-null string | Empty string |

---

## 6. Future Data Models

When the system evolves beyond stateless, these models may be needed:

### 6.1 User (Future)

```python
class User(BaseModel):
    """User account - Future."""
    id: UUID
    email: EmailStr
    created_at: datetime
    preferences: Dict[str, Any]
```

### 6.2 Conversation (Future)

```python
class Conversation(BaseModel):
    """Conversation history - Future."""
    id: UUID
    user_id: UUID
    messages: List[Message]
    created_at: datetime
    updated_at: datetime

class Message(BaseModel):
    role: Literal["user", "assistant"]
    content: str
    timestamp: datetime
    sources: Optional[List[SearchResult]]
```

### 6.3 AnalysisCache (Future)

```python
class AnalysisCache(BaseModel):
    """Cached analysis - Future."""
    query_hash: str
    result: str
    sources: List[SearchResult]
    created_at: datetime
    expires_at: datetime
```

---

## 7. Schema Versioning

The API follows semantic versioning principles:

| Version | Status | Notes |
|---------|--------|-------|
| v1 | Active | Current schema |
| v2 | Planned | Will add conversation persistence |

Breaking changes will increment the major version and be communicated via deprecation notices.

---

*Data Model Document - Part of 7-layer documentation*
