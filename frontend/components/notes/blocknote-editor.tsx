"use client";

import { useEffect, useRef, useImperativeHandle, forwardRef } from "react";
import {
  useCreateBlockNote,
  SuggestionMenuController,
  DefaultReactSuggestionItem,
} from "@blocknote/react";

import { BlockNoteView } from "@blocknote/mantine";
import {
  BlockNoteSchema,
  defaultBlockSpecs,
  defaultInlineContentSpecs,
  defaultStyleSpecs,
  createCodeBlockSpec,
  filterSuggestionItems,
} from "@blocknote/core";
import { notesApi } from "@/lib/api/notes";
import { tasksApi } from "@/lib/api/tasks";
import { TaskMention, type TaskMentionInlineContent } from "./blocknote-task-mention";

const SUPPORTED_LANGUAGES = {
  json: { name: "JSON", aliases: ["json"] },
  yaml: { name: "YAML", aliases: ["yml", "yaml"] },
  python: { name: "Python", aliases: ["py"] },
  shell: { name: "Shell", aliases: ["bash", "sh"] },
  java: { name: "Java", aliases: [] },
  javascript: { name: "JavaScript", aliases: ["js"] },
  typescript: { name: "TypeScript", aliases: ["ts"] },
  css: { name: "CSS", aliases: [] },
  html: { name: "HTML", aliases: [] },
  sql: { name: "SQL", aliases: [] },
};

const schema = BlockNoteSchema.create({
  blockSpecs: {
    ...defaultBlockSpecs,
    codeBlock: createCodeBlockSpec({
      indentLineWithTab: true,
      defaultLanguage: "text",
      supportedLanguages: SUPPORTED_LANGUAGES,
      createHighlighter: async () => {
        const { createHighlighter } = await import("shiki");
        return createHighlighter({
          themes: ["github-light", "github-dark"],
          langs: Object.keys(SUPPORTED_LANGUAGES),
        });
      },
    }),
  },
  inlineContentSpecs: {
    ...defaultInlineContentSpecs,
    taskMention: TaskMention,
  },
  styleSpecs: defaultStyleSpecs,
});

export interface BlockNoteEditorHandle {
  getContent: () => string;
}

interface BlockNoteEditorProps {
  noteId: number;
  content: string;
  editable: boolean;
}

export const BlockNoteEditor = forwardRef<BlockNoteEditorHandle, BlockNoteEditorProps>(
  function BlockNoteEditor({ noteId, content, editable }, ref) {
    const loadedRef = useRef(false);

    const editor = useCreateBlockNote({
      schema,
      initialContent: [{ type: "paragraph", content: [] }],
      uploadFile: async (file: File): Promise<string> => {
        const attachment = await notesApi.uploadAttachment(noteId, file);
        const base = process.env.NEXT_PUBLIC_API_URL || "/api/v1";
        return `${base}/notes/${noteId}/attachments/${attachment.id}`;
      },
      resolveFileUrl: async (url: string): Promise<string> => url,
    });

    useImperativeHandle(ref, () => ({
      getContent: () => JSON.stringify(editor?.document || []),
    }), [editor]);

    useEffect(() => {
      if (!editor || loadedRef.current) return;
      loadedRef.current = true;
      loadContent(editor, content);
    }, [editor, content]);

    return (
      <BlockNoteView editor={editor} editable={editable} data-color-scheme="auto">
        <SuggestionMenuController
          triggerCharacter={"@"}
          getItems={async (query) => {
            const items = await getTaskMentionItems(editor, query);
            return filterSuggestionItems(items, query);
          }}
        />
      </BlockNoteView>
    );
  }
);

async function loadContent(editor: any, content: string | undefined | null) {
  if (!content) return;
  try {
    if (content.startsWith("[")) {
      const blocks = JSON.parse(content);
      if (Array.isArray(blocks) && blocks.length > 0) {
        editor.replaceBlocks(editor.document, blocks);
      }
    } else if (content.startsWith("<")) {
      const blocks = await editor.tryParseHTMLToBlocks(content);
      if (blocks && blocks.length > 0) {
        editor.replaceBlocks(editor.document, blocks);
      }
    }
  } catch {
    // fallback to default content
  }
}

async function getTaskMentionItems(
  editor: any,
  query: string
): Promise<DefaultReactSuggestionItem[]> {
  if (!query) return [];
  try {
    const result = await tasksApi.fetchTasks({ keyword: query, limit: 5 });
    return (result.items || []).map((task) => ({
      title: `#${task.id} ${task.title}`,
      onItemClick: () => {
        editor.insertInlineContent([
          {
            type: "taskMention",
            props: {
              taskId: String(task.id),
              title: task.title,
              status: task.status || "PENDING",
            },
          } as TaskMentionInlineContent,
          " ",
        ]);
      },
    }));
  } catch {
    return [];
  }
}

export default BlockNoteEditor;
