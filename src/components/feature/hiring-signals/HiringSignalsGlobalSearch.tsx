"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Search, X } from "lucide-react";
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

export function HiringSignalsGlobalSearch({
  tokens,
  onTokensChange,
  disabled = false,
  className,
}: HiringSignalsGlobalSearchProps) {
  const [input, setInput] = useState("");
  const [draftTokens, setDraftTokens] = useState(() =>
    normalizeHiringSignalTokenList(tokens),
  );
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
      debounceRef.current = setTimeout(() => {
        onTokensChange(normalized);
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
    setDraftTokens([]);
    onTokensChange([]);
  }, [onTokensChange]);

  return (
    <div
      className={cn("c360-hs-global-search", className)}
      role="search"
      aria-label="Search jobs by title, company, or location"
    >
      <Search className="c360-hs-global-search__icon" size={14} aria-hidden />
      <div className="c360-hs-global-search__field">
        {draftTokens.map((token) => (
          <span key={token} className="c360-hs-filter-chip c360-hs-global-search__chip">
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
          type="search"
          className="c360-hs-global-search__input"
          value={input}
          disabled={disabled || draftTokens.length >= MAX_TOKENS}
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
      {draftTokens.length > 0 ? (
        <button
          type="button"
          className="c360-hs-global-search__clear"
          aria-label="Clear all search terms"
          disabled={disabled}
          onClick={clearAll}
        >
          <X size={14} aria-hidden />
        </button>
      ) : null}
    </div>
  );
}
