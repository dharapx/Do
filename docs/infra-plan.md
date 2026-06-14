# Infra Plan — Dokploy Deployment

## Architecture

```
Internet → Cloudflare Edge (TLS, WAF, rate limit)
                │  encrypted tunnel (outbound-only)
                ▼
        cloudflared container
                │  internal HTTP
                ▼
            Traefik (routing)
                │
          ┌──────┴──────┐
          ▼              ▼
     Frontend        Backend API
     do.dharapx.work  do.dharapx.work/api/v1/*
      (port 3000)       (port 8000)
```

## Deployment (Dokploy)

### docker-compose.yml

- **Secrets** → Environment variables — All sensitive values (`SECRET_KEY`, OAuth credentials) are passed as `${VARIABLE_NAME}` and set in Dokploy's Environment tab.
- **Ports** → Expose — Internal services (postgres, pgbouncer, redis, backend, frontend) use `expose:` instead of `ports:`, keeping them locked inside the Docker network.
- **Traefik labels** — Path-based routing:
  - Frontend: `Host(do.dharapx.work)` → port 3000
  - Backend: `Host(do.dharapx.work) && PathPrefix(/api/v1, /docs, /redoc, /openapi.json)` → port 8000
- **`NEXT_PUBLIC_API_URL`** set to `/api/v1` (relative path) — same-origin, no CORS issues.

### Dokploy Setup

1. Create a new service in Dokploy pointing to your GitHub repo
2. In the **Environment** tab, set:

| Variable | Value |
|---|---|
| `SECRET_KEY` | Random 64-char string |
| `GITHUB_CLIENT_ID` | GitHub OAuth App client ID |
| `GITHUB_CLIENT_SECRET` | GitHub OAuth App secret |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret |
| `OAUTH_REDIRECT_BASE` | `https://do.dharapx.work` |
| `FRONTEND_URL` | `https://do.dharapx.work` |
| `CORS_ORIGINS` | `https://do.dharapx.work` |

3. Cloudflare DNS: `do.dharapx.work CNAME → <tunnel-id>.cfargotunnel.com`
4. cloudflared config ingress: `do.dharapx.work → http://traefik:80`

## Phase 2 — Auth Overhaul (done)

httpOnly cookies, refresh token rotation, GitHub/Google OAuth SSO, in-app password reset, session middleware for OAuth state CSRF.

## Phase 2b — OAuth Configurable Toggle

`ENABLE_GITHUB_OAUTH` / `ENABLE_GOOGLE_OAUTH` env vars with auto-detect. `GET /auth/config` endpoint for frontend to conditionally show OAuth buttons.

## Phase 2c — UI & API Polish (done)

- **Search flattens child tasks** — When search is active, child tasks appear as individual standalone cards with a parent goal badge.
- **Notification position** — Changed from `bottom-right` to `top-center` for better visibility.
- **Progress slider local state** — Dragging updates only local state; mutation fires once on pointer release.
- **Time entry edit/delete** — `PUT /tasks/{id}/time/{eid}` and `DELETE /tasks/{id}/time/{eid}` with inline edit UI. Maximum 1440 min per entry, validated frontend + backend.

## Phase 3b — Rich Text Editing (done)

- **TipTap editor** — Task descriptions and comments use a full-featured TipTap-based `RichTextEditor` with extensions: tables, task lists, code block syntax highlighting, text alignment, links, images, and highlight colors.
- **Markdown notes** — Note editor has a Rich Text ↔ Markdown toggle button. Markdown content is rendered via `react-markdown` + `remark-gfm`. Content auto-detects HTML vs markdown on view.
- **Formatted content** — `FormattedContent` component renders rich text HTML with explicit Tailwind utility classes (no typography plugin).
- **Paste handler** — Pasting plain text with markdown syntax converts to HTML on the fly via `marked`.
- **Comment edit/delete** — Inline edit with save/cancel, delete with confirmation, revealed on hover beside timestamp.
- **Libraries added** — `marked` (markdown→HTML on paste), `react-markdown` + `remark-gfm` (markdown rendering), `lowlight` (code syntax highlighting in TipTap).

## Phase 4 — Attachments & Delete (done)

- **File attachments** — `POST /tasks/{id}/attachments` (upload, max 10 MB), `GET /tasks/{id}/attachments` (list), `GET /tasks/{id}/attachments/{att_id}` (download), `DELETE /tasks/{id}/attachments/{att_id}` (delete). Files stored in Docker volume `uploads_data`. Migration 0009. Upload button and file list in main content area below Details section.
- **Delete from detail** — Red "Delete task" option in `⋮` dropdown menu in task detail header with confirmation; redirects to `/tasks` on success.

## Phase 5b — Smart Tag Autocomplete (done)

- **Backend `GET /tags/suggestions?q=...`** — Returns distinct tag names matching the query for the current user (case-insensitive ILIKE on `task_tags` joined with `tasks`).
- **Frontend `#` autocomplete** — In the task form's tags input, typing `#` followed by characters triggers a dropdown with matching existing tags. Selecting a suggestion replaces `#query` with `tag_name,` in the input field.

## Phase 6 — Hardening (future)

Cloudflare WAF rules, CSP headers, monitoring.
