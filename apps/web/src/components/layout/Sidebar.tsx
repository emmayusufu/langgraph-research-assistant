"use client";

import Drawer from "@mui/material/Drawer";
import Toolbar from "@mui/material/Toolbar";
import List from "@mui/material/List";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemText from "@mui/material/ListItemText";
import ListItemIcon from "@mui/material/ListItemIcon";
import Divider from "@mui/material/Divider";
import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import Typography from "@mui/material/Typography";
import AddIcon from "@mui/icons-material/Add";
import ChatOutlinedIcon from "@mui/icons-material/ChatOutlined";
import DescriptionOutlinedIcon from "@mui/icons-material/DescriptionOutlined";
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
        <Box sx={{ display: "flex", gap: 1 }}>
          <Chip
            icon={<ChatOutlinedIcon />}
            label="Chat"
            onClick={() => onModeChange("chat")}
            color={outputMode === "chat" ? "primary" : "default"}
            variant={outputMode === "chat" ? "filled" : "outlined"}
          />
          <Chip
            icon={<DescriptionOutlinedIcon />}
            label="Report"
            onClick={() => onModeChange("report")}
            color={outputMode === "report" ? "primary" : "default"}
            variant={outputMode === "report" ? "filled" : "outlined"}
          />
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
