# Talent Demand Analyst (TDA) Frontend

> AI-powered talent demand trends and workforce planning insights

A standalone Next.js frontend that provides a conversational interface for the Talent Demand Analyst AI agent. This application acts as a proxy to a remote LangGraph/LangSmith agent deployment.

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ or Bun
- LangSmith API credentials

### Installation

```bash
# Clone and install
git clone <repository-url>
cd tda-frontend
npm install

# Configure environment
cp .env.example .env.local
# Edit .env.local with your LangSmith credentials

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to use the application.

## 📋 Environment Variables

Create a `.env.local` file with:

```bash
# Required
LANGSMITH_API_KEY=lsv2_pt_xxxxx...
LANGSMITH_WORKSPACE_ID=your-workspace-id

# Optional (defaults provided)
LANGSMITH_AGENT_URL=https://your-agent-deployment.langgraph.app
LANGSMITH_ASSISTANT_ID=your-assistant-id
```

## 🏗️ Architecture

This is a **frontend-only** application with no local database. All data flows through a remote LangGraph agent:

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Browser UI    │────▶│  Next.js API    │────▶│   LangSmith     │
│   (React)       │◀────│  (Proxy)        │◀────│   Agent         │
└─────────────────┘     └─────────────────┘     └─────────────────┘
```

### Key Features

- **Real-time Streaming** - SSE stream processing from LangGraph
- **Multi-turn Conversations** - Thread-based conversation continuity
- **Artifact Generation** - Download generated reports and analyses
- **Agent Task Visualization** - See sub-agent coordination in real-time

## 📁 Project Structure

```
tda-frontend/
├── app/
│   ├── api/
│   │   └── agents/
│   │       └── talent-demand/
│   │           ├── route.ts       # Main agent proxy
│   │           ├── runs/route.ts  # Run status API
│   │           └── state/route.ts # Thread state API
│   ├── components/                # (future components)
│   ├── page.tsx                   # Main chat interface
│   └── layout.tsx                 # Root layout
├── lib/
│   └── talent-demand-agent.ts     # Stream client library
├── docs/
│   └── data-architecture.md       # Complete data architecture
└── public/
    └── images/                    # Static assets
```

## 📖 Documentation

- **[Data Architecture](./docs/data-architecture.md)** - Complete reference for data structures, API flows, and integrations

## 🛠️ Development

```bash
# Development server
npm run dev

# Production build
npm run build

# Start production server
npm run start

# Lint code
npm run lint
```

## 🔧 Tech Stack

| Component | Technology |
|-----------|------------|
| Framework | Next.js 16.1.1 |
| UI | React 19.2.3 |
| Language | TypeScript |
| Styling | Tailwind CSS 3.4.18 |
| Markdown | react-markdown 10.1.0 |
| HTTP | undici 6.23.0 |

## 🌐 Deployment

The application is configured for standalone deployment:

```bash
# Build standalone output
npm run build

# Output in .next/standalone
```

### Docker Support

The standalone output is Docker-ready. Copy `.next/static` and `public` folders alongside the standalone build.

## 🔐 Security

- **No Authentication** - Standalone public access (intentional)
- **API Keys Server-Side** - LangSmith credentials never exposed to client
- **Proxy Architecture** - All external calls routed through API routes

## 📝 License

[Add license information]

---

*Part of the Skill Bridge Talent ecosystem*
