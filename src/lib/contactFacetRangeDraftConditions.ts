import type { VqlFilterInput } from "@/graphql/generated/types";
import {
  companyRangeBucketTokensToExcludeVql,
  companyRangeBucketTokensToIncludeVql,
} from "@/lib/companyRangeBuckets";
import {
  emptyDraftCondition,
  emptyDraftGroup,
  type DraftCondition,
  type DraftGroup,
} from "@/lib/vqlDraft";

function vqlFilterToSidebarItems(
  filter: VqlFilterInput | undefined,
): Array<DraftCondition | DraftGroup> {
  if (!filter) return [];
  const out: Array<DraftCondition | DraftGroup> = [];

  if (filter.conditions?.length) {
    for (const c of filter.conditions) {
      const row = emptyDraftCondition();
      out.push({
        ...row,
        field: c.field,
        operator: c.operator,
        value:
          typeof c.value === "string" || typeof c.value === "number"
            ? String(c.value)
            : "",
      });
    }
  }
  if (filter.anyOf?.length) {
    const g = emptyDraftGroup("or");
    for (const sub of filter.anyOf) {
      g.items.push(...vqlFilterToSidebarItems(sub));
    }
    if (g.items.length > 0) out.push(g);
  }
  if (filter.allOf?.length) {
    const g = emptyDraftGroup("and");
    for (const sub of filter.allOf) {
      g.items.push(...vqlFilterToSidebarItems(sub));
    }
    if (g.items.length > 0) out.push(g);
  }
  return out;
}

/** Fixed revenue / funding / headcount buckets → draft items for the contacts list VQL builder. */
export function contactRangeBucketSidebarItems(
  filterKey: string,
  includedBucketIds: string[],
  excludedBucketIds: string[],
): Array<DraftCondition | DraftGroup> {
  const items: Array<DraftCondition | DraftGroup> = [];
  items.push(
    ...vqlFilterToSidebarItems(
      companyRangeBucketTokensToIncludeVql(filterKey, includedBucketIds),
    ),
  );
  items.push(
    ...vqlFilterToSidebarItems(
      companyRangeBucketTokensToExcludeVql(filterKey, excludedBucketIds),
    ),
  );
  return items;
}
