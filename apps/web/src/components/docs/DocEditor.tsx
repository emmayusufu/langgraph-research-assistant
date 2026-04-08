"use client";

import { useState, useEffect, useRef } from "react";
import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";

interface DocEditorProps {
  content: string;
  readOnly: boolean;
  onContentSave: (content: string) => void;
  onAskAI?: () => void;
}

export function DocEditor({ content, readOnly, onContentSave, onAskAI }: DocEditorProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(content);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setDraft(content);
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

  const handleBlur = (e: React.FocusEvent<HTMLTextAreaElement>) => {
    if (e.relatedTarget && (e.relatedTarget as HTMLElement).dataset.aiTrigger) return;
    setEditing(false);
    if (draft !== content) onContentSave(draft);
  };

  if (editing && !readOnly) {
    return (
      <Box sx={{ position: "relative" }}>
        {onAskAI && (
          <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 0.5 }}>
            <Chip
              icon={<AutoAwesomeIcon sx={{ fontSize: "14px !important" }} />}
              label="Ask AI"
              size="small"
              onClick={onAskAI}
              data-ai-trigger="true"
              sx={{
                fontSize: "0.7rem",
                fontWeight: 600,
                cursor: "pointer",
                bgcolor: "primary.main",
                color: "white",
                "& .MuiChip-icon": { color: "white" },
                "&:hover": { bgcolor: "primary.dark" },
              }}
            />
          </Box>
        )}
        <Box
          component="textarea"
          ref={textareaRef}
          value={draft}
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setDraft(e.target.value)}
          onBlur={handleBlur}
          autoFocus
          sx={{
            width: "100%",
            minHeight: 400,
            p: 2,
            fontFamily: "monospace",
            fontSize: 14,
            border: "1px solid",
            borderColor: "divider",
            borderRadius: 1,
            resize: "vertical",
            bgcolor: "background.paper",
            color: "text.primary",
            boxSizing: "border-box",
          }}
        />
      </Box>
    );
  }

  return (
    <Box
      onClick={() => {
        if (!readOnly) setEditing(true);
      }}
      sx={{
        minHeight: 400,
        p: 2,
        border: "1px solid",
        borderColor: readOnly ? "transparent" : "divider",
        borderRadius: 1,
        cursor: readOnly ? "default" : "text",
        "& p": { mt: 0 },
        "& pre": { bgcolor: "action.hover", p: 1.5, borderRadius: 1, overflow: "auto" },
        "& code": { fontFamily: "monospace", fontSize: 13 },
      }}
    >
      {draft ? (
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{draft}</ReactMarkdown>
      ) : (
        !readOnly && <Box sx={{ color: "text.disabled" }}>Click to start writing…</Box>
      )}
    </Box>
  );
}
