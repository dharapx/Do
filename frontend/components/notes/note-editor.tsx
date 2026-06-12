"use client";

import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { Save, Trash2, Pencil, Eye, FileText, Type } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useUpdateNote, useDeleteNote } from "@/lib/hooks/use-notes";
import { useQueries, useQuery } from "@tanstack/react-query";
import { tasksApi, type Task } from "@/lib/api/tasks";
import { STATUS_OPTIONS } from "@/lib/constants";
import { EditorToolbar } from "./editor-toolbar";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import Underline from "@tiptap/extension-underline";
import Highlight from "@tiptap/extension-highlight";
import TextAlign from "@tiptap/extension-text-align";
import { Table, TableRow, TableCell, TableHeader } from "@tiptap/extension-table";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight";
import { common, createLowlight } from "lowlight";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { Note } from "@/lib/api/notes";

const lowlight = createLowlight(common);

interface NoteEditorProps {
  note: Note;
  onDelete: () => void;
}

/** Parse task IDs from HTML content (both new <a data-task-id> and old @id: patterns) */
function extractTaskIds(html: string): number[] {
  const ids = new Set<number>();
  const tagRe = /data-task-id=["'](\d+)["']/g;
  let m;
  while ((m = tagRe.exec(html)) !== null) ids.add(Number(m[1]));
  const textRe = /@(\d+)/g;
  while ((m = textRe.exec(html)) !== null) ids.add(Number(m[1]));
  return Array.from(ids);
}

export function NoteEditor({ note, onDelete }: NoteEditorProps) {
  const updateNote = useUpdateNote();
  const deleteNote = useDeleteNote();
  const [title, setTitle] = useState(note.title);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isMarkdown, setIsMarkdown] = useState(false);
  const [markdownContent, setMarkdownContent] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestQuery, setSuggestQuery] = useState("");
  const [suggestionPos, setSuggestionPos] = useState({ top: 0, left: 0 });
  const suggestionRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<HTMLDivElement>(null);

  const extensions = useMemo(() => [
    StarterKit.configure({ codeBlock: false }),
    Image,
    Link.configure({ openOnClick: false }),
    Underline,
    Highlight,
    TextAlign.configure({ types: ["heading", "paragraph"] }),
    Table.configure({ resizable: true }),
    TableRow, TableCell, TableHeader,
    TaskList,
    TaskItem.configure({ nested: true }),
    CodeBlockLowlight.configure({ lowlight }),
    Placeholder.configure({ placeholder: "Start writing..." }),
  ], []);

  const handleEditorUpdate = useCallback(({ editor: ed }: { editor: any }) => {
    if (!editing) return;
    const pos = ed.state.selection.$anchor.pos;
    const textBefore = ed.state.doc.textBetween(Math.max(0, pos - 30), pos);
    const atMatch = textBefore.match(/@([^@\s]*)$/);
    if (atMatch) {
      try {
        const coords = ed.view.coordsAtPos(pos);
        if (coords && containerRef.current) {
          const containerRect = containerRef.current.getBoundingClientRect();
          setSuggestionPos({
            top: coords.bottom - containerRect.top + 2,
            left: coords.left - containerRect.left,
          });
        }
      } catch {}
      setSuggestQuery(atMatch[1]);
      setShowSuggestions(true);
    } else {
      setShowSuggestions(false);
      setSuggestQuery("");
    }
  }, [editing]);

  const editor = useEditor({
    extensions,
    content: note.content || "",
    editable: editing,
    onUpdate: handleEditorUpdate,
  });

  useEffect(() => {
    if (!editor) return;
    editor.setEditable(editing);
  }, [editing, editor]);

  useEffect(() => {
    if (!editor) return;
    if (note.content !== editor.getHTML()) {
      editor.commands.setContent(note.content || "");
    }
  }, [note.id]);

  useEffect(() => {
    setTitle(note.title);
  }, [note.id, note.title]);

  const { data: suggestions } = useQuery({
    queryKey: ["task-suggestions", suggestQuery],
    queryFn: () => tasksApi.fetchTasks({ keyword: suggestQuery, limit: 5 }),
    enabled: suggestQuery.length > 0 && editing,
  });

  const taskSuggestions = (suggestions?.items || []).filter((t) => {
    const html = editor?.getHTML() || "";
    return !html.includes(`@${t.id}:`) && !html.includes(`data-task-id="${t.id}"`);
  });

  const insertTaskRef = useCallback(
    (task: Task) => {
      if (!editor) return;
      const { selection } = editor.state;
      const pos = selection.$anchor.pos;
      const doc = editor.state.doc;
      const textBefore = doc.textBetween(Math.max(0, pos - 30), pos);
      const atIndex = textBefore.lastIndexOf("@");
      const linkHtml = `<a href="/tasks/${task.id}" data-task-id="${task.id}">${task.title}</a> `;
      if (atIndex !== -1) {
        const from = Math.max(0, pos - textBefore.length) + atIndex;
        editor.chain().focus().deleteRange({ from, to: pos }).insertContent(linkHtml).run();
      } else {
        editor.chain().focus().insertContent(linkHtml).run();
      }
      setShowSuggestions(false);
      setSuggestQuery("");
    },
    [editor]
  );

  /** Enhance DOM in view mode: add tooltips and upgrade old-format @id references */
  const refTaskIds = useMemo(() => extractTaskIds(note.content || ""), [note.content]);
  const refQueryResults = useQueries({
    queries: refTaskIds.map((id) => ({
      queryKey: ["task", id],
      queryFn: () => tasksApi.fetchTask(id),
      staleTime: 60_000,
      retry: 0,
    })),
  });

  const refTaskMap = useMemo(() => {
    const map: Record<number, Task | null> = {};
    refQueryResults.forEach((r, i) => {
      if (r.data) map[refTaskIds[i]] = r.data;
      else if (r.isError) map[refTaskIds[i]] = null;
    });
    return map;
  }, [refQueryResults, refTaskIds]);

  useEffect(() => {
    if (editing || !viewRef.current) return;
    const root = viewRef.current;

    // Add title tooltips to existing [data-task-id] links
    root.querySelectorAll<HTMLAnchorElement>("a[data-task-id]").forEach((a) => {
      const id = Number(a.dataset.taskId);
      const task = refTaskMap[id];
      if (task) {
        a.title = `${task.title} — Status: ${STATUS_OPTIONS[task.status] || task.status}`;
      } else if (task === null) {
        a.title = "Task not found";
      }
    });

    // Upgrade old-format @id: Title text nodes to links
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    const replacements: { text: string; node: Text; id: number; title: string }[] = [];
    while (walker.nextNode()) {
      const node = walker.currentNode as Text;
      const match = node.textContent?.match(/@(\d+):\s*([^<]+?)(?=\.|!|\?|,|;|:|\s|$)/);
      if (match) {
        const id = Number(match[1]);
        const rawTitle = match[2].trim();
        const task = refTaskMap[id];
        const title = task?.title || rawTitle;
        const fullMatch = match[0];
        const idx = node.textContent!.indexOf(fullMatch);
        if (idx !== -1) {
          replacements.push({ text: fullMatch, node, id, title });
        }
      }
      // Also handle @id without title: e.g. @10
      const bareMatch = node.textContent?.match(/@(\d+)\b(?!:)/);
      if (bareMatch && !node.textContent?.match(/@(\d+):/)) {
        const id = Number(bareMatch[1]);
        const task = refTaskMap[id];
        const title = task?.title || `Task #${id}`;
        const fullMatch = bareMatch[0];
        const idx = node.textContent!.indexOf(fullMatch);
        if (idx !== -1) {
          replacements.push({ text: fullMatch, node, id, title });
        }
      }
    }
    for (const r of replacements) {
      const span = document.createElement("a");
      span.href = `/tasks/${r.id}`;
      span.target = "_blank";
      const task = refTaskMap[r.id];
      if (task) {
        span.title = `${r.title} — Status: ${STATUS_OPTIONS[task.status] || task.status}`;
      }
      span.className = "inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-primary/10 text-primary font-medium hover:bg-primary/20 transition-colors no-underline";
      span.textContent = r.title;
      const fragment = r.node.splitText(r.node.textContent!.indexOf(r.text));
      const after = fragment.splitText(r.text.length);
      fragment.parentNode?.replaceChild(span, fragment);
    }
  }, [editing, refTaskMap]);

  const handleSave = () => {
    setSaving(true);
    const content = isMarkdown ? markdownContent : (editor?.getHTML() || "");
    updateNote.mutate(
      { id: note.id, data: { title, content } },
      { onSettled: () => setSaving(false) }
    );
  };

  const handleStartEditing = () => {
    const looksLikeMarkdown = note.content ? !note.content.startsWith("<") : false;
    setIsMarkdown(looksLikeMarkdown);
    if (looksLikeMarkdown) {
      setMarkdownContent(note.content);
    }
    setEditing(true);
  };

  const handleStopEditing = () => {
    const currentContent = isMarkdown ? markdownContent : (editor?.getHTML() || "");
    if (title !== note.title || currentContent !== note.content) {
      handleSave();
    }
    setEditing(false);
  };

  const handleDelete = () => {
    deleteNote.mutate(note.id, { onSuccess: onDelete });
  };

  const toggleFormat = () => {
    if (isMarkdown) {
      setIsMarkdown(false);
      setMarkdownContent("");
    } else {
      setIsMarkdown(true);
      setMarkdownContent(editor?.getText() || "");
    }
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        suggestionRef.current &&
        !suggestionRef.current.contains(e.target as Node) &&
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const hasChanges = useMemo(
    () => {
      if (title !== note.title) return true;
      if (isMarkdown) return markdownContent !== note.content;
      return editor ? editor.getHTML() !== note.content : false;
    },
    [title, note.title, editor, note.content, isMarkdown, markdownContent]
  );

  return (
    <div className="flex-1 flex flex-col" ref={containerRef}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b gap-2">
        {editing ? (
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="text-lg font-semibold border-none shadow-none px-0 h-auto focus-visible:ring-0"
            placeholder="Note title..."
          />
        ) : (
          <h1 className="text-lg font-semibold px-0">{title}</h1>
        )}
        <div className="flex items-center gap-1 shrink-0">
          {editing ? (
            <>
              <Button
                variant="default"
                size="sm"
                className="h-8 gap-1.5 text-xs"
                onClick={handleSave}
                disabled={!hasChanges || saving}
              >
                <Save className="h-3.5 w-3.5" />
                {saving ? "Saving..." : "Save"}
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={toggleFormat}
                title={isMarkdown ? "Switch to Rich Text" : "Switch to Markdown"}
              >
                {isMarkdown ? <Type className="h-4 w-4" /> : <FileText className="h-4 w-4" />}
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={handleStopEditing}
                title="View mode"
              >
                <Eye className="h-4 w-4" />
              </Button>
            </>
          ) : (
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={handleStartEditing}
              title="Edit"
            >
              <Pencil className="h-4 w-4" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-destructive"
            onClick={handleDelete}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto relative">
        {editing ? (
          isMarkdown ? (
            <Textarea
              value={markdownContent}
              onChange={(e) => setMarkdownContent(e.target.value)}
              className="min-h-full border-none rounded-none p-4 font-mono text-sm resize-none focus-visible:ring-0"
              placeholder="Start writing in Markdown..."
            />
          ) : (
            <>
              <EditorToolbar editor={editor} />
              <EditorContent editor={editor} className="min-h-full" />
              {showSuggestions && taskSuggestions.length > 0 && (
                <div
                  ref={suggestionRef}
                  className="absolute z-50 rounded-lg border bg-popover shadow-lg max-h-40 overflow-y-auto min-w-[200px]"
                  style={{ top: suggestionPos.top, left: suggestionPos.left }}
                >
                  {taskSuggestions.map((task) => (
                    <button
                      key={task.id}
                      onClick={() => insertTaskRef(task)}
                      className="w-full text-left px-3 py-2 text-xs hover:bg-muted transition-colors flex items-center gap-2"
                    >
                      <span className="text-primary font-mono shrink-0">@{task.id}</span>
                      <span className="truncate"> — {task.title}</span>
                    </button>
                  ))}
                </div>
              )}
            </>
          )
        ) : (
          <div className="p-4" ref={viewRef}>
            {note.content ? (
              note.content.startsWith("<") ? (
                <div
                  className="ProseMirror"
                  dangerouslySetInnerHTML={{ __html: note.content }}
                />
              ) : (
                <div className="prose prose-sm max-w-none dark:prose-invert">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {note.content}
                  </ReactMarkdown>
                </div>
              )
            ) : (
              <p className="text-muted-foreground italic text-sm">Empty note</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
