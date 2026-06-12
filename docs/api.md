# Todo App API Documentation

Base URL: `/api/v1`

## Authentication

The API uses **httpOnly cookie-based authentication** with automatic **refresh token rotation**.

- **`access_token`** cookie (15 min, httpOnly, SameSite=strict, path=/) — short-lived JWT for API access
- **`refresh_token`** cookie (7 days, httpOnly, SameSite=strict, path=/api/v1/auth) — single-use random token, SHA256 hashed in DB

For **cross-origin development** (frontend on `:3001`, backend on `:8000`), the OAuth callback passes tokens in the URL hash fragment (`#access_token=...&refresh_token=...`). The frontend stores them in-memory and sends via `Authorization: Bearer <token>` header.

The response `{ "status": "ok" }` indicates success; cookies are set via `Set-Cookie` headers.

### Signup
`POST /auth/signup`

```json
{
  "username": "user@example.com",
  "email": "user@example.com",
  "password": "securepassword",
  "name": "User Name"
}
```

### Login
`POST /auth/login`

```json
{
  "username": "user@example.com",
  "password": "securepassword"
}
```

### Get Current User
`GET /auth/me`

Returns the authenticated user's profile.

```json
{
  "id": 1,
  "username": "user@example.com",
  "email": "user@example.com",
  "display_name": "User Name",
  "created_at": "2026-06-11T05:34:45.780718Z"
}
```

### Refresh Token
`POST /auth/refresh`

Rotates both access and refresh tokens. Accepts the `refresh_token` cookie automatically. Also accepts `Authorization: Bearer <refresh_token>` as fallback.

### Logout
`POST /auth/logout`

Revokes all non-expired refresh tokens for the current user and clears auth cookies.

### OAuth Configuration
`GET /auth/config`

Returns which OAuth providers are enabled on the server:

```json
{
  "github": true,
  "google": false
}
```

Providers are auto-enabled when both client ID and secret are configured. Can be overridden via `ENABLE_GITHUB_OAUTH` / `ENABLE_GOOGLE_OAUTH` environment variables.

### OAuth Authorization URL
`GET /auth/oauth/{provider}`

Provider values: `github`, `google`. Returns a redirect URL to the provider's consent screen:

```json
{
  "url": "https://github.com/login/oauth/authorize?..."
}
```

### OAuth Callback (internal)
`GET /auth/oauth/{provider}/callback`

Handles the OAuth provider's callback, exchanges the authorization code for tokens, creates or links a user account, sets auth cookies, and redirects to `{FRONTEND_URL}/dashboard#access_token=...&refresh_token=...`.

### Forgot Password
`POST /auth/forgot-password`

```json
{
  "username": "user@example.com"
}
```

If the user has OAuth-linked providers, returns those instead of a reset code:

```json
{
  "has_oauth_providers": true,
  "oauth_providers": ["github"],
  "reset_code": null,
  "message": "This account uses github. Sign in with that provider instead."
}
```

If the user has a password, returns a reset code (shown in logs / response — no SMTP):

```json
{
  "has_oauth_providers": false,
  "oauth_providers": [],
  "reset_code": "a1b2c3d4",
  "message": "Use the code below to reset your password. It expires in 15 minutes."
}
```

### Reset Password
`POST /auth/reset-password`

```json
{
  "code": "a1b2c3d4",
  "new_password": "newSecurePassword123"
}
```

Revokes all existing refresh tokens after success.

### Set Password (OAuth users)
`POST /auth/set-password`

For users who signed up via OAuth and want to add password-based login:

```json
{
  "current_password": null,
  "new_password": "newSecurePassword123"
}
```

For existing password users changing their password, `current_password` is required.

Revokes all existing refresh tokens after success.

## Tasks

## Tasks

### Task Object

```json
{
  "id": 1,
  "title": "Task title",
  "description": "Optional description",
  "status": "not_started | in_progress | done | wont_do",
  "priority": "low | medium | high | urgent",
  "type": "task | goal",
  "tags": ["tag1", "tag2"],
  "total_time_spent": 3600,
  "progress": 75,
  "parent_id": null,
  "children": [],
  "reference_id": null,
  "reference_title": null,
  "created_at": "2026-06-11T05:34:45.780718Z",
  "updated_at": "2026-06-11T05:34:45.780718Z",
  "completed_at": null
}
```

- **type**: `"task"` or `"goal"` — goals can have child tasks
- **parent_id**: FK to parent goal (for tasks only)
- **children**: list of child tasks (for goals only, in detail endpoint)
- **reference_id**: non-hierarchical "see also" link to any task/goal
- **reference_title**: computed title of referenced task (read-only)

### List Tasks
`GET /tasks`

Query Parameters:
- `skip` (int, default: 0) — Pagination offset
- `limit` (int, default: 50, max: 200) — Page size
- `status` (str, optional) — Comma-separated: `not_started,in_progress,done`
- `priority` (str, optional) — Comma-separated: `low,medium,high,urgent`
- `tags` (str, optional) — Comma-separated tag names
- `type` (str, optional) — Filter by type: `task`, `goal`
- `parent_id` (int, optional) — Filter by parent; `0` for root-only tasks
- `date_from` (str, optional) — ISO date string
- `date_to` (str, optional) — ISO date string
- `keyword` (str, optional) — Search in title and description
- `search` (str, optional) — Full-text search across title, description, and comments
- `sort_by` (str, default: `created_at`) — `id`, `title`, `status`, `priority`, `created_at`, `updated_at`, `total_time_spent`
- `sort_order` (str, default: `desc`) — `asc`, `desc`

Response: `{ items: Task[], total: number }`

### Get Task
`GET /tasks/{id}`

Returns full Task object with `children` populated.

### Create Task
`POST /tasks`

```json
{
  "title": "string (required)",
  "description": "string (optional)",
  "priority": "medium",
  "type": "task",
  "tags": ["tag1"],
  "parent_id": null,
  "reference_id": null
}
```

- If `type: "goal"` and `parent_id` is set, validates parent is also a goal.
- If `type: "task"` and `parent_id` is set, validates parent exists and is a goal.

### Update Task
`PATCH /tasks/{id}`

Accepts any subset of task fields. Notable behaviors:
- Changing `parent_id` is blocked if task `status === "done"`
- Setting progress to 100 auto-sets status to `"done"`; setting progress < 100 when done reverts to `"in_progress"`
- Changing `parent_id` triggers progress recalculation on old and new parent

```json
{
  "title": "string",
  "description": "string",
  "status": "in_progress",
  "priority": "high",
  "type": "task",
  "tags": ["tag1", "tag2"],
  "progress": 50,
  "parent_id": null,
  "reference_id": null
}
```

### Delete Task
`DELETE /tasks/{id}`

### Set Parent (Link/Unlink Goal)
`PUT /tasks/{task_id}/parent`

```json
{
  "parent_id": 5
}
```

- Sets or clears the parent goal for a task.
- Set `parent_id` to `null` to unlink.
- Validates: task exists, parent is a goal, task is not done, parent belongs to user.
- Single atomic operation.

### Bulk Set Children
`POST /tasks/{goal_id}/children`

```json
{
  "child_ids": [1, 2, 3]
}
```

- Atomically replaces all children of a goal.
- Validates: goal exists, all children exist and are tasks (not goals), none are done.
- Adds newly selected children and removes deselected ones in a single transaction.
- Recomputes goal progress after update.

### Dashboard Stats
`GET /tasks/dashboard/stats`

Response:
```json
{
  "total": 42,
  "not_started": 10,
  "in_progress": 15,
  "done": 15,
  "wont_do": 2,
  "high_priority": 8,
  "urgent": 3,
  "urgent_all": 5,
  "high_priority_all": 10,
  "avg_progress": 45.2
}
```

- `urgent`: count of urgent tasks excluding `done`/`wont_do`
- `urgent_all` / `high_priority_all`: count regardless of status (for priority breakdown charts)
- Supports `date_from` and `date_to` query params (filters on `updated_at`)

### Dashboard Time Timeline
`GET /tasks/dashboard/time-timeline`

Returns daily time totals per task for chart rendering.

Supports `date_from` and `date_to` query params.

Response:
```json
{
  "timeline": [
    {
      "date": "2026-06-10",
      "entries": [
        { "task_id": 1, "title": "Task title", "duration": 3600 }
      ]
    }
  ]
}
```

## Comments

### List Comments
`GET /tasks/{task_id}/comments`

### Create Comment
`POST /tasks/{task_id}/comments`

```json
{ "content": "string (required)" }
```

### Update Comment
`PATCH /tasks/{task_id}/comments/{comment_id}`

```json
{ "content": "string (required)" }
```

### Delete Comment
`DELETE /tasks/{task_id}/comments/{comment_id}`

## Time Tracking

### List Time Entries
`GET /tasks/{task_id}/time`

### Get Total Time
`GET /tasks/{task_id}/time/total`

Response: `{ task_id: number, total_time: number }`

### Add Manual Entry
`POST /tasks/{task_id}/time`

```json
{
  "duration": 3600,
  "description": "Worked on feature X"
}
```

### Start Timer
`POST /tasks/{task_id}/time/start`

Creates a new time entry with `started_at` set to current time.

### Stop Timer
`POST /tasks/{task_id}/time/stop`

```json
{ "entry_id": 123 }
```

Calculates duration from `started_at` to current time and updates the entry.

## History

### Get Task History
`GET /tasks/{task_id}/history`

Returns chronological list of all changes made to a task.

## Notes

### List Notes
`GET /notes`

### Create Note
`POST /notes`

```json
{
  "title": "Note title",
  "content": "# Markdown content",
  "tags": ["personal"]
}
```

### Get Note
`GET /notes/{id}`

### Update Note
`PUT /notes/{id}`

```json
{
  "title": "Updated title",
  "content": "Updated content",
  "tags": ["work"]
}
```

### Delete Note
`DELETE /notes/{id}`

## Search

### Full-text Search
`GET /search?q=keyword`

Searches across task titles, descriptions, and comment content. Returns matching tasks.

## Health

### Health Check
`GET /health`

Response: `{ "status": "healthy" }`
