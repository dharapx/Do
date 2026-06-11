"use client";

import { useState, useMemo } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";

const sections = [
  {
    title: "Getting Started",
    items: [
      "Create an account via the Sign Up page, then log in to access the dashboard.",
      "The sidebar on the left provides navigation to Dashboard, Tasks, Notes, Help, and About.",
      "Toggle dark/light mode using the button at the bottom of the sidebar.",
    ],
  },
  {
    title: "Dashboard",
    items: [
      "The dashboard shows an overview of your task activity and status.",
      "Top stat cards show pending, not started, in progress, and urgent task counts (all-time).",
      "Use the duration selector (1d, 2d, 3d, 7d, 15d, 30d, Custom) to filter the charts and activity panels below.",
      "The Status Distribution pie chart shows task breakdown filtered by the selected date range.",
      "The Priority Breakdown bar chart shows task counts by priority level.",
      "The Quick Actions panel provides shortcuts to View All Tasks and create a New Note.",
      "The Summary section shows overall completion rate and average progress as ring charts.",
      "The Recent Activity panel lists the 5 most recently updated tasks. Use the refresh button to reload.",
      "The Time Spent table shows time logged per task per day for the selected duration.",
      "Use the maximize button on panels for a focused view.",
    ],
  },
  {
    title: "Tasks",
    items: [
      "The Tasks page lists all your tasks with columns for ID, Title, Status, Priority, and Progress.",
      "Click the New Task button to create a task with title, description, priority, and tags.",
      "Click a task row to view and edit full task details including comments, time tracking, and history.",
      "Filter tasks using status, priority, and search options.",
      "Task statuses: Not Started, In Progress, Done, Won't Do.",
      "Task priorities: Urgent, High, Medium, Low.",
      "Progress can be set from 0-100%. Setting progress to 100% auto-marks the task as Done.",
      "Add comments to tasks for collaboration notes.",
      "Track time spent on tasks with start/stop or manual entry.",
      "View task history to see all changes made.",
      "Use keyboard shortcuts: Enter to save, Escape to cancel.",
    ],
  },
  {
    title: "Notes",
    items: [
      "The Notes page has a split-panel layout: the left panel lists notes, the right panel shows the selected note.",
      "Click New Note to create a blank note with an auto-generated title.",
      "Search notes by title or content using the search bar.",
      "Notes support rich text formatting via the TipTap editor.",
      "Use the formatting toolbar for bold, italic, underline, strikethrough, headings, lists, code blocks, blockquotes, links, images, tables, text alignment, and highlight.",
      "Insert task references by typing @ followed by a task ID or title. Select from the autocomplete dropdown.",
      "Task references render as clickable links in view mode. Hover to see the task status.",
      "Toggle between View and Edit mode using the pencil/eye icon in the header.",
      "Changes are saved manually with the Save button.",
      "On mobile, selecting a note hides the list panel so the editor takes full screen. Use the back button to return to the list.",
    ],
  },
  {
    title: "Rich Text Editor (TipTap)",
    items: [
      "Bold: Ctrl+B",
      "Italic: Ctrl+I",
      "Underline: Ctrl+U",
      "Strikethrough: Ctrl+Shift+S",
      "Headings: Select from the heading dropdown (Paragraph, H1, H2, H3).",
      "Bullet List, Ordered List, Task List: Toggle buttons in the toolbar.",
      "Code Block: Insert a code block with syntax highlighting for 37+ languages.",
      "Blockquote: Format text as a quoted block.",
      "Link: Select text and click the link button to add a URL.",
      "Image: Upload images directly — they are stored as embedded data in the note.",
      "Table: Insert a 3x3 table with header row. Resize columns by dragging.",
      "Text Alignment: Align text left, center, or right.",
      "Highlight: Highlight text with a yellow marker.",
      "Undo/Redo: Use toolbar buttons or Ctrl+Z / Ctrl+Shift+Z.",
    ],
  },
  {
    title: "Keyboard Shortcuts",
    items: [
      "Ctrl+B: Bold",
      "Ctrl+I: Italic",
      "Ctrl+U: Underline",
      "Ctrl+Z: Undo",
      "Ctrl+Shift+Z: Redo",
      "Escape: Close autocomplete suggestions or cancel editing.",
      "In task detail: Enter to save, Escape to cancel.",
    ],
  },
  {
    title: "Account",
    items: [
      "Your session is secured with JWT authentication.",
      "Tokens are stored in your browser and persist across page refreshes.",
      "Log out by clearing your session (future update).",
    ],
  },
  {
    title: "Technical Details",
    items: [
      "Frontend: Next.js 14 (App Router), TypeScript, Tailwind CSS, shadcn/ui, TipTap, React Query, Zustand.",
      "Backend: FastAPI, SQLAlchemy, Alembic, Pydantic, Python 3.12.",
      "Database: PostgreSQL.",
      "Deployment: Docker Compose — all services run in containers.",
      "API docs available at /docs on the backend port (8000).",
    ],
  },
];

export default function HelpPage() {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    if (!query) return sections;
    const q = query.toLowerCase();
    return sections
      .map((s) => ({
        ...s,
        items: s.items.filter((i) => i.toLowerCase().includes(q)),
      }))
      .filter((s) => s.items.length > 0);
  }, [query]);

  return (
    <div className="max-w-3xl mx-auto py-6 space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight">Help</h1>
        <p className="text-sm text-muted-foreground">
          Search for topics or browse the guide below.
        </p>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search help topics..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-9 h-9"
        />
      </div>

      {filtered.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8">
          No results found for &ldquo;{query}&rdquo;
        </p>
      ) : (
        filtered.map((section) => (
          <section key={section.title}>
            <h2 className="text-lg font-semibold mb-2">{section.title}</h2>
            <ul className="space-y-1.5">
              {section.items.map((item, i) => (
                <li key={i} className="text-sm text-foreground/80 leading-relaxed flex gap-2">
                  <span className="text-primary mt-1 shrink-0">•</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </section>
        ))
      )}
    </div>
  );
}
