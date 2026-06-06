"use client";

import { useLayoutEffect, type RefObject } from "react";

/**
 * Pins an element's height from its viewport top edge to the bottom of the window.
 * Used where flex + percentage height is unreliable (e.g. MUI DataGrid).
 */
export function useViewportFillHeight(
  ref: RefObject<HTMLElement | null>,
  enabled = true,
): void {
  useLayoutEffect(() => {
    const node = ref.current;
    if (!enabled || !node || typeof window === "undefined") return;

    const measure = () => {
      const top = node.getBoundingClientRect().top;
      const height = Math.max(240, Math.ceil(window.innerHeight - top));
      node.style.setProperty("--c360-viewport-fill-h", `${height}px`);
      node.style.height = `${height}px`;
      node.style.minHeight = `${height}px`;
    };

    measure();

    const ro = new ResizeObserver(measure);
    ro.observe(document.documentElement);
    const content = node.closest(".c360-data-layout__content");
    if (content instanceof HTMLElement) ro.observe(content);
    const toolbar = content?.querySelector(".c360-data-layout__toolbar");
    if (toolbar instanceof HTMLElement) ro.observe(toolbar);

    window.addEventListener("resize", measure);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [enabled, ref]);
}
