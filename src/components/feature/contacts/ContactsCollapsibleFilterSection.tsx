"use client";

import { useId, useState } from "react";
import { ChevronDown, X } from "lucide-react";
import type { ContactFilterChip } from "@/components/feature/contacts/contactFilterSectionChips";
import { FilterSectionChips } from "@/components/feature/contacts/FilterSectionChips";
import { cn } from "@/lib/utils";

export interface ContactsCollapsibleFilterSectionProps {
  title: string;
  count?: number;
  /** Initial expanded state (e.g. open for primary filter block). */
  defaultOpen?: boolean;
  children: React.ReactNode;
  /** Active filter chips rendered at the top of the section body. */
  activeChips?: ContactFilterChip[];
  /** Shown in the section header when `count > 0` (clears only this block’s scope — caller provides). */
  onClear?: () => void;
}

const baseClass = "c360-contacts-filter-section";

export function ContactsCollapsibleFilterSection({
  title,
  count,
  defaultOpen = false,
  children,
  activeChips = [],
  onClear,
}: ContactsCollapsibleFilterSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const contentId = useId();
  const hasActive = count !== undefined && count > 0;

  return (
    <div
      className={cn(baseClass, (isOpen || hasActive) && `${baseClass}--active`)}
    >
      <div
        className={cn(
          `${baseClass}__header`,
          hasActive && `${baseClass}__header--active`,
        )}
      >
        <button
          type="button"
          className={`${baseClass}__header-toggle`}
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
        </button>
        {onClear && hasActive ? (
          <button
            type="button"
            className={`${baseClass}__clear`}
            onClick={(e) => {
              e.stopPropagation();
              onClear();
            }}
            aria-label={`Clear ${title}`}
          >
            <X size={14} aria-hidden /> Clear
          </button>
        ) : null}
        <button
          type="button"
          className={`${baseClass}__header-chevron`}
          onClick={() => setIsOpen((v) => !v)}
          aria-label={isOpen ? `Collapse ${title}` : `Expand ${title}`}
        >
          <ChevronDown
            size={16}
            className={cn(
              `${baseClass}__chevron`,
              isOpen && `${baseClass}__chevron--open`,
            )}
            aria-hidden
          />
        </button>
      </div>
      {isOpen ? (
        <div id={contentId} className={`${baseClass}__content`}>
          <FilterSectionChips chips={activeChips} />
          {children}
        </div>
      ) : null}
    </div>
  );
}
