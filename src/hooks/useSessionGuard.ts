"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useRole } from "@/context/RoleContext";
import { ROLES, type UserRole } from "@/lib/constants";

interface SessionGuardOptions {
  /** Legacy flag — requires ADMIN or SUPER_ADMIN role */
  requireAdmin?: boolean;
  /** Explicit allowlist of roles that may access this route */
  allowedRoles?: UserRole[];
  redirectTo?: string;
}

export function useSessionGuard({
  requireAdmin = false,
  allowedRoles,
  redirectTo = "/login",
}: SessionGuardOptions = {}) {
  const { user, loading } = useAuth();
  const { role, checkRole } = useRole();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    if (!user) {
      router.replace(redirectTo);
      return;
    }

    if (allowedRoles && allowedRoles.length > 0) {
      const hasAccess = allowedRoles.some((r) => checkRole(r));
      if (!hasAccess) {
        router.replace("/403");
      }
      return;
    }

    if (requireAdmin && role !== ROLES.ADMIN && role !== ROLES.SUPER_ADMIN) {
      router.replace("/403");
    }
  }, [
    user,
    loading,
    role,
    requireAdmin,
    allowedRoles,
    redirectTo,
    router,
    checkRole,
  ]);

  return {
    user,
    loading,
    isAdmin: role === ROLES.ADMIN || role === ROLES.SUPER_ADMIN,
    isSuperAdmin: role === ROLES.SUPER_ADMIN,
  };
}
