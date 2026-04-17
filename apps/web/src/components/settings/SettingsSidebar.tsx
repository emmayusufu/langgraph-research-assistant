"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";

const SECTIONS = [
  { href: "/settings/profile", label: "Profile" },
  { href: "/settings/api-keys", label: "API Keys" },
  { href: "/settings/people", label: "People" },
];

export function SettingsSidebar() {
  const pathname = usePathname();

  return (
    <Box
      sx={(theme) => ({
        width: 264,
        flexShrink: 0,
        display: "flex",
        flexDirection: "column",
        backgroundColor: "#EEE8D8",
        height: "100vh",
        ...theme.applyStyles("dark", {
          backgroundColor: "#121006",
        }),
      })}
    >
      <Box sx={{ px: 3.5, pt: 3.5, pb: 2.5 }}>
        <Box
          component={Link}
          href="/docs"
          sx={{
            display: "inline-flex",
            alignItems: "center",
            gap: 0.5,
            fontSize: "0.75rem",
            fontWeight: 500,
            color: "text.secondary",
            textDecoration: "none",
            opacity: 0.75,
            "&:hover": { opacity: 1, color: "text.primary" },
          }}
        >
          <ArrowBackRoundedIcon sx={{ fontSize: 14 }} />
          Back to docs
        </Box>
        <Typography
          sx={{
            mt: 2,
            fontSize: "1.1rem",
            fontWeight: 800,
            letterSpacing: "-0.03em",
          }}
        >
          Settings
        </Typography>
      </Box>

      <Box sx={{ px: 1.5, flex: 1 }}>
        {SECTIONS.map((s) => {
          const active = pathname === s.href || Boolean(pathname?.startsWith(s.href + "/"));
          return (
            <Box
              key={s.href}
              component={Link}
              href={s.href}
              sx={(theme) => ({
                display: "block",
                px: 2,
                py: 1,
                my: 0.25,
                borderRadius: "4px",
                fontSize: "0.82rem",
                fontWeight: active ? 600 : 500,
                color: active ? "text.primary" : "text.secondary",
                textDecoration: "none",
                backgroundColor: active ? "rgba(139, 155, 110, 0.14)" : "transparent",
                position: "relative",
                transition: "all 0.2s",
                "&:hover": {
                  backgroundColor: active
                    ? "rgba(139, 155, 110, 0.18)"
                    : "rgba(42, 37, 32, 0.04)",
                },
                ...theme.applyStyles("dark", {
                  backgroundColor: active ? "rgba(186, 200, 160, 0.13)" : "transparent",
                  "&:hover": {
                    backgroundColor: active
                      ? "rgba(186, 200, 160, 0.18)"
                      : "rgba(235, 230, 217, 0.05)",
                  },
                }),
              })}
            >
              {active && (
                <Box
                  sx={{
                    position: "absolute",
                    left: 0,
                    top: "20%",
                    bottom: "20%",
                    width: "2px",
                    backgroundColor: "primary.main",
                  }}
                />
              )}
              {s.label}
            </Box>
          );
        })}
      </Box>
    </Box>
  );
}
