"use client";

import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";

export interface PaginationProps {
  total: number;
  page: number;
  pageSize?: number;
  onPageChange: (page: number) => void;
  siblingCount?: number;
  className?: string;
}

function range(start: number, end: number): number[] {
  return Array.from({ length: end - start + 1 }, (_, i) => start + i);
}

function buildPages(
  current: number,
  totalPages: number,
  sibling: number,
): (number | "dots")[] {
  const totalShown = sibling * 2 + 5;
  if (totalPages <= totalShown) return range(1, totalPages);

  const leftSib = Math.max(current - sibling, 1);
  const rightSib = Math.min(current + sibling, totalPages);
  const showLeft = leftSib > 2;
  const showRight = rightSib < totalPages - 1;

  if (!showLeft && showRight) {
    const leftItems = range(1, 3 + sibling * 2);
    return [...leftItems, "dots", totalPages];
  }
  if (showLeft && !showRight) {
    const rightItems = range(totalPages - 2 - sibling * 2, totalPages);
    return [1, "dots", ...rightItems];
  }
  return [1, "dots", ...range(leftSib, rightSib), "dots", totalPages];
}

export function Pagination({
  total,
  page,
  pageSize = 25,
  onPageChange,
  siblingCount = 1,
  className,
}: PaginationProps) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  if (totalPages <= 1) return null;

  const pages = buildPages(page, totalPages, siblingCount);

  return (
    <nav aria-label="Pagination" className={cn("c360-pagination", className)}>
      <button
        className="c360-pagination__btn"
        onClick={() => onPageChange(page - 1)}
        disabled={page <= 1}
        aria-label="Previous page"
      >
        <ChevronLeft size={16} />
      </button>

      {pages.map((p, i) =>
        p === "dots" ? (
          <span key={`dots-${i}`} className="c360-pagination__dots">
            <MoreHorizontal size={16} />
          </span>
        ) : (
          <button
            key={p}
            className={cn(
              "c360-pagination__btn",
              p === page && "c360-pagination__btn--active",
            )}
            onClick={() => onPageChange(p)}
            aria-current={p === page ? "page" : undefined}
          >
            {p}
          </button>
        ),
      )}

      <button
        className="c360-pagination__btn"
        onClick={() => onPageChange(page + 1)}
        disabled={page >= totalPages}
        aria-label="Next page"
      >
        <ChevronRight size={16} />
      </button>
    </nav>
  );
}

export default Pagination;
