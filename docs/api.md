# Todo App API Documentation

Base URL: `/api/v1`

## Tasks

### List Tasks
`GET /tasks`

Query Parameters:
- `skip` (int, default: 0) - Pagination offset
- `limit` (int, default: 50, max: 200) - Page size
- `status` (str, optional) - Filter by status: `not_started`, `in_progress`, `done`
- `priority` (str, optional) - Filter by priority: `low`, `medium`, `high`, `urgent`
- `tags` (str, optional) - Comma-separated tag names
- `date_from` (str, optional) - ISO date string for start of range
- `date_to` (str, optional) - ISO date string for end of range
- `keyword` (str, optional) - Search in title and description
- `search` (str, optional) - Full-text search across title, description, and comments
- `sort_by` (str, default: `created_at`) - Sort column: `id`, `title`, `status`, `priority`, `created_at`, `updated_at`, `total_time_spent`
- `sort_order` (str, default: `desc`) - Sort direction: `asc`, `desc`

Response: `{ items: Task[], total: number }`

### Get Task
`GET /tasks/{id}`

### Create Task
`POST /tasks`

```json
{
  "title": "string (required)",
  "description": "string (optional)",
  "priority": "medium (default)",
  "tags": ["tag1", "tag2"]
}
```

### Update Task
`PATCH /tasks/{id}`

```json
{
  "title": "string",
  "description": "string",
  "status": "not_started | in_progress | done",
  "priority": "low | medium | high | urgent",
  "tags": ["tag1"]
}
```

### Delete Task
`DELETE /tasks/{id}`

### Dashboard Stats
`GET /tasks/dashboard/stats`

Response: `{ total: number, not_started: number, in_progress: number, done: number, high_priority: number }`

## Comments

### List Comments
`GET /tasks/{task_id}/comments`

### Create Comment
`POST /tasks/{task_id}/comments`

```json
{
  "content": "string (required)"
}
```

### Update Comment
`PATCH /tasks/{task_id}/comments/{comment_id}`

```json
{
  "content": "string (required)"
}
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
{
  "entry_id": 123
}
```

Calculates duration from started_at to current time and updates the entry.

## History

### Get Task History
`GET /tasks/{task_id}/history`

Returns chronological list of all changes made to a task.

## Search

### Full-text Search
`GET /search?q=keyword`

Searches across task titles, descriptions, and comment content. Returns matching tasks.

## Health

### Health Check
`GET /health`

Response: `{ "status": "healthy" }`
