"use client";

import { Search, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  size?: "sm" | "md";
}

export function SearchBar({
  value,
  onChange,
  placeholder = "Search...",
  className,
  size = "md",
}: SearchBarProps) {
  return (
    <div className={cn("c360-search", className)}>
      <Search
        className="c360-search__icon"
        size={size === "sm" ? 14 : 16}
        aria-hidden
      />
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={cn(
          "c360-input c360-search__input c360-min-w-220",
          size === "sm" && "c360-input--sm",
        )}
        aria-label={placeholder}
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange("")}
          className="c360-search__clear"
          aria-label="Clear search"
        >
          <X size={14} />
        </button>
      )}
    </div>
  );
}
