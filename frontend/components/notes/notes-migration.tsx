"use client";

import { useState, useRef, useCallback } from "react";
import { useNotes, useUpdateNote } from "@/lib/hooks/use-notes";
import { useCreateBlockNote } from "@blocknote/react";
import { Button } from "@/components/ui/button";
import {
  BlockNoteSchema,
  defaultBlockSpecs,
  defaultInlineContentSpecs,
  defaultStyleSpecs,
  createCodeBlockSpec,
} from "@blocknote/core";
import { CheckCircle2, AlertCircle, Loader2 } from "lucide-react";

const schema = BlockNoteSchema.create({
  blockSpecs: { ...defaultBlockSpecs, codeBlock: createCodeBlockSpec({}) },
  inlineContentSpecs: defaultInlineContentSpecs,
  styleSpecs: defaultStyleSpecs,
});

export function NotesMigration() {
  const { data, isLoading: notesLoading } = useNotes();
  const updateNote = useUpdateNote();
  const [status, setStatus] = useState<"idle" | "running" | "done" | "error">("idle");
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [errors, setErrors] = useState<string[]>([]);
  const hasRun = useRef(false);

  const editor = useCreateBlockNote({
    schema,
    initialContent: [{ type: "paragraph", content: [] }],
  });

  const notes = data?.items || [];
  const htmlNotes = notes.filter(
    (n) => n.content && n.content.startsWith("<") && !n.content.startsWith("[")
  );

  const runMigration = useCallback(async () => {
    if (!editor || hasRun.current) return;
    hasRun.current = true;
    setStatus("running");
    setProgress({ current: 0, total: htmlNotes.length });

    const errs: string[] = [];
    for (let i = 0; i < htmlNotes.length; i++) {
      const note = htmlNotes[i];
      try {
        const blocks = await editor.tryParseHTMLToBlocks(note.content);
        const jsonContent = JSON.stringify(blocks || []);
        await updateNote.mutateAsync({
          id: note.id,
          data: { content: jsonContent },
        });
      } catch (e) {
        errs.push(`Note #${note.id} "${note.title}": ${e}`);
      }
      setProgress({ current: i + 1, total: htmlNotes.length });
    }

    setErrors(errs);
    setStatus(errs.length === htmlNotes.length ? "error" : "done");
  }, [editor, htmlNotes, updateNote]);

  if (notesLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (htmlNotes.length === 0) {
    return (
      <div className="text-center py-12 space-y-3">
        <CheckCircle2 className="h-12 w-12 mx-auto text-green-500" />
        <h2 className="text-lg font-semibold">All Notes Are Up to Date</h2>
        <p className="text-sm text-muted-foreground">
          No HTML notes need migration. All notes are already in BlockNote format.
        </p>
        <Button onClick={() => window.location.href = "/notes"} variant="outline" size="sm">
          Back to Notes
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-lg font-semibold">Migrate Notes to BlockNote</h2>
        <p className="text-sm text-muted-foreground">
          {htmlNotes.length} note{htmlNotes.length !== 1 ? "s" : ""} need{htmlNotes.length === 1 ? "s" : ""} to be
          converted from HTML to BlockNote format. This is a one-time migration.
        </p>
      </div>

      {status === "running" && (
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span>Converting... ({progress.current}/{progress.total})</span>
            <span>{Math.round((progress.current / progress.total) * 100)}%</span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-300 rounded-full"
              style={{ width: `${(progress.current / progress.total) * 100}%` }}
            />
          </div>
        </div>
      )}

      {status === "done" && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm text-green-600">
            <CheckCircle2 className="h-4 w-4" />
            <span>
              Successfully converted {progress.total - errors.length} of {progress.total} note{progress.total !== 1 ? "s" : ""}.
            </span>
          </div>
          {errors.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium text-destructive flex items-center gap-1">
                <AlertCircle className="h-4 w-4" />
                {errors.length} error{errors.length !== 1 ? "s" : ""}:
              </p>
              <ul className="text-xs text-muted-foreground space-y-1 max-h-32 overflow-y-auto">
                {errors.map((e, i) => (
                  <li key={i}>{e}</li>
                ))}
              </ul>
            </div>
          )}
          <Button onClick={() => window.location.href = "/notes"} size="sm">
            Go to Notes
          </Button>
        </div>
      )}

      {status === "error" && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm text-destructive">
            <AlertCircle className="h-4 w-4" />
            <span>All conversions failed. Check the errors below.</span>
          </div>
          <ul className="text-xs text-muted-foreground space-y-1 max-h-40 overflow-y-auto">
            {errors.map((e, i) => (
              <li key={i}>{e}</li>
            ))}
          </ul>
          <Button onClick={() => { hasRun.current = false; setStatus("idle"); }} variant="outline" size="sm">
            Retry
          </Button>
        </div>
      )}

      {status === "idle" && (
        <div className="flex justify-center">
          <Button onClick={runMigration} size="sm">
            Start Migration
          </Button>
        </div>
      )}
    </div>
  );
}

export default NotesMigration;
