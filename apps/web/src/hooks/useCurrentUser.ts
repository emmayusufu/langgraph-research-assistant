"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface CurrentUser {
  id: string;
  email: string;
  name: string;
  orgId: string;
}

export function useCurrentUser(): CurrentUser | null {
  const [user, setUser] = useState<CurrentUser | null>(null);
  const router = useRouter();

  useEffect(() => {
    fetch("/api/backend/api/v1/auth/me")
      .then((res) => {
        if (res.status === 401) {
          router.push("/login");
          return null;
        }
        return res.json();
      })
      .then((data) => {
        if (!data) return;
        setUser({ id: data.id, email: data.email, name: data.name, orgId: data.org_id });
      })
      .catch(() => router.push("/login"));
  }, [router]);

  return user;
}
