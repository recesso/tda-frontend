# TDA Frontend Data Architecture

> **Last Updated:** January 2026 (v0.1.0)  
> **Application Type:** Next.js Frontend with LangGraph Agent Proxy  
> **No Local Database:** All persistent data stored in LangSmith  

This document provides a complete reference for the Talent Demand Analyst (TDA) Frontend data architecture, including data structures, API flows, state management, and external integrations.

---

## Table of Contents

1. [Overview](#overview)
2. [Architecture Pattern](#architecture-pattern)
3. [Technology Stack](#technology-stack)
4. [Data Structures](#data-structures)
5. [API Routes & Endpoints](#api-routes--endpoints)
6. [Data Flow Diagrams](#data-flow-diagrams)
7. [State Management](#state-management)
8. [External Integrations](#external-integrations)
9. [SSE Stream Processing](#sse-stream-processing)
10. [Security Model](#security-model)
11. [Environment Configuration](#environment-configuration)
12. [Operations](#operations)

---

## Overview

### System Summary

| Aspect | Description |
|--------|-------------|
| **Type** | Standalone Next.js frontend application |
| **Purpose** | UI for Talent Demand Analyst AI agent |
| **Data Storage** | None local - LangSmith handles all persistence |
| **Auth** | None (standalone public access) |
| **Deployment** | Vercel / standalone Docker |

### Core Functionality

1. **Chat Interface** - User sends queries about talent demand trends
2. **Agent Proxy** - Routes requests to LangSmith agent deployment
3. **Stream Processing** - Real-time SSE parsing for agent responses
4. **Artifact Download** - File generation and retrieval from agent
5. **Multi-turn Conversations** - Thread-based conversation continuity

---

## Architecture Pattern

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              TDA FRONTEND                                    │
│                         (Next.js Application)                                │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    │ HTTP/SSE
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                          LANGSMITH / LANGGRAPH                               │
│                        (Remote Agent Deployment)                             │
│                                                                              │
│   ┌──────────────┐    ┌──────────────┐    ┌──────────────┐                  │
│   │ Lead Agent   │───▶│ Sub-Agents   │───▶│ Tool Results │                  │
│   │ (Claude)     │    │ (Workers)    │    │ (Files)      │                  │
│   └──────────────┘    └──────────────┘    └──────────────┘                  │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Frontend-Only Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                             TDA FRONTEND                                     │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   ┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐       │
│   │   app/page.tsx  │     │  lib/talent-    │     │   app/api/      │       │
│   │   (Chat UI)     │────▶│  demand-agent.ts│────▶│   agents/       │       │
│   │                 │     │  (Stream Client)│     │   (API Routes)  │       │
│   └─────────────────┘     └─────────────────┘     └─────────────────┘       │
│           │                       │                       │                  │
│           │                       │                       │                  │
│           ▼                       ▼                       ▼                  │
│   ┌─────────────────────────────────────────────────────────────────┐       │
│   │                     React State (In-Memory)                      │       │
│   │  - messages[]        - threadId          - artifacts[]          │       │
│   │  - streamingChunks[] - isProcessing      - seenMessageIds       │       │
│   └─────────────────────────────────────────────────────────────────┘       │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    │ No local database
                                    │ All data transient in browser memory
                                    ▼
                        ┌───────────────────────┐
                        │  Browser Session      │
                        │  (Ephemeral)          │
                        └───────────────────────┘
```

---

## Technology Stack

### Core Technologies

| Component | Technology | Version | Purpose |
|-----------|------------|---------|---------|
| **Framework** | Next.js | 16.1.1 | React framework with API routes |
| **Runtime** | React | 19.2.3 | UI components and state |
| **Language** | TypeScript | ^5 | Type safety |
| **Styling** | Tailwind CSS | ^3.4.18 | Utility-first CSS |
| **Markdown** | react-markdown | ^10.1.0 | Render agent responses |
| **HTTP** | undici | ^6.23.0 | Long-lived SSE connections |
| **Notifications** | react-hot-toast | ^2.6.0 | User alerts |

### External Services

| Service | Purpose | Connection |
|---------|---------|------------|
| **LangSmith** | Agent deployment & orchestration | REST + SSE |
| **Voyage AI** | Embeddings (via LangSmith) | Managed by agent |
| **Claude** | LLM (via LangSmith) | Managed by agent |

---

## Data Structures

### TypeScript Interfaces

#### Message (Chat History)

```typescript
interface Message {
  id?: string;                    // Unique identifier for tracking
  role: 'user' | 'agent' | 'system';
  content: string;                // Rendered text content
  timestamp: Date;
  chunks?: DisplayChunk[];        // Preserved structure for agent messages
}
```

#### DisplayChunk (Streaming Response)

```typescript
interface DisplayChunk {
  id: string;                     // Unique chunk ID
  type: 'message' | 'tool_use' | 'tool_result' | 'agent_question';
  content?: string;               // Text content
  toolName?: string;              // For tool_use: name of tool
  workerName?: string;            // For tool_use: sub-agent name
  toolInput?: any;                // For tool_use: parameters
  toolResult?: any;               // For tool_result: returned data
  toolCallId?: string;            // For tool_result: matching tool_use ID
  timestamp: number;              // Unix timestamp
}
```

#### Artifact (Generated Files)

```typescript
interface Artifact {
  filePath: string;               // Full path from agent
  content: string;                // File content
  fileName: string;               // Display name
}
```

#### StreamChunk (From LangSmith)

```typescript
interface StreamChunk {
  type: 'message' | 'tool_use' | 'tool_result' | 'error' | 'end';
  content?: string;
  contentBlocks?: ContentBlock[]; // Structured content from LangSmith
  toolName?: string;
  toolInput?: any;
  toolResult?: any;
  toolCallId?: string;
  error?: string;
  threadId?: string;              // LangSmith thread UUID
}

interface ContentBlock {
  type: 'text' | 'tool_use' | 'tool_result' | string;
  text?: string;
  id?: string;
  name?: string;
  input?: any;
  content?: any;
}
```

### LangSmith Response Structures

#### Thread State Response

```typescript
// GET /threads/{threadId}/state
interface ThreadState {
  values: {
    messages: LangSmithMessage[];
    files?: Record<string, FileData>;  // Object keyed by path
    artifacts?: any[];
  };
}

interface FileData {
  content: string[];              // Array of strings to join
  created_at: string;
  modified_at: string;
}
```

#### Run Status Response

```typescript
// GET /threads/{threadId}/runs
interface RunStatus {
  runId: string;
  status: 'pending' | 'running' | 'success' | 'error' | 'unknown';
  createdAt?: string;
  updatedAt?: string;
}
```

#### SSE Stream Event

```
event: values
data: {"messages":[{"type":"ai","id":"xxx","content":[...]}]}

event: values  
data: [{"type":"ai","id":"xxx","content":"text"}]
```

---

## API Routes & Endpoints

### Internal API Routes

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/agents/talent-demand` | POST | Proxy user message to LangSmith |
| `/api/agents/talent-demand` | GET | Agent configuration info |
| `/api/agents/talent-demand/state` | POST | Retrieve thread state |
| `/api/agents/talent-demand/runs` | POST | Check run completion status |

### Route Details

#### POST /api/agents/talent-demand

**Request:**
```typescript
{
  userMessage: string;      // User's question
  threadId: string;         // Thread ID (UUID or temporary)
}
```

**Response:** SSE Stream with headers:
```
Content-Type: text/event-stream
X-Thread-Id: {langSmithThreadId}
```

**Behavior:**
1. If `threadId` is valid UUID → reuse existing thread
2. If `threadId` is temporary → create new LangSmith thread
3. Stream response from LangSmith runs/stream endpoint

#### POST /api/agents/talent-demand/state

**Request:**
```typescript
{
  threadId: string;         // LangSmith thread UUID
}
```

**Response:**
```typescript
{
  toolOutputs: ToolOutput[];
  files: FileArtifact[];
  messageCount: number;
  success: boolean;
}
```

#### POST /api/agents/talent-demand/runs

**Request:**
```typescript
{
  threadId: string;         // LangSmith thread UUID
}
```

**Response:**
```typescript
{
  latestRun: RunStatus | null;
  allRuns: RunStatus[];
  success: boolean;
}
```

### LangSmith API Endpoints (External)

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/threads` | POST | Create new conversation thread |
| `/threads/{id}/runs/stream` | POST | Stream agent response |
| `/threads/{id}/state` | GET | Get current thread state |
| `/threads/{id}/runs` | GET | Get run status history |

---

## Data Flow Diagrams

### User Message Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          USER MESSAGE FLOW                                   │
└─────────────────────────────────────────────────────────────────────────────┘

1. User types message
   │
   ▼
2. ┌─────────────────────────────────────────────────────────────────┐
   │ sendMessage() called in page.tsx                                │
   │                                                                 │
   │ - Add user message to messages[]                                │
   │ - Clear streamingChunks[]                                       │
   │ - Set isProcessing = true                                       │
   └─────────────────────────────────────────────────────────────────┘
   │
   ▼
3. ┌─────────────────────────────────────────────────────────────────┐
   │ streamAgentResponse() in lib/talent-demand-agent.ts             │
   │                                                                 │
   │ POST /api/agents/talent-demand                                  │
   │ Body: { userMessage, threadId }                                 │
   └─────────────────────────────────────────────────────────────────┘
   │
   ▼
4. ┌─────────────────────────────────────────────────────────────────┐
   │ API Route: /api/agents/talent-demand/route.ts                   │
   │                                                                 │
   │ - Validate/create thread with LangSmith                         │
   │ - POST to LangSmith runs/stream                                 │
   │ - Pipe SSE response to client                                   │
   └─────────────────────────────────────────────────────────────────┘
   │
   ▼
5. ┌─────────────────────────────────────────────────────────────────┐
   │ LangSmith Agent Deployment                                      │
   │                                                                 │
   │ - Lead Agent receives message                                   │
   │ - Delegates to sub-agents (tool_use)                           │
   │ - Aggregates results (tool_result)                             │
   │ - Streams events via SSE                                        │
   └─────────────────────────────────────────────────────────────────┘
```

### SSE Stream Processing Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        SSE STREAM PROCESSING                                 │
└─────────────────────────────────────────────────────────────────────────────┘

LangSmith SSE Stream
   │
   ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ ReadableStream in lib/talent-demand-agent.ts                                │
│                                                                              │
│ for each line:                                                              │
│   if line.startsWith('event:') → set currentEventType                       │
│   if line.startsWith('data: ') → parse JSON                                 │
└─────────────────────────────────────────────────────────────────────────────┘
   │
   ├── AI Message (type: 'ai')
   │   │
   │   ├── String content → onChunk({ type: 'message', content })
   │   │
   │   └── Array content blocks:
   │       ├── text block → onChunk({ type: 'message', content: block.text })
   │       ├── tool_use block → onChunk({ type: 'tool_use', toolName, toolInput })
   │       └── tool_result block → onChunk({ type: 'tool_result', toolResult })
   │
   ├── Tool Message (type: 'tool')
   │   │
   │   └── String content → onChunk({ type: 'message', content })
   │       (Sub-agent research findings)
   │
   ├── Human Message (type: 'human')
   │   │
   │   └── SKIP (already displayed in UI)
   │
   └── Stream End (done: true)
       │
       ├── Save thread ID from X-Thread-Id header
       ├── Fetch thread state if tools were invoked
       ├── Extract file artifacts
       └── onChunk({ type: 'end', threadId })
```

### Artifact Retrieval Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        ARTIFACT RETRIEVAL FLOW                               │
└─────────────────────────────────────────────────────────────────────────────┘

1. Stream ends with tool invocations detected
   │
   ▼
2. ┌─────────────────────────────────────────────────────────────────┐
   │ Fetch Thread State                                              │
   │ POST /api/agents/talent-demand/state                            │
   │ Body: { threadId }                                              │
   └─────────────────────────────────────────────────────────────────┘
   │
   ▼
3. ┌─────────────────────────────────────────────────────────────────┐
   │ API calls LangSmith: GET /threads/{id}/state                    │
   │                                                                 │
   │ Response: {                                                     │
   │   values: {                                                     │
   │     messages: [...],                                            │
   │     files: {                                                    │
   │       "/path/file.md": { content: [...], created_at, ... }     │
   │     }                                                           │
   │   }                                                             │
   │ }                                                               │
   └─────────────────────────────────────────────────────────────────┘
   │
   ▼
4. ┌─────────────────────────────────────────────────────────────────┐
   │ Extract files from state                                        │
   │                                                                 │
   │ - Parse files object (keyed by path)                           │
   │ - Join content arrays                                           │
   │ - Filter out /tools/* paths                                     │
   │ - Add to artifacts[] state                                      │
   └─────────────────────────────────────────────────────────────────┘
   │
   ▼
5. ┌─────────────────────────────────────────────────────────────────┐
   │ UI displays download buttons                                    │
   │                                                                 │
   │ downloadArtifact() creates blob and triggers download           │
   └─────────────────────────────────────────────────────────────────┘
```

### Polling Completion Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        POLLING COMPLETION FLOW                               │
└─────────────────────────────────────────────────────────────────────────────┘

1. Stream ends with pending work detected
   │
   ├── Signal 1: Worker question patterns in content
   ├── Signal 2: Unfinished tool_use (no matching tool_result)
   └── Signal 3: Todo list with pending/in_progress items
   │
   ▼
2. ┌─────────────────────────────────────────────────────────────────┐
   │ pollForCompletion(threadId, currentArtifactCount)               │
   │                                                                 │
   │ Loop (max 50 attempts):                                         │
   │   - Wait 5-30 seconds (exponential backoff)                     │
   │   - GET /api/agents/talent-demand/runs → check status           │
   │   - POST /api/agents/talent-demand/state → get new files        │
   │   - Add new files to artifacts[]                                │
   │   - Exit when status === 'success' or 'error'                   │
   └─────────────────────────────────────────────────────────────────┘
   │
   ▼
3. Final state sync to saved message
```

---

## State Management

### React State (page.tsx)

```typescript
// ═══════════════════════════════════════════════════════════════
// PRIMARY STATE
// ═══════════════════════════════════════════════════════════════

const [messages, setMessages] = useState<Message[]>([/*initial greeting*/]);
// Complete conversation history with preserved chunks

const [inputValue, setInputValue] = useState('');
// Current input field value

const [isProcessing, setIsProcessing] = useState(false);
// True while waiting for agent response

const [artifacts, setArtifacts] = useState<Artifact[]>([]);
// Generated files ready for download

const [streamingChunks, setStreamingChunks] = useState<DisplayChunk[]>([]);
// Current streaming response (before saved to messages)

const [isPollingForCompletion, setIsPollingForCompletion] = useState(false);
// True while polling for delayed results

const [pollingMessage, setPollingMessage] = useState<string>('');
// Status message shown during polling

// ═══════════════════════════════════════════════════════════════
// REFS (Persist across renders without causing re-renders)
// ═══════════════════════════════════════════════════════════════

const threadIdRef = useRef<string>(generateThreadId());
// Current LangSmith thread UUID

const seenMessageIdsRef = useRef<Set<string>>(new Set());
// Track message IDs to prevent duplicates

const seenToolCallIdsRef = useRef<Set<string>>(new Set());
// Track tool_result IDs to prevent duplicates

const currentAgentMessageIdRef = useRef<string | null>(null);
// ID of current agent message for chunk updates

const conversationStarted = useRef<boolean>(false);
// Track if first message has been sent
```

### State Transition Diagram

```
                              ┌─────────────────┐
                              │     IDLE        │
                              │ isProcessing=F  │
                              │ streamChunks=[] │
                              └────────┬────────┘
                                       │
                              User sends message
                                       │
                                       ▼
                              ┌─────────────────┐
                              │   STREAMING     │
                              │ isProcessing=T  │
                              │ streamChunks+=  │
                              └────────┬────────┘
                                       │
                              Stream ends (done=true)
                                       │
                     ┌─────────────────┼─────────────────┐
                     │                 │                 │
              No pending work    Pending detected   Error
                     │                 │                 │
                     ▼                 ▼                 ▼
              ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
              │   COMPLETE   │ │   POLLING    │ │    ERROR     │
              │ Save message │ │ isPolling=T  │ │ Add system   │
              │ Clear chunks │ │ Poll state   │ │ message      │
              └──────────────┘ └──────┬───────┘ └──────────────┘
                     │                │                 │
                     │         Run status=success      │
                     │                │                 │
                     │                ▼                 │
                     │         ┌──────────────┐        │
                     │         │ Final sync   │        │
                     │         │ Add files    │        │
                     │         └──────────────┘        │
                     │                │                 │
                     └────────────────┼─────────────────┘
                                      │
                                      ▼
                              ┌─────────────────┐
                              │     IDLE        │
                              └─────────────────┘
```

---

## External Integrations

### LangSmith / LangGraph

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         LANGSMITH INTEGRATION                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  Deployment URL (configurable):                                              │
│  https://prod-deepagents-agent-build-d4c1479ed8ce53fbb8c3eefc91f0aa7d       │
│  .us.langgraph.app                                                           │
│                                                                              │
│  Authentication:                                                             │
│  - Header: X-Api-Key                                                         │
│  - Header: X-Auth-Scheme: langsmith-api-key                                 │
│                                                                              │
│  Assistant ID: 50bd6c8e-2996-455b-83c1-3c815899a69b (configurable)          │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘

Endpoints Used:
┌───────────────────────────────────┬─────────┬────────────────────────────┐
│ Endpoint                          │ Method  │ Purpose                    │
├───────────────────────────────────┼─────────┼────────────────────────────┤
│ /threads                          │ POST    │ Create conversation thread │
│ /threads/{id}/runs/stream         │ POST    │ Stream agent response      │
│ /threads/{id}/state               │ GET     │ Get current thread state   │
│ /threads/{id}/runs                │ GET     │ Get run history/status     │
└───────────────────────────────────┴─────────┴────────────────────────────┘
```

### Connection Configuration

```typescript
// Long-lived SSE connection settings (undici Agent)
const customAgent = new Agent({
  keepAliveTimeout: 1800000,    // 30 minutes
  keepAliveMaxTimeout: 1800000,
  headersTimeout: 1800000,
  bodyTimeout: 1800000,
  connectTimeout: 60000,        // 1 minute for initial connection
});
```

---

## SSE Stream Processing

### Event Format

```
event: values
data: {"messages":[{"type":"ai","id":"msg_xxx","content":[{"type":"text","text":"..."}]}]}

event: values
data: {"messages":[{"type":"ai","id":"msg_yyy","content":[{"type":"tool_use","id":"tool_xxx","name":"search","input":{...}}]}]}
```

### Message Types

| Type | Source | UI Treatment |
|------|--------|--------------|
| `ai` | LangSmith | Display as agent response |
| `human` | LangSmith (echo) | Skip (already in UI) |
| `tool` | LangSmith | Display as research findings |
| `system` | Application | Display as system message |

### Content Block Types

| Block Type | Description | UI Component |
|------------|-------------|--------------|
| `text` | Plain text content | `MessageBlock` |
| `tool_use` | Task delegation | `AgentMissionCard` |
| `tool_result` | Research findings | `AgentFindingsCard` |

### Deduplication Strategy

```
Message Deduplication (seenMessageIdsRef):
├── Track all message IDs from LangSmith
├── Skip messages already in set
└── Prevents history repetition in multi-turn

Tool Result Deduplication (seenToolCallIdsRef):
├── Track all tool_use IDs
├── Skip duplicate tool_result chunks
└── Prevents double-display from stream + state fetch
```

---

## Security Model

### Current Security Posture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          SECURITY MODEL                                      │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  Authentication: NONE (Standalone public access)                             │
│                                                                              │
│  ⚠️  This is intentional for standalone TDA deployment                       │
│  ⚠️  API keys are server-side only (not exposed to client)                   │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### API Key Protection

```
┌───────────────────────────────────────────────────────────────┐
│ Browser (Client)                                              │
│ ├── No API keys                                               │
│ ├── POST to /api/agents/talent-demand                         │
│ └── Body: { userMessage, threadId }                           │
└───────────────────────────────────────────────────────────────┘
                         │
                         ▼
┌───────────────────────────────────────────────────────────────┐
│ Next.js API Route (Server)                                    │
│ ├── Reads LANGSMITH_API_KEY from process.env                  │
│ ├── Reads LANGSMITH_WORKSPACE_ID from process.env             │
│ ├── Adds X-Api-Key header to LangSmith requests               │
│ └── Proxies response to client                                │
└───────────────────────────────────────────────────────────────┘
                         │
                         ▼
┌───────────────────────────────────────────────────────────────┐
│ LangSmith (External)                                          │
│ └── Validates API key and processes request                   │
└───────────────────────────────────────────────────────────────┘
```

### Input Handling

| Input | Validation | Notes |
|-------|------------|-------|
| `userMessage` | Type check (string) | Passed directly to LangSmith |
| `threadId` | UUID format check | Determines thread reuse vs creation |
| SSE Data | JSON.parse with try/catch | Graceful error handling |

---

## Environment Configuration

### Required Environment Variables

```bash
# LangSmith Agent Credentials
LANGSMITH_API_KEY=lsv2_pt_xxxxx...      # LangSmith API key (required)
LANGSMITH_WORKSPACE_ID=xxxxxx           # Workspace ID (required)

# Optional Overrides
LANGSMITH_AGENT_URL=https://...         # Agent deployment URL
LANGSMITH_ASSISTANT_ID=xxxxxx           # Assistant ID
```

### Default Values

```typescript
// Default agent deployment URL
const AGENT_DEPLOYMENT_URL = process.env.LANGSMITH_AGENT_URL 
  || 'https://prod-deepagents-agent-build-d4c1479ed8ce53fbb8c3eefc91f0aa7d.us.langgraph.app';

// Default assistant ID
const assistantId = process.env.LANGSMITH_ASSISTANT_ID 
  || '50bd6c8e-2996-455b-83c1-3c815899a69b';
```

### Next.js Configuration

```typescript
// next.config.ts
const nextConfig: NextConfig = {
  output: "standalone",  // Docker-ready build
};
```

---

## Operations

### Development Commands

```bash
# Start development server
npm run dev
# or
pnpm dev

# Build for production
npm run build

# Start production server
npm run start

# Lint code
npm run lint
```

### Deployment

```bash
# Build standalone output
npm run build

# Output directory: .next/standalone
# Static assets: .next/static → .next/standalone/.next/static
# Public assets: public → .next/standalone/public
```

### Monitoring & Debugging

#### Console Log Phases

| Phase | Log Prefix | Purpose |
|-------|------------|---------|
| DIAGNOSTIC | `[DIAGNOSTIC]` | Stream setup and response info |
| PHASE 1 | `[PHASE 1]` | Thread ID management |
| PHASE 2 | `[PHASE 2]` | Multi-turn conversation |
| PHASE 3 | `[PHASE 3]` | Message extraction |
| PHASE 4 | `[PHASE 4]` | Content block parsing |
| PHASE 5 | `[PHASE 5]` | Metrics and tool tracking |
| PHASE 8 | `[PHASE 8]` | Deep chunk debugging |
| PHASE 11 | `[PHASE 11]` | Format-agnostic parsing |
| PHASE 12 | `[PHASE 12]` | onChunk call tracking |

#### Metrics Tracked

```typescript
const metrics = {
  startTime: Date.now(),
  totalEvents: 0,
  aiMessages: 0,
  toolUseMessages: 0,
  toolResultMessages: 0,
  humanMessages: 0,
  errorMessages: 0,
  uniqueMessageIds: new Set<string>(),
  toolInvocations: [],
  artifacts: [],
  eventTypes: {},
};
```

### Timeout Configuration

| Operation | Timeout | Purpose |
|-----------|---------|---------|
| Client fetch | 60 minutes | Multi-file generation |
| SSE keepalive | 30 minutes | Long-running analysis |
| API route | 30 minutes | `maxDuration: 1800` |
| Polling interval | 5-30 seconds | Exponential backoff |
| Polling max attempts | 50 | ~25 minutes total |

---

## Related Documentation

- [Next.js 16 Documentation](https://nextjs.org/docs)
- [LangGraph Cloud Documentation](https://langchain-ai.github.io/langgraph/cloud/)
- [LangSmith API Reference](https://docs.smith.langchain.com/)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)

---

*Last updated: January 2026 (v0.1.0)*
