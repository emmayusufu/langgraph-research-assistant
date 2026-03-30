"use client";

import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import Avatar from "@mui/material/Avatar";
import Link from "@mui/material/Link";
import PersonRoundedIcon from "@mui/icons-material/PersonRounded";
import AutoAwesomeRoundedIcon from "@mui/icons-material/AutoAwesomeRounded";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { ChatMessage } from "@/lib/types";

interface MessageBubbleProps {
  message: ChatMessage;
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === "user";

  return (
    <Box
      className="fade-in-up"
      sx={{
        display: "flex",
        gap: 1.5,
        mb: 3,
        maxWidth: 800,
        mx: "auto",
        flexDirection: isUser ? "row-reverse" : "row",
        alignItems: "flex-start",
      }}
    >
      <Avatar
        sx={{
          width: 34,
          height: 34,
          mt: 0.5,
          bgcolor: isUser ? "primary.main" : "transparent",
          border: isUser ? "none" : 1,
          borderColor: "divider",
          color: isUser ? "white" : "primary.main",
        }}
      >
        {isUser ? (
          <PersonRoundedIcon sx={{ fontSize: 18 }} />
        ) : (
          <AutoAwesomeRoundedIcon sx={{ fontSize: 18 }} />
        )}
      </Avatar>
      {isUser ? (
        <Paper
          elevation={0}
          sx={{
            py: 1.5,
            px: 2.5,
            maxWidth: "70%",
            bgcolor: "primary.main",
            color: "white",
            borderRadius: "18px 18px 4px 18px",
          }}
        >
          <Typography variant="body2" sx={{ lineHeight: 1.6 }}>
            {message.content}
          </Typography>
        </Paper>
      ) : (
        <Box
          sx={{
            maxWidth: "85%",
            "& pre": {
              bgcolor: (theme) =>
                theme.palette.mode === "dark" ? "#0c0a09" : "#1c1917",
              color: "#e7e5e4",
              p: 2,
              borderRadius: 2,
              overflow: "auto",
              fontSize: "0.84rem",
              lineHeight: 1.7,
              border: 1,
              borderColor: (theme) =>
                theme.palette.mode === "dark" ? "#292524" : "#292524",
            },
            "& code": {
              fontSize: "0.84rem",
              fontFamily: "'Fira Code', 'SF Mono', monospace",
            },
            "& :not(pre) > code": {
              bgcolor: (theme) =>
                theme.palette.mode === "dark"
                  ? "rgba(255,255,255,0.08)"
                  : "rgba(0,0,0,0.06)",
              px: 0.8,
              py: 0.2,
              borderRadius: 1,
            },
            "& p:first-of-type": { mt: 0 },
            "& p:last-of-type": { mb: 0 },
            "& ul, & ol": { pl: 2.5, my: 1 },
            "& li": { mb: 0.5 },
            "& h3": { mt: 2, mb: 0.5, fontSize: "1rem", fontWeight: 600 },
            "& h4": { mt: 1.5, mb: 0.5, fontSize: "0.95rem", fontWeight: 600 },
            "& hr": { border: "none", borderTop: 1, borderColor: "divider", my: 2 },
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
                    textDecorationColor: "primary.light",
                    fontWeight: 500,
                  }}
                >
                  {children}
                </Link>
              ),
              p: ({ children }) => (
                <Typography variant="body2" sx={{ my: 0.75, lineHeight: 1.75 }}>
                  {children}
                </Typography>
              ),
            }}
          >
            {message.content}
          </Markdown>
        </Box>
      )}
    </Box>
  );
}
