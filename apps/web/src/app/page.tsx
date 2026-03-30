"use client";

import Box from "@mui/material/Box";
import LinearProgress from "@mui/material/LinearProgress";
import { Header } from "@/components/layout/Header";
import { MessageList } from "@/components/chat/MessageList";
import { ChatInput } from "@/components/chat/ChatInput";
import { useChat } from "@/hooks/useChat";

export default function HomePage() {
  const {
    messages,
    isLoading,
    activeAgent,
    sendMessage,
    clearMessages,
  } = useChat();

  return (
    <Box
      sx={{
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        bgcolor: "background.default",
      }}
    >
      <Header
        onClear={clearMessages}
        activeAgent={activeAgent}
        isLoading={isLoading}
      />
      {isLoading && (
        <LinearProgress
          sx={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            height: 2,
            zIndex: 1300,
            bgcolor: "transparent",
            "& .MuiLinearProgress-bar": { bgcolor: "primary.main" },
          }}
        />
      )}
      <Box sx={{ height: 56 }} />
      <MessageList messages={messages} />
      <ChatInput onSend={sendMessage} disabled={isLoading} />
    </Box>
  );
}
