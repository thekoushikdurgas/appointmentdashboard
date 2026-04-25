import type { BadgeProps } from "@/components/ui/Badge";
import { asRecord } from "@/services/graphql/hiringSignalService";

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
} {
  const o = asRecord(row);
  if (!o) {
    return {
      name: "",
      website: "",
      industry: "",
      employees: "",
      linkedinUrl: "",
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
  };
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
