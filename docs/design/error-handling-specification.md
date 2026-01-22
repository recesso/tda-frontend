# Talent Demand Analyst - Error Handling Specification

> **Document Status:** Active
> **Version:** 1.0
> **Last Updated:** 2025-01-21
> **Purpose:** Define explicit behavior for all failure scenarios

---

## 1. Error Handling Philosophy

**Principles:**
1. **Graceful degradation over hard failure** - Partial results are better than no results
2. **Transparency** - Always tell the user what data is missing
3. **Retry intelligently** - Exponential backoff with limits
4. **Fail fast for unrecoverable errors** - Don't waste user time

---

## 2. Error Classification

### 2.1 Error Categories

| Category | Description | Examples | Recovery Strategy |
|----------|-------------|----------|-------------------|
| **Transient** | Temporary failures that may resolve | Rate limits, timeouts, 503 | Retry with backoff |
| **Partial** | Some data available, some not | One API fails, others succeed | Use available data |
| **Fatal** | Cannot proceed at all | Claude API down, invalid request | Return error to user |
| **Silent** | Non-critical data missing | Optional enrichment failed | Log and continue |

### 2.2 Severity Levels

| Level | Impact | User Notification |
|-------|--------|-------------------|
| **Critical** | Analysis cannot complete | SSE error event, stop processing |
| **High** | Major data source unavailable | Caveat in response |
| **Medium** | Minor data source unavailable | Note in response |
| **Low** | Enrichment failed | Silent logging only |

---

## 3. Error Handling Matrix

### 3.1 External API Failures

| Scenario | Retry? | Max Retries | Backoff | System Behavior | User Message |
|----------|--------|-------------|---------|-----------------|--------------|
| **Tavily timeout** | Yes | 2 | 1s, 2s | Try Exa fallback | "Some job board data unavailable" |
| **Tavily 429 (rate limit)** | Yes | 3 | 30s, 60s, 120s | Queue request | "High demand, analysis may be slower" |
| **Tavily 500** | Yes | 2 | 2s, 4s | Use cached or skip | "Limited job posting data available" |
| **Tavily 503** | Yes | 2 | 5s, 10s | Use Exa only | "Primary search unavailable, using alternate source" |
| **Exa timeout** | Yes | 2 | 1s, 2s | Try Tavily fallback | None (silent fallback) |
| **Exa 429** | Yes | 3 | 30s, 60s, 120s | Queue request | "High demand, please wait" |
| **Exa LinkedIn fail** | No | 0 | - | Skip LinkedIn data | "LinkedIn data unavailable for this analysis" |
| **Claude 429** | Yes | 3 | 30s, 60s, 120s | Queue in memory | "Analysis service busy, please wait..." |
| **Claude 500** | Yes | 2 | 5s, 10s | Retry then fail | "Analysis service error, please try again" |
| **Claude 503** | Yes | 3 | 10s, 20s, 30s | Wait and retry | "Service temporarily unavailable" |

### 3.2 Sub-Agent Failures

| Scenario | System Behavior | Coordinator Action | User Message |
|----------|-----------------|-------------------|--------------|
| **JobAnalyzer fails after 2 tools succeed** | Return partial results | Use partial data | "Job analysis includes partial data" |
| **JobAnalyzer completely fails** | Skip agent | Continue with others | "Job posting analysis unavailable. Based on skill trends and industry reports..." |
| **SkillResearcher fails** | Skip agent | Continue with others | "Emerging skills data unavailable for this query" |
| **ReportSynthesizer fails** | Skip agent | Continue with others | "Industry report synthesis unavailable" |
| **All sub-agents fail** | No useful data | Return high-level response | "Unable to gather detailed data. Consider refining your query or trying again later." |
| **Sub-agent timeout (60s)** | Cancel sub-agent | Use available results | "Analysis timed out for [component]" |

### 3.3 Tool-Level Failures

| Scenario | Within Sub-Agent | System Behavior | Propagation |
|----------|------------------|-----------------|-------------|
| **tavily_search returns empty** | JobAnalyzer | Try alternate query | Continue silently |
| **exa_search invalid response** | Any | Log and skip | Return empty result |
| **read_url_content 404** | Any | Skip URL | Note source unavailable |
| **read_url_content timeout** | Any | Skip URL | Continue without |
| **URL content too large** | Any | Truncate to 10KB | Use truncated content |
| **URL content parsing fails** | Any | Skip URL | Log error, continue |

### 3.4 Validation Failures

| Scenario | HTTP Status | Error Code | User Message |
|----------|-------------|------------|--------------|
| **Empty message** | 400 | `VALIDATION_ERROR` | "Message cannot be empty" |
| **Message too long** | 400 | `VALIDATION_ERROR` | "Message exceeds 2000 character limit" |
| **Invalid characters** | 400 | `VALIDATION_ERROR` | "Message contains invalid characters" |
| **Suspected injection** | 400 | `VALIDATION_ERROR` | "Invalid message content" |
| **Missing API key** | 401 | `UNAUTHORIZED` | "API key required" |
| **Invalid API key** | 401 | `UNAUTHORIZED` | "Invalid API key" |
| **Rate limit exceeded** | 429 | `RATE_LIMITED` | "Too many requests. Please wait {retry_after} seconds" |

---

## 4. Retry Configuration

### 4.1 Exponential Backoff Parameters

```python
RETRY_CONFIG = {
    "anthropic": {
        "max_retries": 3,
        "base_delay_seconds": 10,
        "max_delay_seconds": 120,
        "exponential_base": 2,
        "jitter": True  # Add random jitter to prevent thundering herd
    },
    "tavily": {
        "max_retries": 2,
        "base_delay_seconds": 1,
        "max_delay_seconds": 30,
        "exponential_base": 2,
        "jitter": True
    },
    "exa": {
        "max_retries": 2,
        "base_delay_seconds": 1,
        "max_delay_seconds": 30,
        "exponential_base": 2,
        "jitter": True
    }
}
```

### 4.2 Retry Decision Logic

```python
def should_retry(error: Exception, attempt: int, config: dict) -> bool:
    """Determine if request should be retried."""

    # Never retry these
    if isinstance(error, (ValidationError, AuthenticationError)):
        return False

    # Always retry these (if under limit)
    if isinstance(error, (TimeoutError, ConnectionError)):
        return attempt < config["max_retries"]

    # Check HTTP status codes
    if hasattr(error, "status_code"):
        status = error.status_code

        # Client errors - don't retry (except 429)
        if 400 <= status < 500 and status != 429:
            return False

        # Rate limit - retry with longer delay
        if status == 429:
            return attempt < config["max_retries"]

        # Server errors - retry
        if 500 <= status < 600:
            return attempt < config["max_retries"]

    return False
```

---

## 5. Graceful Degradation Rules

### 5.1 Data Source Priority

When multiple sources are available, use this priority:

| Data Type | Primary | Fallback 1 | Fallback 2 | Minimum Viable |
|-----------|---------|------------|------------|----------------|
| Job postings | Tavily + Exa | Exa only | Tavily only | Either one |
| Skill trends | Tavily + Exa | Exa neural | Tavily | Any results |
| LinkedIn data | Exa LinkedIn | - | - | Optional |
| URL content | Direct fetch | - | - | Skip if fails |

### 5.2 Degradation Levels

```
LEVEL 0: Full functionality
├── All APIs responsive
├── All sub-agents succeed
└── Complete analysis returned

LEVEL 1: Minor degradation
├── One search API slow/failed
├── Fallback used transparently
└── Note in response if data limited

LEVEL 2: Partial degradation
├── One sub-agent failed completely
├── Analysis continues with 2/3 sub-agents
└── Explicit caveat about missing data

LEVEL 3: Major degradation
├── Two sub-agents failed
├── Analysis has significant gaps
└── Strong caveat, suggest retry

LEVEL 4: Critical degradation
├── All sub-agents failed OR Claude unavailable
├── Cannot provide meaningful analysis
└── Error response, suggest retry later
```

---

## 6. Error Response Formats

### 6.1 SSE Error Events

```json
// Recoverable error - can continue
{
  "type": "error",
  "message": "Some job board data unavailable",
  "code": "PARTIAL_DATA",
  "recoverable": true,
  "details": {
    "failed_source": "tavily",
    "fallback_used": "exa"
  }
}

// Fatal error - cannot continue
{
  "type": "error",
  "message": "Analysis service temporarily unavailable",
  "code": "SERVICE_UNAVAILABLE",
  "recoverable": false,
  "retry_after": 60
}
```

### 6.2 HTTP Error Responses

```json
// 400 Bad Request
{
  "error": "validation_error",
  "message": "Message exceeds 2000 character limit",
  "details": {
    "field": "message",
    "max_length": 2000,
    "actual_length": 2456
  }
}

// 429 Too Many Requests
{
  "error": "rate_limited",
  "message": "Too many requests",
  "retry_after": 60
}

// 503 Service Unavailable
{
  "error": "service_unavailable",
  "message": "Analysis service temporarily unavailable",
  "retry_after": 120
}
```

---

## 7. Error Propagation Rules

### 7.1 Tool → Sub-Agent

```python
# Within sub-agent
try:
    result = await tavily_search(query)
except TavilyError as e:
    # Log error
    logger.warning(f"Tavily search failed: {e}")

    # Try fallback if available
    if fallback_available:
        result = await exa_search(query)
    else:
        # Return partial result indicator
        result = PartialResult(
            data=None,
            error="tavily_unavailable",
            fallback_used=False
        )

# Continue with whatever data we have
return analyze_results(result)
```

### 7.2 Sub-Agent → Coordinator

```python
# Within coordinator
results = {}

for agent in [job_analyzer, skill_researcher, report_synthesizer]:
    try:
        results[agent.name] = await agent.run(context)
    except AgentError as e:
        logger.error(f"Sub-agent {agent.name} failed: {e}")
        results[agent.name] = AgentFailure(
            agent=agent.name,
            error=str(e),
            partial_data=e.partial_data if hasattr(e, 'partial_data') else None
        )

# Synthesize with available data
return synthesize(results, note_failures=True)
```

### 7.3 Coordinator → API

```python
# Within API handler
try:
    async for event in coordinator.stream(message):
        yield event
except CoordinatorError as e:
    if e.partial_results:
        # Stream partial results with caveat
        yield ErrorEvent(
            message="Analysis completed with partial data",
            code="PARTIAL_RESULTS",
            recoverable=True
        )
        for event in e.partial_results:
            yield event
    else:
        # Complete failure
        yield ErrorEvent(
            message="Unable to complete analysis",
            code="ANALYSIS_FAILED",
            recoverable=False
        )
finally:
    yield DoneEvent()
```

---

## 8. Circuit Breaker Configuration

### 8.1 Circuit Breaker States

```
CLOSED (Normal Operation)
    │
    │ failure_count >= threshold (5)
    ▼
OPEN (Rejecting Requests)
    │
    │ after recovery_timeout (30s)
    ▼
HALF-OPEN (Testing)
    │
    ├─── success → CLOSED
    │
    └─── failure → OPEN
```

### 8.2 Per-Service Configuration

```python
CIRCUIT_BREAKER_CONFIG = {
    "anthropic": {
        "failure_threshold": 5,
        "recovery_timeout_seconds": 60,
        "half_open_max_calls": 1
    },
    "tavily": {
        "failure_threshold": 5,
        "recovery_timeout_seconds": 30,
        "half_open_max_calls": 2
    },
    "exa": {
        "failure_threshold": 5,
        "recovery_timeout_seconds": 30,
        "half_open_max_calls": 2
    }
}
```

---

## 9. Logging Requirements

### 9.1 Error Logging Format

```json
{
  "timestamp": "2025-01-21T10:30:00Z",
  "level": "ERROR",
  "request_id": "req-abc123",
  "component": "tavily_tool",
  "error_type": "TimeoutError",
  "error_message": "Request timed out after 30s",
  "context": {
    "query": "ML engineer jobs fintech",
    "attempt": 2,
    "max_retries": 3
  },
  "recovery_action": "retry_with_backoff",
  "user_impact": "minor"
}
```

### 9.2 Required Log Events

| Event | Level | When |
|-------|-------|------|
| API call start | DEBUG | Every external call |
| API call success | INFO | Successful responses |
| API call retry | WARN | Each retry attempt |
| API call failure | ERROR | Final failure |
| Circuit breaker state change | WARN | Open/Close transitions |
| Graceful degradation | INFO | Using fallback |
| Sub-agent failure | ERROR | Agent cannot complete |
| Analysis failure | ERROR | Cannot return results |

---

## 10. User Communication Guidelines

### 10.1 Error Message Tone

**Do:**
- Be specific about what's unavailable
- Suggest actionable next steps
- Maintain professional, helpful tone

**Don't:**
- Use technical jargon in user messages
- Blame external services by name
- Leave user without guidance

### 10.2 Example Messages

| Scenario | Bad | Good |
|----------|-----|------|
| API down | "Tavily API returned 503" | "Some search sources are temporarily unavailable. Your analysis will use alternate data sources." |
| Timeout | "Request timed out" | "This analysis is taking longer than expected. Results may be partial." |
| Rate limit | "429 Too Many Requests" | "We're experiencing high demand. Your request will be processed shortly." |
| Partial data | "JobAnalyzer failed" | "Job posting data is limited for this query. Analysis is based on available skill trends and industry reports." |

---

*Error Handling Specification - Addressing Gap 2 from expert feedback*
