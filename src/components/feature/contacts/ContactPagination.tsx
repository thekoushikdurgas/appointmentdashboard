"use client";

import { Pagination } from "@/components/ui/Pagination";
import { formatCompact, formatNumber } from "@/lib/utils";

/** Offset pages 1–10; page 11+ uses cursor pagination in `useContacts`. */
const CONTACTS_OFFSET_PAGE_CAP = 10;

export interface ContactPaginationProps {
  page: number;
  total: number;
  pageSize?: number;
  onPageChange: (page: number) => void;
}

/** Range summary + compact page dropdown — toolbar meta on contacts list. */
export function ContactPagination({
  page,
  total,
  pageSize = 25,
  onPageChange,
}: ContactPaginationProps) {
  if (total <= 0) return null;

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const showingFrom = (safePage - 1) * pageSize + 1;
  const showingTo = Math.min(safePage * pageSize, total);
  const totalLabel = formatCompact(total);
  const totalExact = formatNumber(total);

  return (
    <div
      className="c360-contacts-toolbar-meta"
      role="region"
      aria-label={`Contacts list pagination, showing ${showingFrom}–${showingTo} of ${totalExact}`}
    >
      <p
        className="c360-contacts-toolbar-meta__range"
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
          className="c360-contacts-toolbar-pagination"
          total={total}
          page={safePage}
          pageSize={pageSize}
          onPageChange={onPageChange}
          pageOptionLimit={CONTACTS_OFFSET_PAGE_CAP}
        />
      ) : null}
    </div>
  );
}
