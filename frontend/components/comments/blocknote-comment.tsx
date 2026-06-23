"use client";

import { useRef, useEffect } from "react";
import { useCreateBlockNote } from "@blocknote/react";
import { BlockNoteView } from "@blocknote/mantine";
import { BlockNoteSchema, defaultBlockSpecs, defaultInlineContentSpecs, defaultStyleSpecs } from "@blocknote/core";

const schema = BlockNoteSchema.create({
  blockSpecs: defaultBlockSpecs,
  inlineContentSpecs: defaultInlineContentSpecs,
  styleSpecs: defaultStyleSpecs,
});

function parseBlocks(content: string | undefined | null) {
  if (!content) return undefined;
  try {
    if (content.startsWith("[")) {
      const blocks = JSON.parse(content);
      if (Array.isArray(blocks) && blocks.length > 0) return blocks;
    }
  } catch {}
  return undefined;
}

export function isCommentEmpty(content: string): boolean {
  if (!content) return true;
  try {
    if (content.startsWith("[")) {
      const blocks = JSON.parse(content);
      if (!Array.isArray(blocks) || blocks.length === 0) return true;
      if (blocks.length === 1) {
        const b = blocks[0];
        if (b.type === "paragraph" && (!b.content || b.content.length === 0)) return true;
      }
      return false;
    }
    return !content.trim();
  } catch {
    return !content.trim();
  }
}

interface BlockNoteCommentProps {
  content: string;
  onChange?: (content: string) => void;
  editable: boolean;
}

export function BlockNoteComment({ content, onChange, editable }: BlockNoteCommentProps) {
  const loadedRef = useRef(false);
  const blocks = parseBlocks(content);
  const editor = useCreateBlockNote({
    schema,
    initialContent: blocks || [{ type: "paragraph", content: [] }],
  });

  useEffect(() => {
    if (!editor || loadedRef.current) return;
    loadedRef.current = true;
    if (!blocks || editable) return;
    editor.replaceBlocks(editor.document, blocks);
  }, [editor, editable]);

  return (
    <BlockNoteView
      editor={editor}
      editable={editable}
      onChange={() => onChange?.(JSON.stringify(editor.document))}
    />
  );
}
