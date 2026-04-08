"use client";

import { useState, useEffect, useCallback } from "react";
import {
  healthService,
  type SystemHealth,
} from "@/services/graphql/healthService";

const POLL_MS = 60_000;

/** Public gateway health (`skipAuth`) — `apiHealth` + `apiMetadata`. */
export function usePublicHealth() {
  const [data, setData] = useState<SystemHealth | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setData(await healthService.getPublicHealth());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Health check failed");
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
    const id = window.setInterval(() => void refresh(), POLL_MS);
    return () => window.clearInterval(id);
  }, [refresh]);

  return { data, loading, error, refresh };
}
