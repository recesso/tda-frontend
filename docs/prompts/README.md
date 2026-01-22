# Agent Prompts

> **Version:** 1.0.0
> **Last Updated:** 2025-01-21
> **Hash:** See individual files

This directory contains the versioned system prompts for all agents in the Talent Demand Analyst system.

## Prompt Files

| File | Agent | Purpose |
|------|-------|---------|
| [coordinator.md](coordinator.md) | Main Coordinator | Orchestration and synthesis |
| [job-analyzer.md](job-analyzer.md) | Job Posting Analyzer | Job listing analysis |
| [skill-researcher.md](skill-researcher.md) | Skill Emergence Researcher | Trend identification |
| [report-synthesizer.md](report-synthesizer.md) | Industry Report Synthesizer | Report analysis |

## Version Control

Prompts are versioned because:
1. Changes can significantly affect behavior
2. Rollback may be needed if quality degrades
3. A/B testing requires version tracking

## Change Process

1. Create new version of prompt file
2. Update version number and hash
3. Test with representative queries
4. Review output quality
5. Deploy with monitoring
6. Keep previous version for 7 days

## Hash Verification

Each prompt file includes a content hash. To verify:

```bash
# Generate hash for prompt content (excluding metadata)
sha256sum <(grep -A 1000 "## System Prompt" prompts/coordinator.md)
```

---

*Prompt management - Addressing Gap 3 from expert feedback*
