/**
 * Shared counts for contacts toolbar badge and filter sidebar parity.
 */

export function countFacetActive(facetValues: Record<string, string>): number {
  return Object.values(facetValues).filter(
    (v) => v != null && String(v).trim() !== "",
  ).length;
}

export function getContactsToolbarActiveCount(params: {
  activeTab: string;
  statusFilter: string;
  facetValues: Record<string, string>;
  search: string;
  advancedVqlRuleCount: number;
  sortBy: string;
  hiddenColumnCount: number;
}): number {
  const facetActive = countFacetActive(params.facetValues);
  let listScope = 0;
  if (params.activeTab === "net_new" || params.activeTab === "do_not_contact") {
    listScope += 1;
  }
  if (params.statusFilter !== "All") listScope += 1;
  listScope += facetActive;

  let n = listScope;
  if (params.search.trim()) n += 1;
  if (params.advancedVqlRuleCount > 0) n += 1;
  if (params.sortBy !== "newest") n += 1;
  if (params.hiddenColumnCount > 0) n += 1;
  return n;
}
