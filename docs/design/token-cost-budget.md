# Token and Cost Budget Specification

> **Document Status:** Active
> **Version:** 1.0
> **Last Updated:** 2025-01-21
> **Purpose:** Define token limits and cost controls for API usage

---

## 1. Overview

This document specifies token budgets and cost constraints to ensure:
1. Predictable costs per analysis
2. Consistent response quality
3. Prevention of runaway API spending

**Target:** < $0.50 per analysis

---

## 2. Claude API Pricing Reference

Based on Claude Sonnet 4.5 pricing (as of Jan 2025):

| Component | Price |
|-----------|-------|
| Input tokens | $3.00 / 1M tokens |
| Output tokens | $15.00 / 1M tokens |

**Per 1K tokens:**
- Input: $0.003
- Output: $0.015

---

## 3. Token Budget Allocation

### 3.1 Per-Component Budgets

| Component | Max Input | Max Output | Est. Cost |
|-----------|-----------|------------|-----------|
| **Coordinator - Initial** | 4,000 | 500 | $0.02 |
| **Job Posting Analyzer** | 2,000 | 2,000 | $0.04 |
| **Skill Emergence Researcher** | 2,000 | 2,000 | $0.04 |
| **Industry Report Synthesizer** | 2,000 | 2,000 | $0.04 |
| **Coordinator - Synthesis** | 8,000 | 4,000 | $0.08 |
| **Buffer (retries, etc.)** | - | - | $0.03 |
| **Total** | ~18,000 | ~10,500 | **~$0.25** |

### 3.2 Budget Breakdown

```
┌─────────────────────────────────────────────────────────────────┐
│                    TOKEN BUDGET ALLOCATION                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  COORDINATOR INITIAL (4K input, 500 output)                     │
│  ├── System prompt: ~1,500 tokens                               │
│  ├── User query: ~100 tokens (max 2000 chars ≈ 500 tokens)      │
│  ├── Planning context: ~400 tokens                              │
│  └── Sub-agent delegation: ~500 output                          │
│                                                                  │
│  SUB-AGENTS (2K input, 2K output each)                          │
│  ├── System prompt: ~1,000 tokens                               │
│  ├── Task from coordinator: ~200 tokens                         │
│  ├── Tool results: ~800 tokens (truncated if needed)            │
│  └── Analysis output: ~2,000 tokens                             │
│                                                                  │
│  COORDINATOR SYNTHESIS (8K input, 4K output)                    │
│  ├── System prompt: ~1,500 tokens                               │
│  ├── Original query: ~100 tokens                                │
│  ├── Job analyzer results: ~2,000 tokens                        │
│  ├── Skill researcher results: ~2,000 tokens                    │
│  ├── Report synthesizer results: ~2,000 tokens                  │
│  └── Final response: ~4,000 tokens                              │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 4. Cost Scenarios

### 4.1 Typical Analysis

| Scenario | Input Tokens | Output Tokens | Cost |
|----------|--------------|---------------|------|
| Simple query (1 sub-agent) | 8,000 | 4,500 | $0.09 |
| Standard query (all agents) | 16,000 | 8,000 | $0.17 |
| Complex query (with retries) | 22,000 | 12,000 | $0.25 |
| Worst case (max everything) | 30,000 | 16,000 | $0.33 |

### 4.2 Monthly Projections

| Usage Level | Analyses/Month | Est. Monthly Cost |
|-------------|----------------|-------------------|
| Light | 100 | $17 - $25 |
| Moderate | 500 | $85 - $125 |
| Heavy | 1,000 | $170 - $250 |
| High Volume | 5,000 | $850 - $1,250 |

---

## 5. Tool Result Truncation

### 5.1 Truncation Thresholds

| Tool | Max Result Size | Truncation Strategy |
|------|-----------------|---------------------|
| tavily_web_search | 800 tokens | Keep first N results |
| exa_web_search | 800 tokens | Keep first N results |
| exa_linkedin_search | 600 tokens | Keep first N results |
| read_url_content | 2,000 tokens | Smart truncation |

### 5.2 Truncation Implementation

```python
MAX_TOKENS_PER_TOOL = {
    "tavily_web_search": 800,
    "exa_web_search": 800,
    "exa_linkedin_search": 600,
    "read_url_content": 2000
}

def truncate_tool_result(result: str, tool_name: str) -> str:
    """Truncate tool result to fit budget."""
    max_tokens = MAX_TOKENS_PER_TOOL.get(tool_name, 1000)
    max_chars = max_tokens * 4  # ~4 chars per token estimate

    if len(result) <= max_chars:
        return result

    # Smart truncation: keep beginning and end
    half = max_chars // 2
    truncated = result[:half] + "\n\n...[truncated]...\n\n" + result[-half//2:]

    return truncated
```

### 5.3 Search Result Limits

```python
def format_search_results(results: list, max_tokens: int = 800) -> str:
    """Format search results within token budget."""
    max_chars = max_tokens * 4
    formatted = []
    current_length = 0

    for r in results:
        entry = f"**{r['title']}**\n{r['url']}\n{r['content'][:200]}...\n\n"

        if current_length + len(entry) > max_chars:
            formatted.append("...[additional results truncated]")
            break

        formatted.append(entry)
        current_length += len(entry)

    return "".join(formatted)
```

---

## 6. Budget Enforcement

### 6.1 Pre-Call Budget Check

```python
class TokenBudget:
    """Track and enforce token budgets."""

    def __init__(self, max_total: int = 30000):
        self.max_total = max_total
        self.used = 0
        self.breakdown = {}

    def can_spend(self, component: str, tokens: int) -> bool:
        """Check if component can spend tokens."""
        return (self.used + tokens) <= self.max_total

    def spend(self, component: str, input_tokens: int, output_tokens: int):
        """Record token usage."""
        total = input_tokens + output_tokens
        self.used += total
        self.breakdown[component] = self.breakdown.get(component, 0) + total

    def remaining(self) -> int:
        """Get remaining budget."""
        return self.max_total - self.used
```

### 6.2 Response Truncation

```python
async def generate_with_budget(agent, prompt, budget: TokenBudget):
    """Generate response with budget enforcement."""

    # Calculate available output tokens
    estimated_input = count_tokens(prompt)
    available_output = min(
        budget.remaining() - estimated_input,
        4096  # Hard cap
    )

    if available_output < 500:
        raise BudgetExhaustedError("Insufficient token budget remaining")

    response = await agent.generate(
        prompt,
        max_tokens=available_output
    )

    budget.spend(
        agent.name,
        input_tokens=response.usage.input_tokens,
        output_tokens=response.usage.output_tokens
    )

    return response
```

---

## 7. Cost Alerts

### 7.1 Alert Thresholds

| Alert Level | Condition | Action |
|-------------|-----------|--------|
| **Info** | Single analysis > $0.30 | Log for review |
| **Warning** | Single analysis > $0.40 | Log + tag for investigation |
| **Critical** | Single analysis > $0.50 | Log + alert + investigate |
| **Daily Warning** | Daily total > $50 | Alert team |
| **Daily Critical** | Daily total > $100 | Alert + review |

### 7.2 Monitoring Implementation

```python
def check_cost_alerts(analysis_id: str, cost: float):
    """Check cost thresholds and alert if needed."""

    if cost > 0.50:
        logger.critical(f"Analysis {analysis_id} exceeded cost limit: ${cost:.2f}")
        alert_team(f"High cost analysis: ${cost:.2f}")
    elif cost > 0.40:
        logger.warning(f"Analysis {analysis_id} high cost: ${cost:.2f}")
    elif cost > 0.30:
        logger.info(f"Analysis {analysis_id} elevated cost: ${cost:.2f}")

    # Track daily totals
    daily_total = get_daily_cost_total()
    if daily_total > 100:
        alert_team(f"Daily cost critical: ${daily_total:.2f}")
    elif daily_total > 50:
        logger.warning(f"Daily cost elevated: ${daily_total:.2f}")
```

---

## 8. Cost Optimization Strategies

### 8.1 Caching

| Cache Type | TTL | Estimated Savings |
|------------|-----|-------------------|
| Search results | 15 min | 20-30% |
| URL content | 1 hour | 10-15% |
| Common queries | 5 min | 5-10% |

### 8.2 Query Optimization

```python
def optimize_query(query: str) -> str:
    """Optimize user query to reduce token usage."""

    # Remove excessive whitespace
    query = " ".join(query.split())

    # Truncate if very long (but preserve meaning)
    if len(query) > 500:
        # Keep first 400 chars, note truncation
        query = query[:400] + " [query truncated for processing]"

    return query
```

### 8.3 Selective Sub-Agent Invocation

```python
def determine_required_agents(query: str) -> list[str]:
    """Determine which sub-agents are needed for query."""

    agents = []

    # Keyword-based routing (simplified)
    query_lower = query.lower()

    if any(kw in query_lower for kw in ["job", "posting", "hiring", "salary"]):
        agents.append("job_analyzer")

    if any(kw in query_lower for kw in ["emerging", "trend", "future", "new skill"]):
        agents.append("skill_researcher")

    if any(kw in query_lower for kw in ["report", "industry", "forecast", "linkedin"]):
        agents.append("report_synthesizer")

    # Default: use all if unclear
    if not agents:
        agents = ["job_analyzer", "skill_researcher", "report_synthesizer"]

    return agents
```

---

## 9. Budget Reporting

### 9.1 Per-Request Logging

```json
{
  "request_id": "req-abc123",
  "timestamp": "2025-01-21T10:30:00Z",
  "query_tokens": 45,
  "token_usage": {
    "coordinator_initial": {"input": 3800, "output": 450},
    "job_analyzer": {"input": 1950, "output": 1800},
    "skill_researcher": {"input": 1900, "output": 1750},
    "report_synthesizer": {"input": 1850, "output": 1700},
    "coordinator_synthesis": {"input": 7500, "output": 3200}
  },
  "total_tokens": {
    "input": 17000,
    "output": 8900
  },
  "estimated_cost": 0.18,
  "duration_ms": 42000
}
```

### 9.2 Aggregated Metrics

```python
# Prometheus metrics for cost tracking
TOKEN_USAGE = Counter(
    'tda_token_usage_total',
    'Total tokens used',
    ['component', 'token_type']  # input/output
)

ANALYSIS_COST = Histogram(
    'tda_analysis_cost_dollars',
    'Cost per analysis in dollars',
    buckets=[0.05, 0.1, 0.15, 0.2, 0.25, 0.3, 0.4, 0.5]
)

DAILY_COST = Gauge(
    'tda_daily_cost_dollars',
    'Running daily cost total'
)
```

---

## 10. Budget Exceeded Handling

### 10.1 Graceful Degradation

When budget is near exhausted:

```python
async def handle_budget_pressure(budget: TokenBudget, remaining_agents: list):
    """Handle analysis when budget is low."""

    remaining = budget.remaining()

    if remaining < 2000:
        # Not enough for any sub-agent
        return {
            "status": "budget_limited",
            "message": "Analysis limited due to query complexity",
            "partial_results": gather_partial_results()
        }

    if remaining < 6000:
        # Only enough for one more agent
        # Pick most relevant based on query
        priority_agent = select_priority_agent(remaining_agents)
        return await run_single_agent(priority_agent)

    # Continue normal execution
    return None
```

### 10.2 User Communication

```python
def format_budget_warning(budget: TokenBudget) -> str:
    """Format budget status for inclusion in response."""

    if budget.remaining() < 2000:
        return "\n\n*Note: This analysis was limited due to query complexity. Consider asking a more focused question for deeper analysis.*"

    return ""
```

---

*Token and Cost Budget Specification - Addressing Gap 5 from expert feedback*
