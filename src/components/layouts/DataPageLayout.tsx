"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { cn } from "@/lib/utils";
import { useIsDesktop } from "@/hooks/common/useBreakpoint";
import {
  DataFiltersPeekProvider,
  dataFiltersPeekPinnedStorageKey,
  type DataFiltersPeekScope,
} from "@/context/DataFiltersPeekContext";
import { FilterPeekPinButton } from "@/components/layouts/FilterPeekPinButton";
import { Filter } from "lucide-react";

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
   * Desktop: collapse filter panel until hover/focus-within peels it open —
   * same UX idea as docs/frontend/ideas/mydesigns/sidebar.md (narrow strip → expand).
   * Ignored on mobile (filters use drawer).
   */
  filtersPeekRail?: boolean;
  /**
   * When `filtersPeekRail` is true, identifies which localStorage key to use for pin state.
   */
  filtersPeekScope?: DataFiltersPeekScope;
  /**
   * When `filtersPeekRail` + `filtersPeekScope` are set (desktop peek rail), optional
   * content rendered next to the pin control in the filter rail header row.
   */
  filtersPinExtra?: ReactNode;
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
  filtersPeekScope,
  filtersPinExtra,
}: DataPageLayoutProps) {
  const isDesktop = useIsDesktop();
  const drawerRef = useRef<HTMLDivElement>(null);
  const [filtersPeekPinned, setFiltersPeekPinned] = useState(false);
  const filterOverlayHoldCountRef = useRef(0);
  const [filterOverlayHold, setFilterOverlayHold] = useState(false);

  const peekDesktop = Boolean(filtersPeekRail && isDesktop);
  const peekWithPin = Boolean(peekDesktop && filtersPeekScope);

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

  useEffect(() => {
    if (!peekWithPin || !filtersPeekScope) return;
    try {
      const v = localStorage.getItem(
        dataFiltersPeekPinnedStorageKey(filtersPeekScope),
      );
      setFiltersPeekPinned(v === "true");
    } catch {
      /* ignore */
    }
  }, [peekWithPin, filtersPeekScope]);

  const toggleFiltersPeekPinned = useCallback(() => {
    setFiltersPeekPinned((prev) => {
      const next = !prev;
      if (filtersPeekScope && typeof window !== "undefined") {
        try {
          localStorage.setItem(
            dataFiltersPeekPinnedStorageKey(filtersPeekScope),
            next ? "true" : "false",
          );
        } catch {
          /* ignore */
        }
      }
      return next;
    });
  }, [filtersPeekScope]);

  const notifyFilterOverlayOpen = useCallback((open: boolean) => {
    if (open) {
      filterOverlayHoldCountRef.current += 1;
    } else {
      filterOverlayHoldCountRef.current = Math.max(
        0,
        filterOverlayHoldCountRef.current - 1,
      );
    }
    setFilterOverlayHold(filterOverlayHoldCountRef.current > 0);
  }, []);

  const filtersPeekExpanded = filtersPeekPinned || filterOverlayHold;

  const peekContextValue = useMemo(
    () => ({
      pinned: filtersPeekPinned,
      togglePinned: toggleFiltersPeekPinned,
      notifyFilterOverlayOpen,
    }),
    [filtersPeekPinned, toggleFiltersPeekPinned, notifyFilterOverlayOpen],
  );

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

  const filtersPeekShell = (
    <div className="c360-data-layout__filters-body">
      {peekWithPin ? (
        <div className="c360-data-layout__filters-body-pin">
          <div
            className="c360-data-layout__filters-peek-collapsed-hint"
            aria-hidden
          >
            <Filter
              className="c360-data-layout__filters-peek-collapsed-hint-icon"
              size={18}
              strokeWidth={2}
              aria-hidden
            />
          </div>
          <div
            className={cn(
              "c360-data-layout__filters-pin-expandable",
              filtersPinExtra
                ? "c360-data-layout__filters-pin-row"
                : "c360-data-layout__filters-pin-expandable--solo",
            )}
          >
            <FilterPeekPinButton />
            {filtersPinExtra ? (
              <div className="c360-data-layout__filters-pin-extra">
                {filtersPinExtra}
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
      <div className="c360-data-layout__filters-body-scroll">{filters}</div>
    </div>
  );

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
              peekDesktop && "c360-data-layout__filters--peek-rail",
              peekDesktop &&
                filtersPeekExpanded &&
                "c360-data-layout__filters--peek-pinned",
            )}
            aria-label={filtersAriaLabel}
          >
            {peekDesktop ? (
              peekWithPin ? (
                <DataFiltersPeekProvider value={peekContextValue}>
                  {filtersPeekShell}
                </DataFiltersPeekProvider>
              ) : (
                filtersPeekShell
              )
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
