"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Box from "@mui/material/Box";
import Popover from "@mui/material/Popover";
import Typography from "@mui/material/Typography";
import LogoutRoundedIcon from "@mui/icons-material/LogoutRounded";
import SettingsRoundedIcon from "@mui/icons-material/SettingsRounded";
import type { CurrentUser } from "@/hooks/useCurrentUser";

interface Props {
  user: CurrentUser;
}

export function UserMenu({ user }: Props) {
  const anchorRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const router = useRouter();

  const handleSignOut = async () => {
    await fetch("/api/backend/api/v1/auth/logout", { method: "POST" });
    window.location.href = "/login";
  };

  const handleSettings = () => {
    setOpen(false);
    router.push("/settings/profile");
  };

  return (
    <>
      <Box
        ref={anchorRef}
        onClick={() => setOpen(true)}
        sx={(theme) => ({
          cursor: "pointer",
          px: 0.75,
          py: 0.375,
          borderRadius: "6px",
          flex: 1,
          minWidth: 0,
          transition: "background-color 0.15s",
          "&:hover": { backgroundColor: "rgba(42, 37, 32, 0.04)" },
          ...theme.applyStyles("dark", {
            "&:hover": { backgroundColor: "rgba(235, 230, 217, 0.05)" },
          }),
        })}
      >
        <Typography
          noWrap
          sx={{
            fontSize: "0.72rem",
            fontWeight: 600,
            color: "text.secondary",
            opacity: 0.75,
          }}
        >
          {user.email}
        </Typography>
      </Box>
      <Popover
        open={open}
        anchorEl={anchorRef.current}
        onClose={() => setOpen(false)}
        anchorOrigin={{ vertical: "top", horizontal: "left" }}
        transformOrigin={{ vertical: "bottom", horizontal: "left" }}
        slotProps={{
          paper: {
            sx: {
              mb: 0.75,
              minWidth: 208,
              borderRadius: "10px",
              border: "1px solid",
              borderColor: "divider",
              boxShadow: "0 12px 32px rgba(42, 37, 32, 0.12)",
              overflow: "hidden",
            },
          },
        }}
      >
        <Box sx={{ px: 1.5, py: 1.25, borderBottom: "1px solid", borderColor: "divider" }}>
          <Typography noWrap sx={{ fontSize: "0.82rem", fontWeight: 600 }}>
            {user.name || user.email}
          </Typography>
          <Typography
            sx={{
              fontSize: "0.62rem",
              mt: 0.5,
              letterSpacing: "0.16em",
              textTransform: "uppercase",
              fontWeight: 700,
              color: "text.secondary",
              opacity: 0.65,
            }}
          >
            {user.isAdmin ? "Admin" : "Member"}
          </Typography>
        </Box>
        <MenuItem icon={<SettingsRoundedIcon sx={{ fontSize: 14 }} />} label="Settings" onClick={handleSettings} />
        <MenuItem icon={<LogoutRoundedIcon sx={{ fontSize: 14 }} />} label="Sign out" onClick={handleSignOut} />
      </Popover>
    </>
  );
}

function MenuItem({
  icon,
  label,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <Box
      onClick={onClick}
      sx={(theme) => ({
        display: "flex",
        alignItems: "center",
        gap: 1,
        px: 1.5,
        py: 0.875,
        cursor: "pointer",
        fontSize: "0.82rem",
        color: "text.primary",
        "&:hover": { backgroundColor: "rgba(139, 155, 110, 0.12)" },
        ...theme.applyStyles("dark", {
          "&:hover": { backgroundColor: "rgba(186, 200, 160, 0.12)" },
        }),
      })}
    >
      {icon}
      {label}
    </Box>
  );
}
