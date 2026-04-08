"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { ROUTES } from "@/lib/constants";

/**
 * Redirects authenticated users away from auth pages (login, register, etc.).
 * Use at the top of every auth page component.
 */
export function useAuthRedirect(redirectTo: string = ROUTES.DASHBOARD) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.replace(redirectTo);
    }
  }, [user, loading, router, redirectTo]);

  return { loading, isAuthenticated: !!user };
}
