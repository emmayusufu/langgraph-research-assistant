"use client";

import { useState, useCallback, useEffect } from "react";
import type { Session } from "@/lib/types";
import { fetchSessions, deleteSession as apiDeleteSession } from "@/lib/api";

interface UseSessionsReturn {
  sessions: Session[];
  refresh: () => Promise<void>;
  removeSession: (id: string) => Promise<void>;
}

export function useSessions(): UseSessionsReturn {
  const [sessions, setSessions] = useState<Session[]>([]);

  useEffect(() => {
    const loadSessions = async () => {
      try {
        const data = await fetchSessions();
        setSessions(data);
      } catch (err) {
        console.error("failed to load sessions", err);
      }
    };
    void loadSessions();
  }, []);

  const refresh = useCallback(async () => {
    try {
      const data = await fetchSessions();
      setSessions(data);
    } catch (err) {
      console.error("failed to refresh sessions", err);
    }
  }, []);

  const removeSession = useCallback(
    async (id: string) => {
      setSessions((prev) => prev.filter((s) => s.id !== id));
      try {
        await apiDeleteSession(id);
      } catch (err) {
        console.error("failed to delete session", id, err);
        await refresh();
      }
    },
    [refresh],
  );

  return { sessions, refresh, removeSession };
}
