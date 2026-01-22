# Talent Demand Analyst - QA Plan

> **Document Status:** Active
> **Version:** 1.0
> **Last Updated:** 2025-01-21
> **Source:** Reorganized from PRODUCTION_READINESS.md

---

## 1. Overview

This document defines the quality assurance strategy for the Talent Demand Analyst system, including test types, coverage targets, and quality gates.

### 1.1 Quality Objectives

| Objective | Target |
|-----------|--------|
| Code Coverage (Unit) | ≥ 80% |
| Integration Test Pass Rate | 100% |
| Critical Path Coverage | 100% |
| API Contract Compliance | 100% |
| Performance Targets Met | All P0 requirements |

---

## 2. Test Strategy

### 2.1 Test Pyramid

```
                    ┌─────────┐
                    │   E2E   │  5-10 tests
                    │  Tests  │  (Happy paths)
                   ─┴─────────┴─
                 ┌───────────────┐
                 │  Integration  │  20-30 tests
                 │    Tests      │  (API, Agents)
                ─┴───────────────┴─
              ┌───────────────────────┐
              │      Unit Tests       │  100+ tests
              │  (Tools, Validation)  │  (Functions, Classes)
             ─┴───────────────────────┴─
```

### 2.2 Test Types

| Type | Scope | Tools | Count Target |
|------|-------|-------|--------------|
| Unit | Individual functions and classes | pytest | 100+ |
| Integration | API endpoints, agent workflows | pytest, httpx | 20-30 |
| Contract | API schema compliance | schemathesis | 10+ |
| Performance | Latency, throughput | locust | 5 scenarios |
| E2E | Full user flows | Playwright (future) | 5-10 |

---

## 3. Unit Testing

### 3.1 Coverage Targets

| Component | Target | Critical |
|-----------|--------|----------|
| Tools (tavily, exa, etc.) | 90% | Yes |
| Request Validation | 95% | Yes |
| Response Formatting | 85% | Yes |
| Error Handling | 90% | Yes |
| Utilities | 80% | No |

### 3.2 Unit Test Cases

#### 3.2.1 Tools Layer

| Test ID | Component | Test Case | Priority |
|---------|-----------|-----------|----------|
| UT-001 | tavily_web_search | Valid search returns results | P0 |
| UT-002 | tavily_web_search | Empty query raises error | P0 |
| UT-003 | tavily_web_search | API error handled gracefully | P0 |
| UT-004 | tavily_web_search | Rate limit triggers retry | P1 |
| UT-005 | exa_web_search | Neural search returns results | P0 |
| UT-006 | exa_web_search | Keyword search returns results | P0 |
| UT-007 | exa_linkedin_search | LinkedIn domain filter applied | P0 |
| UT-008 | read_url_content | Valid URL returns content | P0 |
| UT-009 | read_url_content | Invalid URL returns error | P0 |
| UT-010 | read_url_content | Large content truncated | P1 |
| UT-011 | read_url_content | Timeout handled | P0 |

#### 3.2.2 Validation Layer

| Test ID | Component | Test Case | Priority |
|---------|-----------|-----------|----------|
| UT-020 | ChatRequest | Valid message accepted | P0 |
| UT-021 | ChatRequest | Empty message rejected | P0 |
| UT-022 | ChatRequest | Oversized message rejected | P0 |
| UT-023 | ChatRequest | Special characters sanitized | P0 |
| UT-024 | ChatRequest | Injection patterns rejected | P1 |

#### 3.2.3 Response Formatting

| Test ID | Component | Test Case | Priority |
|---------|-----------|-----------|----------|
| UT-030 | TokenEvent | Valid token serializes | P0 |
| UT-031 | SourceEvent | Valid source serializes | P0 |
| UT-032 | SourceEvent | Invalid URL handled | P1 |
| UT-033 | ErrorEvent | Error serializes with code | P0 |

### 3.3 Mock Strategy

```python
# Example: Mocking external APIs
@pytest.fixture
def mock_tavily_client():
    with patch('app.tools.tavily.TavilyClient') as mock:
        mock.return_value.search.return_value = {
            'results': [
                {
                    'title': 'Test Result',
                    'url': 'https://example.com',
                    'content': 'Test content',
                    'score': 0.9
                }
            ]
        }
        yield mock

@pytest.fixture
def mock_anthropic():
    with patch('anthropic.Anthropic') as mock:
        # Configure streaming mock response
        yield mock
```

---

## 4. Integration Testing

### 4.1 API Integration Tests

| Test ID | Endpoint | Test Case | Priority |
|---------|----------|-----------|----------|
| IT-001 | POST /api/chat | Valid query returns stream | P0 |
| IT-002 | POST /api/chat | Empty message returns 400 | P0 |
| IT-003 | POST /api/chat | No auth returns 401 | P0 |
| IT-004 | POST /api/chat | Rate limit returns 429 | P1 |
| IT-005 | GET /api/health | Returns 200 | P0 |
| IT-006 | GET /api/health/ready | Returns checks | P0 |
| IT-007 | GET /api/health/ready | Returns 503 when API down | P1 |

### 4.2 Agent Integration Tests

| Test ID | Agent | Test Case | Priority |
|---------|-------|-----------|----------|
| IT-010 | Coordinator | Delegates to job analyzer | P0 |
| IT-011 | Coordinator | Delegates to skill researcher | P0 |
| IT-012 | Coordinator | Delegates to report synth | P0 |
| IT-013 | Coordinator | Handles sub-agent failure | P0 |
| IT-014 | Coordinator | Synthesizes multiple results | P0 |
| IT-015 | Job Analyzer | Returns skill analysis | P0 |
| IT-016 | Skill Researcher | Returns trend data | P0 |
| IT-017 | Report Synth | Returns industry insights | P0 |

### 4.3 Streaming Tests

| Test ID | Test Case | Priority |
|---------|-----------|----------|
| IT-020 | Stream starts within 3s | P0 |
| IT-021 | Tokens arrive in order | P0 |
| IT-022 | Sources included in stream | P1 |
| IT-023 | Done event terminates stream | P0 |
| IT-024 | Error event on failure | P0 |

---

## 5. Contract Testing

### 5.1 API Schema Validation

Using schemathesis to validate API against OpenAPI spec:

```bash
# Run contract tests
schemathesis run docs/api/openapi.yaml \
  --base-url http://localhost:8000 \
  --checks all
```

### 5.2 Contract Test Cases

| Test ID | Test Case | Validation |
|---------|-----------|------------|
| CT-001 | Request schema matches spec | All fields validated |
| CT-002 | Response schema matches spec | Stream events valid |
| CT-003 | Error responses match spec | Error codes present |
| CT-004 | Health response matches spec | Status field present |

---

## 6. Performance Testing

### 6.1 Performance Targets (from TRD)

| Metric | Target | Test Scenario |
|--------|--------|---------------|
| Time to first token | < 3s | Single user query |
| Simple analysis | < 60s | Basic role query |
| Complex analysis | < 180s | Multi-factor query |
| Concurrent users | 10+ | Load test |
| Throughput | 100 req/min | Sustained load |

### 6.2 Load Test Scenarios

```python
# locustfile.py
from locust import HttpUser, task, between

class TDAUser(HttpUser):
    wait_time = between(5, 15)

    @task(3)
    def simple_query(self):
        self.client.post("/api/chat", json={
            "message": "Analyze demand for software engineers"
        })

    @task(1)
    def complex_query(self):
        self.client.post("/api/chat", json={
            "message": "What emerging AI skills should we hire for in healthcare?"
        })
```

### 6.3 Performance Test Plan

| Test | Users | Duration | Success Criteria |
|------|-------|----------|------------------|
| Baseline | 1 | 5 min | Establish baseline |
| Normal Load | 10 | 15 min | p95 < 60s, 0% errors |
| Peak Load | 20 | 10 min | p95 < 120s, < 1% errors |
| Stress | 50 | 5 min | Graceful degradation |
| Soak | 10 | 1 hour | No memory leaks |

---

## 7. Quality Gates

### 7.1 Pre-Commit Gate

| Check | Tool | Threshold |
|-------|------|-----------|
| Linting | ruff | 0 errors |
| Type Check | mypy | 0 errors |
| Unit Tests | pytest | 100% pass |
| Coverage | coverage.py | ≥ 80% |

### 7.2 Pre-Deploy Gate

| Check | Threshold |
|-------|-----------|
| All unit tests pass | 100% |
| All integration tests pass | 100% |
| Contract tests pass | 100% |
| No critical security issues | 0 |
| Performance targets met | All P0 |

### 7.3 Production Gate

| Check | Threshold |
|-------|-----------|
| Smoke tests pass | 100% |
| Health check passes | 200 OK |
| Error rate (5 min) | < 1% |
| p95 latency | < 60s |

---

## 8. Test Environment

### 8.1 Local Development

```bash
# Run all tests
pytest tests/ -v

# Run with coverage
pytest tests/ --cov=app --cov-report=html

# Run specific test types
pytest tests/unit/ -v
pytest tests/integration/ -v
```

### 8.2 CI Environment

```yaml
# GitHub Actions excerpt
test:
  runs-on: ubuntu-latest
  steps:
    - uses: actions/checkout@v4
    - name: Set up Python
      uses: actions/setup-python@v5
      with:
        python-version: '3.11'
    - name: Install dependencies
      run: pip install -e ".[dev]"
    - name: Run tests
      run: pytest tests/ --cov=app --cov-fail-under=80
    - name: Run linting
      run: ruff check .
    - name: Run type check
      run: mypy app/
```

### 8.3 Test Data

| Data Type | Source | Notes |
|-----------|--------|-------|
| Mock API responses | fixtures/api_responses/ | Versioned with tests |
| Sample queries | fixtures/queries.json | Edge cases included |
| Expected outputs | fixtures/expected/ | Golden files |

---

## 9. Bug Triage

### 9.1 Severity Levels

| Severity | Description | Response Time |
|----------|-------------|---------------|
| Critical | Service down, data loss | Immediate |
| High | Major feature broken | < 4 hours |
| Medium | Feature partially broken | < 24 hours |
| Low | Minor issue, workaround exists | < 1 week |

### 9.2 Bug Report Template

```markdown
## Bug Report

**Severity:** [Critical/High/Medium/Low]
**Component:** [API/Agent/Tool/Frontend]

### Description
[What happened]

### Steps to Reproduce
1. [Step 1]
2. [Step 2]

### Expected Behavior
[What should happen]

### Actual Behavior
[What actually happened]

### Environment
- OS: [e.g., macOS 14.2]
- Python: [e.g., 3.11.5]
- Commit: [e.g., abc1234]

### Logs
```
[Relevant logs]
```
```

---

## 10. Test Schedule

### 10.1 Continuous

| Test Type | Trigger | Duration |
|-----------|---------|----------|
| Unit | Every commit | < 2 min |
| Lint/Type | Every commit | < 1 min |
| Integration | Every PR | < 5 min |

### 10.2 Periodic

| Test Type | Schedule | Duration |
|-----------|----------|----------|
| Contract | Daily | < 5 min |
| Performance (baseline) | Weekly | 30 min |
| Performance (load) | Pre-release | 1 hour |
| Security scan | Weekly | 15 min |

---

## 11. Document References

| Document | Relationship |
|----------|--------------|
| [TRD](../requirements/2025-01-21-talent-demand-analyst-trd.md) | Performance requirements |
| [Production Readiness](../PRODUCTION_READINESS.md) | Original QA content |
| [API Contract](../api/openapi.yaml) | Contract test source |

---

*QA Plan - Part of 7-layer documentation*
