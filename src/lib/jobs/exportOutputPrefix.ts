/** Align with API `normalize_export_output_prefix`: exports live under `exports/` in the user's bucket. */

const DEFAULT_EXPORT_ROOT = "exports/";
const MAX_LEN = 500;

/**
 * If the value is a full logical path ``{storageId}/rest``, return ``rest`` for API
 * ``output_prefix`` (bucket-relative). Id segment match is case-insensitive.
 */
export function stripStorageIdOutputPrefix(
  raw: string,
  storageId: string | null,
): string {
  const t = raw.trim();
  if (!storageId || !t) return t;
  const p = `${storageId.trim()}/`;
  if (
    t.length >= p.length &&
    t.slice(0, p.length).toLowerCase() === p.toLowerCase()
  ) {
    return t.slice(p.length);
  }
  return t;
}

export function normalizeExportOutputPrefix(raw: string): string {
  let v = (raw ?? "").trim();
  if (!v) return DEFAULT_EXPORT_ROOT;

  v = v.replace(/\\/g, "/");
  if (v.includes("..")) {
    throw new Error("output_prefix must not contain '..'");
  }
  v = v.replace(/^\/+/, "");
  while (v.includes("//")) v = v.replace("//", "/");

  let lower = v.toLowerCase();
  if (lower === "export" || lower === "exports") {
    return DEFAULT_EXPORT_ROOT;
  }

  if (lower.startsWith("export/") && !lower.startsWith("exports/")) {
    const rest = v.slice(7).replace(/^\/+/, "");
    v = rest ? `exports/${rest}` : DEFAULT_EXPORT_ROOT;
    lower = v.toLowerCase();
  }

  if (!lower.startsWith("exports/")) {
    v = `exports/${v.replace(/^\/+/, "")}`;
    lower = v.toLowerCase();
  }

  if (lower.startsWith("exports/")) {
    const rest = v.slice(8);
    v = rest ? `exports/${rest}` : DEFAULT_EXPORT_ROOT;
    lower = v.toLowerCase();
  }

  if (!v.endsWith("/")) v = `${v}/`;

  if (v.length > MAX_LEN) {
    throw new Error(`output_prefix exceeds ${MAX_LEN} characters`);
  }
  return v;
}
