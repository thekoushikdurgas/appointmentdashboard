"use client";

import { useState, useEffect, useCallback } from "react";
import { graphqlQuery } from "@/lib/graphqlClient";
import type { SessionInfo } from "@/graphql/generated/types";
import { AUTH_SESSION_QUERY } from "@/graphql/authOperations";
import { isAuthenticated } from "@/lib/tokenManager";

type SessionResponse = { auth: { session: SessionInfo } };

/**
 * Loads `auth.session` when a valid access token exists (requires Bearer).
 * Use for `lastSignInAt` / lightweight checks; full profile stays on `useAuth` + `me`.
 */
export function useAuthSession() {
  const [session, setSession] = useState<SessionInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSession = useCallback(async () => {
    if (!isAuthenticated()) {
      setSession(null);
      setError(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await graphqlQuery<SessionResponse>(
        AUTH_SESSION_QUERY,
        {},
        {
          showToastOnError: false,
        },
      );
      setSession(data.auth.session);
    } catch (e) {
      setSession(null);
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchSession();
  }, [fetchSession]);

  return { session, loading, error, refetch: fetchSession };
}
