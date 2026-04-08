"use client";

import { useLayoutEffect, useRef, type RefObject } from "react";
import { applyVars, type CSSVarMap } from "@/lib/applyCssVars";

export type { CSSVarMap };
export { applyVars };

/**
 * Returns a ref; synchronously applies `vars` as CSS custom properties on the
 * mounted element before paint. Re-runs when `vars` identity or contents change.
 */
export function useCSSVars<T extends HTMLElement = HTMLElement>(
  vars: CSSVarMap,
): RefObject<T> {
  const ref = useRef<T | null>(null);
  useLayoutEffect(() => {
    applyVars(ref.current, vars);
  }, [vars]);
  return ref as RefObject<T>;
}
