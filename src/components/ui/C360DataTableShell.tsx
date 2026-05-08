"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface C360DataTableShellProps {
  children: ReactNode;
  className?: string;
  /** Extra classes on the inner scroll region (e.g. min-height overrides). */
  scrollClassName?: string;
}

/**
 * Card-like shell + horizontal scroll wrapper for dense data grids (semantic HTML tables or MUI DataGrid).
 * Styles: `app/css/components/27-data-table-shell.css` (`.c360-data-table-shell`).
 */
export function C360DataTableShell({
  children,
  className,
  scrollClassName,
}: C360DataTableShellProps) {
  return (
    <div className={cn("c360-data-table-shell", className)}>
      <div className={cn("c360-data-table-shell__scroll", scrollClassName)}>
        {children}
      </div>
    </div>
  );
}
