"use client";

import { useState } from "react";
import { format } from "date-fns";
import { Plus, FileText, Search, ArrowLeft, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useNotes, useCreateNote, useDeleteNote } from "@/lib/hooks/use-notes";
import { NoteEditor } from "@/components/notes/note-editor";

export default function NotesPage() {
  const { data, isLoading } = useNotes();
  const createNote = useCreateNote();
  const deleteNote = useDeleteNote();
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isNotesCollapsed, setIsNotesCollapsed] = useState(false);

  const notes = data?.items || [];
  const selected = notes.find((n) => n.id === selectedId);

  const filtered = searchQuery
    ? notes.filter(
        (n) =>
          n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          n.content.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : notes;

  const handleCreate = () => {
    createNote.mutate(
      { title: "Untitled Note", content: "", is_markdown: true },
      {
        onSuccess: (note) => setSelectedId(note.id),
      }
    );
  };

  const handleSelect = (id: number) => {
    setSelectedId(id);
  };

  const handleBack = () => {
    setSelectedId(null);
  };

  return (
    <div className="flex h-[calc(100vh-3.5rem)] gap-0 relative">
      <div className={`shrink-0 border-r flex flex-col transition-all duration-300 relative ${isNotesCollapsed ? 'w-0' : 'w-72'}`}>
        <div className="p-3 border-b space-y-2">
          <Button onClick={handleCreate} className="w-full justify-start gap-2" size="sm">
            <Plus className="h-4 w-4" />
            New Note
          </Button>
          <div className="relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Search notes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-7 h-8 text-xs"
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="space-y-2 p-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-16 rounded-lg" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <FileText className="h-8 w-8 mb-2" />
              <p className="text-sm">No notes yet</p>
            </div>
          ) : (
            <div className="p-2 space-y-1">
              {filtered.map((note) => (
                <button
                  key={note.id}
                  onClick={() => handleSelect(note.id)}
                  className={`w-full text-left p-3 rounded-lg transition-colors text-sm ${
                    selectedId === note.id
                      ? "bg-primary/10 text-primary"
                      : "hover:bg-muted"
                  }`}
                >
                  <p className="font-medium truncate">{note.title}</p>
                  <p className="text-xs text-muted-foreground truncate mt-0.5">
                    {/* Glimpse of actual note */}
                    {note.content
                      ? note.content.startsWith("[")
                        ? JSON.parse(note.content).map((b: any) => b.content?.map((c: any) => c.text).join(" ")).join(" ").slice(0, 120)
                        : note.content.replace(/<[^>]*>/g, "").trim().slice(0, 120)
                      : "Empty note"}
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-1">
                    {format(new Date(note.updated_at), "MMM d, yyyy HH:mm")}
                  </p>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <Button
        variant="ghost"
        size="icon"
        className="absolute top-2 left-2 z-10"
        onClick={() => setIsNotesCollapsed(!isNotesCollapsed)}
      >
        {isNotesCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
      </Button>

      <div className={`flex-1 flex flex-col ${selectedId ? "flex" : "hidden"} md:flex`}>
        {selected ? (
          <>
            <div className="md:hidden flex items-center gap-2 px-2 py-1.5 border-b">
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleBack}>
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <span className="text-xs font-medium truncate">{selected.title}</span>
            </div>
            <NoteEditor
              key={selected.id}
              note={selected}
              onDelete={() => {
                deleteNote.mutate(selected.id);
                setSelectedId(null);
              }}
            />
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <FileText className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p className="text-sm">Select a note or create a new one</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
