"use client";

import IconButton from "@mui/material/IconButton";
import DarkModeOutlinedIcon from "@mui/icons-material/DarkModeOutlined";
import LightModeOutlinedIcon from "@mui/icons-material/LightModeOutlined";
import { useThemeContext } from "@/app/providers";

export function ThemeToggle() {
  const { isDark, toggleTheme } = useThemeContext();

  return (
    <IconButton
      onClick={toggleTheme}
      sx={{
        color: "text.secondary",
        transition: "color 0.2s, transform 0.2s",
        "&:hover": { color: "primary.main", transform: "rotate(30deg)" },
      }}
    >
      {isDark ? <LightModeOutlinedIcon /> : <DarkModeOutlinedIcon />}
    </IconButton>
  );
}
