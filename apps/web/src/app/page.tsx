"use client";

import { useState } from "react";
import Box from "@mui/material/Box";
import Toolbar from "@mui/material/Toolbar";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import Chip from "@mui/material/Chip";
import LinearProgress from "@mui/material/LinearProgress";
import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";
import { MessageList } from "@/components/chat/MessageList";
import { ChatInput } from "@/components/chat/ChatInput";
import { ReportView } from "@/components/report/ReportView";
import { useChat } from "@/hooks/useChat";

const AGENT_LABELS: Record<string, string> = {
  supervisor: "Routing...",
  planner: "Breaking down your question...",
  researcher: "Searching the web...",
  coder: "Finding code examples...",
  writer: "Writing your answer...",
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
    <Box sx={{ display: "flex", height: "100vh", bgcolor: "background.default" }}>
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
          <Box>
            <LinearProgress
              sx={{
                height: 2,
                "& .MuiLinearProgress-bar": { transition: "none" },
              }}
            />
            <Box
              className="fade-in-up"
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1.5,
                px: { xs: 2, md: 4 },
                py: 1.5,
              }}
            >
              {activeAgent && (
                <>
                  <Chip
                    label={activeAgent}
                    size="small"
                    color="primary"
                    sx={{ fontSize: "0.75rem" }}
                  />
                  <Typography variant="body2" color="text.secondary" className="pulse">
                    {AGENT_LABELS[activeAgent] || "Working..."}
                  </Typography>
                </>
              )}
              {!activeAgent && (
                <Typography variant="body2" color="text.secondary" className="pulse">
                  Starting research...
                </Typography>
              )}
            </Box>
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
                  sx={{ borderRadius: 2, fontSize: "0.8rem" }}
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
