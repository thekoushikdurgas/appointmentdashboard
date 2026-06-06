"use client";

import { useCallback, useState, type ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { DataFiltersPanelProvider } from "@/context/DataFiltersPanelContext";
import { useOptionalDataFiltersPanelContext } from "@/context/DataFiltersPanelContext";
import { FilterSidebarPeekProvider } from "@/context/FilterSidebarPeekContext";
import {
  resolveFilterSidebarAnimateState,
  filterAsideVariants,
  filterSidebarTransition,
} from "@/components/layouts/filterSidebarMotion";
import { cn } from "@/lib/utils";

export interface DataPageLayoutProps {
  filters?: ReactNode;
  children: ReactNode;
  className?: string;
  /** Desktop aside + contextual name for SRs (must match visible filter intent). */
  filtersAriaLabel?: string;
  /**
   * ID of the visible filter panel title inside `filters` — must match the `h2`
   * `id` for screen-reader labelling.
   */
  filterDrawerTitleId?: string;
  showFilters?: boolean;
  /** localStorage key for desktop filter panel pin/collapse (per page). */
  filtersPanelStorageKey?: string;
  /** Primary toolbar row (tabs + actions) — appointment-d1-style. */
  toolbar?: ReactNode;
  /** Compact metadata under toolbar (counts, sort hint). */
  metadata?: ReactNode;
  /** Pagination or footer row below main content. */
  pagination?: ReactNode;
}

function DataPageLayoutFiltersAside({
  filters,
  filtersAriaLabel,
}: {
  filters: ReactNode;
  filtersAriaLabel: string;
}) {
  const panel = useOptionalDataFiltersPanelContext();
  const prefersReducedMotion = useReducedMotion();
  const [isHoverPeeking, setIsHoverPeeking] = useState(false);

  const collapsed = Boolean(panel?.collapseEnabled && panel.expanded === false);
  const pinned = Boolean(panel?.pinned);
  const peekEligible = Boolean(panel?.collapseEnabled && collapsed && !pinned);

  const effectiveAnimateState = resolveFilterSidebarAnimateState({
    expanded: !collapsed,
    pinned,
    isHoverPeeking: peekEligible && isHoverPeeking,
  });

  const motionEnabled = Boolean(
    panel?.collapseEnabled && !prefersReducedMotion,
  );

  const setHoverPeeking = useCallback((value: boolean) => {
    setIsHoverPeeking(value);
  }, []);

  const handleAsideMouseEnter = useCallback(() => {
    if (peekEligible) setIsHoverPeeking(true);
  }, [peekEligible]);

  const handleAsideMouseLeave = useCallback(() => {
    setIsHoverPeeking(false);
  }, []);

  const asideClassName = cn(
    "c360-data-layout__filters",
    motionEnabled && "c360-data-layout__filters--motion",
    effectiveAnimateState === "collapsed" &&
      "c360-data-layout__filters--collapsed",
    peekEligible && isHoverPeeking && "c360-data-layout__filters--peek",
  );

  const filterContent = (
    <FilterSidebarPeekProvider
      isHoverPeeking={peekEligible && isHoverPeeking}
      effectiveAnimateState={effectiveAnimateState}
      peekEligible={peekEligible}
      setHoverPeeking={setHoverPeeking}
    >
      {filters}
    </FilterSidebarPeekProvider>
  );

  if (motionEnabled) {
    return (
      <motion.aside
        className={asideClassName}
        aria-label={filtersAriaLabel}
        initial={false}
        animate={effectiveAnimateState}
        variants={filterAsideVariants}
        transition={filterSidebarTransition}
        onMouseEnter={handleAsideMouseEnter}
        onMouseLeave={handleAsideMouseLeave}
      >
        {filterContent}
      </motion.aside>
    );
  }

  return (
    <aside
      className={asideClassName}
      aria-label={filtersAriaLabel}
      onMouseEnter={handleAsideMouseEnter}
      onMouseLeave={handleAsideMouseLeave}
    >
      {filterContent}
    </aside>
  );
}

function DataPageLayoutInner({
  filters,
  children,
  className,
  filtersAriaLabel = "Filters",
  showFilters = true,
  toolbar,
  metadata,
  pagination,
}: DataPageLayoutProps) {
  const showFilterPanel = showFilters && filters;

  if (!showFilterPanel) {
    return (
      <div className={cn("c360-page", className)}>
        {toolbar ? (
          <div className="c360-data-layout__toolbar c360-mb-4">{toolbar}</div>
        ) : null}
        {metadata ? (
          <div className="c360-data-layout__metadata c360-mb-3">{metadata}</div>
        ) : null}
        <div className="c360-data-layout__content">{children}</div>
        {pagination ? (
          <div className="c360-data-layout__pagination c360-mt-4">
            {pagination}
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <div className={cn("c360-page", className)}>
      <div
        className={cn(
          "c360-data-layout",
          toolbar && "c360-data-layout--with-toolbar",
        )}
      >
        <DataPageLayoutFiltersAside
          filters={filters}
          filtersAriaLabel={filtersAriaLabel}
        />
        <div className="c360-data-layout__content">
          {toolbar ? (
            <div className="c360-data-layout__toolbar">{toolbar}</div>
          ) : null}
          {metadata ? (
            <div className="c360-data-layout__metadata">{metadata}</div>
          ) : null}
          {children}
          {pagination ? (
            <div className="c360-data-layout__pagination">{pagination}</div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export default function DataPageLayout({
  filtersPanelStorageKey,
  ...rest
}: DataPageLayoutProps) {
  const showFilterPanel = rest.showFilters !== false && rest.filters;

  if (showFilterPanel && filtersPanelStorageKey) {
    return (
      <DataFiltersPanelProvider storageKey={filtersPanelStorageKey}>
        <DataPageLayoutInner {...rest} />
      </DataFiltersPanelProvider>
    );
  }

  return <DataPageLayoutInner {...rest} />;
}
