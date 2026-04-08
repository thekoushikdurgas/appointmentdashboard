/**
 * Backward-compatible Pagination wrapper.
 * Prefers the canonical `ui/Pagination` component internally.
 * New code should import from `@/components/ui/Pagination` directly.
 */
import { cn } from "@/lib/utils";
import { Pagination as UIPagination } from "@/components/ui/Pagination";

interface PaginationProps {
  page: number;
  /** Total number of pages (used when `total` is not provided). */
  totalPages?: number;
  onPageChange: (page: number) => void;
  /** Total number of records — preferred over totalPages. */
  total?: number;
  pageSize?: number;
  className?: string;
}

export function Pagination({
  page,
  totalPages,
  onPageChange,
  total,
  pageSize = 10,
  className,
}: PaginationProps) {
  const resolvedTotal =
    total !== undefined ? total : (totalPages ?? 1) * pageSize;

  return (
    <UIPagination
      total={resolvedTotal}
      page={page}
      pageSize={pageSize}
      onPageChange={onPageChange}
      className={cn(className)}
    />
  );
}

export default Pagination;
