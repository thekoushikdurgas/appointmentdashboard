"use client";

import { useId } from "react";
import { Loader2, Sparkles, X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ContactsToolbarAiSearchProps {
  value: string;
  onChange: (value: string) => void;
  onSearch: () => void;
  searching?: boolean;
  disabled?: boolean;
  className?: string;
}

/** Toolbar AI filter prompt — same shell pattern as `HiringSignalsGlobalSearch`. */
export function ContactsToolbarAiSearch({
  value,
  onChange,
  onSearch,
  searching = false,
  disabled = false,
  className,
}: ContactsToolbarAiSearchProps) {
  const inputId = useId();
  const trimmed = value.trim();
  const showClear = !disabled && trimmed.length > 0;
  const showLoader = !disabled && searching;

  return (
    <div
      className={cn("c360-hs-global-search", className)}
      role="search"
      aria-label="AI-assisted contact filter"
    >
      <div
        className={cn(
          "c360-hs-global-search__shell",
          disabled && "c360-hs-global-search__shell--disabled",
        )}
      >
        <div
          className="c360-hs-global-search__affix c360-hs-global-search__affix--start"
          aria-hidden
        >
          {showLoader ? (
            <Loader2
              className="c360-hs-global-search__loader"
              size={16}
              strokeWidth={2}
              role="status"
              aria-label="Running AI filter"
            />
          ) : (
            <Sparkles size={16} strokeWidth={2} />
          )}
        </div>

        <div className="c360-hs-global-search__body">
          <input
            id={inputId}
            type="search"
            className="c360-hs-global-search__input"
            value={value}
            disabled={disabled}
            placeholder="Ask AI: 'VPs in tech with >100 employees'"
            aria-label="AI-assisted filter prompt"
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && trimmed.length > 0) {
                e.preventDefault();
                onSearch();
              }
            }}
          />
        </div>

        {showClear ? (
          <button
            type="button"
            className="c360-hs-global-search__affix c360-hs-global-search__affix--end"
            aria-label="Clear AI prompt"
            onClick={() => onChange("")}
          >
            <X size={16} strokeWidth={2} aria-hidden />
          </button>
        ) : null}
      </div>
    </div>
  );
}
