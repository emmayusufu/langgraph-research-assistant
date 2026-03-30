"use client";

import Drawer from "@mui/material/Drawer";
import Toolbar from "@mui/material/Toolbar";
import List from "@mui/material/List";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemText from "@mui/material/ListItemText";
import ListItemIcon from "@mui/material/ListItemIcon";
import Divider from "@mui/material/Divider";
import Box from "@mui/material/Box";
import Switch from "@mui/material/Switch";
import FormControlLabel from "@mui/material/FormControlLabel";
import Typography from "@mui/material/Typography";
import AddIcon from "@mui/icons-material/Add";
import DescriptionOutlinedIcon from "@mui/icons-material/DescriptionOutlined";
import ChatOutlinedIcon from "@mui/icons-material/ChatOutlined";
import type { OutputMode } from "@/lib/types";

const DRAWER_WIDTH = 300;

interface SidebarProps {
  open: boolean;
  outputMode: OutputMode;
  onModeChange: (mode: OutputMode) => void;
  onClose: () => void;
}

export function Sidebar({ open, outputMode, onModeChange, onClose }: SidebarProps) {
  return (
    <Drawer
      variant="temporary"
      open={open}
      onClose={onClose}
      sx={{
        width: DRAWER_WIDTH,
        "& .MuiDrawer-paper": {
          width: DRAWER_WIDTH,
          border: "none",
          bgcolor: "background.paper",
        },
      }}
    >
      <Toolbar />
      <Box sx={{ p: 2.5, display: "flex", flexDirection: "column", gap: 2 }}>
        <Typography variant="subtitle2" color="text.secondary">
          Output Mode
        </Typography>
        <Box
          sx={{
            display: "flex",
            gap: 1,
          }}
        >
          <Box
            onClick={() => onModeChange("chat")}
            sx={{
              flex: 1,
              p: 1.5,
              borderRadius: 2,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 1,
              border: 1,
              borderColor: outputMode === "chat" ? "primary.main" : "divider",
              bgcolor: outputMode === "chat" ? "primary.light" : "transparent",
              transition: "all 0.2s",
            }}
          >
            <ChatOutlinedIcon
              fontSize="small"
              sx={{ color: outputMode === "chat" ? "primary.main" : "text.secondary" }}
            />
            <Typography
              variant="body2"
              fontWeight={outputMode === "chat" ? 600 : 400}
              color={outputMode === "chat" ? "primary.main" : "text.secondary"}
            >
              Chat
            </Typography>
          </Box>
          <Box
            onClick={() => onModeChange("report")}
            sx={{
              flex: 1,
              p: 1.5,
              borderRadius: 2,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 1,
              border: 1,
              borderColor: outputMode === "report" ? "primary.main" : "divider",
              bgcolor: outputMode === "report" ? "primary.light" : "transparent",
              transition: "all 0.2s",
            }}
          >
            <DescriptionOutlinedIcon
              fontSize="small"
              sx={{ color: outputMode === "report" ? "primary.main" : "text.secondary" }}
            />
            <Typography
              variant="body2"
              fontWeight={outputMode === "report" ? 600 : 400}
              color={outputMode === "report" ? "primary.main" : "text.secondary"}
            >
              Report
            </Typography>
          </Box>
        </Box>
      </Box>
      <Divider />
      <List sx={{ px: 1 }}>
        <ListItemButton sx={{ borderRadius: 2, mx: 0.5 }}>
          <ListItemIcon sx={{ minWidth: 36 }}>
            <AddIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText
            primary="New Research"
            primaryTypographyProps={{ variant: "body2", fontWeight: 500 }}
          />
        </ListItemButton>
      </List>
    </Drawer>
  );
}
