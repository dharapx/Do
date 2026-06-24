"use client";

import { Textarea } from "@/components/ui/textarea";

export function isHtml(content: string): boolean {
  return /^\s*<(\w+)[^>]*>/i.test(content.trim());
}

export function FormattedContent({ html }: { html: string }) {
  return (
    <div
      className="prose prose-sm max-w-none dark:prose-invert"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

interface RichTextEditorProps {
  content: string;
  onChange: (content: string) => void;
  placeholder?: string;
  minHeight?: string;
}

export function RichTextEditor({ content, onChange, placeholder, minHeight }: RichTextEditorProps) {
  return (
    <Textarea
      value={content}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="min-h-[80px] resize-y font-mono text-sm"
      style={minHeight ? { minHeight } : undefined}
    />
  );
}
