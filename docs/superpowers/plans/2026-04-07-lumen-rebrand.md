# Lumen Rebrand Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rename the app from "Research Assistant" to "Lumen", redesign login and signup pages to a clean centered-card layout, and update all brand references across the frontend.

**Architecture:** Pure UI/copy changes across 6 files. No logic changes, no API changes, no new dependencies. Auth flow (Zitadel) is untouched.

**Tech Stack:** Next.js 16 App Router, Material UI 7, TypeScript strict mode

---

## Files Touched

| File | Change |
|------|--------|
| `apps/web/src/app/layout.tsx` | title → "Lumen", description → "AI-powered writing and research" |
| `apps/web/src/components/layout/Header.tsx` | `TravelExploreIcon` → `AutoAwesomeIcon`, label "Research" → "Lumen" |
| `apps/web/src/app/(auth)/login/page.tsx` | Full redesign — centered card, remove left panel |
| `apps/web/src/app/(auth)/signup/page.tsx` | Full redesign — centered card, remove right panel |
| `apps/web/src/app/auth/layout.tsx` | Icon + label + tagline rebrand |
| `README.md` | Title + description |

---

## Task 1: Metadata, Header, auth layout

**Files:**
- Modify: `apps/web/src/app/layout.tsx`
- Modify: `apps/web/src/components/layout/Header.tsx`
- Modify: `apps/web/src/app/auth/layout.tsx`

- [ ] 1.1 Update `apps/web/src/app/layout.tsx`:

```typescript
export const metadata: Metadata = {
  title: "Lumen",
  description: "AI-powered writing and research",
};
```

- [ ] 1.2 Update `apps/web/src/components/layout/Header.tsx`:

Replace the import:
```typescript
import TravelExploreIcon from "@mui/icons-material/TravelExplore";
```
With:
```typescript
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
```

Replace the icon usage (inside the spinning box):
```typescript
<AutoAwesomeIcon
  sx={{
    color: "white",
    fontSize: 15,
    animation: isLoading ? "spin 1.5s linear infinite" : "none",
    "@keyframes spin": {
      from: { transform: "rotate(0deg)" },
      to: { transform: "rotate(360deg)" },
    },
  }}
/>
```

Replace the label:
```typescript
<Typography
  noWrap
  sx={{ fontWeight: 700, fontSize: "0.82rem", letterSpacing: "-0.01em", color: "text.primary" }}
>
  Lumen
</Typography>
```

- [ ] 1.3 Rewrite `apps/web/src/app/auth/layout.tsx` completely:

```typescript
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
```

- [ ] 1.4 Run TypeScript check:
```bash
cd apps/web && npx tsc --noEmit
```
Expected: no errors.

- [ ] 1.5 Run lint:
```bash
cd apps/web && npm run lint
```
Fix any issues.

- [ ] 1.6 Commit:
```bash
git add apps/web/src/app/layout.tsx apps/web/src/components/layout/Header.tsx apps/web/src/app/auth/layout.tsx
git commit -m "rebrand metadata, header, and auth layout to Lumen"
```

---

## Task 2: Login page redesign

**Files:**
- Modify: `apps/web/src/app/(auth)/login/page.tsx`

- [ ] 2.1 Rewrite `apps/web/src/app/(auth)/login/page.tsx` completely:

```typescript
"use client";

import { signIn } from "next-auth/react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";

export default function LoginPage() {
  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        bgcolor: "background.default",
        px: 2,
      }}
    >
      <Box
        sx={{
          width: "100%",
          maxWidth: 420,
          p: { xs: 3, sm: 5 },
          borderRadius: "20px",
          border: 1,
          borderColor: "divider",
          bgcolor: "background.paper",
          boxShadow: (t) =>
            t.palette.mode === "dark"
              ? "0 8px 40px rgba(0,0,0,0.4)"
              : "0 8px 40px rgba(0,0,0,0.06)",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 5 }}>
          <Box
            sx={{
              width: 36,
              height: 36,
              borderRadius: "10px",
              bgcolor: "primary.main",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 4px 16px rgba(30,58,138,0.35)",
            }}
          >
            <AutoAwesomeIcon sx={{ color: "white", fontSize: 18 }} />
          </Box>
          <Typography fontWeight={800} fontSize="1.1rem" letterSpacing="-0.02em">
            Lumen
          </Typography>
        </Box>

        <Typography variant="h5" fontWeight={800} letterSpacing="-0.02em" sx={{ mb: 0.75 }}>
          Welcome back
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
          Sign in to continue
        </Typography>

        <Button
          variant="contained"
          size="large"
          fullWidth
          endIcon={<ArrowForwardIcon />}
          onClick={() => signIn("zitadel", { callbackUrl: "/" })}
          sx={{
            py: 1.5,
            fontSize: "0.95rem",
            fontWeight: 700,
            borderRadius: "14px",
            boxShadow: "0 4px 20px rgba(30,58,138,0.3)",
            "&:hover": {
              boxShadow: "0 6px 24px rgba(30,58,138,0.4)",
              transform: "translateY(-1px)",
            },
            transition: "all 0.2s ease",
          }}
        >
          Sign In
        </Button>

        <Box
          sx={{ mt: 4, pt: 4, borderTop: 1, borderColor: "divider", textAlign: "center" }}
        >
          <Typography variant="body2" color="text.secondary">
            Don&apos;t have an account?{" "}
            <Box
              component="a"
              href="/signup"
              sx={{
                color: "primary.main",
                fontWeight: 600,
                textDecoration: "none",
                "&:hover": { textDecoration: "underline" },
              }}
            >
              Create one
            </Box>
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}
```

- [ ] 2.2 Run TypeScript check:
```bash
cd apps/web && npx tsc --noEmit
```
Expected: no errors.

- [ ] 2.3 Run lint:
```bash
cd apps/web && npm run lint
```
Fix any issues.

- [ ] 2.4 Commit:
```bash
git add apps/web/src/app/\(auth\)/login/page.tsx
git commit -m "redesign login page to centered card"
```

---

## Task 3: Signup page redesign

**Files:**
- Modify: `apps/web/src/app/(auth)/signup/page.tsx`

- [ ] 3.1 Rewrite `apps/web/src/app/(auth)/signup/page.tsx` completely:

```typescript
"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import Grid from "@mui/material/Grid";
import InputAdornment from "@mui/material/InputAdornment";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import BusinessIcon from "@mui/icons-material/Business";
import EmailOutlinedIcon from "@mui/icons-material/EmailOutlined";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import PersonOutlineIcon from "@mui/icons-material/PersonOutline";

export default function SignupPage() {
  const [form, setForm] = useState({
    orgName: "",
    firstName: "",
    lastName: "",
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const set =
    (field: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await fetch("/api/org", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Something went wrong");
      setLoading(false);
      return;
    }
    await signIn("zitadel", { callbackUrl: "/" });
  };

  const inputSx = {
    "& .MuiOutlinedInput-root": { borderRadius: "12px", fontSize: "0.9rem" },
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        bgcolor: "background.default",
        px: 2,
        py: 4,
      }}
    >
      <Box
        sx={{
          width: "100%",
          maxWidth: 420,
          p: { xs: 3, sm: 5 },
          borderRadius: "20px",
          border: 1,
          borderColor: "divider",
          bgcolor: "background.paper",
          boxShadow: (t) =>
            t.palette.mode === "dark"
              ? "0 8px 40px rgba(0,0,0,0.4)"
              : "0 8px 40px rgba(0,0,0,0.06)",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 5 }}>
          <Box
            sx={{
              width: 36,
              height: 36,
              borderRadius: "10px",
              bgcolor: "primary.main",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 4px 16px rgba(30,58,138,0.35)",
            }}
          >
            <AutoAwesomeIcon sx={{ color: "white", fontSize: 18 }} />
          </Box>
          <Typography fontWeight={800} fontSize="1.1rem" letterSpacing="-0.02em">
            Lumen
          </Typography>
        </Box>

        <Typography variant="h5" fontWeight={800} letterSpacing="-0.02em" sx={{ mb: 0.75 }}>
          Create your workspace
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
          Get started in seconds
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 3, borderRadius: "12px" }}>
            {error}
          </Alert>
        )}

        <Stack component="form" spacing={2} onSubmit={handleSubmit}>
          <TextField
            label="Organisation name"
            value={form.orgName}
            onChange={set("orgName")}
            required
            fullWidth
            placeholder="Acme Corp"
            sx={inputSx}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <BusinessIcon sx={{ fontSize: 18, color: "text.disabled" }} />
                  </InputAdornment>
                ),
              },
            }}
          />

          <Grid container spacing={1.5}>
            <Grid size={6}>
              <TextField
                label="First name"
                value={form.firstName}
                onChange={set("firstName")}
                required
                fullWidth
                placeholder="Alice"
                sx={inputSx}
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <PersonOutlineIcon sx={{ fontSize: 18, color: "text.disabled" }} />
                      </InputAdornment>
                    ),
                  },
                }}
              />
            </Grid>
            <Grid size={6}>
              <TextField
                label="Last name"
                value={form.lastName}
                onChange={set("lastName")}
                required
                fullWidth
                placeholder="Smith"
                sx={inputSx}
              />
            </Grid>
          </Grid>

          <TextField
            label="Work email"
            type="email"
            value={form.email}
            onChange={set("email")}
            required
            fullWidth
            placeholder="alice@acmecorp.com"
            sx={inputSx}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <EmailOutlinedIcon sx={{ fontSize: 18, color: "text.disabled" }} />
                  </InputAdornment>
                ),
              },
            }}
          />

          <TextField
            label="Password"
            type="password"
            value={form.password}
            onChange={set("password")}
            required
            fullWidth
            placeholder="Min. 8 characters"
            sx={inputSx}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <LockOutlinedIcon sx={{ fontSize: 18, color: "text.disabled" }} />
                  </InputAdornment>
                ),
              },
            }}
          />

          <Button
            type="submit"
            variant="contained"
            size="large"
            fullWidth
            endIcon={loading ? undefined : <ArrowForwardIcon />}
            disabled={loading}
            sx={{
              py: 1.5,
              mt: 1,
              fontSize: "0.95rem",
              fontWeight: 700,
              borderRadius: "14px",
              boxShadow: "0 4px 20px rgba(30,58,138,0.3)",
              "&:hover:not(:disabled)": {
                boxShadow: "0 6px 24px rgba(30,58,138,0.4)",
                transform: "translateY(-1px)",
              },
              transition: "all 0.2s ease",
            }}
          >
            {loading ? (
              <CircularProgress size={20} sx={{ color: "white" }} />
            ) : (
              "Create workspace"
            )}
          </Button>
        </Stack>

        <Box
          sx={{ mt: 4, pt: 4, borderTop: 1, borderColor: "divider", textAlign: "center" }}
        >
          <Typography variant="body2" color="text.secondary">
            Already have an account?{" "}
            <Box
              component="a"
              href="/login"
              sx={{
                color: "primary.main",
                fontWeight: 600,
                textDecoration: "none",
                "&:hover": { textDecoration: "underline" },
              }}
            >
              Sign in
            </Box>
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}
```

- [ ] 3.2 Run TypeScript check:
```bash
cd apps/web && npx tsc --noEmit
```
Expected: no errors.

- [ ] 3.3 Run lint:
```bash
cd apps/web && npm run lint
```
Fix any issues.

- [ ] 3.4 Commit:
```bash
git add apps/web/src/app/\(auth\)/signup/page.tsx
git commit -m "redesign signup page to centered card"
```

---

## Task 4: README

**Files:**
- Modify: `README.md`

- [ ] 4.1 Update the first two lines of `README.md`:

Change:
```markdown
# Research Assistant

Multi-agent research assistant with a private docs platform. Ask a technical question and get a cited, well-organised response in ~30 seconds. Write and collaborate on documents with the AI research panel built in.
```

To:
```markdown
# Lumen

AI-powered writing and research tool. Write and collaborate on documents with a built-in research assistant that searches the web, finds sources, and synthesises findings — all without leaving your doc.
```

- [ ] 4.2 Commit:
```bash
git add README.md
git commit -m "update README title and description for Lumen rebrand"
```
