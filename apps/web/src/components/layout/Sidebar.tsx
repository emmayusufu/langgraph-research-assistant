"use client";

import Box from "@mui/material/Box";
import Drawer from "@mui/material/Drawer";
import List from "@mui/material/List";
import Typography from "@mui/material/Typography";
import { SessionItem } from "./SessionItem";
import type { Session } from "@/lib/types";

interface SidebarProps {
  open: boolean;
  onClose: () => void;
  sessions: Session[];
  onSelectSession: (id: string) => void;
  onDeleteSession: (id: string) => void;
}

function groupByDate(sessions: Session[]): {
  today: Session[];
  yesterday: Session[];
  older: Session[];
} {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterdayStart = new Date(todayStart.getTime() - 86400000);

  return sessions.reduce(
    (acc, s) => {
      const d = new Date(s.updated_at);
      if (d >= todayStart) acc.today.push(s);
      else if (d >= yesterdayStart) acc.yesterday.push(s);
      else acc.older.push(s);
      return acc;
    },
    { today: [] as Session[], yesterday: [] as Session[], older: [] as Session[] },
  );
}

function SectionLabel({ label }: { label: string }) {
  return (
    <Typography
      variant="caption"
      sx={{ px: 2, py: 0.5, display: "block", color: "text.disabled", fontSize: "0.7rem" }}
    >
      {label}
    </Typography>
  );
}

export function Sidebar({
  open,
  onClose,
  sessions,
  onSelectSession,
  onDeleteSession,
}: SidebarProps) {
  const groups = groupByDate(sessions);

  return (
    <Drawer
      anchor="left"
      open={open}
      onClose={onClose}
      variant="temporary"
      sx={{ "& .MuiDrawer-paper": { width: 280, pt: 8 } }}
    >
      <Box sx={{ px: 2, pb: 1 }}>
        <Typography
          variant="caption"
          sx={{
            fontWeight: 700,
            color: "text.secondary",
            textTransform: "uppercase",
            letterSpacing: "0.08em",
          }}
        >
          History
        </Typography>
      </Box>

      {groups.today.length > 0 && (
        <>
          <SectionLabel label="Today" />
          <List dense disablePadding>
            {groups.today.map((s) => (
              <SessionItem
                key={s.id}
                session={s}
                onSelect={onSelectSession}
                onDelete={onDeleteSession}
              />
            ))}
          </List>
        </>
      )}

      {groups.yesterday.length > 0 && (
        <>
          <SectionLabel label="Yesterday" />
          <List dense disablePadding>
            {groups.yesterday.map((s) => (
              <SessionItem
                key={s.id}
                session={s}
                onSelect={onSelectSession}
                onDelete={onDeleteSession}
              />
            ))}
          </List>
        </>
      )}

      {groups.older.length > 0 && (
        <>
          <SectionLabel label="Older" />
          <List dense disablePadding>
            {groups.older.map((s) => (
              <SessionItem
                key={s.id}
                session={s}
                onSelect={onSelectSession}
                onDelete={onDeleteSession}
              />
            ))}
          </List>
        </>
      )}

      {sessions.length === 0 && (
        <Typography variant="body2" sx={{ px: 2, mt: 2, color: "text.disabled" }}>
          No history yet
        </Typography>
      )}
    </Drawer>
  );
}
