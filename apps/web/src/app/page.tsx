"use client";

import { useState } from "react";
import Box from "@mui/material/Box";
import Toolbar from "@mui/material/Toolbar";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import Typography from "@mui/material/Typography";
import Chip from "@mui/material/Chip";
import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";
import { MessageList } from "@/components/chat/MessageList";
import { ChatInput } from "@/components/chat/ChatInput";
import { ReportView } from "@/components/report/ReportView";
import { useChat } from "@/hooks/useChat";

const AGENT_LABELS: Record<string, string> = {
  supervisor: "Routing...",
  planner: "Planning research...",
  researcher: "Searching the web...",
  coder: "Finding code examples...",
  writer: "Writing answer...",
};

export default function HomePage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showReport, setShowReport] = useState(false);

  const {
    messages,
    isLoading,
    outputMode,
    setOutputMode,
    lastOutput,
    sources,
    activeAgent,
    sendMessage,
  } = useChat();

  const handleSend = async (content: string) => {
    setShowReport(false);
    await sendMessage(content);
  };

  return (
    <Box sx={{ display: "flex", height: "100vh" }}>
      <Header onMenuClick={() => setSidebarOpen(true)} />
      <Sidebar
        open={sidebarOpen}
        outputMode={outputMode}
        onModeChange={setOutputMode}
        onClose={() => setSidebarOpen(false)}
      />
      <Box sx={{ flex: 1, display: "flex", flexDirection: "column" }}>
        <Toolbar />
        {isLoading && (
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1.5,
              px: 2,
              py: 1,
              bgcolor: "background.paper",
              borderBottom: 1,
              borderColor: "divider",
            }}
          >
            <CircularProgress size={18} />
            {activeAgent && (
              <>
                <Chip
                  label={activeAgent}
                  size="small"
                  color="primary"
                  variant="outlined"
                />
                <Typography variant="body2" color="text.secondary">
                  {AGENT_LABELS[activeAgent] || "Working..."}
                </Typography>
              </>
            )}
            {!activeAgent && (
              <Typography variant="body2" color="text.secondary">
                Starting...
              </Typography>
            )}
          </Box>
        )}
        {showReport && lastOutput ? (
          <ReportView
            content={lastOutput}
            sources={sources}
            onSwitchToChat={() => setShowReport(false)}
          />
        ) : (
          <>
            <MessageList messages={messages} />
            {lastOutput && !isLoading && outputMode === "chat" && (
              <Box sx={{ display: "flex", justifyContent: "center", pb: 1 }}>
                <Button
                  size="small"
                  variant="outlined"
                  onClick={() => setShowReport(true)}
                >
                  View as Report
                </Button>
              </Box>
            )}
          </>
        )}
        <ChatInput onSend={handleSend} disabled={isLoading} />
      </Box>
    </Box>
  );
}
