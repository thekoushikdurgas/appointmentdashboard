"use client";

import * as SelectPrimitive from "@radix-ui/react-select";
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useDataFiltersPeek } from "@/context/DataFiltersPeekContext";
import { getPaginationBounds } from "@/lib/paginationBounds";
import { cn } from "@/lib/utils";

export interface PaginationDropdownNavProps {
  total: number;
  page: number;
  pageSize?: number;
  onPageChange: (page: number) => void;
  className?: string;
  showWhenSinglePage?: boolean;
}

function buildPageOptions(totalPages: number) {
  return Array.from({ length: totalPages }, (_, i) => {
    const n = i + 1;
    return { value: String(n), label: String(n) };
  });
}

function PaginationPageMenu({
  page,
  totalPages,
  onPageChange,
}: {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}) {
  const peek = useDataFiltersPeek();
  const peekRef = useRef(peek);
  peekRef.current = peek;
  const menuOpenRef = useRef(false);
  const [open, setOpen] = useState(false);

  const options = useMemo(() => buildPageOptions(totalPages), [totalPages]);

  const handleOpenChange = useCallback(
    (next: boolean) => {
      setOpen(next);
      menuOpenRef.current = next;
      peek?.notifyFilterOverlayOpen(next);
    },
    [peek],
  );

  useEffect(() => {
    return () => {
      if (menuOpenRef.current) {
        peekRef.current?.notifyFilterOverlayOpen(false);
      }
    };
  }, []);

  return (
    <SelectPrimitive.Root
      value={String(page)}
      onValueChange={(v) => {
        const n = Number(v);
        if (Number.isFinite(n) && n >= 1) onPageChange(n);
      }}
      onOpenChange={handleOpenChange}
    >
      <SelectPrimitive.Trigger
        type="button"
        className="c360-pagination__page c360-pagination__page--dropdown"
        aria-label={`Page ${page} of ${totalPages}`}
      >
        <SelectPrimitive.Value />
        <SelectPrimitive.Icon
          aria-hidden
          className="c360-pagination__dropdown-chevron"
        >
          {open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </SelectPrimitive.Icon>
      </SelectPrimitive.Trigger>
      <SelectPrimitive.Portal>
        <SelectPrimitive.Content
          position="popper"
          side="top"
          align="center"
          sideOffset={6}
          className="c360-select__content c360-pagination__page-menu"
        >
          <SelectPrimitive.ScrollUpButton className="c360-select__scroll-btn">
            <ChevronUp size={14} />
          </SelectPrimitive.ScrollUpButton>
          <SelectPrimitive.Viewport className="c360-select__viewport c360-pagination__page-menu-viewport">
            {options.map((opt) => (
              <SelectPrimitive.Item
                key={opt.value}
                value={opt.value}
                className="c360-select__item c360-pagination__page-menu-item"
              >
                <SelectPrimitive.ItemText>{opt.label}</SelectPrimitive.ItemText>
              </SelectPrimitive.Item>
            ))}
          </SelectPrimitive.Viewport>
          <SelectPrimitive.ScrollDownButton className="c360-select__scroll-btn">
            <ChevronDown size={14} />
          </SelectPrimitive.ScrollDownButton>
        </SelectPrimitive.Content>
      </SelectPrimitive.Portal>
    </SelectPrimitive.Root>
  );
}

/** Compact prev / page dropdown / next — for dense toolbars (e.g. Hire Signals). */
export function PaginationDropdownNav({
  total,
  page,
  pageSize = 25,
  onPageChange,
  className,
  showWhenSinglePage = false,
}: PaginationDropdownNavProps) {
  const { totalPages, safePage } = getPaginationBounds(total, page, pageSize);

  if (totalPages <= 1 && !showWhenSinglePage) return null;

  const atFirst = safePage <= 1;
  const atLast = safePage >= totalPages;

  return (
    <nav
      aria-label="Pagination"
      className={cn("c360-pagination", "c360-pagination--dropdown", className)}
    >
      <button
        type="button"
        className="c360-pagination__page c360-pagination__page--icon"
        disabled={atFirst}
        aria-label="Previous page"
        onClick={() => onPageChange(safePage - 1)}
      >
        <ChevronLeft size={16} aria-hidden />
      </button>
      <PaginationPageMenu
        page={safePage}
        totalPages={totalPages}
        onPageChange={onPageChange}
      />
      <button
        type="button"
        className="c360-pagination__page c360-pagination__page--icon"
        disabled={atLast}
        aria-label="Next page"
        onClick={() => onPageChange(safePage + 1)}
      >
        <ChevronRight size={16} aria-hidden />
      </button>
    </nav>
  );
}
