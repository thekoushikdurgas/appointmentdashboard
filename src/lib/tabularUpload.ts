/** Tabular / spreadsheet uploads (CSV, TSV, Excel) — shared MIME hints for S3 multipart PUT. */

const TABULAR_NAME_RE = /\.(csv|tsv|xlsx|xls)$/i;

export function isAllowedTabularFilename(name: string): boolean {
  return TABULAR_NAME_RE.test(name.trim());
}

/** Content-Type for each S3 part PUT (S3 expects stable type per part). */
export function tabularFilePutContentType(file: File): string {
  const n = file.name.toLowerCase();
  if (n.endsWith(".tsv")) return "text/tab-separated-values";
  if (n.endsWith(".xlsx")) {
    return "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
  }
  if (n.endsWith(".xls")) return "application/vnd.ms-excel";
  if (file.type && file.type !== "application/octet-stream") return file.type;
  return "text/csv";
}

export function tabularContentTypeFromFilename(filename: string): string {
  const n = filename.toLowerCase();
  if (n.endsWith(".tsv")) return "text/tab-separated-values";
  if (n.endsWith(".xlsx")) {
    return "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
  }
  if (n.endsWith(".xls")) return "application/vnd.ms-excel";
  return "text/csv";
}
