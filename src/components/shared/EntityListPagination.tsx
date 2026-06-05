"use client";

import { Pagination } from "@/components/ui/Pagination";
import { formatCompact, formatNumber } from "@/lib/utils";

export interface EntityListPaginationProps {
  page: number;
  total: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  /** Offset pages 1–N; page N+1+ may use cursor pagination in list hooks. */
  offsetPageCap?: number;
  /** BEM block for toolbar meta wrapper (e.g. c360-contacts-toolbar-meta). */
  metaClassName: string;
  paginationClassName: string;
  ariaLabelPrefix: string;
}

/** Range summary + compact page dropdown — toolbar meta on entity lists. */
export function EntityListPagination({
  page,
  total,
  pageSize,
  onPageChange,
  offsetPageCap = 10,
  metaClassName,
  paginationClassName,
  ariaLabelPrefix,
}: EntityListPaginationProps) {
  if (total <= 0) return null;

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const showingFrom = (safePage - 1) * pageSize + 1;
  const showingTo = Math.min(safePage * pageSize, total);
  const totalLabel = formatCompact(total);
  const totalExact = formatNumber(total);

  return (
    <div
      className={metaClassName}
      role="region"
      aria-label={`${ariaLabelPrefix}, showing ${showingFrom}–${showingTo} of ${totalExact}`}
    >
      <p
        className={`${metaClassName}__range`}
        title={
          total >= 10_000
            ? `${showingFrom}–${showingTo} of ${totalExact}`
            : undefined
        }
      >
        Showing {showingFrom}–{showingTo} of {totalLabel}
      </p>
      {total > pageSize ? (
        <Pagination
          variant="dropdown"
          className={paginationClassName}
          total={total}
          page={safePage}
          pageSize={pageSize}
          onPageChange={onPageChange}
          pageOptionLimit={offsetPageCap}
        />
      ) : null}
    </div>
  );
}
