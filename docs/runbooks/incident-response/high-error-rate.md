# Runbook: High Error Rate

> **Type:** Incident Response
> **Severity:** Critical
> **Last Updated:** 2025-01-21

---

## Overview

This runbook addresses situations where the error rate exceeds 5% over a 5-minute window.

## Detection

**Alert:** `tda_error_rate_high`
**Trigger:** Error rate > 5% for 5 minutes
**Severity:** Critical

## Symptoms

- Users report failed analyses
- Error events in SSE stream
- Elevated 5xx responses in logs
- LangSmith shows failed runs

## Immediate Actions

### Step 1: Assess Impact (2 min)

```bash
# Check current error rate
curl https://tda-api.railway.app/api/health/ready

# Check Railway logs
railway logs --tail 100
```

### Step 2: Identify Error Source (5 min)

Check in order of likelihood:

1. **External API Failures**
   ```bash
   # Check external API status
   curl -I https://api.anthropic.com/v1/models
   curl -I https://api.tavily.com/search
   curl -I https://api.exa.ai/search
   ```

2. **Rate Limiting**
   - Check for 429 responses in logs
   - Review LangSmith for rate limit errors

3. **Application Error**
   - Check for stack traces in logs
   - Review recent deployments

4. **Infrastructure Issue**
   - Check Railway status page
   - Review memory/CPU metrics

### Step 3: Mitigate (varies)

**If External API Down:**
```bash
# Enable degraded mode (if implemented)
# Or scale down traffic temporarily
```

**If Rate Limited:**
```bash
# Reduce concurrent requests
# Enable caching
```

**If Application Bug:**
```bash
# Rollback to last known good
railway rollback
```

**If Infrastructure:**
```bash
# Restart service
railway restart

# Or scale up
railway scale --replicas 2
```

## Escalation

| Timeframe | Action |
|-----------|--------|
| 5 min | On-call begins investigation |
| 15 min | Escalate to team lead |
| 30 min | Consider rollback |
| 1 hour | Post-incident call |

## Post-Incident

- [ ] Document timeline
- [ ] Identify root cause
- [ ] Create follow-up tickets
- [ ] Schedule retrospective

## Related Documents

### Runbooks
- [External API Failure](external-api-failure.md) - If error source is external API
- [API Key Rotation](../maintenance/rotate-api-keys.md) - If key-related errors
- [Deploy Backend](../deployment/deploy-backend.md#rollback-procedure) - For rollback procedure

### Technical References
- [Error Handling Specification](../../design/error-handling-specification.md) - Error behavior matrix, retry policies
- [Performance Baseline](../../qa/performance-baseline.md) - Expected latency thresholds
- [Token Budget Spec](../../design/token-cost-budget.md) - If token-related errors

### Decision Context
- [ADR-003: Streaming Architecture](../../architecture/decisions/ADR-003-streaming-response-architecture.md) - Why SSE was chosen

---

*Runbook - Part of 7-layer documentation*
