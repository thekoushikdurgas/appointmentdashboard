"use client";

import { Pagination } from "@/components/ui/Pagination";
import { formatCompact, formatNumber } from "@/lib/utils";

export interface CompanyPaginationProps {
  page: number;
  total: number;
  pageSize: number;
  onPageChange: (page: number) => void;
}

/** Range summary + page controls for the companies list (toolbar-adjacent via `DataPageLayout` `metadata`). */
export function CompanyPagination({
  page,
  total,
  pageSize,
  onPageChange,
}: CompanyPaginationProps) {
  if (total <= 0) return null;

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const showingFrom = (safePage - 1) * pageSize + 1;
  const showingTo = Math.min(safePage * pageSize, total);
  const totalLabel = formatCompact(total);
  const totalExact = formatNumber(total);

  return (
    <div
      className="c360-company-pagination-bar"
      role="region"
      aria-label={`Companies list pagination, showing ${showingFrom}–${showingTo} of ${totalExact}`}
    >
      <p
        className="c360-company-pagination-bar__range"
        title={
          total >= 10_000
            ? `${showingFrom}–${showingTo} of ${totalExact}`
            : undefined
        }
      >
        Showing {showingFrom}–{showingTo} of {totalLabel}
      </p>
      {safePage > 10 ? (
        <p className="c360-text-xs c360-text-muted c360-mb-2">
          Pages after 10 use cursor-based pagination from the server.
        </p>
      ) : null}
      <Pagination
        total={total}
        page={safePage}
        pageSize={pageSize}
        onPageChange={onPageChange}
        showWhenSinglePage
      />
    </div>
  );
}
