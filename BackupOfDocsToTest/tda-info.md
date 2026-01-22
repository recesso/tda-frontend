# TDA (Talent Demand Analyst) Project Documentation

> **Document Purpose:** Integration reference for SBT Hub enterprise architecture  
> **Last Updated:** January 2026  
> **Version:** 0.1.0

---

## 1. Project Overview

### Project Name and Purpose

| Attribute | Value |
|-----------|-------|
| **Name** | Talent Demand Analyst (TDA) |
| **Type** | Standalone Frontend + Remote AI Agent |
| **Purpose** | AI-powered analysis of talent demand trends, workforce planning, and skills requirements |
| **Parent Ecosystem** | Skill Bridge Talent |

**Core Capabilities:**
- Real-time talent demand analysis
- Workforce trend identification
- Skills gap assessment
- Labor market insights
- Sector-specific analysis
- Compensation benchmarking
- Geographic talent distribution analysis

### Tech Stack

| Layer | Technology | Version |
|-------|------------|---------|
| **Framework** | Next.js | 16.1.1 |
| **UI Runtime** | React | 19.2.3 |
| **Language** | TypeScript | ^5 |
| **Styling** | Tailwind CSS | ^3.4.18 |
| **Markdown Rendering** | react-markdown | ^10.1.0 |
| **HTTP Client** | undici | ^6.23.0 |
| **Notifications** | react-hot-toast | ^2.6.0 |
| **AI Orchestration** | LangGraph / LangSmith | Remote deployment |
| **LLM** | Claude (via LangSmith) | Managed by agent |
| **Embeddings** | Voyage AI (via LangSmith) | Managed by agent |

### Deployment Environment

| Environment | Platform | Notes |
|-------------|----------|-------|
| **Production** | Vercel / Standalone Docker | `output: "standalone"` configured |
| **Staging** | N/A | Not currently deployed |
| **Development** | Local Node.js | `npm run dev` |

---

## 2. Data Model

### Local Data Storage

**⚠️ IMPORTANT: TDA has NO local database.**

All data is either:
1. **Ephemeral** - Stored in browser memory (React state)
2. **Remote** - Persisted in LangSmith thread storage

### Client-Side Data Models

#### Message Model

```typescript
interface Message {
  id?: string;                    // Unique identifier for tracking
  role: 'user' | 'agent' | 'system';
  content: string;                // Rendered text content
  timestamp: Date;
  chunks?: DisplayChunk[];        // Preserved structure for agent messages
}
```

#### DisplayChunk Model

```typescript
interface DisplayChunk {
  id: string;                     // Unique chunk ID (e.g., "tool_use_1704067200000_abc123")
  type: 'message' | 'tool_use' | 'tool_result' | 'agent_question';
  content?: string;               // Text content for messages
  toolName?: string;              // For tool_use: name of tool invoked
  workerName?: string;            // For tool_use: sub-agent name
  toolInput?: any;                // For tool_use: parameters passed
  toolResult?: any;               // For tool_result: returned data
  toolCallId?: string;            // For tool_result: matching tool_use ID
  timestamp: number;              // Unix timestamp
}
```

#### Artifact Model

```typescript
interface Artifact {
  filePath: string;               // Full path from agent (e.g., "/reports/analysis.md")
  content: string;                // File content (markdown/text)
  fileName: string;               // Display name (e.g., "analysis.md")
}
```

### Remote Data Storage (LangSmith)

#### Thread State Structure

```typescript
// Stored in LangSmith /threads/{threadId}/state
interface ThreadState {
  values: {
    messages: LangSmithMessage[];     // Conversation history
    files?: Record<string, FileData>; // Generated files keyed by path
    artifacts?: any[];                // Additional artifacts
    agent_memory?: string;            // System prompt (not displayed)
  };
}

interface FileData {
  content: string[];              // Array of strings (joined for display)
  created_at: string;             // ISO timestamp
  modified_at: string;            // ISO timestamp
}
```

### Relationships

```
┌─────────────────────────────────────────────────────────────────┐
│                    DATA RELATIONSHIP MODEL                       │
└─────────────────────────────────────────────────────────────────┘

Browser Session (Ephemeral)
    │
    ├── messages[] ─────────────────┐
    │       │                       │
    │       └── chunks[] ───────────┼── DisplayChunk[]
    │                               │
    ├── artifacts[] ────────────────┼── Artifact[]
    │                               │
    └── threadIdRef ────────────────┘
              │
              │ Links to
              ▼
LangSmith Thread (Persistent)
    │
    ├── thread_id (UUID)
    │
    ├── messages[] ─────────────── Conversation history
    │
    ├── files{} ────────────────── Generated reports
    │
    └── runs[] ─────────────────── Execution history
```

---

## 3. Analysis/Evidence Generation

### Types of Evidence Generated

TDA generates several types of analytical outputs through its AI agent:

| Evidence Type | Description | Format |
|---------------|-------------|--------|
| **Talent Demand Analysis** | Comprehensive demand trends for roles/skills | Markdown report |
| **Sector Assessment** | Industry-specific workforce analysis | Structured markdown |
| **Skills Gap Analysis** | Current vs. required skills comparison | Markdown with data |
| **Workforce Trends Report** | Historical and projected workforce patterns | Markdown report |
| **Compensation Benchmarks** | Salary and benefits analysis | Structured data |
| **Geographic Distribution** | Talent availability by location | Markdown with tables |

### Sector Assessment Structure

```markdown
# Sector Assessment: [Industry Name]

## Executive Summary
[High-level findings and key insights]

## Market Overview
- Industry size and growth trajectory
- Key players and market dynamics
- Regulatory environment

## Talent Landscape
### Current Workforce Composition
- Total employment figures
- Role distribution
- Skill concentrations

### Demand Drivers
1. [Primary driver with explanation]
2. [Secondary driver with explanation]
3. [Tertiary driver with explanation]

### Supply Analysis
- Available talent pools
- Educational pipeline
- Geographic concentrations

## Skills Analysis
### In-Demand Skills
| Skill | Demand Level | Growth Rate | Scarcity |
|-------|--------------|-------------|----------|
| [Skill 1] | High/Medium/Low | +X% YoY | High/Medium/Low |

### Emerging Skills
[List of emerging skills with context]

### Declining Skills
[List of skills with decreasing demand]

## Compensation Trends
[Salary ranges, benefits, equity trends]

## Recommendations
1. [Strategic recommendation]
2. [Tactical recommendation]
3. [Operational recommendation]

## Data Sources
[List of data sources used]
```

### Talent Demand Analysis Format

```markdown
# Talent Demand Analysis: [Role/Skill/Domain]

## Query Context
- Analysis date: [Date]
- Scope: [Geographic/Industry/Timeframe]
- Focus areas: [Specific aspects analyzed]

## Demand Overview
### Current State
[Quantitative and qualitative demand assessment]

### Historical Trends
[3-5 year demand trajectory]

### Future Projections
[Forward-looking analysis with confidence levels]

## Key Findings

### Finding 1: [Title]
**Evidence:** [Supporting data/research]
**Implications:** [What this means for workforce planning]

### Finding 2: [Title]
...

## Detailed Analysis

### By Industry Vertical
| Industry | Demand Level | Growth | Key Drivers |
|----------|--------------|--------|-------------|
| [Industry] | High/Medium/Low | +X% | [Drivers] |

### By Geography
| Region | Demand | Supply | Gap |
|--------|--------|--------|-----|
| [Region] | [Level] | [Level] | [Gap analysis] |

### By Experience Level
[Junior/Mid/Senior demand breakdown]

## Recommendations
[Actionable recommendations based on analysis]
```

### Gap Analysis Output

```markdown
# Skills Gap Analysis: [Context]

## Current State Assessment
### Existing Capabilities
[Inventory of current skills/roles]

### Proficiency Levels
| Skill/Capability | Current Level | Required Level | Gap |
|------------------|---------------|----------------|-----|
| [Skill] | 1-5 scale | 1-5 scale | Delta |

## Gap Identification

### Critical Gaps (Immediate Action Required)
1. **[Gap Name]**
   - Current state: [Description]
   - Target state: [Description]
   - Impact: [Business impact of gap]
   - Urgency: High

### Significant Gaps (Medium-term Focus)
...

### Emerging Gaps (Monitor & Prepare)
...

## Root Cause Analysis
[Why gaps exist]

## Remediation Strategies
### Build (Internal Development)
[Training, upskilling programs]

### Buy (External Acquisition)
[Hiring strategies]

### Borrow (Contingent/Contract)
[Contractor, consultant strategies]

### Bridge (Interim Solutions)
[Short-term workarounds]

## Implementation Roadmap
| Phase | Timeline | Actions | Investment |
|-------|----------|---------|------------|
| 1 | 0-3 months | [Actions] | [Cost] |
| 2 | 3-6 months | [Actions] | [Cost] |
| 3 | 6-12 months | [Actions] | [Cost] |
```

### File Storage Location

```
┌─────────────────────────────────────────────────────────────────┐
│                    FILE STORAGE ARCHITECTURE                     │
└─────────────────────────────────────────────────────────────────┘

Generated files are stored in TWO locations:

1. LangSmith Thread State (Authoritative)
   └── /threads/{threadId}/state
       └── values.files
           └── {"/path/filename.md": {content: [...], created_at, modified_at}}

2. Browser Memory (Ephemeral)
   └── React state: artifacts[]
       └── {filePath, content, fileName}

Download Process:
   artifacts[] → Blob creation → Browser download
```

---

## 4. User Authentication

### Current Authentication Method

**⚠️ TDA currently has NO authentication.**

| Aspect | Status |
|--------|--------|
| **User Authentication** | None - Public access |
| **Session Management** | Browser-only (not persisted) |
| **User Identification** | None |
| **Multi-tenant Isolation** | None |

### How It Identifies Users

**It doesn't.** TDA operates as a standalone, anonymous tool.

```typescript
// Current state - no user identification
// All requests are anonymous
const response = await fetch('/api/agents/talent-demand', {
  method: 'POST',
  body: JSON.stringify({
    userMessage,    // No user ID
    threadId,       // Only conversation tracking
  }),
});
```

### Integration with Hub Authentication

**Current State:** No integration exists.

**Required for Hub Integration:**
```typescript
// PROPOSED: Future authenticated request structure
interface AuthenticatedRequest {
  userMessage: string;
  threadId: string;
  
  // NEW: Hub integration fields
  userId: string;           // From Hub JWT
  tenantId: string;         // From Hub JWT
  projectId: string;        // From Hub context
  organizationId: string;   // From Hub context
}
```

---

## 5. Project/Tenant Context

### Current Project Context

**⚠️ TDA has NO project or tenant context.**

| Aspect | Current State | Hub Integration Need |
|--------|---------------|---------------------|
| **Project Identification** | None | Needs `projectId` from Hub |
| **Tenant Isolation** | None | Needs `tenantId` from Hub JWT |
| **Organization Context** | None | Needs `organizationId` from Hub |
| **Data Isolation** | None | Needs row-level filtering |

### Data Isolation Between Tenants

**Current:** No isolation - all users share anonymous access.

**Required Architecture for Hub Integration:**

```
┌─────────────────────────────────────────────────────────────────┐
│                PROPOSED MULTI-TENANT ARCHITECTURE                │
└─────────────────────────────────────────────────────────────────┘

Hub Request Flow:
    │
    ▼
┌─────────────────────────────────────────────────────────────────┐
│ 1. Hub Frontend                                                  │
│    - User authenticated via Hub JWT                             │
│    - tenantId, userId, projectId in context                     │
└─────────────────────────────────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────────────────────────────────┐
│ 2. TDA API (Modified)                                            │
│    - Validate Hub JWT                                            │
│    - Extract tenant context                                      │
│    - Pass context to LangSmith                                   │
└─────────────────────────────────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────────────────────────────────┐
│ 3. LangSmith Agent                                               │
│    - Receive tenant context in metadata                          │
│    - Tag generated files with tenantId/projectId                │
│    - Return files to Hub for storage                             │
└─────────────────────────────────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────────────────────────────────┐
│ 4. Hub Evidence Storage                                          │
│    - Store TDA outputs as Evidence                               │
│    - Apply tenant isolation (tenantId filter)                    │
│    - Link to Project                                             │
└─────────────────────────────────────────────────────────────────┘
```

---

## 6. API Structure

### External APIs Exposed

| Endpoint | Method | Purpose | Auth |
|----------|--------|---------|------|
| `/api/agents/talent-demand` | POST | Stream agent response | None |
| `/api/agents/talent-demand` | GET | Agent configuration | None |
| `/api/agents/talent-demand/state` | POST | Get thread state | None |
| `/api/agents/talent-demand/runs` | POST | Get run status | None |

### API Endpoint Details

#### POST /api/agents/talent-demand

**Purpose:** Proxy user message to LangSmith and stream response

**Request:**
```typescript
{
  userMessage: string;      // User's question/query
  threadId: string;         // Conversation thread ID
}
```

**Response:** Server-Sent Events stream

**Headers:**
```
Content-Type: text/event-stream
Cache-Control: no-cache
Connection: keep-alive
X-Thread-Id: {langSmithThreadId}
```

#### POST /api/agents/talent-demand/state

**Purpose:** Retrieve complete thread state including generated files

**Request:**
```typescript
{
  threadId: string;         // LangSmith thread UUID
}
```

**Response:**
```typescript
{
  toolOutputs: Array<{
    toolUseId: string;
    output: any;
    toolName: string;
    timestamp?: string;
  }>;
  files: Array<{
    filePath: string;
    content: string;
    fileName: string;
    toolUseId: string;
  }>;
  messageCount: number;
  success: boolean;
}
```

#### POST /api/agents/talent-demand/runs

**Purpose:** Check run completion status for polling

**Request:**
```typescript
{
  threadId: string;         // LangSmith thread UUID
}
```

**Response:**
```typescript
{
  latestRun: {
    runId: string;
    status: 'pending' | 'running' | 'success' | 'error' | 'unknown';
    createdAt?: string;
    updatedAt?: string;
  } | null;
  allRuns: RunStatus[];
  success: boolean;
}
```

### Internal API Patterns

```typescript
// All API routes follow this pattern:

// 1. Validate request body
const body = await request.json();
if (!body.requiredField) {
  return NextResponse.json({ error: 'Field required' }, { status: 400 });
}

// 2. Get server-side credentials (never exposed to client)
const apiKey = process.env.LANGSMITH_API_KEY;

// 3. Proxy to LangSmith with authentication
const response = await fetch(`${AGENT_URL}/endpoint`, {
  headers: {
    'X-Api-Key': apiKey,
    'X-Auth-Scheme': 'langsmith-api-key',
  },
  // ...
});

// 4. Transform and return response
return NextResponse.json(transformedData);
```

### Webhook Capabilities

**Current State:** No webhook support.

**Potential Future Webhooks:**

| Event | Trigger | Payload |
|-------|---------|---------|
| `analysis.complete` | Agent finishes analysis | `{threadId, files[], projectId}` |
| `artifact.generated` | File created | `{fileName, filePath, content}` |
| `error.occurred` | Analysis fails | `{threadId, error, timestamp}` |

---

## 7. AI/Analysis Integration

### AI Models Used

| Model | Provider | Purpose | Access |
|-------|----------|---------|--------|
| **Claude** | Anthropic | Lead agent reasoning, analysis | Via LangSmith |
| **Voyage AI** | Voyage | Embeddings for RAG | Via LangSmith |

### Agent Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    LANGGRAPH AGENT ARCHITECTURE                  │
└─────────────────────────────────────────────────────────────────┘

                    ┌─────────────────────┐
                    │    Lead Agent       │
                    │    (Claude)         │
                    │                     │
                    │ - Query analysis    │
                    │ - Task delegation   │
                    │ - Result synthesis  │
                    └──────────┬──────────┘
                               │
              ┌────────────────┼────────────────┐
              │                │                │
              ▼                ▼                ▼
    ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
    │  Research       │ │  Analysis       │ │  Write File     │
    │  Sub-Agent      │ │  Sub-Agent      │ │  Sub-Agent      │
    │                 │ │                 │ │                 │
    │ - Web search    │ │ - Data analysis │ │ - Report gen    │
    │ - Data gather   │ │ - Trend calc    │ │ - File creation │
    └─────────────────┘ └─────────────────┘ └─────────────────┘
```

### How Analysis is Performed

```
User Query: "What are the talent demand trends for AI engineers?"
    │
    ▼
┌─────────────────────────────────────────────────────────────────┐
│ 1. Query Understanding (Lead Agent)                              │
│    - Parse intent: talent demand analysis                        │
│    - Identify scope: AI engineers                                │
│    - Determine output: comprehensive report                      │
└─────────────────────────────────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────────────────────────────────┐
│ 2. Research Phase (Sub-Agents)                                   │
│    - Market data collection                                      │
│    - Industry reports analysis                                   │
│    - Job posting trends                                          │
│    - Compensation data                                           │
└─────────────────────────────────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────────────────────────────────┐
│ 3. Analysis Phase (Analysis Sub-Agent)                           │
│    - Trend identification                                        │
│    - Pattern recognition                                         │
│    - Comparative analysis                                        │
│    - Projection modeling                                         │
└─────────────────────────────────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────────────────────────────────┐
│ 4. Synthesis Phase (Lead Agent)                                  │
│    - Consolidate findings                                        │
│    - Generate insights                                           │
│    - Create recommendations                                      │
└─────────────────────────────────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────────────────────────────────┐
│ 5. Output Generation (Write File Sub-Agent)                      │
│    - Format as markdown report                                   │
│    - Structure with headers/tables                               │
│    - Save to thread state                                        │
└─────────────────────────────────────────────────────────────────┘
```

### Data Sources Used

| Source Type | Examples | Access Method |
|-------------|----------|---------------|
| **Public Market Data** | BLS, LinkedIn Economic Graph | Web search |
| **Industry Reports** | Gartner, Forrester, McKinsey | Web search |
| **Job Posting Data** | LinkedIn, Indeed, Glassdoor | Web scraping |
| **Salary Data** | Levels.fyi, Glassdoor, Payscale | Web search |
| **Company Data** | Public filings, press releases | Web search |
| **Academic Research** | Papers, studies | Web search |

---

## 8. Output Data Structures

### Sector Assessment Structure

```json
{
  "type": "sector_assessment",
  "metadata": {
    "sector": "Technology - Artificial Intelligence",
    "generated_at": "2026-01-13T10:30:00Z",
    "analysis_period": "2023-2026",
    "confidence_level": "high"
  },
  "executive_summary": {
    "key_finding": "AI engineering talent demand increased 45% YoY",
    "market_size": "$150B global AI market",
    "talent_gap": "500,000+ unfilled AI positions globally",
    "outlook": "continued growth expected through 2030"
  },
  "market_overview": {
    "industry_size": {
      "current": "$150B",
      "projected_2030": "$1.8T",
      "cagr": "38.1%"
    },
    "key_players": ["OpenAI", "Google", "Microsoft", "Anthropic", "Meta"],
    "growth_drivers": [
      "Enterprise AI adoption",
      "Generative AI applications",
      "Automation demand"
    ]
  },
  "talent_landscape": {
    "current_workforce": {
      "total_employed": 2500000,
      "by_role": {
        "ml_engineers": 800000,
        "data_scientists": 650000,
        "ai_researchers": 150000,
        "mlops_engineers": 400000,
        "other": 500000
      }
    },
    "demand_indicators": {
      "open_positions": 500000,
      "time_to_fill_days": 89,
      "offer_acceptance_rate": 0.72
    }
  },
  "skills_analysis": {
    "in_demand": [
      {"skill": "PyTorch", "demand_level": "critical", "growth_rate": 0.35},
      {"skill": "LLM Fine-tuning", "demand_level": "critical", "growth_rate": 0.85},
      {"skill": "MLOps", "demand_level": "high", "growth_rate": 0.45}
    ],
    "emerging": [
      {"skill": "AI Agents", "maturity": "early", "projected_demand": "very_high"},
      {"skill": "Multimodal AI", "maturity": "growing", "projected_demand": "high"}
    ]
  },
  "compensation": {
    "ranges_usd": {
      "entry_level": {"min": 120000, "max": 180000, "median": 150000},
      "mid_level": {"min": 180000, "max": 280000, "median": 230000},
      "senior": {"min": 280000, "max": 450000, "median": 350000},
      "staff_plus": {"min": 400000, "max": 800000, "median": 550000}
    },
    "equity_typical": "0.05% - 0.5% at startups",
    "bonus_range": "15-30% of base"
  }
}
```

### Internal Scan Format

```json
{
  "type": "internal_scan",
  "metadata": {
    "organization": "[Organization Name]",
    "scan_date": "2026-01-13",
    "scope": "engineering_department"
  },
  "current_capabilities": {
    "headcount": {
      "total": 150,
      "by_function": {
        "software_engineering": 80,
        "data_engineering": 25,
        "ml_engineering": 20,
        "devops": 15,
        "management": 10
      }
    },
    "skills_inventory": [
      {
        "skill": "Python",
        "proficiency_avg": 4.2,
        "headcount": 120,
        "trend": "stable"
      },
      {
        "skill": "Machine Learning",
        "proficiency_avg": 3.1,
        "headcount": 35,
        "trend": "growing"
      }
    ]
  },
  "capability_gaps": [
    {
      "capability": "LLM Development",
      "current_state": "limited",
      "target_state": "established",
      "gap_severity": "high",
      "headcount_needed": 8
    }
  ],
  "recommendations": [
    {
      "action": "hire_llm_engineers",
      "priority": "high",
      "timeline": "Q1 2026",
      "investment": "$1.2M annual"
    }
  ]
}
```

### Talent Demand Analysis JSON

```json
{
  "type": "talent_demand_analysis",
  "query": {
    "original": "What are the talent demand trends for AI engineers?",
    "parsed_intent": "demand_trend_analysis",
    "scope": {
      "role": "AI Engineer",
      "geography": "global",
      "timeframe": "2023-2026"
    }
  },
  "demand_metrics": {
    "current_demand": {
      "open_positions": 523000,
      "yoy_growth": 0.45,
      "demand_level": "very_high"
    },
    "historical_trend": [
      {"year": 2023, "positions": 280000, "growth": 0.28},
      {"year": 2024, "positions": 360000, "growth": 0.29},
      {"year": 2025, "positions": 450000, "growth": 0.25},
      {"year": 2026, "positions": 523000, "growth": 0.16}
    ],
    "projections": [
      {"year": 2027, "positions": 620000, "confidence": 0.85},
      {"year": 2028, "positions": 750000, "confidence": 0.75},
      {"year": 2030, "positions": 1100000, "confidence": 0.60}
    ]
  },
  "supply_metrics": {
    "available_talent": 180000,
    "annual_graduates": 45000,
    "supply_gap": 343000,
    "talent_sources": [
      {"source": "universities", "annual_supply": 45000},
      {"source": "bootcamps", "annual_supply": 15000},
      {"source": "career_transitions", "annual_supply": 25000}
    ]
  },
  "geographic_distribution": {
    "by_region": [
      {"region": "North America", "demand_share": 0.35, "growth": 0.40},
      {"region": "Europe", "demand_share": 0.25, "growth": 0.38},
      {"region": "Asia Pacific", "demand_share": 0.30, "growth": 0.55},
      {"region": "Rest of World", "demand_share": 0.10, "growth": 0.45}
    ],
    "top_cities": [
      {"city": "San Francisco", "positions": 52000},
      {"city": "New York", "positions": 38000},
      {"city": "London", "positions": 31000},
      {"city": "Bangalore", "positions": 48000}
    ]
  },
  "industry_breakdown": [
    {"industry": "Technology", "demand_share": 0.45, "growth": 0.50},
    {"industry": "Finance", "demand_share": 0.20, "growth": 0.42},
    {"industry": "Healthcare", "demand_share": 0.12, "growth": 0.65},
    {"industry": "Retail/E-commerce", "demand_share": 0.10, "growth": 0.38}
  ],
  "key_findings": [
    {
      "finding": "LLM expertise premium",
      "detail": "Engineers with LLM experience command 40% salary premium",
      "confidence": 0.90
    },
    {
      "finding": "Remote work impact",
      "detail": "78% of AI roles now offer remote or hybrid options",
      "confidence": 0.95
    }
  ],
  "recommendations": [
    {
      "for": "employers",
      "recommendation": "Invest in internal upskilling programs",
      "rationale": "External hiring alone cannot fill the gap"
    },
    {
      "for": "professionals",
      "recommendation": "Focus on LLM and agent development skills",
      "rationale": "Highest growth and compensation premium"
    }
  ]
}
```

### Gap Analysis Format

```json
{
  "type": "gap_analysis",
  "metadata": {
    "analysis_date": "2026-01-13",
    "scope": "AI/ML Capabilities",
    "organization": "[Organization Name]"
  },
  "current_state": {
    "capabilities": [
      {
        "name": "Machine Learning Operations",
        "maturity_level": 2,
        "maturity_scale": "1-5",
        "description": "Basic ML pipelines in place, manual deployment"
      },
      {
        "name": "LLM Development",
        "maturity_level": 1,
        "maturity_scale": "1-5",
        "description": "Exploratory only, no production systems"
      }
    ],
    "headcount": {
      "ml_engineers": 5,
      "data_scientists": 8,
      "mlops": 2
    }
  },
  "target_state": {
    "capabilities": [
      {
        "name": "Machine Learning Operations",
        "target_maturity": 4,
        "description": "Automated ML pipelines, A/B testing, monitoring"
      },
      {
        "name": "LLM Development",
        "target_maturity": 3,
        "description": "Production LLM applications, fine-tuning capability"
      }
    ],
    "headcount": {
      "ml_engineers": 12,
      "data_scientists": 10,
      "mlops": 6,
      "llm_engineers": 4
    }
  },
  "gaps": [
    {
      "capability": "LLM Development",
      "current": 1,
      "target": 3,
      "gap": 2,
      "severity": "critical",
      "business_impact": "Unable to leverage generative AI opportunities",
      "remediation": {
        "approach": "build_and_buy",
        "actions": [
          "Hire 4 LLM engineers",
          "Train 3 existing ML engineers",
          "Partner with AI consultancy for knowledge transfer"
        ],
        "timeline": "6-9 months",
        "investment": "$800K-1.2M"
      }
    },
    {
      "capability": "MLOps",
      "current": 2,
      "target": 4,
      "gap": 2,
      "severity": "high",
      "business_impact": "Slow deployment cycles, reliability issues",
      "remediation": {
        "approach": "build",
        "actions": [
          "Hire 4 MLOps engineers",
          "Implement ML platform (MLflow/Kubeflow)",
          "Establish CI/CD for ML"
        ],
        "timeline": "9-12 months",
        "investment": "$600K-900K"
      }
    }
  ],
  "prioritized_actions": [
    {
      "priority": 1,
      "action": "Hire LLM engineering lead",
      "timeline": "Immediate",
      "owner": "VP Engineering"
    },
    {
      "priority": 2,
      "action": "Select and implement ML platform",
      "timeline": "Q1 2026",
      "owner": "Platform Team"
    }
  ],
  "investment_summary": {
    "total_estimated": "$1.4M - $2.1M",
    "by_category": {
      "hiring": "$1.0M - $1.5M",
      "training": "$150K - $250K",
      "tools_infrastructure": "$250K - $350K"
    },
    "roi_projection": "Estimated 3x return within 18 months"
  }
}
```

### Capability Requirements Format

```json
{
  "type": "capability_requirements",
  "context": {
    "initiative": "Enterprise AI Platform",
    "timeline": "2026-2027",
    "budget_range": "$2M - $5M"
  },
  "required_capabilities": [
    {
      "capability": "LLM Application Development",
      "priority": "critical",
      "description": "Ability to build, deploy, and maintain LLM-powered applications",
      "skill_requirements": [
        {
          "skill": "LLM Fine-tuning",
          "level": "advanced",
          "headcount": 3
        },
        {
          "skill": "Prompt Engineering",
          "level": "expert",
          "headcount": 2
        },
        {
          "skill": "RAG Architecture",
          "level": "advanced",
          "headcount": 2
        }
      ],
      "infrastructure_requirements": [
        "GPU cluster (A100/H100)",
        "Vector database",
        "Model serving infrastructure"
      ],
      "build_vs_buy": {
        "recommendation": "hybrid",
        "rationale": "Core capabilities in-house, infrastructure managed services"
      }
    },
    {
      "capability": "AI Ethics & Governance",
      "priority": "high",
      "description": "Framework for responsible AI development and deployment",
      "skill_requirements": [
        {
          "skill": "AI Ethics",
          "level": "expert",
          "headcount": 1
        },
        {
          "skill": "Model Evaluation",
          "level": "advanced",
          "headcount": 2
        }
      ]
    }
  ],
  "team_structure": {
    "total_headcount": 15,
    "roles": [
      {"role": "AI Platform Lead", "count": 1, "level": "staff"},
      {"role": "LLM Engineer", "count": 4, "level": "senior"},
      {"role": "ML Engineer", "count": 4, "level": "mid-senior"},
      {"role": "MLOps Engineer", "count": 3, "level": "mid-senior"},
      {"role": "Data Engineer", "count": 2, "level": "mid"},
      {"role": "AI Ethics Lead", "count": 1, "level": "senior"}
    ]
  },
  "timeline": {
    "phases": [
      {
        "phase": 1,
        "name": "Foundation",
        "duration": "3 months",
        "outcomes": ["Core team hired", "Infrastructure provisioned"]
      },
      {
        "phase": 2,
        "name": "Build",
        "duration": "6 months",
        "outcomes": ["Platform MVP", "First LLM application"]
      },
      {
        "phase": 3,
        "name": "Scale",
        "duration": "6 months",
        "outcomes": ["Production deployment", "Full team onboarded"]
      }
    ]
  }
}
```

---

## 9. Environment Configuration

### Required Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `LANGSMITH_API_KEY` | ✅ Yes | LangSmith API key (starts with `lsv2_pt_`) |
| `LANGSMITH_WORKSPACE_ID` | ✅ Yes | LangSmith workspace identifier |
| `LANGSMITH_AGENT_URL` | ❌ No | Custom agent deployment URL |
| `LANGSMITH_ASSISTANT_ID` | ❌ No | Custom assistant ID |

### External Service Dependencies

| Service | Purpose | Required |
|---------|---------|----------|
| **LangSmith** | Agent orchestration | ✅ Yes |
| **LangGraph Cloud** | Agent deployment runtime | ✅ Yes |
| **Anthropic Claude** | LLM (via LangSmith) | ✅ Yes (managed) |
| **Voyage AI** | Embeddings (via LangSmith) | ✅ Yes (managed) |

---

## 10. Integration Needs

### What TDA Would Need from Hub

| Integration Need | Priority | Description |
|------------------|----------|-------------|
| **Authentication** | Critical | JWT validation from Hub auth |
| **Tenant Context** | Critical | `tenantId`, `organizationId` from JWT |
| **Project Context** | Critical | `projectId` for evidence storage |
| **Evidence Storage** | High | API to store generated files as Evidence |
| **User Context** | High | `userId` for attribution |
| **Conversation Persistence** | Medium | Store thread IDs linked to projects |
| **Webhook Notifications** | Medium | Notify Hub when analysis completes |

### Current Limitations in Multi-Tenant Support

| Limitation | Impact | Remediation |
|------------|--------|-------------|
| **No authentication** | Any user can access | Add Hub JWT validation |
| **No tenant isolation** | Data not separated | Add tenantId to all requests |
| **No project linking** | Outputs not saved to Hub | Add Evidence creation API call |
| **No user attribution** | Can't track who ran analysis | Add userId to metadata |
| **Ephemeral storage** | Results lost on refresh | Persist to Hub Evidence table |
| **No audit trail** | Can't track usage | Add logging with user/tenant context |

### Desired Improvements

#### Phase 1: Hub Authentication Integration

```typescript
// PROPOSED: Validate Hub JWT in API routes
import { validateHubJWT } from '@repo/auth';

export async function POST(request: NextRequest) {
  const session = await validateHubJWT(request);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  const { tenantId, userId, role } = session;
  // ... proceed with authenticated request
}
```

#### Phase 2: Evidence Storage Integration

```typescript
// PROPOSED: Store TDA outputs as Hub Evidence
interface TDAEvidencePayload {
  tenantId: string;
  projectId: string;
  userId: string;
  fileName: string;
  content: string;
  evidenceType: 'TALENT_DEMAND_ANALYSIS' | 'SECTOR_ASSESSMENT' | 'GAP_ANALYSIS';
  metadata: {
    threadId: string;
    query: string;
    generatedAt: string;
  };
}

async function saveToHubEvidence(payload: TDAEvidencePayload): Promise<void> {
  await fetch(`${HUB_API_URL}/api/evidence`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${serviceToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
}
```

#### Phase 3: Conversation Persistence

```typescript
// PROPOSED: Link TDA threads to Hub projects
interface TDAConversation {
  id: string;           // CUID
  threadId: string;     // LangSmith thread UUID
  tenantId: string;
  projectId: string;
  userId: string;
  status: 'ACTIVE' | 'COMPLETED' | 'ERROR';
  query: string;
  createdAt: Date;
  updatedAt: Date;
}
```

### Integration Architecture Proposal

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    PROPOSED HUB-TDA INTEGRATION                              │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                              SBT HUB                                         │
│                                                                              │
│  ┌──────────────┐     ┌──────────────┐     ┌──────────────┐                 │
│  │    Auth      │     │   Projects   │     │   Evidence   │                 │
│  │   (JWT)      │     │   (Context)  │     │   (Storage)  │                 │
│  └──────┬───────┘     └──────┬───────┘     └──────▲───────┘                 │
│         │                    │                    │                          │
└─────────┼────────────────────┼────────────────────┼──────────────────────────┘
          │                    │                    │
          │ JWT Validation     │ Project Context    │ Evidence Creation
          │                    │                    │
          ▼                    ▼                    │
┌─────────────────────────────────────────────────────────────────────────────┐
│                           TDA FRONTEND                                       │
│                                                                              │
│  ┌──────────────┐     ┌──────────────┐     ┌──────────────┐                 │
│  │  Auth        │     │   Context    │     │   Output     │                 │
│  │  Middleware  │────▶│   Provider   │────▶│   Handler    │─────────────────┘
│  └──────────────┘     └──────────────┘     └──────────────┘
│                                                   │
│                                                   │
│                                                   ▼
│                                            ┌──────────────┐
│                                            │  LangSmith   │
│                                            │  Agent       │
│                                            └──────────────┘
│                                                              │
└─────────────────────────────────────────────────────────────────────────────┘

Data Flow:
1. User authenticates via Hub → JWT issued
2. User navigates to TDA from Hub context (with projectId)
3. TDA validates JWT → extracts tenantId, userId
4. TDA passes context to LangSmith agent
5. Agent generates analysis → returns to TDA
6. TDA saves output to Hub Evidence table
7. User can view/download in both TDA and Hub
```

---

## Appendix: Quick Reference

### API Endpoints Summary

```
TDA Frontend APIs:
├── POST /api/agents/talent-demand      → Stream agent response
├── GET  /api/agents/talent-demand      → Agent config
├── POST /api/agents/talent-demand/state → Get thread state
└── POST /api/agents/talent-demand/runs  → Get run status

LangSmith APIs (proxied):
├── POST /threads                        → Create thread
├── POST /threads/{id}/runs/stream       → Stream response
├── GET  /threads/{id}/state             → Get state
└── GET  /threads/{id}/runs              → Get runs
```

### Data Types Quick Reference

```typescript
// Core types
type MessageRole = 'user' | 'agent' | 'system';
type ChunkType = 'message' | 'tool_use' | 'tool_result' | 'agent_question';
type RunStatus = 'pending' | 'running' | 'success' | 'error' | 'unknown';

// Analysis output types
type AnalysisType = 
  | 'talent_demand_analysis'
  | 'sector_assessment'
  | 'gap_analysis'
  | 'internal_scan'
  | 'capability_requirements';
```

---

*Document generated for SBT Hub enterprise integration planning*  
*Last updated: January 2026*
