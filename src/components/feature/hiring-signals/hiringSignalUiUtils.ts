import type { BadgeColor, BadgeProps } from "@/components/ui/Badge";
import type { ProgressProps } from "@/components/ui/Progress";
import { asRecord } from "@/services/graphql/hiringSignalService";
import type { LinkedInJobRow } from "@/hooks/useHiringSignals";
export { hiringSignalRowKey } from "@/lib/jobs/hiringSignalRowKeys";

/**
 * Format job `postedAt` / ISO strings from job.server for the hiring-signals UI.
 * Hardened for `en-IN` locale quirks and empty `toLocaleString` in some runtimes.
 */
export function formatHireSignalPostedDate(
  iso: string,
  options?: { withTime?: boolean; emptyAsDash?: boolean },
): string {
  const withTime = options?.withTime ?? false;
  const emptyAsDash = options?.emptyAsDash ?? !withTime;
  const s = iso?.trim() ?? "";
  if (!s) return emptyAsDash ? "—" : "";
  if (s.startsWith("0001-01-01")) return emptyAsDash ? "—" : "";
  try {
    const d = new Date(s);
    if (Number.isNaN(d.getTime())) return withTime ? s : emptyAsDash ? "—" : s;
    if (d.getUTCFullYear() < 1970) return emptyAsDash ? "—" : s;
    let out = "";
    try {
      out = withTime
        ? d.toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })
        : d.toLocaleString("en-IN", { dateStyle: "medium" });
    } catch {
      out = "";
    }
    if (!out?.trim()) {
      out = withTime
        ? d.toLocaleString(undefined, {
            year: "numeric",
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })
        : d.toLocaleDateString(undefined, {
            year: "numeric",
            month: "short",
            day: "numeric",
          });
    }
    const t = out.trim() || s.slice(0, 10);
    return t;
  } catch {
    return emptyAsDash ? "—" : s;
  }
}

/** Initials for avatar (company or person). */
export function hiringSignalInitials(name: string, fallback = "?"): string {
  const t = name.trim();
  if (!t) return fallback;
  const parts = t.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return t.slice(0, 2).toUpperCase();
}

export function employmentTypeBadgeColor(
  employmentType: string,
): BadgeProps["color"] {
  const x = employmentType.toLowerCase();
  if (x.includes("full")) return "indigo";
  if (x.includes("contract")) return "warning";
  if (x.includes("remote")) return "emerald";
  if (x.includes("part")) return "purple";
  return "gray";
}

const STRIP_BLOCK_TAGS = [
  "script",
  "style",
  "iframe",
  "embed",
  "object",
  "form",
  "base",
  "link",
  "meta",
];

function stripDangerousTagBlocks(html: string): string {
  let out = html;
  for (const tag of STRIP_BLOCK_TAGS) {
    const paired = new RegExp(`<${tag}\\b[^>]*>[\\s\\S]*?<\\/${tag}>`, "gi");
    out = out.replace(paired, "");
    out = out.replace(new RegExp(`<${tag}\\b[^>]*/>`, "gi"), "");
  }
  return out;
}

/** Normalize scraper.server session status for UI (badge, Active filter, progress). */
export function satelliteStatusFromRow(row: Record<string, unknown>): string {
  const raw =
    row.status ??
    row.Status ??
    row.state ??
    row.State ??
    row.phase ??
    row.Phase;
  if (raw == null || raw === "") return "";
  let s = String(raw).trim().toLowerCase();
  if (
    s === "success" ||
    s === "succeeded" ||
    s === "completed" ||
    s === "complete"
  ) {
    s = "done";
  }
  if (s === "canceled") s = "cancelled";
  return s;
}

/** Badge tone for scraper.server session statuses (gateway + satellite). */
export function scrapeStatusBadgeColor(status: string): BadgeColor {
  const s = (status ?? "").trim().toLowerCase();
  if (s === "done" || s === "succeeded") return "success";
  if (s === "running" || s === "pending") return "warning";
  if (s === "paused") return "info";
  if (s === "failed") return "danger";
  if (s === "cancelled") return "gray";
  return "gray";
}

/** Normalize tracked scrape row ``requestBody`` (camelCase or snake_case). */
export function parseScrapeRequestBody(requestBody: unknown): {
  keywords?: string;
  geoId?: number;
  maxJobs?: number;
  rescheduleAfterHours?: number;
} {
  const o = asRecord(requestBody);
  if (!o) return {};
  const keywords = typeof o.keywords === "string" ? o.keywords : undefined;
  const g = o.geo_id ?? o.geoId;
  let geoId: number | undefined;
  if (typeof g === "number" && Number.isFinite(g)) geoId = g;
  else if (g != null && g !== "") {
    const n = Number(g);
    if (Number.isFinite(n)) geoId = n;
  }
  const m = o.max_jobs ?? o.maxJobs;
  let maxJobs: number | undefined;
  if (typeof m === "number" && Number.isFinite(m)) maxJobs = m;
  else if (m != null && m !== "") {
    const n = Number(m);
    if (Number.isFinite(n)) maxJobs = n;
  }
  const r = o.reschedule_after_hours ?? o.rescheduleAfterHours;
  let rescheduleAfterHours: number | undefined;
  if (typeof r === "number" && Number.isFinite(r))
    rescheduleAfterHours = Math.floor(r);
  else if (r != null && r !== "") {
    const n = Math.floor(Number(r));
    if (Number.isFinite(n)) rescheduleAfterHours = n;
  }
  return { keywords, geoId, maxJobs, rescheduleAfterHours };
}

/** Search terms for a scraper.server session row (top-level or nested request). */
export function satelliteKeywordsFromRow(row: Record<string, unknown>): string {
  const top =
    row.keywords ?? row.search_keywords ?? row.query ?? row.searchQuery;
  if (typeof top === "string" && top.trim()) return top.trim();
  const fromBody = parseScrapeRequestBody(
    row.requestBody ?? row.request_body ?? row.body ?? row.request,
  );
  if (fromBody.keywords?.trim()) return fromBody.keywords.trim();
  const cfg = asRecord(row.config ?? row.Config ?? row.params ?? row.payload);
  if (cfg) {
    const k =
      cfg.keywords ??
      cfg.search_keywords ??
      cfg.query ??
      cfg.searchQuery ??
      cfg.search_query;
    if (typeof k === "string" && k.trim()) return k.trim();
  }
  return "";
}

/** Resolve satellite session id from list_sessions / metrics rows. */
export function satelliteRunIdFromRow(row: Record<string, unknown>): string {
  return String(row.job_id ?? row.runId ?? row.run_id ?? row.id ?? "");
}

/** Jobs ingested so far for a scraper.server session row (snake/camel aliases). */
export function satelliteJobsCollected(row: Record<string, unknown>): number {
  const raw =
    row.jobs_collected ??
    row.JobsCollected ??
    row.jobsCollected ??
    row.itemCount ??
    row.item_count ??
    row.total_jobs ??
    row.TotalJobs ??
    row.jobs_count ??
    row.JobsCount ??
    row.collected ??
    row.Collected ??
    0;
  const n = Number(raw);
  return Number.isFinite(n) ? Math.max(0, Math.floor(n)) : 0;
}

/** Target max jobs when the API returns `max_jobs`; null means unlimited. */
export function satelliteMaxJobsGoal(
  row: Record<string, unknown>,
): number | null {
  const m =
    row.max_jobs ??
    row.maxJobs ??
    row.target_max_jobs ??
    row.TargetMaxJobs ??
    row.target ??
    row.Target;
  if (m == null || m === "") return null;
  const n = Number(m);
  if (!Number.isFinite(n) || n <= 0) return null;
  return Math.floor(n);
}

/** One-line job count for Runs status column (satellite session row). */
export function satelliteJobsCountSummary(
  row: Record<string, unknown>,
): string {
  const n = satelliteJobsCollected(row);
  const cap = satelliteMaxJobsGoal(row);
  if (cap != null && cap > 0) {
    return `${n.toLocaleString()} / ${cap.toLocaleString()} jobs`;
  }
  return `${n.toLocaleString()} jobs`;
}

/**
 * Props for a `Progress` bar on satellite session rows: capped runs show % toward max_jobs;
 * uncapped active runs use indeterminate animation; uncapped finished runs fill relative to count.
 */
export function satelliteSessionProgressProps(row: Record<string, unknown>): {
  value: number;
  max: number;
  indeterminate: boolean;
  color: NonNullable<ProgressProps["color"]>;
  showValue: boolean;
  label: string;
} {
  const status = satelliteStatusFromRow(row);
  const collected = satelliteJobsCollected(row);
  const cap = satelliteMaxJobsGoal(row);
  const unlimited = cap == null;

  let color: NonNullable<ProgressProps["color"]> = "primary";
  if (status === "failed") color = "danger";
  else if (status === "done" || status === "succeeded") color = "success";
  else if (status === "cancelled") color = "warning";

  const active =
    status === "pending" || status === "running" || status === "paused";

  if (unlimited && active) {
    return {
      value: 0,
      max: 100,
      indeterminate: true,
      color,
      showValue: false,
      label: `${collected.toLocaleString()} jobs (no max)`,
    };
  }

  if (unlimited && !active) {
    const max = Math.max(collected, 1);
    return {
      value: collected,
      max,
      indeterminate: false,
      color,
      showValue: false,
      label: `${collected.toLocaleString()} jobs`,
    };
  }

  const max = cap!;
  const value = Math.min(collected, max);
  return {
    value,
    max,
    indeterminate: false,
    color,
    showValue: true,
    label: "Jobs collected",
  };
}

/** Strip risky HTML for job descriptions (lightweight; job.server-sourced). */
export function sanitizeJobDescriptionHtml(html: string): string {
  if (!html) return "";
  return stripDangerousTagBlocks(html)
    .replace(/\son\w+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, "")
    .replace(/javascript:/gi, "");
}

/** Normalize Connectra / job-server contact payloads for display. */
export function pickContactDisplay(row: unknown): {
  name: string;
  title: string;
  linkedinUrl: string;
  email: string;
} {
  const o = asRecord(row);
  if (!o) {
    return { name: "", title: "", linkedinUrl: "", email: "" };
  }
  const nested =
    asRecord(o.pg_contact) ?? asRecord(o.pgContact) ?? asRecord(o.contact) ?? o;
  const first = String(nested.first_name ?? nested.firstName ?? "");
  const last = String(nested.last_name ?? nested.lastName ?? "");
  const name = [first, last].filter(Boolean).join(" ").trim() || "Contact";
  return {
    name,
    title: String(nested.title ?? nested.job_title ?? ""),
    linkedinUrl: String(
      nested.linkedin_url ?? nested.linkedinUrl ?? nested.linkedin ?? "",
    ),
    email: String(nested.email ?? ""),
  };
}

/** First/last for email finder; prefers nested fields, else splits display name. */
export function pickContactFinderNames(row: unknown): {
  firstName: string;
  lastName: string;
} {
  const o = asRecord(row);
  if (!o) {
    return { firstName: "", lastName: "" };
  }
  const nested =
    asRecord(o.pg_contact) ?? asRecord(o.pgContact) ?? asRecord(o.contact) ?? o;
  let firstName = String(nested.first_name ?? nested.firstName ?? "").trim();
  let lastName = String(nested.last_name ?? nested.lastName ?? "").trim();
  if (!firstName) {
    const display = pickContactDisplay(row);
    const parts = display.name.trim().split(/\s+/).filter(Boolean);
    firstName = parts[0] ?? "";
    lastName = parts.slice(1).join(" ");
  }
  return { firstName, lastName };
}

/** Stable list key for Connectra / VQL contact rows. */
export function connectraContactStableKey(row: unknown, index: number): string {
  const o = asRecord(row);
  if (!o) return `hs-contact-${index}`;
  const nested =
    asRecord(o.pg_contact) ?? asRecord(o.pgContact) ?? asRecord(o.contact) ?? o;
  const id = nested.uuid ?? nested.id ?? nested.contact_uuid ?? o.uuid;
  if (id != null && String(id).trim()) return String(id);
  const p = pickContactDisplay(row);
  if (p.linkedinUrl.trim()) return p.linkedinUrl;
  if (p.email.trim()) return `mailto:${p.email}`;
  return `hs-contact-${index}-${p.name}`;
}

/** Normalize Connectra company record for cards. */
export function pickCompanyDisplay(row: unknown): {
  name: string;
  website: string;
  industry: string;
  employees: string;
  linkedinUrl: string;
  /** Logo URL — Connectra ``profile_pic`` or scraper ``logo``. */
  profilePic: string;
} {
  const o = asRecord(row);
  if (!o) {
    return {
      name: "",
      website: "",
      industry: "",
      employees: "",
      linkedinUrl: "",
      profilePic: "",
    };
  }
  return {
    name: String(o.name ?? ""),
    website: String(o.website ?? o.company_website ?? ""),
    industry: String(
      Array.isArray(o.industries)
        ? o.industries.join(", ")
        : o.industries || o.industry || "",
    ),
    employees: String(
      o.employees_count ?? o.employeesCount ?? o.company_employees_count ?? "",
    ),
    linkedinUrl: String(o.linkedin_url ?? o.linkedinUrl ?? ""),
    profilePic: String(
      o.profile_pic ?? o.profilePic ?? o.logo ?? o.company_logo ?? "",
    ),
  };
}

/** Absolute https URL for a company website/domain string from Connectra or scraper. */
export function companyWebsiteHref(raw: string): string | null {
  const s = raw.trim();
  if (!s) return null;
  try {
    const withProto = /^https?:\/\//i.test(s) ? s : `https://${s}`;
    const u = new URL(withProto);
    if (u.protocol === "http:" || u.protocol === "https:") return u.href;
  } catch {
    return null;
  }
  return null;
}

/**
 * Serve LinkedIn CDN logos via same-origin `/api/proxy/linkedin-logo` so images are not
 * blocked by client privacy extensions (direct media.licdn.com → ERR_BLOCKED_BY_CLIENT).
 */
function isLinkedInCdnHost(hostname: string): boolean {
  const h = hostname.toLowerCase();
  return h === "media.licdn.com" || h.endsWith(".licdn.com");
}

export function proxiedCompanyLogoSrc(url: string): string {
  const u = url.trim();
  if (!u) return "";
  try {
    const parsed = new URL(u);
    if (parsed.protocol === "https:" && isLinkedInCdnHost(parsed.hostname)) {
      return `/api/proxy/linkedin-logo?url=${encodeURIComponent(u)}`;
    }
  } catch {
    return u;
  }
  return u;
}

/** RFC4180-style CSV from job.server ``GET /jobs`` envelope ``{ data: [...] }``. */
export function linkedinJobsPayloadToCsv(payload: unknown): string {
  const rec = asRecord(payload);
  const data = rec?.data;
  if (!Array.isArray(data) || data.length === 0) return "";
  const rows = data.filter(
    (x): x is Record<string, unknown> =>
      !!x && typeof x === "object" && !Array.isArray(x),
  );
  const keySet = new Set<string>();
  for (const r of rows) {
    for (const k of Object.keys(r)) keySet.add(k);
  }
  const keys = [...keySet];
  const esc = (v: unknown): string => {
    let s: string;
    if (v === null || v === undefined) s = "";
    else if (typeof v === "object") s = JSON.stringify(v);
    else s = String(v);
    return `"${s.replace(/"/g, '""')}"`;
  };
  const lines = [keys.join(",")];
  for (const r of rows) {
    lines.push(keys.map((k) => esc(r[k])).join(","));
  }
  return lines.join("\r\n");
}

export function downloadTextFile(
  filename: string,
  text: string,
  mime = "text/csv;charset=utf-8",
): void {
  const blob = new Blob([text], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

