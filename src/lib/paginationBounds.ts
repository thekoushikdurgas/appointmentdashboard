/** Shared bounds for offset-style pagers (1-based page index). */
export function getPaginationBounds(
  total: number,
  page: number,
  pageSize: number,
): { pageSize: number; totalPages: number; safePage: number } {
  const ps = Math.max(1, Math.floor(pageSize));
  const totalPages = Math.max(1, Math.ceil(Math.max(0, total) / ps));
  const safePage = Math.min(Math.max(1, Math.floor(page)), totalPages);
  return { pageSize: ps, totalPages, safePage };
}
