# Observability Stack Configuration

> **Document Status:** Active
> **Version:** 1.0
> **Last Updated:** 2025-01-21
> **Purpose:** Complete monitoring, tracing, and alerting configuration

---

## 1. Overview

This document specifies the observability stack for the Talent Demand Analyst system:

| Layer | Tool | Purpose |
|-------|------|---------|
| **LLM Tracing** | LangSmith | Agent traces, prompt debugging |
| **Metrics** | Prometheus | Time-series metrics collection |
| **Visualization** | Grafana | Dashboards and visualization |
| **Alerting** | Grafana Alerting | Alert rules and routing |
| **Logs** | Railway/Vercel native | Log aggregation |

---

## 2. LangSmith Configuration

### 2.1 Environment Variables

```bash
# Required for LangSmith integration
LANGSMITH_API_KEY=ls-...
LANGSMITH_PROJECT=talent-demand-analyst
LANGSMITH_TRACING_V2=true

# Optional: Custom endpoint for self-hosted
# LANGSMITH_ENDPOINT=https://api.smith.langchain.com
```

### 2.2 Python Integration

```python
# app/observability/tracing.py
import os
from langsmith import Client
from langsmith.run_helpers import traceable

# Initialize client
client = Client(
    api_key=os.getenv("LANGSMITH_API_KEY"),
    project_name=os.getenv("LANGSMITH_PROJECT", "talent-demand-analyst")
)

def configure_tracing():
    """Configure LangSmith tracing for the application."""
    if not os.getenv("LANGSMITH_API_KEY"):
        print("Warning: LANGSMITH_API_KEY not set, tracing disabled")
        return False

    os.environ["LANGSMITH_TRACING_V2"] = "true"
    return True

@traceable(name="coordinator_run")
async def traced_coordinator_run(query: str, **kwargs):
    """Wrapper for tracing coordinator runs."""
    # This decorator automatically creates spans in LangSmith
    pass
```

### 2.3 Trace Structure

```
talent-demand-analyst/
├── coordinator_run (parent)
│   ├── job_analyzer_run
│   │   ├── tavily_search
│   │   └── exa_search
│   ├── skill_researcher_run
│   │   └── exa_search
│   ├── report_synthesizer_run
│   │   ├── tavily_search
│   │   └── exa_linkedin_search
│   └── synthesis_phase
```

### 2.4 Custom Metadata

```python
from langsmith import RunTree

async def run_analysis(query: str, request_id: str):
    """Run analysis with custom metadata."""
    run_tree = RunTree(
        name="analysis",
        run_type="chain",
        inputs={"query": query},
        extra={
            "metadata": {
                "request_id": request_id,
                "environment": os.getenv("ENVIRONMENT", "development"),
                "version": "1.0.0"
            }
        }
    )
    # ... execute analysis
```

---

## 3. Prometheus Metrics

### 3.1 Metrics Definitions

```python
# app/observability/metrics.py
from prometheus_client import Counter, Histogram, Gauge, Info

# Application info
APP_INFO = Info('tda_app', 'Application information')
APP_INFO.info({
    'version': '1.0.0',
    'environment': os.getenv('ENVIRONMENT', 'development')
})

# Request metrics
REQUEST_COUNT = Counter(
    'tda_requests_total',
    'Total number of requests',
    ['method', 'endpoint', 'status']
)

REQUEST_LATENCY = Histogram(
    'tda_request_duration_seconds',
    'Request duration in seconds',
    ['method', 'endpoint'],
    buckets=[0.1, 0.5, 1.0, 2.0, 5.0, 10.0, 30.0, 60.0, 120.0, 180.0]
)

# Agent metrics
AGENT_RUNS = Counter(
    'tda_agent_runs_total',
    'Total agent runs',
    ['agent', 'status']  # status: success, failure, partial
)

AGENT_DURATION = Histogram(
    'tda_agent_duration_seconds',
    'Agent execution duration',
    ['agent'],
    buckets=[1.0, 2.0, 5.0, 10.0, 20.0, 30.0, 60.0]
)

# Token metrics
TOKEN_USAGE = Counter(
    'tda_token_usage_total',
    'Total tokens used',
    ['agent', 'type']  # type: input, output
)

ANALYSIS_COST = Histogram(
    'tda_analysis_cost_dollars',
    'Cost per analysis in dollars',
    buckets=[0.05, 0.1, 0.15, 0.2, 0.25, 0.3, 0.4, 0.5, 0.75, 1.0]
)

# External API metrics
EXTERNAL_API_REQUESTS = Counter(
    'tda_external_api_requests_total',
    'External API requests',
    ['api', 'status']  # api: anthropic, tavily, exa
)

EXTERNAL_API_LATENCY = Histogram(
    'tda_external_api_latency_seconds',
    'External API latency',
    ['api'],
    buckets=[0.1, 0.25, 0.5, 1.0, 2.0, 5.0, 10.0]
)

# Circuit breaker state
CIRCUIT_BREAKER_STATE = Gauge(
    'tda_circuit_breaker_state',
    'Circuit breaker state (0=closed, 1=open, 2=half-open)',
    ['service']
)

# Active connections
ACTIVE_CONNECTIONS = Gauge(
    'tda_active_connections',
    'Number of active SSE connections'
)

# Error rate
ERROR_RATE = Gauge(
    'tda_error_rate_percent',
    'Rolling error rate percentage'
)
```

### 3.2 FastAPI Integration

```python
# app/main.py
from prometheus_client import make_asgi_app, CONTENT_TYPE_LATEST
from starlette.middleware.base import BaseHTTPMiddleware
import time

class MetricsMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request, call_next):
        start_time = time.time()

        response = await call_next(request)

        duration = time.time() - start_time
        REQUEST_COUNT.labels(
            method=request.method,
            endpoint=request.url.path,
            status=response.status_code
        ).inc()

        REQUEST_LATENCY.labels(
            method=request.method,
            endpoint=request.url.path
        ).observe(duration)

        return response

# Mount metrics endpoint
app.add_middleware(MetricsMiddleware)
metrics_app = make_asgi_app()
app.mount("/metrics", metrics_app)
```

### 3.3 Prometheus Scrape Config

```yaml
# prometheus/prometheus.yml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

scrape_configs:
  - job_name: 'tda-backend'
    static_configs:
      - targets: ['tda-api.railway.app:443']
    scheme: https
    metrics_path: /metrics
    scrape_interval: 30s

  - job_name: 'tda-backend-staging'
    static_configs:
      - targets: ['tda-api-staging.railway.app:443']
    scheme: https
    metrics_path: /metrics
```

---

## 4. Grafana Dashboards

### 4.1 Main Dashboard JSON

```json
{
  "dashboard": {
    "title": "Talent Demand Analyst",
    "uid": "tda-main",
    "timezone": "browser",
    "panels": [
      {
        "title": "Request Rate",
        "type": "stat",
        "gridPos": {"h": 4, "w": 6, "x": 0, "y": 0},
        "targets": [{
          "expr": "sum(rate(tda_requests_total[5m]))",
          "legendFormat": "req/s"
        }]
      },
      {
        "title": "Error Rate",
        "type": "gauge",
        "gridPos": {"h": 4, "w": 6, "x": 6, "y": 0},
        "targets": [{
          "expr": "sum(rate(tda_requests_total{status=~\"5..\"}[5m])) / sum(rate(tda_requests_total[5m])) * 100",
          "legendFormat": "error %"
        }],
        "fieldConfig": {
          "defaults": {
            "thresholds": {
              "steps": [
                {"color": "green", "value": 0},
                {"color": "yellow", "value": 1},
                {"color": "red", "value": 5}
              ]
            },
            "max": 10
          }
        }
      },
      {
        "title": "P95 Latency",
        "type": "stat",
        "gridPos": {"h": 4, "w": 6, "x": 12, "y": 0},
        "targets": [{
          "expr": "histogram_quantile(0.95, sum(rate(tda_request_duration_seconds_bucket{endpoint=\"/api/chat\"}[5m])) by (le))",
          "legendFormat": "p95"
        }],
        "fieldConfig": {
          "defaults": {
            "unit": "s",
            "thresholds": {
              "steps": [
                {"color": "green", "value": 0},
                {"color": "yellow", "value": 60},
                {"color": "red", "value": 120}
              ]
            }
          }
        }
      },
      {
        "title": "Daily Cost",
        "type": "stat",
        "gridPos": {"h": 4, "w": 6, "x": 18, "y": 0},
        "targets": [{
          "expr": "sum(increase(tda_analysis_cost_dollars_sum[24h]))",
          "legendFormat": "cost"
        }],
        "fieldConfig": {
          "defaults": {
            "unit": "currencyUSD"
          }
        }
      },
      {
        "title": "Agent Success Rate",
        "type": "timeseries",
        "gridPos": {"h": 8, "w": 12, "x": 0, "y": 4},
        "targets": [{
          "expr": "sum(rate(tda_agent_runs_total{status=\"success\"}[5m])) by (agent) / sum(rate(tda_agent_runs_total[5m])) by (agent) * 100",
          "legendFormat": "{{agent}}"
        }]
      },
      {
        "title": "External API Latency",
        "type": "timeseries",
        "gridPos": {"h": 8, "w": 12, "x": 12, "y": 4},
        "targets": [{
          "expr": "histogram_quantile(0.95, sum(rate(tda_external_api_latency_seconds_bucket[5m])) by (api, le))",
          "legendFormat": "{{api}} p95"
        }]
      },
      {
        "title": "Token Usage by Agent",
        "type": "piechart",
        "gridPos": {"h": 8, "w": 8, "x": 0, "y": 12},
        "targets": [{
          "expr": "sum(increase(tda_token_usage_total[24h])) by (agent)",
          "legendFormat": "{{agent}}"
        }]
      },
      {
        "title": "Circuit Breaker Status",
        "type": "stat",
        "gridPos": {"h": 4, "w": 8, "x": 8, "y": 12},
        "targets": [{
          "expr": "tda_circuit_breaker_state",
          "legendFormat": "{{service}}"
        }],
        "fieldConfig": {
          "defaults": {
            "mappings": [
              {"type": "value", "options": {"0": {"text": "CLOSED", "color": "green"}}},
              {"type": "value", "options": {"1": {"text": "OPEN", "color": "red"}}},
              {"type": "value", "options": {"2": {"text": "HALF-OPEN", "color": "yellow"}}}
            ]
          }
        }
      }
    ],
    "refresh": "30s"
  }
}
```

---

## 5. Alert Rules

### 5.1 Grafana Alert Rules

```yaml
# grafana/provisioning/alerting/alerts.yml
apiVersion: 1
groups:
  - name: TDA Alerts
    folder: TDA
    interval: 1m
    rules:
      # High error rate
      - uid: tda-high-error-rate
        title: High Error Rate
        condition: C
        data:
          - refId: A
            relativeTimeRange:
              from: 300
              to: 0
            model:
              expr: sum(rate(tda_requests_total{status=~"5.."}[5m])) / sum(rate(tda_requests_total[5m])) * 100
          - refId: C
            relativeTimeRange:
              from: 300
              to: 0
            model:
              type: threshold
              expression: A
              conditions:
                - evaluator:
                    type: gt
                    params: [5]
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "Error rate is {{ $value }}%"
          runbook_url: "https://github.com/org/tda/docs/runbooks/incident-response/high-error-rate.md"

      # High latency
      - uid: tda-high-latency
        title: High P95 Latency
        condition: C
        data:
          - refId: A
            model:
              expr: histogram_quantile(0.95, sum(rate(tda_request_duration_seconds_bucket{endpoint="/api/chat"}[5m])) by (le))
          - refId: C
            model:
              type: threshold
              expression: A
              conditions:
                - evaluator:
                    type: gt
                    params: [90]
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "P95 latency is {{ $value }}s"

      # External API down
      - uid: tda-api-down
        title: External API Failures
        condition: C
        data:
          - refId: A
            model:
              expr: sum(rate(tda_external_api_requests_total{status="error"}[5m])) by (api) / sum(rate(tda_external_api_requests_total[5m])) by (api) * 100
          - refId: C
            model:
              type: threshold
              expression: A
              conditions:
                - evaluator:
                    type: gt
                    params: [50]
        for: 2m
        labels:
          severity: critical
        annotations:
          summary: "{{ $labels.api }} API error rate is {{ $value }}%"
          runbook_url: "https://github.com/org/tda/docs/runbooks/incident-response/external-api-failure.md"

      # Circuit breaker open
      - uid: tda-circuit-open
        title: Circuit Breaker Open
        condition: C
        data:
          - refId: A
            model:
              expr: tda_circuit_breaker_state
          - refId: C
            model:
              type: threshold
              expression: A
              conditions:
                - evaluator:
                    type: gt
                    params: [0]
        for: 0m
        labels:
          severity: warning
        annotations:
          summary: "Circuit breaker for {{ $labels.service }} is OPEN"

      # High token cost
      - uid: tda-high-cost
        title: High Daily Cost
        condition: C
        data:
          - refId: A
            model:
              expr: sum(increase(tda_analysis_cost_dollars_sum[24h]))
          - refId: C
            model:
              type: threshold
              expression: A
              conditions:
                - evaluator:
                    type: gt
                    params: [100]
        for: 0m
        labels:
          severity: warning
        annotations:
          summary: "Daily API cost is ${{ $value }}"
```

### 5.2 Notification Channels

```yaml
# grafana/provisioning/alerting/contactpoints.yml
apiVersion: 1
contactPoints:
  - name: slack-alerts
    receivers:
      - uid: slack-critical
        type: slack
        settings:
          url: "${SLACK_WEBHOOK_URL}"
          channel: "#tda-alerts"
          title: "{{ .CommonLabels.alertname }}"
          text: "{{ .CommonAnnotations.summary }}"

  - name: pagerduty
    receivers:
      - uid: pagerduty-critical
        type: pagerduty
        settings:
          integrationKey: "${PAGERDUTY_KEY}"
          severity: "{{ if eq .CommonLabels.severity \"critical\" }}critical{{ else }}warning{{ end }}"

policies:
  - receiver: slack-alerts
    group_by: ['alertname']
    matchers:
      - severity =~ "warning|critical"

  - receiver: pagerduty
    matchers:
      - severity = "critical"
```

---

## 6. Log Aggregation

### 6.1 Structured Logging

```python
# app/observability/logging.py
import logging
import json
import sys
from datetime import datetime

class JSONFormatter(logging.Formatter):
    def format(self, record):
        log_data = {
            "timestamp": datetime.utcnow().isoformat(),
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
            "module": record.module,
            "function": record.funcName,
            "line": record.lineno,
        }

        # Add extra fields
        if hasattr(record, 'request_id'):
            log_data['request_id'] = record.request_id
        if hasattr(record, 'agent'):
            log_data['agent'] = record.agent
        if hasattr(record, 'duration_ms'):
            log_data['duration_ms'] = record.duration_ms

        # Add exception info
        if record.exc_info:
            log_data['exception'] = self.formatException(record.exc_info)

        return json.dumps(log_data)

def configure_logging():
    """Configure structured JSON logging."""
    handler = logging.StreamHandler(sys.stdout)
    handler.setFormatter(JSONFormatter())

    root_logger = logging.getLogger()
    root_logger.setLevel(logging.INFO)
    root_logger.addHandler(handler)

    # Reduce noise from libraries
    logging.getLogger("httpx").setLevel(logging.WARNING)
    logging.getLogger("anthropic").setLevel(logging.WARNING)
```

### 6.2 Log Examples

```json
{"timestamp": "2025-01-21T10:30:00.000Z", "level": "INFO", "logger": "app.api.chat", "message": "Analysis started", "request_id": "req-abc123", "module": "chat", "function": "chat_endpoint", "line": 45}

{"timestamp": "2025-01-21T10:30:35.000Z", "level": "INFO", "logger": "app.agents.coordinator", "message": "Analysis completed", "request_id": "req-abc123", "agent": "coordinator", "duration_ms": 35000, "tokens": 24500}

{"timestamp": "2025-01-21T10:30:05.000Z", "level": "WARNING", "logger": "app.tools.tavily", "message": "Tavily rate limited, retrying", "request_id": "req-abc123", "retry_count": 1}

{"timestamp": "2025-01-21T10:30:10.000Z", "level": "ERROR", "logger": "app.agents.job_analyzer", "message": "Job analyzer failed", "request_id": "req-abc123", "agent": "job_analyzer", "exception": "TavilyError: 503 Service Unavailable"}
```

---

## 7. Quick Setup Commands

```bash
# Local development with metrics
docker run -d -p 9090:9090 -v $(pwd)/prometheus:/etc/prometheus prom/prometheus

# View metrics locally
curl http://localhost:8000/metrics

# LangSmith local setup
export LANGSMITH_API_KEY=ls-...
export LANGSMITH_PROJECT=talent-demand-analyst-dev
export LANGSMITH_TRACING_V2=true
```

---

*Observability Stack Configuration - Part of deployment infrastructure layer*
