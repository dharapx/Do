"use client";

import { useState, useRef, useCallback, useMemo } from "react";
import { Save, Trash2, Pencil, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useUpdateNote, useDeleteNote } from "@/lib/hooks/use-notes";
import type { Note } from "@/lib/api/notes";
import dynamic from "next/dynamic";
import type { BlockNoteEditorHandle } from "./blocknote-editor";

const BlockNoteEditor = dynamic(() => import("./blocknote-editor"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center py-12">
      <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
    </div>
  ),
});

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
  const editorRef = useRef<BlockNoteEditorHandle>(null);

  const trimmedTitle = useMemo(() => title.trim() || "Untitled Note", [title]);

  const handleSave = useCallback(() => {
    setSaving(true);
    const content = editorRef.current?.getContent() || note.content;
    updateNote.mutate(
      { id: note.id, data: { title: trimmedTitle, content } },
      { onSettled: () => setSaving(false) }
    );
  }, [trimmedTitle, note.id, note.content, updateNote]);

  const handleStartEditing = useCallback(() => {
    setTitle(note.title);
    setEditing(true);
  }, [note.title]);

  const handleStopEditing = useCallback(() => {
    handleSave();
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
        <BlockNoteEditor
          ref={editorRef}
          noteId={note.id}
          content={note.content}
          editable={editing}
        />
      </div>
    </div>
  );
}

export default NoteEditor;
