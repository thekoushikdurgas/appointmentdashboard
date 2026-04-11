"use client";

import {
  GenericToolbar,
  type GenericToolbarProps,
  type ToolbarTab,
} from "@/components/patterns/GenericToolbar";

export interface DataToolbarProps extends GenericToolbarProps {
  totalCount?: number;
}

/**
 * Data list toolbar: enhances Total tab with `totalCount` when tab omits count.
 */
export function DataToolbar({
  totalCount,
  cssPrefix,
  ...toolbarProps
}: DataToolbarProps) {
  const enhancedTabs: ToolbarTab[] | undefined = toolbarProps.tabs?.map(
    (tab) => {
      if (
        tab.value === "total" &&
        totalCount !== undefined &&
        tab.count == null
      ) {
        return { ...tab, count: totalCount };
      }
      return tab;
    },
  );

  return (
    <GenericToolbar
      {...toolbarProps}
      cssPrefix={cssPrefix}
      tabs={enhancedTabs}
    />
  );
}
