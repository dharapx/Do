# Todo App

A modern, production-ready task management application built with FastAPI, Next.js, and PostgreSQL. Designed for power users with keyboard-friendly interactions, real-time time tracking, and comprehensive activity history.

## Features

- **Task Management** - Create, update, delete tasks with title, description, priority, and tags
- **Advanced Filtering** - Filter by status, priority, tags, date range, keyword; full-text search across titles, descriptions, and comments
- **Time Tracking** - Start/stop timers, add manual entries, view accumulated time per task
- **Activity History** - Immutable audit trail of all changes (status, priority, tags, description, time, comments)
- **Comments** - Add, edit, delete comments with timestamps
- **Dashboard** - At-a-glance overview with task counts and recent activity feed
- **Dark Mode** - System-aware theme with clean light/dark variants
- **Responsive** - Works on desktop and mobile devices

## Tech Stack

**Frontend**: Next.js (App Router), TypeScript, Tailwind CSS, shadcn/ui, Radix UI, React Query, Zustand

**Backend**: FastAPI, SQLAlchemy, Alembic, Pydantic, JWT-ready

**Database**: PostgreSQL 15

**Deployment**: Docker, Docker Compose

## Getting Started

### Prerequisites

- Docker and Docker Compose installed
- Node.js 20+ (for local frontend development)
- Python 3.12+ (for local backend development)

### Quick Start (Docker)

```bash
# Clone the repository
git clone <repository-url>
cd todo-app

# Start all services
docker compose up -d

# View logs
docker compose logs -f

# Stop all services
docker compose down
```

The application will be available at:

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Docs** (Swagger): http://localhost:8000/docs
- **API Docs** (ReDoc): http://localhost:8000/redoc

### Local Development

#### Backend

```bash
# Create virtual environment
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Set up environment
cp .env.example .env  # Create from template

# Run database migrations
alembic upgrade head

# Start development server
uvicorn app.main:app --reload --port 8000
```

#### Frontend

```bash
cd frontend

# Install dependencies
npm install

# Set up environment
cp .env.local.example .env.local

# Start development server
npm run dev
```

## Project Structure

```
├── backend/
│   ├── alembic/              # Database migrations
│   │   ├── versions/         # Migration files
│   │   ├── env.py
│   │   └── script.py.mako
│   ├── app/
│   │   ├── api/
│   │   │   └── v1/          # API route handlers
│   │   │       ├── tasks.py
│   │   │       ├── comments.py
│   │   │       ├── time_entries.py
│   │   │       ├── history.py
│   │   │       └── search.py
│   │   ├── crud/            # Business logic layer
│   │   ├── models/          # SQLAlchemy models
│   │   ├── schemas/         # Pydantic schemas
│   │   ├── config.py        # Application settings
│   │   ├── database.py      # Database connection
│   │   ├── deps.py          # FastAPI dependencies
│   │   └── main.py          # FastAPI application
│   ├── Dockerfile
│   └── requirements.txt
├── frontend/
│   ├── app/                 # Next.js App Router pages
│   │   ├── dashboard/       # Dashboard page
│   │   └── tasks/           # Task list and detail pages
│   ├── components/
│   │   ├── ui/              # shadcn/ui primitives
│   │   ├── dashboard/       # Dashboard widgets
│   │   ├── tasks/           # Task-related components
│   │   ├── layout/          # Sidebar, Header
│   │   └── theme/           # Theme provider
│   ├── lib/
│   │   ├── api/             # API client functions
│   │   ├── hooks/           # React Query hooks
│   │   └── store/           # Zustand state stores
│   ├── Dockerfile
│   └── package.json
├── database/
│   └── init.sql             # Database initialization
├── docs/
│   └── api.md               # API documentation
├── docker-compose.yml       # Docker Compose configuration
├── .env                     # Environment variables
└── README.md
```

## API Overview

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/tasks` | List tasks (with filtering, sorting, pagination) |
| POST | `/api/v1/tasks` | Create a task |
| GET | `/api/v1/tasks/{id}` | Get task details |
| PATCH | `/api/v1/tasks/{id}` | Update task |
| DELETE | `/api/v1/tasks/{id}` | Delete task |
| GET | `/api/v1/tasks/dashboard/stats` | Dashboard statistics |
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
| GET | `/api/v1/search` | Full-text search |

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
alembic revision --autogenerate -m "description of changes"
alembic upgrade head
```

## License

MIT
