# Do — Task & Notes Dashboard

A modern, production-ready task management application with goal/task hierarchy, time tracking, notes, charts, and dashboards. Built with FastAPI, Next.js, and PostgreSQL.

## Features

- **Two-Level Hierarchy** — Goals (parent tasks) with nested child tasks; goals auto-compute aggregate progress from children
- **Reference Links** — Non-hierarchical "see also" connections between any tasks
- **Task Management** — Create, update, delete tasks with title, description, priority, tags, and type (task/goal)
- **Advanced Filtering** — Multi-select status/priority dropdowns, filter by tags, date range, keyword; full-text search across titles, descriptions, and comments
- **Time Tracking** — Start/stop timers, add manual entries, view accumulated time per task, timeline chart on dashboard
- **Activity History** — Immutable audit trail of all changes (status, priority, tags, description, time, comments)
- **Notes** — Rich text note editor with persistent storage
- **Dashboard** — Charts (priority breakdown, status distribution), stats cards (urgent, high priority, progress), time timeline, recent activity, quick actions
- **Authentication** — httpOnly cookie-based sessions with JWT access tokens (15 min), refresh token rotation (7 days, SHA256 hashed), and `Authorization: Bearer` fallback for cross-origin dev
- **OAuth SSO** — Sign in with GitHub or Google; auto-links by email; configurable toggle via env vars
- **Password Management** — In-app password reset (no SMTP required), set-password for OAuth users
- **Dark Mode** — System-aware theming with warm light (brown/beige) and dark (charcoal) palettes, glass morphism cards
- **Responsive** — Works on desktop and mobile devices

## Tech Stack

**Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS, shadcn/ui + Radix UI + cmdk, React Query (TanStack), Zustand, date-fns, Recharts, Lucide icons

**Backend**: FastAPI, SQLAlchemy 2.0, Alembic, Pydantic v2, JWT + refresh tokens, Authlib OAuth, bcrypt

**Database**: PostgreSQL 15 (via PgBouncer connection pooler)

**Cache**: Redis 7 Alpine

**Deployment**: Docker, Docker Compose

## Getting Started

### Prerequisites

- Docker and Docker Compose installed
- Node.js 20+ (for local frontend development)
- Python 3.12+ (for local backend development)

### Quick Start (Docker)

```bash
# Start all services
docker compose up -d

# View logs
docker compose logs -f

# Stop all services
docker compose down
```

The application will be available at:

- **Frontend**: http://localhost:3000 (or 3001/3002 if configured)
- **Backend API**: http://localhost:8000
- **API Docs** (Swagger): http://localhost:8000/docs
- **API Docs** (ReDoc): http://localhost:8000/redoc

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
│   ├── alembic/              # Database migrations (10 migration files)
│   ├── app/
│   │   ├── api/v1/           # Route handlers (tasks, auth, comments, notes, time, history, search)
│   │   ├── crud/             # Business logic layer (CRUDAuth with OAuth lookups)
│   │   ├── models/           # SQLAlchemy models (User, Task, RefreshToken, PasswordReset, ...)
│   │   ├── schemas/          # Pydantic v2 schemas
│   │   ├── core/             # Auth utilities (JWT, bcrypt, refresh tokens, OAuth registry)
│   │   ├── cache.py          # Redis-backed dashboard cache (TTL 30s)
│   │   ├── config.py         # Application settings (Docker Secrets, OAuth flags)
│   │   ├── database.py       # Database connection (pool_size=10, overflow=20)
│   │   └── main.py           # FastAPI app + CORS + SessionMiddleware + ZJSONResponse
│   ├── secrets/              # Docker Secrets (gitignored *.txt, committed *.txt.example)
│   │   └── .gitkeep
│   ├── Dockerfile
│   └── requirements.txt
├── frontend/
│   ├── app/                  # Next.js App Router pages (dashboard, tasks, notes, login, etc.)
│   ├── components/
│   │   ├── ui/               # shadcn/ui primitives (button, dialog, command, select, popover, etc.)
│   │   ├── dashboard/        # Dashboard widgets (charts, stats cards, timeline)
│   │   ├── tasks/            # Task components (list, card, form, detail)
│   │   ├── notes/            # Note editor with toolbar
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
│   └── infra-plan.md         # Production deployment plan (Cloudflare Tunnel + Traefik)
├── docker-compose.yml
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
| POST | `/api/v1/tasks/{id}/comments` | Add comment |
| PATCH | `/api/v1/tasks/{id}/comments/{cid}` | Edit comment |
| DELETE | `/api/v1/tasks/{id}/comments/{cid}` | Delete comment |
| GET | `/api/v1/tasks/{id}/time` | List time entries |
| POST | `/api/v1/tasks/{id}/time` | Add manual time entry |
| POST | `/api/v1/tasks/{id}/time/start` | Start timer |
| POST | `/api/v1/tasks/{id}/time/stop` | Stop timer |
| GET | `/api/v1/tasks/{id}/time/total` | Get total time |
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
| `SECRET_KEY` | JWT signing key (use Docker Secret in prod) | `dev-secret-key` |
| `REDIS_URL` | Redis connection string | `redis://redis:6379/0` |
| `CORS_ORIGINS` | Comma-separated allowed origins | `http://localhost:3000,http://localhost:3001,...` |
| `FRONTEND_URL` | Frontend URL for OAuth redirects | `http://localhost:3001` |
| `OAUTH_REDIRECT_BASE` | Backend base URL for OAuth callbacks | `http://localhost:8000` |
| `GITHUB_CLIENT_ID` | GitHub OAuth App client ID | _(Docker Secret)_ |
| `GITHUB_CLIENT_SECRET` | GitHub OAuth App client secret | _(Docker Secret)_ |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID | _(Docker Secret)_ |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret | _(Docker Secret)_ |
| `ENABLE_GITHUB_OAUTH` | Force enable/disable GitHub OAuth | `true` (auto-detect if unset) |
| `ENABLE_GOOGLE_OAUTH` | Force enable/disable Google OAuth | `true` (auto-detect if unset) |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | JWT access token lifetime | `15` |
| `REFRESH_TOKEN_EXPIRE_DAYS` | Refresh token lifetime | `7` |
| `COOKIE_DOMAIN` | Cookie domain (set for subdomain sharing) | _(none)_ |
| `DEBUG` | Enable debug mode (insecure cookies) | `true` |
| `NEXT_PUBLIC_API_URL` | API base URL for frontend | `http://localhost:8000/api/v1` |

Secrets can also be provided via Docker Secrets: mount files at `/run/secrets/<name>` (supported names: `secret_key`, `github_client_id`, `github_client_secret`, `google_client_id`, `google_client_secret`). See `backend/secrets/*.txt.example` for the full list.

## Connection Flow

```
Frontend (port 3000) ──HTTP──> Backend FastAPI (port 8000)
                       ↑ Cookies/Bearer         │
                     (access_token 15min)        ├── PgBouncer (port 5432, transaction pool: 25)
                     (refresh_token 7d)          │       │
                        rotation on 401          │       └── PostgreSQL 15 (max_connections=100)
                                                 │
                                                 ├── Redis 7 (port 6379, AOF persistence)
                                                 │       └── Dashboard stats cache (TTL 30s)
                                                 │
                                                 └── Session (OAuth state CSRF)
```

**Auth flow:** Login/Signup sets httpOnly cookies. On 401, frontend calls `/auth/refresh` to rotate tokens (old refresh token revoked, new pair issued). For OAuth, tokens arrive via URL hash fragment (`#access_token=...&refresh_token=...`) and are sent as `Authorization: Bearer` header.

## Database

Tables are managed via Alembic migrations (10 migration files). To create a new migration:

```bash
cd backend
alembic revision --autogenerate -m "description"
alembic upgrade head
```

## License

MIT
