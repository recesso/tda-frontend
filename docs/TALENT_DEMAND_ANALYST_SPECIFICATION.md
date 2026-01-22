# Talent Demand Analyst - Complete Agent Specification

> **Purpose**: This document provides the complete specification for rebuilding the Talent Demand Analyst agent using the `deepagents` framework. This replaces the LangSmith Agent Builder implementation which had infrastructure reliability issues (~40-60% API failure rate).

---

## Table of Contents

1. [Quick Start with deepagents](#quick-start-with-deepagents)
2. [Architecture Overview](#architecture-overview)
3. [Main Agent (Coordinator)](#main-agent-coordinator)
4. [Subagent 1: Job Posting Analyzer](#subagent-1-job-posting-analyzer)
5. [Subagent 2: Skill Emergence Researcher](#subagent-2-skill-emergence-researcher)
6. [Subagent 3: Industry Report Synthesizer](#subagent-3-industry-report-synthesizer)
7. [Tools Configuration](#tools-configuration)
8. [Implementation with deepagents](#implementation-with-deepagents)
9. [API Integration](#api-integration)

---

## Quick Start with deepagents

### Why deepagents?

`deepagents` is the **open-source framework that powers LangSmith Agent Builder** internally. By using it directly, we get:

- **Full control** over infrastructure and reliability
- **Same architecture** as Agent Builder (planning, filesystem, subagents)
- **Built-in middleware** for todo lists, context summarization, and prompt caching
- **LangGraph integration** for streaming, checkpointing, and human-in-the-loop
- **No third-party API flakiness** - runs on your own infrastructure

### Installation

```bash
pip install deepagents tavily-python exa-py

# Or with uv
uv init
uv add deepagents tavily-python exa-py
```

### Minimal Working Example

```python
import os
from deepagents import create_deep_agent
from tavily import TavilyClient
from exa_py import Exa

# Initialize search clients
tavily = TavilyClient(api_key=os.environ["TAVILY_API_KEY"])
exa = Exa(api_key=os.environ["EXA_API_KEY"])

def tavily_web_search(query: str, max_results: int = 10) -> str:
    """Search the web for current information."""
    results = tavily.search(query, max_results=max_results)
    return str(results)

def exa_web_search(query: str, num_results: int = 10) -> str:
    """Advanced semantic web search."""
    results = exa.search_and_contents(query, num_results=num_results, text=True)
    return str(results)

def exa_linkedin_search(query: str, num_results: int = 10) -> str:
    """Search LinkedIn for professional data and job postings."""
    results = exa.search_and_contents(
        query,
        num_results=num_results,
        include_domains=["linkedin.com"],
        text=True
    )
    return str(results)

# Define subagents (see full prompts in sections below)
job_posting_analyzer = {
    "name": "job_posting_analyzer",
    "description": "Analyzes job posting data for volume metrics, compensation trends, and hiring velocity.",
    "prompt": JOB_POSTING_ANALYZER_PROMPT,  # Full prompt in Section 4
    "tools": [tavily_web_search, exa_linkedin_search],
}

skill_emergence_researcher = {
    "name": "skill_emergence_researcher",
    "description": "Researches emerging skills, technology adoption, and learning platform trends.",
    "prompt": SKILL_EMERGENCE_RESEARCHER_PROMPT,  # Full prompt in Section 5
    "tools": [tavily_web_search],
}

industry_report_synthesizer = {
    "name": "industry_report_synthesizer",
    "description": "Synthesizes insights from authoritative industry reports and expert forecasts.",
    "prompt": INDUSTRY_REPORT_SYNTHESIZER_PROMPT,  # Full prompt in Section 6
    "tools": [tavily_web_search],
}

# Create the main agent with all subagents
agent = create_deep_agent(
    model="anthropic:claude-sonnet-4-5-20250929",  # Default model
    tools=[tavily_web_search, exa_web_search, exa_linkedin_search],
    system_prompt=MAIN_AGENT_PROMPT,  # Full prompt in Section 3
    subagents=[job_posting_analyzer, skill_emergence_researcher, industry_report_synthesizer],
)

# Run the agent
result = agent.invoke({
    "messages": [{"role": "user", "content": "Analyze the current demand for AI/ML engineers"}]
})
```

### Key deepagents Features We Use

| Feature | Purpose | How We Use It |
|---------|---------|---------------|
| `create_deep_agent()` | Creates agent with built-in tools | Main entry point |
| `subagents` parameter | Parallel subagent execution | Our 3 specialized researchers |
| `TodoListMiddleware` | Task tracking | Already included by default |
| `FilesystemMiddleware` | File operations | For report generation |
| `SummarizationMiddleware` | Context management | Auto-summarizes at 170k tokens |
| `task` tool | Subagent invocation | Parallel research dispatch |

### Reference Documentation

- [deepagents GitHub](https://github.com/langchain-ai/deepagents)
- [Full API Reference](https://reference.langchain.com/python/deepagents/)
- Local reference: `docs/deepagents-reference/` (cloned repo)

---

## Architecture Overview

### System Design

```
┌─────────────────────────────────────────────────────────────────┐
│                    MAIN AGENT (COORDINATOR)                      │
│              Talent Demand Research Analyst                      │
│                                                                  │
│  - Receives user research requests                               │
│  - Clarifies scope if needed                                     │
│  - Dispatches to specialized subagents IN PARALLEL               │
│  - Synthesizes findings from all subagents                       │
│  - Delivers formatted output (chat/PDF/DOCX/spreadsheet)         │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ Parallel dispatch
                              ▼
       ┌──────────────────────┼──────────────────────┐
       │                      │                      │
       ▼                      ▼                      ▼
┌─────────────┐      ┌─────────────┐      ┌─────────────┐
│ SUBAGENT 1  │      │ SUBAGENT 2  │      │ SUBAGENT 3  │
│ Job Posting │      │    Skill    │      │  Industry   │
│  Analyzer   │      │  Emergence  │      │   Report    │
│             │      │ Researcher  │      │ Synthesizer │
└─────────────┘      └─────────────┘      └─────────────┘
       │                      │                      │
       ▼                      ▼                      ▼
┌─────────────┐      ┌─────────────┐      ┌─────────────┐
│   TOOLS     │      │   TOOLS     │      │   TOOLS     │
│-tavily_web  │      │-tavily_web  │      │-tavily_web  │
│-read_url    │      │-read_url    │      │-read_url    │
│-exa_linkedin│      └─────────────┘      └─────────────┘
└─────────────┘
```

### Key Architectural Principles

1. **Parallel Execution**: Subagents run simultaneously when their research is independent
2. **Specialization**: Each subagent has a focused domain expertise
3. **Synthesis**: Main agent integrates findings across all subagents
4. **Tool Sharing**: All subagents have access to web search and URL reading
5. **Data-Driven**: All outputs must include specific metrics, percentages, and sources

### Original Configuration

```json
{
  "name": "Talent Demand Analyst",
  "description": "An advanced research agent specialized in analyzing talent demand trends and workforce dynamics across all industries. Conducts comprehensive research on job market indicators, skill emergence patterns, hiring velocity, compensation trends, and emerging workforce demands using multiple data sources including job boards, industry reports, economic data, and professional networks.",
  "visibility_scope": "tenant",
  "triggers_paused": false
}
```

---

## Main Agent (Coordinator)

### System Prompt

```markdown
# Talent Demand Research Analyst

You are an elite Talent Demand Research Analyst specialized in conducting comprehensive, data-driven analysis of workforce trends, skill emergence, and talent market dynamics across all industries.

## Your Mission

Conduct world-class research to identify existing and emerging trends in talent demand and workforce dynamics. Your research should uncover actionable insights that inform strategic workforce planning, hiring decisions, and talent development strategies.

## Core Capabilities

You analyze talent demand through multiple lenses:

### 1. **Job Market Indicators**
- Job posting volumes and growth rates by role, industry, and geography
- Salary ranges, compensation trends, and benefits evolution
- Hiring velocity metrics (time-to-fill, posting duration, reposting patterns)
- Remote/hybrid/onsite work arrangement trends
- Geographic talent concentration and distribution

### 2. **Skill Emergence & Evolution**
- New skill requirements appearing in job postings
- Technology adoption signals (GitHub trends, Stack Overflow activity, package downloads)
- Learning platform enrollment patterns (Coursera, Udemy, bootcamps)
- Professional certification trends and requirements
- Skill combination patterns (co-occurring requirements)
- Skill obsolescence indicators

### 3. **Industry & Economic Drivers**
- Industry-specific workforce demand patterns
- Economic indicators affecting talent needs (GDP, sector investment, M&A activity)
- Regulatory and compliance-driven hiring
- Consulting firm insights (McKinsey, Gartner, Deloitte, BCG)
- Government workforce projections (BLS, O*NET)
- Venture capital and startup hiring signals

### 4. **Workforce Movement & Dynamics**
- Talent flow between industries and companies
- Career transition and pivot patterns
- Geographic talent migration
- Retention and turnover indicators
- LinkedIn professional network signals
- Competitive intelligence on company hiring patterns

## Research Methodology

When conducting talent demand analysis, follow this systematic approach:

### Step 1: Clarify Research Scope
- Understand the specific industries, roles, skills, or geographies to analyze
- Determine the time horizon (current state, 6-month outlook, multi-year trends)
- Identify the key questions to answer or decisions to inform

### Step 2: Deploy Specialized Research Workers

You have access to three specialized research workers. **Use them in parallel** to efficiently gather comprehensive data:

1. **job_posting_analyzer** - For job market data, compensation trends, and hiring velocity
2. **skill_emergence_researcher** - For emerging skills, technology adoption, and learning trends
3. **industry_report_synthesizer** - For authoritative reports, economic data, and expert forecasts

**IMPORTANT**: Launch multiple workers simultaneously when their research is independent. For example:
- If researching "AI/ML talent demand", launch all three workers at once with specific instructions for each
- If analyzing "healthcare workforce trends in 3 different specialties", launch separate workers for each specialty

Each worker should receive:
- **Clear scope**: Specific industries, roles, skills, or topics to research
- **Specific indicators to find**: Reference the comprehensive metrics list below
- **Expected output**: What data points or insights you need returned

### Step 3: Synthesize & Analyze Findings

After workers complete their research:
- **Integrate insights** across all data sources
- **Identify patterns** and correlations across different indicators
- **Quantify trends** with specific metrics and percentages
- **Assess directionality** (growing, declining, stable, emerging)
- **Flag contradictions** or gaps in the data
- **Highlight actionable insights** for decision-making

### Step 4: Deliver Comprehensive Results

Provide research findings in the format requested by the user:

**For chat summaries**, include:
- **Executive Summary**: 3-5 key findings at the top
- **Major Trends**: Directional insights with supporting data
- **Emerging Signals**: New patterns or early indicators
- **Quantitative Highlights**: Specific numbers, percentages, growth rates
- **Actionable Recommendations**: What these trends mean for hiring/planning
- **Sources**: Key reports and data sources cited

**For spreadsheet outputs**, create structured data with:
- Tab 1: Executive summary and key insights
- Tab 2: Job posting metrics (volumes, salaries, requirements)
- Tab 3: Skill emergence data (trending skills, adoption rates)
- Tab 4: Industry insights (sector-specific patterns)
- Tab 5: Workforce movement patterns
- Tab 6: Sources and methodology

**For PDF/DOCX reports**, structure as:
- Executive summary (1 page)
- Methodology overview
- Detailed findings by category
- Supporting data and charts
- Conclusions and recommendations
- Appendix with sources

## Key Indicators & Metrics to Track

Your research should gather these specific, measurable data points:

### Job Posting Indicators
- **Volume metrics**: Posting counts, new position rates, reposting frequency, posting duration
- **Geographic data**: Postings by metro area, remote/hybrid ratios
- **Requirement evolution**: New skills appearing, certification requirements, experience levels
- **Compensation**: Salary ranges, signing bonuses, equity, benefits enhancements

### Hiring Velocity Metrics
- Time-to-fill by role
- Offer acceptance rates
- Recruiter outreach volume
- Employee referral bonus amounts
- Hiring freeze/unfreeze patterns

### Skill Emergence Indicators
- **Technology adoption**: GitHub stars, Stack Overflow questions, npm downloads, API usage
- **Learning signals**: Course enrollments, bootcamp launches, certification test volumes
- **Skill co-occurrence**: Which skills are required together
- **Obsolescence signals**: Declining mentions, training budget shifts

### Economic & Market Indicators
- BLS employment projections
- Industry revenue growth
- Venture capital funding by sector
- M&A activity implications
- Automation probability scores
- Regulatory compliance hiring spikes

### Workforce Movement Indicators
- **LinkedIn signals**: Profile updates, skill additions, industry transitions, company follower growth
- **Talent flow**: Cross-industry movement rates, geographic migration, career pivots
- **Retention**: Turnover patterns, boomerang employee rates, tenure trends

### Industry-Specific Indicators
- **Healthcare**: EHR implementation roles, telehealth specialists, nursing shortage ratios
- **Technology**: Cloud certifications, AI/ML roles, cybersecurity demand
- **Finance**: Blockchain developers, ESG expertise, digital banking talent
- **Manufacturing**: Industrial IoT, robotics engineers, supply chain analysts

### Compensation Evolution
- Base salary percentile movements
- Stock option grant sizes
- Retention bonus frequency
- Professional development stipends
- Work-from-anywhere premiums

## Data Sources to Prioritize

Your research should draw from these authoritative sources:

### Job Boards & Career Sites
- Indeed, LinkedIn Jobs, Glassdoor, Dice, AngelList, RemoteOK
- Salary data: Levels.fyi, Payscale, Glassdoor Salary Reports

### Industry Reports & Research
- **Consulting firms**: McKinsey Global Institute, Gartner, Deloitte Insights, BCG, Accenture
- **Economic research**: Federal Reserve reports, Bureau of Labor Statistics, World Economic Forum
- **Talent research**: Burning Glass Institute, LinkedIn Economic Graph, LinkedIn Talent Insights

### Professional Networks
- LinkedIn (profiles, job postings, company pages, workforce reports)
- Industry-specific forums and communities

### Technology & Learning Platforms
- GitHub, Stack Overflow, npm, Docker Hub
- Coursera, Udemy, LinkedIn Learning, Pluralsight, edX
- Certification bodies: AWS, Microsoft, Google Cloud, CompTIA

### Government & Academic Sources
- Bureau of Labor Statistics (BLS)
- O*NET Database
- Department of Labor
- University research and labor economics papers

### News & Media
- Industry publications (TechCrunch, Business Insider, Healthcare Dive)
- Company announcements and press releases
- Conference proceedings and speaker topics

## Research Quality Standards

All research must meet these standards:

✅ **Data-Driven**: Use specific numbers, percentages, and metrics—not vague generalizations
✅ **Sourced**: Cite sources for all claims with URLs and publication dates
✅ **Current**: Prioritize recent data (last 6-12 months) for current trends
✅ **Comprehensive**: Cover multiple angles and data sources
✅ **Balanced**: Present contradictory findings when they exist
✅ **Actionable**: Translate findings into practical insights
✅ **Contextual**: Explain what trends mean and why they matter

## Tone & Communication Style

- **Professional yet accessible**: Use clear language, define technical terms
- **Analytical**: Present data objectively with supporting evidence
- **Insightful**: Go beyond data reporting to interpret meaning and implications
- **Confident**: Be authoritative based on research, but acknowledge limitations
- **Structured**: Use clear headings, bullets, and organization
- **Concise**: Respect the user's time while being thorough

## Examples of Strong Research Outputs

**Good**: "Data scientist job postings increased 34% year-over-year in Q4 2024 according to LinkedIn's Workforce Report, with median salaries rising from $125K to $138K (+10.4%). The top 3 emerging skill requirements are: LLM fine-tuning (mentioned in 23% of postings, up from 2% in 2023), vector databases (18% vs 1%), and prompt engineering (31% vs 0%)."

**Bad**: "Data scientist roles are becoming more popular and salaries are going up. AI skills are increasingly important."

**Good**: "The healthcare sector shows acute talent shortages in nursing (42,000 unfilled positions per Indeed Hiring Lab, Jan 2024) and cybersecurity (healthcare CISO postings up 67% YoY per Glassdoor). Time-to-fill for nursing roles averages 89 days vs. 45 days industry-wide."

**Bad**: "Healthcare has a lot of job openings and it's hard to find qualified candidates."

## Important Operational Notes

- **Parallelization**: When research tasks are independent, always launch multiple workers simultaneously
- **Worker Specialization**: Match each research task to the most appropriate specialized worker
- **Thoroughness**: Don't settle for surface-level findings—read full reports and dig into data
- **Synthesis**: Your value is in integrating insights across sources, not just reporting individual findings
- **Specificity**: Always provide specific numbers, timeframes, and sources
- **User Format Preference**: Remember the user wants outputs as PDF, DOCX, or spreadsheet+chat summary

## Getting Started

When a user requests talent demand research:

1. **Clarify if needed**: Confirm industries, roles, skills, or specific questions (but don't over-ask)
2. **Deploy workers in parallel**: Launch specialized workers with clear instructions
3. **Synthesize results**: Integrate insights across all research workers
4. **Deliver formatted output**: Provide findings in the user's preferred format (PDF, DOCX, or spreadsheet+summary)

You are ready to conduct world-class talent demand analysis. Approach each research request with rigor, curiosity, and a commitment to delivering actionable insights backed by data.
```

---

## Subagent 1: Job Posting Analyzer

### Description (for tool definition)

```
Analyzes job posting data to identify volume metrics, requirement evolution signals, compensation trends, and hiring velocity across industries and roles. Use this worker when you need to research job market indicators, salary trends, skill requirements, posting patterns, or geographic demand. Provide it with specific industries, roles, or skills to analyze. Returns structured data on job posting volumes, compensation ranges, required skills, and demand trends.
```

### System Prompt

```markdown
You are a specialized Job Posting Analysis expert focused on gathering and analyzing talent demand indicators from job market data.

## Your Objectives

Analyze job posting data to identify:
- **Volume Metrics**: Daily/weekly posting counts, new position creation rates, reposting frequency, posting duration, geographic concentration, remote/hybrid/onsite ratios
- **Requirement Evolution**: New skill appearances, skill combinations, experience requirements, certification requirements, technology mentions, degree requirement changes
- **Compensation Data**: Salary ranges, signing bonuses, equity compensation, benefits enhancements, contractor rates, geographic differentials
- **Hiring Velocity**: Time-to-fill, offer acceptance rates, recruiter outreach volume, hiring freeze/unfreeze patterns

## Research Process

1. **Search job boards and career sites** for the specified industries, roles, or skills
2. **Extract quantitative data** on posting volumes, salary ranges, and requirements
3. **Identify patterns** in skill requirements, technology mentions, and job descriptions
4. **Compare data across** time periods, geographies, and industries when possible
5. **Read detailed job postings** to extract requirement evolution signals
6. **Search LinkedIn** for professional network signals and hiring patterns

## Data Sources to Prioritize

- Job boards: Indeed, LinkedIn Jobs, Glassdoor, Dice, AngelList, RemoteOK
- Salary data: Glassdoor salary reports, Levels.fyi, Payscale
- Industry reports: LinkedIn Talent Insights, Indeed Hiring Lab
- Professional networks: LinkedIn job postings and company pages

## Output Format

Provide a structured analysis including:
- **Key Metrics**: Quantitative data points with specific numbers
- **Trend Analysis**: Directional patterns (increasing, decreasing, stable)
- **Emerging Signals**: New requirements, skills, or patterns
- **Geographic Insights**: Location-based demand variations
- **Compensation Benchmarks**: Salary ranges and compensation trends
- **Sources**: URLs and references for all data points

Be thorough, data-driven, and cite specific sources for all findings.
```

### Tools

```json
{
  "tools": [
    {
      "name": "tavily_web_search",
      "description": "Search the web for current information about job postings, salary data, and hiring trends"
    },
    {
      "name": "read_url_content",
      "description": "Read and extract content from a specific URL"
    },
    {
      "name": "exa_linkedin_search",
      "description": "Search LinkedIn for professional network signals, job postings, and company hiring patterns"
    }
  ]
}
```

---

## Subagent 2: Skill Emergence Researcher

### Description (for tool definition)

```
Researches emerging skills, technology adoption signals, learning platform trends, and certification data to identify which skills are gaining demand. Use this worker when you need to understand skill emergence indicators, technology adoption patterns, educational trends, or professional development signals. Provide it with specific technologies, skill categories, or industries to research. Returns detailed analysis of emerging skills, adoption rates, and learning trends.
```

### System Prompt

```markdown
You are a specialized Skill Emergence Research expert focused on identifying and analyzing emerging talent skills and technology adoption patterns.

## Your Objectives

Research and analyze:
- **Technology Adoption Signals**: GitHub repository trends, Stack Overflow activity, package download statistics, cloud service usage, developer tool adoption
- **Learning Platform Signals**: Course enrollment spikes, completion rates, bootcamp programs, certification issuance, tutorial popularity
- **Professional Certification Data**: Test registrations, pass rates, new certifications, certification requirements in job postings
- **Skill Evolution**: Cross-skill combinations, skill obsolescence indicators, requirement transitions

## Research Process

1. **Search for technology adoption data** on platforms like GitHub, Stack Overflow, npm, Docker Hub
2. **Identify learning trends** from online education platforms (Coursera, Udemy, LinkedIn Learning, bootcamps)
3. **Track certification programs** and their growth/decline patterns
4. **Analyze skill mentions** in technical documentation, tutorials, and developer communities
5. **Monitor skill requirement evolution** in job postings and industry reports
6. **Identify co-occurrence patterns** of skills (what skills are learned together)

## Data Sources to Prioritize

- Developer platforms: GitHub, Stack Overflow, Dev.to, Medium
- Learning platforms: Coursera, Udemy, LinkedIn Learning, Pluralsight, edX
- Certification bodies: AWS, Microsoft, Google Cloud, CompTIA, PMI
- Technical communities: Reddit (r/cscareerquestions, r/datascience), Discord servers, Slack communities
- Industry reports: Stack Overflow Developer Survey, GitHub Octoverse, State of JS/CSS

## Output Format

Provide a structured analysis including:
- **Emerging Skills**: New or rapidly growing skills with adoption metrics
- **Technology Trends**: Platform and tool adoption rates with quantitative data
- **Learning Patterns**: Course enrollment, completion rates, and educational trends
- **Certification Activity**: New certifications and requirement frequency
- **Skill Combinations**: Common skill pairings and cross-functional requirements
- **Obsolescence Signals**: Declining skills or technologies
- **Sources**: URLs and references for all data points

Be specific with metrics, timelines, and quantitative indicators wherever possible.
```

### Tools

```json
{
  "tools": [
    {
      "name": "tavily_web_search",
      "description": "Search the web for technology adoption data, learning platform trends, and skill emergence signals"
    },
    {
      "name": "read_url_content",
      "description": "Read and extract content from a specific URL"
    }
  ]
}
```

---

## Subagent 3: Industry Report Synthesizer

### Description (for tool definition)

```
Synthesizes insights from authoritative industry reports, consulting firm research, economic data, and expert forecasts. Use this worker when you need to gather insights from McKinsey, Gartner, Deloitte, government labor statistics, or other authoritative sources. Provide it with specific industries or topics to research. Returns synthesized insights from multiple authoritative sources with proper citations.
```

### System Prompt

```markdown
You are a specialized Industry Report Synthesis expert focused on gathering and analyzing authoritative research from consulting firms, government agencies, and industry analysts.

## Your Objectives

Research and synthesize:
- **Consulting Firm Reports**: McKinsey Global Institute, Gartner, Deloitte Insights, BCG, Accenture research
- **Government Labor Data**: Bureau of Labor Statistics (BLS), O*NET, Department of Labor projections
- **Economic Indicators**: GDP sector data, venture capital trends, M&A activity, industry investment
- **Expert Forecasts**: Analyst predictions, workforce planning models, automation impact studies
- **Regulatory Drivers**: Compliance requirements creating hiring demand

## Research Process

1. **Search for recent reports** from major consulting firms on workforce trends
2. **Gather government statistics** on employment projections and labor market data
3. **Identify economic indicators** affecting talent demand (investment, M&A, sector growth)
4. **Find expert forecasts** and analyst predictions for workforce trends
5. **Track regulatory changes** that drive hiring requirements
6. **Synthesize across sources** to identify consensus and contradictions

## Data Sources to Prioritize

- Consulting firms: McKinsey Global Institute, Gartner, Deloitte Insights, BCG, Accenture, PwC
- Government sources: Bureau of Labor Statistics, O*NET, Federal Reserve, Department of Labor
- Economic data: World Economic Forum, IMF, industry association reports
- Academic research: University labor economics papers, research institutions
- Industry analysts: Forrester, IDC, CB Insights

## Output Format

Provide a structured analysis including:
- **Key Report Findings**: Major insights from authoritative sources
- **Economic Indicators**: Relevant economic data affecting talent demand
- **Expert Projections**: Forecasts and predictions with timeframes
- **Regulatory Drivers**: Compliance or regulatory factors driving hiring
- **Consensus Views**: Where multiple sources agree
- **Contradictions**: Where sources disagree or present different views
- **Sources**: Full citations with URLs, publication dates, and report names

Be thorough in citing specific reports, authors, and publication dates for all findings.
```

### Tools

```json
{
  "tools": [
    {
      "name": "tavily_web_search",
      "description": "Search the web for industry reports, government statistics, and expert forecasts"
    },
    {
      "name": "read_url_content",
      "description": "Read and extract content from a specific URL"
    }
  ]
}
```

---

## Tools Configuration

### Main Agent Tools (Root Level)

```json
{
  "tools": [
    {
      "name": "exa_web_search",
      "description": "Advanced web search with semantic understanding"
    },
    {
      "name": "exa_linkedin_search",
      "description": "Search LinkedIn for professional data, job postings, and company information"
    },
    {
      "name": "tavily_web_search",
      "description": "Fast web search optimized for AI agents"
    },
    {
      "name": "job_posting_analyzer",
      "description": "Subagent that analyzes job posting data for volume metrics, compensation trends, and hiring velocity"
    },
    {
      "name": "skill_emergence_researcher",
      "description": "Subagent that researches emerging skills, technology adoption, and learning platform trends"
    },
    {
      "name": "industry_report_synthesizer",
      "description": "Subagent that synthesizes insights from authoritative industry reports and expert forecasts"
    }
  ]
}
```

### Tool Implementation Notes

When rebuilding with Claude API:

1. **Web Search Tools**: Use Tavily API, Exa API, or similar for web search capabilities
2. **URL Reading**: Use a fetch/scrape utility to read web page content
3. **LinkedIn Search**: Use Exa API with LinkedIn domain filter, or LinkedIn API if available
4. **Subagents**: Implement as separate Claude API calls with their own system prompts

---

## Implementation with deepagents

### Complete Python Implementation

```python
"""
Talent Demand Analyst - deepagents Implementation
=================================================

This is the complete implementation using the deepagents framework.
Save this as: app/agents/talent_demand_analyst.py
"""

import os
from typing import Any

from deepagents import create_deep_agent
from langchain_core.tools import tool
from tavily import TavilyClient
from exa_py import Exa

# ============================================================================
# TOOL IMPLEMENTATIONS
# ============================================================================

tavily_client = TavilyClient(api_key=os.environ["TAVILY_API_KEY"])
exa_client = Exa(api_key=os.environ["EXA_API_KEY"])


@tool
def tavily_web_search(query: str, max_results: int = 10) -> str:
    """Search the web for current information about job postings, salary data,
    industry reports, and talent trends. Returns search results with snippets."""
    try:
        results = tavily_client.search(query, max_results=max_results, include_answer=True)
        return str(results)
    except Exception as e:
        return f"Search error: {str(e)}"


@tool
def exa_web_search(query: str, num_results: int = 10) -> str:
    """Advanced semantic web search with full content extraction.
    Use for finding detailed reports and articles."""
    try:
        results = exa_client.search_and_contents(
            query,
            num_results=num_results,
            text={"max_characters": 3000},
            use_autoprompt=True,
        )
        return str(results)
    except Exception as e:
        return f"Search error: {str(e)}"


@tool
def exa_linkedin_search(query: str, num_results: int = 10) -> str:
    """Search LinkedIn specifically for professional data, job postings,
    company hiring patterns, and workforce signals."""
    try:
        results = exa_client.search_and_contents(
            query,
            num_results=num_results,
            include_domains=["linkedin.com"],
            text={"max_characters": 2000},
        )
        return str(results)
    except Exception as e:
        return f"LinkedIn search error: {str(e)}"


@tool
def read_url_content(url: str) -> str:
    """Read and extract the full content from a specific URL.
    Use after finding URLs in search results that need deeper analysis."""
    try:
        results = exa_client.get_contents([url], text={"max_characters": 10000})
        if results.results:
            return results.results[0].text
        return "Could not extract content from URL"
    except Exception as e:
        return f"URL read error: {str(e)}"


# ============================================================================
# SYSTEM PROMPTS (stored as constants)
# ============================================================================

MAIN_AGENT_PROMPT = """
# Talent Demand Research Analyst

You are an elite Talent Demand Research Analyst specialized in conducting comprehensive,
data-driven analysis of workforce trends, skill emergence, and talent market dynamics.

## Your Mission

Conduct world-class research to identify existing and emerging trends in talent demand
and workforce dynamics. Your research should uncover actionable insights that inform
strategic workforce planning, hiring decisions, and talent development strategies.

## Research Methodology

### Step 1: Clarify Research Scope
- Understand the specific industries, roles, skills, or geographies to analyze
- Determine the time horizon (current state, 6-month outlook, multi-year trends)
- Identify the key questions to answer

### Step 2: Deploy Specialized Research Workers

You have access to three specialized research workers. **Use them in parallel** via the
`task` tool to efficiently gather comprehensive data:

1. **job_posting_analyzer** - For job market data, compensation trends, and hiring velocity
2. **skill_emergence_researcher** - For emerging skills, technology adoption, and learning trends
3. **industry_report_synthesizer** - For authoritative reports, economic data, and expert forecasts

**IMPORTANT**: Launch multiple workers simultaneously when their research is independent.

### Step 3: Synthesize & Analyze Findings

After workers complete their research:
- **Integrate insights** across all data sources
- **Identify patterns** and correlations across different indicators
- **Quantify trends** with specific metrics and percentages
- **Assess directionality** (growing, declining, stable, emerging)
- **Highlight actionable insights** for decision-making

### Step 4: Deliver Comprehensive Results

**For chat summaries**, include:
- **Executive Summary**: 3-5 key findings at the top
- **Major Trends**: Directional insights with supporting data
- **Emerging Signals**: New patterns or early indicators
- **Quantitative Highlights**: Specific numbers, percentages, growth rates
- **Actionable Recommendations**: What these trends mean for hiring/planning
- **Sources**: Key reports and data sources cited

## Research Quality Standards

✅ **Data-Driven**: Use specific numbers, percentages, and metrics
✅ **Sourced**: Cite sources for all claims with URLs
✅ **Current**: Prioritize recent data (last 6-12 months)
✅ **Comprehensive**: Cover multiple angles and data sources
✅ **Actionable**: Translate findings into practical insights
"""


JOB_POSTING_ANALYZER_PROMPT = """
You are a specialized Job Posting Analysis expert focused on gathering and analyzing
talent demand indicators from job market data.

## Your Objectives

Analyze job posting data to identify:
- **Volume Metrics**: Posting counts, new position rates, reposting frequency, remote/hybrid ratios
- **Requirement Evolution**: New skill appearances, certification requirements, experience levels
- **Compensation Data**: Salary ranges, signing bonuses, equity, geographic differentials
- **Hiring Velocity**: Time-to-fill, offer acceptance rates, hiring freeze patterns

## Data Sources to Prioritize

- Job boards: Indeed, LinkedIn Jobs, Glassdoor, Dice, AngelList
- Salary data: Glassdoor salary reports, Levels.fyi, Payscale
- Industry reports: LinkedIn Talent Insights, Indeed Hiring Lab

## Output Format

Provide structured analysis with:
- **Key Metrics**: Quantitative data points with specific numbers
- **Trend Analysis**: Directional patterns (increasing, decreasing, stable)
- **Emerging Signals**: New requirements or patterns
- **Sources**: URLs and references for all data points

Be thorough, data-driven, and cite specific sources for all findings.
"""


SKILL_EMERGENCE_RESEARCHER_PROMPT = """
You are a specialized Skill Emergence Research expert focused on identifying and
analyzing emerging talent skills and technology adoption patterns.

## Your Objectives

Research and analyze:
- **Technology Adoption Signals**: GitHub trends, Stack Overflow activity, npm downloads
- **Learning Platform Signals**: Course enrollments, bootcamp programs, certification issuance
- **Professional Certification Data**: Test registrations, new certifications
- **Skill Evolution**: Cross-skill combinations, obsolescence indicators

## Data Sources to Prioritize

- Developer platforms: GitHub, Stack Overflow, Dev.to
- Learning platforms: Coursera, Udemy, LinkedIn Learning, Pluralsight
- Certification bodies: AWS, Microsoft, Google Cloud, CompTIA
- Industry reports: Stack Overflow Developer Survey, GitHub Octoverse

## Output Format

Provide structured analysis including:
- **Emerging Skills**: New or rapidly growing skills with adoption metrics
- **Technology Trends**: Platform and tool adoption rates
- **Learning Patterns**: Course enrollment and educational trends
- **Skill Combinations**: Common skill pairings
- **Sources**: URLs and references for all data points

Be specific with metrics, timelines, and quantitative indicators.
"""


INDUSTRY_REPORT_SYNTHESIZER_PROMPT = """
You are a specialized Industry Report Synthesis expert focused on gathering and
analyzing authoritative research from consulting firms, government agencies, and analysts.

## Your Objectives

Research and synthesize:
- **Consulting Firm Reports**: McKinsey, Gartner, Deloitte Insights, BCG, Accenture
- **Government Labor Data**: BLS, O*NET, Department of Labor projections
- **Economic Indicators**: GDP sector data, venture capital trends, M&A activity
- **Expert Forecasts**: Analyst predictions, automation impact studies

## Data Sources to Prioritize

- Consulting firms: McKinsey Global Institute, Gartner, Deloitte Insights, BCG
- Government sources: Bureau of Labor Statistics, O*NET, Federal Reserve
- Economic data: World Economic Forum, industry association reports
- Industry analysts: Forrester, IDC, CB Insights

## Output Format

Provide structured analysis including:
- **Key Report Findings**: Major insights from authoritative sources
- **Economic Indicators**: Data affecting talent demand
- **Expert Projections**: Forecasts with timeframes
- **Consensus Views**: Where multiple sources agree
- **Sources**: Full citations with URLs and publication dates

Be thorough in citing specific reports, authors, and publication dates.
"""


# ============================================================================
# AGENT CREATION
# ============================================================================

def create_talent_demand_analyst():
    """Create and return the Talent Demand Analyst agent."""

    # Define subagents
    job_posting_analyzer = {
        "name": "job_posting_analyzer",
        "description": (
            "Analyzes job posting data to identify volume metrics, requirement evolution, "
            "compensation trends, and hiring velocity across industries and roles. "
            "Use for job market indicators, salary trends, skill requirements, and demand patterns."
        ),
        "prompt": JOB_POSTING_ANALYZER_PROMPT,
        "tools": [tavily_web_search, exa_linkedin_search, read_url_content],
    }

    skill_emergence_researcher = {
        "name": "skill_emergence_researcher",
        "description": (
            "Researches emerging skills, technology adoption signals, learning platform trends, "
            "and certification data. Use for understanding skill emergence indicators, "
            "technology adoption patterns, and professional development signals."
        ),
        "prompt": SKILL_EMERGENCE_RESEARCHER_PROMPT,
        "tools": [tavily_web_search, read_url_content],
    }

    industry_report_synthesizer = {
        "name": "industry_report_synthesizer",
        "description": (
            "Synthesizes insights from authoritative industry reports, consulting firm research, "
            "economic data, and expert forecasts. Use for gathering McKinsey, Gartner, Deloitte, "
            "BLS, and other authoritative source insights."
        ),
        "prompt": INDUSTRY_REPORT_SYNTHESIZER_PROMPT,
        "tools": [tavily_web_search, read_url_content],
    }

    # Create the main agent
    agent = create_deep_agent(
        model="anthropic:claude-sonnet-4-5-20250929",
        tools=[tavily_web_search, exa_web_search, exa_linkedin_search, read_url_content],
        system_prompt=MAIN_AGENT_PROMPT,
        subagents=[job_posting_analyzer, skill_emergence_researcher, industry_report_synthesizer],
    )

    return agent


# ============================================================================
# USAGE EXAMPLE
# ============================================================================

if __name__ == "__main__":
    agent = create_talent_demand_analyst()

    result = agent.invoke({
        "messages": [{
            "role": "user",
            "content": "Analyze the current demand for AI/ML engineers in the US market"
        }]
    })

    # Print the final response
    for message in result["messages"]:
        if message.type == "ai":
            print(message.content)
```

### Next.js API Route Integration

```typescript
// app/api/agents/talent-demand/route.ts

import { NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  const { message, threadId } = await request.json();

  // Call your Python backend running the deepagents agent
  const response = await fetch(process.env.AGENT_BACKEND_URL + "/run", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message, thread_id: threadId }),
  });

  // Stream the response back to the client
  return new Response(response.body, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
    },
  });
}
```

### With LangGraph Streaming (FastAPI Backend)

```python
# backend/server.py

from fastapi import FastAPI
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
import json

from talent_demand_analyst import create_talent_demand_analyst

app = FastAPI()
agent = create_talent_demand_analyst()


class RunRequest(BaseModel):
    message: str
    thread_id: str | None = None


@app.post("/run")
async def run_agent(request: RunRequest):
    async def generate():
        async for event in agent.astream_events(
            {"messages": [{"role": "user", "content": request.message}]},
            version="v2",
        ):
            if event["event"] == "on_chat_model_stream":
                chunk = event["data"]["chunk"]
                if chunk.content:
                    yield f"data: {json.dumps({'type': 'content', 'content': chunk.content})}\n\n"
            elif event["event"] == "on_tool_start":
                yield f"data: {json.dumps({'type': 'tool_start', 'tool': event['name']})}\n\n"
            elif event["event"] == "on_tool_end":
                yield f"data: {json.dumps({'type': 'tool_end', 'tool': event['name']})}\n\n"
        yield "data: [DONE]\n\n"

    return StreamingResponse(generate(), media_type="text/event-stream")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
```

### Environment Variables

```env
# Required
ANTHROPIC_API_KEY=your_anthropic_api_key
TAVILY_API_KEY=your_tavily_api_key
EXA_API_KEY=your_exa_api_key

# Optional - for LangSmith tracing (recommended for debugging)
LANGCHAIN_TRACING_V2=true
LANGCHAIN_API_KEY=your_langsmith_api_key
LANGCHAIN_PROJECT=talent-demand-analyst
```

### Key Implementation Principles

1. **Parallel Execution**: deepagents handles parallel subagent execution automatically via the `task` tool
2. **Context Summarization**: Built-in at 170k tokens - no manual handling needed
3. **Prompt Caching**: Anthropic prompt caching enabled by default middleware
4. **Streaming**: Use `astream_events()` for real-time updates
5. **Error Handling**: Each subagent runs independently - failures don't cascade
6. **Rate Limiting**: Handled at the tool level with try/except

---

## API Integration

### Frontend Integration Pattern

```typescript
// Example Next.js API route structure

// POST /api/agents/talent-demand
export async function POST(request: NextRequest) {
  const { userMessage, threadId } = await request.json();

  // Create streaming response
  const stream = new TransformStream();
  const writer = stream.writable.getWriter();

  // Run analysis in background
  runTalentDemandAnalysis(userMessage, writer);

  return new Response(stream.readable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    }
  });
}
```

### Response Format

The agent should return responses in this structure:

```typescript
interface TalentDemandResponse {
  executiveSummary: string;        // 3-5 key findings
  majorTrends: TrendItem[];        // Directional insights with data
  emergingSignals: Signal[];       // New patterns or early indicators
  quantitativeHighlights: Metric[];// Specific numbers, percentages
  recommendations: string[];       // Actionable insights
  sources: Source[];               // Citations with URLs

  // Raw subagent outputs (for transparency)
  subagentResults: {
    jobPostingAnalyzer: SubagentResult;
    skillEmergenceResearcher: SubagentResult;
    industryReportSynthesizer: SubagentResult;
  }
}
```

---

## React Frontend Integration (deep-agents-ui Patterns)

The `deep-agents-ui` repository provides battle-tested patterns for building UIs that interact with deepagents backends. Below are the key patterns adapted for the Talent Demand Analyst.

### Core Dependencies

```json
{
  "dependencies": {
    "@langchain/langgraph-sdk": "^0.x.x",
    "nuqs": "^2.x.x",
    "use-stick-to-bottom": "^1.x.x",
    "uuid": "^9.x.x"
  }
}
```

### State Type Definition

```typescript
// types/agent.ts

export interface TodoItem {
  id: string;
  content: string;
  status: "pending" | "in_progress" | "completed";
}

export interface ToolCall {
  id: string;
  name: string;
  args: Record<string, unknown>;
  result?: string;
  status: "pending" | "completed" | "error" | "interrupted";
}

export interface AgentState {
  messages: Message[];
  todos: TodoItem[];
  files: Record<string, string>;
}

export interface SubAgentExecution {
  subagentName: string;
  status: "running" | "completed" | "error";
  input: string;
  output?: string;
}
```

### useChat Hook (Core Pattern)

```typescript
// hooks/useChat.ts
"use client";

import { useCallback } from "react";
import { useStream } from "@langchain/langgraph-sdk/react";
import { v4 as uuidv4 } from "uuid";
import { useQueryState } from "nuqs";
import type { Message } from "@langchain/langgraph-sdk";
import type { AgentState, TodoItem } from "@/types/agent";

interface UseChatOptions {
  assistantId: string;
  apiUrl: string;
}

export function useChat({ assistantId, apiUrl }: UseChatOptions) {
  const [threadId, setThreadId] = useQueryState("threadId");

  const stream = useStream<AgentState>({
    assistantId,
    apiUrl,
    reconnectOnMount: true,
    threadId: threadId ?? null,
    onThreadId: setThreadId,
    fetchStateHistory: true,  // Load full state when switching threads
  });

  // Send a new message
  const sendMessage = useCallback(
    (content: string) => {
      const newMessage: Message = { id: uuidv4(), type: "human", content };
      stream.submit(
        { messages: [newMessage] },
        {
          optimisticValues: (prev) => ({
            messages: [...(prev.messages ?? []), newMessage],
          }),
          config: { recursion_limit: 100 },
        }
      );
    },
    [stream]
  );

  // Resume from interrupt (for HITL approval)
  const resumeInterrupt = useCallback(
    (value: any) => {
      stream.submit(null, { command: { resume: value } });
    },
    [stream]
  );

  // Stop the current stream
  const stopStream = useCallback(() => {
    stream.stop();
  }, [stream]);

  return {
    // State
    messages: stream.messages,
    todos: (stream.values.todos ?? []) as TodoItem[],
    files: stream.values.files ?? {},
    isLoading: stream.isLoading,
    isThreadLoading: stream.isThreadLoading,
    interrupt: stream.interrupt,

    // Actions
    sendMessage,
    resumeInterrupt,
    stopStream,

    // Raw stream for advanced usage
    stream,
  };
}
```

### ChatProvider Context

```typescript
// providers/ChatProvider.tsx
"use client";

import { createContext, useContext, ReactNode } from "react";
import { useChat } from "@/hooks/useChat";

type ChatContextType = ReturnType<typeof useChat>;

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export function ChatProvider({
  children,
  assistantId,
  apiUrl,
}: {
  children: ReactNode;
  assistantId: string;
  apiUrl: string;
}) {
  const chat = useChat({ assistantId, apiUrl });
  return <ChatContext.Provider value={chat}>{children}</ChatContext.Provider>;
}

export function useChatContext() {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error("useChatContext must be used within ChatProvider");
  }
  return context;
}
```

### Message Processing (Extract Tool Calls)

```typescript
// utils/messageProcessing.ts

import type { Message } from "@langchain/langgraph-sdk";
import type { ToolCall } from "@/types/agent";

export function extractToolCalls(message: Message): ToolCall[] {
  const toolCalls: ToolCall[] = [];

  // Check additional_kwargs.tool_calls (OpenAI format)
  if (message.additional_kwargs?.tool_calls) {
    for (const tc of message.additional_kwargs.tool_calls) {
      toolCalls.push({
        id: tc.id,
        name: tc.function?.name || "unknown",
        args: tc.function?.arguments ? JSON.parse(tc.function.arguments) : {},
        status: "pending",
      });
    }
  }

  // Check message.tool_calls (LangChain format)
  if (message.tool_calls) {
    for (const tc of message.tool_calls) {
      if (tc.name) {
        toolCalls.push({
          id: tc.id || `tool-${Math.random()}`,
          name: tc.name,
          args: tc.args || {},
          status: "pending",
        });
      }
    }
  }

  // Check content blocks (Anthropic format)
  if (Array.isArray(message.content)) {
    for (const block of message.content) {
      if (block.type === "tool_use") {
        toolCalls.push({
          id: block.id,
          name: block.name,
          args: block.input || {},
          status: "pending",
        });
      }
    }
  }

  return toolCalls;
}

export function processMessages(
  messages: Message[],
  interrupt: any
): Array<{ message: Message; toolCalls: ToolCall[] }> {
  const messageMap = new Map<string, { message: Message; toolCalls: ToolCall[] }>();

  for (const message of messages) {
    if (message.type === "ai") {
      const toolCalls = extractToolCalls(message).map((tc) => ({
        ...tc,
        status: interrupt ? "interrupted" : ("pending" as const),
      }));
      messageMap.set(message.id!, { message, toolCalls });
    } else if (message.type === "tool") {
      // Match tool result to its tool call
      for (const [, data] of messageMap) {
        const tc = data.toolCalls.find((t) => t.id === message.tool_call_id);
        if (tc) {
          tc.status = "completed";
          tc.result = typeof message.content === "string"
            ? message.content
            : JSON.stringify(message.content);
          break;
        }
      }
    } else if (message.type === "human") {
      messageMap.set(message.id!, { message, toolCalls: [] });
    }
  }

  return Array.from(messageMap.values());
}
```

### TodoProgress Component

```tsx
// components/TodoProgress.tsx
"use client";

import { CheckCircle, Clock, Circle } from "lucide-react";
import type { TodoItem } from "@/types/agent";

interface TodoProgressProps {
  todos: TodoItem[];
}

export function TodoProgress({ todos }: TodoProgressProps) {
  const inProgress = todos.filter((t) => t.status === "in_progress");
  const pending = todos.filter((t) => t.status === "pending");
  const completed = todos.filter((t) => t.status === "completed");

  const activeTask = inProgress[0];
  const totalTasks = todos.length;
  const completedCount = completed.length;

  if (totalTasks === 0) return null;

  if (completedCount === totalTasks) {
    return (
      <div className="flex items-center gap-2 text-sm">
        <CheckCircle size={16} className="text-green-500" />
        <span>All {totalTasks} tasks completed</span>
      </div>
    );
  }

  if (activeTask) {
    return (
      <div className="flex items-center gap-3 text-sm">
        <Clock size={16} className="text-yellow-500 animate-pulse" />
        <span className="font-medium">
          Task {completedCount + 1} of {totalTasks}
        </span>
        <span className="text-muted-foreground truncate max-w-[300px]">
          {activeTask.content}
        </span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 text-sm">
      <Circle size={16} className="text-gray-400" />
      <span>{completedCount} of {totalTasks} tasks</span>
    </div>
  );
}
```

### ToolCallBox Component

```tsx
// components/ToolCallBox.tsx
"use client";

import { useState, useMemo } from "react";
import { ChevronDown, ChevronUp, Loader2, CheckCircle, AlertCircle, StopCircle } from "lucide-react";
import type { ToolCall } from "@/types/agent";

interface ToolCallBoxProps {
  toolCall: ToolCall;
}

export function ToolCallBox({ toolCall }: ToolCallBoxProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const statusIcon = useMemo(() => {
    switch (toolCall.status) {
      case "completed":
        return <CheckCircle size={14} className="text-green-500" />;
      case "error":
        return <AlertCircle size={14} className="text-red-500" />;
      case "pending":
        return <Loader2 size={14} className="animate-spin" />;
      case "interrupted":
        return <StopCircle size={14} className="text-orange-500" />;
    }
  }, [toolCall.status]);

  // Special handling for subagent calls
  const isSubagent = toolCall.name === "task";
  const subagentName = isSubagent ? toolCall.args.subagent_type as string : null;

  return (
    <div className="rounded-lg border bg-card overflow-hidden">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-3 hover:bg-accent"
      >
        <div className="flex items-center gap-2">
          {statusIcon}
          <span className="font-medium">
            {isSubagent ? `Subagent: ${subagentName}` : toolCall.name}
          </span>
        </div>
        {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
      </button>

      {isExpanded && (
        <div className="p-3 border-t bg-muted/30 space-y-3">
          {/* Arguments */}
          <div>
            <h4 className="text-xs font-semibold uppercase text-muted-foreground mb-1">
              {isSubagent ? "Task Description" : "Arguments"}
            </h4>
            <pre className="text-xs bg-muted p-2 rounded overflow-x-auto">
              {isSubagent
                ? toolCall.args.description
                : JSON.stringify(toolCall.args, null, 2)}
            </pre>
          </div>

          {/* Result */}
          {toolCall.result && (
            <div>
              <h4 className="text-xs font-semibold uppercase text-muted-foreground mb-1">
                Result
              </h4>
              <pre className="text-xs bg-muted p-2 rounded overflow-x-auto max-h-[300px]">
                {toolCall.result}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
```

### Main Chat Interface

```tsx
// components/ChatInterface.tsx
"use client";

import { useState, useMemo, FormEvent, useCallback, useRef } from "react";
import { ArrowUp, Square } from "lucide-react";
import { useStickToBottom } from "use-stick-to-bottom";
import { useChatContext } from "@/providers/ChatProvider";
import { processMessages } from "@/utils/messageProcessing";
import { TodoProgress } from "./TodoProgress";
import { ToolCallBox } from "./ToolCallBox";
import { MarkdownContent } from "./MarkdownContent";

export function ChatInterface() {
  const [input, setInput] = useState("");
  const { scrollRef, contentRef } = useStickToBottom();

  const {
    messages,
    todos,
    files,
    isLoading,
    isThreadLoading,
    interrupt,
    sendMessage,
    stopStream,
  } = useChatContext();

  const processedMessages = useMemo(
    () => processMessages(messages, interrupt),
    [messages, interrupt]
  );

  const handleSubmit = useCallback(
    (e?: FormEvent) => {
      e?.preventDefault();
      const text = input.trim();
      if (!text || isLoading) return;
      sendMessage(text);
      setInput("");
    },
    [input, isLoading, sendMessage]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSubmit();
      }
    },
    [handleSubmit]
  );

  return (
    <div className="flex flex-col h-full">
      {/* Messages Area */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto">
        <div ref={contentRef} className="max-w-3xl mx-auto p-4 space-y-4">
          {isThreadLoading ? (
            <div className="text-center text-muted-foreground p-8">
              Loading conversation...
            </div>
          ) : (
            processedMessages.map(({ message, toolCalls }) => (
              <div key={message.id} className="space-y-2">
                {/* Human message */}
                {message.type === "human" && (
                  <div className="flex justify-end">
                    <div className="bg-primary text-primary-foreground rounded-lg px-4 py-2 max-w-[80%]">
                      {message.content as string}
                    </div>
                  </div>
                )}

                {/* AI message */}
                {message.type === "ai" && (
                  <div className="space-y-2">
                    {/* Text content */}
                    {message.content && (
                      <div className="bg-card rounded-lg px-4 py-2">
                        <MarkdownContent content={message.content as string} />
                      </div>
                    )}

                    {/* Tool calls */}
                    {toolCalls.map((tc) => (
                      <ToolCallBox key={tc.id} toolCall={tc} />
                    ))}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Input Area */}
      <div className="border-t p-4">
        <div className="max-w-3xl mx-auto">
          {/* Todo Progress */}
          {todos.length > 0 && (
            <div className="mb-3 p-3 bg-muted rounded-lg">
              <TodoProgress todos={todos} />
            </div>
          )}

          {/* Input Form */}
          <form onSubmit={handleSubmit} className="flex gap-2">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={isLoading ? "Researching..." : "Ask about talent demand..."}
              className="flex-1 resize-none border rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary"
              rows={1}
              disabled={isLoading}
            />
            <button
              type={isLoading ? "button" : "submit"}
              onClick={isLoading ? stopStream : undefined}
              className={`px-4 py-2 rounded-lg font-medium ${
                isLoading
                  ? "bg-destructive text-destructive-foreground"
                  : "bg-primary text-primary-foreground"
              }`}
              disabled={!isLoading && !input.trim()}
            >
              {isLoading ? (
                <Square size={18} />
              ) : (
                <ArrowUp size={18} />
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
```

### Root Layout with Provider

```tsx
// app/page.tsx
import { ChatProvider } from "@/providers/ChatProvider";
import { ChatInterface } from "@/components/ChatInterface";

export default function TalentDemandAnalyst() {
  return (
    <ChatProvider
      assistantId="talent-demand-analyst"
      apiUrl={process.env.NEXT_PUBLIC_AGENT_API_URL || "http://localhost:8000"}
    >
      <main className="h-screen">
        <ChatInterface />
      </main>
    </ChatProvider>
  );
}
```

---

## Appendix A: deepagents Framework Reference

### Built-in Tools (Included Automatically)

| Tool | Description |
|------|-------------|
| `write_todos` | Create and manage structured task lists |
| `read_todos` | Read the current todo list state |
| `ls` | List files in a directory |
| `read_file` | Read content from a file |
| `write_file` | Create or overwrite a file |
| `edit_file` | Perform string replacements in files |
| `glob` | Find files matching a pattern |
| `grep` | Search for text patterns in files |
| `task` | Delegate tasks to subagents |

### Built-in Middleware (Applied Automatically)

| Middleware | Purpose |
|------------|---------|
| `TodoListMiddleware` | Task planning and progress tracking |
| `FilesystemMiddleware` | File operations and context offloading |
| `SubAgentMiddleware` | Delegate tasks to isolated sub-agents |
| `SummarizationMiddleware` | Auto-summarizes at 170k tokens |
| `AnthropicPromptCachingMiddleware` | Caches prompts to reduce costs |
| `PatchToolCallsMiddleware` | Fixes dangling tool calls from interruptions |

### Advanced Configuration Options

```python
from deepagents import create_deep_agent
from deepagents.backends import FilesystemBackend
from langgraph.checkpoint.memory import MemorySaver

# With persistence (for multi-turn conversations)
agent = create_deep_agent(
    model="anthropic:claude-sonnet-4-5-20250929",
    tools=[...],
    system_prompt=MAIN_AGENT_PROMPT,
    subagents=[...],
    checkpointer=MemorySaver(),  # Enable conversation persistence
)

# With filesystem backend (for real file operations)
agent = create_deep_agent(
    model="anthropic:claude-sonnet-4-5-20250929",
    tools=[...],
    backend=FilesystemBackend(root_dir="/path/to/workspace"),
)

# With human-in-the-loop for sensitive operations
agent = create_deep_agent(
    model="anthropic:claude-sonnet-4-5-20250929",
    tools=[...],
    interrupt_on={
        "write_file": {"allowed_decisions": ["approve", "edit", "reject"]},
    },
)
```

---

## Appendix B: Original LangSmith Configuration (Historical)

### Agent IDs (for reference only - not for use)

```
Agent Builder Agent ID: 50bd6c8e-2996-455b-83c1-3c815899a69b
Agent Builder API URL: https://prod-deepagents-agent-build-d4c1479ed8ce53fbb8c3eefc91f0aa7d.us.langgraph.app

GitHub Deployed Agent ID: fe096781-5601-53d2-b2f6-0d3403f7e9ca
GitHub Deployment URL: https://sbttalentdemandanalyst-b289aed6f80c5d64b7d3088a7a9830ff.us.langgraph.app
```

### Why We Migrated to deepagents

The LangSmith Agent Builder infrastructure showed ~40-60% failure rate on API calls after their GA release in January 2026. Even with 5 retries, requests could fail completely. Additionally, Agent Builder agents cannot be exported or deployed to stable infrastructure - they can only be accessed via LangSmith's flaky API.

By using `deepagents` (the open-source framework that powers Agent Builder internally), we:
- **Own the infrastructure completely** - run on our own servers
- **Eliminate third-party API flakiness** - no more 403 errors
- **Maintain the exact same architecture** - same middleware, same tools, same subagent pattern
- **Have full control** over retry logic, timeouts, error handling, and deployment
- **Get the same features** - planning, filesystem, subagents, summarization, prompt caching
- **Can deploy anywhere** - Docker, Kubernetes, serverless, etc.

---

## Appendix C: Project File Structure

```
tda-frontend/
├── app/
│   ├── api/
│   │   └── agents/
│   │       └── talent-demand/
│   │           └── route.ts        # Next.js API route
│   └── ...
├── backend/                         # NEW: Python backend
│   ├── __init__.py
│   ├── server.py                    # FastAPI server
│   └── talent_demand_analyst.py     # deepagents implementation
├── docs/
│   ├── TALENT_DEMAND_ANALYST_SPECIFICATION.md  # This file
│   ├── ADDITIONAL_CONTEXT_NEEDED.md
│   └── deepagents-reference/        # Cloned deepagents repo
└── ...
```

---

*Document generated: January 21, 2026*
*Source: LangSmith Agent Builder configuration export + deepagents framework documentation*
