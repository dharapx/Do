# Session Summary

## Goal
- Replace TipTap with BlockNote for the note editor. Remove markdown mode entirely. Full rich text via BlockNote with code block language support, file attachments, and @task inline mentions. Match app theme via CSS variable overrides.

## Constraints & Preferences
- **BlockNote** as the sole editor — no TipTap, no markdown, no format toggle.
- **Content stored as BlockNote JSON** (stringified array of blocks). Existing HTML notes converted via `tryParseHTMLToBlocks()` on a one-time migration page.
- **File attachments** stored via backend `attachments` table with `note_id` FK (reuses existing upload pattern).
- **Theme** matched via `--bn-colors-*` CSS variable overrides mapped to app's warm-tone HSL variables.
- **`/` key** in header now checks `isContentEditable` to avoid intercepting BlockNote's slash menu.

## Progress
### Done
- **Backend**: alembic migration `0011` drops `is_markdown`, adds nullable `note_id` to `attachments`. Updated Note model/schema/CRUD. Added `POST/GET/DELETE /notes/{id}/attachments` endpoints.
- **Migration 0011 applied to DB**: `alembic_version` now at `0011`, columns confirmed.
- **Entrypoint fixed**: `backend/entrypoint.sh` now resolves the two-branch alembic migration graph (numbered chain from `0004` vs hash chain `245236f525fe`→`2e2e714bb15c`) by checking current revision and stamping appropriately.
- **Revision ID shortened**: Migration `0011` uses revision ID `0011` (was 51 chars; `alembic_version.version_num` is `varchar(32)`).
- **Editor**: `BlockNoteEditor` with custom schema (code block + Shiki 11 langs, @task mentions via real task API, file upload, HTML→JSON import).
- **Note editor**: Rewritten via `next/dynamic` `ssr: false` — view/edit toggle via `editable` prop.
- **Theme**: `--bn-colors-*` CSS variables mapped to warm-tone HSL. Dark mode. `.note-content-viewer` for read-only.
- **`/` key fix**: `isContentEditable` guard in header.
- **Dependency cleanup**: removed `@tiptap/*`, `lowlight`, `marked`, `turndown`, `react-markdown`, `remark-gfm`.
- **Migration page**: `/notes/migrate`, progress bar, error reporting, auto-detect banner.
- **Build passes** — Next.js 14.2.35 compiles cleanly.

### In Progress
- (none)

### Blocked
- (none)

## Key Decisions
- **One-time migration** over lazy conversion — dedicated `/notes/migrate` page uses browser-side `tryParseHTMLToBlocks()`.
- **Full DB-backed attachments** — reuses `attachments` table with nullable `note_id` FK (task_id also nullable now). Same upload CRUD, same file storage.
- **CSS variable theming** — override BlockNote's `--bn-colors-*` vars with app's HSL values. No Mantine theme config needed beyond `<MantineProvider>` wrapper.
- **Ref-based content access** — `BlockNoteEditor` exposes `getContent()` via `useImperativeHandle`/`forwardRef`. Parent calls it on save.
- **`request()` handles FormData** — modified `api.post` to skip `Content-Type: application/json` and `JSON.stringify` when body is `FormData`.

## Next Steps
1. Test note creation/editing/saving via UI at `http://localhost:3000/notes`.
2. Test `/notes/migrate` with existing HTML notes.
3. Test `@` task mentions (queries real task API).
4. Test file upload (drag image into editor).
5. Test `/` block menu in editor (should not trigger search).
6. Test dark mode theme toggle.

## Relevant Files
### Backend
- **`backend/alembic/versions/0011_drop_is_markdown_add_note_id_to_attachments.py`**: Migration — drops `is_markdown`, adds `note_id` to `attachments`. Revision ID shortened to `0011` (fits `varchar(32)`).
- **`backend/entrypoint.sh`**: Updated — detects hash branch (`2e2e714bb15c`), stamps to main chain, then applies target migration.
- **`backend/app/models/note.py`**: No `is_markdown`, has `attachments` relationship.
- **`backend/app/models/attachment.py`**: Added nullable `note_id` FK.
- **`backend/app/schemas/note.py`**: No `is_markdown`, added `NoteAttachmentResponse`.
- **`backend/app/crud/note.py`**: No `is_markdown` references.
- **`backend/app/crud/attachment.py`**: Generalized `create()` for both task/note.
- **`backend/app/api/v1/notes.py`**: Added `POST/GET/DELETE /notes/{id}/attachments`.

### Frontend
- **`frontend/components/notes/blocknote-editor.tsx`**: BlockNote editor with schema, upload, @mentions.
- **`frontend/components/notes/blocknote-task-mention.tsx`**: Custom inline content spec for @task.
- **`frontend/components/notes/note-editor.tsx`**: Rewritten — BlockNote via dynamic import, view/edit header.
- **`frontend/components/notes/notes-migration.tsx`**: Migration page component.
- **`frontend/app/notes/migrate/page.tsx`**: Migration route.
- **`frontend/app/notes/page.tsx`**: Migration banner on HTML detection.
- **`frontend/app/globals.css`**: `--bn-colors-*` overrides, `.note-content-viewer` styles.
- **`frontend/app/layout.tsx`**: Added `<MantineProvider>` + CSS imports.
- **`frontend/components/layout/header.tsx`**: `isContentEditable` guard for `/` key.
- **`frontend/lib/api/notes.ts`**: No `is_markdown`. Added `uploadAttachment`.
- **`frontend/lib/api/client.ts`**: `post()` handles FormData, `request()` skips JSON Content-Type for FormData.
- **`frontend/next.config.js`**: `transpilePackages` for `@blocknote`, `@mantine`, `@shikijs`.

### Deleted
- `editor-toolbar.tsx` (notes/ and ui/), `rich-text-editor.tsx`, `spike/*`
