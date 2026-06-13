/**
 * Posted-date helpers for hiring-signal job rows.
 * Pure module (no GraphQL) — safe for unit tests.
 */

const CALENDAR_DAY_RE = /^(\d{4})-(\d{2})-(\d{2})$/;
const UTC_MIDNIGHT_RE = /^(\d{4})-(\d{2})-(\d{2})T00:00:00(\.000)?Z$/i;

/** Scraper.server emits UTC instants without a `Z` suffix — treat as UTC, not local. */
function isNaiveUtcIsoDateTime(s: string): boolean {
  return (
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(s) &&
    !/[zZ]$/.test(s) &&
    !/[+-]\d{2}:\d{2}$/.test(s) &&
    !/[+-]\d{4}$/.test(s)
  );
}

/** Display timezone for hiring-signal scraper session clocks (product copy uses IST). */
export const HIRE_SIGNAL_DISPLAY_TZ = "Asia/Kolkata";

export function parseHireSignalInstant(iso: string): Date | null {
  let s = iso?.trim() ?? "";
  if (!s || s.startsWith("0001-01-01")) return null;
  if (!s.includes("T")) {
    s = `${s}T00:00:00.000Z`;
  } else if (isNaiveUtcIsoDateTime(s)) {
    s = `${s}Z`;
  }
  const t = Date.parse(s);
  return Number.isFinite(t) ? new Date(t) : null;
}

type CalendarParts = { y: number; m: number; d: number };

/** Parse YYYY-MM-DD or legacy UTC-midnight calendar stamps without timezone rollover. */
export function parseHireSignalCalendarParts(
  iso: string,
): CalendarParts | null {
  const s = iso?.trim() ?? "";
  if (!s) return null;
  let m = CALENDAR_DAY_RE.exec(s);
  if (m) {
    return { y: Number(m[1]), m: Number(m[2]), d: Number(m[3]) };
  }
  m = UTC_MIDNIGHT_RE.exec(s);
  if (m) {
    return { y: Number(m[1]), m: Number(m[2]), d: Number(m[3]) };
  }
  return null;
}

function formatCalendarParts(parts: CalendarParts): string {
  const dt = new Date(Date.UTC(parts.y, parts.m - 1, parts.d));
  return dt.toLocaleDateString("en-IN", {
    year: "numeric",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}

/** True when the source has a calendar date only (LinkedIn `time_posted`), not a clock time. */
export function isHireSignalPostedDateOnly(iso: string): boolean {
  const s = iso?.trim() ?? "";
  if (!s) return false;
  if (CALENDAR_DAY_RE.test(s)) return true;
  if (UTC_MIDNIGHT_RE.test(s)) return true;
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
  const calendar = parseHireSignalCalendarParts(s);
  if (calendar) {
    return { date: formatCalendarParts(calendar), time: null };
  }
  try {
    const d = parseHireSignalInstant(s);
    if (!d) {
      return { date: s.slice(0, 10) || "—", time: null };
    }
    const date = d.toLocaleDateString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
      timeZone: HIRE_SIGNAL_DISPLAY_TZ,
    });
    const time = `${d.toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
      timeZone: HIRE_SIGNAL_DISPLAY_TZ,
    })} IST`;
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
  const emptyAsDash = options?.emptyAsDash ?? !withTime;
  const s = iso?.trim() ?? "";
  if (!s) return emptyAsDash ? "—" : "";
  if (s.startsWith("0001-01-01")) return emptyAsDash ? "—" : "";
  const calendar = parseHireSignalCalendarParts(s);
  if (calendar && !withTime) {
    return formatCalendarParts(calendar);
  }
  const showTime = withTime && !isHireSignalPostedDateOnly(s);
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

/** Collapse UTC-midnight calendar stamps to YYYY-MM-DD for filters and grid display. */
export function normalizeHireSignalPostedAtIso(iso: string): string {
  const cal = parseHireSignalCalendarParts(iso);
  if (!cal) return iso;
  const y = String(cal.y).padStart(4, "0");
  const m = String(cal.m).padStart(2, "0");
  const d = String(cal.d).padStart(2, "0");
  return `${y}-${m}-${d}`;
}
