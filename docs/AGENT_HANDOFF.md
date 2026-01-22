# Talent Demand Analyst - Agent Handoff Package

> **Purpose:** Complete context package for autonomous agent implementation
> **Version:** 1.0
> **Last Updated:** 2025-01-21

---

## Quick Start

```bash
# Start implementation
/executing-plans docs/plans/2025-01-21-talent-demand-analyst-implementation-plan.md

# Or use subagent-driven development
/subagent-driven-development
```

---

## 1. Project Summary

### What We're Building

An AI-powered **Talent Demand Analyst** that:
- Analyzes job posting data to identify skill demand patterns
- Tracks emerging skills and technologies
- Synthesizes industry reports into actionable insights
- Delivers analysis through a conversational chat interface

### Target Users

HR leaders, talent acquisition teams, and workforce planners who need data-driven job market intelligence.

### Success Metrics

| Metric | Target |
|--------|--------|
| Time to insight | < 5 minutes |
| Query success rate | > 95% |
| User satisfaction | > 4.0/5.0 |

---

## 2. Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        USER (Browser)                            │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│              FRONTEND (Next.js on Vercel)                        │
│              - Chat interface                                    │
│              - SSE streaming display                             │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│              BACKEND (FastAPI on Railway)                        │
│              - /api/chat endpoint                                │
│              - Request validation                                │
│              - Agent orchestration                               │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│              AGENT SYSTEM (deepagents)                           │
│                                                                  │
│  ┌─────────────┐                                                │
│  │ Coordinator │ ─────┬─────────┬─────────────┐                 │
│  └─────────────┘      │         │             │                 │
│                       ▼         ▼             ▼                 │
│               ┌─────────┐ ┌─────────┐ ┌─────────────┐          │
│               │ Job     │ │ Skill   │ │ Report      │          │
│               │ Analyzer│ │Research │ │ Synthesizer │          │
│               └─────────┘ └─────────┘ └─────────────┘          │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│              EXTERNAL APIs                                       │
│              - Anthropic (Claude Sonnet 4.5)                     │
│              - Tavily (web search)                               │
│              - Exa (neural search + LinkedIn)                    │
└─────────────────────────────────────────────────────────────────┘
```

---

## 3. Document Index

### Requirements Layer

| Document | Path | Description |
|----------|------|-------------|
| PRD | [docs/requirements/2025-01-21-talent-demand-analyst-prd.md](requirements/2025-01-21-talent-demand-analyst-prd.md) | Product requirements, user stories, acceptance criteria |
| TRD | [docs/requirements/2025-01-21-talent-demand-analyst-trd.md](requirements/2025-01-21-talent-demand-analyst-trd.md) | Technical requirements, performance targets, constraints |

### Design Layer

| Document | Path | Description |
|----------|------|-------------|
| Design Doc | [docs/design/2025-01-21-talent-demand-analyst-design.md](design/2025-01-21-talent-demand-analyst-design.md) | System design, alternatives analysis |
| Sequence Diagrams | [docs/design/sequence-diagrams.md](design/sequence-diagrams.md) | Coordinator-subagent flows, error scenarios |
| Error Handling | [docs/design/error-handling-specification.md](design/error-handling-specification.md) | Error behavior matrix, retry policies |
| Token Budget | [docs/design/token-cost-budget.md](design/token-cost-budget.md) | Token limits, cost controls, budget enforcement |

### Architecture Layer

| Document | Path | Description |
|----------|------|-------------|
| ADR-001 | [docs/architecture/decisions/ADR-001-multi-agent-architecture.md](architecture/decisions/ADR-001-multi-agent-architecture.md) | Multi-agent architecture decision |
| ADR-002 | [docs/architecture/decisions/ADR-002-agent-framework-selection.md](architecture/decisions/ADR-002-agent-framework-selection.md) | deepagents framework selection |
| ADR-003 | [docs/architecture/decisions/ADR-003-streaming-response-architecture.md](architecture/decisions/ADR-003-streaming-response-architecture.md) | SSE streaming decision |
| C4 Context | [docs/architecture/c4/01-context.md](architecture/c4/01-context.md) | System context diagram |
| C4 Container | [docs/architecture/c4/02-containers.md](architecture/c4/02-containers.md) | Container diagram |
| C4 Component | [docs/architecture/c4/03-components.md](architecture/c4/03-components.md) | Component diagram |
| Data Model | [docs/architecture/data/2025-01-21-talent-demand-analyst-data-model.md](architecture/data/2025-01-21-talent-demand-analyst-data-model.md) | Request/response schemas |
| API Contract | [docs/api/openapi.yaml](api/openapi.yaml) | OpenAPI 3.1 specification |

### Quality Layer

| Document | Path | Description |
|----------|------|-------------|
| QA Plan | [docs/qa/2025-01-21-talent-demand-analyst-qa-plan.md](qa/2025-01-21-talent-demand-analyst-qa-plan.md) | Test strategy, coverage targets |
| Integration Tests | [docs/qa/integration-test-scenarios.md](qa/integration-test-scenarios.md) | Concrete test scenarios, mock configs, assertions |
| Performance Baseline | [docs/qa/performance-baseline.md](qa/performance-baseline.md) | Reference metrics, load test results, test scripts |

### Agent Prompts

| Document | Path | Description |
|----------|------|-------------|
| Prompts README | [docs/prompts/README.md](prompts/README.md) | Prompt versioning guide, change process |
| Coordinator | [docs/prompts/coordinator.md](prompts/coordinator.md) | Main orchestrator agent prompt (v1.1.0, with edge cases) |
| Job Analyzer | [docs/prompts/job-analyzer.md](prompts/job-analyzer.md) | Job posting analyzer prompt (v1.0.0) |
| Skill Researcher | [docs/prompts/skill-researcher.md](prompts/skill-researcher.md) | Skill emergence researcher prompt (v1.0.0) |
| Report Synthesizer | [docs/prompts/report-synthesizer.md](prompts/report-synthesizer.md) | Industry report synthesizer prompt (v1.0.0) |

### Operations Layer

| Document | Path | Description |
|----------|------|-------------|
| Deploy Backend | [docs/runbooks/deployment/deploy-backend.md](runbooks/deployment/deploy-backend.md) | Railway deployment |
| Deploy Frontend | [docs/runbooks/deployment/deploy-frontend.md](runbooks/deployment/deploy-frontend.md) | Vercel deployment |
| High Error Rate | [docs/runbooks/incident-response/high-error-rate.md](runbooks/incident-response/high-error-rate.md) | Error rate incident response |
| External API Failure | [docs/runbooks/incident-response/external-api-failure.md](runbooks/incident-response/external-api-failure.md) | API failure handling |
| Rotate API Keys | [docs/runbooks/maintenance/rotate-api-keys.md](runbooks/maintenance/rotate-api-keys.md) | Key rotation procedure |

### Deployment Infrastructure Layer

| Document | Path | Description |
|----------|------|-------------|
| CI Pipeline | [.github/workflows/ci.yml](../.github/workflows/ci.yml) | Continuous integration (lint, test, security, build) |
| Backend Deploy | [.github/workflows/deploy-backend.yml](../.github/workflows/deploy-backend.yml) | Backend deployment workflow |
| Frontend Deploy | [.github/workflows/deploy-frontend.yml](../.github/workflows/deploy-frontend.yml) | Frontend deployment workflow |
| Railway Config | [backend/railway.toml](../backend/railway.toml) | Railway IaC configuration |
| Dockerfile | [backend/Dockerfile](../backend/Dockerfile) | Production container definition |
| Vercel Config | [vercel.json](../vercel.json) | Vercel configuration with security headers |
| Dependencies | [backend/pyproject.toml](../backend/pyproject.toml) | Pinned dependency inventory |
| Monitoring Setup | [docs/observability/monitoring-setup.md](observability/monitoring-setup.md) | Metrics, logging, alerting configuration |
| Threat Model | [docs/security/threat-model.md](security/threat-model.md) | STRIDE security analysis |

### Planning Process

| Document | Path | Description |
|----------|------|-------------|
| Layer 8 Recommendation | [docs/planning/layer-8-recommendation.md](planning/layer-8-recommendation.md) | Proposal to add deployment infrastructure to planning |

### Development Guide

| Document | Path | Description |
|----------|------|-------------|
| Development Guide | [docs/DEVELOPMENT.md](DEVELOPMENT.md) | Local setup, API keys, mock mode, troubleshooting |
| Glossary | [docs/GLOSSARY.md](GLOSSARY.md) | Key terms and concepts (30+ definitions) |

### Implementation Layer

| Document | Path | Description |
|----------|------|-------------|
| Implementation Plan | [docs/plans/2025-01-21-talent-demand-analyst-implementation-plan.md](plans/2025-01-21-talent-demand-analyst-implementation-plan.md) | Step-by-step implementation tasks with dependency graph |

### Original Source Documents

| Document | Path | Description |
|----------|------|-------------|
| Original Spec | [docs/TALENT_DEMAND_ANALYST_SPECIFICATION.md](TALENT_DEMAND_ANALYST_SPECIFICATION.md) | Complete agent prompts, tool code |
| Original Plan | [docs/IMPLEMENTATION_PLAN.md](IMPLEMENTATION_PLAN.md) | Original implementation details |
| Production Readiness | [docs/PRODUCTION_READINESS.md](PRODUCTION_READINESS.md) | Original production requirements |

---

## 4. Critical Constraints

### Must Follow

1. **Use deepagents framework** - Selected per ADR-002
2. **Use Claude Sonnet 4.5** - Model: `claude-sonnet-4-5-20241022`
3. **SSE streaming** - Not WebSockets, per ADR-003
4. **Stateless design** - No session persistence in MVP
5. **TDD approach** - Write tests first, then implementation

### Performance Requirements

| Metric | Target | Hard Limit |
|--------|--------|------------|
| Time to first token | < 3s | 5s |
| Complete analysis | < 60s | 180s |
| API p95 latency | < 30s | 60s |

### Security Requirements

- All API keys in environment variables only
- Input validation (max 2000 chars)
- Rate limiting (20 req/min per user)
- No PII collection

---

## 5. Tech Stack Summary

### Backend

| Component | Technology |
|-----------|------------|
| Language | Python 3.11+ |
| Framework | FastAPI |
| Agent Framework | deepagents |
| Validation | Pydantic v2 |
| HTTP Client | httpx |

### Frontend

| Component | Technology |
|-----------|------------|
| Framework | Next.js 14+ |
| UI | React 18+ |
| Styling | Tailwind CSS |

### External APIs

| API | Purpose | Criticality |
|-----|---------|-------------|
| Anthropic Claude | LLM | Critical |
| Tavily | Web search | Critical |
| Exa | Neural search + LinkedIn | Critical |
| LangSmith | Observability | Important |

### Infrastructure

| Component | Platform |
|-----------|----------|
| Backend | Railway |
| Frontend | Vercel |

---

## 6. Environment Setup

### Required Environment Variables

```bash
# LLM
ANTHROPIC_API_KEY=sk-ant-...

# Search APIs
TAVILY_API_KEY=tvly-...
EXA_API_KEY=...

# Observability
LANGSMITH_API_KEY=...
LANGSMITH_PROJECT=talent-demand-analyst

# Optional
LOG_LEVEL=INFO
ENVIRONMENT=development
```

### Local Development

See [docs/DEVELOPMENT.md](DEVELOPMENT.md) for complete setup instructions including:
- API key acquisition (Anthropic, Tavily, Exa, LangSmith)
- Mock mode for offline development
- Docker Compose configuration
- Troubleshooting guide

**Quick Start:**

```bash
# Backend
cd backend
pip install -e ".[dev]"
uvicorn app.main:app --reload

# Frontend
npm install
npm run dev
```

---

## 7. Implementation Checklist

### Phase 1: Backend Foundation
- [ ] Project setup (pyproject.toml, main.py)
- [ ] Request/response models
- [ ] Tool implementations (tavily, exa, url_reader)
- [ ] Agent implementations
- [ ] Chat endpoint with streaming

### Phase 2: Frontend
- [ ] Chat interface component
- [ ] SSE streaming handler
- [ ] Source citation display

### Phase 3: Integration
- [ ] End-to-end testing
- [ ] Performance validation

### Phase 4: Deployment
- [ ] Backend to Railway
- [ ] Frontend to Vercel
- [ ] Smoke testing

---

## 8. Quality Gates

### Before Each Commit

- [ ] All tests pass
- [ ] No lint errors (ruff)
- [ ] No type errors (mypy)
- [ ] Coverage ≥ 80%

### Before Deployment

- [ ] All integration tests pass
- [ ] Contract tests pass
- [ ] Performance targets met

### After Deployment

- [ ] Health check passes
- [ ] Smoke test passes
- [ ] Error rate < 1%

---

## 9. Key Files Reference

### Backend Structure

```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py              # FastAPI app
│   ├── api/
│   │   ├── __init__.py
│   │   └── chat.py          # Chat endpoint
│   ├── agents/
│   │   ├── __init__.py
│   │   ├── coordinator.py   # Main agent
│   │   ├── job_analyzer.py
│   │   ├── skill_researcher.py
│   │   └── report_synthesizer.py
│   ├── models/
│   │   ├── __init__.py
│   │   └── chat.py          # Pydantic models
│   └── tools/
│       ├── __init__.py
│       ├── tavily.py
│       ├── exa.py
│       └── url_reader.py
├── tests/
│   ├── test_models.py
│   ├── test_tools.py
│   └── test_integration.py
├── pyproject.toml
├── Dockerfile
└── .env.example
```

### Frontend Structure

```
app/
├── page.tsx                 # Main page
├── layout.tsx
└── globals.css
components/
├── Chat.tsx                 # Chat component
└── ...
```

---

## 10. Verification Commands

```bash
# Run all backend tests
cd backend && pytest tests/ -v --cov=app

# Type check
mypy app/

# Lint
ruff check .

# Health check (local)
curl http://localhost:8000/api/health

# Health check (production)
curl https://tda-api.railway.app/api/health

# Smoke test
curl -X POST http://localhost:8000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Analyze demand for ML engineers"}'
```

---

## 11. Ready for Implementation

This handoff package contains everything needed for autonomous implementation:

1. **Clear architecture** - Multi-agent with coordinator pattern, sequence diagrams
2. **Detailed specifications** - Versioned prompts in [docs/prompts/](prompts/)
3. **Step-by-step plan** - Bite-sized tasks with TDD and dependency graph
4. **Error handling** - Comprehensive error behavior matrix with retry policies
5. **Token budgets** - Cost controls (~$0.25 per analysis target)
6. **Quality gates** - Clear pass/fail criteria, concrete test scenarios
7. **Operational docs** - Deployment and incident runbooks
8. **Development guide** - Local setup, mock mode, troubleshooting
9. **CI/CD pipelines** - GitHub Actions for automated testing and deployment
10. **Infrastructure as Code** - Railway, Vercel, Docker configurations
11. **Security threat model** - STRIDE analysis with mitigations
12. **Observability stack** - Metrics, logging, alerting ready to deploy

### Key Documents for Implementation

| Need | Document |
|------|----------|
| Start coding | [Implementation Plan](plans/2025-01-21-talent-demand-analyst-implementation-plan.md) |
| Agent prompts | [docs/prompts/](prompts/) directory |
| Error handling | [Error Handling Spec](design/error-handling-specification.md) |
| Token limits | [Token Budget Spec](design/token-cost-budget.md) |
| Test scenarios | [Integration Tests](qa/integration-test-scenarios.md) |
| Local setup | [Development Guide](DEVELOPMENT.md) |

**Start with:**
```
/executing-plans docs/plans/2025-01-21-talent-demand-analyst-implementation-plan.md
```

---

*Agent Handoff Package - Complete documentation including deployment infrastructure layer (Updated 2025-01-21)*
