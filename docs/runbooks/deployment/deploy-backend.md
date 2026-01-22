# Runbook: Deploy Backend to Railway

> **Type:** Deployment
> **Severity:** Standard
> **Last Updated:** 2025-01-21

---

## Overview

This runbook covers deploying the TDA backend API to Railway.

## Prerequisites

- [ ] Railway CLI installed (`npm install -g @railway/cli`)
- [ ] Railway account with project access
- [ ] All tests passing locally
- [ ] Environment variables configured in Railway

## Pre-Deployment Checklist

- [ ] `main` branch is up to date
- [ ] All PR checks passed
- [ ] No critical security vulnerabilities
- [ ] Environment variables verified

## Deployment Steps

### Step 1: Verify Local Build

```bash
# Build Docker image locally
docker build -t tda-backend .

# Run locally to verify
docker run -p 8000:8000 \
  -e ANTHROPIC_API_KEY=$ANTHROPIC_API_KEY \
  -e TAVILY_API_KEY=$TAVILY_API_KEY \
  -e EXA_API_KEY=$EXA_API_KEY \
  tda-backend

# Test health endpoint
curl http://localhost:8000/api/health
```

### Step 2: Deploy to Railway

```bash
# Login to Railway
railway login

# Link to project
railway link

# Deploy
railway up

# Or deploy specific branch
railway up --detach
```

### Step 3: Verify Deployment

```bash
# Get deployment URL
railway status

# Check health
curl https://tda-api.railway.app/api/health

# Check readiness
curl https://tda-api.railway.app/api/health/ready
```

### Step 4: Smoke Test

```bash
# Test a simple query
curl -X POST https://tda-api.railway.app/api/chat \
  -H "Content-Type: application/json" \
  -H "X-API-Key: $API_KEY" \
  -d '{"message": "Test query"}'
```

## Rollback Procedure

If deployment fails or issues detected:

```bash
# View deployment history
railway deployments

# Rollback to previous deployment
railway rollback

# Or deploy specific commit
git checkout <previous-commit>
railway up
```

## Post-Deployment

- [ ] Monitor error rates for 15 minutes
- [ ] Check LangSmith for any anomalies
- [ ] Update deployment log

## Contacts

| Role | Contact |
|------|---------|
| On-Call | [Team Slack] |
| Railway Support | support@railway.app |

## Rollback Decision Criteria

Use the following to decide whether to rollback:

| Condition | Action |
|-----------|--------|
| Error rate > 10% for 5 min | Immediate rollback |
| Error rate 5-10% | Investigate, rollback if not resolved in 10 min |
| p95 latency > 120s | Investigate, consider rollback |
| Health check failing | Immediate rollback |

See [Error Handling Specification](../../design/error-handling-specification.md) for error thresholds.

## Related Documents

### Runbooks
- [Deploy Frontend](deploy-frontend.md) - After backend is stable
- [High Error Rate](../incident-response/high-error-rate.md) - If errors spike post-deployment
- [API Key Rotation](../maintenance/rotate-api-keys.md) - If deploying with new keys

### Technical References
- [Performance Baseline](../../qa/performance-baseline.md) - Expected metrics to verify post-deploy
- [Development Guide](../../DEVELOPMENT.md) - Local testing before deployment
- [Integration Tests](../../qa/integration-test-scenarios.md) - Tests that should pass before deploying

### Architecture Context
- [C4 Container Diagram](../../architecture/c4/02-containers.md) - System deployment topology

---

*Runbook - Part of 7-layer documentation*
