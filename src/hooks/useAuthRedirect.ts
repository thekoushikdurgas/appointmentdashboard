"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { consumePostLoginRoute } from "@/lib/returnRoute";

/**
 * Redirects authenticated users away from auth pages (login, register, etc.).
 * Use at the top of every auth page component.
 */
export function useAuthRedirect(redirectTo?: string) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const target = redirectTo ?? consumePostLoginRoute();

  useEffect(() => {
    if (!loading && user) {
      router.replace(target);
    }
  }, [user, loading, router, target]);

  return { loading, isAuthenticated: !!user };
}
