/**
 * Types aligned with contact360.io/api Strawberry schema (GraphQL camelCase over the wire).
 * @see contact360.io/api/app/graphql/modules
 */

import type { SubscriptionPlan, UserRole } from "@/lib/constants";
import { PLANS, ROLES } from "@/lib/constants";

/** Optional register/login geo — matches gateway `GeolocationInput` (camelCase). */
export interface GatewayGeolocationInput {
  ip?: string | null;
  continent?: string | null;
  continentCode?: string | null;
  country?: string | null;
  countryCode?: string | null;
  region?: string | null;
  regionName?: string | null;
  city?: string | null;
  district?: string | null;
  zip?: string | null;
  lat?: number | null;
  lon?: number | null;
  timezone?: string | null;
  offset?: number | null;
  currency?: string | null;
  isp?: string | null;
  org?: string | null;
  asname?: string | null;
  reverse?: string | null;
  device?: string | null;
  proxy?: boolean | null;
  hosting?: boolean | null;
}

/** Auth mutation payload `user` field — UserInfo. */
export interface GatewayUserInfo {
  uuid: string;
  email: string;
  name: string | null;
  role: string | null;
  userType: string | null;
}

export interface GatewayPageSummary {
  pageId: string;
  title: string;
  pageType: string;
  route: string | null;
  status: string;
}

export interface GatewayAuthPayload {
  accessToken: string;
  refreshToken: string;
  user: GatewayUserInfo;
  pages: GatewayPageSummary[] | null;
  twoFactorRequired?: boolean;
  challengeToken?: string | null;
}

/** `auth { me }` — User + nested UserProfile. */
export interface GatewayUserProfile {
  userId: string;
  jobTitle: string | null;
  bio: string | null;
  timezone: string | null;
  role: string | null;
  credits: number;
  subscriptionPlan: string | null;
  subscriptionPeriod: string | null;
  subscriptionStatus: string | null;
  subscriptionStartedAt: string | null;
  subscriptionEndsAt: string | null;
  createdAt: string | null;
  updatedAt: string | null;
  avatarUrl: string | null;
}

/** `auth { me }` — full user row from users module. */
export interface GatewayUser {
  uuid: string;
  email: string;
  name: string | null;
  isActive: boolean;
  lastSignInAt: string | null;
  createdAt: string;
  updatedAt: string | null;
  bucket: string | null;
  profile: GatewayUserProfile | null;
}

/** Map gateway role strings (e.g. SuperAdmin, Member) to app `UserRole`. */
export function normalizeGatewayRole(
  role: string | null | undefined,
): UserRole {
  const key = (role ?? "").trim().toLowerCase().replace(/\s+/g, "");
  if (key === "superadmin") return ROLES.SUPER_ADMIN;
  if (key === "admin" || key === "owner") return ROLES.ADMIN;
  if (key === "prouser") return ROLES.USER;
  if (key === "freeuser" || key === "member") return ROLES.FREE;
  return ROLES.FREE;
}

/** Best-effort plan slug from profile.subscriptionPlan. */
export function normalizeSubscriptionPlan(
  plan: string | null | undefined,
): SubscriptionPlan {
  const p = (plan ?? "").toLowerCase();
  if (p.includes("enterprise")) return PLANS.ENTERPRISE;
  if (p.includes("professional") || p.includes("pro"))
    return PLANS.PROFESSIONAL;
  if (p.includes("starter")) return PLANS.STARTER;
  return PLANS.FREE;
}
