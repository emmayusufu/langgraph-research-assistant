"use client";

import { useState } from "react";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import InputAdornment from "@mui/material/InputAdornment";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import EmailOutlinedIcon from "@mui/icons-material/EmailOutlined";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await fetch("/api/backend/api/v1/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) {
      const data = await res.json();
      setError(data.detail ?? "Invalid credentials");
      setLoading(false);
      return;
    }
    window.location.href = "/";
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
              background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <AutoAwesomeIcon sx={{ color: "white", fontSize: 18 }} />
          </Box>
          <Typography variant="h6" fontWeight={700} letterSpacing="-0.3px">
            Research Assistant
          </Typography>
        </Box>

        <Typography variant="h5" fontWeight={700} mb={0.5}>
          Welcome back
        </Typography>
        <Typography variant="body2" color="text.secondary" mb={4}>
          Sign in to continue
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2, borderRadius: "10px" }}>
            {error}
          </Alert>
        )}

        <Stack component="form" onSubmit={handleSubmit} spacing={2}>
          <TextField
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            fullWidth
            sx={inputSx}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <EmailOutlinedIcon fontSize="small" color="action" />
                </InputAdornment>
              ),
            }}
          />
          <TextField
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            fullWidth
            sx={inputSx}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <LockOutlinedIcon fontSize="small" color="action" />
                </InputAdornment>
              ),
            }}
          />
          <Button
            type="submit"
            variant="contained"
            fullWidth
            disabled={loading}
            endIcon={loading ? <CircularProgress size={16} color="inherit" /> : <ArrowForwardIcon />}
            sx={{ borderRadius: "12px", py: 1.4, fontWeight: 600, mt: 1 }}
          >
            {loading ? "Signing in…" : "Sign in"}
          </Button>
        </Stack>

        <Typography variant="body2" color="text.secondary" sx={{ mt: 3, textAlign: "center" }}>
          No account?{" "}
          <Box component="a" href="/signup" sx={{ color: "primary.main", fontWeight: 600, textDecoration: "none" }}>
            Create one
          </Box>
        </Typography>
      </Box>
    </Box>
  );
}
