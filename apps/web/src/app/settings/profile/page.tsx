"use client";

import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { ProfileForm } from "@/components/settings/ProfileForm";
import { PasswordForm } from "@/components/settings/PasswordForm";

export default function ProfilePage() {
  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 6, maxWidth: 720 }}>
      <Box>
        <Typography
          sx={{ fontSize: "1.6rem", fontWeight: 800, letterSpacing: "-0.02em", mb: 1 }}
        >
          Profile
        </Typography>
        <Typography sx={{ fontSize: "0.9rem", color: "text.secondary", mb: 3 }}>
          Update your name and email. Email changes require your current password.
        </Typography>
        <ProfileForm />
      </Box>

      <Box>
        <Typography sx={{ fontSize: "1.1rem", fontWeight: 700, mb: 1 }}>Password</Typography>
        <Typography sx={{ fontSize: "0.85rem", color: "text.secondary", mb: 2 }}>
          Change the password used to sign in.
        </Typography>
        <PasswordForm />
      </Box>
    </Box>
  );
}
