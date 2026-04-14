"use client";

import Box from "@mui/material/Box";
import CircularProgress from "@mui/material/CircularProgress";
import Typography from "@mui/material/Typography";

type Stage = "writing" | "refining" | "idle";

interface Props {
  text: string;
  stage: Stage;
}

const STAGE_LABEL: Record<Stage, string> = {
  writing: "Writing…",
  refining: "Refining…",
  idle: "",
};

export function StreamingPreview({ text, stage }: Props) {
  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 1, p: 1.5 }}>
      {stage !== "idle" && (
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.875 }}>
          <CircularProgress size={11} thickness={4} sx={{ color: "primary.main" }} />
          <Typography
            sx={{
              fontSize: "0.7rem",
              fontWeight: 700,
              letterSpacing: "0.02em",
              color: "text.secondary",
              opacity: 0.85,
            }}
          >
            {STAGE_LABEL[stage]}
          </Typography>
        </Box>
      )}
      {text && (
        <Box
          sx={(theme) => ({
            px: 1.25,
            py: 1,
            borderRadius: "6px",
            border: "1px solid",
            borderColor: "divider",
            backgroundColor: "rgba(139, 155, 110, 0.05)",
            fontSize: "0.82rem",
            lineHeight: 1.6,
            color: "text.primary",
            whiteSpace: "pre-wrap",
            maxHeight: 280,
            overflowY: "auto",
            ...theme.applyStyles("dark", {
              backgroundColor: "rgba(186, 200, 160, 0.06)",
            }),
          })}
        >
          {text}
        </Box>
      )}
    </Box>
  );
}
