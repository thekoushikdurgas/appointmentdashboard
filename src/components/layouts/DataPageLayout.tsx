import { useEffect, useRef, type ReactNode } from "react";
import { SlidersHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";
import { useIsDesktop } from "@/hooks/common/useBreakpoint";

export interface DataPageLayoutProps {
  filters?: ReactNode;
  children: ReactNode;
  className?: string;
  /** Desktop aside + contextual name for SRs (must match visible filter intent). */
  filtersAriaLabel?: string;
  /**
   * ID of the visible filter panel title inside `filters` — must match the `h2`
   * `id` for the mobile drawer `aria-labelledby`.
   */
  filterDrawerTitleId?: string;
  showFilters?: boolean;
  /** Primary toolbar row (tabs + actions) — appointment-d1-style. */
  toolbar?: ReactNode;
  /** Compact metadata under toolbar (counts, sort hint). */
  metadata?: ReactNode;
  /** Pagination or footer row below main content. */
  pagination?: ReactNode;
  /**
   * Mobile (&lt;1024px): when true, filters render in a full-height drawer.
   * Ignored on desktop.
   */
  mobileFiltersOpen?: boolean;
  onMobileFiltersClose?: () => void;
  /**
   * Desktop: collapse filter rail (icon strip) until hover/focus-within peels it open —
   * same UX idea as docs/frontend/ideas/mydesigns/sidebar.md (narrow rail → expand).
   * Ignored on mobile (filters use drawer).
   */
  filtersPeekRail?: boolean;
}

export default function DataPageLayout({
  filters,
  children,
  className,
  filtersAriaLabel = "Filters",
  filterDrawerTitleId = "c360-filter-drawer-title",
  showFilters = true,
  toolbar,
  metadata,
  pagination,
  mobileFiltersOpen = false,
  onMobileFiltersClose,
  filtersPeekRail = false,
}: DataPageLayoutProps) {
  const isDesktop = useIsDesktop();
  const drawerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!mobileFiltersOpen || isDesktop) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onMobileFiltersClose?.();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [mobileFiltersOpen, isDesktop, onMobileFiltersClose]);

  useEffect(() => {
    if (mobileFiltersOpen && !isDesktop) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = prev;
      };
    }
    return undefined;
  }, [mobileFiltersOpen, isDesktop]);

  const showFilterPanel = showFilters && filters;
  /** Drawer UX only when parent passes close handler (contacts page). */
  const filterDrawerControlled = onMobileFiltersClose !== undefined;
  const inlineFilters =
    showFilterPanel && (isDesktop || !filterDrawerControlled);
  const drawerOpen =
    showFilterPanel &&
    !isDesktop &&
    filterDrawerControlled &&
    mobileFiltersOpen;

  useEffect(() => {
    if (drawerOpen) {
      drawerRef.current?.focus();
    }
  }, [drawerOpen]);

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
          !inlineFilters && "c360-data-layout--content-only",
        )}
      >
        {inlineFilters ? (
          <aside
            className={cn(
              "c360-data-layout__filters",
              filtersPeekRail &&
                isDesktop &&
                "c360-data-layout__filters--peek-rail",
            )}
            aria-label={filtersAriaLabel}
          >
            {filtersPeekRail && isDesktop ? (
              <>
                <button
                  type="button"
                  className="c360-data-layout__filters-rail"
                  aria-label={`Expand ${filtersAriaLabel}`}
                >
                  <SlidersHorizontal
                    size={20}
                    strokeWidth={2}
                    className="c360-data-layout__filters-rail-svg"
                    aria-hidden
                  />
                </button>
                <div className="c360-data-layout__filters-body">{filters}</div>
              </>
            ) : (
              filters
            )}
          </aside>
        ) : null}
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

      {drawerOpen ? (
        <>
          <button
            type="button"
            className="c360-data-layout__drawer-backdrop"
            aria-label="Close filters"
            onClick={onMobileFiltersClose}
          />
          <div
            ref={drawerRef}
            tabIndex={-1}
            className="c360-data-layout__drawer"
            role="dialog"
            aria-modal="true"
            aria-labelledby={filterDrawerTitleId}
          >
            <div className="c360-data-layout__drawer-body">{filters}</div>
          </div>
        </>
      ) : null}
    </div>
  );
}
