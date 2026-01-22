# Runbook: Deploy Frontend to Vercel

> **Type:** Deployment
> **Severity:** Standard
> **Last Updated:** 2025-01-21

---

## Overview

This runbook covers deploying the TDA frontend to Vercel.

## Prerequisites

- [ ] Vercel CLI installed (`npm install -g vercel`)
- [ ] Vercel account with project access
- [ ] Backend deployed and healthy
- [ ] Environment variables configured in Vercel

## Pre-Deployment Checklist

- [ ] `main` branch is up to date
- [ ] All PR checks passed
- [ ] Backend API URL verified
- [ ] No console errors in local build

## Deployment Steps

### Step 1: Verify Local Build

```bash
# Install dependencies
npm install

# Build locally
npm run build

# Run production build locally
npm start

# Open http://localhost:3000 and verify
```

### Step 2: Deploy to Vercel

**Option A: Automatic (GitHub Integration)**

Push to `main` branch triggers automatic deployment.

```bash
git push origin main
```

**Option B: Manual CLI Deployment**

```bash
# Login to Vercel
vercel login

# Deploy preview
vercel

# Deploy to production
vercel --prod
```

### Step 3: Verify Deployment

```bash
# Get deployment URL
vercel ls

# Or check Vercel dashboard
```

1. Open the production URL
2. Submit a test query
3. Verify streaming works
4. Check browser console for errors

### Step 4: Smoke Test Checklist

- [ ] Page loads without errors
- [ ] Chat input accepts text
- [ ] Submit triggers API call
- [ ] Streaming response displays
- [ ] Sources render with links
- [ ] No console errors

## Rollback Procedure

**Via Vercel Dashboard:**

1. Go to Project → Deployments
2. Find last working deployment
3. Click "..." → "Promote to Production"

**Via CLI:**

```bash
# List deployments
vercel ls

# Promote specific deployment
vercel promote <deployment-url>
```

## Environment Variables

Required in Vercel project settings:

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_API_URL` | Backend API URL |

## Post-Deployment

- [ ] Verify in multiple browsers
- [ ] Check mobile responsiveness
- [ ] Monitor error tracking
- [ ] Update deployment log

## Contacts

| Role | Contact |
|------|---------|
| On-Call | [Team Slack] |
| Vercel Support | support@vercel.com |

## Related Documents

### Runbooks
- [Deploy Backend](deploy-backend.md) - Backend must be healthy first
- [High Error Rate](../incident-response/high-error-rate.md) - If errors spike post-deployment

### Technical References
- [Sequence Diagrams](../../design/sequence-diagrams.md) - See "SSE Streaming Timeline" for expected frontend behavior
- [Development Guide](../../DEVELOPMENT.md) - Local testing before deployment
- [API Contract](../../api/openapi.yaml) - API specification frontend depends on

### Architecture Context
- [ADR-003: Streaming Architecture](../../architecture/decisions/ADR-003-streaming-response-architecture.md) - Why SSE (affects frontend implementation)
- [C4 Container Diagram](../../architecture/c4/02-containers.md) - System deployment topology

---

*Runbook - Part of 7-layer documentation*
