# Recommendation: Add Deployment Infrastructure as Layer 8

> **Document Status:** Proposal
> **Version:** 1.0
> **Date:** 2025-01-21
> **Purpose:** Evaluate adding deployment infrastructure to the 7-layer planning process

---

## Executive Summary

**Recommendation: Yes, add Layer 8 (Deployment Infrastructure) to the planning orchestrator.**

The 7-layer documentation model produces excellent design and implementation documentation but stops short of deployment readiness. Elite software engineers need deployment infrastructure assets to move from "code complete" to "production deployed" without friction.

---

## The Gap Identified

### Current 7-Layer Model

| Layer | Output | Covers |
|-------|--------|--------|
| 1 | Vision & Strategy | Why we're building |
| 2 | PRD | What we're building |
| 3 | TRD + Design Doc | How we're building (constraints + approach) |
| 4 | ADRs, C4, Data Model, API | Architecture decisions |
| 5 | QA Plan, Runbooks | Quality & operations |
| 6 | Implementation Plan | Step-by-step build instructions |
| 7 | Agent Handoff | Context package for AI implementation |

### Missing: How to Deploy

The current model assumes deployment is "someone else's problem" or will be figured out during implementation. This creates:

1. **Context switching** - Engineers must stop coding to research deployment
2. **Inconsistent infrastructure** - Different engineers make different choices
3. **Security gaps** - Security often retrofitted rather than designed
4. **Observability debt** - Monitoring added reactively after incidents

---

## Proposed Layer 8: Deployment Infrastructure

### 8.1 CI/CD Pipeline Definition

**Skill:** `/writing-ci-cd`

**Outputs:**
- `.github/workflows/ci.yml` - Continuous integration
- `.github/workflows/deploy-*.yml` - Environment deployments
- Pipeline architecture diagram

**Covers:**
- Lint, test, build jobs
- Security scanning integration
- Staging → Production flow
- Rollback procedures
- Environment-specific configurations

### 8.2 Infrastructure as Code

**Skill:** `/writing-iac`

**Outputs:**
- Platform configs (Railway, Vercel, AWS, etc.)
- Container definitions (Dockerfile)
- Environment variable schemas

**Covers:**
- Build configuration
- Runtime settings
- Health checks
- Resource limits
- Scaling policies

### 8.3 Dependency Inventory

**Skill:** `/writing-dependencies`

**Outputs:**
- `pyproject.toml` / `package.json` with pinned versions
- Dependency audit report
- Update policy documentation

**Covers:**
- All dependencies with exact versions
- Dev vs production separation
- Security vulnerability baseline
- Update/rotation schedule

### 8.4 Observability Configuration

**Skill:** `/writing-observability`

**Outputs:**
- `docs/observability/monitoring-setup.md`
- Dashboard definitions
- Alert rules

**Covers:**
- Metrics definitions (what to measure)
- Logging configuration (structured, levels)
- Tracing setup (distributed tracing)
- Alerting thresholds and escalation
- Dashboard layouts

### 8.5 Security Threat Model

**Skill:** `/writing-threat-model`

**Outputs:**
- `docs/security/threat-model.md`
- Security controls checklist
- Incident response playbook

**Covers:**
- STRIDE analysis
- Trust boundaries
- Asset inventory
- Mitigation strategies
- Security testing requirements

---

## Integration with Planning Orchestrator

### Updated Layer Checklist

```markdown
#### Layer 8: Deployment Infrastructure
- [ ] CI/CD pipelines defined
- [ ] Infrastructure as Code created
- [ ] Dependencies inventoried and pinned
- [ ] Observability stack configured
- [ ] Security threat model completed
- [ ] All secrets documented (not values, just names)
→ Outputs:
  - `.github/workflows/`
  - Platform configs (railway.toml, vercel.json, etc.)
  - `docs/observability/monitoring-setup.md`
  - `docs/security/threat-model.md`
```

### Question Batch for Layer 8

```markdown
## Deployment Infrastructure Questions

### Q1: Where will this be deployed?
**Options:**
1. Vercel (frontend) + Railway (backend) - Recommended for MVP
2. AWS (ECS/Lambda)
3. GCP (Cloud Run)
4. Azure (Container Apps)
5. Self-hosted Kubernetes
6. Other: ___

### Q2: What's your security posture requirement?
**Options:**
1. Standard (OWASP Top 10 coverage)
2. Enhanced (SOC2-ready)
3. Strict (HIPAA/PCI compliance)

### Q3: What observability tools do you use?
**Options:**
1. None yet - recommend something
2. Datadog
3. Grafana + Prometheus
4. AWS CloudWatch
5. Other: ___
```

---

## When to Run Layer 8

### Option A: Part of Initial Planning (Recommended)

Run Layer 8 immediately after Layer 7 (Agent Handoff), before any implementation begins. This ensures:

- Deployment decisions inform implementation choices
- Security is designed in, not bolted on
- Engineers have complete context from day one

### Option B: Pre-Deployment Checkpoint

Run Layer 8 after implementation but before first deployment. This is acceptable for:

- Rapid prototypes
- Internal tools
- Projects where deployment platform is unknown

### Option C: On-Demand

Available as standalone skills when retrofitting existing projects.

---

## Skill Definitions

### `/writing-ci-cd`

```markdown
# Writing CI/CD Pipelines

## Overview
Define comprehensive CI/CD pipelines for automated testing and deployment.

## Process
1. Identify tech stack and testing requirements
2. Define CI jobs (lint, test, security, build)
3. Define deployment environments (staging, production)
4. Configure health checks and rollback triggers
5. Document manual intervention points

## Output
- `.github/workflows/ci.yml`
- `.github/workflows/deploy-backend.yml`
- `.github/workflows/deploy-frontend.yml`
```

### `/writing-threat-model`

```markdown
# Writing Security Threat Models

## Overview
Create STRIDE-based threat analysis for the system.

## Process
1. Draw trust boundaries diagram
2. Inventory assets and their classification
3. Apply STRIDE to each component
4. Define mitigations for each threat
5. Create security controls checklist
6. Document incident response procedures

## Output
- `docs/security/threat-model.md`
```

### `/writing-observability`

```markdown
# Writing Observability Configuration

## Overview
Define metrics, logging, tracing, and alerting for production visibility.

## Process
1. Identify key metrics (latency, errors, throughput)
2. Define structured logging format
3. Configure distributed tracing
4. Set alert thresholds and escalation
5. Design operational dashboards

## Output
- `docs/observability/monitoring-setup.md`
- Dashboard JSON definitions
- Alert rule configurations
```

---

## Benefits of Adding Layer 8

| Benefit | Impact |
|---------|--------|
| **Deployment readiness** | Code complete = deployment ready |
| **Security by design** | Threats identified before code written |
| **Consistent infrastructure** | Same patterns across all projects |
| **Reduced context switching** | Engineers stay in flow |
| **Better estimates** | Deployment work is visible in planning |
| **Faster onboarding** | New engineers see full picture |

---

## Implementation Recommendation

### Phase 1: Add Skills (Immediate)

Create the 5 new skills as standalone tools:
- `/writing-ci-cd`
- `/writing-iac`
- `/writing-dependencies`
- `/writing-observability`
- `/writing-threat-model`

### Phase 2: Integrate into Orchestrator (Next Iteration)

Update `/planning-orchestrator` to:
1. Add Layer 8 to the checklist
2. Add deployment questions to question batches
3. Update completion report to include infrastructure assets

### Phase 3: Create Templates (Future)

Build reusable templates for common stacks:
- Next.js + Vercel + Railway
- React + AWS + Lambda
- Python + GCP + Cloud Run

---

## Conclusion

The deployment infrastructure assets created for TDA demonstrate clear value:

- **CI/CD pipelines** catch issues before deployment
- **IaC configs** make deployments reproducible
- **Dependency inventory** prevents supply chain issues
- **Observability config** enables production debugging
- **Threat model** prevents security incidents

These should absolutely be part of the standard planning process. Elite engineers expect this level of preparation before implementation begins.

**Recommendation: Implement Phase 1 immediately, Phase 2 in next planning skill update.**

---

*Layer 8 Recommendation - Planning Process Enhancement Proposal*
