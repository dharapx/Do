"use client";

import { useState, useRef, useCallback, useMemo, useEffect } from "react";
import { Save, Trash2, Pencil, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useUpdateNote, useDeleteNote } from "@/lib/hooks/use-notes";
import { toast } from "sonner";
import type { Note } from "@/lib/api/notes";
import { BlockNoteEditor, BlockNoteErrorBoundary } from "./blocknote-editor";
import type { BlockNoteEditorHandle } from "./blocknote-editor";

interface NoteEditorProps {
  note: Note;
  onDelete: () => void;
}

export function NoteEditor({ note, onDelete }: NoteEditorProps) {
  const updateNote = useUpdateNote();
  const deleteNote = useDeleteNote();
  const [title, setTitle] = useState(note.title);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [fallbackActive, setFallbackActive] = useState(false);
  const editorRef = useRef<BlockNoteEditorHandle>(null);

  useEffect(() => {
    const timer = setTimeout(() => setFallbackActive(true), 5000);
    return () => clearTimeout(timer);
  }, []);

  const trimmedTitle = useMemo(() => title.trim() || "Untitled Note", [title]);

  const handleSave = useCallback(() => {
    const doSave = () => {
      const editor = editorRef.current;
      if (!editor) {
        toast.error("Editor not ready. Please wait and try again.");
        return;
      }
      const currentContent = editor.getContent();
      if (!currentContent || currentContent === "[]") {
        toast.error("No content to save");
        return;
      }
      setSaving(true);
      updateNote.mutate(
        { id: note.id, data: { title: trimmedTitle, content: currentContent } },
        { onSettled: () => setSaving(false) }
      );
    };

    if (!editorRef.current) {
      toast.loading("Waiting for editor to load...");
      let attempts = 0;
      const retry = () => {
        if (editorRef.current) {
          toast.dismiss();
          doSave();
          return;
        }
        attempts++;
        if (attempts >= 5) {
          toast.dismiss();
          toast.error("Editor failed to load. Please refresh the page.");
          return;
        }
        setTimeout(retry, 200);
      };
      retry();
      return;
    }
    doSave();
  }, [trimmedTitle, note.id, updateNote]);

  const handleStartEditing = useCallback(() => {
    setTitle(note.title);
    setEditing(true);
  }, [note.title]);

  const handleStopEditing = useCallback(() => {
    if (editorRef.current) {
      handleSave();
    }
    setEditing(false);
  }, [handleSave]);

  const handleDelete = useCallback(() => {
    deleteNote.mutate(note.id, { onSuccess: onDelete });
  }, [deleteNote, note.id, onDelete]);

  return (
    <div className="flex-1 flex flex-col">
      <div className="flex items-center justify-between p-4 border-b gap-2 shrink-0">
        {editing ? (
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="text-lg font-semibold border-none shadow-none px-0 h-auto focus-visible:ring-0"
            placeholder="Note title..."
          />
        ) : (
          <h1 className="text-lg font-semibold px-0">{note.title || "Untitled Note"}</h1>
        )}
        <div className="flex items-center gap-1 shrink-0">
          {editing ? (
            <>
              <Button
                variant="default"
                size="sm"
                className="h-8 gap-1.5 text-xs"
                onClick={handleSave}
                disabled={saving}
              >
                <Save className="h-3.5 w-3.5" />
                {saving ? "Saving..." : "Save"}
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

      <div className="flex-1 overflow-y-auto">
        <BlockNoteErrorBoundary noteId={note.id}>
          <BlockNoteEditor
            ref={editorRef}
            noteId={note.id}
            content={note.content}
            editable={editing}
          />
        </BlockNoteErrorBoundary>
      </div>
    </div>
  );
}

export default NoteEditor;
