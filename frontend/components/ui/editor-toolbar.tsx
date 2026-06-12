"use client";

import { type Editor } from "@tiptap/react";
import {
  Bold, Italic, Underline, Strikethrough,
  Pilcrow,
  List, ListOrdered, ListChecks,
  Code, TextQuote,
  Link, Image, Table,
  AlignLeft, AlignCenter, AlignRight,
  Highlighter,
  Undo2, Redo2,
} from "lucide-react";
import { Toggle } from "@/components/ui/toggle";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

interface EditorToolbarProps {
  editor: Editor | null;
}

export function EditorToolbar({ editor }: EditorToolbarProps) {
  if (!editor) return null;

  const addLink = () => {
    const url = window.prompt("Enter URL:");
    if (url) {
      editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
    }
  };

  const addImage = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = () => {
      const file = input.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (e) => {
        const url = e.target?.result as string;
        editor.chain().focus().setImage({ src: url }).run();
      };
      reader.readAsDataURL(file);
    };
    input.click();
  };

  const addTable = () => {
    editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
  };

  return (
    <div className="flex flex-wrap items-center gap-0.5 px-2 py-1.5 border-b bg-muted/30">
      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => editor.chain().focus().undo().run()} title="Undo">
        <Undo2 className="h-3.5 w-3.5" />
      </Button>
      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => editor.chain().focus().redo().run()} title="Redo">
        <Redo2 className="h-3.5 w-3.5" />
      </Button>

      <div className="w-px h-5 bg-border mx-0.5" />

      <Toggle pressed={editor.isActive("bold")} onPressedChange={() => editor.chain().focus().toggleBold().run()} title="Bold">
        <Bold className="h-3.5 w-3.5" />
      </Toggle>
      <Toggle pressed={editor.isActive("italic")} onPressedChange={() => editor.chain().focus().toggleItalic().run()} title="Italic">
        <Italic className="h-3.5 w-3.5" />
      </Toggle>
      <Toggle pressed={editor.isActive("underline")} onPressedChange={() => editor.chain().focus().toggleUnderline().run()} title="Underline">
        <Underline className="h-3.5 w-3.5" />
      </Toggle>
      <Toggle pressed={editor.isActive("strike")} onPressedChange={() => editor.chain().focus().toggleStrike().run()} title="Strikethrough">
        <Strikethrough className="h-3.5 w-3.5" />
      </Toggle>

      <div className="w-px h-5 bg-border mx-0.5" />

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-7 w-7" title="Heading">
            <Pilcrow className="h-3.5 w-3.5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="min-w-[140px]">
          <DropdownMenuItem onClick={() => editor.chain().focus().setParagraph().run()}>
            <span className="text-xs">Paragraph</span>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}>
            <span className="text-base font-bold">Heading 1</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}>
            <span className="text-sm font-semibold">Heading 2</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}>
            <span className="text-xs font-medium">Heading 3</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <div className="w-px h-5 bg-border mx-0.5" />

      <Toggle pressed={editor.isActive("bulletList")} onPressedChange={() => editor.chain().focus().toggleBulletList().run()} title="Bullet List">
        <List className="h-3.5 w-3.5" />
      </Toggle>
      <Toggle pressed={editor.isActive("orderedList")} onPressedChange={() => editor.chain().focus().toggleOrderedList().run()} title="Ordered List">
        <ListOrdered className="h-3.5 w-3.5" />
      </Toggle>
      <Toggle pressed={editor.isActive("taskList")} onPressedChange={() => editor.chain().focus().toggleTaskList().run()} title="Task List">
        <ListChecks className="h-3.5 w-3.5" />
      </Toggle>

      <div className="w-px h-5 bg-border mx-0.5" />

      <Toggle pressed={editor.isActive("blockquote")} onPressedChange={() => editor.chain().focus().toggleBlockquote().run()} title="Blockquote">
        <TextQuote className="h-3.5 w-3.5" />
      </Toggle>
      <Toggle pressed={editor.isActive("codeBlock")} onPressedChange={() => editor.chain().focus().toggleCodeBlock().run()} title="Code Block">
        <Code className="h-3.5 w-3.5" />
      </Toggle>

      <div className="w-px h-5 bg-border mx-0.5" />

      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={addLink} title="Link">
        <Link className="h-3.5 w-3.5" />
      </Button>
      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={addImage} title="Image">
        <Image className="h-3.5 w-3.5" />
      </Button>
      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={addTable} title="Table">
        <Table className="h-3.5 w-3.5" />
      </Button>

      <div className="w-px h-5 bg-border mx-0.5" />

      <Toggle pressed={editor.isActive({ textAlign: "left" })} onPressedChange={() => editor.chain().focus().setTextAlign("left").run()} title="Align Left">
        <AlignLeft className="h-3.5 w-3.5" />
      </Toggle>
      <Toggle pressed={editor.isActive({ textAlign: "center" })} onPressedChange={() => editor.chain().focus().setTextAlign("center").run()} title="Align Center">
        <AlignCenter className="h-3.5 w-3.5" />
      </Toggle>
      <Toggle pressed={editor.isActive({ textAlign: "right" })} onPressedChange={() => editor.chain().focus().setTextAlign("right").run()} title="Align Right">
        <AlignRight className="h-3.5 w-3.5" />
      </Toggle>

      <div className="w-px h-5 bg-border mx-0.5" />

      <Toggle pressed={editor.isActive("highlight")} onPressedChange={() => editor.chain().focus().toggleHighlight().run()} title="Highlight">
        <Highlighter className="h-3.5 w-3.5" />
      </Toggle>
    </div>
  );
}
