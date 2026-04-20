"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Collaboration from "@tiptap/extension-collaboration";
import Placeholder from "@tiptap/extension-placeholder";
import Image from "@tiptap/extension-image";
import { Table } from "@tiptap/extension-table";
import { TableRow } from "@tiptap/extension-table-row";
import { TableHeader } from "@tiptap/extension-table-header";
import { TableCell } from "@tiptap/extension-table-cell";
import type { HocuspocusProvider } from "@hocuspocus/provider";
import Box from "@mui/material/Box";
import AutoAwesomeRoundedIcon from "@mui/icons-material/AutoAwesomeRounded";
import ImageOutlinedIcon from "@mui/icons-material/ImageOutlined";
import { AIPanel } from "./ai/AIPanel";
import { CommentComposer } from "./CommentComposer";
import { editorSx } from "./editor/editorSx";
import { lowlight, LumenCodeBlock } from "./editor/codeBlock";
import { CollaborationCursorExt, cursorColor } from "./editor/collaborationCursor";
import { BASE_BLOCK_GROUPS, withSlashDelete, type BlockGroup } from "./editor/blockMenu";
import { TextBubbleMenu } from "./editor/TextBubbleMenu";
import { TableBubbleMenu } from "./editor/TableBubbleMenu";
import { SlashMenu } from "./editor/SlashMenu";
import { uploadImage } from "@/lib/api";
import { CommentMark } from "@/lib/commentMark";
import { extractCursorContext, extractSelectionContext } from "@/lib/editor-context";
import { looksLikeMarkdown, markdownToHtml } from "@/lib/markdown";

interface DocEditorProps {
  content: string;
  readOnly: boolean;
  user?: { id: string; name: string };
  provider: HocuspocusProvider | null;
  synced: boolean;
  onContentSave: (content: string) => void;
  onContentChange?: (content: string) => void;
  onAskAI?: () => void;
  onCreateComment?: (threadId: string, body: string) => Promise<void>;
  onOpenThread?: (threadId: string) => void;
  threadIds?: string[];
}

export function DocEditor({
  content,
  readOnly,
  user,
  provider,
  synced,
  onContentSave,
  onContentChange,
  onAskAI,
  onCreateComment,
  onOpenThread,
  threadIds,
}: DocEditorProps) {
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSaved = useRef<string>(content);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [aiAnchor, setAiAnchor] = useState<{ nodeType: 1; getBoundingClientRect: () => DOMRect } | null>(null);
  const [aiOpen, setAiOpen] = useState(false);
  const [aiMode, setAiMode] = useState<"selection" | "generate">("selection");
  const [aiSelection, setAiSelection] = useState("");
  const [aiContext, setAiContext] = useState("");
  const [aiRange, setAiRange] = useState<{ from: number; to: number } | null>(null);
  const [commentAnchor, setCommentAnchor] = useState<{ nodeType: 1; getBoundingClientRect: () => DOMRect } | null>(null);
  const [commentOpen, setCommentOpen] = useState(false);
  const [commentSnippet, setCommentSnippet] = useState("");
  const [pendingThreadId, setPendingThreadId] = useState<string | null>(null);
  const [pendingRange, setPendingRange] = useState<{ from: number; to: number } | null>(null);

  const flushSave = (html: string) => {
    if (saveTimer.current) {
      clearTimeout(saveTimer.current);
      saveTimer.current = null;
    }
    if (html !== lastSaved.current) {
      lastSaved.current = html;
      onContentSave(html);
    }
  };

  const scheduleSave = (html: string) => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      saveTimer.current = null;
      if (html !== lastSaved.current) {
        lastSaved.current = html;
        onContentSave(html);
      }
    }, 800);
  };

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ codeBlock: false }),
      LumenCodeBlock.configure({ lowlight }),
      Placeholder.configure({ placeholder: "Start writing, or type '/' for commands…", showOnlyCurrent: true }),
      Image.configure({ HTMLAttributes: { class: "lumen-img" } }),
      Table.configure({ resizable: true, HTMLAttributes: { class: "lumen-table" } }),
      TableRow,
      TableHeader,
      TableCell,
      CommentMark,
      ...(provider
        ? [
            Collaboration.configure({ document: provider.document }),
            CollaborationCursorExt.configure({
              provider,
              user: user ? { name: user.name, color: cursorColor(user.id) } : null,
            }),
          ]
        : []),
    ],
    content: provider ? undefined : content,
    editable: !readOnly,
    immediatelyRender: false,
    editorProps: {
      handlePaste: (view, event) => {
        const files = Array.from(event.clipboardData?.files ?? []).filter((f) => f.type.startsWith("image/"));
        if (files.length === 0) return false;
        event.preventDefault();
        void Promise.all(files.map(uploadImage)).then((urls) => {
          urls.forEach((url) => {
            view.dispatch(
              view.state.tr.replaceSelectionWith(view.state.schema.nodes.image.create({ src: url })),
            );
          });
        });
        return true;
      },
      handleDrop: (view, event) => {
        const files = Array.from(event.dataTransfer?.files ?? []).filter((f) => f.type.startsWith("image/"));
        if (files.length === 0) return false;
        event.preventDefault();
        const coords = view.posAtCoords({ left: event.clientX, top: event.clientY });
        const pos = coords?.pos ?? view.state.selection.from;
        void Promise.all(files.map(uploadImage)).then((urls) => {
          urls.forEach((url) => {
            view.dispatch(view.state.tr.insert(pos, view.state.schema.nodes.image.create({ src: url })));
          });
        });
        return true;
      },
    },
    onUpdate: ({ editor: e }) => {
      const html = e.getHTML();
      onContentChange?.(html);
      scheduleSave(html);
    },
    onBlur: ({ editor: e }) => flushSave(e.getHTML()),
  }, [provider]);

  useEffect(() => () => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
  }, []);

  useEffect(() => {
    if (!provider?.awareness || !user) return;
    provider.awareness.setLocalStateField("user", { name: user.name, color: cursorColor(user.id) });
  }, [provider, user]);

  useEffect(() => {
    if (!editor || !provider || !synced) return;
    const fragment = provider.document.getXmlFragment("default");
    if (fragment.length === 0 && content) {
      editor.commands.setContent(content);
    }
  }, [editor, provider, synced]);

  useEffect(() => {
    if (!editor || editor.getHTML() === content) return;
    editor.commands.setContent(content, false as never);
  }, [content]);

  useEffect(() => {
    if (!onAskAI) return;
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        onAskAI();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onAskAI]);

  const prevThreadIdsRef = useRef<string[] | null>(null);
  useEffect(() => {
    if (!editor || !threadIds || readOnly) return;
    const prev = prevThreadIdsRef.current;
    prevThreadIdsRef.current = threadIds;
    const active = new Set(threadIds);
    const stale: string[] = [];
    if (prev === null) {
      editor.state.doc.descendants((node) => {
        if (!node.isInline) return;
        for (const m of node.marks) {
          const tid = m.attrs.threadId;
          if (m.type.name === "comment" && tid && !active.has(tid) && !stale.includes(tid)) {
            stale.push(tid);
          }
        }
      });
    } else {
      for (const tid of prev) {
        if (!active.has(tid) && !stale.includes(tid)) stale.push(tid);
      }
    }
    if (stale.length === 0) return;
    editor.commands.command(({ tr, state, dispatch }) => {
      const commentMark = state.schema.marks.comment;
      if (!commentMark) return false;
      state.doc.descendants((node, pos) => {
        if (!node.isInline) return;
        node.marks.forEach((m) => {
          if (m.type.name === "comment" && stale.includes(m.attrs.threadId)) {
            tr.removeMark(pos, pos + node.nodeSize, m);
          }
        });
      });
      if (dispatch) dispatch(tr);
      return true;
    });
  }, [editor, threadIds, readOnly]);

  useEffect(() => {
    if (!editor || !onOpenThread) return;
    let dom: Element | null = null;
    const click = (e: Event) => {
      const target = e.target as HTMLElement;
      const el = target.closest(".lumen-comment") as HTMLElement | null;
      const threadId = el?.getAttribute("data-thread-id");
      if (threadId) {
        e.preventDefault();
        onOpenThread(threadId);
      }
    };
    const attach = () => {
      try {
        dom = editor.view.dom;
        dom.addEventListener("click", click);
      } catch {
        // view not ready yet
      }
    };
    attach();
    if (!dom) editor.on("create", attach);
    return () => {
      editor.off("create", attach);
      if (dom) dom.removeEventListener("click", click);
    };
  }, [editor, onOpenThread]);

  const openAIFromSelection = () => {
    if (!editor) return;
    const { selection, context, range } = extractSelectionContext(editor);
    if (!selection) return;
    const startCoords = editor.view.coordsAtPos(range.from);
    const endCoords = editor.view.coordsAtPos(range.to);
    const rect = new DOMRect(
      startCoords.left,
      Math.max(startCoords.bottom, endCoords.bottom),
      Math.max(1, endCoords.right - startCoords.left),
      1,
    );
    setAiAnchor({ nodeType: 1, getBoundingClientRect: () => rect });
    setAiSelection(selection);
    setAiContext(context);
    setAiRange(range);
    setAiMode("selection");
    setAiOpen(true);
  };

  const openCommentComposer = () => {
    if (!editor) return;
    const { from, to } = editor.state.selection;
    if (from === to) return;
    const snippet = editor.state.doc.textBetween(from, to, " ").trim();
    const startCoords = editor.view.coordsAtPos(from);
    const endCoords = editor.view.coordsAtPos(to);
    const rect = new DOMRect(
      startCoords.left,
      Math.max(startCoords.bottom, endCoords.bottom),
      Math.max(1, endCoords.right - startCoords.left),
      1,
    );
    setCommentAnchor({ nodeType: 1, getBoundingClientRect: () => rect });
    setCommentSnippet(snippet);
    setPendingRange({ from, to });
    setPendingThreadId(crypto.randomUUID());
    setCommentOpen(true);
  };

  const submitComment = async (body: string) => {
    if (!editor || !pendingThreadId || !pendingRange || !onCreateComment) return;
    editor
      .chain()
      .setTextSelection({ from: pendingRange.from, to: pendingRange.to })
      .setComment(pendingThreadId)
      .run();
    try {
      await onCreateComment(pendingThreadId, body);
    } catch (err) {
      editor.chain().unsetComment(pendingThreadId).run();
      throw err;
    }
  };

  const openAIFromCursor = () => {
    if (!editor) return;
    const { context, range } = extractCursorContext(editor);
    const coords = editor.view.coordsAtPos(range.from);
    const rect = new DOMRect(coords.left, coords.bottom, 1, 1);
    setAiAnchor({ nodeType: 1, getBoundingClientRect: () => rect });
    setAiSelection("");
    setAiContext(context);
    setAiRange(range);
    setAiMode("generate");
    setAiOpen(true);
  };

  const toInsertable = (text: string): string => (looksLikeMarkdown(text) ? markdownToHtml(text) : text);

  const handleAIReplace = (text: string) => {
    if (!editor || !aiRange) return;
    editor
      .chain()
      .focus()
      .setTextSelection({ from: aiRange.from, to: aiRange.to })
      .deleteSelection()
      .insertContent(toInsertable(text))
      .run();
  };

  const handleAIInsertBelow = (text: string) => {
    if (!editor || !aiRange) return;
    editor
      .chain()
      .focus()
      .setTextSelection(aiRange.to)
      .insertContent({ type: "paragraph" })
      .insertContent(toInsertable(text))
      .run();
  };

  const blockGroups = useMemo<BlockGroup[]>(
    () => [
      {
        label: "AI",
        items: [
          {
            label: "Ask AI",
            hint: "Rewrite or generate",
            Icon: AutoAwesomeRoundedIcon,
            cmd: withSlashDelete(() => openAIFromCursor()),
          },
        ],
      },
      ...BASE_BLOCK_GROUPS,
      {
        label: "Media",
        items: [
          {
            label: "Image",
            hint: "Upload from device",
            Icon: ImageOutlinedIcon,
            cmd: withSlashDelete(() => fileInputRef.current?.click()),
          },
        ],
      },
    ],
    [editor],
  );

  return (
    <Box sx={editorSx}>
      {editor && <TextBubbleMenu editor={editor} onAskAI={openAIFromSelection} onComment={onCreateComment ? openCommentComposer : undefined} />}
      {editor && !readOnly && <TableBubbleMenu editor={editor} />}
      {editor && !readOnly && <SlashMenu editor={editor} blockGroups={blockGroups} />}

      <EditorContent editor={editor} />

      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml"
        style={{ display: "none" }}
        onChange={async (e) => {
          const file = e.target.files?.[0];
          e.target.value = "";
          if (!file || !editor) return;
          try {
            const url = await uploadImage(file);
            editor.chain().focus().setImage({ src: url }).run();
          } catch (err) {
            console.error(err);
          }
        }}
      />

      <AIPanel
        open={aiOpen}
        anchor={aiAnchor}
        mode={aiMode}
        selection={aiSelection}
        context={aiContext}
        onReplace={handleAIReplace}
        onInsertBelow={handleAIInsertBelow}
        onClose={() => setAiOpen(false)}
      />

      <CommentComposer
        open={commentOpen}
        anchor={commentAnchor}
        snippet={commentSnippet}
        authorName={user?.name}
        onSubmit={submitComment}
        onClose={() => setCommentOpen(false)}
      />
    </Box>
  );
}
