# Runbook: Rotate API Keys

> **Type:** Maintenance
> **Severity:** Standard
> **Last Updated:** 2025-01-21

---

## Overview

This runbook covers rotating API keys for external services.

## When to Rotate

- Suspected key compromise
- Employee departure
- Regular rotation (quarterly recommended)
- Key exposed in logs/code

## API Keys to Rotate

| Key | Provider | Dashboard |
|-----|----------|-----------|
| ANTHROPIC_API_KEY | Anthropic | console.anthropic.com |
| TAVILY_API_KEY | Tavily | tavily.com/dashboard |
| EXA_API_KEY | Exa | exa.ai/dashboard |
| LANGSMITH_API_KEY | LangSmith | smith.langchain.com |

## Rotation Procedure

### Step 1: Generate New Key

1. Log into provider dashboard
2. Navigate to API keys section
3. Generate new key
4. **Do not delete old key yet**

### Step 2: Update Railway Environment

```bash
# Login to Railway
railway login

# Update environment variable
railway variables set ANTHROPIC_API_KEY=<new-key>

# Repeat for other keys as needed
```

### Step 3: Verify New Key Works

```bash
# Trigger redeploy
railway up

# Wait for deployment
railway status

# Test health
curl https://tda-api.railway.app/api/health/ready

# Run smoke test
curl -X POST https://tda-api.railway.app/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Test query"}'
```

### Step 4: Revoke Old Key

Only after verifying new key works:

1. Return to provider dashboard
2. Delete/revoke old key
3. Verify service still works

### Step 5: Update Local Development

```bash
# Update local .env file
echo "ANTHROPIC_API_KEY=<new-key>" >> .env

# Or use secret manager
```

## Emergency Rotation

If key is compromised:

1. **Immediately** revoke compromised key in provider dashboard
2. Generate new key
3. Update Railway (causes brief downtime)
4. Verify service restored
5. Investigate how compromise occurred

## Documentation

After rotation, update:

- [ ] Last rotation date in team docs
- [ ] Incident report (if emergency)
- [ ] Notify team of new key deployment

## Rotation Schedule

| Key | Last Rotated | Next Due |
|-----|--------------|----------|
| ANTHROPIC_API_KEY | [Date] | [+90 days] |
| TAVILY_API_KEY | [Date] | [+90 days] |
| EXA_API_KEY | [Date] | [+90 days] |
| LANGSMITH_API_KEY | [Date] | [+90 days] |

---

*Runbook - Part of 7-layer documentation*
