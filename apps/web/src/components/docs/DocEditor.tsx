"use client";

import { useEffect } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import { BubbleMenu, FloatingMenu } from "@tiptap/react/menus";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import IconButton from "@mui/material/IconButton";
import Paper from "@mui/material/Paper";
import FormatBoldIcon from "@mui/icons-material/FormatBold";
import FormatItalicIcon from "@mui/icons-material/FormatItalic";
import FormatStrikethroughIcon from "@mui/icons-material/FormatStrikethrough";
import CodeIcon from "@mui/icons-material/Code";
import type { Editor } from "@tiptap/react";

interface DocEditorProps {
  content: string;
  readOnly: boolean;
  onContentSave: (content: string) => void;
  onAskAI?: () => void;
}

const editorSx = {
  "& .ProseMirror": {
    outline: "none",
    minHeight: 400,
    lineHeight: 1.75,
    "& .is-empty::before": {
      content: "attr(data-placeholder)",
      float: "left",
      color: "text.disabled",
      pointerEvents: "none",
      height: 0,
    },
    "& h1": { fontSize: "1.8rem", fontWeight: 700, mt: 2, mb: 0.5 },
    "& h2": { fontSize: "1.4rem", fontWeight: 700, mt: 2, mb: 0.5 },
    "& h3": { fontSize: "1.1rem", fontWeight: 700, mt: 1.5, mb: 0.5 },
    "& pre": { bgcolor: "action.hover", borderRadius: 1, p: 1.5, fontFamily: "monospace", fontSize: "0.875rem", overflowX: "auto", my: 1 },
    "& code": { fontFamily: "monospace", fontSize: "0.875rem", bgcolor: "action.hover", borderRadius: 0.5, px: 0.5 },
    "& blockquote": { borderLeft: "3px solid", borderColor: "divider", pl: 2, color: "text.secondary", fontStyle: "italic", my: 1 },
    "& ul, & ol": { pl: 3 },
  },
};

const FORMATS = [
  { Icon: FormatBoldIcon, mark: "bold", fn: (e: Editor) => e.chain().focus().toggleBold().run() },
  { Icon: FormatItalicIcon, mark: "italic", fn: (e: Editor) => e.chain().focus().toggleItalic().run() },
  { Icon: FormatStrikethroughIcon, mark: "strike", fn: (e: Editor) => e.chain().focus().toggleStrike().run() },
  { Icon: CodeIcon, mark: "code", fn: (e: Editor) => e.chain().focus().toggleCode().run() },
];

const BLOCKS: { label: string; cmd: (e: Editor) => void }[] = [
  { label: "Text", cmd: (e) => e.chain().focus().setParagraph().run() },
  { label: "H1", cmd: (e) => e.chain().focus().setHeading({ level: 1 }).run() },
  { label: "H2", cmd: (e) => e.chain().focus().setHeading({ level: 2 }).run() },
  { label: "H3", cmd: (e) => e.chain().focus().setHeading({ level: 3 }).run() },
  { label: "• List", cmd: (e) => e.chain().focus().toggleBulletList().run() },
  { label: "1. List", cmd: (e) => e.chain().focus().toggleOrderedList().run() },
  { label: "Code", cmd: (e) => e.chain().focus().toggleCodeBlock().run() },
  { label: "Quote", cmd: (e) => e.chain().focus().toggleBlockquote().run() },
];

export function DocEditor({ content, readOnly, onContentSave, onAskAI }: DocEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({ placeholder: "Type '/' for commands…", showOnlyCurrent: true }),
    ],
    content,
    editable: !readOnly,
    immediatelyRender: false,
    onBlur: ({ editor: e }) => onContentSave(e.getHTML()),
  });

  useEffect(() => {
    if (!editor || editor.getHTML() === content) return;
    editor.commands.setContent(content, false);
  }, [content]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!onAskAI) return;
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") { e.preventDefault(); onAskAI(); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onAskAI]);

  return (
    <Box sx={editorSx}>
      <BubbleMenu editor={editor}>
        <Paper elevation={3} sx={{ display: "flex", p: 0.5, gap: 0.25, borderRadius: 1.5 }}>
          {FORMATS.map(({ Icon, mark, fn }) => (
            <IconButton
              key={mark}
              size="small"
              onClick={() => editor && fn(editor)}
              sx={{ p: 0.5, borderRadius: 1, bgcolor: editor?.isActive(mark) ? "action.selected" : "transparent" }}
            >
              <Icon fontSize="small" />
            </IconButton>
          ))}
        </Paper>
      </BubbleMenu>

      {!readOnly && (
        <FloatingMenu editor={editor}>
          <Paper elevation={2} sx={{ display: "flex", p: 0.5, gap: 0.5, borderRadius: 1.5, flexWrap: "wrap", maxWidth: 380 }}>
            {BLOCKS.map(({ label, cmd }) => (
              <Chip
                key={label}
                label={label}
                size="small"
                onClick={() => editor && cmd(editor)}
                sx={{ height: 24, fontSize: "0.72rem", cursor: "pointer" }}
              />
            ))}
          </Paper>
        </FloatingMenu>
      )}

      <EditorContent editor={editor} />
    </Box>
  );
}
