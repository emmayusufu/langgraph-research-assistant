"use client";

import { useState } from "react";
import Box from "@mui/material/Box";
import TextField from "@mui/material/TextField";
import IconButton from "@mui/material/IconButton";
import SendRoundedIcon from "@mui/icons-material/SendRounded";

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled: boolean;
}

export function ChatInput({ onSend, disabled }: ChatInputProps) {
  const [value, setValue] = useState("");

  const handleSubmit = () => {
    const trimmed = value.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setValue("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const canSend = value.trim().length > 0 && !disabled;

  return (
    <Box sx={{ p: 2, px: { xs: 2, md: 4 }, pb: { xs: 2, md: 3 } }}>
      <Box
        sx={{
          maxWidth: 800,
          mx: "auto",
          display: "flex",
          alignItems: "flex-end",
          gap: 1.5,
          p: 1.5,
          pl: 2.5,
          border: 2,
          borderColor: (theme) =>
            theme.palette.mode === "dark" ? "divider" : "#d6d3d1",
          borderRadius: 3,
          bgcolor: "background.paper",
          transition: "border-color 0.2s, box-shadow 0.2s",
          "&:focus-within": {
            borderColor: "primary.main",
            boxShadow: (theme) => `0 0 0 3px ${theme.palette.primary.main}20`,
          },
        }}
      >
        <TextField
          fullWidth
          multiline
          maxRows={4}
          placeholder="Ask a technical question..."
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          variant="standard"
          InputProps={{ disableUnderline: true }}
          sx={{
            "& .MuiInputBase-input": {
              py: 0.5,
              fontSize: "0.95rem",
              "&::placeholder": { color: "text.secondary", opacity: 0.5 },
            },
          }}
        />
        <IconButton
          onClick={handleSubmit}
          disabled={!canSend}
          size="small"
          sx={{
            color: canSend ? "primary.main" : "text.disabled",
            transition: "all 0.2s",
            "&:hover": {
              bgcolor: canSend ? "primary.light" : "transparent",
            },
          }}
        >
          <SendRoundedIcon />
        </IconButton>
      </Box>
    </Box>
  );
}
