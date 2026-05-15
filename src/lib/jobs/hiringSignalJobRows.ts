/**
 * Normalize and parse hiring-signal / company job list JSON from job.server / Mongo.
 * Pure helpers shared by `useHiringSignals`, `useCompanyHiringSignals`, and modals.
 */

import {
  asRecord,
  hireSignalJobsListFromJson,
  type HireSignalApiJson,
} from "@/services/graphql/hiringSignalService";

/** Parse `postedAt` ISO for stable client-side ordering (ties broken by LinkedIn job id). */
function postedAtSortMs(iso: string): number {
  const t = Date.parse((iso ?? "").trim());
  return Number.isFinite(t) ? t : 0;
}

/**
 * Stable ordering by normalized `postedAt` (UI ISO) for the current page / merged fetch.
 */
export function sortJobRowsByPostedAt(
  rows: LinkedInJobRow[],
  order: "asc" | "desc",
): LinkedInJobRow[] {
  const copy = [...rows];
  copy.sort((a, b) => {
    const da = postedAtSortMs(a.postedAt);
    const db = postedAtSortMs(b.postedAt);
    if (da !== db) return order === "asc" ? da - db : db - da;
    const ka = (a.linkedinJobId || a.id || "").localeCompare(
      b.linkedinJobId || b.id || "",
    );
    return ka;
  });
  return copy;
}

/** One hiring-signal job row (job.server / Mongo JSON, camelCase + legacy snake_case). */
export type LinkedInJobRow = {
  id: string;
  linkedinJobId: string;
  /** job.server / Apify run id when row is tied to a scrape run. */
  runId: string;
  apifyItemId: string;
  title: string;
  companyName: string;
  companyUuid: string;
  companyLogoUrl: string;
  location: string;
  country: string;
  postedAt: string;
  employmentType: string;
  /** Mongo `function_category_v2` / gateway camelCase. */
  functionCategory: string;
  workplaceTypes?: string[];
  remoteAllowed: string;
  workRemote?: boolean;
  /** Listing / view URL (LinkedIn job page, `link` from job.server, etc.). */
  jobUrl: string;
  /** Direct application URL from job.server `applyUrl` / `apply_url` when different from listing. */
  applyUrl: string;
  descriptionHtml: string;
  seniority: string;
  educationLevelMin?: string;
  experienceBucket?: string;
  standardizedTitle: string;
  industries: string;
  skillTags?: string[];
  benefits?: string[];
  salaryMinUsd?: number | null;
  salaryMaxUsd?: number | null;
  jobState?: string;
  lastSeen?: string;
};

function pickStr(v: unknown, fallback = ""): string {
  if (v == null) return fallback;
  if (typeof v === "string") return v;
  if (typeof v === "number" || typeof v === "boolean") return String(v);
  return fallback;
}

function pickNum(v: unknown): number | null {
  if (v == null || v === "") return null;
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : null;
}

function pickStrList(v: unknown): string[] | undefined {
  if (!Array.isArray(v)) return undefined;
  const out = v
    .map((x) => (typeof x === "string" ? x : String(x ?? "")).trim())
    .filter(Boolean);
  return out.length ? out : undefined;
}

function pickBool(v: unknown): boolean | undefined {
  if (typeof v === "boolean") return v;
  if (v === "true" || v === 1) return true;
  if (v === "false" || v === 0) return false;
  return undefined;
}

/** Logo URL often lives on Apify-shaped `raw_payload` when Mongo omits `company_logo_url`. */
function extractCompanyLogoFromRawPayload(
  raw: Record<string, unknown> | null,
): string {
  if (!raw) return "";
  const nested =
    asRecord(raw.company) ??
    asRecord(raw.organization) ??
    asRecord(raw.employer);
  const candidates: unknown[] = [
    raw.companyLogo,
    raw.company_logo,
    raw.logo,
    nested?.companyLogo,
    nested?.logo,
    nested?.company_logo,
    nested?.image,
  ];
  for (const c of candidates) {
    const s = pickStr(c).trim();
    if (s) return s;
  }
  return "";
}

/** Prefer real posted time; fall back to ingest/update when job.server omits `postedAt`. */
function resolvePostedAtIso(o: Record<string, unknown>): string {
  const top = pickStr(
    o.posted_at ??
      o.postedAt ??
      o.created_at ??
      o.createdAt ??
      o.listed_at ??
      o.listedAt ??
      o.date_posted ??
      o.datePosted ??
      "",
  ).trim();
  if (top) return top;
  const raw = asRecord(o.raw_payload ?? o.rawPayload);
  if (raw) {
    const fromRaw = pickStr(
      raw.posted_at ??
        raw.postedAt ??
        raw.created_at ??
        raw.createdAt ??
        raw.listedAt ??
        raw.listed_at ??
        "",
    ).trim();
    if (fromRaw) return fromRaw;
  }
  return pickStr(
    o.ingested_at ?? o.ingestedAt ?? o.updated_at ?? o.updatedAt ?? "",
  ).trim();
}

/**
 * Primary title chain aligned with job.server `effectiveHireSignalTitleSortKeyExpr` (before
 * description fallback) so list sort order matches the Title column.
 */
function resolveJobTitleSortPrimary(
  o: Record<string, unknown>,
  rawPayload: Record<string, unknown> | null,
): string {
  const candidates: unknown[] = [
    o.title,
    o.standardized_title ?? o.standardizedTitle,
    o.poster_title ?? o.posterTitle,
    rawPayload?.job_title,
    rawPayload?.jobTitle,
    rawPayload?.title,
    rawPayload?.name,
  ];
  for (const c of candidates) {
    const s = pickStr(c).trim();
    if (s) return s;
  }
  return "";
}

/** Apply / external apply links from raw Apify-style payloads (snake + camel). */
function extractApplyUrlFromRawPayload(
  raw: Record<string, unknown> | null,
): string {
  if (!raw) return "";
  const candidates: unknown[] = [
    raw.applyUrl,
    raw.apply_url,
    raw.applyURL,
    raw.easyApplyUrl,
    raw.easy_apply_url,
    raw.externalApplyUrl,
    raw.applicationUrl,
    raw.application_url,
  ];
  for (const c of candidates) {
    const s = pickStr(c).trim();
    if (s) return s;
  }
  return "";
}

/** Normalize a single JSON object from `hireSignal.jobs` / `companyJobs` payloads. */
export function normalizeLinkedInJobRow(raw: unknown): LinkedInJobRow {
  const o = asRecord(raw) ?? {};
  const linkedinJobId = pickStr(
    o.linkedin_job_id ?? o.linkedinJobId ?? o.linkedin_jobId,
  );
  const id = pickStr(o._id ?? o.id ?? linkedinJobId);
  const runId = pickStr(o.run_id ?? o.runId);
  const functionCategory = pickStr(
    o.function_category_v2 ??
      o.functionCategoryV2 ??
      o.function_category ??
      o.functionCategory,
  );
  const jobStateRaw = pickStr(o.job_state ?? o.jobState);
  const lastSeenRaw = pickStr(o.last_seen_at ?? o.lastSeenAt ?? o.lastSeen);
  const rawPayload = asRecord(o.raw_payload ?? o.rawPayload);
  const companyLogoUrl =
    pickStr(o.company_logo_url ?? o.companyLogoUrl ?? o.company_logo).trim() ||
    extractCompanyLogoFromRawPayload(rawPayload);
  const postedAt = resolvePostedAtIso(o);
  const title =
    resolveJobTitleSortPrimary(o, rawPayload) || pickStr(o.title).trim();
  return {
    id: id || linkedinJobId,
    linkedinJobId: linkedinJobId || id,
    runId,
    apifyItemId: pickStr(o.apify_item_id ?? o.apifyItemId),
    title,
    companyName: pickStr(o.company_name ?? o.companyName),
    companyUuid: pickStr(o.company_uuid ?? o.companyUuid),
    companyLogoUrl,
    location: pickStr(o.location ?? o.formatted_location),
    country: pickStr(o.country ?? o.country_code),
    postedAt,
    employmentType: pickStr(
      o.employment_type ?? o.employmentType ?? o.job_type,
    ),
    functionCategory,
    workplaceTypes: pickStrList(o.workplace_types ?? o.workplaceTypes),
    remoteAllowed: pickStr(o.remote_allowed ?? o.remoteAllowed),
    workRemote: pickBool(o.work_remote ?? o.workRemote),
    jobUrl: pickStr(
      o.job_url ?? o.jobUrl ?? o.url ?? o.link ?? o.job_link ?? o.jobLink,
    ),
    applyUrl: (() => {
      const top = pickStr(o.apply_url ?? o.applyUrl).trim();
      if (top) return top;
      return extractApplyUrlFromRawPayload(rawPayload);
    })(),
    descriptionHtml: pickStr(
      o.description_html ?? o.descriptionHtml ?? o.description,
    ),
    seniority: pickStr(o.seniority ?? o.seniority_level ?? o.seniorityLevel),
    educationLevelMin: pickStr(
      o.education_level_min ?? o.educationLevelMin,
    ).trim()
      ? pickStr(o.education_level_min ?? o.educationLevelMin)
      : undefined,
    experienceBucket: pickStr(o.experience_bucket ?? o.experienceBucket).trim()
      ? pickStr(o.experience_bucket ?? o.experienceBucket)
      : undefined,
    standardizedTitle: pickStr(o.standardized_title ?? o.standardizedTitle),
    industries: pickStr(o.industries ?? o.industry),
    skillTags: pickStrList(o.skill_tags ?? o.skillTags),
    benefits: pickStrList(o.benefits),
    salaryMinUsd: pickNum(o.salary_min_usd ?? o.salaryMinUsd),
    salaryMaxUsd: pickNum(o.salary_max_usd ?? o.salaryMaxUsd),
    jobState: jobStateRaw.trim() ? jobStateRaw : undefined,
    lastSeen: lastSeenRaw.trim() ? lastSeenRaw : undefined,
  };
}

/** Parse `hireSignal.jobs` / `hireSignal.companyJobs` JSON envelope into typed rows. */
export function parseLinkedInJobsPayload(raw: unknown): {
  success: boolean;
  data: LinkedInJobRow[];
  total: number;
} {
  const env = hireSignalJobsListFromJson(raw as HireSignalApiJson);
  const data = env.data.map((row) => normalizeLinkedInJobRow(row));
  return { success: env.success, data, total: env.total };
}

export function effectivePostedAfter(
  preset: "all" | "new_7d",
  explicitPostedAfter: string | undefined,
): string | undefined {
  const trimmed = explicitPostedAfter?.trim();
  if (preset !== "new_7d") {
    return trimmed || undefined;
  }
  if (trimmed) return trimmed;
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - 7);
  return d.toISOString().slice(0, 10);
}
