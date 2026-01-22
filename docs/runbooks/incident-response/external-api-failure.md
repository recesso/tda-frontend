# Runbook: External API Failure

> **Type:** Incident Response
> **Severity:** High
> **Last Updated:** 2025-01-21

---

## Overview

This runbook addresses failures of external API dependencies (Anthropic, Tavily, Exa).

## Detection

**Alert:** `tda_external_api_failure`
**Trigger:** 3+ consecutive failures to any external API
**Severity:** High

## Affected Services

| API | Impact |
|-----|--------|
| Anthropic Claude | Complete service failure |
| Tavily | Degraded search capability |
| Exa | Degraded search + no LinkedIn data |

## Immediate Actions

### Step 1: Identify Failed API (1 min)

```bash
# Check readiness endpoint
curl https://tda-api.railway.app/api/health/ready

# Expected response shows which API failed:
# {
#   "status": "not_ready",
#   "checks": {
#     "anthropic": "ok",
#     "tavily": "error",  <-- Failed
#     "exa": "ok"
#   }
# }
```

### Step 2: Verify API Status (2 min)

**Anthropic:**
- Status: https://status.anthropic.com/
- Test: `curl -H "x-api-key: $ANTHROPIC_API_KEY" https://api.anthropic.com/v1/models`

**Tavily:**
- Status: Check their status page
- Test: `curl -X POST https://api.tavily.com/search -H "Content-Type: application/json" -d '{"api_key": "$TAVILY_API_KEY", "query": "test"}'`

**Exa:**
- Status: Check their status page
- Test: `curl https://api.exa.ai/search -H "x-api-key: $EXA_API_KEY" -H "Content-Type: application/json" -d '{"query": "test"}'`

### Step 3: Determine Response

**If Anthropic is Down:**
- **Impact:** Complete service failure
- **Action:** Enable maintenance mode, notify users
- **ETA:** Monitor Anthropic status for updates

**If Tavily is Down:**
- **Impact:** Degraded search
- **Action:** System continues with Exa-only searches
- **Note:** Quality may be reduced

**If Exa is Down:**
- **Impact:** No LinkedIn data, reduced search quality
- **Action:** System continues with Tavily-only searches
- **Note:** Industry report synthesis affected

### Step 4: Enable Graceful Degradation

The system should automatically degrade when APIs fail:

```python
# Check logs for graceful degradation
# Look for: "Tavily unavailable, continuing with Exa"
# Or: "Exa unavailable, continuing with Tavily"
```

If not working:
```bash
# Restart to trigger reconnection
railway restart
```

## Communication

**If > 15 min outage:**

1. Update status page (if exists)
2. Notify active users via UI banner
3. Post to team channel

## Recovery

When API recovers:

```bash
# Verify health
curl https://tda-api.railway.app/api/health/ready

# Run smoke test
curl -X POST https://tda-api.railway.app/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Test query"}'
```

## Post-Incident

- [ ] Document outage duration
- [ ] Review graceful degradation effectiveness
- [ ] Consider adding redundancy

## Related Documents

### Runbooks
- [High Error Rate](high-error-rate.md) - If error rate spikes during API failure
- [API Key Rotation](../maintenance/rotate-api-keys.md) - If key expiry suspected
- [Deploy Backend](../deployment/deploy-backend.md) - If restart/rollback needed

### Technical References
- [Error Handling Specification](../../design/error-handling-specification.md) - Retry policies, circuit breaker config
- [Sequence Diagrams](../../design/sequence-diagrams.md) - See "Sub-Agent Failure with Degradation" and "Complete Sub-Agent Failure"
- [Token Budget Spec](../../design/token-cost-budget.md) - Budget implications of partial results

### Architecture Context
- [ADR-001: Multi-Agent Architecture](../../architecture/decisions/ADR-001-multi-agent-architecture.md) - Why coordinator pattern enables graceful degradation

---

*Runbook - Part of 7-layer documentation*
