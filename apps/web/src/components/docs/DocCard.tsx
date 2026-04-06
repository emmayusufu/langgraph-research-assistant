"use client";

import { useRouter } from "next/navigation";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardActionArea from "@mui/material/CardActionArea";
import CardContent from "@mui/material/CardContent";
import Chip from "@mui/material/Chip";
import IconButton from "@mui/material/IconButton";
import Typography from "@mui/material/Typography";
import DeleteRoundedIcon from "@mui/icons-material/DeleteRounded";
import type { Doc } from "@/lib/types";

interface DocCardProps {
  doc: Doc;
  onDelete: (id: string) => void;
}

export function DocCard({ doc, onDelete }: DocCardProps) {
  const router = useRouter();

  return (
    <Card sx={{ position: "relative" }}>
      <CardActionArea onClick={() => router.push(`/docs/${doc.id}`)}>
        <CardContent>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5 }}>
            <Typography variant="subtitle1" fontWeight={600} noWrap sx={{ flex: 1 }}>
              {doc.title}
            </Typography>
            <Chip label={doc.role} size="small" />
          </Box>
          <Typography variant="caption" color="text.secondary">
            Updated {new Date(doc.updated_at).toLocaleDateString()}
          </Typography>
        </CardContent>
      </CardActionArea>
      {doc.role === "owner" && (
        <IconButton
          size="small"
          onClick={(e) => {
            e.stopPropagation();
            onDelete(doc.id);
          }}
          sx={{ position: "absolute", top: 8, right: 8 }}
        >
          <DeleteRoundedIcon fontSize="small" />
        </IconButton>
      )}
    </Card>
  );
}
