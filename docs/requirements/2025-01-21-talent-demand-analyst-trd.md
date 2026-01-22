# Talent Demand Analyst - Technical Requirements Document

> **Document Status:** Active
> **Version:** 1.0
> **Last Updated:** 2025-01-21
> **Source:** Reorganized from TALENT_DEMAND_ANALYST_SPECIFICATION.md, IMPLEMENTATION_PLAN.md, PRODUCTION_READINESS.md

---

## 1. Overview

This document defines the technical requirements and constraints for the Talent Demand Analyst (TDA) system. It bridges the product requirements (PRD) and the detailed design documentation.

### 1.1 System Purpose

Build a multi-agent AI system that analyzes job market data, identifies skill trends, and synthesizes industry insights through a conversational interface.

### 1.2 Technical Approach

- **Architecture:** Coordinator-subagent pattern with specialized agents
- **Backend:** Python/FastAPI with async processing
- **Frontend:** Next.js/React with streaming support
- **AI Framework:** deepagents (open-source agent orchestration)
- **LLM Provider:** Anthropic Claude (Sonnet 4.5)

---

## 2. System Architecture Requirements

### 2.1 Agent Architecture

The system employs a hierarchical multi-agent architecture:

```
┌─────────────────────────────────────────────────────────────────┐
│                     MAIN AGENT (COORDINATOR)                     │
│                                                                  │
│  Role: Orchestrates analysis, synthesizes sub-agent outputs      │
│  Model: Claude Sonnet 4.5                                        │
│  Tools: Delegates to sub-agents                                  │
└─────────────────────────────────────────────────────────────────┘
                              │
          ┌───────────────────┼───────────────────┐
          │                   │                   │
          ▼                   ▼                   ▼
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│ JOB POSTING     │  │ SKILL EMERGENCE │  │ INDUSTRY REPORT │
│ ANALYZER        │  │ RESEARCHER      │  │ SYNTHESIZER     │
│                 │  │                 │  │                 │
│ Analyzes job    │  │ Tracks emerging │  │ Synthesizes     │
│ postings for    │  │ skills and      │  │ industry        │
│ skill patterns  │  │ technologies    │  │ reports         │
│                 │  │                 │  │                 │
│ Tools:          │  │ Tools:          │  │ Tools:          │
│ - tavily_search │  │ - tavily_search │  │ - tavily_search │
│ - exa_search    │  │ - exa_search    │  │ - exa_linkedin  │
│ - read_url      │  │ - read_url      │  │ - read_url      │
└─────────────────┘  └─────────────────┘  └─────────────────┘
```

### 2.2 Agent Requirements

| Agent | Purpose | Tools Required | Model |
|-------|---------|----------------|-------|
| Main Coordinator | Query interpretation, orchestration, synthesis | Sub-agent delegation | Claude Sonnet 4.5 |
| Job Posting Analyzer | Analyze job listings for skill demand | tavily_web_search, exa_web_search, read_url_content | Claude Sonnet 4.5 |
| Skill Emergence Researcher | Identify trending technologies/skills | tavily_web_search, exa_web_search, read_url_content | Claude Sonnet 4.5 |
| Industry Report Synthesizer | Analyze industry reports and LinkedIn data | tavily_web_search, exa_linkedin_search, read_url_content | Claude Sonnet 4.5 |

### 2.3 Framework Requirements

| Requirement | Specification |
|-------------|---------------|
| Agent Framework | deepagents (>=1.0.0) |
| Observability | LangSmith integration required |
| State Management | Stateless agents, context passed per invocation |
| Error Handling | Graceful degradation on sub-agent failure |

---

## 3. API Requirements

### 3.1 External API Dependencies

#### 3.1.1 Anthropic Claude API

| Requirement | Specification |
|-------------|---------------|
| Model | claude-sonnet-4-5-20241022 |
| Max Tokens | 8192 per response |
| Temperature | 0.7 (configurable) |
| Rate Limit | Per-account limits apply |
| Authentication | API key (ANTHROPIC_API_KEY) |

#### 3.1.2 Tavily API

| Requirement | Specification |
|-------------|---------------|
| Purpose | General web search |
| Search Depth | "advanced" for comprehensive results |
| Max Results | 10 per query |
| Authentication | API key (TAVILY_API_KEY) |
| Rate Limit | Tier-dependent |

#### 3.1.3 Exa API

| Requirement | Specification |
|-------------|---------------|
| Purpose | Specialized search + LinkedIn data |
| Search Types | neural, keyword |
| Max Results | 10 per query |
| LinkedIn Capability | Job/company search via site:linkedin.com |
| Authentication | API key (EXA_API_KEY) |

### 3.2 Internal API Requirements

#### 3.2.1 REST API Endpoints

| Endpoint | Method | Purpose | Auth Required |
|----------|--------|---------|---------------|
| `/api/chat` | POST | Submit analysis query | Yes |
| `/api/chat/stream` | POST | Streaming analysis query | Yes |
| `/api/health` | GET | Health check | No |
| `/api/health/ready` | GET | Readiness check | No |

#### 3.2.2 Request/Response Requirements

| Requirement | Specification |
|-------------|---------------|
| Request Format | JSON |
| Response Format | JSON or SSE (streaming) |
| Streaming Protocol | Server-Sent Events (SSE) |
| Max Request Size | 10KB |
| Content-Type | application/json |

---

## 4. Performance Requirements

### 4.1 Latency Targets

| Metric | Target | Maximum |
|--------|--------|---------|
| Time to first token (streaming) | < 2s | 5s |
| Complete analysis (simple) | < 60s | 120s |
| Complete analysis (complex) | < 180s | 300s |
| API response (non-streaming) | < 30s | 60s |
| Health check response | < 100ms | 500ms |

### 4.2 Throughput Targets

| Metric | Target | Notes |
|--------|--------|-------|
| Concurrent analyses | 10+ | Per instance |
| Requests per minute | 100+ | Rate limited per user |
| Daily analysis capacity | 1000+ | With caching |

### 4.3 Resource Constraints

| Resource | Limit | Notes |
|----------|-------|-------|
| Memory per request | 512MB | Peak during analysis |
| CPU per request | 1 vCPU | Async I/O bound |
| Container memory | 2GB | Recommended |
| Container CPU | 2 vCPU | Recommended |

---

## 5. Reliability Requirements

### 5.1 Availability

| Metric | Target |
|--------|--------|
| Monthly uptime | 99.5% |
| Maximum unplanned downtime | 4 hours/month |
| Recovery Time Objective (RTO) | 1 hour |
| Recovery Point Objective (RPO) | N/A (stateless) |

### 5.2 Error Handling

| Scenario | Behavior |
|----------|----------|
| Sub-agent failure | Continue with available agents, note limitation |
| External API timeout | Retry with exponential backoff (3 attempts) |
| External API rate limit | Queue and retry, inform user of delay |
| LLM error | Retry once, then return graceful error |
| Invalid user input | Return validation error with guidance |

### 5.3 Circuit Breaker Requirements

| Parameter | Value |
|-----------|-------|
| Failure threshold | 5 failures in 60 seconds |
| Recovery timeout | 30 seconds |
| Half-open requests | 1 |

---

## 6. Security Requirements

### 6.1 Authentication & Authorization

| Requirement | Specification |
|-------------|---------------|
| API Authentication | API key or JWT |
| Key Storage | Environment variables only |
| Token Expiry | 24 hours (JWT) |
| Key Rotation | Manual (API keys) |

### 6.2 Input Validation

| Requirement | Specification |
|-------------|---------------|
| Query length | Max 2000 characters |
| Character set | UTF-8, sanitized |
| Injection prevention | Strip control characters, escape special chars |
| Rate limiting | 20 requests/minute per user |

### 6.3 Data Security

| Requirement | Specification |
|-------------|---------------|
| Data at rest | Not stored (stateless) |
| Data in transit | TLS 1.2+ required |
| PII handling | No PII collected by design |
| Logging | Sanitize queries before logging |

### 6.4 Secrets Management

| Secret | Storage | Rotation |
|--------|---------|----------|
| ANTHROPIC_API_KEY | Environment variable | Manual |
| TAVILY_API_KEY | Environment variable | Manual |
| EXA_API_KEY | Environment variable | Manual |
| LANGSMITH_API_KEY | Environment variable | Manual |

### 6.5 OWASP Top 10 Mapping

| OWASP Category | Risk Level | Mitigation |
|----------------|------------|------------|
| **A01: Broken Access Control** | Medium | API key authentication, rate limiting per key |
| **A02: Cryptographic Failures** | Low | TLS 1.2+ enforced, no sensitive data stored |
| **A03: Injection** | Medium | Input sanitization, parameterized LLM prompts, no SQL |
| **A04: Insecure Design** | Low | Stateless design, minimal attack surface |
| **A05: Security Misconfiguration** | Medium | Environment-based config, no defaults in code |
| **A06: Vulnerable Components** | Medium | Dependency scanning in CI, regular updates |
| **A07: Auth Failures** | Medium | API key validation, no session management |
| **A08: Data Integrity Failures** | Low | No software updates through the system |
| **A09: Logging Failures** | Low | Structured logging, query sanitization |
| **A10: SSRF** | Medium | URL allowlisting for read_url_content tool |

#### Specific Mitigations

**Injection Prevention (A03):**
```python
# Sanitize user input before LLM processing
def sanitize_query(query: str) -> str:
    # Remove control characters
    query = ''.join(c for c in query if c.isprintable() or c.isspace())
    # Limit length
    query = query[:2000]
    # No direct interpolation into prompts
    return query.strip()
```

**SSRF Prevention (A10):**
```python
# URL allowlist for content fetching
ALLOWED_DOMAINS = [
    "linkedin.com",
    "indeed.com",
    "glassdoor.com",
    # Add trusted domains
]

def validate_url(url: str) -> bool:
    parsed = urlparse(url)
    return parsed.netloc in ALLOWED_DOMAINS or not is_internal_ip(parsed.netloc)
```

---

## 7. Scalability Requirements

### 7.1 Horizontal Scaling

| Requirement | Specification |
|-------------|---------------|
| Stateless design | Required (no shared state) |
| Load balancing | Round-robin or least-connections |
| Auto-scaling trigger | CPU > 70% or memory > 80% |
| Scale-down delay | 5 minutes |
| Minimum instances | 1 |
| Maximum instances | 10 |

### 7.2 Caching Strategy

| Cache Type | TTL | Purpose |
|------------|-----|---------|
| Search result cache | 15 minutes | Reduce API calls |
| URL content cache | 1 hour | Reduce redundant fetches |
| Response cache | None | Queries are unique |

### 7.3 API Versioning Strategy

#### Version Format

```
/api/v{major}/resource
```

- **Major version** in URL path (e.g., `/api/v1/chat`)
- **Minor/patch** handled without URL change (backward compatible)

#### Versioning Rules

| Change Type | Version Impact | Example |
|-------------|----------------|---------|
| New optional field in response | No change | Add `confidence` to response |
| New optional parameter | No change | Add `max_sources` parameter |
| New endpoint | No change | Add `/api/v1/health/detailed` |
| Remove field from response | Major bump | Remove `legacy_field` |
| Change field type | Major bump | Change `count` from int to string |
| Remove endpoint | Major bump | Remove `/api/v1/legacy` |

#### Version Support Policy

| Version | Status | Support End |
|---------|--------|-------------|
| v1 | Active | - |
| v2 (future) | Planned | - |

**Deprecation Process:**
1. Announce deprecation 90 days before removal
2. Add `Deprecation` header to responses: `Deprecation: true`
3. Add `Sunset` header with removal date: `Sunset: 2026-01-01`
4. Log usage of deprecated endpoints for migration tracking

#### Implementation

```python
# Version prefix in router
api_v1 = APIRouter(prefix="/api/v1")

@api_v1.post("/chat")
async def chat_v1(request: ChatRequest) -> StreamingResponse:
    ...

# Future version
api_v2 = APIRouter(prefix="/api/v2")

@api_v2.post("/chat")
async def chat_v2(request: ChatRequestV2) -> StreamingResponse:
    ...

# Mount both
app.include_router(api_v1)
# app.include_router(api_v2)  # When ready
```

---

## 8. Observability Requirements

### 8.1 Logging

| Requirement | Specification |
|-------------|---------------|
| Format | Structured JSON |
| Levels | DEBUG, INFO, WARNING, ERROR |
| Correlation | Request ID in all logs |
| Retention | 30 days |

#### Required Log Fields

```json
{
  "timestamp": "ISO8601",
  "level": "INFO",
  "request_id": "uuid",
  "message": "string",
  "duration_ms": 123,
  "agent": "string",
  "tool": "string",
  "error": "optional"
}
```

### 8.2 Metrics

| Metric | Type | Labels |
|--------|------|--------|
| request_duration_seconds | histogram | endpoint, status |
| agent_execution_seconds | histogram | agent_name |
| tool_call_duration_seconds | histogram | tool_name |
| external_api_calls_total | counter | api_name, status |
| active_analyses | gauge | - |
| error_total | counter | error_type |

### 8.3 Tracing

| Requirement | Specification |
|-------------|---------------|
| Protocol | LangSmith traces |
| Span coverage | All agent and tool calls |
| Sampling | 100% (low volume) |
| Retention | 14 days |

### 8.4 Alerting

| Alert | Condition | Severity |
|-------|-----------|----------|
| High error rate | > 5% errors in 5 min | Critical |
| High latency | p95 > 60s for 5 min | Warning |
| External API down | 3+ failures in 1 min | Critical |
| Memory pressure | > 90% for 5 min | Warning |

---

## 9. Technology Stack

### 9.1 Backend

| Component | Technology | Version |
|-----------|------------|---------|
| Language | Python | 3.11+ |
| Web Framework | FastAPI | 0.100+ |
| Agent Framework | deepagents | 1.0+ |
| HTTP Client | httpx | 0.24+ |
| Async Runtime | asyncio | stdlib |
| Validation | Pydantic | 2.0+ |

### 9.2 Frontend

| Component | Technology | Version |
|-----------|------------|---------|
| Framework | Next.js | 14+ |
| UI Library | React | 18+ |
| Styling | Tailwind CSS | 3+ |
| State Management | React hooks | - |
| HTTP Client | fetch | native |

### 9.3 Infrastructure

| Component | Technology | Notes |
|-----------|------------|-------|
| Backend Hosting | Railway | Container platform |
| Frontend Hosting | Vercel | Next.js optimized |
| Container | Docker | Multi-stage build |
| CI/CD | GitHub Actions | Automated deployment |

---

## 10. Development Requirements

### 10.1 Environment Setup

| Requirement | Specification |
|-------------|---------------|
| Python version | 3.11+ |
| Node.js version | 18+ |
| Package manager (Python) | pip or poetry |
| Package manager (Node) | npm or yarn |

### 10.2 Required Environment Variables

```bash
# Required
ANTHROPIC_API_KEY=sk-ant-...
TAVILY_API_KEY=tvly-...
EXA_API_KEY=...

# Observability
LANGSMITH_API_KEY=...
LANGSMITH_PROJECT=talent-demand-analyst

# Optional
LOG_LEVEL=INFO
ENVIRONMENT=development
```

### 10.3 Testing Requirements

| Test Type | Coverage Target | Framework |
|-----------|-----------------|-----------|
| Unit tests | 80%+ | pytest |
| Integration tests | Critical paths | pytest |
| API tests | All endpoints | pytest + httpx |
| Frontend tests | Components | Jest + RTL |
| E2E tests | Happy paths | Playwright (future) |

---

## 11. Deployment Requirements

### 11.1 Container Specification

```dockerfile
# Base image
FROM python:3.11-slim

# Resource limits
# Memory: 2GB
# CPU: 2 cores

# Health check
HEALTHCHECK --interval=30s --timeout=10s --retries=3 \
  CMD curl -f http://localhost:8000/api/health || exit 1
```

### 11.2 Deployment Pipeline

```
┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐
│  Push   │ -> │  Test   │ -> │  Build  │ -> │ Deploy  │
│         │    │         │    │         │    │         │
│ main    │    │ pytest  │    │ Docker  │    │ Railway │
│ branch  │    │ lint    │    │ image   │    │ Vercel  │
└─────────┘    └─────────┘    └─────────┘    └─────────┘
```

### 11.3 Rollback Requirements

| Requirement | Specification |
|-------------|---------------|
| Rollback time | < 5 minutes |
| Previous versions retained | 3 |
| Rollback trigger | Manual or automated on error spike |

---

## 12. Constraints and Limitations

### 12.1 Technical Constraints

| Constraint | Impact | Mitigation |
|------------|--------|------------|
| External API rate limits | May throttle heavy usage | Caching, queuing |
| LLM context window | 200K tokens | Chunking, summarization |
| Stateless design | No conversation persistence | Future: add session store |
| Single region | Latency for distant users | Future: multi-region |

### 12.2 Known Limitations

| Limitation | Description |
|------------|-------------|
| No real-time data | Job posting data has inherent lag |
| No historical trends | MVP does not store historical data |
| English only | MVP supports English language only |
| No user accounts | All usage is anonymous in MVP |

---

## 13. Document References

| Document | Path | Relationship |
|----------|------|--------------|
| PRD | [2025-01-21-talent-demand-analyst-prd.md](./2025-01-21-talent-demand-analyst-prd.md) | Parent |
| Design Doc | [../design/2025-01-21-talent-demand-analyst-design.md](../design/2025-01-21-talent-demand-analyst-design.md) | Child |
| Original Spec | [../TALENT_DEMAND_ANALYST_SPECIFICATION.md](../TALENT_DEMAND_ANALYST_SPECIFICATION.md) | Source |
| Production Readiness | [../PRODUCTION_READINESS.md](../PRODUCTION_READINESS.md) | Source |

---

*Document created as part of 7-layer documentation reorganization. Original content preserved in source documents.*
