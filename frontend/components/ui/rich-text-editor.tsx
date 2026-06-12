"use client";

import { useEffect } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import Placeholder from "@tiptap/extension-placeholder";
import Underline from "@tiptap/extension-underline";
import Highlight from "@tiptap/extension-highlight";
import TextAlign from "@tiptap/extension-text-align";
import { Table, TableRow, TableCell, TableHeader } from "@tiptap/extension-table";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight";
import { common, createLowlight } from "lowlight";
import { marked } from "marked";
import { EditorToolbar } from "@/components/ui/editor-toolbar";
import { cn } from "@/lib/utils";

const lowlight = createLowlight(common);

interface RichTextEditorProps {
  content: string;
  onChange: (html: string) => void;
  placeholder?: string;
  editable?: boolean;
  minHeight?: string;
}

const MARKDOWN_RE = /^[#*>\-`\[{%]|^---$|^___$|^\d+\.\s/m;

function looksLikeMarkdown(text: string): boolean {
  return MARKDOWN_RE.test(text);
}

export function RichTextEditor({ content, onChange, placeholder, editable = true, minHeight = "80px" }: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
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
      Placeholder.configure({ placeholder: placeholder || "Write something..." }),
    ],
    content,
    editable,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  useEffect(() => {
    if (!editor || !editable) return;
    const dom = editor.view.dom;
    const handler = (event: ClipboardEvent) => {
      const text = event.clipboardData?.getData("text/plain");
      const html = event.clipboardData?.getData("text/html");
      if (text && !html && looksLikeMarkdown(text)) {
        event.preventDefault();
        const convertedHtml = marked.parse(text, { async: false }) as string;
        editor.commands.insertContent(convertedHtml, {
          parseOptions: { preserveWhitespace: true },
        });
      }
    };
    dom.addEventListener("paste", handler);
    return () => dom.removeEventListener("paste", handler);
  }, [editor, editable]);

  if (!editor) return null;

  return (
    <div className="border rounded-lg overflow-hidden">
      <EditorToolbar editor={editor} />
      <div className="px-3 py-2" style={{ minHeight }}>
        <EditorContent editor={editor} className="prose prose-sm max-w-none focus:outline-none [&_.ProseMirror]:outline-none [&_.ProseMirror]:min-h-[60px] [&_.ProseMirror_p.is-editor-empty:first-child::before]:text-muted-foreground [&_.ProseMirror_p.is-editor-empty:first-child::before]:content-[attr(data-placeholder)] [&_.ProseMirror_p.is-editor-empty:first-child::before]:float-left [&_.ProseMirror_p.is-editor-empty:first-child::before]:pointer-events-none [&_.ProseMirror_p.is-editor-empty:first-child::before]:h-0" />
      </div>
    </div>
  );
}

export function isHtml(str: string): boolean {
  return /<[a-z][\s\S]*>/i.test(str);
}

export function FormattedContent({ html, className }: { html: string; className?: string }) {
  return (
    <div
      className={cn("[&_table]:w-full [&_table]:border-collapse [&_th]:border [&_th]:border-border [&_th]:px-2 [&_th]:py-1 [&_th]:text-left [&_th]:bg-muted [&_td]:border [&_td]:border-border [&_td]:px-2 [&_td]:py-1 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_li>p]:m-0 [&_pre]:bg-muted [&_pre]:p-3 [&_pre]:rounded [&_pre]:text-xs [&_pre]:overflow-x-auto [&_code]:bg-muted [&_code]:px-1 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-xs [&_pre_code]:bg-transparent [&_pre_code]:p-0 [&_blockquote]:border-l-2 [&_blockquote]:pl-3 [&_blockquote]:text-muted-foreground [&_p]:m-0 [&_h1]:text-lg [&_h1]:font-bold [&_h2]:text-base [&_h2]:font-semibold [&_h3]:text-sm [&_h3]:font-medium [&_img]:max-w-full [&_img]:rounded [&_a]:text-primary [&_a]:underline", className)}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
