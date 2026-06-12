# Infra Plan — Cloudflare Tunnel + Traefik

## Phase 1 — Cloudflare Tunnel + Traefik Gateway

### Architecture
```
Internet → Cloudflare Edge (TLS, WAF, rate limit)
                │  encrypted tunnel (outbound-only)
                ▼
        cloudflared container
                │  internal HTTP
                ▼
            Traefik (routing + LB)
                │
          ┌──────┴──────┐
          ▼              ▼
     Frontend        Backend
     :3000           :8000
```

### docker-compose additions

**cloudflared:**
```yaml
services:
  tunnel:
    image: cloudflare/cloudflared:latest
    container_name: todos-tunnel
    command: tunnel --config /etc/cloudflared/config.yml run
    volumes:
      - ./cloudflared:/etc/cloudflared
    restart: unless-stopped
```

**cloudflared/config.yml:**
```yaml
tunnel: <tunnel-id>
credentials-file: /etc/cloudflared/<tunnel-id>.json
ingress:
  - hostname: do.yourdomain.com
    service: http://traefik:80
  - service: http_status:404
```

**Traefik — simplified (no TLS):**
```yaml
services:
  traefik:
    image: traefik:v3.3
    command:
      - --providers.docker=true
      - --providers.docker.exposedbydefault=false
      - --entrypoints.web.address=:80
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock:ro
```

### Frontend/backend changes
- Remove `ports:` from both
- Add Traefik labels for path-based routing
  - Backend: `PathPrefix(/api/v1)` + `PathPrefix(/docs,/redoc,/openapi.json)`
  - Frontend: `PathPrefix(/)` catch-all
- `NEXT_PUBLIC_API_URL` → `/api/v1` (relative)

### Setup steps
1. `docker pull cloudflare/cloudflared`
2. `docker run cloudflare/cloudflared tunnel login` (browser auth)
3. `docker run cloudflare/cloudflared tunnel create todos`
4. Write `cloudflared/config.yml` + `<tunnel-id>.json`
5. DNS: `do.yourdomain.com CNAME → <tunnel-id>.cfargotunnel.com`
6. Start stack

## Phase 2 — Auth Overhaul (done)

httpOnly cookies, refresh token rotation, GitHub/Google OAuth SSO, in-app password reset, session middleware for OAuth state CSRF.

## Phase 2b — OAuth Configurable Toggle

`ENABLE_GITHUB_OAUTH` / `ENABLE_GOOGLE_OAUTH` env vars with auto-detect. `GET /auth/config` endpoint for frontend to conditionally show OAuth buttons.

## Phase 2c — UI & API Polish (done)

- **Search flattens child tasks** — When search is active, child tasks appear as individual standalone cards with a parent goal badge.
- **Notification position** — Changed from `bottom-right` to `top-center` for better visibility.
- **Progress slider local state** — Dragging updates only local state; mutation fires once on pointer release.
- **Time entry edit/delete** — `PUT /tasks/{id}/time/{eid}` and `DELETE /tasks/{id}/time/{eid}` with inline edit UI. Maximum 1440 min per entry, validated frontend + backend.

## Phase 3 — Hardening

Cloudflare WAF rules, CSP headers, monitoring.

## Phase 3b — Rich Text Editing (done)

- **TipTap editor** — Task descriptions and comments use a full-featured TipTap-based `RichTextEditor` with extensions: tables, task lists, code block syntax highlighting, text alignment, links, images, and highlight colors.
- **Markdown notes** — Note editor has a Rich Text ↔ Markdown toggle button. Markdown content is rendered via `react-markdown` + `remark-gfm`. Content auto-detects HTML vs markdown on view.
- **Formatted content** — `FormattedContent` component renders rich text HTML with explicit Tailwind utility classes (no typography plugin).
- **Paste handler** — Pasting plain text with markdown syntax converts to HTML on the fly via `marked`.
- **Comment edit/delete** — Inline edit with save/cancel, delete with confirmation, revealed on hover beside timestamp.
- **Libraries added** — `marked` (markdown→HTML on paste), `react-markdown` + `remark-gfm` (markdown rendering), `lowlight` (code syntax highlighting in TipTap).
