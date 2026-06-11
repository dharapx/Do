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
- **Dark Mode** — System-aware theming with warm light (brown/beige) and dark (charcoal) palettes, glass morphism cards
- **Responsive** — Works on desktop and mobile devices

## Tech Stack

**Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS, shadcn/ui + Radix UI + cmdk, React Query (TanStack), Zustand, date-fns, Recharts, Lucide icons

**Backend**: FastAPI, SQLAlchemy 2.0, Alembic, Pydantic v2, JWT auth

**Database**: PostgreSQL 15

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

## Project Structure

```
├── backend/
│   ├── alembic/              # Database migrations
│   ├── app/
│   │   ├── api/v1/           # Route handlers (tasks, auth, comments, notes, time, history, search)
│   │   ├── crud/             # Business logic layer
│   │   ├── models/           # SQLAlchemy models
│   │   ├── schemas/          # Pydantic v2 schemas
│   │   ├── core/             # Auth utilities
│   │   ├── config.py         # Application settings
│   │   ├── database.py       # Database connection
│   │   └── main.py           # FastAPI app + CORS + custom JSON response
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
│   │   ├── api/              # API client + endpoint functions
│   │   ├── hooks/            # React Query hooks
│   │   └── store/            # Zustand state stores (auth, filters, search)
│   ├── Dockerfile
│   └── package.json
├── database/
│   └── init.sql
├── docs/
│   └── api.md
├── docker-compose.yml
└── README.md
```

## API Overview

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/auth/signup` | Create account |
| POST | `/api/v1/auth/login` | Login |
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
| `DATABASE_URL` | PostgreSQL connection string | `postgresql+psycopg://todos_user:todos_pass@postgres:5432/todos_app` |
| `SECRET_KEY` | JWT secret key | `change-me-in-production` |
| `CORS_ORIGINS` | Comma-separated allowed origins | `http://localhost:3000` |
| `NEXT_PUBLIC_API_URL` | API base URL for frontend | `http://localhost:8000/api/v1` |

## Database

Tables are managed via Alembic migrations. To create a new migration:

```bash
cd backend
alembic revision --autogenerate -m "description"
alembic upgrade head
```

## License

MIT
