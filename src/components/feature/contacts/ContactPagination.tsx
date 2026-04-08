"use client";

import { Pagination } from "@/components/patterns/Pagination";

interface ContactPaginationProps {
  page: number;
  total: number;
  pageSize?: number;
  onPageChange: (page: number) => void;
}

export function ContactPagination({
  page,
  total,
  pageSize = 25,
  onPageChange,
}: ContactPaginationProps) {
  const totalPages = Math.ceil(total / pageSize);
  return (
    <div className="c360-table-footer">
      <Pagination
        page={page}
        totalPages={totalPages}
        onPageChange={onPageChange}
        total={total}
        pageSize={pageSize}
      />
    </div>
  );
}
