# Development Guide

> **Document Status:** Active
> **Version:** 1.0
> **Last Updated:** 2025-01-21
> **Purpose:** Complete local development setup and workflow

---

## Table of Contents

1. [Prerequisites](#1-prerequisites)
2. [API Key Setup](#2-api-key-setup)
3. [Local Development Setup](#3-local-development-setup)
4. [Mock Mode](#4-mock-mode)
5. [Running the Stack](#5-running-the-stack)
6. [Development Workflow](#6-development-workflow)
7. [Troubleshooting](#7-troubleshooting)

---

## 1. Prerequisites

### Required Software

| Software | Version | Installation |
|----------|---------|--------------|
| Python | 3.11+ | [python.org](https://python.org) |
| Node.js | 18+ | [nodejs.org](https://nodejs.org) |
| Git | 2.40+ | [git-scm.com](https://git-scm.com) |
| Docker | 24+ | [docker.com](https://docker.com) (optional) |

### Verify Installation

```bash
# Check versions
python --version   # Should be 3.11+
node --version     # Should be 18+
git --version      # Should be 2.40+
docker --version   # Optional, 24+
```

---

## 2. API Key Setup

### Required API Keys

You need API keys from three providers:

| Provider | Purpose | Sign Up |
|----------|---------|---------|
| Anthropic | Claude LLM | [console.anthropic.com](https://console.anthropic.com) |
| Tavily | Web search | [tavily.com](https://tavily.com) |
| Exa | Neural search | [exa.ai](https://exa.ai) |
| LangSmith | Observability (optional) | [smith.langchain.com](https://smith.langchain.com) |

### Getting API Keys

#### Anthropic (Required)

1. Go to [console.anthropic.com](https://console.anthropic.com)
2. Create account or sign in
3. Navigate to "API Keys"
4. Create new key, copy immediately (shown only once)
5. **Note:** Free tier includes limited credits

#### Tavily (Required)

1. Go to [tavily.com](https://tavily.com)
2. Sign up for free account
3. Navigate to Dashboard → API Keys
4. Copy your API key
5. **Free tier:** 1,000 searches/month

#### Exa (Required)

1. Go to [exa.ai](https://exa.ai)
2. Sign up for account
3. Navigate to API settings
4. Generate and copy API key
5. **Free tier:** Limited searches/month

#### LangSmith (Optional but Recommended)

1. Go to [smith.langchain.com](https://smith.langchain.com)
2. Sign up with GitHub/Google
3. Create new project: "talent-demand-analyst"
4. Navigate to Settings → API Keys
5. Copy API key

### Environment File Setup

Create `.env` file in the backend directory:

```bash
# backend/.env

# Required - LLM
ANTHROPIC_API_KEY=sk-ant-api03-...

# Required - Search
TAVILY_API_KEY=tvly-...
EXA_API_KEY=...

# Optional - Observability
LANGSMITH_API_KEY=ls-...
LANGSMITH_PROJECT=talent-demand-analyst

# Development settings
LOG_LEVEL=DEBUG
ENVIRONMENT=development
MOCK_EXTERNAL_APIS=false
```

**IMPORTANT:** Never commit `.env` to git. It's in `.gitignore`.

---

## 3. Local Development Setup

### Backend Setup

```bash
# Navigate to backend directory
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# On Windows:
venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -e ".[dev]"

# Verify installation
python -c "import fastapi; print('FastAPI installed')"
python -c "import anthropic; print('Anthropic SDK installed')"
```

### Frontend Setup

```bash
# Navigate to frontend directory (project root)
cd ..

# Install dependencies
npm install

# Verify installation
npm run build
```

---

## 4. Mock Mode

For offline development or to avoid API costs, use mock mode.

### Enable Mock Mode

```bash
# In backend/.env
MOCK_EXTERNAL_APIS=true
```

### Mock Behavior

When `MOCK_EXTERNAL_APIS=true`:

| API | Mock Behavior |
|-----|---------------|
| Anthropic | Returns pre-defined streaming response |
| Tavily | Returns fixture job postings |
| Exa | Returns fixture search results |

### Mock Response Files

Mock responses are in `backend/tests/fixtures/`:

```
backend/tests/fixtures/
├── mock_tavily_response.json
├── mock_exa_response.json
├── mock_exa_linkedin_response.json
└── mock_claude_response.txt
```

### Creating Custom Mocks

```python
# backend/app/tools/mock_mode.py

def get_mock_tavily_response(query: str) -> dict:
    """Return mock Tavily response for development."""
    return {
        "results": [
            {
                "title": f"Mock Job: {query}",
                "url": "https://example.com/mock-job",
                "content": "This is a mock job posting for development...",
                "score": 0.95
            }
        ]
    }
```

---

## 5. Running the Stack

### Option A: Run Separately (Recommended for Development)

**Terminal 1 - Backend:**

```bash
cd backend
source venv/bin/activate  # or venv\Scripts\activate on Windows
uvicorn app.main:app --reload --port 8000
```

**Terminal 2 - Frontend:**

```bash
# From project root
npm run dev
```

**Access:**
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/docs

### Option B: Docker Compose (Full Stack)

```yaml
# docker-compose.yml
version: '3.8'

services:
  backend:
    build: ./backend
    ports:
      - "8000:8000"
    environment:
      - ANTHROPIC_API_KEY=${ANTHROPIC_API_KEY}
      - TAVILY_API_KEY=${TAVILY_API_KEY}
      - EXA_API_KEY=${EXA_API_KEY}
    volumes:
      - ./backend:/app
    command: uvicorn app.main:app --host 0.0.0.0 --reload

  frontend:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NEXT_PUBLIC_API_URL=http://localhost:8000
    volumes:
      - .:/app
      - /app/node_modules
    command: npm run dev
```

Run with:

```bash
# Start all services
docker-compose up

# Start in background
docker-compose up -d

# View logs
docker-compose logs -f

# Stop
docker-compose down
```

### Verify Stack is Running

```bash
# Health check
curl http://localhost:8000/api/health
# Expected: {"status": "healthy"}

# Readiness check
curl http://localhost:8000/api/health/ready
# Expected: {"status": "ready", "checks": {...}}

# Test query (with real APIs)
curl -X POST http://localhost:8000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Test query"}'
```

---

## 6. Development Workflow

### Daily Workflow

```bash
# 1. Pull latest changes
git pull origin main

# 2. Activate virtual environment
cd backend && source venv/bin/activate

# 3. Install any new dependencies
pip install -e ".[dev]"
cd .. && npm install

# 4. Run tests before starting work
cd backend && pytest tests/ -v
cd .. && npm test

# 5. Start development servers
# (Terminal 1) Backend
cd backend && uvicorn app.main:app --reload

# (Terminal 2) Frontend
npm run dev

# 6. Make changes, tests will auto-reload

# 7. Before committing, run full test suite
cd backend && pytest tests/ -v --cov=app
cd .. && npm test

# 8. Commit with meaningful message
git add .
git commit -m "feat: add skill trend visualization"
```

### Running Tests

```bash
# Backend tests
cd backend

# All tests
pytest tests/ -v

# With coverage
pytest tests/ --cov=app --cov-report=html
open htmlcov/index.html

# Specific test file
pytest tests/test_tools.py -v

# Specific test
pytest tests/test_tools.py::test_tavily_search -v

# Frontend tests
cd ..
npm test

# With coverage
npm test -- --coverage
```

### Linting and Formatting

```bash
# Backend
cd backend

# Run linter
ruff check .

# Auto-fix issues
ruff check . --fix

# Type checking
mypy app/

# Frontend
cd ..

# ESLint
npm run lint

# Prettier (if configured)
npm run format
```

### Debugging

#### Backend (VSCode)

Add to `.vscode/launch.json`:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Python: FastAPI",
      "type": "python",
      "request": "launch",
      "module": "uvicorn",
      "args": ["app.main:app", "--reload"],
      "cwd": "${workspaceFolder}/backend",
      "envFile": "${workspaceFolder}/backend/.env"
    }
  ]
}
```

#### Frontend (Browser DevTools)

1. Open Chrome DevTools (F12)
2. Sources tab → Add folder to workspace
3. Set breakpoints in source files

---

## 7. Troubleshooting

### Common Issues

#### "Module not found" errors

```bash
# Reinstall dependencies
cd backend
pip install -e ".[dev]" --force-reinstall
```

#### API key errors

```bash
# Verify keys are loaded
python -c "import os; print(os.getenv('ANTHROPIC_API_KEY', 'NOT SET')[:10])"

# Should print first 10 chars of key, not "NOT SET"
```

#### Port already in use

```bash
# Find and kill process on port 8000
# Windows:
netstat -ano | findstr :8000
taskkill /PID <PID> /F

# macOS/Linux:
lsof -i :8000
kill -9 <PID>
```

#### CORS errors in browser

Check that backend CORS is configured for localhost:3000:

```python
# backend/app/main.py
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Add your frontend URL
    allow_methods=["*"],
    allow_headers=["*"],
)
```

#### Streaming not working

1. Check browser supports SSE (all modern browsers do)
2. Verify Content-Type header: `text/event-stream`
3. Check for proxy/firewall blocking SSE

#### Mock mode not working

```bash
# Verify environment variable
python -c "import os; print(os.getenv('MOCK_EXTERNAL_APIS'))"

# Should print "true" (as string)
```

### Getting Help

1. Check existing issues on GitHub
2. Search documentation
3. Ask in team Slack channel
4. Create detailed bug report with:
   - Steps to reproduce
   - Expected vs actual behavior
   - Environment details
   - Relevant logs

---

## Quick Reference

```bash
# Start backend (development)
cd backend && uvicorn app.main:app --reload

# Start frontend (development)
npm run dev

# Run backend tests
cd backend && pytest tests/ -v

# Run frontend tests
npm test

# Check backend health
curl http://localhost:8000/api/health

# Enable mock mode
# Set MOCK_EXTERNAL_APIS=true in backend/.env
```

---

*Development Guide - Addressing Gap 6 from expert feedback*
