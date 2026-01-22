# Glossary

> **Document Status:** Active
> **Version:** 1.0
> **Last Updated:** 2025-01-21
> **Purpose:** Define key terms and concepts used throughout the documentation

---

## A

### Agent
An AI-powered component that can perform tasks autonomously. In this system, agents use Claude LLM to process requests, invoke tools, and generate responses. See [ADR-001](architecture/decisions/ADR-001-multi-agent-architecture.md).

### Anthropic
The AI company that created Claude, the LLM powering this system. API documentation: [docs.anthropic.com](https://docs.anthropic.com).

### API Contract
A formal specification of an API's interface, including endpoints, request/response formats, and error codes. See [openapi.yaml](api/openapi.yaml).

---

## C

### Circuit Breaker
A design pattern that prevents cascading failures by temporarily stopping requests to a failing service. When a service exceeds its error threshold, the circuit "opens" and requests fail fast without attempting the call. See [Error Handling Specification](design/error-handling-specification.md).

### Claude
Anthropic's large language model (LLM). This system uses Claude Sonnet 4.5 (`claude-sonnet-4-5-20241022`).

### Coordinator (Agent)
The main orchestrating agent that receives user queries, delegates to specialized sub-agents, and synthesizes their results into a final response. See [Coordinator Prompt](prompts/coordinator.md).

### C4 Model
A diagramming approach for software architecture with four levels: Context, Container, Component, and Code. See [C4 Diagrams](architecture/c4/).

---

## D

### deepagents
The Python framework used for building multi-agent systems. Selected per [ADR-002](architecture/decisions/ADR-002-agent-framework-selection.md).

### Degradation (Graceful)
The system's ability to continue operating with reduced functionality when some components fail. For example, if Tavily fails, the system continues with Exa-only searches. See [Error Handling Specification](design/error-handling-specification.md).

### Done Event
The final SSE event sent when an analysis completes, containing total token usage and duration. Format: `{"type": "done", "total_tokens": 24500, "duration_ms": 35000}`.

---

## E

### Exa
A neural search API used for semantic web search and LinkedIn content discovery. One of the three external APIs (with Anthropic and Tavily). Website: [exa.ai](https://exa.ai).

### Event Stream
See [SSE (Server-Sent Events)](#sse-server-sent-events).

---

## F

### FastAPI
A modern Python web framework for building APIs. Used for the backend server. Documentation: [fastapi.tiangolo.com](https://fastapi.tiangolo.com).

---

## G

### Graceful Degradation
See [Degradation (Graceful)](#degradation-graceful).

---

## I

### Industry Report Synthesizer
One of three specialized sub-agents. Focuses on finding and synthesizing industry reports, LinkedIn insights, and professional perspectives. See [Report Synthesizer Prompt](prompts/report-synthesizer.md).

---

## J

### Job Posting Analyzer
One of three specialized sub-agents. Focuses on analyzing job postings to identify skill requirements, salary ranges, and demand patterns. See [Job Analyzer Prompt](prompts/job-analyzer.md).

---

## L

### LangSmith
An observability platform from LangChain for monitoring LLM applications. Used for tracing, debugging, and analyzing agent runs. Website: [smith.langchain.com](https://smith.langchain.com).

### LLM (Large Language Model)
An AI model trained on large amounts of text data, capable of understanding and generating human-like text. Claude is the LLM used in this system.

---

## M

### Mock Mode
A development feature that simulates external API responses for offline development and testing. Enabled via `MOCK_EXTERNAL_APIS=true`. See [Development Guide](DEVELOPMENT.md).

### Multi-Agent Architecture
A system design where multiple specialized AI agents collaborate to solve complex tasks. The Talent Demand Analyst uses a coordinator with three sub-agents. See [ADR-001](architecture/decisions/ADR-001-multi-agent-architecture.md).

---

## N

### Next.js
A React framework for building web applications. Used for the frontend. Documentation: [nextjs.org/docs](https://nextjs.org/docs).

---

## O

### OpenAPI
A specification for describing REST APIs. The system's API contract is defined in OpenAPI 3.1 format. See [openapi.yaml](api/openapi.yaml).

### OWASP
Open Web Application Security Project. Their Top 10 list defines the most critical web security risks. See [TRD Section 6.5](requirements/2025-01-21-talent-demand-analyst-trd.md) for OWASP mapping.

---

## P

### Progress Event
An SSE event indicating sub-agent status changes. Format: `{"type": "progress", "agent": "job_analyzer", "status": "started|completed|failed"}`.

### Prompt (System)
Instructions given to an LLM that define its behavior, capabilities, and output format. Versioned prompts are stored in [docs/prompts/](prompts/).

### PRD (Product Requirements Document)
A document specifying what to build from a product perspective, including user stories and acceptance criteria. See [PRD](requirements/2025-01-21-talent-demand-analyst-prd.md).

### Pydantic
A Python library for data validation using type annotations. Used for request/response model validation.

---

## R

### Railway
A cloud platform for deploying backend applications. The backend API is deployed on Railway. Website: [railway.app](https://railway.app).

### Rate Limiting
Restricting the number of requests a client can make in a time period. This system enforces 20 requests per minute per user.

### Retry (with Exponential Backoff)
A resilience pattern where failed requests are retried with increasing delays between attempts. See [Error Handling Specification](design/error-handling-specification.md).

### Runbook
A documented procedure for handling specific operational tasks, like deployments or incidents. See [docs/runbooks/](runbooks/).

---

## S

### Skill Emergence Researcher
One of three specialized sub-agents. Focuses on identifying emerging skills, technology trends, and future skill demands. See [Skill Researcher Prompt](prompts/skill-researcher.md).

### Source Event
An SSE event providing a URL citation. Format: `{"type": "source", "url": "https://...", "title": "...", "snippet": "..."}`.

### SSE (Server-Sent Events)
A web standard for servers to push events to clients over HTTP. Used for streaming analysis responses. Selected per [ADR-003](architecture/decisions/ADR-003-streaming-response-architecture.md).

### Streaming
Delivering response content progressively as it's generated, rather than waiting for completion. Implemented using SSE.

### Sub-Agent
A specialized agent that handles a specific aspect of analysis. This system has three: Job Posting Analyzer, Skill Emergence Researcher, and Industry Report Synthesizer.

---

## T

### Tavily
A web search API designed for AI applications. Provides structured search results. One of the three external APIs. Website: [tavily.com](https://tavily.com).

### TDD (Test-Driven Development)
A development practice where tests are written before implementation code. Used throughout this project.

### Token
The basic unit of text that LLMs process. Roughly 4 characters or 0.75 words per token. Token usage determines API costs.

### Token Budget
Limits on token usage per component to control costs. Target: ~$0.25 per analysis. See [Token Budget Specification](design/token-cost-budget.md).

### Token Event
An SSE event containing a chunk of generated text. Format: `{"type": "token", "content": "..."}`.

### Tool
A function that an agent can invoke to perform actions, like searching the web or reading URLs. Defined in `backend/app/tools/`.

### TRD (Technical Requirements Document)
A document specifying how to build something from a technical perspective, including performance targets and constraints. See [TRD](requirements/2025-01-21-talent-demand-analyst-trd.md).

### TTFT (Time to First Token)
A latency metric measuring how long until the first response token arrives. Target: < 3 seconds.

---

## U

### URL Reader
A tool that fetches and extracts text content from web pages. Used to get detailed information from discovered URLs.

---

## V

### Vercel
A cloud platform for deploying frontend applications. The Next.js frontend is deployed on Vercel. Website: [vercel.com](https://vercel.com).

---

## W

### Worktree (Git)
An isolated working directory that shares the same Git repository. Used for parallel development of features.

---

## Acronyms Quick Reference

| Acronym | Full Form |
|---------|-----------|
| ADR | Architecture Decision Record |
| API | Application Programming Interface |
| CLI | Command Line Interface |
| CORS | Cross-Origin Resource Sharing |
| HTTP | Hypertext Transfer Protocol |
| JSON | JavaScript Object Notation |
| JWT | JSON Web Token |
| LLM | Large Language Model |
| MVP | Minimum Viable Product |
| OWASP | Open Web Application Security Project |
| PRD | Product Requirements Document |
| REST | Representational State Transfer |
| RTT | Round-Trip Time |
| SLA | Service Level Agreement |
| SSE | Server-Sent Events |
| TDD | Test-Driven Development |
| TRD | Technical Requirements Document |
| TTFT | Time to First Token |
| URL | Uniform Resource Locator |

---

*Glossary - Addressing expert feedback for improved documentation accessibility*
