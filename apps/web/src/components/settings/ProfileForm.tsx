"use client";

import { useEffect, useState } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import { FormInput } from "@/components/shared/FormInput";
import { useSettingsProfile } from "@/hooks/useSettingsProfile";

export function ProfileForm() {
  const { profile, save, saving, error } = useSettingsProfile();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");

  useEffect(() => {
    if (profile) {
      setName(profile.name);
      setEmail(profile.email);
    }
  }, [profile]);

  const emailChanged = profile !== null && email !== profile.email;
  const nameChanged = profile !== null && name !== profile.name;
  const canSave =
    profile !== null &&
    (nameChanged || emailChanged) &&
    (emailChanged ? currentPassword.length > 0 : true);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    const patch: { name?: string; email?: string; current_password?: string } = {};
    if (nameChanged) patch.name = name;
    if (emailChanged) {
      patch.email = email;
      patch.current_password = currentPassword;
    }
    try {
      await save(patch);
      setCurrentPassword("");
    } catch {
      /* handled */
    }
  };

  return (
    <Box
      component="form"
      onSubmit={handleSubmit}
      sx={{ display: "flex", flexDirection: "column", gap: 2, maxWidth: 480 }}
    >
      <FormInput label="Name" value={name} onChange={(e) => setName(e.target.value)} />
      <FormInput
        label="Email"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      {emailChanged && (
        <FormInput
          label="Current password"
          type="password"
          helperText="Required to change your email"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
        />
      )}
      {error && (
        <Typography sx={{ fontSize: "0.78rem", color: "error.main" }}>{error}</Typography>
      )}
      <Box>
        <Button
          type="submit"
          variant="contained"
          disabled={!canSave || saving}
          sx={{ boxShadow: "none", "&:hover": { boxShadow: "none" } }}
        >
          {saving ? "Saving…" : "Save changes"}
        </Button>
      </Box>
    </Box>
  );
}
