"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useRole } from "@/context/RoleContext";
import { ROLES } from "@/lib/constants";

interface SessionGuardOptions {
  redirectTo?: string;
}

/** Ensures a logged-in session; redirects to login when unauthenticated. */
export function useSessionGuard({
  redirectTo = "/login",
}: SessionGuardOptions = {}) {
  const { user, loading } = useAuth();
  const { role } = useRole();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    if (!user) {
      router.replace(redirectTo);
    }
  }, [user, loading, redirectTo, router]);

  return {
    user,
    loading,
    isAdmin: role === ROLES.ADMIN || role === ROLES.SUPER_ADMIN,
    isSuperAdmin: role === ROLES.SUPER_ADMIN,
  };
}
