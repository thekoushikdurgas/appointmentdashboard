/**
 * Shared counts for contacts toolbar badge and filter sidebar parity.
 */

function countFacetDimensions(
  facetValues: Record<string, string[]>,
  excludedFacetValues: Record<string, string[]> = {},
): number {
  const keys = new Set([
    ...Object.keys(facetValues),
    ...Object.keys(excludedFacetValues),
  ]);
  let n = 0;
  for (const k of keys) {
    const inc = facetValues[k]?.length ?? 0;
    const exc = excludedFacetValues[k]?.length ?? 0;
    if (inc > 0 || exc > 0) n += 1;
  }
  return n;
}

export function countFacetActive(
  facetValues: Record<string, string[]>,
  excludedFacetValues?: Record<string, string[]>,
): number {
  return countFacetDimensions(facetValues, excludedFacetValues ?? {});
}

export function getContactsToolbarActiveCount(params: {
  activeTab: string;
  facetValues: Record<string, string[]>;
  excludedFacetValues?: Record<string, string[]>;
  companyFacetValues?: Record<string, string[]>;
  search: string;
  advancedVqlRuleCount: number;
  sortBy: string;
  hiddenColumnCount: number;
}): number {
  const facetActive =
    countFacetDimensions(params.facetValues, params.excludedFacetValues) +
    countFacetDimensions(params.companyFacetValues ?? {});
  let listScope = 0;
  if (params.activeTab === "net_new" || params.activeTab === "do_not_contact") {
    listScope += 1;
  }
  listScope += facetActive;

  let n = listScope;
  if (params.search.trim()) n += 1;
  if (params.advancedVqlRuleCount > 0) n += 1;
  if (params.sortBy !== "newest") n += 1;
  if (params.hiddenColumnCount > 0) n += 1;
  return n;
}
