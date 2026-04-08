import { FeatureKey, FeatureGate } from "@/types";
import { PLANS } from "./constants";

export const FEATURE_GATES: Record<FeatureKey, FeatureGate> = {
  email_finder: {
    key: "email_finder",
    label: "Email Finder",
    plans: [PLANS.FREE, PLANS.STARTER, PLANS.PROFESSIONAL, PLANS.ENTERPRISE],
    requiresCredit: true,
    creditCost: 1,
  },
  email_verifier: {
    key: "email_verifier",
    label: "Email Verifier",
    plans: [PLANS.FREE, PLANS.STARTER, PLANS.PROFESSIONAL, PLANS.ENTERPRISE],
    requiresCredit: true,
    creditCost: 1,
  },
  bulk_finder: {
    key: "bulk_finder",
    label: "Bulk Email Finder",
    plans: [PLANS.STARTER, PLANS.PROFESSIONAL, PLANS.ENTERPRISE],
    requiresCredit: true,
    creditCost: 1,
  },
  bulk_verifier: {
    key: "bulk_verifier",
    label: "Bulk Email Verifier",
    plans: [PLANS.STARTER, PLANS.PROFESSIONAL, PLANS.ENTERPRISE],
    requiresCredit: true,
    creditCost: 1,
  },
  linkedin_export: {
    key: "linkedin_export",
    label: "LinkedIn Export",
    plans: [PLANS.PROFESSIONAL, PLANS.ENTERPRISE],
    requiresCredit: true,
    creditCost: 2,
  },
  ai_chat: {
    key: "ai_chat",
    label: "AI Chat",
    plans: [PLANS.PROFESSIONAL, PLANS.ENTERPRISE],
    requiresCredit: false,
  },
  live_voice: {
    key: "live_voice",
    label: "Live Voice AI",
    plans: [PLANS.ENTERPRISE],
    requiresCredit: false,
  },
  campaigns: {
    key: "campaigns",
    label: "Email Campaigns",
    plans: [PLANS.PROFESSIONAL, PLANS.ENTERPRISE],
    requiresCredit: false,
  },
  api_access: {
    key: "api_access",
    label: "API Access",
    plans: [PLANS.STARTER, PLANS.PROFESSIONAL, PLANS.ENTERPRISE],
    requiresCredit: false,
  },
  team_seats: {
    key: "team_seats",
    label: "Team Seats",
    plans: [PLANS.PROFESSIONAL, PLANS.ENTERPRISE],
    requiresCredit: false,
  },
  custom_integrations: {
    key: "custom_integrations",
    label: "Custom Integrations",
    plans: [PLANS.ENTERPRISE],
    requiresCredit: false,
  },
};

export function canAccessFeature(
  plan: string,
  featureKey: FeatureKey,
): boolean {
  const gate = FEATURE_GATES[featureKey];
  if (!gate) return false;
  return gate.plans.includes(plan);
}

export function getRequiredPlanForFeature(
  featureKey: FeatureKey,
): string | null {
  const gate = FEATURE_GATES[featureKey];
  if (!gate || gate.plans.length === 0) return null;
  return gate.plans[0];
}

export function hasEnoughCredits(
  credits: number,
  featureKey: FeatureKey,
): boolean {
  const gate = FEATURE_GATES[featureKey];
  if (!gate || !gate.requiresCredit) return true;
  return credits >= (gate.creditCost ?? 1);
}
