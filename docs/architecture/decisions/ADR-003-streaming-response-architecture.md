# ADR-003: Streaming Response Architecture

**Status:** Accepted
**Date:** 2025-01-21
**Deciders:** System Architect
**Source:** Extracted from IMPLEMENTATION_PLAN.md

## Context

The system needs to provide real-time feedback during analysis, which can take 1-5 minutes for complex queries. Users should see progress and partial results as they become available.

## Decision Drivers

- User experience: Avoid blank screen during long operations
- Technical simplicity: Easy to implement and debug
- Infrastructure compatibility: Works with standard proxies and CDNs
- Frontend integration: Simple to consume in React

## Considered Options

### Option 1: Polling
- Client polls server for updates

**Pros:**
- Simple server implementation
- Works with any infrastructure

**Cons:**
- Polling overhead
- Delayed updates
- Poor UX for real-time

### Option 2: WebSockets
- Bidirectional persistent connection

**Pros:**
- True real-time bidirectional
- Efficient for high-frequency updates

**Cons:**
- More complex server setup
- Proxy/load balancer challenges
- Stateful connections harder to scale
- Overkill for unidirectional streaming

### Option 3: Server-Sent Events (Chosen)
- HTTP-based unidirectional streaming

**Pros:**
- Simple HTTP-based protocol
- Works with standard infrastructure
- Built-in browser support
- Perfect for server-to-client streaming
- Auto-reconnection built in

**Cons:**
- Unidirectional only (sufficient for our case)
- Some older proxy issues (rare)
- Text-only (not binary)

### Option 4: Long Polling
- Server holds request until data available

**Pros:**
- Simple implementation
- Wide compatibility

**Cons:**
- High latency between updates
- Connection overhead
- Not ideal for streaming text

## Decision

**Chosen: Option 3 - Server-Sent Events (SSE)**

SSE provides the right balance for our use case:
- Server streams tokens as LLM generates them
- Client receives updates in real-time
- Simple HTTP infrastructure
- No need for bidirectional communication

## Event Protocol

```
Event Types:
├── token      - Streaming text content
├── source     - Source citation
├── progress   - Analysis progress indicator
├── done       - Stream complete
└── error      - Error occurred

Event Format:
data: {"type": "token", "content": "The analysis shows..."}\n\n
data: {"type": "source", "url": "https://...", "title": "..."}\n\n
data: {"type": "done"}\n\n
```

## Consequences

### Positive
- Immediate feedback on long analyses
- Simple integration with FastAPI's StreamingResponse
- Standard browser EventSource API
- Works through Cloudflare, Vercel, etc.
- Easy to debug (just HTTP)

### Negative
- Unidirectional only (can't cancel mid-stream easily)
- Text format adds parsing overhead
- Need to handle reconnection on client

### Mitigations
- Add request ID for correlation if needed to cancel
- Efficient JSON event format
- EventSource has built-in reconnection

## Implementation Notes

### Server (FastAPI)

```python
from fastapi.responses import StreamingResponse

@app.post("/api/chat")
async def chat(request: ChatRequest):
    async def generate():
        async for event in agent.stream(request.message):
            yield f"data: {json.dumps(event)}\n\n"
        yield f"data: {json.dumps({'type': 'done'})}\n\n"

    return StreamingResponse(
        generate(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive"
        }
    )
```

### Client (React)

```typescript
const response = await fetch('/api/chat', {
    method: 'POST',
    body: JSON.stringify({ message }),
    headers: { 'Content-Type': 'application/json' }
});

const reader = response.body.getReader();
const decoder = new TextDecoder();

while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const chunk = decoder.decode(value);
    // Parse SSE format
    for (const line of chunk.split('\n')) {
        if (line.startsWith('data: ')) {
            const event = JSON.parse(line.slice(6));
            handleEvent(event);
        }
    }
}
```

## Related Decisions

- ADR-001: Multi-Agent Architecture Pattern
- ADR-002: Agent Framework Selection

---

*ADR created as part of 7-layer documentation reorganization.*
