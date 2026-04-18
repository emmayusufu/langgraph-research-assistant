"use client";

import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { ApiKeysSection } from "@/components/settings/ApiKeysSection";

export default function ApiKeysPage() {
  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3, maxWidth: 720 }}>
      <Box>
        <Typography
          sx={{ fontSize: "1.6rem", fontWeight: 800, letterSpacing: "-0.02em", mb: 1 }}
        >
          API keys
        </Typography>
        <Typography sx={{ fontSize: "0.9rem", color: "text.secondary" }}>
          Configure DeepSeek API access. Personal keys take precedence over the workspace key. Get
          a key at{" "}
          <Box
            component="a"
            href="https://platform.deepseek.com"
            target="_blank"
            rel="noreferrer"
            sx={{
              color: "primary.main",
              textDecoration: "none",
              "&:hover": { textDecoration: "underline" },
            }}
          >
            platform.deepseek.com
          </Box>
          .
        </Typography>
      </Box>
      <ApiKeysSection />
    </Box>
  );
}
