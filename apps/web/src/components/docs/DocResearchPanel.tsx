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
      sx={{ "& .MuiDrawer-paper": { width: 380, display: "flex", flexDirection: "column" } }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          p: 2,
          borderBottom: "1px solid",
          borderColor: "divider",
        }}
      >
        <Typography variant="subtitle1" fontWeight={600} sx={{ flex: 1 }}>
          Research
        </Typography>
        <IconButton onClick={onClose} size="small">
          <CloseRoundedIcon fontSize="small" />
        </IconButton>
      </Box>
      <Box sx={{ flex: 1, overflow: "auto" }}>
        <MessageList messages={messages} />
      </Box>
      <ChatInput onSend={sendMessage} disabled={isLoading} />
    </Drawer>
  );
}
