# Complete Documentation Toolkit

> **The Ultimate Guide to World-Class Pre-Development Documentation**
>
> A comprehensive toolkit of 24 skills and tools that take you from initial idea to autonomous AI-driven implementation, following Google/Palantir-level engineering standards.

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [The 7-Layer Documentation Model](#2-the-7-layer-documentation-model)
3. [Complete Skills & Tools Inventory](#3-complete-skills--tools-inventory)
4. [Directory Structure & File Locations](#4-directory-structure--file-locations)
5. [Detailed Workflow: Start to Finish](#5-detailed-workflow-start-to-finish)
6. [Layer-by-Layer Guide](#6-layer-by-layer-guide)
7. [Skill Reference Cards](#7-skill-reference-cards)
8. [Quality Gates & Verification](#8-quality-gates--verification)
9. [Best Practices for World-Class Results](#9-best-practices-for-world-class-results)
10. [Quick Reference Commands](#10-quick-reference-commands)
11. [Troubleshooting & FAQ](#11-troubleshooting--faq)
12. [Appendices](#12-appendices)

---

## 1. Executive Summary

### What This Toolkit Provides

This toolkit transforms how you build software by providing:

- **24 specialized skills** for documentation and implementation
- **7-layer documentation model** ensuring nothing is missed
- **Complete workflow** from idea to production-ready code
- **Autonomous AI handoff** enabling AI agents to build systems from scratch
- **Quality gates** at every stage ensuring world-class results

### Why This Matters

Traditional development often fails because:
- Requirements are unclear or incomplete
- Technical decisions aren't documented
- Knowledge lives in people's heads, not documents
- AI agents lack sufficient context to build correctly

This toolkit solves these problems by creating comprehensive documentation that:
- Enables autonomous AI development
- Survives team changes
- Scales to enterprise complexity
- Meets Google/Palantir engineering standards

### The Core Philosophy

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│   "If an autonomous AI agent can't build your system           │
│    from your documentation alone, your documentation           │
│    isn't complete enough."                                     │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. The 7-Layer Documentation Model

### Visual Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  LAYER 7: AGENT HANDOFF                                             │   │
│  │  └─ /agent-handoff-prep → AGENT_HANDOFF.md                         │   │
│  │     Everything packaged for autonomous AI agent                     │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                    ▲                                        │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  LAYER 6: IMPLEMENTATION PLAN                                       │   │
│  │  └─ /writing-plans → Bite-sized tasks with TDD steps               │   │
│  │     Exact implementation sequence                                   │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                    ▲                                        │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  LAYER 5: QUALITY & OPERATIONS                                      │   │
│  │  ├─ /writing-qa-plan → Test strategy, coverage targets             │   │
│  │  └─ /writing-runbooks → Operational procedures                     │   │
│  │     How to test and run the system                                  │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                    ▲                                        │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  LAYER 4: ARCHITECTURE                                              │   │
│  │  ├─ /writing-adr → Architecture Decision Records                   │   │
│  │  ├─ /writing-c4-architecture → System diagrams (C4 model)          │   │
│  │  ├─ /writing-data-model → Database schemas, ERDs                   │   │
│  │  └─ /writing-api-contract → OpenAPI/AsyncAPI specifications        │   │
│  │     System structure and interfaces                                 │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                    ▲                                        │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  LAYER 3: TECHNICAL DESIGN                                          │   │
│  │  ├─ /writing-trd → Technical constraints, NFRs                     │   │
│  │  └─ /writing-design-doc → Detailed design with alternatives        │   │
│  │     How to build it technically                                     │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                    ▲                                        │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  LAYER 2: PRODUCT REQUIREMENTS                                      │   │
│  │  └─ /writing-prd → User stories, acceptance criteria               │   │
│  │     What to build and for whom                                      │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                    ▲                                        │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  LAYER 1: VISION & STRATEGY                                         │   │
│  │  └─ /brainstorming → Explore ideas, refine requirements            │   │
│  │     Why we're building this                                         │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Layer Descriptions

| Layer | Question Answered | Key Documents | Skills |
|-------|-------------------|---------------|--------|
| **1** | WHY are we building this? | Vision, Strategy | `/brainstorming` |
| **2** | WHAT are we building? | PRD, User Stories | `/writing-prd` |
| **3** | HOW will we build it technically? | TRD, Design Doc | `/writing-trd`, `/writing-design-doc` |
| **4** | WHERE do pieces fit? | ADRs, C4, Data Model, API | `/writing-adr`, `/writing-c4-architecture`, `/writing-data-model`, `/writing-api-contract` |
| **5** | HOW will we verify & run it? | QA Plan, Runbooks | `/writing-qa-plan`, `/writing-runbooks` |
| **6** | WHAT order do we build? | Implementation Plan | `/writing-plans` |
| **7** | WHO builds it (AI context)? | Agent Handoff | `/agent-handoff-prep` |

---

## 3. Complete Skills & Tools Inventory

### All 24 Skills

#### Documentation Skills (Layers 1-6)

| # | Skill | Layer | Purpose | Output |
|---|-------|-------|---------|--------|
| 1 | `/brainstorming` | 1 | Explore ideas through collaborative dialogue | Design decisions |
| 2 | `/writing-prd` | 2 | Product Requirements Document | `docs/requirements/*-prd.md` |
| 3 | `/writing-trd` | 3 | Technical Requirements Document | `docs/requirements/*-trd.md` |
| 4 | `/writing-design-doc` | 3 | Google-style design with alternatives | `docs/design/*-design.md` |
| 5 | `/writing-adr` | 4 | Architecture Decision Records | `docs/architecture/decisions/ADR-*.md` |
| 6 | `/writing-c4-architecture` | 4 | C4 model diagrams | `docs/architecture/c4/` |
| 7 | `/writing-data-model` | 4 | Database schemas, ERDs | `docs/architecture/data/*-data-model.md` |
| 8 | `/writing-api-contract` | 4 | OpenAPI/AsyncAPI specifications | `docs/api/openapi.yaml` |
| 9 | `/writing-qa-plan` | 5 | Test strategy and coverage | `docs/qa/*-qa-plan.md` |
| 10 | `/writing-runbooks` | 5 | Operational procedures | `docs/runbooks/` |
| 11 | `/writing-plans` | 6 | Bite-sized implementation tasks | `docs/plans/*-plan.md` |

#### Execution Skills (Layer 7)

| # | Skill | Purpose | When to Use |
|---|-------|---------|-------------|
| 12 | `/agent-handoff-prep` | Package docs for AI agent | After all docs complete |
| 13 | `/using-git-worktrees` | Create isolated workspace | Before implementation |
| 14 | `/executing-plans` | Execute plan in batches | Parallel session execution |
| 15 | `/subagent-driven-development` | Fresh subagent per task | Same-session execution |
| 16 | `/dispatching-parallel-agents` | Run independent tasks in parallel | Multiple independent tasks |

#### Quality Skills (Used Throughout)

| # | Skill | Purpose | When to Use |
|---|-------|---------|-------------|
| 17 | `/test-driven-development` | TDD cycle: Red → Green → Refactor | Every implementation task |
| 18 | `/systematic-debugging` | Methodical root cause analysis | When bugs occur |
| 19 | `/verification-before-completion` | Verify claims with evidence | Before any commit |
| 20 | `/requesting-code-review` | Get structured code review | Before merging |
| 21 | `/receiving-code-review` | Process feedback properly | After receiving feedback |
| 22 | `/finishing-a-development-branch` | Complete work: merge, PR, cleanup | After implementation |

#### Meta Skills

| # | Skill | Purpose | When to Use |
|---|-------|---------|-------------|
| 23 | `/writing-skills` | Create new skills | Extending the toolkit |
| 24 | `/using-superpowers` | Find and use available skills | Discovering capabilities |

### Supporting Tools

| Tool | Purpose | Example Use |
|------|---------|-------------|
| `Read` | Read files, images, PDFs | Reading existing code |
| `Write` | Create new files | Creating documentation |
| `Edit` | Modify existing files | Updating documents |
| `Glob` | Find files by pattern | `**/*.md` |
| `Grep` | Search code content | Finding patterns |
| `Bash` | Run commands, git operations | `npm test`, `git commit` |
| `Task` | Spawn specialized agents | Deep exploration |
| `WebSearch` | Search the web | Research best practices |
| `WebFetch` | Fetch web content | Pull documentation |
| `AskUserQuestion` | Clarify requirements | Gathering preferences |
| `TodoWrite` | Track tasks and progress | Progress management |
| `EnterPlanMode` | Enter planning mode | Complex implementations |

---

## 4. Directory Structure & File Locations

### Skills Directory

All skills are installed at:

```
C:\Users\artre\.claude\skills\
├── brainstorming\
│   └── SKILL.md
├── writing-prd\
│   └── SKILL.md
├── writing-trd\
│   └── SKILL.md
├── writing-design-doc\
│   └── SKILL.md
├── writing-adr\
│   └── SKILL.md
├── writing-c4-architecture\
│   └── SKILL.md
├── writing-data-model\
│   └── SKILL.md
├── writing-api-contract\
│   └── SKILL.md
├── writing-qa-plan\
│   └── SKILL.md
├── writing-runbooks\
│   └── SKILL.md
├── agent-handoff-prep\
│   └── SKILL.md
├── writing-plans\
│   └── SKILL.md
├── using-git-worktrees\
│   └── SKILL.md
├── executing-plans\
│   └── SKILL.md
├── subagent-driven-development\
│   ├── SKILL.md
│   ├── implementer-prompt.md
│   ├── spec-reviewer-prompt.md
│   └── code-quality-reviewer-prompt.md
├── dispatching-parallel-agents\
│   └── SKILL.md
├── test-driven-development\
│   ├── SKILL.md
│   └── testing-anti-patterns.md
├── systematic-debugging\
│   ├── SKILL.md
│   ├── root-cause-tracing.md
│   ├── defense-in-depth.md
│   └── condition-based-waiting.md
├── verification-before-completion\
│   └── SKILL.md
├── requesting-code-review\
│   ├── SKILL.md
│   └── code-reviewer.md
├── receiving-code-review\
│   └── SKILL.md
├── finishing-a-development-branch\
│   └── SKILL.md
├── writing-skills\
│   ├── SKILL.md
│   ├── anthropic-best-practices.md
│   ├── testing-skills-with-subagents.md
│   └── persuasion-principles.md
└── using-superpowers\
    └── SKILL.md
```

### Project Documentation Structure

When you use these skills, they create documents in this structure:

```
your-project/
├── docs/
│   ├── AGENT_HANDOFF.md                    # Layer 7: Agent briefing
│   ├── PRODUCTION_READINESS.md             # Production specifications
│   │
│   ├── requirements/                        # Layers 1-2
│   │   ├── YYYY-MM-DD-feature-prd.md       # Product requirements
│   │   └── YYYY-MM-DD-feature-trd.md       # Technical requirements
│   │
│   ├── design/                              # Layer 3
│   │   └── YYYY-MM-DD-feature-design.md    # Design documents
│   │
│   ├── architecture/                        # Layer 4
│   │   ├── decisions/                       # ADRs
│   │   │   ├── README.md                   # ADR index
│   │   │   ├── ADR-001-database-choice.md
│   │   │   ├── ADR-002-api-framework.md
│   │   │   └── ADR-NNN-title.md
│   │   │
│   │   ├── c4/                              # C4 diagrams
│   │   │   ├── README.md
│   │   │   ├── 01-context.md
│   │   │   ├── 02-containers.md
│   │   │   └── 03-components/
│   │   │       └── api-server.md
│   │   │
│   │   └── data/                            # Data models
│   │       └── YYYY-MM-DD-domain-data-model.md
│   │
│   ├── api/                                 # Layer 4 (API)
│   │   ├── openapi.yaml                    # REST API spec
│   │   └── asyncapi.yaml                   # Event API spec
│   │
│   ├── qa/                                  # Layer 5
│   │   └── YYYY-MM-DD-feature-qa-plan.md
│   │
│   ├── runbooks/                            # Layer 5
│   │   ├── README.md
│   │   ├── incident-response/
│   │   │   ├── high-error-rate.md
│   │   │   └── database-down.md
│   │   ├── deployment/
│   │   │   ├── deploy-to-production.md
│   │   │   └── rollback-deployment.md
│   │   ├── maintenance/
│   │   │   └── database-maintenance.md
│   │   └── recovery/
│   │       └── disaster-recovery.md
│   │
│   └── plans/                               # Layer 6
│       └── YYYY-MM-DD-feature-plan.md
│
├── src/                                     # Source code
├── tests/                                   # Test files
└── ...
```

### Framework Documentation (This Project)

```
c:\Users\artre\myProjects\tda-frontend\docs\
├── COMPLETE_DOCUMENTATION_TOOLKIT.md        # THIS DOCUMENT
├── PRE_DEVELOPMENT_DOCUMENTATION_FRAMEWORK.md  # Template framework
├── SKILLS_DOCUMENTATION_FRAMEWORK.md        # Skills usage guide
├── PRODUCTION_READINESS.md                  # Production specs example
├── IMPLEMENTATION_PLAN.md                   # Implementation example
├── DEEPAGENTS_COMPLETE_GUIDE.md            # Deepagents reference
└── TALENT_DEMAND_ANALYST_SPECIFICATION.md  # TDA specification
```

---

## 5. Detailed Workflow: Start to Finish

### Complete Visual Workflow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        COMPLETE 7-LAYER WORKFLOW                            │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ════════════════════════════════════════════════════════════════════════  │
│  PHASE 1: DISCOVERY (Day 1)                                                │
│  ════════════════════════════════════════════════════════════════════════  │
│                                                                             │
│  LAYER 1: VISION & STRATEGY                                                │
│  ┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐       │
│  │ /brainstorming  │ ──▶ │   WebSearch     │ ──▶ │   Task(Explore) │       │
│  │                 │     │                 │     │                 │       │
│  │ • Explore idea  │     │ • Research      │     │ • Check existing│       │
│  │ • Ask questions │     │   market        │     │   codebase      │       │
│  │ • Refine scope  │     │ • Best practices│     │ • Find patterns │       │
│  └─────────────────┘     └─────────────────┘     └─────────────────┘       │
│           │                                                                 │
│           ▼                                                                 │
│  ════════════════════════════════════════════════════════════════════════  │
│  PHASE 2: REQUIREMENTS (Day 1-2)                                           │
│  ════════════════════════════════════════════════════════════════════════  │
│                                                                             │
│  LAYER 2: PRODUCT REQUIREMENTS                                             │
│  ┌─────────────────┐     ┌─────────────────┐                               │
│  │  /writing-prd   │ ◀── │ AskUserQuestion │                               │
│  │                 │     │                 │                               │
│  │ • User personas │     │ • Clarify needs │                               │
│  │ • User stories  │     │ • Priorities    │                               │
│  │ • Acceptance    │     │ • Constraints   │                               │
│  │   criteria      │     │                 │                               │
│  └────────┬────────┘     └─────────────────┘                               │
│           │                                                                 │
│           │  Output: docs/requirements/YYYY-MM-DD-feature-prd.md           │
│           │                                                                 │
│           ▼                                                                 │
│  ════════════════════════════════════════════════════════════════════════  │
│  PHASE 3: TECHNICAL DESIGN (Day 2-4)                                       │
│  ════════════════════════════════════════════════════════════════════════  │
│                                                                             │
│  LAYER 3: TECHNICAL DESIGN                                                 │
│  ┌─────────────────┐     ┌─────────────────┐                               │
│  │  /writing-trd   │ ──▶ │/writing-design- │                               │
│  │                 │     │      doc        │                               │
│  │ • Performance   │     │                 │                               │
│  │   targets       │     │ • Architecture  │                               │
│  │ • Security reqs │     │ • Alternatives  │                               │
│  │ • Scalability   │     │   (minimum 3)   │                               │
│  │ • Integrations  │     │ • Trade-offs    │                               │
│  └────────┬────────┘     │ • Decision      │                               │
│           │              │   matrix        │                               │
│           │              └────────┬────────┘                               │
│           │                       │                                        │
│           │  Output: docs/requirements/YYYY-MM-DD-feature-trd.md           │
│           │          docs/design/YYYY-MM-DD-feature-design.md              │
│           │                       │                                        │
│           └───────────┬───────────┘                                        │
│                       │                                                    │
│                       ▼                                                    │
│  ════════════════════════════════════════════════════════════════════════  │
│  PHASE 4: ARCHITECTURE (Day 3-5)                                           │
│  ════════════════════════════════════════════════════════════════════════  │
│                                                                             │
│  LAYER 4: ARCHITECTURE                                                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐   │
│  │ /writing-adr │  │/writing-c4-  │  │/writing-data-│  │/writing-api- │   │
│  │              │  │ architecture │  │    model     │  │   contract   │   │
│  │ • Context    │  │              │  │              │  │              │   │
│  │ • Decision   │  │ • Context    │  │ • Conceptual │  │ • Endpoints  │   │
│  │ • Rationale  │  │ • Container  │  │ • Logical    │  │ • Schemas    │   │
│  │ • Conseq.    │  │ • Component  │  │ • Physical   │  │ • Examples   │   │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘   │
│         │                 │                 │                 │            │
│         │  Output: docs/architecture/decisions/ADR-NNN-*.md   │            │
│         │          docs/architecture/c4/                      │            │
│         │          docs/architecture/data/*-data-model.md     │            │
│         │          docs/api/openapi.yaml                      │            │
│         │                 │                 │                 │            │
│         └────────┬────────┴────────┬────────┴────────┬────────┘            │
│                  │                 │                 │                     │
│                  ▼                 ▼                 ▼                     │
│  ════════════════════════════════════════════════════════════════════════  │
│  PHASE 5: QUALITY & OPERATIONS (Day 4-6)                                   │
│  ════════════════════════════════════════════════════════════════════════  │
│                                                                             │
│  LAYER 5: QUALITY & OPERATIONS                                             │
│  ┌─────────────────┐     ┌─────────────────┐                               │
│  │ /writing-qa-    │     │   /writing-     │                               │
│  │     plan        │     │    runbooks     │                               │
│  │                 │     │                 │                               │
│  │ • Test pyramid  │     │ • Incident      │                               │
│  │ • Coverage      │     │   response      │                               │
│  │ • Quality gates │     │ • Deployment    │                               │
│  │ • Entry/exit    │     │ • Maintenance   │                               │
│  │   criteria      │     │ • Recovery      │                               │
│  └────────┬────────┘     └────────┬────────┘                               │
│           │                       │                                        │
│           │  Output: docs/qa/YYYY-MM-DD-feature-qa-plan.md                 │
│           │          docs/runbooks/                                        │
│           │                       │                                        │
│           └───────────┬───────────┘                                        │
│                       │                                                    │
│                       ▼                                                    │
│  ════════════════════════════════════════════════════════════════════════  │
│  PHASE 6: IMPLEMENTATION PLANNING (Day 5-7)                                │
│  ════════════════════════════════════════════════════════════════════════  │
│                                                                             │
│  LAYER 6: IMPLEMENTATION PLANNING                                          │
│  ┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐       │
│  │ /writing-plans  │ ──▶ │/using-git-      │ ──▶ │    TodoWrite    │       │
│  │                 │     │   worktrees     │     │                 │       │
│  │ • Bite-sized    │     │                 │     │ • Track tasks   │       │
│  │   tasks         │     │ • Isolated      │     │ • Progress      │       │
│  │ • TDD steps     │     │   workspace     │     │   visibility    │       │
│  │ • Exact files   │     │ • Clean env     │     │                 │       │
│  │ • Commands      │     │                 │     │                 │       │
│  └────────┬────────┘     └─────────────────┘     └─────────────────┘       │
│           │                                                                 │
│           │  Output: docs/plans/YYYY-MM-DD-feature-plan.md                 │
│           │                                                                 │
│           ▼                                                                 │
│  ════════════════════════════════════════════════════════════════════════  │
│  PHASE 7: AGENT HANDOFF & EXECUTION (Day 6+)                               │
│  ════════════════════════════════════════════════════════════════════════  │
│                                                                             │
│  LAYER 7: AGENT HANDOFF & EXECUTION                                        │
│  ┌─────────────────┐                                                       │
│  │ /agent-handoff- │                                                       │
│  │      prep       │                                                       │
│  │                 │                                                       │
│  │ • Document index│                                                       │
│  │ • Codebase      │                                                       │
│  │   context       │                                                       │
│  │ • Constraints   │                                                       │
│  │ • Quality gates │                                                       │
│  └────────┬────────┘                                                       │
│           │                                                                 │
│           │  Output: docs/AGENT_HANDOFF.md                                 │
│           │                                                                 │
│           ├──────────────────┬──────────────────┐                          │
│           ▼                  ▼                  ▼                          │
│  ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐              │
│  │/executing-plans │ │/subagent-driven-│ │/dispatching-    │              │
│  │                 │ │  development    │ │ parallel-agents │              │
│  │ • Batch exec    │ │                 │ │                 │              │
│  │ • Checkpoints   │ │ • Fresh agent   │ │ • Independent   │              │
│  │ • Human review  │ │   per task      │ │   tasks         │              │
│  │   between       │ │ • 2-stage review│ │ • Parallel exec │              │
│  └────────┬────────┘ │ • Spec + Quality│ └─────────────────┘              │
│           │          └────────┬────────┘                                   │
│           │                   │                                            │
│           └─────────┬─────────┘                                            │
│                     │                                                      │
│                     ▼                                                      │
│  ════════════════════════════════════════════════════════════════════════  │
│  QUALITY GATES (Used Throughout Execution)                                 │
│  ════════════════════════════════════════════════════════════════════════  │
│                                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐   │
│  │/test-driven- │  │/systematic-  │  │/verification-│  │/requesting-  │   │
│  │ development  │  │  debugging   │  │   before-    │  │ code-review  │   │
│  │              │  │              │  │  completion  │  │              │   │
│  │ RED: Write   │  │ • Reproduce  │  │              │  │ • Structured │   │
│  │   failing    │  │ • Isolate    │  │ • Run tests  │  │   feedback   │   │
│  │   test       │  │ • Root cause │  │ • Verify     │  │ • Before     │   │
│  │ GREEN: Make  │  │ • Fix        │  │   output     │  │   merge      │   │
│  │   it pass    │  │ • Prevent    │  │ • Evidence   │  │              │   │
│  │ REFACTOR     │  │              │  │   first      │  │              │   │
│  └──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘   │
│                                   │                                        │
│                                   ▼                                        │
│  ════════════════════════════════════════════════════════════════════════  │
│  COMPLETION                                                                │
│  ════════════════════════════════════════════════════════════════════════  │
│                                                                             │
│  ┌─────────────────┐     ┌─────────────────┐                               │
│  │/receiving-code- │ ──▶ │/finishing-a-    │                               │
│  │     review      │     │ development-    │                               │
│  │                 │     │    branch       │                               │
│  │ • Technical     │     │                 │                               │
│  │   rigor         │     │ • Merge options │                               │
│  │ • No blind      │     │ • PR creation   │                               │
│  │   agreement     │     │ • Cleanup       │                               │
│  └─────────────────┘     └─────────────────┘                               │
│                                                                             │
│  ════════════════════════════════════════════════════════════════════════  │
│                          🎉 PRODUCTION READY 🎉                            │
│  ════════════════════════════════════════════════════════════════════════  │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Timeline Overview

| Phase | Days | Activities | Outputs |
|-------|------|------------|---------|
| 1. Discovery | 1 | Brainstorm, research, explore codebase | Initial design decisions |
| 2. Requirements | 1-2 | Write PRD, clarify needs | PRD document |
| 3. Technical Design | 2-4 | TRD, Design Doc | TRD, Design Doc |
| 4. Architecture | 3-5 | ADRs, C4, Data Model, API | Architecture docs |
| 5. Quality & Ops | 4-6 | QA Plan, Runbooks | Quality & ops docs |
| 6. Implementation Prep | 5-7 | Implementation Plan, Setup | Plan, Workspace |
| 7. Execution | 6+ | Agent handoff, Implementation | Working code |

**Total Documentation Time:** 5-7 days
**Investment pays off through:** Clear alignment, fewer pivots, autonomous execution

---

## 6. Layer-by-Layer Guide

### Layer 1: Vision & Strategy

**Purpose:** Establish WHY we're building this

**Skill:** `/brainstorming`

**Process:**
1. Invoke `/brainstorming`
2. Answer questions one at a time
3. Explore 2-3 approaches
4. Validate design incrementally

**Best Practices:**
- Don't skip this phase even if requirements seem clear
- Use `WebSearch` to research similar solutions
- Use `Task(Explore)` to check existing codebase patterns
- Document decisions as you make them

**Output:** Clear understanding of problem and approach

---

### Layer 2: Product Requirements

**Purpose:** Define WHAT we're building

**Skill:** `/writing-prd`

**Process:**
1. Invoke `/writing-prd`
2. Define user personas
3. Write user stories with acceptance criteria
4. Prioritize requirements (P0/P1/P2)
5. Identify dependencies and risks

**Template Location:** `~/.claude/skills/writing-prd/SKILL.md`

**Output:** `docs/requirements/YYYY-MM-DD-[feature]-prd.md`

**Key Sections:**
- Problem Statement
- User Personas
- User Stories (As a... I want... So that...)
- Acceptance Criteria (Given/When/Then)
- Success Metrics
- Out of Scope

**Red Flags:**
- Requirements describe implementation
- Vague acceptance criteria
- Everything is P0 priority
- No out of scope section

---

### Layer 3: Technical Design

**Purpose:** Define HOW we'll build it technically

**Skills:** `/writing-trd`, `/writing-design-doc`

**Process:**
1. Start with `/writing-trd` to extract technical constraints from PRD
2. Use `/writing-design-doc` for detailed design
3. Always analyze 3+ alternatives
4. Create decision matrix for complex choices

**Template Locations:**
- `~/.claude/skills/writing-trd/SKILL.md`
- `~/.claude/skills/writing-design-doc/SKILL.md`

**Outputs:**
- `docs/requirements/YYYY-MM-DD-[feature]-trd.md`
- `docs/design/YYYY-MM-DD-[feature]-design.md`

**TRD Key Sections:**
- System Requirements
- Performance Targets (with measurement methods)
- Security Requirements
- Scalability Requirements
- Integration Points

**Design Doc Key Sections:**
- Context and Scope
- Goals and Non-Goals
- Detailed Design
- **Alternatives Considered** (minimum 3 with trade-offs)
- Cross-Cutting Concerns

**Red Flags:**
- TRD prescribes implementation ("use Redis")
- Design Doc has only one alternative
- Missing security or observability sections
- No rollback plan

---

### Layer 4: Architecture

**Purpose:** Define WHERE pieces fit and HOW they interact

**Skills:** `/writing-adr`, `/writing-c4-architecture`, `/writing-data-model`, `/writing-api-contract`

**Process:**
1. Create ADR for each significant decision
2. Create C4 diagrams (Context → Container → Component)
3. Design data model (Conceptual → Logical → Physical)
4. Define API contracts (OpenAPI for REST, AsyncAPI for events)

**Template Locations:**
- `~/.claude/skills/writing-adr/SKILL.md`
- `~/.claude/skills/writing-c4-architecture/SKILL.md`
- `~/.claude/skills/writing-data-model/SKILL.md`
- `~/.claude/skills/writing-api-contract/SKILL.md`

**Outputs:**
- `docs/architecture/decisions/ADR-NNN-[title].md`
- `docs/architecture/c4/` (multiple files)
- `docs/architecture/data/YYYY-MM-DD-[domain]-data-model.md`
- `docs/api/openapi.yaml`

**ADR Key Sections:**
- Context
- Decision Drivers
- Considered Options
- Decision Outcome
- Consequences (positive + negative)

**C4 Levels:**
1. Context: System + external actors
2. Container: Applications + data stores
3. Component: Modules within containers
4. Code: Class diagrams (rarely needed)

**Data Model Levels:**
1. Conceptual: Business entities
2. Logical: Attributes + relationships
3. Physical: DDL + indexes + triggers

**Red Flags:**
- ADRs with only one option considered
- C4 Level 1 showing internal details
- Data model without migration scripts
- API without examples

---

### Layer 5: Quality & Operations

**Purpose:** Define HOW we'll verify and run the system

**Skills:** `/writing-qa-plan`, `/writing-runbooks`

**Process:**
1. Create QA plan with test pyramid strategy
2. Define quality gates for CI/CD
3. Write runbooks for operations
4. Include incident response procedures

**Template Locations:**
- `~/.claude/skills/writing-qa-plan/SKILL.md`
- `~/.claude/skills/writing-runbooks/SKILL.md`

**Outputs:**
- `docs/qa/YYYY-MM-DD-[feature]-qa-plan.md`
- `docs/runbooks/` (multiple files by category)

**QA Plan Key Sections:**
- Test Strategy (pyramid distribution)
- Coverage Requirements
- Quality Gates
- Entry/Exit Criteria
- Defect Management

**Runbook Key Sections:**
- Prerequisites
- Step-by-step procedure
- Expected output for each step
- Failure handling
- Rollback procedure
- Escalation criteria

**Red Flags:**
- Inverted test pyramid (more E2E than unit)
- No entry/exit criteria
- Runbooks without verification steps
- Missing escalation path

---

### Layer 6: Implementation Planning

**Purpose:** Define WHAT order we build in

**Skills:** `/writing-plans`, `/using-git-worktrees`

**Process:**
1. Use `/writing-plans` to create bite-sized tasks
2. Each task should be 2-5 minutes
3. Include TDD steps (test → implement → verify)
4. Use `/using-git-worktrees` for isolated workspace

**Template Location:** `~/.claude/skills/writing-plans/SKILL.md`

**Output:** `docs/plans/YYYY-MM-DD-[feature]-plan.md`

**Task Structure:**
```markdown
### Task N: [Component Name]

**Files:**
- Create: `path/to/new/file.py`
- Modify: `path/to/existing.py:123-145`
- Test: `tests/path/to/test.py`

**Step 1: Write the failing test**
[Code]

**Step 2: Run test to verify it fails**
[Command + expected output]

**Step 3: Write minimal implementation**
[Code]

**Step 4: Run test to verify it passes**
[Command + expected output]

**Step 5: Commit**
[Git commands]
```

**Red Flags:**
- Tasks without exact file paths
- Missing verification commands
- No commit step
- Tasks too large (> 30 min)

---

### Layer 7: Agent Handoff & Execution

**Purpose:** Package everything for autonomous AI and execute

**Skills:** `/agent-handoff-prep`, `/executing-plans`, `/subagent-driven-development`

**Process:**
1. Use `/agent-handoff-prep` to create handoff document
2. Verify all source documents are complete
3. Choose execution method:
   - `/executing-plans` for batch execution with human checkpoints
   - `/subagent-driven-development` for continuous execution with auto-review
4. Apply quality skills throughout execution

**Template Location:** `~/.claude/skills/agent-handoff-prep/SKILL.md`

**Output:** `docs/AGENT_HANDOFF.md`

**Handoff Key Sections:**
- Mission and Success Criteria
- Document Index (reading order)
- Codebase Context (patterns, examples)
- Constraints (must do, must not do)
- Quality Gates
- Verification Checklist

**Execution Methods:**

| Method | Best For | Human Involvement |
|--------|----------|-------------------|
| `/executing-plans` | Parallel session, complex tasks | Review between batches |
| `/subagent-driven-development` | Same session, independent tasks | Minimal (auto-review) |
| `/dispatching-parallel-agents` | Multiple independent workstreams | Per-workstream |

---

## 7. Skill Reference Cards

### Quick Reference: All Skills

```
┌────────────────────────────────────────────────────────────────────────────┐
│                         SKILL QUICK REFERENCE                              │
├────────────────────────────────────────────────────────────────────────────┤
│                                                                            │
│  DOCUMENTATION SKILLS                                                      │
│  ════════════════════                                                      │
│                                                                            │
│  /brainstorming           Explore ideas through dialogue                   │
│  /writing-prd             Product Requirements Document                    │
│  /writing-trd             Technical Requirements Document                  │
│  /writing-design-doc      Google-style design with alternatives            │
│  /writing-adr             Architecture Decision Records                    │
│  /writing-c4-architecture C4 model diagrams                                │
│  /writing-data-model      Database schemas, ERDs                           │
│  /writing-api-contract    OpenAPI/AsyncAPI specifications                  │
│  /writing-qa-plan         Test strategy and coverage                       │
│  /writing-runbooks        Operational procedures                           │
│  /writing-plans           Bite-sized implementation tasks                  │
│                                                                            │
│  EXECUTION SKILLS                                                          │
│  ════════════════                                                          │
│                                                                            │
│  /agent-handoff-prep            Package docs for AI agent                  │
│  /using-git-worktrees           Create isolated workspace                  │
│  /executing-plans               Batch execution with checkpoints           │
│  /subagent-driven-development   Fresh subagent per task                    │
│  /dispatching-parallel-agents   Parallel independent tasks                 │
│                                                                            │
│  QUALITY SKILLS                                                            │
│  ══════════════                                                            │
│                                                                            │
│  /test-driven-development       TDD: Red → Green → Refactor               │
│  /systematic-debugging          Methodical root cause analysis             │
│  /verification-before-completion Verify with evidence                      │
│  /requesting-code-review        Get structured review                      │
│  /receiving-code-review         Process feedback properly                  │
│  /finishing-a-development-branch Complete work                             │
│                                                                            │
│  META SKILLS                                                               │
│  ═══════════                                                               │
│                                                                            │
│  /writing-skills          Create new skills                                │
│  /using-superpowers       Find and use skills                              │
│                                                                            │
└────────────────────────────────────────────────────────────────────────────┘
```

---

## 8. Quality Gates & Verification

### Gate 1: PRD Complete

Before proceeding to TRD:
- [ ] All user personas defined
- [ ] All user stories have acceptance criteria
- [ ] Success metrics are measurable
- [ ] Out of scope is explicit
- [ ] Stakeholders have reviewed

### Gate 2: Technical Design Complete

Before proceeding to Architecture:
- [ ] TRD has measurable targets
- [ ] Design Doc has 3+ alternatives analyzed
- [ ] Decision matrix used for complex choices
- [ ] Security section complete
- [ ] Observability planned

### Gate 3: Architecture Complete

Before proceeding to Quality & Ops:
- [ ] Key decisions captured in ADRs
- [ ] C4 diagrams at appropriate levels
- [ ] Data model has DDL and migrations
- [ ] API contract has examples
- [ ] All documents linked

### Gate 4: Quality & Ops Complete

Before proceeding to Implementation:
- [ ] Test pyramid balanced
- [ ] Quality gates defined
- [ ] Runbooks have verification steps
- [ ] Escalation paths defined
- [ ] Entry/exit criteria clear

### Gate 5: Implementation Ready

Before starting execution:
- [ ] All Layer 1-6 documents complete
- [ ] Implementation plan has bite-sized tasks
- [ ] Agent handoff document created
- [ ] Workspace set up
- [ ] Quality gates automated

### Gate 6: Implementation Complete

Before declaring done:
- [ ] All tests passing
- [ ] Code coverage meets threshold
- [ ] Security scan clean
- [ ] Documentation updated
- [ ] Code reviewed and approved

---

## 9. Best Practices for World-Class Results

### Documentation Best Practices

| Practice | Why It Matters |
|----------|----------------|
| **Start with Layer 1** | Can't build right thing without understanding why |
| **Don't skip alternatives** | Forces deeper thinking, documents trade-offs |
| **Make everything measurable** | "Fast" is meaningless, "< 200ms p95" is testable |
| **Include examples** | Shows exactly what you mean |
| **Define out of scope** | Prevents scope creep, clarifies boundaries |
| **Link related documents** | Creates navigable knowledge graph |
| **Review regularly** | Documentation rots; schedule reviews |

### Execution Best Practices

| Practice | Why It Matters |
|----------|----------------|
| **TDD always** | Tests document intent, catch regressions |
| **Bite-sized tasks** | Easier to verify, resume, and review |
| **Verify before commit** | Catches issues early, builds trust |
| **Fresh subagents** | No context pollution between tasks |
| **Two-stage review** | Spec compliance, then code quality |

### Anti-Patterns to Avoid

| Anti-Pattern | Problem | Better Approach |
|--------------|---------|-----------------|
| Skipping to code | Builds wrong thing | Complete Layer 1-6 first |
| One alternative | No trade-off analysis | Always analyze 3+ options |
| Vague requirements | Can't verify done | Given/When/Then format |
| Monolithic tasks | Hard to verify, resume | 2-5 minute tasks |
| No quality gates | Quality varies | Automated gates at each stage |
| Editing old ADRs | Loses history | Supersede with new ADR |

---

## 10. Quick Reference Commands

### Complete Command Sequence

```bash
# ═══════════════════════════════════════════════════════════════
# PHASE 1: VISION & DISCOVERY (Day 1)
# ═══════════════════════════════════════════════════════════════

/brainstorming
# Follow the dialogue, answer questions, explore options

# ═══════════════════════════════════════════════════════════════
# PHASE 2: REQUIREMENTS (Day 1-2)
# ═══════════════════════════════════════════════════════════════

/writing-prd
# Creates: docs/requirements/YYYY-MM-DD-[feature]-prd.md

# ═══════════════════════════════════════════════════════════════
# PHASE 3: TECHNICAL DESIGN (Day 2-4)
# ═══════════════════════════════════════════════════════════════

/writing-trd
# Creates: docs/requirements/YYYY-MM-DD-[feature]-trd.md

/writing-design-doc
# Creates: docs/design/YYYY-MM-DD-[feature]-design.md

# ═══════════════════════════════════════════════════════════════
# PHASE 4: ARCHITECTURE (Day 3-5)
# ═══════════════════════════════════════════════════════════════

/writing-adr
# Creates: docs/architecture/decisions/ADR-NNN-[title].md
# Repeat for each significant decision

/writing-c4-architecture
# Creates: docs/architecture/c4/ (multiple files)

/writing-data-model
# Creates: docs/architecture/data/YYYY-MM-DD-[domain]-data-model.md

/writing-api-contract
# Creates: docs/api/openapi.yaml

# ═══════════════════════════════════════════════════════════════
# PHASE 5: QUALITY & OPERATIONS (Day 4-6)
# ═══════════════════════════════════════════════════════════════

/writing-qa-plan
# Creates: docs/qa/YYYY-MM-DD-[feature]-qa-plan.md

/writing-runbooks
# Creates: docs/runbooks/[category]/[runbook].md

# ═══════════════════════════════════════════════════════════════
# PHASE 6: IMPLEMENTATION PLANNING (Day 5-7)
# ═══════════════════════════════════════════════════════════════

/writing-plans
# Creates: docs/plans/YYYY-MM-DD-[feature]-plan.md

/using-git-worktrees
# Creates isolated workspace for implementation

# ═══════════════════════════════════════════════════════════════
# PHASE 7: AGENT HANDOFF & EXECUTION (Day 6+)
# ═══════════════════════════════════════════════════════════════

/agent-handoff-prep
# Creates: docs/AGENT_HANDOFF.md

# Choose ONE execution method:

/subagent-driven-development
# OR
/executing-plans
# OR
/dispatching-parallel-agents

# ═══════════════════════════════════════════════════════════════
# QUALITY GATES (Throughout Execution)
# ═══════════════════════════════════════════════════════════════

/test-driven-development        # For each task
/verification-before-completion # Before each commit
/requesting-code-review         # Before merge
/receiving-code-review          # Process feedback
/finishing-a-development-branch # Complete the work
```

### Verification Commands

```bash
# Check skill is available
/writing-prd

# List all available skills
/using-superpowers

# Check documentation structure
ls docs/

# Verify all docs exist
ls docs/requirements/
ls docs/design/
ls docs/architecture/
ls docs/qa/
ls docs/runbooks/
ls docs/plans/
```

---

## 11. Troubleshooting & FAQ

### Skill Not Loading

**Symptom:** Skill doesn't respond when invoked

**Solutions:**
1. Check file exists: `~/.claude/skills/[skill-name]/SKILL.md`
2. Verify frontmatter has `name` and `description`
3. Restart Claude Code session
4. Check for YAML syntax errors in frontmatter

### Document Not Found

**Symptom:** Referenced document doesn't exist

**Solutions:**
1. Check you're in correct project directory
2. Verify document was created (check git status)
3. Use correct naming convention (YYYY-MM-DD prefix)
4. Check docs/ subdirectory structure

### Quality Gate Failing

**Symptom:** Can't proceed past a quality gate

**Solutions:**
1. Review gate checklist item by item
2. Address each unchecked item
3. Don't skip gates - they exist for good reason
4. Ask for clarification on unclear criteria

### FAQ

**Q: Do I need all 7 layers for every project?**
A: For significant features, yes. For bug fixes or small changes, you can skip to relevant layers, but always document decisions.

**Q: How long should documentation take?**
A: 5-7 days for comprehensive documentation. This investment prevents weeks of rework later.

**Q: Can I parallelize documentation?**
A: Layers 1-3 must be sequential. Layer 4 skills can run in parallel. Layers 5-7 depend on Layer 4.

**Q: What if requirements change mid-documentation?**
A: Update affected documents, create new ADRs for changed decisions, don't edit old ADRs (supersede them).

**Q: How do I know when documentation is "good enough"?**
A: When an autonomous AI agent could build the system from documentation alone without asking questions.

---

## 12. Appendices

### Appendix A: Document Templates Summary

| Document | Template Location | Output Location |
|----------|-------------------|-----------------|
| PRD | `~/.claude/skills/writing-prd/SKILL.md` | `docs/requirements/*-prd.md` |
| TRD | `~/.claude/skills/writing-trd/SKILL.md` | `docs/requirements/*-trd.md` |
| Design Doc | `~/.claude/skills/writing-design-doc/SKILL.md` | `docs/design/*-design.md` |
| ADR | `~/.claude/skills/writing-adr/SKILL.md` | `docs/architecture/decisions/ADR-*.md` |
| C4 | `~/.claude/skills/writing-c4-architecture/SKILL.md` | `docs/architecture/c4/` |
| Data Model | `~/.claude/skills/writing-data-model/SKILL.md` | `docs/architecture/data/*-data-model.md` |
| API Contract | `~/.claude/skills/writing-api-contract/SKILL.md` | `docs/api/openapi.yaml` |
| QA Plan | `~/.claude/skills/writing-qa-plan/SKILL.md` | `docs/qa/*-qa-plan.md` |
| Runbook | `~/.claude/skills/writing-runbooks/SKILL.md` | `docs/runbooks/` |
| Plan | `~/.claude/skills/writing-plans/SKILL.md` | `docs/plans/*-plan.md` |
| Handoff | `~/.claude/skills/agent-handoff-prep/SKILL.md` | `docs/AGENT_HANDOFF.md` |

### Appendix B: File Naming Conventions

| Type | Convention | Example |
|------|------------|---------|
| PRD | `YYYY-MM-DD-[feature]-prd.md` | `2026-01-21-user-analytics-prd.md` |
| TRD | `YYYY-MM-DD-[feature]-trd.md` | `2026-01-21-user-analytics-trd.md` |
| Design Doc | `YYYY-MM-DD-[feature]-design.md` | `2026-01-21-user-analytics-design.md` |
| ADR | `ADR-NNN-[title].md` | `ADR-015-use-postgresql.md` |
| Data Model | `YYYY-MM-DD-[domain]-data-model.md` | `2026-01-21-analytics-data-model.md` |
| QA Plan | `YYYY-MM-DD-[feature]-qa-plan.md` | `2026-01-21-user-analytics-qa-plan.md` |
| Plan | `YYYY-MM-DD-[feature]-plan.md` | `2026-01-21-user-analytics-plan.md` |
| Runbook | `[descriptive-name].md` | `high-error-rate.md` |

### Appendix C: Related Resources

| Resource | Location | Purpose |
|----------|----------|---------|
| This Document | `docs/COMPLETE_DOCUMENTATION_TOOLKIT.md` | Master reference |
| Framework Overview | `docs/PRE_DEVELOPMENT_DOCUMENTATION_FRAMEWORK.md` | Template framework |
| Skills Guide | `docs/SKILLS_DOCUMENTATION_FRAMEWORK.md` | Skills usage |
| Production Readiness | `docs/PRODUCTION_READINESS.md` | Production specs example |
| C4 Model | https://c4model.com/ | Architecture notation |
| OpenAPI | https://swagger.io/specification/ | API specification |
| ADR GitHub | https://github.com/joelparkerhenderson/architecture-decision-record | ADR examples |

### Appendix D: Glossary

| Term | Definition |
|------|------------|
| **ADR** | Architecture Decision Record - documents significant technical decisions |
| **C4 Model** | Context, Container, Component, Code - hierarchical architecture diagrams |
| **PRD** | Product Requirements Document - what to build and for whom |
| **TRD** | Technical Requirements Document - technical constraints and NFRs |
| **NFR** | Non-Functional Requirement - quality attributes (performance, security, etc.) |
| **TDD** | Test-Driven Development - write tests before implementation |
| **SLO** | Service Level Objective - target for service quality |
| **Runbook** | Step-by-step operational procedure |
| **Quality Gate** | Checkpoint requiring criteria to be met before proceeding |

---

## Summary

This toolkit provides everything needed for world-class pre-development documentation:

- **24 specialized skills** covering the entire development lifecycle
- **7-layer model** ensuring comprehensive coverage
- **Clear workflow** from idea to production
- **Quality gates** at every stage
- **Autonomous AI support** through complete documentation

By following this framework, you create documentation that:
- Enables autonomous AI development
- Survives team changes
- Scales to enterprise complexity
- Meets Google/Palantir engineering standards

**The investment in documentation pays off through:**
- Fewer mid-implementation pivots
- Clear alignment across stakeholders
- Complete context for autonomous execution
- Production-ready systems from day one

---

*Document created: January 21, 2026*
*Skills installed at: `C:\Users\artre\.claude\skills\`*
*Framework documentation at: `c:\Users\artre\myProjects\tda-frontend\docs\`*
