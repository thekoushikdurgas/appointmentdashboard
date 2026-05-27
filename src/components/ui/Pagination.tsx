"use client";

import type { ReactNode } from "react";
import { Pagination as ArkPagination } from "@ark-ui/react/pagination";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import { Select, type SelectOption } from "@/components/ui/Select";
import { PaginationDropdownNav } from "@/components/ui/PaginationDropdownNav";
import { getPaginationBounds } from "@/lib/paginationBounds";
import { cn, formatCompact } from "@/lib/utils";

export type PaginationVariant = "numbered" | "dropdown";

export interface PaginationProps {
  total: number;
  page: number;
  pageSize?: number;
  onPageChange: (page: number) => void;
  siblingCount?: number;
  className?: string;
  /** Numbered page list (default) or compact prev / dropdown / next. */
  variant?: PaginationVariant;
  /**
   * When there is only one page of results, still render prev/next (disabled) and
   * page `1`. Defaults to `false` so list footers can omit controls when everything fits one page.
   */
  showWhenSinglePage?: boolean;
  /** Optional rows-per-page dropdown rendered at the start of the pagination bar. */
  pageSizeOptions?: readonly SelectOption[];
  onPageSizeChange?: (pageSize: number) => void;
  pageSizeSelectLabel?: string;
}

const PAGER_TRANSLATIONS = {
  rootLabel: "Pagination",
  firstTriggerLabel: "First page",
  prevTriggerLabel: "Previous page",
  nextTriggerLabel: "Next page",
  lastTriggerLabel: "Last page",
  itemLabel: ({ page: pageNum }: { page: number; totalPages: number }) =>
    pageNum >= 10_000
      ? `Page ${pageNum.toLocaleString("en-US")}`
      : `Page ${pageNum}`,
};

function PaginationPageSizeSelect({
  pageSize,
  options,
  label,
  onPageSizeChange,
}: {
  pageSize: number;
  options: readonly SelectOption[];
  label: string;
  onPageSizeChange: (pageSize: number) => void;
}) {
  return (
    <div className="c360-pagination__page-size">
      <span className="c360-pagination__info">{label}</span>
      <Select
        className="c360-pagination__page-size-select"
        fullWidth={false}
        inputSize="sm"
        aria-label={`${label} per page`}
        value={String(pageSize)}
        options={[...options]}
        onChange={(e) => {
          const next = Number(e.target.value);
          onPageSizeChange(Number.isFinite(next) && next > 0 ? next : pageSize);
        }}
      />
    </div>
  );
}

export function Pagination({
  total,
  page,
  pageSize = 25,
  onPageChange,
  siblingCount = 1,
  className,
  variant = "numbered",
  showWhenSinglePage = false,
  pageSizeOptions,
  onPageSizeChange,
  pageSizeSelectLabel = "Rows",
}: PaginationProps) {
  if (variant === "dropdown") {
    return (
      <PaginationDropdownNav
        total={total}
        page={page}
        pageSize={pageSize}
        onPageChange={onPageChange}
        className={className}
        showWhenSinglePage={showWhenSinglePage}
      />
    );
  }

  const {
    pageSize: ps,
    totalPages,
    safePage,
  } = getPaginationBounds(total, page, pageSize);

  const pageSizeSelect =
    onPageSizeChange && pageSizeOptions && pageSizeOptions.length > 0 ? (
      <PaginationPageSizeSelect
        pageSize={ps}
        options={pageSizeOptions}
        label={pageSizeSelectLabel}
        onPageSizeChange={onPageSizeChange}
      />
    ) : null;

  const wrapPaginationBar = (controls: ReactNode) => {
    if (pageSizeSelect) {
      return (
        <div
          role="navigation"
          aria-label="Pagination"
          className={cn(
            "c360-pagination",
            "c360-pagination--with-size",
            className,
          )}
        >
          {pageSizeSelect}
          <div className="c360-pagination__pages">{controls}</div>
        </div>
      );
    }
    return (
      <nav aria-label="Pagination" className={cn("c360-pagination", className)}>
        {controls}
      </nav>
    );
  };

  if (totalPages <= 1 && !showWhenSinglePage) {
    if (!pageSizeSelect) return null;
    return wrapPaginationBar(null);
  }

  if (totalPages <= 1 && showWhenSinglePage) {
    return wrapPaginationBar(
      <>
        <button
          type="button"
          className="c360-pagination__page c360-pagination__page--icon"
          disabled
          aria-label="Previous page"
        >
          <ChevronLeft size={16} aria-hidden />
        </button>
        <button
          type="button"
          className={cn(
            "c360-pagination__page",
            "c360-pagination__page--active",
          )}
          aria-current="page"
          disabled
        >
          1
        </button>
        <button
          type="button"
          className="c360-pagination__page c360-pagination__page--icon"
          disabled
          aria-label="Next page"
        >
          <ChevronRight size={16} aria-hidden />
        </button>
      </>,
    );
  }

  return wrapPaginationBar(
    <ArkPagination.Root
      className="c360-pagination__pages-inner"
      count={Math.max(0, total)}
      pageSize={ps}
      page={safePage}
      siblingCount={siblingCount}
      translations={PAGER_TRANSLATIONS}
      onPageChange={(d) => onPageChange(d.page)}
    >
      <ArkPagination.FirstTrigger
        type="button"
        className="c360-pagination__page c360-pagination__page--icon"
      >
        <ChevronsLeft size={16} aria-hidden />
      </ArkPagination.FirstTrigger>

      <ArkPagination.PrevTrigger
        type="button"
        className="c360-pagination__page c360-pagination__page--icon"
      >
        <ChevronLeft size={16} aria-hidden />
      </ArkPagination.PrevTrigger>

      <ArkPagination.Context>
        {(pager) =>
          pager.pages.map((p, index) =>
            p.type === "page" ? (
              <ArkPagination.Item
                key={`page-${p.value}`}
                {...p}
                className="c360-pagination__page"
                title={
                  p.value >= 10_000
                    ? `Page ${p.value.toLocaleString("en-US")}`
                    : undefined
                }
              >
                {p.value >= 10_000 ? formatCompact(p.value) : p.value}
              </ArkPagination.Item>
            ) : (
              <ArkPagination.Ellipsis
                key={`ellipsis-${index}`}
                index={index}
                className="c360-pagination__ellipsis"
                aria-hidden
              >
                &#8230;
              </ArkPagination.Ellipsis>
            ),
          )
        }
      </ArkPagination.Context>

      <ArkPagination.NextTrigger
        type="button"
        className="c360-pagination__page c360-pagination__page--icon"
      >
        <ChevronRight size={16} aria-hidden />
      </ArkPagination.NextTrigger>

      <ArkPagination.LastTrigger
        type="button"
        className="c360-pagination__page c360-pagination__page--icon"
      >
        <ChevronsRight size={16} aria-hidden />
      </ArkPagination.LastTrigger>
    </ArkPagination.Root>,
  );
}

export { PaginationDropdownNav } from "@/components/ui/PaginationDropdownNav";
export type { PaginationDropdownNavProps } from "@/components/ui/PaginationDropdownNav";
export default Pagination;
