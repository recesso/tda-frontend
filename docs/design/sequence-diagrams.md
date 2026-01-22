# Talent Demand Analyst - Sequence Diagrams

> **Document Status:** Active
> **Version:** 1.0
> **Last Updated:** 2025-01-21
> **Purpose:** Detail message flows, error propagation, and streaming event timing

---

## 1. Happy Path: Full Analysis Flow

This diagram shows the complete message flow for a successful analysis query.

```
┌──────┐     ┌─────┐     ┌───────────┐     ┌───────────┐     ┌────────┐     ┌─────┐
│Client│     │ API │     │Coordinator│     │Sub-Agents │     │ Tools  │     │ExtAPI│
└──┬───┘     └──┬──┘     └─────┬─────┘     └─────┬─────┘     └───┬────┘     └──┬──┘
   │            │              │                 │               │             │
   │ POST /chat │              │                 │               │             │
   │───────────>│              │                 │               │             │
   │            │              │                 │               │             │
   │            │ validate()   │                 │               │             │
   │            │─────────────>│                 │               │             │
   │            │              │                 │               │             │
   │  SSE: progress            │                 │               │             │
   │<─ ─ ─ ─ ─ ─│ (coordinator │                 │               │             │
   │            │   started)   │                 │               │             │
   │            │              │                 │               │             │
   │            │              │ analyze_query() │               │             │
   │            │              │────────────────>│               │             │
   │            │              │                 │               │             │
   │  SSE: progress            │                 │               │             │
   │<─ ─ ─ ─ ─ ─│ (job_analyzer│                 │               │             │
   │            │   started)   │                 │               │             │
   │            │              │                 │               │             │
   │            │              │                 │ tavily_search │             │
   │            │              │                 │──────────────>│             │
   │            │              │                 │               │ HTTP POST   │
   │            │              │                 │               │────────────>│
   │            │              │                 │               │             │
   │            │              │                 │               │ 200 OK      │
   │            │              │                 │               │<────────────│
   │            │              │                 │ results       │             │
   │            │              │                 │<──────────────│             │
   │            │              │                 │               │             │
   │            │              │                 │ exa_search    │             │
   │            │              │                 │──────────────>│             │
   │            │              │                 │               │ HTTP POST   │
   │            │              │                 │               │────────────>│
   │            │              │                 │               │ 200 OK      │
   │            │              │                 │               │<────────────│
   │            │              │                 │ results       │             │
   │            │              │                 │<──────────────│             │
   │            │              │                 │               │             │
   │            │              │ job_analysis    │               │             │
   │            │              │<────────────────│               │             │
   │            │              │                 │               │             │
   │  SSE: progress            │                 │               │             │
   │<─ ─ ─ ─ ─ ─│ (job_analyzer│                 │               │             │
   │            │   completed) │                 │               │             │
   │            │              │                 │               │             │
   │            │              │ research_skills │               │             │
   │            │              │────────────────>│               │             │
   │            │              │                 │               │             │
   │  SSE: progress            │ (skill_researcher               │             │
   │<─ ─ ─ ─ ─ ─│   started)   │                 │               │             │
   │            │              │                 │               │             │
   │            │              │                 │ [tool calls]  │             │
   │            │              │                 │──────────────>│────────────>│
   │            │              │                 │<──────────────│<────────────│
   │            │              │                 │               │             │
   │            │              │ skill_findings  │               │             │
   │            │              │<────────────────│               │             │
   │            │              │                 │               │             │
   │  SSE: progress            │                 │               │             │
   │<─ ─ ─ ─ ─ ─│ (skill_researcher              │               │             │
   │            │   completed) │                 │               │             │
   │            │              │                 │               │             │
   │            │              │ synthesize_reports              │             │
   │            │              │────────────────>│               │             │
   │            │              │                 │               │             │
   │  SSE: progress            │ (report_synth   │               │             │
   │<─ ─ ─ ─ ─ ─│   started)   │                 │               │             │
   │            │              │                 │               │             │
   │            │              │                 │ [tool calls]  │             │
   │            │              │                 │──────────────>│────────────>│
   │            │              │                 │<──────────────│<────────────│
   │            │              │                 │               │             │
   │            │              │ report_findings │               │             │
   │            │              │<────────────────│               │             │
   │            │              │                 │               │             │
   │  SSE: progress            │                 │               │             │
   │<─ ─ ─ ─ ─ ─│ (report_synth│                 │               │             │
   │            │   completed) │                 │               │             │
   │            │              │                 │               │             │
   │            │              │                 │               │             │
   │            │              │ ┌─────────────────────────────┐ │             │
   │            │              │ │ SYNTHESIS PHASE             │ │             │
   │            │              │ │ Coordinator combines:       │ │             │
   │            │              │ │ - job_analysis              │ │             │
   │            │              │ │ - skill_findings            │ │             │
   │            │              │ │ - report_findings           │ │             │
   │            │              │ │ Into coherent response      │ │             │
   │            │              │ └─────────────────────────────┘ │             │
   │            │              │                 │               │             │
   │  SSE: token               │                 │               │             │
   │<─ ─ ─ ─ ─ ─│ "Based on"   │                 │               │             │
   │            │              │                 │               │             │
   │  SSE: token               │                 │               │             │
   │<─ ─ ─ ─ ─ ─│ " my analysis│                 │               │             │
   │            │              │                 │               │             │
   │  SSE: token               │                 │               │             │
   │<─ ─ ─ ─ ─ ─│ " of current"│                 │               │             │
   │            │              │                 │               │             │
   │     ...continued streaming...              │               │             │
   │            │              │                 │               │             │
   │  SSE: source              │                 │               │             │
   │<─ ─ ─ ─ ─ ─│ {url, title} │                 │               │             │
   │            │              │                 │               │             │
   │  SSE: source              │                 │               │             │
   │<─ ─ ─ ─ ─ ─│ {url, title} │                 │               │             │
   │            │              │                 │               │             │
   │  SSE: done                │                 │               │             │
   │<─ ─ ─ ─ ─ ─│ {tokens, ms} │                 │               │             │
   │            │              │                 │               │             │
```

---

## 2. Error Flow: Sub-Agent Failure with Graceful Degradation

This diagram shows behavior when one sub-agent fails but others succeed.

```
┌──────┐     ┌─────┐     ┌───────────┐     ┌───────────┐     ┌────────┐     ┌─────┐
│Client│     │ API │     │Coordinator│     │Sub-Agents │     │ Tools  │     │ExtAPI│
└──┬───┘     └──┬──┘     └─────┬─────┘     └─────┬─────┘     └───┬────┘     └──┬──┘
   │            │              │                 │               │             │
   │ POST /chat │              │                 │               │             │
   │───────────>│              │                 │               │             │
   │            │              │                 │               │             │
   │  SSE: progress            │                 │               │             │
   │<─ ─ ─ ─ ─ ─│ (started)    │                 │               │             │
   │            │              │                 │               │             │
   │            │              │ job_analyzer()  │               │             │
   │            │              │────────────────>│               │             │
   │            │              │                 │ tavily_search │             │
   │            │              │                 │──────────────>│             │
   │            │              │                 │               │ HTTP POST   │
   │            │              │                 │               │────────────>│
   │            │              │                 │               │             │
   │            │              │                 │               │ 429 RATE    │
   │            │              │                 │               │ LIMITED     │
   │            │              │                 │               │<────────────│
   │            │              │                 │               │             │
   │            │              │                 │  ┌──────────────────────────┐
   │            │              │                 │  │ RETRY LOGIC              │
   │            │              │                 │  │ Wait 1s, retry           │
   │            │              │                 │  └──────────────────────────┘
   │            │              │                 │               │             │
   │            │              │                 │               │ HTTP POST   │
   │            │              │                 │               │────────────>│
   │            │              │                 │               │             │
   │            │              │                 │               │ 429 RATE    │
   │            │              │                 │               │ LIMITED     │
   │            │              │                 │               │<────────────│
   │            │              │                 │               │             │
   │            │              │                 │  ┌──────────────────────────┐
   │            │              │                 │  │ MAX RETRIES EXCEEDED     │
   │            │              │                 │  │ Return partial failure   │
   │            │              │                 │  └──────────────────────────┘
   │            │              │                 │               │             │
   │            │              │ job_analysis    │               │             │
   │            │              │ (partial: only  │               │             │
   │            │              │  exa results)   │               │             │
   │            │              │<────────────────│               │             │
   │            │              │                 │               │             │
   │  SSE: progress            │                 │               │             │
   │<─ ─ ─ ─ ─ ─│ (job_analyzer│                 │               │             │
   │            │   completed  │                 │               │             │
   │            │   partial)   │                 │               │             │
   │            │              │                 │               │             │
   │            │              │ skill_researcher()              │             │
   │            │              │────────────────>│               │             │
   │            │              │                 │ [succeeds]    │             │
   │            │              │<────────────────│               │             │
   │            │              │                 │               │             │
   │            │              │ report_synth()  │               │             │
   │            │              │────────────────>│               │             │
   │            │              │                 │ [succeeds]    │             │
   │            │              │<────────────────│               │             │
   │            │              │                 │               │             │
   │            │              │  ┌─────────────────────────────┐│             │
   │            │              │  │ SYNTHESIS WITH CAVEAT       ││             │
   │            │              │  │ Coordinator notes:          ││             │
   │            │              │  │ "Some job board data was    ││             │
   │            │              │  │  unavailable due to rate    ││             │
   │            │              │  │  limiting. Analysis based   ││             │
   │            │              │  │  on available sources."     ││             │
   │            │              │  └─────────────────────────────┘│             │
   │            │              │                 │               │             │
   │  SSE: token               │                 │               │             │
   │<─ ─ ─ ─ ─ ─│ [response    │                 │               │             │
   │            │  with caveat]│                 │               │             │
   │            │              │                 │               │             │
   │  SSE: done                │                 │               │             │
   │<─ ─ ─ ─ ─ ─│              │                 │               │             │
```

---

## 2b. Error Flow: Partial Success (Tavily Fails, Exa Succeeds)

This diagram shows the fallback logic when one search API fails but another succeeds.

```
┌──────┐     ┌─────┐     ┌───────────┐     ┌───────────┐     ┌────────┐     ┌───────┐  ┌─────┐
│Client│     │ API │     │Coordinator│     │JobAnalyzer│     │ Tools  │     │Tavily │  │ Exa │
└──┬───┘     └──┬──┘     └─────┬─────┘     └─────┬─────┘     └───┬────┘     └───┬───┘  └──┬──┘
   │            │              │                 │               │              │         │
   │ POST /chat │              │                 │               │              │         │
   │───────────>│              │                 │               │              │         │
   │            │              │                 │               │              │         │
   │  SSE: progress            │                 │               │              │         │
   │<─ ─ ─ ─ ─ ─│ (started)    │                 │               │              │         │
   │            │              │                 │               │              │         │
   │            │              │ job_analyzer()  │               │              │         │
   │            │              │────────────────>│               │              │         │
   │            │              │                 │               │              │         │
   │  SSE: progress            │                 │               │              │         │
   │<─ ─ ─ ─ ─ ─│ (job_analyzer│                 │               │              │         │
   │            │   started)   │                 │               │              │         │
   │            │              │                 │               │              │         │
   │            │              │                 │ tavily_search │              │         │
   │            │              │                 │──────────────>│              │         │
   │            │              │                 │               │ HTTP POST    │         │
   │            │              │                 │               │─────────────>│         │
   │            │              │                 │               │              │         │
   │            │              │                 │               │ 503 SERVICE  │         │
   │            │              │                 │               │ UNAVAILABLE  │         │
   │            │              │                 │               │<─────────────│         │
   │            │              │                 │               │              │         │
   │            │              │                 │  ┌──────────────────────────────────────┐
   │            │              │                 │  │ RETRY with backoff (1s, 2s)          │
   │            │              │                 │  │ All retries fail → Tavily unavailable│
   │            │              │                 │  └──────────────────────────────────────┘
   │            │              │                 │               │              │         │
   │            │              │                 │  ┌──────────────────────────────────────┐
   │            │              │                 │  │ FALLBACK DECISION                    │
   │            │              │                 │  │ Tavily failed → Try Exa for same     │
   │            │              │                 │  │ search task (not just LinkedIn)      │
   │            │              │                 │  └──────────────────────────────────────┘
   │            │              │                 │               │              │         │
   │            │              │                 │ exa_web_search│              │         │
   │            │              │                 │ (fallback)    │              │         │
   │            │              │                 │──────────────>│              │         │
   │            │              │                 │               │ HTTP POST    │         │
   │            │              │                 │               │─────────────────────────>│
   │            │              │                 │               │              │         │
   │            │              │                 │               │              │ 200 OK  │
   │            │              │                 │               │              │ results │
   │            │              │                 │               │<─────────────────────────│
   │            │              │                 │ results       │              │         │
   │            │              │                 │<──────────────│              │         │
   │            │              │                 │               │              │         │
   │            │              │                 │  ┌──────────────────────────────────────┐
   │            │              │                 │  │ MARK PARTIAL SUCCESS                 │
   │            │              │                 │  │ - data_source: "exa_fallback"        │
   │            │              │                 │  │ - tavily_status: "unavailable"       │
   │            │              │                 │  │ - quality_note: "Limited job boards" │
   │            │              │                 │  └──────────────────────────────────────┘
   │            │              │                 │               │              │         │
   │            │              │ job_analysis    │               │              │         │
   │            │              │ (with metadata: │               │              │         │
   │            │              │  fallback used) │               │              │         │
   │            │              │<────────────────│               │              │         │
   │            │              │                 │               │              │         │
   │  SSE: progress            │                 │               │              │         │
   │<─ ─ ─ ─ ─ ─│ (job_analyzer│                 │               │              │         │
   │            │   completed  │                 │               │              │         │
   │            │   fallback)  │                 │               │              │         │
   │            │              │                 │               │              │         │
   │            │              │  ┌─────────────────────────────┐│              │         │
   │            │              │  │ CONTINUE NORMAL FLOW        ││              │         │
   │            │              │  │ skill_researcher + report   ││              │         │
   │            │              │  │ synthesizer proceed normally││              │         │
   │            │              │  └─────────────────────────────┘│              │         │
   │            │              │                 │               │              │         │
   │            │              │ [skill_researcher succeeds]    │              │         │
   │            │              │ [report_synthesizer succeeds]  │              │         │
   │            │              │                 │               │              │         │
   │            │              │  ┌─────────────────────────────┐│              │         │
   │            │              │  │ SYNTHESIS WITH TRANSPARENCY ││              │         │
   │            │              │  │ Include in response:        ││              │         │
   │            │              │  │ "Note: Some traditional job ││              │         │
   │            │              │  │  board data was unavailable.││              │         │
   │            │              │  │  Results are based on       ││              │         │
   │            │              │  │  alternative sources."      ││              │         │
   │            │              │  └─────────────────────────────┘│              │         │
   │            │              │                 │               │              │         │
   │  SSE: token               │                 │               │              │         │
   │<─ ─ ─ ─ ─ ─│ [full analysis with           │               │              │         │
   │            │  transparency note]            │               │              │         │
   │            │              │                 │               │              │         │
   │  SSE: source              │                 │               │              │         │
   │<─ ─ ─ ─ ─ ─│ [sources from Exa only]       │               │              │         │
   │            │              │                 │               │              │         │
   │  SSE: done                │                 │               │              │         │
   │<─ ─ ─ ─ ─ ─│              │                 │               │              │         │
```

**Key Points:**
- When Tavily fails, Job Analyzer automatically tries Exa as fallback
- Response includes transparency note about data source limitations
- Quality may be reduced but analysis still completes
- No error event sent (this is graceful degradation, not failure)

---

## 3. Error Flow: Complete Sub-Agent Failure

When a sub-agent completely fails after all retries.

```
┌──────┐     ┌─────┐     ┌───────────┐     ┌───────────┐
│Client│     │ API │     │Coordinator│     │Sub-Agents │
└──┬───┘     └──┬──┘     └─────┬─────┘     └─────┬─────┘
   │            │              │                 │
   │ POST /chat │              │                 │
   │───────────>│              │                 │
   │            │              │                 │
   │            │              │ job_analyzer()  │
   │            │              │────────────────>│
   │            │              │                 │
   │            │              │  ┌─────────────────────────┐
   │            │              │  │ ALL TOOLS FAIL          │
   │            │              │  │ Tavily: 503             │
   │            │              │  │ Exa: 503                │
   │            │              │  │ After retries           │
   │            │              │  └─────────────────────────┘
   │            │              │                 │
   │            │              │ AgentError:     │
   │            │              │ "Unable to      │
   │            │              │  fetch job data"│
   │            │              │<────────────────│
   │            │              │                 │
   │  SSE: progress            │                 │
   │<─ ─ ─ ─ ─ ─│ (job_analyzer│                 │
   │            │   FAILED)    │                 │
   │            │              │                 │
   │            │              │  ┌─────────────────────────┐
   │            │              │  │ COORDINATOR DECISION    │
   │            │              │  │ Continue with remaining │
   │            │              │  │ sub-agents              │
   │            │              │  └─────────────────────────┘
   │            │              │                 │
   │            │              │ skill_researcher()
   │            │              │────────────────>│
   │            │              │ [succeeds]      │
   │            │              │<────────────────│
   │            │              │                 │
   │            │              │ report_synth()  │
   │            │              │────────────────>│
   │            │              │ [succeeds]      │
   │            │              │<────────────────│
   │            │              │                 │
   │  SSE: token               │                 │
   │<─ ─ ─ ─ ─ ─│ "Note: Job posting analysis    │
   │            │  is currently unavailable.     │
   │            │  Based on skill trends and     │
   │            │  industry reports..."          │
   │            │              │                 │
   │  SSE: done                │                 │
   │<─ ─ ─ ─ ─ ─│              │                 │
```

---

## 4. Error Flow: Claude API Failure (Critical)

When the LLM itself is unavailable - this is a complete service failure.

```
┌──────┐     ┌─────┐     ┌───────────┐     ┌──────────┐
│Client│     │ API │     │Coordinator│     │ Claude   │
└──┬───┘     └──┬──┘     └─────┬─────┘     └────┬─────┘
   │            │              │                 │
   │ POST /chat │              │                 │
   │───────────>│              │                 │
   │            │              │                 │
   │            │ invoke()     │                 │
   │            │─────────────>│                 │
   │            │              │                 │
   │            │              │ LLM request     │
   │            │              │────────────────>│
   │            │              │                 │
   │            │              │  ┌─────────────────────────┐
   │            │              │  │ 503 Service Unavailable │
   │            │              │  │ OR                      │
   │            │              │  │ 429 Rate Limited        │
   │            │              │  └─────────────────────────┘
   │            │              │                 │
   │            │              │ Retry 1 (1s)   │
   │            │              │────────────────>│
   │            │              │ [fails]         │
   │            │              │<────────────────│
   │            │              │                 │
   │            │              │ Retry 2 (2s)   │
   │            │              │────────────────>│
   │            │              │ [fails]         │
   │            │              │<────────────────│
   │            │              │                 │
   │            │              │ Retry 3 (4s)   │
   │            │              │────────────────>│
   │            │              │ [fails]         │
   │            │              │<────────────────│
   │            │              │                 │
   │            │ APIError     │                 │
   │            │<─────────────│                 │
   │            │              │                 │
   │  SSE: error               │                 │
   │<─ ─ ─ ─ ─ ─│ {"type": "error",              │
   │            │  "message": "Analysis service  │
   │            │   temporarily unavailable.     │
   │            │   Please try again in a few    │
   │            │   minutes.",                   │
   │            │  "code": "SERVICE_UNAVAILABLE",│
   │            │  "recoverable": true}          │
   │            │              │                 │
```

---

## 5. Tool Invocation Flow (Detail)

Shows the internal flow when a sub-agent invokes a tool.

```
┌───────────┐     ┌─────────────┐     ┌────────────┐     ┌─────────┐
│ Sub-Agent │     │ Tool Runner │     │   Tool     │     │Ext. API │
└─────┬─────┘     └──────┬──────┘     └─────┬──────┘     └────┬────┘
      │                  │                  │                 │
      │ tool_call:       │                  │                 │
      │ tavily_search    │                  │                 │
      │ {query: "..."}   │                  │                 │
      │─────────────────>│                  │                 │
      │                  │                  │                 │
      │                  │ validate_args()  │                 │
      │                  │─────────────────>│                 │
      │                  │                  │                 │
      │                  │  ┌─────────────────────────────────┐
      │                  │  │ CHECK TOKEN BUDGET              │
      │                  │  │ If over budget:                 │
      │                  │  │   Return cached or truncate     │
      │                  │  └─────────────────────────────────┘
      │                  │                  │                 │
      │                  │ execute()        │                 │
      │                  │─────────────────>│                 │
      │                  │                  │                 │
      │                  │                  │ HTTP request    │
      │                  │                  │────────────────>│
      │                  │                  │                 │
      │                  │                  │  ┌──────────────┐
      │                  │                  │  │ Response     │
      │                  │                  │  │ Processing:  │
      │                  │                  │  │ - Parse JSON │
      │                  │                  │  │ - Extract    │
      │                  │                  │  │   results    │
      │                  │                  │  │ - Format     │
      │                  │                  │  │   output     │
      │                  │                  │  └──────────────┘
      │                  │                  │                 │
      │                  │                  │ 200 OK + data   │
      │                  │                  │<────────────────│
      │                  │                  │                 │
      │                  │  ┌─────────────────────────────────┐
      │                  │  │ TRUNCATE IF NEEDED              │
      │                  │  │ If result > 2000 tokens:        │
      │                  │  │   Truncate to fit budget        │
      │                  │  └─────────────────────────────────┘
      │                  │                  │                 │
      │                  │ tool_result      │                 │
      │                  │<─────────────────│                 │
      │                  │                  │                 │
      │ formatted_result │                  │                 │
      │<─────────────────│                  │                 │
      │                  │                  │                 │
```

---

## 6. SSE Streaming Timeline

Visual timeline of SSE events during a typical analysis.

```
Time (seconds)
│
0s    │ ──▶ POST /api/chat received
      │
0.1s  │ ──▶ SSE: {"type": "progress", "agent": "coordinator", "status": "started"}
      │
0.5s  │ ──▶ SSE: {"type": "progress", "agent": "job_analyzer", "status": "started"}
      │
      │     [Tavily API call: ~2s]
      │     [Exa API call: ~1.5s]
      │
4s    │ ──▶ SSE: {"type": "progress", "agent": "job_analyzer", "status": "completed"}
      │
4.1s  │ ──▶ SSE: {"type": "progress", "agent": "skill_researcher", "status": "started"}
      │
      │     [Tool calls: ~3s]
      │
7s    │ ──▶ SSE: {"type": "progress", "agent": "skill_researcher", "status": "completed"}
      │
7.1s  │ ──▶ SSE: {"type": "progress", "agent": "report_synthesizer", "status": "started"}
      │
      │     [Tool calls: ~3s]
      │
10s   │ ──▶ SSE: {"type": "progress", "agent": "report_synthesizer", "status": "completed"}
      │
      │     [Coordinator synthesis begins]
      │
12s   │ ──▶ SSE: {"type": "token", "content": "Based on "}
12.1s │ ──▶ SSE: {"type": "token", "content": "my analysis "}
12.2s │ ──▶ SSE: {"type": "token", "content": "of current "}
      │     ... [streaming continues, ~50 tokens/second]
      │
40s   │ ──▶ SSE: {"type": "source", "url": "https://...", "title": "..."}
40.1s │ ──▶ SSE: {"type": "source", "url": "https://...", "title": "..."}
      │
45s   │ ──▶ SSE: {"type": "done", "total_tokens": 1650, "duration_ms": 45000}
      │
```

---

## 7. State Machine: Request Lifecycle

```
                              ┌─────────────┐
                              │   RECEIVED  │
                              └──────┬──────┘
                                     │
                              validate request
                                     │
                    ┌────────────────┼────────────────┐
                    │                │                │
                    ▼                ▼                ▼
             ┌──────────┐     ┌───────────┐    ┌──────────┐
             │ INVALID  │     │PROCESSING │    │RATE_     │
             │          │     │           │    │LIMITED   │
             └────┬─────┘     └─────┬─────┘    └────┬─────┘
                  │                 │               │
             return 400        invoke agent   return 429
                  │                 │               │
                  ▼                 │               ▼
             ┌─────────┐           │          ┌─────────┐
             │ DONE    │           │          │  DONE   │
             │ (error) │           │          │ (error) │
             └─────────┘           │          └─────────┘
                                   │
                    ┌──────────────┴──────────────┐
                    │                             │
                    ▼                             ▼
             ┌───────────┐                 ┌───────────┐
             │ STREAMING │                 │  ERROR    │
             │           │                 │           │
             └─────┬─────┘                 └─────┬─────┘
                   │                             │
          stream tokens                    stream error
          stream sources                         │
                   │                             │
                   ▼                             ▼
             ┌───────────┐                 ┌───────────┐
             │   DONE    │                 │   DONE    │
             │ (success) │                 │ (error)   │
             └───────────┘                 └───────────┘
```

---

## 8. Parallel Sub-Agent Execution (Future)

For future optimization, sub-agents can run in parallel:

```
┌───────────┐
│Coordinator│
└─────┬─────┘
      │
      │ dispatch_parallel()
      │
      ├─────────────────┬─────────────────┐
      │                 │                 │
      ▼                 ▼                 ▼
┌───────────┐    ┌───────────┐    ┌───────────┐
│JobAnalyzer│    │SkillRes.  │    │ReportSynth│
│           │    │           │    │           │
│  [3-4s]   │    │  [3-4s]   │    │  [3-4s]   │
│           │    │           │    │           │
└─────┬─────┘    └─────┬─────┘    └─────┬─────┘
      │                │                │
      └────────────────┼────────────────┘
                       │
                       ▼
                ┌───────────┐
                │  await    │
                │  all()    │
                └─────┬─────┘
                      │
                      ▼
               ┌────────────┐
               │ synthesize │
               │  results   │
               └────────────┘

Sequential: ~10-12s for sub-agents
Parallel:   ~4s for sub-agents (3x faster)
```

---

*Sequence Diagrams - Addressing Gap 1 from expert feedback*
