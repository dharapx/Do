# Session Summary

## Goal
- Note editor: allow user to pick a format (markdown or rich text) at edit start, stay in that format with no cross-format conversion. In markdown mode, only toggle between raw textarea and rendered preview. In rich text mode, only TipTap editor with toolbar.

## Constraints & Preferences
- **No cross-format conversion** — `<img>` tags, base64 data URLs, and all content preserve byte-for-byte. `turndown`, format-toggle buttons, and `switchToMarkdown`/`switchToRichtext` functions all removed.
- Markdown mode: user writes in a `<textarea>`, preview renders via `marked.parse` + `dangerouslySetInnerHTML`. Toggle is Edit ↔ Preview only via tab bar (Code2/EyeOff icons).
- Rich text mode: TipTap editor with full toolbar (bold, italic, underline, headings, lists, tables, code blocks, links, images, text alignment, highlight, undo/redo). No MD/RT toggle button.
- Format detected on edit start via `note.is_markdown` flag (persisted), with content heuristic (`<html>` check) fallback for notes without the flag.
- New notes default to `is_markdown: true` (handled by backend schema default).
- View mode (non-editing): renders via `marked.parse` if `is_markdown` is true, otherwise renders raw HTML directly.

## Progress
### Done
- Removed `turndown` import/instantiation from `note-editor.tsx`.
- Removed `switchToMarkdown`, `switchToRichtext`, `imageMapRef`, and all format-toggle buttons from both toolbars.
- Markdown mode now has only Edit (Code2) / Preview (EyeOff) tab toggle with textarea and rendered preview.
- Rich text mode has only TipTap editor + `EditorToolbar` (no MD button).
- `handleStartEditing` detects format from `note.is_markdown` or content heuristic.
- View mode renders based on `note.is_markdown` flag.
- Full Next.js build passes with no errors (compiled + type-checked).

### In Progress
- (none)

### Blocked
- (none)

## Key Decisions
- **No cross-format conversion ever** — user picks a format when starting to edit and stays in it. The previous architecture had a toggle that converted HTML ↔ Markdown via `turndown`/`marked`, which lost images on round-trip. Deleted entirely.
- **`detectFormat` heuristic** — checks if trimmed content starts with `<(\w+)[^>]*>` to identify rich text. Falls back to markdown. Only used when `note.is_markdown` is not explicitly set.
- **`Image.configure({ inline: true })`** — keeps TipTap from dropping `<img>` nodes when they appear inside `<p>` tags (produced by `marked.parse` in preview/view).
- **Save always sets `is_markdown`** — `handleSave` passes `is_markdown: (inputMode === "markdown")` to the update mutation, ensuring the flag stays consistent with the actual format.

## Next Steps
1. Test locally: create a note, switch between formats, verify images/data URLs survive in the chosen format.
2. Commit to `feat/note-editor` branch, create PR.

## Relevant Files
- **`frontend/components/notes/note-editor.tsx`**: Rewritten — no cross-format conversion, markdown mode uses textarea+preview tabs, richtext mode uses TipTap editor only.
- **`frontend/lib/api/notes.ts`**: `Note` interface includes `is_markdown: boolean`.
- **`backend/app/models/note.py`**: Has `is_markdown: bool` column.
- **`backend/app/schemas/note.py`**: `NoteCreate`, `NoteUpdate`, `NoteResponse` include `is_markdown`.
- **`backend/alembic/versions/0010_add_is_markdown_to_notes.py`**: Migration adding the column.
