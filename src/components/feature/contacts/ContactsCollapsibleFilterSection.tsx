"use client";

import { useId, useState } from "react";
import { ChevronDown, X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ContactsCollapsibleFilterSectionProps {
  title: string;
  count?: number;
  /** Initial expanded state (e.g. open for primary filter block). */
  defaultOpen?: boolean;
  children: React.ReactNode;
  /** Shown inside the panel when `count > 0` (clears only this block’s scope — caller provides). */
  onClear?: () => void;
}

const baseClass = "c360-contacts-filter-section";

export function ContactsCollapsibleFilterSection({
  title,
  count,
  defaultOpen = false,
  children,
  onClear,
}: ContactsCollapsibleFilterSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const contentId = useId();
  const hasActive = count !== undefined && count > 0;

  return (
    <div
      className={cn(baseClass, (isOpen || hasActive) && `${baseClass}--active`)}
    >
      <button
        type="button"
        className={`${baseClass}__header`}
        onClick={() => setIsOpen((v) => !v)}
        aria-expanded={isOpen ? "true" : "false"}
        aria-controls={contentId}
      >
        <span className={`${baseClass}__title`}>{title}</span>
        {hasActive ? (
          <span className={`${baseClass}__count`} aria-hidden>
            {count}
          </span>
        ) : null}
        <ChevronDown
          size={16}
          className={cn(
            `${baseClass}__chevron`,
            isOpen && `${baseClass}__chevron--open`,
          )}
          aria-hidden
        />
      </button>
      {isOpen ? (
        <div id={contentId} className={`${baseClass}__content`}>
          {children}
          {onClear && hasActive ? (
            <button
              type="button"
              className={`${baseClass}__clear`}
              onClick={onClear}
              aria-label={`Clear ${title}`}
            >
              <X size={14} aria-hidden /> Clear
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
