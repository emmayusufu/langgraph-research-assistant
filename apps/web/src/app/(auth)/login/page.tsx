"use client";

import { signIn } from "next-auth/react";
import {
  Box,
  Button,
  Divider,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import GitHubIcon from "@mui/icons-material/GitHub";
import GoogleIcon from "@mui/icons-material/Google";
import { useState } from "react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        bgcolor: "background.default",
      }}
    >
      <Stack spacing={3} sx={{ width: 360, p: 4 }}>
        <Typography variant="h5" fontWeight={700}>
          Sign in
        </Typography>

        <Stack spacing={1.5}>
          <Button
            variant="outlined"
            startIcon={<GitHubIcon />}
            onClick={() => signIn("zitadel", { callbackUrl: "/dashboard" })}
            fullWidth
          >
            Continue with GitHub
          </Button>
          <Button
            variant="outlined"
            startIcon={<GoogleIcon />}
            onClick={() => signIn("zitadel", { callbackUrl: "/dashboard" })}
            fullWidth
          >
            Continue with Google
          </Button>
        </Stack>

        <Divider>or</Divider>

        <Stack
          component="form"
          spacing={1.5}
          onSubmit={(e) => {
            e.preventDefault();
            signIn("zitadel", { callbackUrl: "/dashboard" });
          }}
        >
          <TextField
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            fullWidth
            required
          />
          <TextField
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            fullWidth
            required
          />
          <Button type="submit" variant="contained" fullWidth>
            Sign in
          </Button>
        </Stack>

        <Typography variant="body2" textAlign="center">
          New here?{" "}
          <Box component="a" href="/signup" sx={{ color: "primary.main" }}>
            Create an organization
          </Box>
        </Typography>
      </Stack>
    </Box>
  );
}
