# ADR-002: Agent Framework Selection

**Status:** Accepted
**Date:** 2025-01-21
**Deciders:** System Architect
**Source:** Extracted from project context

## Context

We need to select an agent framework that supports:
1. Multi-agent orchestration
2. Tool definition and execution
3. Streaming responses
4. Observability and debugging
5. Integration with Claude API

## Decision Drivers

- LangSmith integration for agent observability
- Support for hierarchical agent patterns
- Streaming capability for real-time UX
- Active development and community
- Minimal learning curve

## Considered Options

### Option 1: LangChain/LangGraph
- Mature, widely adopted ecosystem
- Comprehensive tooling

**Pros:**
- Large community and documentation
- Many pre-built components
- LangSmith native integration

**Cons:**
- Heavy abstraction layers
- Complex for simple use cases
- Frequent breaking changes
- Large dependency footprint

### Option 2: deepagents (Chosen)
- Lightweight agent framework
- Built for LangSmith Agent Builder

**Pros:**
- Lightweight and focused
- Native LangSmith integration
- Simpler API surface
- Active development

**Cons:**
- Smaller community
- Less documentation
- Fewer pre-built tools

### Option 3: Custom Implementation
- Build agent orchestration from scratch

**Pros:**
- Full control over design
- No external dependencies
- Optimized for exact needs

**Cons:**
- Significant development effort
- No ecosystem benefits
- Need to build observability from scratch

### Option 4: CrewAI
- Multi-agent focused framework

**Pros:**
- Designed for multi-agent workflows
- Role-based agent design

**Cons:**
- Less mature than alternatives
- Different paradigm from coordinator pattern
- LangSmith integration less native

## Decision

**Chosen: Option 2 - deepagents**

deepagents provides the right balance of:
- Simplicity for our use case
- Native LangSmith integration for observability
- Flexibility for hierarchical agent patterns
- Active development aligned with LangChain ecosystem

## Consequences

### Positive
- Clean, simple API for agent definition
- Built-in streaming support
- LangSmith traces out of the box
- Low learning curve for team

### Negative
- Less community support than LangChain
- May need custom implementations for edge cases
- Dependent on continued development

### Mitigations
- Abstract agent layer to allow framework swap if needed
- Document custom implementations
- Monitor deepagents project health

## Implementation Notes

```python
from deepagents import Agent, tool

# Define tools
@tool
async def my_tool(query: str) -> str:
    """Tool description."""
    return result

# Create agent
agent = Agent(
    name="my_agent",
    model="claude-sonnet-4-5-20241022",
    system_prompt="...",
    tools=[my_tool]
)

# Run with streaming
async for event in agent.stream(query):
    yield event
```

## Related Decisions

- ADR-001: Multi-Agent Architecture Pattern
- ADR-003: Streaming Response Architecture

---

*ADR created as part of 7-layer documentation reorganization.*
