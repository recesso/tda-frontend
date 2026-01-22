# Integration Test Scenarios

> **Document Status:** Active
> **Version:** 1.0
> **Last Updated:** 2025-01-21
> **Purpose:** Concrete, executable integration test specifications

---

## Overview

This document provides detailed test scenarios with:
- Exact queries to send
- Mock responses to configure
- Expected outputs to assert
- Edge cases to verify

---

## Test Environment Setup

### Mock Configuration

```python
# tests/conftest.py
import pytest
from unittest.mock import AsyncMock, patch

@pytest.fixture
def mock_tavily_success():
    """Standard Tavily success response."""
    return {
        "results": [
            {
                "title": "ML Engineer - Fintech Startup",
                "url": "https://example.com/job/123",
                "content": "We are seeking an ML Engineer with 3+ years experience in Python, TensorFlow, and financial modeling. Experience with real-time systems preferred. Salary: $150k-200k.",
                "score": 0.95
            },
            {
                "title": "Senior Machine Learning Engineer - Banking",
                "url": "https://example.com/job/456",
                "content": "Join our AI team building fraud detection systems. Requirements: 5+ years ML, Python, Spark, AWS. Must have fintech experience.",
                "score": 0.92
            },
            {
                "title": "AI Engineer - Payment Processing",
                "url": "https://example.com/job/789",
                "content": "Build ML pipelines for payment risk assessment. Skills: Python, PyTorch, Kubernetes. Remote friendly. $180k-220k.",
                "score": 0.88
            }
        ]
    }

@pytest.fixture
def mock_exa_success():
    """Standard Exa success response."""
    return {
        "results": [
            {
                "title": "The Rise of MLOps in Finance",
                "url": "https://techblog.com/mlops-finance",
                "text": "MLOps practices are becoming essential in financial services. Companies are investing heavily in model monitoring, A/B testing frameworks, and automated retraining pipelines.",
                "score": 0.91
            },
            {
                "title": "Emerging AI Skills in 2025",
                "url": "https://research.com/ai-skills-2025",
                "text": "Key emerging skills include: LLM fine-tuning, RAG architectures, AI safety, and prompt engineering. These are seeing 40% YoY growth in job postings.",
                "score": 0.87
            }
        ]
    }

@pytest.fixture
def mock_exa_linkedin_success():
    """Standard Exa LinkedIn response."""
    return {
        "results": [
            {
                "title": "VP of Engineering at FinTechCorp - Hiring Update",
                "url": "https://linkedin.com/posts/abc123",
                "text": "Excited to announce we're expanding our ML team by 50% this year. Looking for engineers with NLP and time-series forecasting experience."
            },
            {
                "title": "Head of Talent at TechBank - 2025 Priorities",
                "url": "https://linkedin.com/posts/def456",
                "text": "Our biggest hiring challenge: finding ML engineers who understand both the tech and financial domain. Hybrid skills are premium."
            }
        ]
    }
```

---

## Scenario 1: Full Happy Path Analysis

### IT-001: Complete Multi-Agent Analysis

**Given:**
- Query: "Analyze demand for ML engineers in fintech"
- All external APIs return success responses

**Mock Configuration:**

```python
@pytest.mark.asyncio
async def test_full_analysis_happy_path(
    mock_tavily_success,
    mock_exa_success,
    mock_exa_linkedin_success
):
    """
    IT-001: Complete analysis with all sub-agents succeeding.

    GIVEN: Query "Analyze demand for ML engineers in fintech"
    AND: Tavily returns 3 job postings
    AND: Exa returns 2 trend articles
    AND: Exa LinkedIn returns 2 professional perspectives
    WHEN: Analysis is requested
    THEN: Response includes insights from all sources
    AND: Response mentions specific skills (Python, TensorFlow, etc.)
    AND: Response includes salary ranges
    AND: Sources from all sub-agents are cited
    AND: Recommendations are provided
    """
    with patch('app.tools.tavily.TavilyClient') as mock_tavily, \
         patch('app.tools.exa.Exa') as mock_exa:

        # Configure mocks
        mock_tavily.return_value.search = AsyncMock(return_value=mock_tavily_success)
        mock_exa.return_value.search = AsyncMock(
            side_effect=[mock_exa_success, mock_exa_linkedin_success]
        )

        # Execute
        response = await client.post("/api/chat", json={
            "message": "Analyze demand for ML engineers in fintech"
        })

        # Collect streamed events
        events = list(parse_sse_stream(response))

        # Assert progress events for all agents
        progress_events = [e for e in events if e["type"] == "progress"]
        assert any(e["agent"] == "job_analyzer" for e in progress_events)
        assert any(e["agent"] == "skill_researcher" for e in progress_events)
        assert any(e["agent"] == "report_synthesizer" for e in progress_events)

        # Assert content includes expected elements
        content = "".join(e["content"] for e in events if e["type"] == "token")
        assert "Python" in content
        assert "TensorFlow" in content or "PyTorch" in content
        assert "$" in content  # Salary mentioned
        assert "fintech" in content.lower()

        # Assert sources are included
        source_events = [e for e in events if e["type"] == "source"]
        assert len(source_events) >= 3  # At least one from each sub-agent

        # Assert done event
        done_event = next(e for e in events if e["type"] == "done")
        assert done_event["total_tokens"] > 0
        assert done_event["duration_ms"] > 0
```

### IT-002: Response Quality Assertions

```python
@pytest.mark.asyncio
async def test_response_quality(mock_tavily_success, mock_exa_success):
    """
    IT-002: Verify response meets quality standards.

    GIVEN: Standard successful analysis
    WHEN: Response is generated
    THEN: Response has executive summary
    AND: Response has at least 3 specific skill mentions
    AND: Response has at least 2 actionable recommendations
    AND: Response cites at least 3 sources
    """
    # ... mock setup ...

    content = await get_full_response("Analyze ML engineer demand in fintech")

    # Check structure
    assert_has_section(content, ["summary", "overview", "key findings"])
    assert_has_section(content, ["recommendation", "action", "suggest"])

    # Check skill mentions
    skill_count = count_skill_mentions(content, [
        "Python", "TensorFlow", "PyTorch", "ML", "machine learning",
        "AI", "data science", "NLP", "deep learning"
    ])
    assert skill_count >= 3

    # Check recommendations
    recommendations = extract_recommendations(content)
    assert len(recommendations) >= 2
    for rec in recommendations:
        assert len(rec) > 20  # Not just "Hire ML engineers"

    # Check source citations
    source_count = content.count("http")
    assert source_count >= 3
```

---

## Scenario 2: Partial Failure with Graceful Degradation

### IT-010: Job Analyzer Fails, Others Succeed

```python
@pytest.mark.asyncio
async def test_job_analyzer_failure_degradation(
    mock_exa_success,
    mock_exa_linkedin_success
):
    """
    IT-010: System degrades gracefully when JobAnalyzer fails.

    GIVEN: Query "Analyze ML engineers in fintech"
    AND: Tavily API returns 503 (all retries fail)
    AND: Exa APIs return success
    WHEN: Analysis is requested
    THEN: Response includes skill trends and industry reports
    AND: Response explicitly notes job posting data is unavailable
    AND: Response does NOT include salary data (from job postings)
    AND: No error event is sent (graceful degradation)
    """
    with patch('app.tools.tavily.TavilyClient') as mock_tavily, \
         patch('app.tools.exa.Exa') as mock_exa:

        # Tavily fails
        mock_tavily.return_value.search = AsyncMock(
            side_effect=HTTPError(status_code=503)
        )

        # Exa succeeds
        mock_exa.return_value.search = AsyncMock(
            side_effect=[mock_exa_success, mock_exa_linkedin_success]
        )

        events = await collect_events("Analyze ML engineers in fintech")

        # Assert job_analyzer shows failed status
        progress_events = [e for e in events if e["type"] == "progress"]
        job_analyzer_events = [e for e in progress_events if e["agent"] == "job_analyzer"]
        assert any(e["status"] == "failed" for e in job_analyzer_events)

        # Assert other agents completed
        assert any(
            e["agent"] == "skill_researcher" and e["status"] == "completed"
            for e in progress_events
        )

        # Assert content mentions limitation
        content = extract_content(events)
        assert_contains_any(content, [
            "job posting data unavailable",
            "limited job data",
            "unable to analyze job postings"
        ])

        # Assert no fatal error event
        error_events = [e for e in events if e["type"] == "error"]
        assert all(e.get("recoverable", True) for e in error_events)

        # Assert done event still sent
        assert any(e["type"] == "done" for e in events)
```

### IT-011: Two Sub-Agents Fail

```python
@pytest.mark.asyncio
async def test_two_agents_fail_strong_caveat():
    """
    IT-011: Strong caveat when 2/3 sub-agents fail.

    GIVEN: JobAnalyzer and SkillResearcher both fail
    AND: ReportSynthesizer succeeds
    WHEN: Analysis is requested
    THEN: Response includes only industry report data
    AND: Response has strong caveat about limited data
    AND: Response suggests retry
    """
    # ... mock configuration ...

    events = await collect_events("Analyze ML engineer demand")
    content = extract_content(events)

    # Assert strong caveat
    assert_contains_any(content, [
        "significantly limited",
        "based only on",
        "recommend trying again",
        "partial analysis"
    ])

    # Assert industry report content IS present
    assert "industry" in content.lower() or "report" in content.lower()
```

---

## Scenario 3: Complete Failure

### IT-020: All Sub-Agents Fail

```python
@pytest.mark.asyncio
async def test_all_agents_fail_error_response():
    """
    IT-020: Error response when all sub-agents fail.

    GIVEN: All external APIs return errors
    WHEN: Analysis is requested
    THEN: Error event is sent
    AND: Error is marked as recoverable
    AND: User-friendly message is provided
    AND: Done event is still sent
    """
    with patch_all_apis_failing():
        events = await collect_events("Analyze ML engineers")

        # Assert error event
        error_events = [e for e in events if e["type"] == "error"]
        assert len(error_events) >= 1

        error = error_events[0]
        assert error["recoverable"] == True
        assert "unavailable" in error["message"].lower() or \
               "unable" in error["message"].lower()
        assert "try again" in error["message"].lower()

        # Assert done event sent
        assert any(e["type"] == "done" for e in events)
```

### IT-021: Claude API Unavailable

```python
@pytest.mark.asyncio
async def test_claude_unavailable_fatal_error():
    """
    IT-021: Fatal error when Claude API is unavailable.

    GIVEN: Claude API returns 503 (all retries exhausted)
    WHEN: Analysis is requested
    THEN: Error event is sent immediately
    AND: Error code is SERVICE_UNAVAILABLE
    AND: retry_after is provided
    """
    with patch('anthropic.Anthropic') as mock_claude:
        mock_claude.return_value.messages.create = AsyncMock(
            side_effect=APIError(status_code=503)
        )

        events = await collect_events("Analyze ML engineers")

        error = next(e for e in events if e["type"] == "error")
        assert error["code"] == "SERVICE_UNAVAILABLE"
        assert "retry_after" in error or error["recoverable"] == True
```

---

## Scenario 4: Streaming Behavior

### IT-030: Token Streaming Order

```python
@pytest.mark.asyncio
async def test_streaming_token_order():
    """
    IT-030: Tokens stream in correct order.

    GIVEN: Successful analysis
    WHEN: Response is streamed
    THEN: Progress events come before tokens
    AND: Tokens maintain document order
    AND: Sources come after related content
    AND: Done event is last
    """
    events = await collect_events("Analyze ML engineers in fintech")

    # Find event indices
    first_progress = next(i for i, e in enumerate(events) if e["type"] == "progress")
    first_token = next(i for i, e in enumerate(events) if e["type"] == "token")
    last_done = len(events) - 1 - next(
        i for i, e in enumerate(reversed(events)) if e["type"] == "done"
    )

    # Assert order
    assert first_progress < first_token, "Progress should come before tokens"
    assert events[-1]["type"] == "done", "Done should be last"

    # Assert tokens form coherent text
    content = "".join(e["content"] for e in events if e["type"] == "token")
    assert len(content) > 100
    assert not content.startswith(" ")  # No leading space
```

### IT-031: Streaming Latency

```python
@pytest.mark.asyncio
async def test_time_to_first_token():
    """
    IT-031: First token arrives within SLA.

    GIVEN: Normal load conditions
    WHEN: Analysis is requested
    THEN: First token arrives within 5 seconds
    """
    start = time.time()

    async for event in stream_events("Analyze ML engineers"):
        if event["type"] == "token":
            time_to_first_token = time.time() - start
            break

    assert time_to_first_token < 5.0, f"First token took {time_to_first_token}s"
```

---

## Scenario 5: Input Validation

### IT-040: Empty Message Rejection

```python
@pytest.mark.asyncio
async def test_empty_message_rejected():
    """
    IT-040: Empty message returns 400 error.

    GIVEN: Empty message string
    WHEN: Request is sent
    THEN: HTTP 400 is returned
    AND: Error response includes field name
    """
    response = await client.post("/api/chat", json={"message": ""})

    assert response.status_code == 400
    body = response.json()
    assert body["error"] == "validation_error"
    assert "message" in body["message"].lower()
```

### IT-041: Oversized Message Rejection

```python
@pytest.mark.asyncio
async def test_oversized_message_rejected():
    """
    IT-041: Message over 2000 chars returns 400.

    GIVEN: Message with 2001 characters
    WHEN: Request is sent
    THEN: HTTP 400 is returned
    AND: Error includes max length info
    """
    long_message = "x" * 2001
    response = await client.post("/api/chat", json={"message": long_message})

    assert response.status_code == 400
    body = response.json()
    assert "2000" in body["message"] or "limit" in body["message"].lower()
```

---

## Scenario 6: Rate Limiting

### IT-050: Rate Limit Enforced

```python
@pytest.mark.asyncio
async def test_rate_limit_enforcement():
    """
    IT-050: Rate limiting returns 429 after threshold.

    GIVEN: 20 requests in rapid succession
    WHEN: 21st request is sent
    THEN: HTTP 429 is returned
    AND: retry_after header/field is present
    """
    # Send 20 requests (at limit)
    for _ in range(20):
        response = await client.post("/api/chat", json={"message": "test"})
        # Don't wait for full response

    # 21st request should be rate limited
    response = await client.post("/api/chat", json={"message": "test"})
    assert response.status_code == 429

    body = response.json()
    assert "retry_after" in body or "Retry-After" in response.headers
```

---

## Test Fixtures

### Mock Response Fixtures

```python
# tests/fixtures/api_responses.py

TAVILY_EMPTY_RESPONSE = {"results": []}

TAVILY_ERROR_429 = HTTPError(
    status_code=429,
    headers={"Retry-After": "60"}
)

TAVILY_ERROR_503 = HTTPError(status_code=503)

EXA_EMPTY_RESPONSE = {"results": []}

CLAUDE_RATE_LIMITED = APIError(
    status_code=429,
    message="Rate limit exceeded"
)
```

### Test Data Queries

```python
# tests/fixtures/queries.py

SIMPLE_QUERIES = [
    "Analyze ML engineer demand",
    "What skills are trending in fintech?",
    "Healthcare tech hiring trends",
]

COMPLEX_QUERIES = [
    "What emerging AI skills should we hire for in financial services over the next 2 years?",
    "Compare skill requirements for ML engineers vs data scientists in healthcare",
    "Analyze the impact of LLMs on software engineering job requirements",
]

EDGE_CASE_QUERIES = [
    "a",  # Minimum valid (1 char)
    "x" * 2000,  # Maximum valid
    "What about 日本語?",  # Unicode
    "SELECT * FROM users",  # SQL-like
]
```

---

## Running Integration Tests

```bash
# Run all integration tests
pytest tests/integration/ -v

# Run specific scenario
pytest tests/integration/test_happy_path.py::test_full_analysis_happy_path -v

# Run with coverage
pytest tests/integration/ --cov=app --cov-report=html

# Run with timing info
pytest tests/integration/ -v --durations=10
```

---

*Integration Test Scenarios - Addressing Gap 4 from expert feedback*
