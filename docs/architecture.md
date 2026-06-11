# Architecture

## Full System Architecture

```mermaid
graph TB
    subgraph Client["Browser / Client"]
        NEXT["Next.js App (port 3000)"]
    end

    subgraph Docker["Docker Compose Network"]
        subgraph Frontend["Frontend Container"]
            NEXT
        end

        subgraph Backend["Backend Container"]
            FASTAPI["FastAPI (port 8000)"]
            MID["Middleware Stack<br/>CORS · Auth · ZJSONResponse"]

            subgraph API["API Layer /api/v1"]
                AUTH["Auth Routes<br/>signup · login · me"]
                TASKS["Task Routes<br/>CRUD · children · parent · stats"]
                NOTES["Note Routes<br/>CRUD"]
                COMMENTS["Comment Routes"]
                TIME["Time Entry Routes<br/>timer · manual · total"]
                HISTORY["History Routes"]
                SEARCH["Search Routes"]
            end

            subgraph CRUD["Business Logic Layer"]
                CRUD_TASK["CRUDTask"]
                CRUD_NOTE["CRUDNote"]
                CRUD_COMMENT["CRUDComment"]
                CRUD_TIME["CRUDTimeEntry"]
                CRUD_HISTORY["CRUDHistory"]
                CRUD_AUTH["CRUDAuth"]
            end

            subgraph MODELS["SQLAlchemy Models"]
                M_USER["User"]
                M_TASK["Task"]
                M_NOTE["Note"]
                M_COMMENT["TaskComment"]
                M_TAG["TaskTag"]
                M_HISTORY["TaskHistory"]
                M_TIME["TimeEntry"]
            end

            subgraph SCHEMAS["Pydantic v2 Schemas"]
                S_TASK["TaskCreate/Update/Response"]
                S_NOTE["NoteCreate/Update/Response"]
                S_AUTH["Signup/Login/Token"]
                S_TIME["TimeEntryCreate/Response"]
                S_COMMENT["CommentCreate/Response"]
                S_HISTORY["HistoryResponse"]
            end

            CACHE["cache.py<br/>Redis-backed dashboard cache<br/>TTL 30s"]
        end

        subgraph PGB["PgBouncer Layer"]
            PGBOUNCER["PgBouncer<br/>port 5432 (container)<br/>Transaction pooling<br/>pool_size=25<br/>max_client_conn=200<br/>scram-sha-256 auth"]
        end

        subgraph Database["Database Layer"]
            POSTGRES["PostgreSQL 15<br/>postgres:5432<br/>max_connections=100<br/>shared_buffers=256MB"]
            subgraph PG_CONFIG["PG Configuration"]
                MAX_CONN["max_connections=100"]
                SHARED_BUF["shared_buffers=256MB"]
                WORK_MEM["work_mem=16MB"]
                EFF_CACHE["effective_cache_size=1GB"]
            end
        end

        subgraph CacheLayer["Cache Layer"]
            REDIS["Redis 7 Alpine<br/>port 6379<br/>AOF persistence<br/>save 60 1"]
        end

        subgraph Volumes["Persistent Storage"]
            PG_DATA["postgres_data<br/>/var/lib/postgresql/data"]
            REDIS_DATA["redis_data<br/>/data"]
        end
    end

    NEXT -->|HTTP :8000/api/v1| FASTAPI
    FASTAPI --> MID
    MID --> API
    API --> CRUD
    CRUD --> MODELS
    MODELS --> SCHEMAS
    CRUD -->|SQLAlchemy<br/>pool_size=10, overflow=20| PGBOUNCER
    PGBOUNCER -->|:5432| POSTGRES
    CRUD_TASK -.->|get/set cache| REDIS
    POSTGRES --> PG_DATA
    REDIS --> REDIS_DATA
```

## Frontend Architecture

```mermaid
graph TB
    subgraph NextJS["Next.js 14 App Router"]
        LAYOUT["Root Layout<br/>layout.tsx"]

        subgraph PAGES["Pages (App Router)"]
            HOME["/ — Home"]
            DASHBOARD["/dashboard"]
            TASKS["/tasks"]
            TASK_DETAIL["/tasks/[id]"]
            NOTES["/notes"]
            LOGIN["/login"]
            SIGNUP["/signup"]
            HELP["/help"]
            ABOUT["/about"]
        end

        subgraph COMPONENTS["Component Library"]
            subgraph LAYOUT_COMP["Layout"]
                HEADER["Header"]
                SIDEBAR["Sidebar"]
            end

            subgraph DASHBOARD_COMP["Dashboard"]
                STATS_CARD["StatsCard"]
                RECENT_ACTIVITY["RecentActivity"]
                TIME_TIMELINE["TimeTimelineChart"]
                MINI_RING["MiniRing"]
            end

            subgraph TASK_COMP["Tasks"]
                TASK_LIST["TaskList"]
                TASK_CARD["TaskCard"]
                TASK_DETAIL_COMP["TaskDetail"]
                TASK_FORM["TaskForm"]
            end

            subgraph NOTES_COMP["Notes"]
                NOTE_EDITOR["NoteEditor"]
                EDITOR_TOOLBAR["EditorToolbar"]
            end

            subgraph UI["UI Primitives (shadcn/ui)"]
                BUTTON["Button"]  DIALOG["Dialog"]
                SELECT["Select"]  POPOVER["Popover"]
                COMMAND["Command"] INPUT["Input"]
                BADGE["Badge"]    CARD["Card"]
                DROPDOWN["DropdownMenu"]
                TEXTAREA["Textarea"]
                SEPARATOR["Separator"]
                SKELETON["Skeleton"]
                TOGGLE["Toggle"]
                TOOLTIP["Tooltip"]
            end

            THEME["ThemeProvider"]
        end

        subgraph STATE["State & Data Fetching"]
            subgraph ZUSTAND["Zustand Stores"]
                AUTH_STORE["auth-store"]
                FILTER_STORE["filter-store"]
                SEARCH_STORE["search-store"]
                TASK_STORE["task-store"]
            end

            subgraph REACT_QUERY["React Query Hooks"]
                USE_TASKS["useTasks<br/>useTask<br/>useCreateTask<br/>useUpdateTask<br/>useDeleteTask<br/>useSetTaskParent<br/>useUpdateTaskChildren"]
                USE_NOTES["useNotes<br/>useNote<br/>useCreateNote<br/>useUpdateNote<br/>useDeleteNote"]
                USE_COMMENTS["useComments<br/>useCreateComment<br/>useDeleteComment"]
                USE_TIME["useTimeEntries<br/>useTotalTime<br/>useStartTimer<br/>useStopTimer<br/>useAddManualEntry"]
            end
        end

        subgraph API["API Client Layer"]
            CLIENT["api/client.ts<br/>(fetch wrapper + JWT, get/post/patch/put/delete)"]
            TASKS_API["tasks.ts"]
            NOTES_API["notes.ts"]
            COMMENTS_API["comments.ts"]
            TIME_API["time.ts"]
            AUTH_API["auth.ts"]
        end
    end

    LAYOUT --> PAGES
    LAYOUT --> COMPONENTS
    PAGES --> COMPONENTS
    COMPONENTS --> UI
    COMPONENTS --> THEME
    COMPONENTS --> STATE
    STATE --> ZUSTAND
    STATE --> REACT_QUERY
    REACT_QUERY --> API
    API --> CLIENT
    CLIENT -->|HTTP| BACKEND["Backend :8000/api/v1"]
    LAYOUT_COMP --> HEADER
    LAYOUT_COMP --> SIDEBAR
```

## Backend Architecture

```mermaid
graph TB
    subgraph FastAPI["FastAPI Application"]
        APP["app/main.py<br/>FastAPI()"]

        subgraph MIDDLEWARE["Middleware"]
            CORS["CORSMiddleware"]
            AUTH_MW["Auth Dependency<br/>(JWT validation)"]
            JSON_RESP["ZJSONResponse<br/>(serializes datetimes with Z)"]
        end

        subgraph ROUTES["Route Handlers"]
            AUTH_R["/api/v1/auth"]
            TASK_R["/api/v1/tasks"]
            NOTE_R["/api/v1/notes"]
            COMMENT_R["/api/v1/tasks/{id}/comments"]
            TIME_R["/api/v1/tasks/{id}/time"]
            HISTORY_R["/api/v1/tasks/{id}/history"]
            SEARCH_R["/api/v1/search"]
            HEALTH_R["/health"]
        end

        subgraph DEPENDENCIES["Dependencies"]
            GET_DB["get_db()<br/>session per request"]
            GET_USER["get_current_user()<br/>JWT → user"]
        end

        subgraph BUSINESS["Business Logic (CRUD)"]
            TASK_CRUD["CRUDTask<br/>create · get · get_multi<br/>update · delete<br/>update_children · set_parent<br/>get_dashboard_stats"]
            NOTE_CRUD["CRUDNote<br/>create · get · get_multi<br/>update · delete"]
            COMMENT_CRUD["CRUDComment"]
            TIME_CRUD["CRUDTimeEntry<br/>create · start_timer<br/>stop_timer · get_total<br/>get_timeline"]
            HISTORY_CRUD["CRUDHistory"]
            AUTH_CRUD["CRUDAuth<br/>signup · login"]
        end

        subgraph SCHEMAS["Pydantic v2 Schemas"]
            S_TASK["TaskCreate/TaskUpdate<br/>TaskResponse/TaskListItem<br/>TaskListResponse<br/>UpdateChildrenRequest<br/>SetParentRequest"]
            S_NOTE["NoteCreate/NoteUpdate<br/>NoteResponse/NoteListResponse"]
            S_AUTH["SignupRequest/LoginRequest<br/>TokenResponse/UserResponse"]
            S_TIME["TimeEntryCreate/TimeEntryResponse<br/>TimeTrackingResponse"]
            S_COMMENT["CommentCreate/CommentUpdate<br/>CommentResponse"]
            S_HISTORY["HistoryResponse"]
            BASE["AppBaseModel<br/>(Z datetime encoder)"]
        end

        subgraph CONFIG["Configuration"]
            SETTINGS["Settings<br/>DATABASE_URL · SECRET_KEY<br/>CORS_ORIGINS · REDIS_URL<br/>API_V1_PREFIX"]
        end

        subgraph CACHE_LAYER["Caching"]
            CACHE["cache.py<br/>Redis client<br/>get_dashboard_cache()<br/>set_dashboard_cache()<br/>TTL=30s"]
        end
    end

    subgraph PGBOUNCER_DIAGRAM["Connection Pooling"]
        PGB["PgBouncer<br/>Transaction mode<br/>25 pool · 200 max clients"]
    end

    subgraph DB["Database Layer"]
        ENGINE["SQLAlchemy Engine<br/>pool_size=10, overflow=20<br/>pool_recycle=3600<br/>pool_pre_ping=True"]
        ALEMBIC["Alembic Migrations<br/>7 migration files"]
    end

    subgraph REDIS_DIAGRAM["Redis Cache"]
        RS["Redis 7 Alpine<br/>port 6379<br/>AOF persistence<br/>db 0"]
    end

    APP --> MIDDLEWARE
    APP --> CONFIG
    ROUTES --> DEPENDENCIES
    APP --> ROUTES
    ROUTES --> BUSINESS
    BUSINESS --> SCHEMAS
    BUSINESS --> ENGINE
    BUSINESS -.-> CACHE_LAYER
    ENGINE --> PGB
    PGB --> POSTGRES_DB["PostgreSQL 15"]
    ALEMBIC --> POSTGRES_DB
    CACHE_LAYER --> RS
```

## Database Schema

```mermaid
erDiagram
    users ||--o{ tasks : "user_id FK"
    users ||--o{ notes : "user_id FK"
    users ||--o{ task_comments : "user_id FK"
    users ||--o{ task_history : "user_id FK"
    users ||--o{ time_entries : "user_id FK"

    tasks ||--o{ task_comments : "task_id FK CASCADE"
    tasks ||--o{ task_tags : "task_id FK CASCADE"
    tasks ||--o{ task_history : "task_id FK CASCADE"
    tasks ||--o{ time_entries : "task_id FK CASCADE"
    tasks ||--o| tasks : "parent_id FK (self-ref)"
    tasks ||--o| tasks : "reference_id FK (self-ref)"

    users {
        int id PK
        string username UK
        string email UK
        string hashed_password
        string display_name
        datetime created_at
        datetime updated_at
    }

    tasks {
        int id PK
        int user_id FK
        string title
        text description
        string status "not_started | in_progress | done | wont_do"
        string priority "low | medium | high | urgent"
        string type "task | goal"
        int parent_id FK "nullable, self-ref"
        int reference_id FK "nullable, self-ref"
        int sort_order
        int progress "0-100"
        int total_time_spent
        datetime created_at
        datetime updated_at
        datetime completed_at
    }

    notes {
        int id PK
        int user_id FK
        string title
        text content "rich markdown, ~8KB avg"
        string tags
        datetime created_at
        datetime updated_at
    }

    task_comments {
        int id PK
        int task_id FK
        int user_id FK
        text content
        datetime created_at
        datetime updated_at
    }

    task_tags {
        int id PK
        int task_id FK
        string name
    }

    task_history {
        int id PK
        int task_id FK
        int user_id FK
        string field_changed
        text old_value
        text new_value
        datetime created_at
    }

    time_entries {
        int id PK
        int task_id FK
        int user_id FK
        int duration "seconds"
        string description
        datetime started_at
        datetime stopped_at
        datetime created_at
    }

```

## Indexes

Migration `0005_add_composite_indexes.py` created 8 indexes targeting the most common query patterns:

| Index Name | Table | Columns | Type | Purpose |
|---|---|---|---|---|
| `ix_tasks_user_status` | tasks | `(user_id, status)` | B-tree | Filter by status (done/in_progress) |
| `ix_tasks_user_priority` | tasks | `(user_id, priority)` | B-tree | Filter by priority (urgent/high) |
| `ix_tasks_user_created` | tasks | `(user_id, created_at)` | B-tree | Sort by created date |
| `ix_tasks_user_updated` | tasks | `(user_id, updated_at)` | B-tree | Date range filters on dashboard |
| `ix_history_task_created` | task_history | `(task_id, created_at)` | B-tree | History chronology for a task |
| `ix_time_task_created` | time_entries | `(task_id, created_at)` | B-tree | Time entry chronology |
| `ix_notes_user_updated` | notes | `(user_id, updated_at)` | B-tree | Notes list sorted by update time |
| `ix_notes_content_trgm` | notes | `content` | GIN (`gin_trgm_ops`) | Trigram full-text search on note content |

## Key Decisions

### Architecture
- **PgBouncer over direct Postgres** — Prevents connection RAM exhaustion at scale (Instagram's lesson: each PG connection costs ~5MB). Backend connects to `pgbouncer:5432` (transaction pooling, 25 pool size, 200 max clients). Postgres itself stays at `max_connections=100` but PgBouncer multiplexes many more client connections.
- **Redis over in-memory dict** — Dashboard stats cache (30s TTL) moved from Python dict to Redis: survives container restarts, shared across multiple backend instances, native TTL eviction with `decode_responses=True`.
- **Connection pool** — SQLAlchemy `pool_size=10`, `max_overflow=20`, `pool_recycle=3600`, `pool_pre_ping=True`. All references go through PgBouncer which pools onto 25 PG connections.
- **GIN trigram index** — On `notes.content` for fast substring/fuzzy search. Chosen over `tsvector` for simplicity: trigram handles partial matches and typos without a separate search index.

### API Design
- **UTC + Z suffix** — API returns `2026-06-11T05:34:45.780718Z`. Backend uses `datetime.utcnow()`. Frontend converts to browser local timezone via `date-fns format()`.
- **Comma-separated multi-select** — Filter params like `?status=done,not_started` rather than array query params, avoiding URL parsing ambiguity.
- **Dedicated goal management endpoints** — `POST /tasks/{goal_id}/children` (bulk replace children) and `PUT /tasks/{task_id}/parent` (link/unlink) instead of individual PATCH calls, ensuring atomicity and server-side validation.
- **Separate response schemas** — `TaskResponse` includes `children[]` (for detail view), `TaskListItem` omits it (for list view), minimizing payload.

### Frontend
- **Glass morphism** — Cards use `bg-card/50 backdrop-blur-sm border` with no `box-shadow`. Elevation from blur + transparency alone.
- **Combobox over native Select** — Goal/parent/reference pickers use `Popover` + `Command` + `cmdk` for searchability with 200+ items. Native `<Select>` is only for status/priority (small fixed sets).
- **No Portal inside Dialog** — `SelectContent` and `PopoverContent` have `<Portal>` wrappers removed globally to prevent Radix focus-management crash when nested inside `Dialog` (known `@radix-ui/react-select@^2.0.0` bug).
- **Local state + Save for goal management** — TaskDetail's "Manage Tasks" popover keeps `childIds` locally; only calls `updateTaskChildren` on Save button click, avoiding a mutation per add/remove.

### Color & Theming
- **Light mode**: warm brown/beige palette (`#f5f0eb` backgrounds, `#8b7355` accents).
- **Dark mode**: warm charcoal (`#1a1a1a` backgrounds, `#e0d5c1` text).
- **System-aware**: Defaults to `system` theme with `ThemeProvider`; user can override to light/dark.
