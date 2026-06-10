import { STORAGE_DRAWER_DISPLAY_NAME } from "@/lib/files/storageDrawerUi";
import { EXPORT_DRAWER_DISPLAY_NAME } from "@/lib/jobs/exportDrawerUi";
import { HIRING_SIGNALS_SERVICE_LABEL } from "@/lib/productNames";

const EMPTY_DISPLAY = "—";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const URL_RE = /^(https?:\/\/|www\.)/i;
const PHONE_RE = /^[+]?[\d\s().-]{7,}$/;
const PATH_PREFIX_RE = /^(upload|exports)\//i;

/** Known acronyms kept uppercase inside title-cased phrases. */
const ACRONYM_WORDS = new Set([
  "ai",
  "api",
  "ceo",
  "cfo",
  "cto",
  "hr",
  "id",
  "it",
  "uk",
  "us",
  "usa",
  "vp",
  "2fa",
  "uuid",
  "xlsx",
  "csv",
  "s3",
]);

const TOKEN_LABELS: Record<string, string> = {
  contacts: "Contacts",
  companies: "Companies",
  email: "Email",
  ai_chats: "AI chats",
  linkedin: "LinkedIn",
  sales_navigator: "Sales Navigator",
  jobs: EXPORT_DRAWER_DISPLAY_NAME,
  imports: "Imports",
  auth: "Auth",
  billing: "Billing",
  profile: "Profile",
  phone: "Phone",
  hire_signal: HIRING_SIGNALS_SERVICE_LABEL,
  campaigns: "Campaigns",
  saved_searches: "Saved searches",
  notifications: "Notifications",
  navigation: "Navigation",
  files: STORAGE_DRAWER_DISPLAY_NAME,
  resume: "Resume",
  create: "Create",
  update: "Update",
  delete: "Delete",
  query: "Query",
  search: "Search",
  export: "Export",
  import: "Import",
  send: "Send",
  verify: "Verify",
  analyze: "Analyze",
  generate: "Generate",
  parse: "Parse",
  scrape: "Scrape",
  login: "Login",
  logout: "Logout",
  register: "Register",
  view: "View",
  subscribe: "Subscribe",
  reset_password: "Reset password",
  enable_2fa: "Enable 2FA",
  apply: "Apply",
  download: "Download",
  success: "Success",
  failed: "Failed",
  partial: "Partial",
};

const EMPLOYMENT_TYPE_LABELS: Record<string, string> = {
  full_time: "Full-time",
  part_time: "Part-time",
  contract: "Contract",
  temporary: "Temporary",
  volunteer: "Volunteer",
  internship: "Internship",
  other: "Other",
  remote: "Remote",
};

function normToken(s: string): string {
  return s.trim().toLowerCase();
}

/** True when the string already uses intentional mixed casing (e.g. McDonald, iPhone). */
function hasIntentionalMixedCase(s: string): boolean {
  return s.split(/\s+/).some((word) => {
    if (word.length <= 1) return false;
    return /[A-Z]/.test(word.slice(1));
  });
}

function looksLikeDomain(s: string): boolean {
  const t = s.trim();
  if (!t || t.includes(" ")) return false;
  if (URL_RE.test(t)) return true;
  return /^[a-z0-9]([a-z0-9-]*\.)+[a-z]{2,}$/i.test(t);
}

/** Detect values that must not be auto-formatted for display. */
export function isProtectedDisplayText(s: string | null | undefined): boolean {
  if (s == null) return false;
  const t = s.trim();
  if (!t) return false;
  if (EMAIL_RE.test(t)) return true;
  if (URL_RE.test(t)) return true;
  if (UUID_RE.test(t)) return true;
  if (PHONE_RE.test(t) && /\d/.test(t)) return true;
  if (PATH_PREFIX_RE.test(t)) return true;
  if (looksLikeDomain(t)) return true;
  return false;
}

function titleCaseWord(word: string): string {
  const lower = word.toLowerCase();
  if (word.length <= 3 && word === word.toUpperCase() && /[A-Z]/.test(word)) {
    return word;
  }
  if (ACRONYM_WORDS.has(lower)) {
    if (lower === "ai") return "AI";
    if (lower === "2fa") return "2FA";
    if (lower === "uuid") return "UUID";
    if (lower === "xlsx") return "XLSX";
    if (lower === "csv") return "CSV";
    if (lower === "s3") return "S3";
    return word.toUpperCase();
  }
  if (lower === "linkedin") return "LinkedIn";
  return lower.charAt(0).toUpperCase() + lower.slice(1);
}

/** Word title-case for human-readable labels; preserves protected and mixed-case strings. */
export function formatDisplayLabel(
  s: string | null | undefined,
): string {
  if (s == null) return EMPTY_DISPLAY;
  const t = s.trim();
  if (!t) return EMPTY_DISPLAY;
  if (isProtectedDisplayText(t)) return t;
  if (hasIntentionalMixedCase(t)) return t;
  if (t.length > 80 || /[.!?]\s/.test(t)) return t;

  const employmentKey = t.toLowerCase().replace(/-/g, "_");
  if (EMPLOYMENT_TYPE_LABELS[employmentKey]) {
    return EMPLOYMENT_TYPE_LABELS[employmentKey];
  }

  return t
    .split(/\s+/)
    .map((word) => titleCaseWord(word))
    .join(" ");
}

/** Curated labels for API enum tokens (services, actions, statuses). */
export function formatTokenLabel(token: string | null | undefined): string {
  if (token == null || !token.trim()) return EMPTY_DISPLAY;
  const key = normToken(token);
  if (TOKEN_LABELS[key]) return TOKEN_LABELS[key];
  return formatDisplayLabel(token.replace(/_/g, " "));
}

/** Sentence case for status strings (`failed` → `Failed`). */
export function formatStatusLabel(status: string | null | undefined): string {
  if (status == null || !status.trim()) return EMPTY_DISPLAY;
  const t = status.trim();
  if (isProtectedDisplayText(t)) return t;
  const mapped = TOKEN_LABELS[normToken(t)];
  if (mapped) return mapped;
  const lower = t.toLowerCase();
  return lower.charAt(0).toUpperCase() + lower.slice(1);
}

/** Role slug → display label (`super_admin` → `Super Admin`). */
export function formatRoleLabel(role: string | null | undefined): string {
  if (!role?.trim()) return "Member";
  return role
    .split("_")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
}

/** Format employment type for badges (handles enums and free text). */
export function formatEmploymentTypeLabel(
  raw: string | null | undefined,
): string {
  if (raw == null || !raw.trim()) return EMPTY_DISPLAY;
  const key = raw.trim().toLowerCase().replace(/-/g, "_");
  if (EMPLOYMENT_TYPE_LABELS[key]) return EMPLOYMENT_TYPE_LABELS[key];
  return formatDisplayLabel(raw.replace(/_/g, " "));
}

/** Format each list item for display, then join (e.g. departments). */
export function formatDisplayLabelList(
  items: (string | null | undefined)[],
  separator = ", ",
): string {
  const parts = items
    .map((item) => item?.trim())
    .filter((item): item is string => Boolean(item))
    .map((item) => formatDisplayLabel(item));
  return parts.length > 0 ? parts.join(separator) : EMPTY_DISPLAY;
}
