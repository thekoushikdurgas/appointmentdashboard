"use client";

export {
  FilterChipList as HsFilterChipList,
  pickFilterChipsByKeyPrefix as pickHsFilterChipsByKeyPrefix,
  type FilterChipItem as HsFilterChipItem,
} from "@/components/layouts/filters/FilterChipList";

/** Key prefixes from `buildHiringSignalChipBuckets` company cohort chips. */
export const HS_COMPANY_FILTER_CHIP_PREFIXES = {
  name: ["co-name"],
  country: ["co-country"],
  industry: ["co-industry"],
  employeeSize: ["co-emp-size"],
  revenue: ["co-rev", "co-facet-annual_revenue"],
  funding: ["co-fund"],
} as const;
