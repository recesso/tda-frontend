# Deep Agents Complete Development Guide

> **Purpose**: This is the authoritative guide for building production-grade AI agents using the `deepagents` framework with a professional React UI. Based on deep analysis of both the [deepagents](https://github.com/langchain-ai/deepagents) Python framework and [deep-agents-ui](https://github.com/langchain-ai/deep-agents-ui) React application.

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Core Concepts](#core-concepts)
3. [Backend: Python deepagents Framework](#backend-python-deepagents-framework)
4. [Frontend: React deep-agents-ui](#frontend-react-deep-agents-ui)
5. [Building Your Agent: Step-by-Step](#building-your-agent-step-by-step)
6. [Production Deployment](#production-deployment)
7. [API Reference](#api-reference)

---

## Architecture Overview

### The deepagents Stack

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              FRONTEND (React)                                │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────────────────┐  │
│  │  ChatInterface  │  │  TasksSidebar   │  │     FileViewDialog          │  │
│  │  - Messages     │  │  - Todos        │  │     - Virtual FS viewer     │  │
│  │  - ToolCallBox  │  │  - SubAgents    │  │     - State files           │  │
│  │  - Streaming    │  │  - Progress     │  │     - Edit capabilities     │  │
│  └─────────────────┘  └─────────────────┘  └─────────────────────────────┘  │
│                                    │                                         │
│              ┌────────────────────────────────────────┐                     │
│              │  @langchain/langgraph-sdk/react        │                     │
│              │  - useStream() hook                    │                     │
│              │  - Streaming state management          │                     │
│              │  - Thread persistence                  │                     │
│              └────────────────────────────────────────┘                     │
└─────────────────────────────────────────────────────────────────────────────┘
                                     │
                                     │ HTTP/SSE Streaming
                                     ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                            BACKEND (Python)                                  │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                      create_deep_agent()                             │    │
│  │  ┌─────────────────────────────────────────────────────────────┐    │    │
│  │  │                   Middleware Stack                           │    │    │
│  │  │  ┌─────────────────┐  ┌─────────────────┐  ┌──────────────┐ │    │    │
│  │  │  │TodoListMiddleware│  │FilesystemMiddle │  │SubAgentMiddle│ │    │    │
│  │  │  │ - write_todos   │  │ - ls, read_file │  │ - task tool  │ │    │    │
│  │  │  │ - read_todos    │  │ - write_file    │  │ - subagent   │ │    │    │
│  │  │  │                 │  │ - edit_file     │  │   dispatch   │ │    │    │
│  │  │  │                 │  │ - glob, grep    │  │              │ │    │    │
│  │  │  │                 │  │ - execute       │  │              │ │    │    │
│  │  │  └─────────────────┘  └─────────────────┘  └──────────────┘ │    │    │
│  │  │  ┌─────────────────┐  ┌─────────────────┐  ┌──────────────┐ │    │    │
│  │  │  │SummarizationMW  │  │AnthropicPrompt  │  │PatchToolCalls│ │    │    │
│  │  │  │ - Auto at 170k  │  │ CachingMW       │  │ Middleware   │ │    │    │
│  │  │  │ - Keep last 6   │  │ - Cost savings  │  │ - Fix calls  │ │    │    │
│  │  │  └─────────────────┘  └─────────────────┘  └──────────────┘ │    │    │
│  │  └─────────────────────────────────────────────────────────────┘    │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                    │                                         │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                            Backends                                  │    │
│  │  ┌───────────┐  ┌───────────┐  ┌───────────┐  ┌──────────────────┐  │    │
│  │  │StateBackend│  │Filesystem │  │StoreBackend│  │CompositeBackend  │  │    │
│  │  │ (default) │  │ Backend   │  │ (persist) │  │ (route paths)    │  │    │
│  │  │ ephemeral │  │ real disk │  │ LangGraph │  │ to backends      │  │    │
│  │  │ in state  │  │ operations│  │ Store     │  │                  │  │    │
│  │  └───────────┘  └───────────┘  └───────────┘  └──────────────────┘  │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Key Principles

1. **Middleware-Driven Architecture**: Tools and capabilities are added via composable middleware, not hardcoded
2. **Virtual Filesystem**: Files exist in agent state (ephemeral) or persistent storage, enabling sandboxed operations
3. **Parallel Subagent Execution**: The `task` tool spawns isolated subagents that run concurrently
4. **Automatic Context Management**: Summarization middleware prevents context window overflow
5. **Streaming-First**: Real-time updates via SSE for responsive UX

---

## Core Concepts

### State Schema

The deepagents state extends LangGraph's base state with:

```python
from typing import Annotated, TypedDict
from langchain_core.messages import BaseMessage

class DeepAgentState(TypedDict):
    messages: list[BaseMessage]           # Conversation history
    todos: list[dict]                     # Task tracking
    files: Annotated[dict, file_reducer]  # Virtual filesystem
```

### The `task` Tool (Subagent Spawner)

The `task` tool is the heart of multi-agent orchestration:

```python
def task(
    description: str,  # Detailed instructions for the subagent
    subagent_type: str,  # Which subagent to invoke
    runtime: ToolRuntime,
) -> Command:
    """
    Lifecycle:
    1. SPAWN - Provide clear role, instructions, expected output
    2. RUN - Subagent completes task autonomously
    3. RETURN - Subagent provides single structured result
    4. RECONCILE - Main agent integrates result
    """
```

Key behaviors:
- Subagents are **ephemeral** - they run once and return a result
- Subagents have **isolated context** - they don't see the main agent's history
- Launch multiple subagents **in parallel** via multiple tool calls in one message
- Subagent output is returned as a `ToolMessage` to the main agent

### Backends

| Backend | Use Case | Execution Support |
|---------|----------|-------------------|
| `StateBackend` | Default ephemeral storage in LangGraph state | No |
| `FilesystemBackend` | Real disk operations under a root directory | Yes (sandbox) |
| `StoreBackend` | Persistent cross-conversation storage | No |
| `CompositeBackend` | Route different paths to different backends | Depends |

```python
# Example: Hybrid backend with persistent memories
from deepagents.backends import CompositeBackend, StateBackend, StoreBackend
from langgraph.store.memory import InMemoryStore

backend = CompositeBackend(
    default=StateBackend(),  # Most files ephemeral
    routes={"/memories/": StoreBackend(store=InMemoryStore())},  # Persist memories
)
```

---

## Backend: Python deepagents Framework

### Installation

```bash
pip install deepagents tavily-python exa-py
# or with uv
uv add deepagents tavily-python exa-py
```

### Minimal Agent

```python
from deepagents import create_deep_agent

agent = create_deep_agent(
    model="anthropic:claude-sonnet-4-5-20250929",  # Default
    system_prompt="You are a helpful assistant.",
)

result = agent.invoke({
    "messages": [{"role": "user", "content": "Hello!"}]
})
```

### Agent with Custom Tools and Subagents

```python
from deepagents import create_deep_agent
from langchain_core.tools import tool
from tavily import TavilyClient
import os

# Define custom tools
tavily_client = TavilyClient(api_key=os.environ["TAVILY_API_KEY"])

@tool
def web_search(query: str, max_results: int = 10) -> str:
    """Search the web for current information."""
    results = tavily_client.search(query, max_results=max_results)
    return str(results)

# Define subagents
researcher = {
    "name": "researcher",
    "description": "Conducts deep research on complex topics using web search.",
    "system_prompt": """You are a research specialist.

    Your job is to:
    1. Search for authoritative sources
    2. Extract key facts and data
    3. Return a structured summary with citations

    Always cite sources with URLs.""",
    "tools": [web_search],
}

analyst = {
    "name": "analyst",
    "description": "Analyzes data and provides insights with metrics.",
    "system_prompt": """You are a data analyst.

    Your job is to:
    1. Analyze the data provided
    2. Identify patterns and trends
    3. Provide quantitative insights

    Always include specific numbers and percentages.""",
    "tools": [web_search],
}

# Create the orchestrator agent
agent = create_deep_agent(
    model="anthropic:claude-sonnet-4-5-20250929",
    tools=[web_search],  # Main agent can also search directly
    system_prompt="""You are a research coordinator.

    For complex research tasks:
    1. Dispatch the 'researcher' subagent for data gathering
    2. Dispatch the 'analyst' subagent for insights
    3. Launch subagents IN PARALLEL when tasks are independent
    4. Synthesize their findings into a coherent report
    """,
    subagents=[researcher, analyst],
)
```

### Using Memory (AGENTS.md Files)

```python
agent = create_deep_agent(
    model="anthropic:claude-sonnet-4-5-20250929",
    memory=["./AGENTS.md", "/config/style-guide.md"],  # Loaded into system prompt
    backend=FilesystemBackend(root_dir="/path/to/project"),
)
```

### Using Skills (Modular Workflows)

```python
agent = create_deep_agent(
    model="anthropic:claude-sonnet-4-5-20250929",
    skills=["./skills/", "/project/skills/"],  # Skill directories
    backend=FilesystemBackend(root_dir="/path/to/project"),
)
```

Skills are loaded from `.md` files in the specified directories and become available as commands (e.g., `/blog-post`, `/social-media`).

### Human-in-the-Loop

```python
from langgraph.checkpoint.memory import MemorySaver

agent = create_deep_agent(
    model="anthropic:claude-sonnet-4-5-20250929",
    tools=[sensitive_operation],
    interrupt_on={
        "sensitive_operation": {
            "allowed_decisions": ["approve", "edit", "reject"]
        }
    },
    checkpointer=MemorySaver(),  # Required for HITL
)

# Agent will pause before sensitive_operation
# Resume with: agent.invoke(None, config, command={"resume": {"decision": "approve"}})
```

### FastAPI Server with Streaming

```python
from fastapi import FastAPI
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
import json

from deepagents import create_deep_agent

app = FastAPI()
agent = create_deep_agent(...)

class ChatRequest(BaseModel):
    message: str
    thread_id: str | None = None

@app.post("/chat")
async def chat(request: ChatRequest):
    async def generate():
        config = {"configurable": {"thread_id": request.thread_id or "default"}}

        async for event in agent.astream_events(
            {"messages": [{"role": "user", "content": request.message}]},
            config=config,
            version="v2",
        ):
            event_type = event["event"]

            if event_type == "on_chat_model_stream":
                chunk = event["data"]["chunk"]
                if chunk.content:
                    yield f"data: {json.dumps({'type': 'token', 'content': chunk.content})}\n\n"

            elif event_type == "on_tool_start":
                yield f"data: {json.dumps({'type': 'tool_start', 'name': event['name']})}\n\n"

            elif event_type == "on_tool_end":
                yield f"data: {json.dumps({'type': 'tool_end', 'name': event['name']})}\n\n"

        yield "data: [DONE]\n\n"

    return StreamingResponse(generate(), media_type="text/event-stream")

@app.get("/threads/{thread_id}/state")
async def get_state(thread_id: str):
    """Get current state including todos and files."""
    state = await agent.aget_state({"configurable": {"thread_id": thread_id}})
    return {
        "messages": state.values.get("messages", []),
        "todos": state.values.get("todos", []),
        "files": state.values.get("files", {}),
    }
```

---

## Frontend: React deep-agents-ui

### Key Dependencies

```json
{
  "@langchain/langgraph-sdk": "latest",
  "nuqs": "latest",
  "use-stick-to-bottom": "latest"
}
```

### Core Hook: useChat

The `useChat` hook wraps `@langchain/langgraph-sdk/react`'s `useStream`:

```typescript
import { useStream } from "@langchain/langgraph-sdk/react";

export type StateType = {
  messages: Message[];
  todos: TodoItem[];
  files: Record<string, string>;
};

export function useChat({ activeAssistant, thread }) {
  const [threadId, setThreadId] = useQueryState("threadId");
  const client = useClient();

  const stream = useStream<StateType>({
    assistantId: activeAssistant?.assistant_id || "",
    client: client,
    reconnectOnMount: true,
    threadId: threadId ?? null,
    onThreadId: setThreadId,
    fetchStateHistory: true,  // Get full state when switching threads
  });

  const sendMessage = useCallback((content: string) => {
    const newMessage = { id: uuidv4(), type: "human", content };
    stream.submit(
      { messages: [newMessage] },
      {
        optimisticValues: (prev) => ({
          messages: [...(prev.messages ?? []), newMessage],
        }),
        config: { recursion_limit: 100 },
      }
    );
  }, [stream]);

  return {
    messages: stream.messages,
    todos: stream.values.todos ?? [],
    files: stream.values.files ?? {},
    isLoading: stream.isLoading,
    interrupt: stream.interrupt,
    sendMessage,
    stopStream: stream.stop,
    resumeInterrupt: (value) => stream.submit(null, { command: { resume: value } }),
  };
}
```

### TypeScript Interfaces

```typescript
export interface ToolCall {
  id: string;
  name: string;
  args: Record<string, unknown>;
  result?: string;
  status: "pending" | "completed" | "error" | "interrupted";
}

export interface TodoItem {
  id: string;
  content: string;
  status: "pending" | "in_progress" | "completed";
}

export interface InterruptData {
  value: any;
  ns?: string[];
  scope?: string;
}

export interface ActionRequest {
  name: string;
  args: Record<string, unknown>;
  description?: string;
}

export interface ReviewConfig {
  actionName: string;
  allowedDecisions?: string[];
}
```

### Message Processing Pattern

Process raw messages into displayable format with tool call status:

```typescript
const processedMessages = useMemo(() => {
  const messageMap = new Map<string, { message: Message; toolCalls: ToolCall[] }>();

  messages.forEach((message) => {
    if (message.type === "ai") {
      // Extract tool calls from AI message
      const toolCalls = extractToolCalls(message);
      messageMap.set(message.id, {
        message,
        toolCalls: toolCalls.map(tc => ({
          ...tc,
          status: interrupt ? "interrupted" : "pending",
        })),
      });
    } else if (message.type === "tool") {
      // Match tool result to its tool call
      for (const [, data] of messageMap) {
        const toolCall = data.toolCalls.find(tc => tc.id === message.tool_call_id);
        if (toolCall) {
          toolCall.status = "completed";
          toolCall.result = message.content;
          break;
        }
      }
    } else if (message.type === "human") {
      messageMap.set(message.id, { message, toolCalls: [] });
    }
  });

  return Array.from(messageMap.values());
}, [messages, interrupt]);
```

### Human-in-the-Loop UI

When the agent hits an interrupt (configured via `interrupt_on`), render approval UI:

```tsx
function ToolApprovalInterrupt({ actionRequest, reviewConfig, onResume, isLoading }) {
  const allowedDecisions = reviewConfig?.allowedDecisions || ["approve", "reject"];

  return (
    <div className="space-y-4">
      <div className="font-medium">Action Requires Approval</div>
      <pre className="text-sm bg-muted p-2 rounded">
        {JSON.stringify(actionRequest.args, null, 2)}
      </pre>
      <div className="flex gap-2">
        {allowedDecisions.includes("approve") && (
          <Button onClick={() => onResume({ decision: "approve" })} disabled={isLoading}>
            Approve
          </Button>
        )}
        {allowedDecisions.includes("edit") && (
          <Button variant="secondary" onClick={() => setEditing(true)} disabled={isLoading}>
            Edit
          </Button>
        )}
        {allowedDecisions.includes("reject") && (
          <Button variant="destructive" onClick={() => onResume({ decision: "reject" })} disabled={isLoading}>
            Reject
          </Button>
        )}
      </div>
    </div>
  );
}
```

### Files Viewer Component

View and edit files stored in agent state:

```tsx
function FilesPopover({ files, setFiles, editDisabled }) {
  const [selectedFile, setSelectedFile] = useState<string | null>(null);

  return (
    <div className="space-y-2">
      {Object.entries(files).map(([path, content]) => (
        <div key={path} className="flex items-center gap-2">
          <FileIcon size={14} />
          <button onClick={() => setSelectedFile(path)} className="text-sm hover:underline">
            {path}
          </button>
        </div>
      ))}

      {selectedFile && (
        <FileViewDialog
          path={selectedFile}
          content={files[selectedFile]}
          onClose={() => setSelectedFile(null)}
          onSave={editDisabled ? undefined : (newContent) => {
            setFiles({ ...files, [selectedFile]: newContent });
          }}
        />
      )}
    </div>
  );
}
```

### Todo Progress Display

```tsx
function TodoProgress({ todos }) {
  const grouped = {
    in_progress: todos.filter(t => t.status === "in_progress"),
    pending: todos.filter(t => t.status === "pending"),
    completed: todos.filter(t => t.status === "completed"),
  };

  const activeTask = grouped.in_progress[0];
  const totalTasks = todos.length;
  const completedTasks = grouped.completed.length;

  return (
    <div className="flex items-center gap-3">
      {activeTask ? (
        <>
          <Clock size={16} className="text-warning" />
          <span>Task {completedTasks + 1} of {totalTasks}</span>
          <span className="text-muted-foreground truncate">{activeTask.content}</span>
        </>
      ) : completedTasks === totalTasks ? (
        <>
          <CheckCircle size={16} className="text-success" />
          <span>All tasks completed</span>
        </>
      ) : (
        <>
          <Circle size={16} className="text-tertiary" />
          <span>Task {completedTasks} of {totalTasks}</span>
        </>
      )}
    </div>
  );
}
```

---

## Building Your Agent: Step-by-Step

### Step 1: Define Your Domain

Start by defining:
1. **What problem does your agent solve?**
2. **What data sources does it need?**
3. **What are the distinct research/analysis tasks?**
4. **What output format do users expect?**

### Step 2: Design Subagents

For each distinct task domain, create a specialized subagent:

```python
subagents = [
    {
        "name": "data_gatherer",
        "description": "Collects raw data from specified sources. Use when you need fresh data.",
        "system_prompt": """You are a data collection specialist.

        Guidelines:
        - Search multiple sources for comprehensive coverage
        - Extract specific numbers, dates, and facts
        - Always include source URLs
        - Return structured JSON with raw findings""",
        "tools": [web_search, api_query],
    },
    {
        "name": "analyzer",
        "description": "Analyzes data to identify patterns and insights. Use after data is gathered.",
        "system_prompt": """You are a data analyst.

        Guidelines:
        - Look for trends, patterns, and anomalies
        - Calculate percentages and growth rates
        - Compare across categories
        - Provide actionable insights""",
        "tools": [],  # No external tools needed
    },
    {
        "name": "writer",
        "description": "Writes formatted reports. Use when all analysis is complete.",
        "system_prompt": """You are a technical writer.

        Guidelines:
        - Use clear, professional language
        - Include executive summary at top
        - Organize with clear headings
        - Cite all sources""",
        "tools": [],
    },
]
```

### Step 3: Design Main Agent Prompt

The main agent orchestrates subagents:

```python
main_prompt = """You are a research coordinator managing specialized analysts.

## Your Workflow

1. **Understand the Request**: Clarify scope, timeframe, and output format
2. **Dispatch Subagents**: Launch specialized agents IN PARALLEL when independent
3. **Synthesize Results**: Combine findings into coherent output
4. **Deliver**: Format according to user preferences

## Available Subagents

- `data_gatherer`: Collects raw data from sources
- `analyzer`: Analyzes data for patterns and insights
- `writer`: Writes formatted reports

## Key Rules

1. ALWAYS launch independent research tasks in parallel
2. Wait for all subagents to complete before synthesizing
3. Include specific metrics (numbers, percentages, growth rates)
4. Cite all sources with URLs
"""
```

### Step 4: Implement Tools

```python
from langchain_core.tools import tool
from tavily import TavilyClient
import os

@tool
def web_search(query: str, max_results: int = 10) -> str:
    """Search the web for current information.

    Args:
        query: Specific search query
        max_results: Number of results to return

    Returns:
        JSON string with search results including titles, URLs, and snippets
    """
    client = TavilyClient(api_key=os.environ["TAVILY_API_KEY"])
    results = client.search(query, max_results=max_results, include_answer=True)
    return str(results)

@tool
def read_url(url: str) -> str:
    """Read and extract content from a URL.

    Args:
        url: The URL to read

    Returns:
        Extracted text content from the page
    """
    from exa_py import Exa
    exa = Exa(api_key=os.environ["EXA_API_KEY"])
    results = exa.get_contents([url], text={"max_characters": 10000})
    return results.results[0].text if results.results else "Could not read URL"
```

### Step 5: Create the Agent

```python
from deepagents import create_deep_agent

def create_my_agent():
    return create_deep_agent(
        model="anthropic:claude-sonnet-4-5-20250929",
        tools=[web_search, read_url],
        system_prompt=main_prompt,
        subagents=subagents,
    )
```

### Step 6: Build the API

```python
# app.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
import json

from agent import create_my_agent

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

agent = create_my_agent()

class ChatRequest(BaseModel):
    message: str
    thread_id: str = "default"

@app.post("/api/chat")
async def chat(request: ChatRequest):
    async def generate():
        config = {"configurable": {"thread_id": request.thread_id}}

        async for event in agent.astream_events(
            {"messages": [{"role": "user", "content": request.message}]},
            config=config,
            version="v2",
        ):
            if event["event"] == "on_chat_model_stream":
                chunk = event["data"]["chunk"]
                if chunk.content:
                    yield f"data: {json.dumps({'type': 'token', 'content': chunk.content})}\n\n"
            elif event["event"] == "on_tool_start":
                yield f"data: {json.dumps({'type': 'tool_start', 'name': event['name']})}\n\n"
            elif event["event"] == "on_tool_end":
                yield f"data: {json.dumps({'type': 'tool_end', 'name': event['name']})}\n\n"
        yield "data: [DONE]\n\n"

    return StreamingResponse(generate(), media_type="text/event-stream")

@app.get("/api/threads/{thread_id}/state")
async def get_state(thread_id: str):
    state = await agent.aget_state({"configurable": {"thread_id": thread_id}})
    return state.values

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
```

### Step 7: Build the Frontend

Use the deep-agents-ui patterns:

```tsx
// app/page.tsx
"use client";
import { ChatProvider } from "@/providers/ChatProvider";
import { ChatInterface } from "@/components/ChatInterface";

export default function Home() {
  return (
    <ChatProvider
      activeAssistant={{ assistant_id: "my-agent" }}
    >
      <ChatInterface />
    </ChatProvider>
  );
}
```

---

## Production Deployment

### LangGraph Cloud Deployment

Create `langgraph.json`:

```json
{
  "dependencies": ["."],
  "graphs": {
    "my-agent": "./agent.py:create_my_agent"
  },
  "env": ".env"
}
```

Deploy:

```bash
langgraph deploy
```

### Docker Deployment

```dockerfile
FROM python:3.11-slim

WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt

COPY . .

EXPOSE 8000
CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "8000"]
```

### Environment Variables

```env
# Required
ANTHROPIC_API_KEY=sk-ant-xxx
TAVILY_API_KEY=tvly-xxx
EXA_API_KEY=xxx

# Optional - LangSmith tracing
LANGCHAIN_TRACING_V2=true
LANGCHAIN_API_KEY=lsv2_pt_xxx
LANGCHAIN_PROJECT=my-agent
```

---

## API Reference

### create_deep_agent()

```python
def create_deep_agent(
    model: str | BaseChatModel | None = None,
    tools: Sequence[BaseTool | Callable] | None = None,
    *,
    system_prompt: str | SystemMessage | None = None,
    middleware: Sequence[AgentMiddleware] = (),
    subagents: list[SubAgent | CompiledSubAgent] | None = None,
    skills: list[str] | None = None,
    memory: list[str] | None = None,
    response_format: ResponseFormat | None = None,
    checkpointer: Checkpointer | None = None,
    store: BaseStore | None = None,
    backend: BackendProtocol | BackendFactory | None = None,
    interrupt_on: dict[str, bool | InterruptOnConfig] | None = None,
    debug: bool = False,
    name: str | None = None,
) -> CompiledStateGraph:
```

### SubAgent TypedDict

```python
class SubAgent(TypedDict):
    name: str                                           # Required
    description: str                                    # Required
    system_prompt: str                                  # Required
    tools: Sequence[BaseTool | Callable]               # Required
    model: NotRequired[str | BaseChatModel]            # Optional
    middleware: NotRequired[list[AgentMiddleware]]     # Optional
    interrupt_on: NotRequired[dict[str, bool | InterruptOnConfig]]  # Optional
```

### Built-in Tools

| Tool | Description | Middleware |
|------|-------------|------------|
| `write_todos` | Create/update task list | TodoListMiddleware |
| `read_todos` | Get current tasks | TodoListMiddleware |
| `ls` | List directory contents | FilesystemMiddleware |
| `read_file` | Read file with pagination | FilesystemMiddleware |
| `write_file` | Create new file | FilesystemMiddleware |
| `edit_file` | String replacement in file | FilesystemMiddleware |
| `glob` | Find files by pattern | FilesystemMiddleware |
| `grep` | Search file contents | FilesystemMiddleware |
| `execute` | Run shell command (sandbox only) | FilesystemMiddleware |
| `task` | Spawn subagent | SubAgentMiddleware |

---

## References

- [deepagents GitHub](https://github.com/langchain-ai/deepagents)
- [deep-agents-ui GitHub](https://github.com/langchain-ai/deep-agents-ui)
- [LangGraph Documentation](https://docs.langchain.com/oss/python/langgraph/overview)
- [LangChain Documentation](https://docs.langchain.com/oss/python/langchain/overview)

---

*Document generated: January 21, 2026*
*Based on analysis of deepagents v0.x and deep-agents-ui repositories*
