"use client";

import {
  createContext,
  useContext,
  useCallback,
  useEffect,
  useState,
} from "react";
import { useAuth } from "./AuthContext";
import { billingService } from "@/services/graphql/billingService";
import {
  ROLES,
  PLANS,
  type UserRole,
  type SubscriptionPlan,
} from "@/lib/constants";

interface RoleContextValue {
  role: UserRole;
  plan: SubscriptionPlan;
  credits: number;
  /** From billing API (usage vs plan limit). */
  creditsUsed: number;
  creditsLimit: number;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  isPro: () => boolean;
  checkAccess: (feature: string) => boolean;
  checkRole: (requiredRole: UserRole) => boolean;
  refreshBillingLimits: () => Promise<void>;
}

const RoleContext = createContext<RoleContextValue | null>(null);

const ROLE_HIERARCHY: Record<UserRole, number> = {
  [ROLES.FREE]: 0,
  [ROLES.USER]: 1,
  [ROLES.ADMIN]: 2,
  [ROLES.SUPER_ADMIN]: 3,
};

/**
 * Maps API plan tiers (free/starter/professional/enterprise) to feature keys.
 * Feature strings match usage in checkAccess() calls across the app.
 */
const PLAN_FEATURES: Record<SubscriptionPlan, string[]> = {
  free: ["dashboard", "contacts_read"],
  starter: [
    "dashboard",
    "contacts_read",
    "email_finder",
    "email_verifier",
    "export",
    "saved_searches",
  ],
  professional: [
    "dashboard",
    "contacts_read",
    "email_finder",
    "email_verifier",
    "bulk_finder",
    "bulk_verifier",
    "export",
    "saved_searches",
    "linkedin_export",
    "ai_chat",
    "live_voice",
    "campaigns",
    "analytics",
    "api_access",
  ],
  enterprise: ["*"],
};

export function RoleProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [creditsUsed, setCreditsUsed] = useState(0);
  const [creditsLimit, setCreditsLimit] = useState(0);

  const role = (user?.role as UserRole) ?? ROLES.FREE;
  const plan = (user?.subscription_plan as SubscriptionPlan) ?? PLANS.FREE;
  const credits = user?.credits_remaining ?? 0;

  const refreshBillingLimits = useCallback(async () => {
    if (!user) {
      setCreditsUsed(0);
      setCreditsLimit(0);
      return;
    }
    try {
      const data = await billingService.getBillingInfo();
      const b = data?.billing?.billing;
      if (b) {
        setCreditsUsed(b.creditsUsed);
        setCreditsLimit(b.creditsLimit);
      }
    } catch {
      /* keep previous */
    }
  }, [user]);

  useEffect(() => {
    void refreshBillingLimits();
  }, [refreshBillingLimits]);
  const isAdmin = ROLE_HIERARCHY[role] >= ROLE_HIERARCHY[ROLES.ADMIN];
  const isSuperAdmin = role === ROLES.SUPER_ADMIN;

  const isPro = (): boolean => {
    return (
      plan === PLANS.PROFESSIONAL || plan === PLANS.ENTERPRISE || isSuperAdmin
    );
  };

  const checkRole = (required: UserRole): boolean => {
    return ROLE_HIERARCHY[role] >= ROLE_HIERARCHY[required];
  };

  const checkAccess = (feature: string): boolean => {
    if (isSuperAdmin) return true;
    const features = PLAN_FEATURES[plan] ?? [];
    return features.includes("*") || features.includes(feature);
  };

  return (
    <RoleContext.Provider
      value={{
        role,
        plan,
        credits,
        creditsUsed,
        creditsLimit,
        isAdmin,
        isSuperAdmin,
        isPro,
        checkAccess,
        checkRole,
        refreshBillingLimits,
      }}
    >
      {children}
    </RoleContext.Provider>
  );
}

export function useRole(): RoleContextValue {
  const ctx = useContext(RoleContext);
  if (!ctx) throw new Error("useRole must be used within RoleProvider");
  return ctx;
}
