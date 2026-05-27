/**
 * Posted-date helpers for hiring-signal job rows.
 * Pure module (no GraphQL) — safe for unit tests.
 */

/** True when the source has a calendar date only (LinkedIn `time_posted`), not a clock time. */
export function isHireSignalPostedDateOnly(iso: string): boolean {
  const s = iso?.trim() ?? "";
  if (!s) return false;
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return true;
  if (/^\d{4}-\d{2}-\d{2}T00:00:00(\.000)?Z$/i.test(s)) return true;
  return false;
}

export type HireSignalPostedParts = {
  date: string;
  time: string | null;
};

/**
 * Split posted timestamp into date + optional clock time for grid cells.
 */
export function formatHireSignalPostedParts(
  iso: string,
): HireSignalPostedParts {
  const empty: HireSignalPostedParts = { date: "—", time: null };
  const s = iso?.trim() ?? "";
  if (!s || s.startsWith("0001-01-01")) return empty;
  try {
    const d = new Date(s);
    if (Number.isNaN(d.getTime()) || d.getUTCFullYear() < 1970) {
      return { date: s.slice(0, 10) || "—", time: null };
    }
    const dateOnly = isHireSignalPostedDateOnly(s);
    const date = d.toLocaleDateString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
    if (dateOnly) {
      return { date, time: null };
    }
    const time = d.toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
    });
    return { date, time };
  } catch {
    return { date: s.slice(0, 10) || "—", time: null };
  }
}

/**
 * Format job `postedAt` / ISO strings from job.server for the hiring-signals UI.
 */
export function formatHireSignalPostedDate(
  iso: string,
  options?: { withTime?: boolean; emptyAsDash?: boolean },
): string {
  const withTime = options?.withTime ?? false;
  const showTime = withTime && !isHireSignalPostedDateOnly(iso);
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
      out = showTime
        ? d.toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })
        : d.toLocaleString("en-IN", { dateStyle: "medium" });
    } catch {
      out = "";
    }
    if (!out?.trim()) {
      out = showTime
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
