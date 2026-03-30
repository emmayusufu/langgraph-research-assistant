"use client";

import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import ChatOutlinedIcon from "@mui/icons-material/ChatOutlined";
import type { ResearchResult } from "@/lib/types";
import { ReportSection } from "./ReportSection";
import { SourceList } from "./SourceList";

interface ReportViewProps {
  content: string;
  sources: ResearchResult[];
  onSwitchToChat: () => void;
}

export function ReportView({
  content,
  sources,
  onSwitchToChat,
}: ReportViewProps) {
  const sections = parseReportSections(content);

  return (
    <Box
      sx={{
        flex: 1,
        overflow: "auto",
        py: 3,
        px: { xs: 2, md: 4 },
      }}
    >
      <Box sx={{ maxWidth: 800, mx: "auto" }}>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 3,
          }}
        >
          <Typography variant="h6">Research Report</Typography>
          <Button
            size="small"
            variant="outlined"
            startIcon={<ChatOutlinedIcon />}
            onClick={onSwitchToChat}
            sx={{ borderRadius: 2, fontSize: "0.8rem" }}
          >
            Back to Chat
          </Button>
        </Box>
        {sections.map((section, index) => (
          <ReportSection
            key={index}
            title={section.title}
            content={section.content}
            defaultExpanded={index === 0}
          />
        ))}
        <SourceList sources={sources} />
      </Box>
    </Box>
  );
}

function parseReportSections(
  content: string,
): Array<{ title: string; content: string }> {
  const lines = content.split("\n");
  const sections: Array<{ title: string; content: string }> = [];
  let currentTitle = "Overview";
  let currentContent: string[] = [];

  for (const line of lines) {
    if (line.startsWith("## ")) {
      if (currentContent.length > 0) {
        sections.push({
          title: currentTitle,
          content: currentContent.join("\n").trim(),
        });
      }
      currentTitle = line.replace("## ", "").trim();
      currentContent = [];
    } else {
      currentContent.push(line);
    }
  }

  if (currentContent.length > 0) {
    sections.push({
      title: currentTitle,
      content: currentContent.join("\n").trim(),
    });
  }

  return sections;
}
