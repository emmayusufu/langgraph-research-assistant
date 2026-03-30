"use client";

import List from "@mui/material/List";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemText from "@mui/material/ListItemText";
import ListItemIcon from "@mui/material/ListItemIcon";
import OpenInNewRoundedIcon from "@mui/icons-material/OpenInNewRounded";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import type { ResearchResult } from "@/lib/types";

interface SourceListProps {
  sources: ResearchResult[];
}

export function SourceList({ sources }: SourceListProps) {
  if (sources.length === 0) return null;

  return (
    <Box
      sx={{
        mt: 2,
        border: 1,
        borderColor: "divider",
        borderRadius: 3,
        overflow: "hidden",
      }}
    >
      <Typography
        variant="subtitle2"
        color="text.secondary"
        sx={{ px: 2, pt: 2, pb: 1 }}
      >
        Sources
      </Typography>
      <List dense disablePadding>
        {sources.map((source, index) => (
          <ListItemButton
            key={index}
            component="a"
            href={source.source_url}
            target="_blank"
            rel="noopener noreferrer"
            sx={{
              px: 2,
              transition: "background-color 0.15s",
            }}
          >
            <ListItemIcon sx={{ minWidth: 32 }}>
              <OpenInNewRoundedIcon sx={{ fontSize: 16, color: "text.secondary" }} />
            </ListItemIcon>
            <ListItemText
              primary={source.title}
              secondary={source.source_url}
              primaryTypographyProps={{ variant: "body2", fontWeight: 500 }}
              secondaryTypographyProps={{
                variant: "caption",
                noWrap: true,
                color: "text.secondary",
              }}
            />
          </ListItemButton>
        ))}
      </List>
    </Box>
  );
}
