/**
 * Pure aggregation helpers for hiring-signal analytics dashboards.
 * Input rows come from `useHiringSignals` / company jobs (LinkedInJobRow).
 */

import type { LinkedInJobRow } from "@/hooks/useHiringSignals";
import { classifySkillTag } from "@/lib/skillCategories";

export type NamedCount = { name: string; value: number };

function postedMs(j: LinkedInJobRow): number | null {
  const t = Date.parse(j.postedAt);
  return Number.isNaN(t) ? null : t;
}

function dayKey(iso: string): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function monthKey(iso: string): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

export function median(nums: number[]): number | null {
  const a = nums.filter((n) => Number.isFinite(n)).sort((x, y) => x - y);
  if (!a.length) return null;
  const mid = Math.floor(a.length / 2);
  return a.length % 2 === 1 ? a[mid]! : (a[mid - 1]! + a[mid]!) / 2;
}

export function buildDailyPostingsSeries(
  jobs: LinkedInJobRow[],
): { day: string; count: number }[] {
  const counts = new Map<string, number>();
  for (const j of jobs) {
    const k = dayKey(j.postedAt);
    if (!k) continue;
    counts.set(k, (counts.get(k) ?? 0) + 1);
  }
  return [...counts.keys()]
    .sort()
    .map((day) => ({ day, count: counts.get(day) ?? 0 }));
}

export function buildMonthlyPostingsSeries(
  jobs: LinkedInJobRow[],
): { month: string; count: number }[] {
  const counts = new Map<string, number>();
  for (const j of jobs) {
    const k = monthKey(j.postedAt);
    if (!k) continue;
    counts.set(k, (counts.get(k) ?? 0) + 1);
  }
  return [...counts.keys()]
    .sort()
    .map((month) => ({ month, count: counts.get(month) ?? 0 }));
}

export function buildCountryBreakdown(
  jobs: LinkedInJobRow[],
  topN = 12,
): NamedCount[] {
  const m = new Map<string, number>();
  for (const j of jobs) {
    const c = (j.country || "").trim() || "Unknown";
    m.set(c, (m.get(c) ?? 0) + 1);
  }
  return [...m.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, topN)
    .map(([name, value]) => ({ name, value }));
}

export function buildLocationBreakdown(
  jobs: LinkedInJobRow[],
  topN = 25,
): { country: string; location: string; count: number }[] {
  const m = new Map<string, number>();
  for (const j of jobs) {
    const loc = (j.location || "").trim() || "—";
    const c = (j.country || "").trim() || "—";
    const key = `${c}\t${loc}`;
    m.set(key, (m.get(key) ?? 0) + 1);
  }
  return [...m.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, topN)
    .map(([key, count]) => {
      const [country, location] = key.split("\t");
      return { country, location, count };
    });
}

export function normalizeLabel(raw: string, fallback: string): string {
  const s = raw.trim();
  return s || fallback;
}

export function buildSeniorityBreakdown(jobs: LinkedInJobRow[]): NamedCount[] {
  const m = new Map<string, number>();
  for (const j of jobs) {
    const s = normalizeLabel(j.seniority, "Unknown");
    m.set(s, (m.get(s) ?? 0) + 1);
  }
  return [...m.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([name, value]) => ({ name, value }));
}

export function buildEducationBreakdown(jobs: LinkedInJobRow[]): NamedCount[] {
  const m = new Map<string, number>();
  for (const j of jobs) {
    const s = normalizeLabel(j.educationLevelMin ?? "", "Unknown");
    m.set(s, (m.get(s) ?? 0) + 1);
  }
  return [...m.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([name, value]) => ({ name, value }));
}

export function buildExperienceBucketBreakdown(
  jobs: LinkedInJobRow[],
): NamedCount[] {
  const m = new Map<string, number>();
  for (const j of jobs) {
    const s = normalizeLabel(j.experienceBucket ?? "", "Unknown");
    m.set(s, (m.get(s) ?? 0) + 1);
  }
  return [...m.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([name, value]) => ({ name, value }));
}

/** Median of salary_min_usd per experience bucket (jobs without salary omitted). */
export function buildMedianSalaryMinByExperienceBucket(
  jobs: LinkedInJobRow[],
): NamedCount[] {
  const groups = new Map<string, number[]>();
  for (const j of jobs) {
    const b = normalizeLabel(j.experienceBucket ?? "", "Unknown");
    const sm = j.salaryMinUsd;
    if (sm == null || !Number.isFinite(sm) || sm <= 0) continue;
    if (!groups.has(b)) groups.set(b, []);
    groups.get(b)!.push(sm);
  }
  return [...groups.entries()]
    .map(([name, vals]) => ({
      name,
      value: median(vals) ?? 0,
    }))
    .sort((a, b) => b.value - a.value);
}

export function titleForJob(j: LinkedInJobRow): string {
  const st = (j.standardizedTitle || "").trim();
  if (st) return st;
  return (j.title || "").trim() || "Untitled";
}

export function buildTopTitles(
  jobs: LinkedInJobRow[],
  topN = 15,
): NamedCount[] {
  const m = new Map<string, number>();
  for (const j of jobs) {
    const t = titleForJob(j);
    m.set(t, (m.get(t) ?? 0) + 1);
  }
  return [...m.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, topN)
    .map(([name, value]) => ({ name, value }));
}

export function buildTopCompanies(
  jobs: LinkedInJobRow[],
  topN = 15,
): NamedCount[] {
  const m = new Map<string, number>();
  for (const j of jobs) {
    const n = (j.companyName || "").trim() || "Unknown";
    m.set(n, (m.get(n) ?? 0) + 1);
  }
  return [...m.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, topN)
    .map(([name, value]) => ({ name, value }));
}

export function buildTopIndustries(
  jobs: LinkedInJobRow[],
  topN = 15,
): NamedCount[] {
  const m = new Map<string, number>();
  for (const j of jobs) {
    const n = (j.industries || "").trim() || "Unknown";
    m.set(n, (m.get(n) ?? 0) + 1);
  }
  return [...m.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, topN)
    .map(([name, value]) => ({ name, value }));
}

export type SkillFreq = { tag: string; count: number; pct: number };

export function buildSkillTagFrequency(jobs: LinkedInJobRow[]): SkillFreq[] {
  const m = new Map<string, number>();
  for (const j of jobs) {
    const tags = j.skillTags ?? [];
    const seen = new Set<string>();
    for (const t of tags) {
      const key = t.trim().toLowerCase();
      if (!key || seen.has(key)) continue;
      seen.add(key);
      m.set(key, (m.get(key) ?? 0) + 1);
    }
  }
  const total = jobs.length || 1;
  return [...m.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([tag, count]) => ({
      tag,
      count,
      pct: (count / total) * 100,
    }));
}

export function buildSoftHardSkillBreakdown(jobs: LinkedInJobRow[]): {
  soft: NamedCount[];
  hard: NamedCount[];
  other: NamedCount[];
} {
  const softM = new Map<string, number>();
  const hardM = new Map<string, number>();
  const otherM = new Map<string, number>();

  for (const j of jobs) {
    for (const t of j.skillTags ?? []) {
      const tag = t.trim();
      if (!tag) continue;
      const cat = classifySkillTag(tag);
      const key = tag.toLowerCase();
      if (cat === "soft") {
        softM.set(key, (softM.get(key) ?? 0) + 1);
      } else if (cat === "hard") {
        hardM.set(key, (hardM.get(key) ?? 0) + 1);
      } else {
        otherM.set(key, (otherM.get(key) ?? 0) + 1);
      }
    }
  }

  const toNamed = (mp: Map<string, number>, top = 15): NamedCount[] =>
    [...mp.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, top)
      .map(([name, value]) => ({ name, value }));

  return {
    soft: toNamed(softM),
    hard: toNamed(hardM),
    other: toNamed(otherM, 10),
  };
}

export function buildBenefitFrequency(
  jobs: LinkedInJobRow[],
  topN = 10,
): NamedCount[] {
  const m = new Map<string, number>();
  for (const j of jobs) {
    for (const b of j.benefits ?? []) {
      const key = b.trim().toLowerCase();
      if (!key) continue;
      m.set(key, (m.get(key) ?? 0) + 1);
    }
  }
  return [...m.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, topN)
    .map(([name, value]) => ({ name, value }));
}

export function buildRemoteCount(jobs: LinkedInJobRow[]): number {
  let n = 0;
  for (const j of jobs) {
    if (j.workRemote) {
      n += 1;
      continue;
    }
    const r = (j.remoteAllowed || "").toLowerCase();
    if (r.includes("remote")) n += 1;
    else if (
      (j.workplaceTypes ?? []).some((t: string) =>
        t.toLowerCase().includes("remote"),
      )
    )
      n += 1;
  }
  return n;
}

export function buildMedianSalary(jobs: LinkedInJobRow[]): {
  median: number | null;
  n: number;
} {
  const mins = jobs
    .map((j) => j.salaryMinUsd)
    .filter((x): x is number => x != null && Number.isFinite(x) && x > 0);
  return { median: median(mins), n: mins.length };
}

export type MonthlySalaryRow = {
  month: string;
  medianMin: number | null;
  medianMax: number | null;
  n: number;
};

export function buildMonthlySalaryRange(
  jobs: LinkedInJobRow[],
): MonthlySalaryRow[] {
  const byMonth = new Map<string, { mins: number[]; maxs: number[] }>();
  for (const j of jobs) {
    const mk = monthKey(j.postedAt);
    if (!mk) continue;
    if (!byMonth.has(mk)) byMonth.set(mk, { mins: [], maxs: [] });
    const bucket = byMonth.get(mk)!;
    if (j.salaryMinUsd != null && j.salaryMinUsd > 0)
      bucket.mins.push(j.salaryMinUsd);
    if (j.salaryMaxUsd != null && j.salaryMaxUsd > 0)
      bucket.maxs.push(j.salaryMaxUsd);
  }
  return [...byMonth.keys()].sort().map((month) => {
    const { mins, maxs } = byMonth.get(month)!;
    return {
      month,
      medianMin: median(mins),
      medianMax: median(maxs),
      n: Math.max(mins.length, maxs.length),
    };
  });
}

export function hostnameFromJobUrl(url: string): string {
  try {
    const u = new URL(url.startsWith("http") ? url : `https://${url}`);
    return u.hostname.replace(/^www\./, "") || "unknown";
  } catch {
    return "unknown";
  }
}

export function buildPostingSourceBreakdown(
  jobs: LinkedInJobRow[],
  topN = 12,
): NamedCount[] {
  const m = new Map<string, number>();
  for (const j of jobs) {
    const host = hostnameFromJobUrl(j.jobUrl || "");
    m.set(host, (m.get(host) ?? 0) + 1);
  }
  return [...m.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, topN)
    .map(([name, value]) => ({ name, value }));
}

/** Multi-series rows for Recharts: each row has `month` plus one field per top title. */
export function buildTopTitleTrends(
  jobs: LinkedInJobRow[],
  topN = 5,
): { chartData: Record<string, string | number>[]; titleKeys: string[] } {
  const tops = buildTopTitles(jobs, topN).map((x) => x.name);
  const months = new Set<string>();
  const counts = new Map<string, Map<string, number>>();

  for (const j of jobs) {
    const mk = monthKey(j.postedAt);
    if (!mk) continue;
    months.add(mk);
    const t = titleForJob(j);
    if (!tops.includes(t)) continue;
    if (!counts.has(mk)) counts.set(mk, new Map());
    const mm = counts.get(mk)!;
    mm.set(t, (mm.get(t) ?? 0) + 1);
  }

  const sortedMonths = [...months].sort();
  const chartData: Record<string, string | number>[] = sortedMonths.map(
    (month) => {
      const row: Record<string, string | number> = { month };
      const mm = counts.get(month);
      for (const tk of tops) {
        row[tk] = mm?.get(tk) ?? 0;
      }
      return row;
    },
  );

  return { chartData, titleKeys: tops };
}

export type SkillTrendCategory = "soft" | "hard";

export function buildTopSkillTrends(
  jobs: LinkedInJobRow[],
  category: SkillTrendCategory,
  topN = 5,
): { chartData: Record<string, string | number>[]; skillKeys: string[] } {
  const freq = buildSkillTagFrequency(jobs);
  const filtered = freq.filter((f) => classifySkillTag(f.tag) === category);
  const tops = filtered.slice(0, topN).map((f) => f.tag);

  const months = new Set<string>();
  const counts = new Map<string, Map<string, number>>();

  for (const j of jobs) {
    const mk = monthKey(j.postedAt);
    if (!mk) continue;
    months.add(mk);
    for (const tag of j.skillTags ?? []) {
      const key = tag.trim().toLowerCase();
      if (!tops.includes(key)) continue;
      if (!counts.has(mk)) counts.set(mk, new Map());
      const mm = counts.get(mk)!;
      mm.set(key, (mm.get(key) ?? 0) + 1);
    }
  }

  const sortedMonths = [...months].sort();
  const chartData: Record<string, string | number>[] = sortedMonths.map(
    (month) => {
      const row: Record<string, string | number> = { month };
      const mm = counts.get(month);
      for (const sk of tops) {
        row[sk] = mm?.get(sk) ?? 0;
      }
      return row;
    },
  );

  return { chartData, skillKeys: tops };
}

function locationKey(j: LinkedInJobRow): string {
  const c = (j.country || "").trim() || "—";
  const loc = (j.location || "").trim() || "—";
  return `${c}|${loc}`;
}

export function buildLocationMomentum(jobs: LinkedInJobRow[]): {
  newLocations: NamedCount[];
  increased: { name: string; pct: number }[];
  decreased: { name: string; pct: number }[];
} {
  const withDates = jobs
    .map((j) => ({ j, ms: postedMs(j) }))
    .filter((x): x is { j: LinkedInJobRow; ms: number } => x.ms != null)
    .sort((a, b) => a.ms - b.ms);

  if (withDates.length < 4) {
    return { newLocations: [], increased: [], decreased: [] };
  }

  const mid = Math.floor(withDates.length / 2);
  const early = withDates.slice(0, mid).map((x) => x.j);
  const late = withDates.slice(mid).map((x) => x.j);

  const countEarly = new Map<string, number>();
  const countLate = new Map<string, number>();

  for (const j of early) {
    const k = locationKey(j);
    countEarly.set(k, (countEarly.get(k) ?? 0) + 1);
  }
  for (const j of late) {
    const k = locationKey(j);
    countLate.set(k, (countLate.get(k) ?? 0) + 1);
  }

  const newLocations: NamedCount[] = [];
  for (const [k, v] of countLate) {
    if (!countEarly.has(k) && v > 0) {
      newLocations.push({ name: k.replace("|", " · "), value: v });
    }
  }
  newLocations.sort((a, b) => b.value - a.value);

  const increased: { name: string; pct: number }[] = [];
  const decreased: { name: string; pct: number }[] = [];

  const allKeys = new Set([...countEarly.keys(), ...countLate.keys()]);
  for (const k of allKeys) {
    const a = countEarly.get(k) ?? 0;
    const b = countLate.get(k) ?? 0;
    if (a === 0 && b === 0) continue;
    const pct = a === 0 ? (b > 0 ? 100 : 0) : ((b - a) / a) * 100;
    const entry = {
      name: k.replace("|", " · "),
      pct: Math.round(pct * 10) / 10,
    };
    if (pct > 5) increased.push(entry);
    else if (pct < -5) decreased.push(entry);
  }

  increased.sort((a, b) => b.pct - a.pct);
  decreased.sort((a, b) => a.pct - b.pct);

  return {
    newLocations: newLocations.slice(0, 15),
    increased: increased.slice(0, 15),
    decreased: decreased.slice(0, 15),
  };
}

export function distinctCountries(jobs: LinkedInJobRow[]): number {
  const s = new Set<string>();
  for (const j of jobs) {
    const c = (j.country || "").trim();
    if (c) s.add(c);
  }
  return s.size;
}

export function distinctCompanies(jobs: LinkedInJobRow[]): number {
  const s = new Set<string>();
  for (const j of jobs) {
    const c = (j.companyName || "").trim();
    if (c) s.add(c);
  }
  return s.size;
}
