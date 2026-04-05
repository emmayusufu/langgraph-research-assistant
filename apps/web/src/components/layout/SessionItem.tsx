"use client";

import { useState } from "react";
import IconButton from "@mui/material/IconButton";
import ListItem from "@mui/material/ListItem";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemText from "@mui/material/ListItemText";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import type { Session } from "@/lib/types";

interface SessionItemProps {
  session: Session;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
}

export function SessionItem({ session, onSelect, onDelete }: SessionItemProps) {
  const [hovered, setHovered] = useState(false);

  return (
    <ListItem
      disablePadding
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      secondaryAction={
        hovered ? (
          <IconButton
            edge="end"
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(session.id);
            }}
            sx={{ color: "text.secondary", "&:hover": { color: "error.main" } }}
          >
            <DeleteOutlineRoundedIcon sx={{ fontSize: 14 }} />
          </IconButton>
        ) : undefined
      }
    >
      <ListItemButton onClick={() => onSelect(session.id)} sx={{ py: 0.75, px: 2 }}>
        <ListItemText
          primary={session.title}
          primaryTypographyProps={{ noWrap: true, fontSize: "0.8rem", fontWeight: 500 }}
        />
      </ListItemButton>
    </ListItem>
  );
}
