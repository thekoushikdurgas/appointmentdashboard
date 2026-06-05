"use client";

import type { ReactNode } from "react";
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
  /** Primary toolbar row (tabs + actions) — appointment-d1-style. */
  toolbar?: ReactNode;
  /** Compact metadata under toolbar (counts, sort hint). */
  metadata?: ReactNode;
  /** Pagination or footer row below main content. */
  pagination?: ReactNode;
}

export default function DataPageLayout({
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
        <aside
          className="c360-data-layout__filters"
          aria-label={filtersAriaLabel}
        >
          {filters}
        </aside>
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
