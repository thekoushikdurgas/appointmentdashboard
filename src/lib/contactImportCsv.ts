import Papa from "papaparse";

/**
 * Headers that sync.server treats as "recognizable" for CSV import
 * (see EC2/sync.server/utilities/common.go ValidateCSVHeaders).
 */
export const CONTACT_IMPORT_RECOGNIZABLE_FIELDS = [
  "first_name",
  "last_name",
  "email",
  "company",
  "person_linkedin_url",
  "company_linkedin_url",
  "website",
  "mobile_phone",
  "company_phone",
] as const;

export type ContactImportCanonicalField =
  (typeof CONTACT_IMPORT_RECOGNIZABLE_FIELDS)[number];

export const CONTACT_IMPORT_FIELD_LABELS: Record<
  ContactImportCanonicalField,
  string
> = {
  first_name: "First name",
  last_name: "Last name",
  email: "Email",
  company: "Company",
  person_linkedin_url: "Person LinkedIn URL",
  company_linkedin_url: "Company LinkedIn URL",
  website: "Website",
  mobile_phone: "Mobile phone",
  company_phone: "Company phone",
};

/** Mirrors sync.server `NormalizeCSVHeader`. */
export function normalizeContactImportHeader(h: string): string {
  let x = h.trim().toLowerCase().replace(/ /g, "_");
  switch (x) {
    case "company_name":
      return "company";
    case "_employees":
    case "#_employees":
    case "number_of_employees":
      return "employees";
    case "corporate_phone":
      return "company_phone";
    default:
      return x;
  }
}

export function contactImportHasRecognizableColumn(headers: string[]): boolean {
  const norm = new Set(headers.map(normalizeContactImportHeader));
  return CONTACT_IMPORT_RECOGNIZABLE_FIELDS.some((k) => norm.has(k));
}

/**
 * Apply user mapping: for each canonical key, the chosen source header (exact
 * match to a column in the file) is renamed to the canonical field name in row 0.
 */
export function applyContactImportColumnMapping(
  headerRow: string[],
  mapping: Partial<Record<ContactImportCanonicalField, string>>,
): string[] {
  const out = headerRow.map((h) => h);
  for (const canonical of CONTACT_IMPORT_RECOGNIZABLE_FIELDS) {
    const source = mapping[canonical]?.trim();
    if (!source) continue;
    const idx = headerRow.findIndex((h) => h.trim() === source);
    if (idx >= 0) out[idx] = canonical;
  }
  return out;
}

export function findDuplicateContactImportSources(
  mapping: Partial<Record<ContactImportCanonicalField, string>>,
): string[] {
  const seen = new Set<string>();
  const dupes: string[] = [];
  for (const v of Object.values(mapping)) {
    const s = v?.trim();
    if (!s) continue;
    if (seen.has(s)) dupes.push(s);
    seen.add(s);
  }
  return dupes;
}

export async function parseContactImportCsvHeaders(
  file: File,
): Promise<string[]> {
  const text = await file.text();
  const parsed = Papa.parse<string[]>(text, {
    skipEmptyLines: "greedy",
  });
  const rows = parsed.data.filter((r) =>
    r.some((c) => String(c).trim() !== ""),
  );
  if (rows.length === 0) {
    throw new Error("This CSV has no rows.");
  }
  return rows[0].map((c) => String(c));
}

/**
 * Returns a CSV File ready for upload. If `mapping` is empty and the original
 * already has a recognizable column, returns `source` unchanged.
 */
export async function buildContactImportUploadFile(
  source: File,
  mapping: Partial<Record<ContactImportCanonicalField, string>>,
): Promise<File> {
  const text = await source.text();
  const parsed = Papa.parse<string[]>(text, {
    skipEmptyLines: "greedy",
  });
  const rows = parsed.data.filter((r) =>
    r.some((c) => String(c).trim() !== ""),
  );
  if (rows.length === 0) {
    throw new Error("This CSV has no rows.");
  }
  const headerRow = rows[0].map((c) => String(c));
  const hasMapping = Object.values(mapping).some((v) => v?.trim());
  const newHeaders = hasMapping
    ? applyContactImportColumnMapping(headerRow, mapping)
    : headerRow;

  if (!contactImportHasRecognizableColumn(newHeaders)) {
    throw new Error(
      "No importable columns found. Map at least one column to email, name, company, or LinkedIn URL.",
    );
  }

  if (!hasMapping && contactImportHasRecognizableColumn(headerRow)) {
    return source;
  }

  const body = rows.slice(1).map((r) => r.map((c) => String(c)));
  const combined = [newHeaders, ...body];
  const out = Papa.unparse(combined, { newline: "\n" });
  const base = source.name.replace(/\.csv$/i, "") || "contacts";
  return new File([out], `${base}_import_ready.csv`, { type: "text/csv" });
}
