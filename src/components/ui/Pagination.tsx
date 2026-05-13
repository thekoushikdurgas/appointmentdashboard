"use client";

import { Pagination as ArkPagination } from "@ark-ui/react/pagination";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import { getPaginationBounds } from "@/lib/paginationBounds";
import { cn, formatCompact } from "@/lib/utils";

export interface PaginationProps {
  total: number;
  page: number;
  pageSize?: number;
  onPageChange: (page: number) => void;
  siblingCount?: number;
  className?: string;
  /**
   * When there is only one page of results, still render prev/next (disabled) and
   * page `1`. Defaults to `false` so list footers can omit controls when everything fits one page.
   */
  showWhenSinglePage?: boolean;
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

export function Pagination({
  total,
  page,
  pageSize = 25,
  onPageChange,
  siblingCount = 1,
  className,
  showWhenSinglePage = false,
}: PaginationProps) {
  const { pageSize: ps, totalPages, safePage } = getPaginationBounds(
    total,
    page,
    pageSize,
  );

  if (totalPages <= 1 && !showWhenSinglePage) return null;

  if (totalPages <= 1 && showWhenSinglePage) {
    return (
      <nav aria-label="Pagination" className={cn("c360-pagination", className)}>
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
      </nav>
    );
  }

  return (
    <ArkPagination.Root
      aria-label="Pagination"
      className={cn("c360-pagination", className)}
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
    </ArkPagination.Root>
  );
}

export default Pagination;
