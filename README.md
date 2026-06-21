# Do — Task & Notes Dashboard

A modern, production-ready task management application with goal/task hierarchy, time tracking, notes, charts, and dashboards. Built with FastAPI, Next.js, and PostgreSQL.

## Features

- **Two-Level Hierarchy** — Goals (parent tasks) with nested child tasks; goals auto-compute aggregate progress from children
- **Reference Links** — Non-hierarchical "see also" connections between any tasks
- **Task Management** — Create, update, delete tasks with title, description (rich text via TipTap), priority, tags, and type (task/goal); progress slider with local state for smooth drag-and-drop
- **Advanced Filtering** — Multi-select status/priority dropdowns, filter by tags, date range, keyword; full-text search across titles, descriptions, and comments; search flattens child tasks into standalone results
- **Rich Text Editing** — TipTap-based rich text editor with full toolbar (bold, italic, underline, headings, lists, tables, code blocks, links, images, text alignment, highlight, undo/redo) for task descriptions and comments; formatted HTML rendering via `FormattedContent` with explicit Tailwind utility classes
- **Markdown Notes** — Note editor with toggle between Rich Text and Markdown modes; view mode auto-detects HTML vs markdown and renders with `react-markdown` + `remark-gfm`
- **Time Tracking** — Start/stop timers, add manual entries with inline edit/delete, max 1440 min per entry validated on both ends, view accumulated time per task, timeline chart on dashboard
- **Activity History** — Immutable audit trail of all changes (status, priority, tags, description, time, comments, attachments)
- **File Attachments** — Upload and download files attached to tasks (max 10 MB), with delete support; shown in main content area below the Details section
- **Delete from Detail** — Red delete option in a dropdown menu with confirmation dialog in task detail header
- **Smart Tag Autocomplete** — Type `#` in the tags input to see autocomplete suggestions from existing tags, scoped to the current user's tasks
- **Notes** — Rich text note editor with toggleable Markdown mode, auto-detected rendering
- **Dashboard** — Charts (priority breakdown, status distribution), stats cards (urgent, high priority, progress), time timeline, recent activity, quick actions
- **Authentication** — httpOnly cookie-based sessions with JWT access tokens (15 min), refresh token rotation (7 days, SHA256 hashed), and `Authorization: Bearer` fallback with URL hash fragment tokens for cross-origin dev (frontend :3001, backend :8000)
- **OAuth SSO** — Sign in with GitHub or Google; auto-links by email; configurable toggle via env vars; self-hosted callback URL derived from `OAUTH_REDIRECT_BASE`
- **Password Management** — In-app password reset code shown on screen (no SMTP required), set-password for OAuth users; password policy: ≥8 chars, uppercase, lowercase, digit with visual checklist
- **Dark Mode** — System-aware theming with warm light (brown/beige) and dark (charcoal) palettes, glass morphism cards (semi-transparent bg, backdrop blur, no shadows)
- **Responsive** — Works on desktop and mobile devices
- **Observability** — Backend auto-instrumented with OpenTelemetry (traces, logs, metrics); Prometheus for metrics, Loki for log aggregation with trace correlation, Tempo for distributed tracing, all visualized in Grafana with auto-provisioned dashboards (app metrics, node exporter, cAdvisor, blackbox exporter) and alert rules

## Tech Stack

**Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS, shadcn/ui + Radix UI + cmdk, React Query (TanStack), Zustand, date-fns, Recharts, Lucide icons, TipTap (ProseMirror), react-markdown, remark-gfm, marked, lowlight

**Backend**: FastAPI, SQLAlchemy 2.0, Alembic, Pydantic v2, JWT + refresh tokens, Authlib OAuth, bcrypt, OpenTelemetry auto-instrumentation

**Database**: PostgreSQL 15 (via PgBouncer connection pooler)

**Cache**: Redis 7 Alpine

**Observability**: OpenTelemetry Collector, Prometheus, Loki, Tempo, Grafana, Node Exporter, cAdvisor, Blackbox Exporter

**Deployment**: Docker, Docker Compose, Dokploy (Traefik path-based routing on single domain), Cloudflare DNS proxy

## Getting Started

### Prerequisites

- Docker and Docker Compose installed
- Node.js 20+ (for local frontend development)
- Python 3.12+ (for local backend development)

### Quick Start (Docker)

The compose file is configured for **production deployment** (Dokploy) — services use `expose:` instead of `ports:` and are routed through Traefik. For local development, you can either:

- Uncomment/replace `expose:` with `ports:` in `docker-compose.yml` for the services you need
- Or use the individual dev commands below

**Dokploy deployment:**
```bash
# docker-compose.yml uses ${VARIABLE_NAME} env vars — set them in Dokploy's
# Environment tab before deploying (SECRET_KEY, OAuth credentials, etc.)
#
# obs-infra/ is deployed as a separate stack in Dokploy (Prometheus, Loki, Tempo,
# Grafana, OTel Collector, Node Exporter, cAdvisor, Blackbox Exporter).
# Grafana is accessible at https://grafana.dharapx.work via Cloudflare proxy.
```

### Local Development

#### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
alembic upgrade head
uvicorn app.main:app --reload --port 8000
```

#### Frontend

```bash
cd frontend
npm install
npm run dev
```

## Architecture

See [`docs/architecture.md`](docs/architecture.md) for full system architecture diagrams, database schema, index strategy, and key decisions.

## Project Structure

```
├── backend/
│   ├── alembic/              # Database migrations (11 migration files)
│   ├── app/
│   │   ├── api/v1/           # Route handlers (tasks, auth, comments, notes, time, history, search, attachments, tags)
│   │   ├── crud/             # Business logic layer (CRUDAuth, CRUDAttachment, ...)
│   │   ├── models/           # SQLAlchemy models (User, Task, RefreshToken, PasswordReset, ...)
│   │   ├── schemas/          # Pydantic v2 schemas
│   │   ├── core/             # Auth utilities (JWT, bcrypt, refresh tokens, OAuth registry)
│   │   ├── cache.py          # Redis-backed dashboard cache (TTL 30s)
│   │   ├── config.py         # Application settings (env vars, OAuth flags)
│   │   ├── database.py       # Database connection (pool_size=10, overflow=20)
│   │   ├── entrypoint.sh     # OTel-instrumented uvicorn launcher
│   │   └── main.py           # FastAPI app + CORS + SessionMiddleware + ZJSONResponse + OTel log fix
│   ├── secrets/              # Local secrets template (gitignored *.txt, committed *.txt.example)
│   ├── Dockerfile
│   └── requirements.txt
├── frontend/
│   ├── app/                  # Next.js App Router pages (dashboard, tasks, notes, login, etc.)
│   ├── components/
│   │   ├── ui/               # shadcn/ui primitives + RichTextEditor, EditorToolbar, PasswordComplexity
│   │   ├── dashboard/        # Dashboard widgets (charts, stats cards, timeline)
│   │   ├── tasks/            # Task components (list, card, form, detail)
│   │   ├── notes/            # Note editor with toolbar (re-exports from ui/)
│   │   ├── layout/           # Sidebar, Header
│   │   └── theme/            # Theme provider
│   ├── lib/
│   │   ├── api/              # API client + endpoint functions (get/post/patch/put/delete)
│   │   ├── hooks/            # React Query hooks
│   │   └── store/            # Zustand state stores (auth, filters, search)
│   ├── Dockerfile
│   └── package.json
├── database/
│   └── init.sql
├── docs/
│   ├── api.md                # API endpoint reference
│   ├── architecture.md       # System architecture, key decisions, diagrams
│   └── infra-plan.md         # Production deployment plan (Dokploy)
├── obs-infra/                # On-prem observability stack
│   ├── docker-compose.yml    # Top-level orchestration (extends per-service compose files)
│   ├── .env.example
│   ├── prometheus/           # Config, rules, compose
│   ├── grafana/
│   │   ├── provisioning/     # Datasources, dashboards (auto-provisioned), alerting
│   │   └── dashboards/       # App Metrics, Node Exporter, cAdvisor, Blackbox Exporter
│   ├── loki/                 # Config + compose
│   ├── tempo/                # Config + compose
│   └── otel-collector/       # OTel config (traces→Tempo, metrics→Prometheus, logs→Loki)
├── docker-compose.yml
├── .env.example
└── README.md
```

## API Overview

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/auth/signup` | Create account |
| POST | `/api/v1/auth/login` | Login (sets httpOnly cookies) |
| GET | `/api/v1/auth/me` | Get current user profile |
| POST | `/api/v1/auth/refresh` | Rotate tokens |
| POST | `/api/v1/auth/logout` | Revoke all refresh tokens |
| GET | `/api/v1/auth/config` | Get enabled OAuth providers |
| GET | `/api/v1/auth/oauth/{provider}` | Get OAuth authorization URL |
| POST | `/api/v1/auth/forgot-password` | Request password reset code |
| POST | `/api/v1/auth/reset-password` | Redeem reset code |
| POST | `/api/v1/auth/set-password` | Set password for OAuth user |
| GET | `/api/v1/tasks` | List tasks (filter, sort, paginate) |
| POST | `/api/v1/tasks` | Create a task (or goal) |
| GET | `/api/v1/tasks/{id}` | Get task details |
| PATCH | `/api/v1/tasks/{id}` | Update task |
| DELETE | `/api/v1/tasks/{id}` | Delete task |
| POST | `/api/v1/tasks/{goal_id}/children` | Bulk set children of a goal |
| PUT | `/api/v1/tasks/{task_id}/parent` | Set/clear parent goal for a task |
| GET | `/api/v1/tasks/dashboard/stats` | Dashboard statistics |
| GET | `/api/v1/tasks/dashboard/time-timeline` | Time tracking timeline |
| GET | `/api/v1/tasks/{id}/comments` | List comments |
| POST | `/api/v1/tasks/{id}/comments` | Add comment (rich text HTML) |
| PATCH | `/api/v1/tasks/{id}/comments/{cid}` | Edit comment |
| DELETE | `/api/v1/tasks/{id}/comments/{cid}` | Delete comment |
| GET | `/api/v1/tasks/{id}/time` | List time entries |
| POST | `/api/v1/tasks/{id}/time` | Add manual time entry (max 1440 min) |
| PUT | `/api/v1/tasks/{id}/time/{eid}` | Update time entry |
| DELETE | `/api/v1/tasks/{id}/time/{eid}` | Delete time entry |
| POST | `/api/v1/tasks/{id}/time/start` | Start timer |
| POST | `/api/v1/tasks/{id}/time/stop` | Stop timer |
| GET | `/api/v1/tasks/{id}/time/total` | Get total time |
| POST | `/api/v1/tasks/{id}/attachments` | Upload file attachment (max 10 MB) |
| GET | `/api/v1/tasks/{id}/attachments` | List attachments |
| GET | `/api/v1/tasks/{id}/attachments/{att_id}` | Download attachment |
| DELETE | `/api/v1/tasks/{id}/attachments/{att_id}` | Delete attachment |
| GET | `/api/v1/tags/suggestions` | Tag autocomplete suggestions |
| GET | `/api/v1/tasks/{id}/history` | Get task history |
| GET | `/api/v1/notes` | List notes |
| POST | `/api/v1/notes` | Create note |
| GET | `/api/v1/notes/{id}` | Get note |
| PUT | `/api/v1/notes/{id}` | Update note |
| DELETE | `/api/v1/notes/{id}` | Delete note |
| GET | `/api/v1/search` | Full-text search |
| GET | `/api/v1/health` | Health check |

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string (via PgBouncer) | `postgresql+psycopg://todos_user:todos_pass@pgbouncer:5432/todos_app` |
| `SECRET_KEY` | JWT signing key (set via env var in Dokploy) | `dev-secret-key` |
| `REDIS_URL` | Redis connection string | `redis://redis:6379/0` |
| `CORS_ORIGINS` | Comma-separated allowed origins | `https://do.dharapx.work` |
| `FRONTEND_URL` | Frontend URL for OAuth redirects | `https://do.dharapx.work` |
| `OAUTH_REDIRECT_BASE` | Backend base URL for OAuth callbacks | `https://do.dharapx.work` |
| `GITHUB_CLIENT_ID` | GitHub OAuth App client ID | _(set via env var)_ |
| `GITHUB_CLIENT_SECRET` | GitHub OAuth App client secret | _(set via env var)_ |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID | _(set via env var)_ |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret | _(set via env var)_ |
| `ENABLE_GITHUB_OAUTH` | Force enable/disable GitHub OAuth | `true` (auto-detect if unset) |
| `ENABLE_GOOGLE_OAUTH` | Force enable/disable Google OAuth | `true` (auto-detect if unset) |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | JWT access token lifetime | `15` |
| `REFRESH_TOKEN_EXPIRE_DAYS` | Refresh token lifetime | `7` |
| `COOKIE_DOMAIN` | Cookie domain (set for subdomain sharing) | _(none)_ |
| `DEBUG` | Enable debug mode (insecure cookies) | `true` |
| `NEXT_PUBLIC_API_URL` | API base URL for frontend (baked at build time) | `/api/v1` (relative, same-origin) |
| `OTEL_SERVICE_NAME` | OpenTelemetry service name | `todos-backend` |
| `OTEL_EXPORTER_OTLP_ENDPOINT` | OTLP gRPC collector endpoint | `http://otel-collector:4317` |
| `OTEL_PYTHON_LOGGING_AUTO_INSTRUMENTATION_ENABLED` | Enable OTel log auto-instrumentation | `true` |

All sensitive values are passed as environment variables in Dokploy's Environment tab. See `.env.example` for the full list of supported variables.

## Connection Flow

```
Internet ──> Cloudflare (grafana.dharapx.work)
         ──> do.dharapx.work ──> Dokploy/Traefik (path-based routing)
                                              │
                                    ┌──────────┴──────────┐
                                    ▼                     ▼
                            Frontend :3000          Backend :8000
                            /*                      /api/v1/*
                                    │                     │
                                    │           ┌─────────┴─────────┐
                                    │           ▼                   ▼
                                    │    PgBouncer (:5432)      Redis (:6379)
                                    │           │
                                    │           ▼
                                    │    PostgreSQL 15
                                    │
                               httpOnly cookies (same-origin)
                               access_token 15min · refresh_token 7d
                               Bearer token fallback (hash fragment, cross-origin dev)
```

**Auth flow:** Login/Signup sets httpOnly cookies via same-origin requests (no cross-origin issues). Cross-origin dev (frontend :3001, backend :8000) uses `Authorization: Bearer` with tokens passed via URL hash fragments. On 401, frontend calls `/auth/refresh` to rotate tokens (old refresh token revoked, new pair issued). OAuth callbacks use `OAUTH_REDIRECT_BASE` for self-hosted callback derivation.

**Observability:** Backend sends OTel traces, metrics, and logs to `otel-collector:4317` (gRPC). Collector fans out: traces→Tempo, metrics→Prometheus, logs→Loki. Grafana visualizes everything with auto-provisioned dashboards and alert rules. All obs-infra services run on `obs-net` bridge network.

## Database

Tables are managed via Alembic migrations (11 migration files). To create a new migration:

```bash
cd backend
alembic revision --autogenerate -m "description"
alembic upgrade head
```

## License

MIT
