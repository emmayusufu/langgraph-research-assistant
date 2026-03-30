"use client";

import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Link from "@mui/material/Link";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { ChatMessage } from "@/lib/types";

interface MessageBubbleProps {
  message: ChatMessage;
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === "user";

  if (isUser) {
    return (
      <Box className="fade-in" sx={{ display: "flex", justifyContent: "flex-end", mb: 2.5 }}>
        <Box
          sx={{
            maxWidth: "70%",
            py: 1.5,
            px: 2.5,
            bgcolor: "primary.main",
            color: "white",
            borderRadius: "20px 20px 6px 20px",
            fontSize: "0.9rem",
            lineHeight: 1.6,
          }}
        >
          {message.content}
        </Box>
      </Box>
    );
  }

  return (
    <Box className="fade-in" sx={{ mb: 3 }}>
      <Typography
        variant="subtitle2"
        color="primary.main"
        sx={{ mb: 1, fontSize: "0.68rem" }}
      >
        ASSISTANT
      </Typography>
      <Box
        sx={{
          "& pre": {
            bgcolor: (theme) =>
              theme.palette.mode === "dark" ? "#0b1120" : "#1e293b",
            color: "#e2e8f0",
            p: 2,
            borderRadius: 2.5,
            overflow: "auto",
            fontSize: "0.82rem",
            lineHeight: 1.7,
            border: 1,
            borderColor: "divider",
          },
          "& code": {
            fontSize: "0.82rem",
            fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
          },
          "& :not(pre) > code": {
            bgcolor: (theme) =>
              theme.palette.mode === "dark"
                ? "rgba(255,255,255,0.07)"
                : "rgba(0,0,0,0.05)",
            px: 0.8,
            py: 0.2,
            borderRadius: 1,
            fontWeight: 500,
          },
          "& p:first-of-type": { mt: 0 },
          "& p:last-of-type": { mb: 0 },
          "& ul, & ol": { pl: 2.5, my: 1 },
          "& li": { mb: 0.3 },
          "& h3": { mt: 2.5, mb: 0.5, fontSize: "0.98rem", fontWeight: 700 },
          "& h4": { mt: 2, mb: 0.5, fontSize: "0.93rem", fontWeight: 700 },
          "& hr": { border: "none", borderTop: 1, borderColor: "divider", my: 2.5 },
          "& strong": { fontWeight: 700 },
        }}
      >
        <Markdown
          remarkPlugins={[remarkGfm]}
          components={{
            a: ({ href, children }) => (
              <Link
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                sx={{
                  color: "primary.main",
                  fontWeight: 600,
                  textDecoration: "none",
                  borderBottom: "1px solid",
                  borderColor: "primary.light",
                  "&:hover": { borderColor: "primary.main" },
                }}
              >
                {children}
              </Link>
            ),
            p: ({ children }) => (
              <Typography variant="body2" sx={{ my: 0.75 }}>
                {children}
              </Typography>
            ),
          }}
        >
          {message.content}
        </Markdown>
      </Box>
    </Box>
  );
}
