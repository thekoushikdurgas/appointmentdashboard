"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { createPortal } from "react-dom";
import { useOverlayLayer } from "@/hooks/useOverlayLayer";
import { useRouter } from "next/navigation";
import { Search, X } from "lucide-react";
import { NAV_SEARCH_INDEX, ROUTES } from "@/lib/constants";
import type { FlatNavEntry } from "@/lib/navConfig";
import {
  JOBS_DRAWER_NAV_HREF,
  useJobsDrawer,
} from "@/context/JobsDrawerContext";
import {
  NOTIFICATIONS_DRAWER_NAV_HREF,
  useNotificationsDrawer,
} from "@/context/NotificationsDrawerContext";
import {
  FILES_DRAWER_NAV_HREF,
  useFilesDrawer,
} from "@/context/FilesDrawerContext";
import {
  REVIEW_DRAWER_NAV_HREF,
  useReviewDrawer,
} from "@/context/ReviewDrawerContext";

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
  const { openJobsDrawer } = useJobsDrawer();
  const { openNotificationsDrawer } = useNotificationsDrawer();
  const { openFilesDrawer } = useFilesDrawer();
  const { openReviewDrawer } = useReviewDrawer();
  const navIndex = useMemo((): FlatNavEntry[] => {
    const extra: FlatNavEntry[] = [
      { label: "Jobs", href: JOBS_DRAWER_NAV_HREF, section: "Tools" },
      {
        label: "Notifications",
        href: NOTIFICATIONS_DRAWER_NAV_HREF,
        section: "Account",
      },
      { label: "Files", href: FILES_DRAWER_NAV_HREF, section: "Tools" },
      { label: "Job tickets", href: REVIEW_DRAWER_NAV_HREF, section: "Tools" },
      { label: "Billing", href: ROUTES.BILLING, section: "Account" },
      { label: "Profile", href: ROUTES.PROFILE, section: "Account" },
      { label: "Settings", href: ROUTES.SETTINGS, section: "Account" },
    ];
    return [...NAV_SEARCH_INDEX, ...extra];
  }, []);

  const results = query.trim()
    ? navIndex.filter((r) =>
        r.label.toLowerCase().includes(query.toLowerCase()),
      )
    : navIndex.slice(0, 8);

  const navigate = useCallback(
    (href: string) => {
      if (href === JOBS_DRAWER_NAV_HREF) {
        openJobsDrawer();
        onClose();
        setQuery("");
        return;
      }
      if (href === NOTIFICATIONS_DRAWER_NAV_HREF) {
        openNotificationsDrawer();
        onClose();
        setQuery("");
        return;
      }
      if (href === FILES_DRAWER_NAV_HREF) {
        openFilesDrawer();
        onClose();
        setQuery("");
        return;
      }
      if (href === REVIEW_DRAWER_NAV_HREF) {
        openReviewDrawer();
        onClose();
        setQuery("");
        return;
      }
      router.push(href);
      onClose();
      setQuery("");
    },
    [
      router,
      onClose,
      openJobsDrawer,
      openNotificationsDrawer,
      openFilesDrawer,
      openReviewDrawer,
    ],
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
