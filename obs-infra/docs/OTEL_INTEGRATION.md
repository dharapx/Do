# OpenTelemetry Integration Guide

## How it works

The application (backend + frontend) sends OTel telemetry to the OTel Collector,
which fans out to Prometheus (metrics), Loki (logs), and Tempo (traces).

## Backend (FastAPI + Python)

Uses `opentelemetry-distro` for auto-instrumentation.

### Packages (already in requirements.lock):
- opentelemetry-distro
- opentelemetry-exporter-otlp-proto-grpc
- opentelemetry-instrumentation-fastapi
- opentelemetry-instrumentation-sqlalchemy
- opentelemetry-instrumentation-httpx
- opentelemetry-instrumentation-logging

### Entrypoint changes (entrypoint.sh):
```bash
opentelemetry-bootstrap -a install
OTEL_SERVICE_NAME=task-tracker-backend \
OTEL_EXPORTER_OTLP_ENDPOINT=http://otel-collector:4317 \
OTEL_TRACES_EXPORTER=otlp \
OTEL_METRICS_EXPORTER=otlp \
OTEL_LOGS_EXPORTER=otlp \
opentelemetry-instrument \
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

### Environment variables (docker-compose.yml):
```yaml
environment:
  - OTEL_SERVICE_NAME=task-tracker-backend
  - OTEL_EXPORTER_OTLP_ENDPOINT=http://otel-collector:4317
  - OTEL_TRACES_EXPORTER=otlp
  - OTEL_METRICS_EXPORTER=otlp
  - OTEL_LOGS_EXPORTER=otlp
```

## Frontend (Next.js)

### Install package:
```bash
npm install @opentelemetry/api @opentelemetry/auto-instrumentations-node @opentelemetry/exporter-trace-otlp-proto
```

### Create `frontend/instrumentation.ts`:
```typescript
export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { NodeSDK } = await import('@opentelemetry/sdk-node');
    const { getNodeAutoInstrumentations } = await import(
      '@opentelemetry/auto-instrumentations-node'
    );
    const { OTLPTraceExporter } = await import(
      '@opentelemetry/exporter-trace-otlp-proto'
    );

    const sdk = new NodeSDK({
      traceExporter: new OTLPTraceExporter({
        url: `${process.env.OTEL_EXPORTER_OTLP_ENDPOINT || 'http://otel-collector:4318'}/v1/traces',
      }),
      instrumentations: [getNodeAutoInstrumentations()],
    });

    sdk.start();
  }
}
```

### Environment variables (docker-compose.yml):
```yaml
environment:
  - OTEL_SERVICE_NAME=task-tracker-frontend
  - OTEL_EXPORTER_OTLP_ENDPOINT=http://otel-collector:4318
  - OTEL_TRACES_EXPORTER=otlp
  - OTEL_METRICS_EXPORTER=otlp
  - OTEL_LOGS_EXPORTER=otlp
  - NEXT_OTEL_VERBOSE=1
```

## Verifying OTel is working

1. Check OTel Collector logs: `docker compose logs otel-collector | grep "Everything is good"`
2. Check Prometheus targets: `http://localhost:9090/targets` (should see otel-collector as UP)
3. Query in Prometheus: `rate(http_server_duration_ms_count[5m])`
4. View traces in Grafana Tempo datasource
5. View logs in Grafana Loki datasource
