# Observability Platform Architecture

## Overview

On-prem observability stack for the task-tracker application.
Resource budget: <=3 CPU, <=8 GB RAM, <=300 GB storage.

## Services

| Service | Role | CPU | RAM | Storage |
|---------|------|-----|-----|---------|
| Prometheus | Metrics storage & alerting | 0.5 | 2 GB | 100 GB |
| Loki | Log aggregation | 0.5 | 1.5 GB | 100 GB |
| Tempo | Distributed tracing | 0.5 | 1.5 GB | 50 GB |
| OTel Collector | OpenTelemetry pipeline | 0.5 | 1 GB | 5 GB |
| Grafana | Visualization & alerting | 0.3 | 512 MB | 5 GB |
| Node Exporter | Host metrics | 0.1 | 128 MB | - |
| cAdvisor | Container metrics | 0.1 | 128 MB | - |
| Blackbox Exporter | External probing | 0.1 | 128 MB | - |
| Trivy | Vulnerability scanning | 0.2 | 256 MB | 10 GB |
| **Total** | | **~2.8** | **~6.8 GB** | **~270 GB** |

## Data Flow

```
App (OTel SDK) --> OTel Collector --> Prometheus (metrics)
                                  --> Loki (logs)
                                  --> Tempo (traces)
                                       |
                                       v
                                  Grafana (dashboards + alerts)
```

## Access

- Grafana: `https://do.dharapx.work/grafana/`
  - Path-based routing via Traefik
  - Sub-path configured via `GF_SERVER_SERVE_FROM_SUB_PATH=true`
  - Default credentials: admin / `${GRAFANA_ADMIN_PASSWORD}`

## Network Topology

All services are on `obs-net` (external bridge network).
The app's `docker-compose.yml` connects to `obs-net` so the OTel Collector can receive telemetry.

## First-Time Setup

```bash
# 1. Create external network and volumes (one-time)
docker network create obs-net
docker volume create prometheus-data
docker volume create loki-data
docker volume create tempo-data
docker volume create grafana-data
docker volume create trivy-cache

# 2. Set required env vars
export GRAFANA_ADMIN_PASSWORD=<your-password>

# 3. Deploy all services
cd obs-infra && docker compose up -d

# 4. Check health
docker compose ps
```

## Alert Channels

- Grafana alerting: email (SMTP not configured), webhook (Slack/Discord)
- Default: silence (logs only). Configure desired receivers in Grafana UI.
