"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { createPortal } from "react-dom";
import { useOverlayLayer } from "@/hooks/useOverlayLayer";
import { useRouter } from "next/navigation";
import { Search, X } from "lucide-react";
import {
  NAV_SEARCH_INDEX,
  flatNavEntriesForAccessiblePages,
} from "@/lib/constants";
import { useAuth } from "@/context/AuthContext";
import { useRole } from "@/context/RoleContext";

interface NavCommandPaletteProps {
  open: boolean;
  onClose: () => void;
}

export function NavCommandPalette({ open, onClose }: NavCommandPaletteProps) {
  const [query, setQuery] = useState("");
  const [mounted, setMounted] = useState(false);
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const paletteRef = useRef<HTMLDivElement>(null);
  const { isSuperAdmin } = useRole();
  const { accessiblePages } = useAuth();

  const navIndex = useMemo(() => {
    const base = isSuperAdmin
      ? NAV_SEARCH_INDEX
      : NAV_SEARCH_INDEX.filter((r) => !r.href.startsWith("/admin"));
    const mine = flatNavEntriesForAccessiblePages(accessiblePages);
    return [...mine, ...base];
  }, [isSuperAdmin, accessiblePages]);

  const results = query.trim()
    ? navIndex.filter((r) =>
        r.label.toLowerCase().includes(query.toLowerCase()),
      )
    : navIndex.slice(0, 8);

  const navigate = useCallback(
    (href: string) => {
      router.push(href);
      onClose();
      setQuery("");
    },
    [router, onClose],
  );

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    setQuery("");
  }, [open]);

  useOverlayLayer(open && mounted, onClose, paletteRef, {
    initialFocusRef: inputRef,
    focusDelayMs: 50,
  });

  if (!open || !mounted) return null;

  return createPortal(
    <>
      <div
        className="c360-cmd-palette-overlay"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        ref={paletteRef}
        className="c360-cmd-palette"
        role="dialog"
        aria-modal="true"
        aria-label="Search navigation"
        tabIndex={-1}
      >
        <div className="c360-cmd-palette__header">
          <Search size={16} className="c360-cmd-palette__icon" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search here…"
            aria-label="Search navigation"
            className="c360-cmd-palette__input"
            onKeyDown={(e) => {
              if (e.key === "Enter" && results.length > 0) {
                navigate(results[0].href);
              }
            }}
          />
          <button
            type="button"
            onClick={onClose}
            className="c360-cmd-palette__close"
            aria-label="Close search"
          >
            <X size={16} />
          </button>
        </div>

        <div
          className="c360-cmd-palette__list"
          role="listbox"
          aria-label="Search results"
        >
          {results.length === 0 ? (
            <div className="c360-cmd-palette__empty">No pages found</div>
          ) : (
            results.map((r) => (
              <button
                key={r.href + r.label}
                type="button"
                role="option"
                aria-selected="false"
                className="c360-cmd-palette__item"
                onClick={() => navigate(r.href)}
              >
                {r.section && (
                  <span className="c360-cmd-palette__item-section">
                    {r.section}
                  </span>
                )}
                <span className="c360-cmd-palette__item-label">{r.label}</span>
              </button>
            ))
          )}
        </div>
      </div>
    </>,
    document.body,
  );
}
