"use client";

import Accordion from "@mui/material/Accordion";
import AccordionSummary from "@mui/material/AccordionSummary";
import AccordionDetails from "@mui/material/AccordionDetails";
import Typography from "@mui/material/Typography";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import Link from "@mui/material/Link";

interface ReportSectionProps {
  title: string;
  content: string;
  defaultExpanded?: boolean;
}

export function ReportSection({
  title,
  content,
  defaultExpanded = false,
}: ReportSectionProps) {
  return (
    <Accordion
      defaultExpanded={defaultExpanded}
      elevation={0}
      sx={{
        border: 1,
        borderColor: "divider",
        mb: 1.5,
        "&:before": { display: "none" },
        borderRadius: "12px !important",
        overflow: "hidden",
      }}
    >
      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
        <Typography variant="subtitle1" fontWeight={600}>
          {title}
        </Typography>
      </AccordionSummary>
      <AccordionDetails>
        <Markdown
          remarkPlugins={[remarkGfm]}
          components={{
            a: ({ href, children }) => (
              <Link
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                sx={{ color: "primary.main", fontWeight: 500 }}
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
          {content}
        </Markdown>
      </AccordionDetails>
    </Accordion>
  );
}
