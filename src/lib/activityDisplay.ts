import type { LucideIcon } from "lucide-react";
import {
  Activity,
  Briefcase,
  Building2,
  CreditCard,
  KeyRound,
  Mail,
  MessageSquare,
  Navigation,
  Search,
  Share2,
  Upload,
  User,
  Users,
} from "lucide-react";

/** Normalize API strings for lookup (lowercase, underscores kept). */
function norm(s: string): string {
  return s.trim().toLowerCase();
}

const SERVICE_ICONS: Record<string, LucideIcon> = {
  contacts: Users,
  companies: Building2,
  email: Mail,
  ai_chats: MessageSquare,
  linkedin: Share2,
  sales_navigator: Search,
  jobs: Briefcase,
  imports: Upload,
  auth: KeyRound,
  billing: CreditCard,
  profile: User,
  phone: Mail,
  hire_signal: Briefcase,
  campaigns: Mail,
  saved_searches: Search,
  notifications: Activity,
  navigation: Navigation,
  files: Upload,
  resume: User,
};

export function activityServiceIcon(serviceType: string): LucideIcon {
  const k = norm(serviceType);
  if (SERVICE_ICONS[k]) return SERVICE_ICONS[k];
  if (k.includes("email")) return Mail;
  if (k.includes("contact")) return Users;
  if (k.includes("company")) return Building2;
  if (k.includes("job")) return Briefcase;
  if (k.includes("import")) return Upload;
  return Activity;
}

/** Icon tint for the feed tile (matches dashboard tokens). */
export function activityIconAccent(serviceType: string): string {
  const k = norm(serviceType);
  if (k === "email" || k.includes("email")) return "var(--c360-primary)";
  if (k === "contacts" || k.includes("contact")) return "var(--c360-accent)";
  if (k === "companies" || k.includes("compan")) return "var(--c360-info)";
  if (k === "ai_chats" || k.includes("chat")) return "var(--c360-success)";
  if (k === "linkedin" || k.includes("linkedin")) return "var(--c360-primary)";
  if (k === "sales_navigator" || k.includes("sales"))
    return "var(--c360-warning)";
  if (k === "jobs" || k.includes("job")) return "var(--c360-warning)";
  if (k === "imports" || k.includes("import")) return "var(--c360-success)";
  if (k === "auth" || k.includes("auth")) return "var(--c360-warning)";
  if (k === "billing" || k.includes("billing")) return "var(--c360-accent)";
  if (k === "navigation" || k.includes("nav")) return "var(--c360-info)";
  return "var(--c360-primary)";
}

export function activityStatusColor(status: string): string {
  const s = norm(status);
  if (s === "success") return "var(--c360-success)";
  if (s === "failed") return "var(--c360-danger)";
  if (s === "partial") return "var(--c360-warning)";
  return "var(--c360-text-muted)";
}

export function humanizeToken(s: string): string {
  if (!s) return "—";
  return s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}
