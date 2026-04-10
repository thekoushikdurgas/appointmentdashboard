/** Align with API `normalize_export_output_prefix`: exports live under `exports/` in the user's bucket. */

const DEFAULT_EXPORT_ROOT = "exports/";
const MAX_LEN = 500;

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
