import Papa from "papaparse";

export type FinderCsvRow = {
  firstName: string;
  lastName: string;
  domain: string;
};

export type FinderColumnMap = {
  firstName: string;
  lastName: string;
  domain: string;
};

function normalizeHeaderKey(s: string): string {
  return s
    .trim()
    .toLowerCase()
    .replace(/[\s_\-]+/g, "");
}

/** Read cell by mapped header name; matches case-insensitively if exact key missing. */
function cellValue(row: Record<string, string>, userHeader: string): string {
  const key = userHeader.trim();
  if (!key) return "";
  if (Object.prototype.hasOwnProperty.call(row, key)) {
    return String(row[key] ?? "").trim();
  }
  const want = normalizeHeaderKey(key);
  for (const rk of Object.keys(row)) {
    if (normalizeHeaderKey(rk) === want) {
      return String(row[rk] ?? "").trim();
    }
  }
  return "";
}

/**
 * Parse a CSV (header row) into finder rows using column names from the header.
 */
export function parseFinderCsv(
  text: string,
  columns: FinderColumnMap,
): FinderCsvRow[] {
  const parsed = Papa.parse<Record<string, string>>(text, {
    header: true,
    skipEmptyLines: "greedy",
    transformHeader: (h) => h.trim(),
  });
  const fatal = parsed.errors.find(
    (e) => e.type === "Quotes" || e.type === "FieldMismatch",
  );
  if (fatal) {
    throw new Error(fatal.message ?? "CSV parse error");
  }
  const rows: FinderCsvRow[] = [];
  for (const row of parsed.data) {
    const fn = cellValue(row, columns.firstName);
    const ln = cellValue(row, columns.lastName);
    const dom = cellValue(row, columns.domain);
    if (!fn || !ln || !dom) continue;
    rows.push({ firstName: fn, lastName: ln, domain: dom });
  }
  return rows;
}

function pickHeader(headers: string[], ...synonyms: string[]): string {
  const pairs = headers.map((raw) => ({ raw, n: normalizeHeaderKey(raw) }));
  for (const syn of synonyms) {
    const sn = normalizeHeaderKey(syn);
    const hit = pairs.find((p) => p.n === sn);
    if (hit) return hit.raw;
  }
  for (const syn of synonyms) {
    const sn = normalizeHeaderKey(syn);
    const hit = pairs.find((p) => p.n.includes(sn) || sn.includes(p.n));
    if (hit && hit.n.length > 0) return hit.raw;
  }
  return "";
}

/**
 * Guess CSV column names for Apollo / common exports (exact header strings from file).
 */
export function guessFinderColumnMap(headers: string[]): FinderColumnMap {
  if (!headers.length) {
    return { firstName: "first_name", lastName: "last_name", domain: "domain" };
  }
  const first =
    pickHeader(
      headers,
      "first name",
      "first_name",
      "firstname",
      "fname",
      "given name",
    ) ||
    headers.find((h) => /\bfirst\b/i.test(h) && /\bname\b/i.test(h)) ||
    "";
  const last =
    pickHeader(
      headers,
      "last name",
      "last_name",
      "lastname",
      "lname",
      "surname",
    ) ||
    headers.find((h) => /\blast\b/i.test(h) && /\bname\b/i.test(h)) ||
    "";
  const domain =
    pickHeader(
      headers,
      "website",
      "company website",
      "domain",
      "company domain",
      "email domain",
      "url",
      "company url",
    ) ||
    headers.find(
      (h) =>
        /website|\.com\b/i.test(h) && !/linkedin|facebook|twitter/i.test(h),
    ) ||
    "";
  return {
    firstName: first || "first_name",
    lastName: last || "last_name",
    domain: domain || "domain",
  };
}

/** Non-empty data rows (header:true), ignoring mapping — for upload-step counts. */
export function countCsvDataRows(text: string): number {
  if (!text.trim()) return 0;
  const parsed = Papa.parse<Record<string, unknown>>(text, {
    header: true,
    skipEmptyLines: "greedy",
    transformHeader: (h) => h.trim(),
  });
  let n = 0;
  for (const row of parsed.data) {
    if (!row || typeof row !== "object") continue;
    const vals = Object.values(row);
    if (vals.some((v) => String(v ?? "").trim().length > 0)) n++;
  }
  return n;
}

/** First line of CSV for column name hints. */
export function sniffCsvHeaders(text: string): string[] {
  if (!text.trim()) return [];
  const first = text.split(/\r?\n/).find((l) => l.trim().length > 0) ?? "";
  const row = Papa.parse<string[]>(first, {
    delimiter: ",",
    skipEmptyLines: false,
  });
  return (row.data[0] ?? []).map((h) => String(h).trim()).filter(Boolean);
}

/**
 * Guess the CSV header that holds email addresses (bulk verifier uploads).
 */
export function guessVerifierEmailColumn(headers: string[]): string {
  if (!headers.length) return "email";
  const direct = pickHeader(
    headers,
    "email",
    "e-mail",
    "email address",
    "e mail",
    "work email",
    "business email",
    "contact email",
  );
  if (direct) return direct;
  const hit = headers.find(
    (h) => /\bemail\b/i.test(h) || /\be-?mail\b/i.test(h),
  );
  return hit || "email";
}

/**
 * Parse a headered CSV and return unique valid-looking email cells from one column.
 */
export function parseVerifierEmailsFromCsv(
  text: string,
  emailColumn: string,
): string[] {
  const parsed = Papa.parse<Record<string, string>>(text, {
    header: true,
    skipEmptyLines: "greedy",
    transformHeader: (h) => h.trim(),
  });
  const fatal = parsed.errors.find(
    (e) => e.type === "Quotes" || e.type === "FieldMismatch",
  );
  if (fatal) {
    throw new Error(fatal.message ?? "CSV parse error");
  }
  const seen = new Set<string>();
  const out: string[] = [];
  for (const row of parsed.data) {
    const e = cellValue(row, emailColumn).trim();
    if (!e || !e.includes("@")) continue;
    const k = e.toLowerCase();
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(e);
  }
  return out;
}
