/** Fields used to build a stable DataGrid row id (decoupled from full row type). */
export type HiringSignalRowKeyFields = {
  id: string;
  linkedinJobId: string;
  apifyItemId: string;
  runId: string;
  title: string;
  companyUuid: string;
  companyName: string;
  postedAt: string;
  location: string;
  jobUrl: string;
};

/** Mongo/OpenSearch zero ObjectId placeholders must not be used as stable row keys. */
export function isPlaceholderDocumentId(id: string | undefined | null): boolean {
  const s = (id ?? "").trim();
  if (!s) return true;
  const hex = s.replace(/[^a-fA-F0-9]/g, "");
  return !hex || /^0+$/.test(hex);
}

/** Stable table/selection key for a job row (DataGrid + checkboxes). */
export function hiringSignalRowKey(row: HiringSignalRowKeyFields): string {
  const id = row.id?.trim() ?? "";
  if (id && !isPlaceholderDocumentId(id)) return id;

  const lj = row.linkedinJobId?.trim() ?? "";
  const apify = row.apifyItemId?.trim() ?? "";
  if (lj && apify) return `${lj}::${apify}`;
  if (lj) return `lj:${lj}`;
  if (apify) return `apify:${apify}`;

  const parts = [
    row.runId,
    row.title,
    row.companyUuid,
    row.companyName,
    row.postedAt,
    row.location,
    row.jobUrl,
  ]
    .map((x) => (x ?? "").trim())
    .filter(Boolean);
  return parts.length > 0 ? parts.join("::") : "hs-row-unknown";
}
