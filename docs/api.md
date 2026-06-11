# Todo App API Documentation

Base URL: `/api/v1`

## Authentication

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

Response: `{ "access_token": "jwt...", "token_type": "bearer" }`

All task/note endpoints require `Authorization: Bearer <token>` header.

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
