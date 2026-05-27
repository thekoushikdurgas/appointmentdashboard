"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { Loader2, Search, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { normalizeHiringSignalTokenList } from "@/components/feature/hiring-signals/hiringSignalFilterDraft";

const DEBOUNCE_MS = 350;
const MAX_TOKENS = 10;

export interface HiringSignalsGlobalSearchProps {
  tokens: string[];
  onTokensChange: (tokens: string[]) => void;
  disabled?: boolean;
  className?: string;
}

function splitInputTokens(raw: string): string[] {
  return raw
    .split(/[,;\n]+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

/**
 * Toolbar global job search (Origin UI search-input pattern).
 * @see docs/frontend/ideas/mydesigns/seach_bar.md
 */
export function HiringSignalsGlobalSearch({
  tokens,
  onTokensChange,
  disabled = false,
  className,
}: HiringSignalsGlobalSearchProps) {
  const inputId = useId();
  const [input, setInput] = useState("");
  const [draftTokens, setDraftTokens] = useState(() =>
    normalizeHiringSignalTokenList(tokens),
  );
  const [isDebouncing, setIsDebouncing] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setDraftTokens(normalizeHiringSignalTokenList(tokens));
  }, [tokens]);

  const scheduleEmit = useCallback(
    (next: string[]) => {
      const normalized = normalizeHiringSignalTokenList(next).slice(
        0,
        MAX_TOKENS,
      );
      setDraftTokens(normalized);
      if (debounceRef.current) clearTimeout(debounceRef.current);
      setIsDebouncing(true);
      debounceRef.current = setTimeout(() => {
        onTokensChange(normalized);
        setIsDebouncing(false);
      }, DEBOUNCE_MS);
    },
    [onTokensChange],
  );

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  const commitInput = useCallback(() => {
    const parts = splitInputTokens(input);
    if (parts.length === 0) return;
    const merged = normalizeHiringSignalTokenList([...draftTokens, ...parts]).slice(
      0,
      MAX_TOKENS,
    );
    setInput("");
    scheduleEmit(merged);
  }, [draftTokens, input, scheduleEmit]);

  const removeToken = useCallback(
    (value: string) => {
      scheduleEmit(draftTokens.filter((t) => t !== value));
    },
    [draftTokens, scheduleEmit],
  );

  const clearAll = useCallback(() => {
    setInput("");
    if (debounceRef.current) clearTimeout(debounceRef.current);
    setIsDebouncing(false);
    setDraftTokens([]);
    onTokensChange([]);
  }, [onTokensChange]);

  const showClear =
    !disabled && (draftTokens.length > 0 || input.trim().length > 0);
  const showLoader = !disabled && isDebouncing;
  const atTokenLimit = draftTokens.length >= MAX_TOKENS;

  return (
    <div
      className={cn("c360-hs-global-search", className)}
      role="search"
      aria-label="Search jobs by title, company, or location"
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
              aria-label="Applying search"
            />
          ) : (
            <Search size={16} strokeWidth={2} />
          )}
        </div>

        <div className="c360-hs-global-search__body">
          {draftTokens.map((token) => (
            <span
              key={token}
              className="c360-hs-filter-chip c360-hs-global-search__chip"
            >
              <span className="c360-hs-filter-chip__text">{token}</span>
              <button
                type="button"
                className="c360-hs-filter-chip__remove"
                aria-label={`Remove search term ${token}`}
                disabled={disabled}
                onClick={() => removeToken(token)}
              >
                <X size={12} />
              </button>
            </span>
          ))}
          <input
            id={inputId}
            type="search"
            className="c360-hs-global-search__input"
            value={input}
            disabled={disabled || atTokenLimit}
            placeholder={
              draftTokens.length > 0
                ? "Add term…"
                : "Search title, company, location…"
            }
            aria-label="Add search term"
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                commitInput();
              } else if (
                e.key === "Backspace" &&
                input === "" &&
                draftTokens.length > 0
              ) {
                const last = draftTokens[draftTokens.length - 1];
                if (last) removeToken(last);
              }
            }}
            onBlur={() => {
              if (input.trim()) commitInput();
            }}
          />
        </div>

        {showClear ? (
          <button
            type="button"
            className="c360-hs-global-search__affix c360-hs-global-search__affix--end"
            aria-label="Clear search"
            onClick={clearAll}
          >
            <X size={16} strokeWidth={2} aria-hidden />
          </button>
        ) : null}
      </div>
    </div>
  );
}
