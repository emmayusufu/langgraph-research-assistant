"use client";

import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import Box from "@mui/material/Box";
import MenuIcon from "@mui/icons-material/Menu";
import TravelExploreIcon from "@mui/icons-material/TravelExplore";
import { ThemeToggle } from "./ThemeToggle";

interface HeaderProps {
  onMenuClick: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
  return (
    <AppBar
      position="fixed"
      elevation={0}
      sx={{
        zIndex: (theme) => theme.zIndex.drawer + 1,
        bgcolor: "background.paper",
        color: "text.primary",
        borderBottom: 1,
        borderColor: "divider",
        backdropFilter: "blur(12px)",
        backgroundColor: (theme) =>
          theme.palette.mode === "dark"
            ? "rgba(28, 25, 23, 0.85)"
            : "rgba(255, 255, 255, 0.85)",
      }}
    >
      <Toolbar sx={{ gap: 1 }}>
        <IconButton edge="start" onClick={onMenuClick} sx={{ color: "text.secondary" }}>
          <MenuIcon />
        </IconButton>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexGrow: 1 }}>
          <TravelExploreIcon sx={{ color: "primary.main", fontSize: 28 }} />
          <Typography
            variant="h6"
            noWrap
            sx={{ fontSize: "1.1rem" }}
          >
            Research Assistant
          </Typography>
        </Box>
        <ThemeToggle />
      </Toolbar>
    </AppBar>
  );
}
