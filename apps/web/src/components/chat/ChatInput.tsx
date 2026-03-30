"use client";

import { useState } from "react";
import Box from "@mui/material/Box";
import TextField from "@mui/material/TextField";
import IconButton from "@mui/material/IconButton";
import ArrowUpwardRoundedIcon from "@mui/icons-material/ArrowUpwardRounded";

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
    <Box
      sx={{
        p: 2,
        px: { xs: 2, md: 4 },
        pb: { xs: 2, md: 3 },
      }}
    >
      <Box
        sx={{
          maxWidth: 800,
          mx: "auto",
          display: "flex",
          alignItems: "flex-end",
          gap: 1,
          p: 1,
          pl: 2,
          border: 1,
          borderColor: "divider",
          borderRadius: 3,
          bgcolor: "background.paper",
          transition: "border-color 0.2s, box-shadow 0.2s",
          "&:focus-within": {
            borderColor: "primary.main",
            boxShadow: (theme) => `0 0 0 3px ${theme.palette.primary.main}18`,
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
              py: 1,
              fontSize: "0.95rem",
              "&::placeholder": { color: "text.secondary", opacity: 0.6 },
            },
          }}
        />
        <IconButton
          onClick={handleSubmit}
          disabled={!canSend}
          sx={{
            bgcolor: canSend ? "primary.main" : "action.disabledBackground",
            color: canSend ? "white" : "action.disabled",
            width: 36,
            height: 36,
            transition: "all 0.2s",
            "&:hover": {
              bgcolor: canSend ? "primary.dark" : "action.disabledBackground",
              transform: canSend ? "scale(1.05)" : "none",
            },
          }}
        >
          <ArrowUpwardRoundedIcon fontSize="small" />
        </IconButton>
      </Box>
    </Box>
  );
}
