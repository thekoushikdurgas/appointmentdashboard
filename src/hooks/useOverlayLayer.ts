"use client";

import { useEffect, useRef, type RefObject } from "react";

const FOCUSABLE =
  'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';

export interface UseOverlayLayerOptions {
  /** Escape key handler; defaults to `onClose` */
  onEscape?: () => void;
  /** Prefer focusing this element when the layer opens */
  initialFocusRef?: RefObject<HTMLElement | null>;
  /** Delay before initial focus (e.g. command palette input) */
  focusDelayMs?: number;
}

/**
 * Body scroll lock, Escape, focus restore, and Tab cycle within `containerRef`.
 * Use on the dialog panel element, not the full-screen scrim.
 */
export function useOverlayLayer(
  isOpen: boolean,
  onClose: () => void,
  containerRef: RefObject<HTMLElement | null>,
  options?: UseOverlayLayerOptions,
) {
  const previouslyFocused = useRef<HTMLElement | null>(null);
  const { onEscape, initialFocusRef, focusDelayMs = 0 } = options ?? {};

  useEffect(() => {
    if (!isOpen) return;

    previouslyFocused.current = document.activeElement as HTMLElement;

    const escapeHandler = onEscape ?? onClose;

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        escapeHandler();
        return;
      }
      if (e.key !== "Tab") return;

      const el = containerRef.current;
      if (!el) return;
      const focusable = Array.from(el.querySelectorAll<HTMLElement>(FOCUSABLE));
      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else if (document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handleKey);
    document.body.style.overflow = "hidden";

    const runFocus = () => {
      const el = containerRef.current;
      if (!el) return;
      const fromRef = initialFocusRef?.current;
      if (fromRef) {
        fromRef.focus();
        return;
      }
      const first = el.querySelector<HTMLElement>(FOCUSABLE);
      if (first) first.focus();
      else el.focus();
    };

    let timeoutId = 0;
    let rafId = 0;
    if (focusDelayMs > 0) {
      timeoutId = window.setTimeout(() => {
        rafId = requestAnimationFrame(runFocus);
      }, focusDelayMs);
    } else {
      rafId = requestAnimationFrame(runFocus);
    }

    return () => {
      document.removeEventListener("keydown", handleKey);
      document.body.style.overflow = "";
      if (timeoutId) clearTimeout(timeoutId);
      if (rafId) cancelAnimationFrame(rafId);
      previouslyFocused.current?.focus();
    };
  }, [isOpen, onClose, onEscape, focusDelayMs, containerRef, initialFocusRef]);
}
