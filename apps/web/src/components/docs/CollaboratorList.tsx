"use client";

import { useState } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemText from "@mui/material/ListItemText";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import PersonRemoveRoundedIcon from "@mui/icons-material/PersonRemoveRounded";
import type { DocCollaborator } from "@/lib/types";

interface CollaboratorListProps {
  collaborators: DocCollaborator[];
  isOwner: boolean;
  onAdd: (email: string, role: "editor" | "viewer") => Promise<void>;
  onRemove: (userId: string) => Promise<void>;
}

export function CollaboratorList({ collaborators, isOwner, onAdd, onRemove }: CollaboratorListProps) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"editor" | "viewer">("editor");
  const [error, setError] = useState<string | null>(null);

  const handleAdd = async () => {
    setError(null);
    try {
      await onAdd(email.trim(), role);
      setEmail("");
    } catch {
      setError("User not found");
    }
  };

  return (
    <Box>
      <Typography variant="subtitle2" gutterBottom>
        Collaborators
      </Typography>
      <List dense disablePadding>
        {collaborators.map((c) => (
          <ListItem
            key={c.user_id}
            disableGutters
            secondaryAction={
              isOwner && (
                <IconButton edge="end" size="small" onClick={() => onRemove(c.user_id)}>
                  <PersonRemoveRoundedIcon fontSize="small" />
                </IconButton>
              )
            }
          >
            <ListItemText
              primary={c.display_name ?? c.email ?? c.user_id}
              secondary={c.role}
            />
          </ListItem>
        ))}
      </List>
      {isOwner && (
        <Box sx={{ display: "flex", gap: 1, mt: 1, flexWrap: "wrap", alignItems: "flex-start" }}>
          <TextField
            size="small"
            placeholder="Email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            error={!!error}
            helperText={error ?? " "}
            sx={{ flex: 1, minWidth: 180 }}
          />
          <Select
            size="small"
            value={role}
            onChange={(e) => setRole(e.target.value as "editor" | "viewer")}
            sx={{ minWidth: 110 }}
          >
            <MenuItem value="editor">Editor</MenuItem>
            <MenuItem value="viewer">Viewer</MenuItem>
          </Select>
          <Button
            variant="contained"
            size="small"
            onClick={handleAdd}
            disabled={!email.trim()}
            sx={{ height: 40 }}
          >
            Invite
          </Button>
        </Box>
      )}
    </Box>
  );
}
