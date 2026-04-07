"use client";

import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import DescriptionOutlinedIcon from "@mui/icons-material/DescriptionOutlined";
import EditNoteIcon from "@mui/icons-material/EditNote";
import SearchIcon from "@mui/icons-material/Search";

type CircleDecor = {
  size: number;
  opacity: number;
  top?: number | string;
  bottom?: number;
  left?: number;
  right?: number;
};

const CIRCLES: CircleDecor[] = [
  { size: 340, top: -80, right: -100, opacity: 0.06 },
  { size: 200, bottom: 60, left: -60, opacity: 0.05 },
  { size: 120, top: "40%", right: 40, opacity: 0.07 },
];

const FEATURES = [
  { icon: EditNoteIcon, text: "AI-assisted writing that thinks with you" },
  { icon: SearchIcon, text: "Web & academic research across multiple sources" },
  { icon: DescriptionOutlinedIcon, text: "Private docs with real-time collaboration" },
];

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <Box sx={{ minHeight: "100vh", display: "flex", bgcolor: "background.default" }}>
      <Box
        sx={{
          display: { xs: "none", md: "flex" },
          flexDirection: "column",
          justifyContent: "center",
          width: "45%",
          px: 8,
          py: 6,
          background: (t) =>
            t.palette.mode === "dark"
              ? "linear-gradient(145deg, #0b1120 0%, #0d1e3d 60%, #0f172a 100%)"
              : "linear-gradient(145deg, #eff6ff 0%, #dbeafe 60%, #e0f2fe 100%)",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {CIRCLES.map((c, i) => (
          <Box
            key={i}
            sx={{
              position: "absolute",
              width: c.size,
              height: c.size,
              borderRadius: "50%",
              border: "1.5px solid",
              borderColor: "primary.main",
              opacity: c.opacity,
              top: c.top,
              bottom: c.bottom,
              left: c.left,
              right: c.right,
              pointerEvents: "none",
            }}
          />
        ))}

        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 8 }}>
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: "12px",
              bgcolor: "primary.main",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 4px 16px rgba(30,58,138,0.35)",
            }}
          >
            <AutoAwesomeIcon sx={{ color: "white", fontSize: 22 }} />
          </Box>
          <Typography fontWeight={800} fontSize="1.15rem" letterSpacing="-0.02em">
            Lumen
          </Typography>
        </Box>

        <Box>
          <Typography
            variant="h3"
            fontWeight={800}
            letterSpacing="-0.03em"
            lineHeight={1.15}
            sx={{ mb: 2 }}
          >
            Write clearly.{" "}
            <Box component="span" sx={{ color: "primary.main" }}>
              Think deeply.
            </Box>
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 5, maxWidth: 340 }}>
            An AI writing and research tool that helps you produce your best work.
          </Typography>
          <Stack spacing={2.5}>
            {FEATURES.map(({ icon: Icon, text }) => (
              <Box key={text} sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                <Box
                  sx={{
                    width: 36,
                    height: 36,
                    borderRadius: "10px",
                    bgcolor: (t) =>
                      t.palette.mode === "dark"
                        ? "rgba(96,165,250,0.12)"
                        : "rgba(30,58,138,0.1)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <Icon sx={{ fontSize: 18, color: "primary.main" }} />
                </Box>
                <Typography variant="body2" color="text.secondary" fontWeight={500}>
                  {text}
                </Typography>
              </Box>
            ))}
          </Stack>
        </Box>
      </Box>

      <Box
        sx={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          px: { xs: 3, sm: 6, md: 8 },
          py: 6,
        }}
      >
        <Box
          sx={{ display: { xs: "flex", md: "none" }, alignItems: "center", gap: 1.5, mb: 6 }}
        >
          <Box
            sx={{
              width: 36,
              height: 36,
              borderRadius: "10px",
              bgcolor: "primary.main",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <AutoAwesomeIcon sx={{ color: "white", fontSize: 20 }} />
          </Box>
          <Typography fontWeight={800} fontSize="1.1rem">
            Lumen
          </Typography>
        </Box>

        <Box sx={{ width: "100%", maxWidth: 380 }}>{children}</Box>
      </Box>
    </Box>
  );
}
