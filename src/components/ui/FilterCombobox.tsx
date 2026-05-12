"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { ChevronDown } from "lucide-react";
import { Popover } from "@/components/ui/Popover";
import { Checkbox } from "@/components/ui/Checkbox";
import { cn } from "@/lib/utils";
import { useDataFiltersPeek } from "@/context/DataFiltersPeekContext";
/** Shared shape for contact / company filter facet rows. */
export type FilterComboboxOption = {
  value: string;
  displayValue: string;
  count?: number | null;
};

export interface FilterComboboxProps {
  /** Accessible label for the combobox. */
  label: string;
  options: FilterComboboxOption[];
  selectedValues: string[];
  onSelectionChange: (values: string[]) => void;
  loading: boolean;
  loadingMore?: boolean;
  hasMore: boolean;
  /** Called when the panel opens (load first page). */
  onOpen: () => void;
  /** Called when the list is scrolled near the bottom. */
  onLoadMore: () => void;
  searchText: string;
  onSearchChange: (text: string) => void;
  disabled?: boolean;
  className?: string;
}

export function FilterCombobox({
  label,
  options,
  selectedValues,
  onSelectionChange,
  loading,
  loadingMore = false,
  hasMore,
  onOpen,
  onLoadMore,
  searchText,
  onSearchChange,
  disabled = false,
  className,
}: FilterComboboxProps) {
  const peek = useDataFiltersPeek();
  const peekRef = useRef(peek);
  peekRef.current = peek;
  const [panelOpen, setPanelOpen] = useState(false);
  const panelOpenRef = useRef(false);
  const [focusIndex, setFocusIndex] = useState(-1);
  const listRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const wasPanelOpen = useRef(false);
  const onLoadMoreRef = useRef(onLoadMore);
  onLoadMoreRef.current = onLoadMore;
  /** Guard against pathological duplicate pages when auto-filling the scrollport. */
  const fillMoreBurstRef = useRef(0);

  panelOpenRef.current = panelOpen;

  const handleOpenChange = useCallback(
    (open: boolean) => {
      setPanelOpen(open);
      peek?.notifyFilterOverlayOpen(open);
    },
    [peek],
  );

  useEffect(() => {
    return () => {
      if (panelOpenRef.current) {
        peekRef.current?.notifyFilterOverlayOpen(false);
      }
    };
  }, []);

  useEffect(() => {
    if (panelOpen && !wasPanelOpen.current) {
      onOpen();
      setFocusIndex(-1);
      requestAnimationFrame(() => searchInputRef.current?.focus());
    }
    wasPanelOpen.current = panelOpen;
  }, [panelOpen, onOpen]);

  useEffect(() => {
    if (!panelOpen) fillMoreBurstRef.current = 0;
  }, [panelOpen]);

  /**
   * Hiring-signal-style infinite scroll loads the next page on scroll. If the first
   * page has fewer rows than the list viewport height, nothing scrolls and load-more
   * never runs — chain `onLoadMore` until the list overflows or the server clears `hasMore`.
   */
  useLayoutEffect(() => {
    if (!panelOpen || !hasMore || loading || loadingMore) return;
    const el = listRef.current;
    if (!el || options.length === 0) return;
    if (el.scrollHeight > el.clientHeight + 2) return;
    if (fillMoreBurstRef.current >= 50) return;
    fillMoreBurstRef.current += 1;
    onLoadMoreRef.current();
  }, [panelOpen, hasMore, loading, loadingMore, options.length]);

  const toggleValue = useCallback(
    (value: string) => {
      const v = String(value);
      if (selectedValues.includes(v)) {
        onSelectionChange(selectedValues.filter((x) => x !== v));
      } else {
        onSelectionChange([...selectedValues, v]);
      }
    },
    [selectedValues, onSelectionChange],
  );

  const handleScroll = useCallback(
    (e: React.UIEvent<HTMLDivElement>) => {
      const el = e.currentTarget;
      if (
        el.scrollTop + el.clientHeight >= el.scrollHeight - 32 &&
        hasMore &&
        !loadingMore &&
        !loading
      ) {
        onLoadMore();
      }
    },
    [hasMore, loading, loadingMore, onLoadMore],
  );

  const summary =
    selectedValues.length === 0
      ? "Any"
      : selectedValues.length === 1
        ? (options.find((o) => String(o.value) === selectedValues[0])
            ?.displayValue ?? selectedValues[0])
        : `${selectedValues.length} selected`;

  const onListKeyDown = (e: React.KeyboardEvent) => {
    if (options.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setFocusIndex((i) => (i + 1 >= options.length ? 0 : i + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setFocusIndex((i) => (i <= 0 ? options.length - 1 : i - 1));
    } else if (e.key === "Enter" || e.key === " ") {
      if (focusIndex >= 0 && options[focusIndex]) {
        e.preventDefault();
        toggleValue(String(options[focusIndex].value ?? ""));
      }
    }
  };

  useEffect(() => {
    if (focusIndex < 0 || !listRef.current) return;
    const row = listRef.current.querySelector<HTMLElement>(
      `[data-option-index="${focusIndex}"]`,
    );
    row?.focus();
  }, [focusIndex]);

  return (
    <div className={cn("c360-filter-combobox", className)}>
      <span className="c360-text-xs c360-text-muted c360-mb-1 c360-block">
        {label}
      </span>
      <Popover
        inline
        width={320}
        align="start"
        placement="bottom"
        onOpenChange={handleOpenChange}
        panelClassName="c360-filter-combobox__panel"
        trigger={
          <button
            type="button"
            disabled={disabled}
            className={cn(
              "c360-select__trigger",
              "c360-select__trigger--sm",
              "c360-filter-combobox__trigger",
              "c360-flex",
              "c360-items-center",
              "c360-justify-between",
              "c360-gap-2",
              "c360-w-full",
              "c360-text-left",
            )}
            aria-expanded={panelOpen ? "true" : "false"}
            aria-haspopup="listbox"
            aria-label={label}
          >
            <span className="c360-truncate">{summary}</span>
            <ChevronDown size={16} className="c360-flex-shrink-0" aria-hidden />
          </button>
        }
        content={
          <div
            className="c360-filter-combobox__panel-inner"
            onKeyDown={onListKeyDown}
          >
            <input
              ref={searchInputRef}
              type="search"
              value={searchText}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search…"
              className="c360-input c360-input--sm"
              aria-label={`Search ${label}`}
            />
            <div
              ref={listRef}
              role="listbox"
              aria-label={`${label} options`}
              aria-multiselectable="true"
              className="c360-filter-combobox__list"
              onScroll={handleScroll}
            >
              {loading && options.length === 0 ? (
                <div className="c360-p-3 c360-text-sm c360-text-muted">
                  Loading…
                </div>
              ) : null}
              {!loading && options.length === 0 ? (
                <div className="c360-p-3 c360-text-sm c360-text-muted">
                  No matches
                </div>
              ) : null}
              {options.map((o, idx) => {
                const val = String(o.value ?? "");
                const optLabel =
                  o.count != null
                    ? `${o.displayValue} (${o.count})`
                    : (o.displayValue ?? val);
                const checked = selectedValues.includes(val);
                return (
                  <label
                    key={val || `opt-${idx}`}
                    role="option"
                    aria-selected={checked ? "true" : "false"}
                    data-option-index={idx}
                    tabIndex={focusIndex === idx ? 0 : -1}
                    className={cn(
                      "c360-filter-combobox__option",
                      "c360-flex",
                      "c360-items-center",
                      "c360-gap-2",
                      "c360-rounded-md",
                      "c360-px-2",
                      "c360-py-1",
                      "c360-text-sm",
                      "c360-cursor-pointer",
                      focusIndex === idx &&
                        "c360-filter-combobox__option--focus",
                    )}
                  >
                    <Checkbox
                      checked={checked}
                      onChange={() => toggleValue(val)}
                      size="sm"
                    />
                    <span className="c360-truncate" title={optLabel}>
                      {optLabel}
                    </span>
                  </label>
                );
              })}
              {loadingMore ? (
                <div className="c360-p-2 c360-text-xs c360-text-muted c360-text-center">
                  Loading more…
                </div>
              ) : null}
            </div>
          </div>
        }
      />
    </div>
  );
}
