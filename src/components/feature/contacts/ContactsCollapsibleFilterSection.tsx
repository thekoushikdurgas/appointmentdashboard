"use client";

import { useId, useState } from "react";
import { ChevronDown, X } from "lucide-react";
import type { ContactFilterChip } from "@/components/feature/contacts/contactFilterSectionChips";
import { FilterSectionChips } from "@/components/feature/contacts/FilterSectionChips";
import { FilterSectionIcon } from "@/components/shared/FilterSectionIcon";
import { cn } from "@/lib/utils";

export interface ContactsCollapsibleFilterSectionProps {
  title: string;
  /** API facet key — used to pick a section icon when `sectionId` is absent. */
  filterKey?: string;
  /** Stable accordion id (Hiring Signals) — preferred for icon lookup. */
  sectionId?: string;
  count?: number;
  /** Initial expanded state (e.g. open for primary filter block). */
  defaultOpen?: boolean;
  /** Controlled expand state — use with `onOpenChange` for accordion groups. */
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: React.ReactNode;
  /** Active filter chips rendered at the top of the section body. */
  activeChips?: ContactFilterChip[];
  /** Shown in the section header when `count > 0` (clears only this block’s scope — caller provides). */
  onClear?: () => void;
}

const baseClass = "c360-contacts-filter-section";

export function ContactsCollapsibleFilterSection({
  title,
  filterKey,
  sectionId,
  count,
  defaultOpen = false,
  isOpen: isOpenControlled,
  onOpenChange,
  children,
  activeChips = [],
  onClear,
}: ContactsCollapsibleFilterSectionProps) {
  const isControlled =
    isOpenControlled !== undefined && onOpenChange !== undefined;
  const [isOpenUncontrolled, setIsOpenUncontrolled] = useState(defaultOpen);
  const isOpen = isControlled ? isOpenControlled : isOpenUncontrolled;
  const contentId = useId();
  const hasActive = count !== undefined && count > 0;

  const toggleOpen = () => {
    if (isControlled) {
      onOpenChange(!isOpenControlled);
      return;
    }
    setIsOpenUncontrolled((v) => !v);
  };

  return (
    <div
      className={cn(
        baseClass,
        hasActive && `${baseClass}--active`,
        isOpen && `${baseClass}--open`,
      )}
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
          onClick={toggleOpen}
          aria-expanded={isOpen ? "true" : "false"}
          aria-controls={contentId}
        >
          <FilterSectionIcon
            title={title}
            filterKey={filterKey}
            sectionId={sectionId}
          />
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
          onClick={toggleOpen}
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
