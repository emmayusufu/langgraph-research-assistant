"use client";

import { useState } from "react";
import IconButton from "@mui/material/IconButton";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import MoreHorizRoundedIcon from "@mui/icons-material/MoreHorizRounded";
import FileDownloadOutlinedIcon from "@mui/icons-material/FileDownloadOutlined";
import PictureAsPdfOutlinedIcon from "@mui/icons-material/PictureAsPdfOutlined";
import Tooltip from "@mui/material/Tooltip";
import { downloadMarkdown, downloadPdf } from "@/lib/export";

interface Props {
  docId: string;
  title: string;
  html: string;
}

export function DocMenu({ docId, title, html }: Props) {
  const [anchor, setAnchor] = useState<HTMLButtonElement | null>(null);
  const [busy, setBusy] = useState(false);
  const close = () => setAnchor(null);
  const safeTitle = title.trim() || "Untitled";

  return (
    <>
      <Tooltip title="More">
        <IconButton
          size="small"
          onClick={(e) => setAnchor(e.currentTarget)}
          sx={{
            width: 32,
            height: 32,
            color: "text.secondary",
            opacity: 0.7,
            transition: "all 0.2s",
            "&:hover": { opacity: 1, color: "primary.main", backgroundColor: "transparent" },
          }}
        >
          <MoreHorizRoundedIcon sx={{ fontSize: 16 }} />
        </IconButton>
      </Tooltip>
      <Menu
        anchorEl={anchor}
        open={Boolean(anchor)}
        onClose={close}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
        slotProps={{
          paper: {
            sx: (theme) => ({
              mt: 0.75,
              minWidth: 200,
              borderRadius: "10px",
              border: "1px solid",
              borderColor: "divider",
              boxShadow: "none",
              py: 0.5,
              backgroundColor: "#EEE8D8",
              ...theme.applyStyles("dark", { backgroundColor: "#121006" }),
              "& .MuiMenuItem-root": {
                borderRadius: "6px",
                mx: "4px",
                width: "calc(100% - 8px)",
                fontSize: "0.82rem",
              },
            }),
          },
        }}
      >
        <MenuItem
          onClick={() => {
            downloadMarkdown(safeTitle, html);
            close();
          }}
        >
          <ListItemIcon>
            <FileDownloadOutlinedIcon sx={{ fontSize: 17 }} />
          </ListItemIcon>
          <ListItemText primaryTypographyProps={{ fontSize: "0.82rem" }}>
            Export as Markdown
          </ListItemText>
        </MenuItem>
        <MenuItem
          disabled={busy}
          onClick={async () => {
            setBusy(true);
            try {
              await downloadPdf(docId, safeTitle);
            } finally {
              setBusy(false);
              close();
            }
          }}
        >
          <ListItemIcon>
            <PictureAsPdfOutlinedIcon sx={{ fontSize: 17 }} />
          </ListItemIcon>
          <ListItemText primaryTypographyProps={{ fontSize: "0.82rem" }}>
            {busy ? "Generating…" : "Export as PDF"}
          </ListItemText>
        </MenuItem>
      </Menu>
    </>
  );
}
