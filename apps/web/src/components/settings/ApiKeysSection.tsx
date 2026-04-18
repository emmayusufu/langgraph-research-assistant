"use client";

import Box from "@mui/material/Box";
import { ApiKeysCard } from "./ApiKeysCard";
import { useCredentials } from "@/hooks/useCredentials";
import { useCurrentUser } from "@/hooks/useCurrentUser";

export function ApiKeysSection() {
  const user = useCurrentUser();
  const { state, saving, saveUser, removeUser, saveWorkspace, removeWorkspace } =
    useCredentials();

  if (!state || !user) return null;

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
      <ApiKeysCard
        title="Personal key"
        description="Used for your own AI requests. Stored encrypted, never shared."
        info={state.user}
        onSave={saveUser}
        onRemove={removeUser}
        saving={saving}
      />
      <ApiKeysCard
        title="Workspace key"
        description="Used by members who haven't set their own key. Admins only."
        info={state.workspace}
        disabled={!user.isAdmin}
        disabledReason={
          user.isAdmin ? undefined : "Only workspace admins can set a shared key."
        }
        onSave={saveWorkspace}
        onRemove={removeWorkspace}
        saving={saving}
      />
    </Box>
  );
}
