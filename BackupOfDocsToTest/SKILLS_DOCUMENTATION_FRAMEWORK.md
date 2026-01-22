# Skills Documentation Framework

> **Complete Guide to Pre-Development Documentation Skills**

This document provides a comprehensive guide to the 10 documentation skills installed for creating world-class pre-development documentation - the kind that enables an autonomous AI agent to build production-grade systems from scratch.

---

## Skills Summary

| Skill | Layer | Purpose | Invoke With |
|-------|-------|---------|-------------|
| `/writing-prd` | 2 | Product Requirements Document | Product features, user stories |
| `/writing-trd` | 3 | Technical Requirements Document | Technical constraints, NFRs |
| `/writing-design-doc` | 3 | Google-style Design Document | Architecture decisions, trade-offs |
| `/writing-adr` | 4 | Architecture Decision Records | Key decisions with rationale |
| `/writing-c4-architecture` | 4 | C4 Model Diagrams | System architecture visualization |
| `/writing-data-model` | 4 | Data Architecture | Database schemas, ERDs |
| `/writing-api-contract` | 4 | OpenAPI/AsyncAPI Specs | API definitions |
| `/writing-qa-plan` | 5 | Quality Assurance Plan | Test strategy, coverage |
| `/writing-runbooks` | 5 | Operational Runbooks | Incident response, maintenance |
| `/agent-handoff-prep` | 7 | Agent Handoff Package | Everything for autonomous AI |

---

## The 7-Layer Documentation Model

```
┌─────────────────────────────────────────────────────────────┐
│  LAYER 7: Agent Handoff                                     │
│  └─ /agent-handoff-prep → AGENT_HANDOFF.md                 │
├─────────────────────────────────────────────────────────────┤
│  LAYER 6: Implementation Plan                               │
│  └─ /writing-plans (existing) → Implementation tasks       │
├─────────────────────────────────────────────────────────────┤
│  LAYER 5: Quality & Operations                              │
│  ├─ /writing-qa-plan → QA strategy, test coverage          │
│  └─ /writing-runbooks → Operational procedures             │
├─────────────────────────────────────────────────────────────┤
│  LAYER 4: Architecture                                      │
│  ├─ /writing-c4-architecture → System diagrams             │
│  ├─ /writing-data-model → Database schemas                 │
│  ├─ /writing-api-contract → API specifications             │
│  └─ /writing-adr → Decision records                        │
├─────────────────────────────────────────────────────────────┤
│  LAYER 3: Technical Design                                  │
│  ├─ /writing-trd → Technical constraints                   │
│  └─ /writing-design-doc → Detailed design                  │
├─────────────────────────────────────────────────────────────┤
│  LAYER 2: Product Requirements                              │
│  └─ /writing-prd → What to build                           │
├─────────────────────────────────────────────────────────────┤
│  LAYER 1: Vision & Strategy                                 │
│  └─ /brainstorming (existing) → Initial exploration        │
└─────────────────────────────────────────────────────────────┘
```

---

## Skills Location

All skills are installed in: `C:\Users\artre\.claude\skills\`

```
~/.claude/skills/
├── writing-prd/
│   └── SKILL.md
├── writing-trd/
│   └── SKILL.md
├── writing-design-doc/
│   └── SKILL.md
├── writing-adr/
│   └── SKILL.md
├── writing-c4-architecture/
│   └── SKILL.md
├── writing-data-model/
│   └── SKILL.md
├── writing-api-contract/
│   └── SKILL.md
├── writing-qa-plan/
│   └── SKILL.md
├── writing-runbooks/
│   └── SKILL.md
└── agent-handoff-prep/
    └── SKILL.md
```

---

## Recommended Workflow

### Phase 1: Vision & Requirements (Day 1-2)

```bash
# Start with brainstorming to explore the idea
/brainstorming

# Once idea is clear, create PRD
/writing-prd
# Output: docs/requirements/YYYY-MM-DD-[feature]-prd.md
```

### Phase 2: Technical Design (Day 2-4)

```bash
# Define technical constraints from PRD
/writing-trd
# Output: docs/requirements/YYYY-MM-DD-[feature]-trd.md

# Create detailed design with alternatives
/writing-design-doc
# Output: docs/design/YYYY-MM-DD-[feature]-design.md

# Record key decisions as you make them
/writing-adr
# Output: docs/architecture/decisions/ADR-NNN-[title].md
```

### Phase 3: Architecture (Day 3-5)

```bash
# Create C4 architecture diagrams
/writing-c4-architecture
# Output: docs/architecture/c4/

# Design data model
/writing-data-model
# Output: docs/architecture/data/YYYY-MM-DD-[domain]-data-model.md

# Define API contracts
/writing-api-contract
# Output: docs/api/openapi.yaml
```

### Phase 4: Quality & Operations (Day 4-6)

```bash
# Create QA plan
/writing-qa-plan
# Output: docs/qa/YYYY-MM-DD-[feature]-qa-plan.md

# Write operational runbooks
/writing-runbooks
# Output: docs/runbooks/[category]/[runbook].md
```

### Phase 5: Implementation Prep (Day 5-7)

```bash
# Create implementation plan
/writing-plans
# Output: docs/plans/YYYY-MM-DD-[feature]-plan.md

# Package everything for agent
/agent-handoff-prep
# Output: docs/AGENT_HANDOFF.md
```

### Phase 6: Execution

```bash
# Execute plan with subagents
/subagent-driven-development
# OR
/executing-plans
```

---

## Document Dependency Graph

```mermaid
flowchart TD
    subgraph "Layer 1-2: Requirements"
        BRAIN[/brainstorming] --> PRD[/writing-prd]
    end

    subgraph "Layer 3: Technical Design"
        PRD --> TRD[/writing-trd]
        TRD --> DD[/writing-design-doc]
    end

    subgraph "Layer 4: Architecture"
        DD --> ADR[/writing-adr]
        DD --> C4[/writing-c4-architecture]
        DD --> DM[/writing-data-model]
        TRD --> API[/writing-api-contract]
    end

    subgraph "Layer 5: Quality & Ops"
        TRD --> QA[/writing-qa-plan]
        TRD --> RB[/writing-runbooks]
    end

    subgraph "Layer 6-7: Execution"
        DD --> PLAN[/writing-plans]
        PLAN --> HAND[/agent-handoff-prep]
        QA --> HAND
        RB --> HAND
        HAND --> EXEC["/executing-plans<br>/subagent-driven-development"]
    end
```

---

## Quick Reference: What Each Skill Creates

### /writing-prd
**Creates:** `docs/requirements/YYYY-MM-DD-[feature]-prd.md`
**Contains:**
- Problem statement with user personas
- User stories with acceptance criteria (Given/When/Then)
- Functional and non-functional requirements
- Success metrics and dependencies
- Out of scope definition

### /writing-trd
**Creates:** `docs/requirements/YYYY-MM-DD-[feature]-trd.md`
**Contains:**
- System requirements (hardware, software, platform)
- Performance targets (latency, throughput, concurrency)
- Security requirements (auth, encryption, compliance)
- Scalability requirements
- Integration points with protocols
- Reliability requirements (SLA, RTO, RPO)

### /writing-design-doc
**Creates:** `docs/design/YYYY-MM-DD-[feature]-design.md`
**Contains:**
- Context and scope
- Goals and non-goals
- Detailed design (architecture, data model, API)
- **Alternatives considered** (minimum 3 with trade-offs)
- Decision matrix
- Cross-cutting concerns (security, observability, testing)
- Migration and rollout plan

### /writing-adr
**Creates:** `docs/architecture/decisions/ADR-NNN-[title].md`
**Contains:**
- Context (why this decision needed)
- Decision drivers
- Options considered
- Decision outcome with rationale
- Consequences (positive, negative, neutral)
- Validation criteria

### /writing-c4-architecture
**Creates:** `docs/architecture/c4/` directory
**Contains:**
- Level 1: System Context diagram
- Level 2: Container diagram
- Level 3: Component diagrams (where needed)
- Supplementary: Deployment and dynamic diagrams
- Mermaid/PlantUML code for all diagrams

### /writing-data-model
**Creates:** `docs/architecture/data/YYYY-MM-DD-[domain]-data-model.md`
**Contains:**
- Conceptual model (business entities)
- Logical model (attributes, relationships, cardinality)
- Physical model (DDL, indexes, triggers)
- Data flows (ingestion, processing, storage)
- Data quality rules
- Migration scripts

### /writing-api-contract
**Creates:** `docs/api/openapi.yaml` (REST) or `docs/api/asyncapi.yaml` (events)
**Contains:**
- Complete OpenAPI 3.1 specification
- All endpoints with parameters and responses
- Request/response schemas with examples
- Error responses
- Authentication documentation
- Rate limiting documentation

### /writing-qa-plan
**Creates:** `docs/qa/YYYY-MM-DD-[feature]-qa-plan.md`
**Contains:**
- Test strategy (pyramid distribution)
- Test types with coverage targets
- Critical user journeys
- Test cases with priorities
- Environment matrix
- Quality gates
- Entry/exit criteria
- Defect management process

### /writing-runbooks
**Creates:** `docs/runbooks/[category]/[runbook].md`
**Contains:**
- Step-by-step procedures
- Commands with expected output
- Failure handling for each step
- Rollback procedures
- Escalation criteria
- Communication templates

### /agent-handoff-prep
**Creates:** `docs/AGENT_HANDOFF.md`
**Contains:**
- Mission and success criteria
- Document index with reading order
- Codebase context (structure, patterns, examples)
- Implementation constraints (must/must-not)
- Quality gates
- Environment setup
- Verification checklist

---

## Integration with Existing Skills

These new skills integrate with your existing workflow:

| Existing Skill | Integration Point |
|----------------|-------------------|
| `/brainstorming` | Precedes `/writing-prd` for idea exploration |
| `/writing-plans` | Follows `/writing-design-doc`, creates implementation tasks |
| `/executing-plans` | Follows `/agent-handoff-prep`, executes in batches |
| `/subagent-driven-development` | Alternative execution with fresh subagents |
| `/test-driven-development` | Used during implementation |
| `/verification-before-completion` | Used before marking tasks complete |
| `/finishing-a-development-branch` | Used after implementation complete |

---

## Full Documentation Flow Example

For a new feature "User Analytics Dashboard":

```
1. /brainstorming
   → Explore requirements, make design decisions
   → Output: Initial design validated

2. /writing-prd
   → docs/requirements/2026-01-21-analytics-dashboard-prd.md
   → User stories, acceptance criteria

3. /writing-trd
   → docs/requirements/2026-01-21-analytics-dashboard-trd.md
   → Performance: < 2s dashboard load
   → Security: RBAC for data access

4. /writing-design-doc
   → docs/design/2026-01-21-analytics-dashboard-design.md
   → Architecture: React + FastAPI + TimescaleDB
   → Alternatives: Grafana, Metabase, Custom

5. /writing-adr
   → docs/architecture/decisions/ADR-015-timescaledb-for-analytics.md
   → Decision: Use TimescaleDB over InfluxDB

6. /writing-c4-architecture
   → docs/architecture/c4/analytics/
   → Context, Container, Component diagrams

7. /writing-data-model
   → docs/architecture/data/2026-01-21-analytics-data-model.md
   → Event schema, aggregation tables

8. /writing-api-contract
   → docs/api/analytics-openapi.yaml
   → GET /analytics/dashboard, /analytics/export

9. /writing-qa-plan
   → docs/qa/2026-01-21-analytics-qa-plan.md
   → Load testing for concurrent users
   → Data accuracy validation

10. /writing-runbooks
    → docs/runbooks/maintenance/analytics-data-retention.md
    → docs/runbooks/incident/analytics-slow-queries.md

11. /writing-plans
    → docs/plans/2026-01-21-analytics-dashboard-plan.md
    → Bite-sized tasks for implementation

12. /agent-handoff-prep
    → docs/AGENT_HANDOFF.md
    → Complete package for autonomous implementation

13. /subagent-driven-development OR /executing-plans
    → Implementation with quality gates
```

---

## Verification: Skills Are Working

To verify skills are installed and accessible:

```bash
# In Claude Code, try invoking a skill
/writing-prd

# You should see the skill loaded and guidance displayed
```

If a skill doesn't load, check:
1. File exists at `~/.claude/skills/[skill-name]/SKILL.md`
2. Frontmatter has valid `name` and `description`
3. Restart Claude Code session

---

## Summary

You now have a complete 7-layer documentation framework with 10 specialized skills:

| Layer | Skills | Documents Created |
|-------|--------|-------------------|
| 1 | `/brainstorming` | Initial exploration |
| 2 | `/writing-prd` | Product requirements |
| 3 | `/writing-trd`, `/writing-design-doc` | Technical design |
| 4 | `/writing-adr`, `/writing-c4-architecture`, `/writing-data-model`, `/writing-api-contract` | Architecture |
| 5 | `/writing-qa-plan`, `/writing-runbooks` | Quality & operations |
| 6 | `/writing-plans` | Implementation tasks |
| 7 | `/agent-handoff-prep` | Agent briefing |

This documentation suite provides everything an autonomous AI agent needs to build production-grade systems from scratch, following Google/Palantir-level engineering standards.

---

*Framework created: January 21, 2026*
