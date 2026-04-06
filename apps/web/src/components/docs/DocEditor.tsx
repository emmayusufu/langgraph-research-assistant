"use client";

import { useState, useEffect } from "react";
import Box from "@mui/material/Box";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface DocEditorProps {
  content: string;
  readOnly: boolean;
  onBlur: (content: string) => void;
}

export function DocEditor({ content, readOnly, onBlur }: DocEditorProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(content);

  useEffect(() => {
    setDraft(content);
  }, [content]);

  const handleBlur = () => {
    setEditing(false);
    if (draft !== content) {
      onBlur(draft);
    }
  };

  if (editing && !readOnly) {
    return (
      <Box
        component="textarea"
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
        !readOnly && <Box sx={{ color: "text.disabled" }}>Click to start writing...</Box>
      )}
    </Box>
  );
}
