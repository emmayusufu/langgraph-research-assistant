"use client";

import IconButton from "@mui/material/IconButton";
import DarkModeOutlinedIcon from "@mui/icons-material/DarkModeOutlined";
import WbSunnyOutlinedIcon from "@mui/icons-material/WbSunnyOutlined";
import { useThemeContext } from "@/app/providers";

export function ThemeToggle() {
  const { isDark, toggleTheme } = useThemeContext();

  return (
    <IconButton
      onClick={toggleTheme}
      size="small"
      sx={{
        width: 28,
        height: 28,
        color: "text.secondary",
        "&:hover": { color: "primary.main" },
      }}
    >
      {isDark ? (
        <WbSunnyOutlinedIcon sx={{ fontSize: 15 }} />
      ) : (
        <DarkModeOutlinedIcon sx={{ fontSize: 15 }} />
      )}
    </IconButton>
  );
}
