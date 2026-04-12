"use client";

import Box from "@mui/material/Box";
import Drawer from "@mui/material/Drawer";
import IconButton from "@mui/material/IconButton";
import Typography from "@mui/material/Typography";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import { ChatInput } from "@/components/chat/ChatInput";
import { MessageList } from "@/components/chat/MessageList";
import { useChat } from "@/hooks/useChat";

interface DocResearchPanelProps {
  open: boolean;
  onClose: () => void;
}

export function DocResearchPanel({ open, onClose }: DocResearchPanelProps) {
  const { messages, isLoading, sendMessage } = useChat();

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      variant="temporary"
      slotProps={{
        paper: {
          sx: {
            width: 420,
            display: "flex",
            flexDirection: "column",
            borderLeft: "1px solid",
            borderColor: "divider",
            backgroundColor: "background.paper",
            backgroundImage: "none",
          },
        },
      }}
    >
      <Box
        sx={{
          pt: 3.5,
          pb: 2.5,
          px: 3.5,
          borderBottom: "1px solid",
          borderColor: "divider",
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: 2,
        }}
      >
        <Typography
          sx={{
            fontSize: "1.2rem",
            fontWeight: 800,
            letterSpacing: "-0.02em",
            color: "text.primary",
            lineHeight: 1.1,
          }}
        >
          Research
        </Typography>
        <IconButton
          onClick={onClose}
          size="small"
          sx={{
            width: 30,
            height: 30,
            color: "text.secondary",
            opacity: 0.65,
            transition: "all 0.2s",
            "&:hover": { opacity: 1, color: "text.primary" },
            mt: 0.25,
          }}
        >
          <CloseRoundedIcon sx={{ fontSize: 17 }} />
        </IconButton>
      </Box>

      <Box sx={{ flex: 1, overflow: "auto", px: 2.5 }}>
        <MessageList messages={messages} />
      </Box>

      <Box sx={{ px: 2.5, py: 2, borderTop: "1px solid", borderColor: "divider" }}>
        <ChatInput onSend={sendMessage} disabled={isLoading} />
      </Box>
    </Drawer>
  );
}
