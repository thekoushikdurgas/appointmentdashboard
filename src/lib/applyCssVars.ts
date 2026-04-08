export type CSSVarMap = Record<string, string | number | undefined | null>;

/** Set or remove CSS custom properties on a DOM node (for callback refs / map loops). */
export function applyVars(el: HTMLElement | null, vars: CSSVarMap): void {
  if (!el) return;
  for (const [k, v] of Object.entries(vars)) {
    if (v != null && v !== "") {
      el.style.setProperty(k, String(v));
    } else {
      el.style.removeProperty(k);
    }
  }
}
