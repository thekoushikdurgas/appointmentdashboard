"use client";

import { Pagination } from "@/components/ui/Pagination";

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

  return (
    <div
      className="c360-company-pagination-bar"
      role="region"
      aria-label="Companies list pagination"
    >
      <p className="c360-company-pagination-bar__range">
        Showing {showingFrom}–{showingTo} of {total}
      </p>
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
