# CSS and design system (Contact360 app)

This doc expands the [README Styling / CSS](../README.md#styling--css-custom-design-system) section: how to work with the custom `c360-*` layers, read `css:inventory` output, and split large partials.

## Layering

1. **`app/globals.css`** — App entry: `@import` order is **core → layout → components (barrel) → utilities → vendor → responsive**.
2. **`app/css/core.css`** — Tokens (`--c360-*`), typography, base resets.
3. **`app/css/components.css`** — Barrel only; each line imports `./components/NN-*.css`.
4. **`app/css/utilities.css`** — Small reusable utility classes.
5. **Feature / page CSS** — Prefer the smallest existing `NN-*.css` file; add a new numbered file if the surface is large or unrelated.

## Naming

- Use **`c360-<area>-<element>`** (and BEM-style modifiers `--variant`) to match existing patterns.
- Reuse tokens from `core.css` instead of hard-coded colors in new rules.

## Avoiding React `style={{ }}` for `--c360-*` and portals

- **`useCSSVars(vars)`** ([`src/hooks/useCSSVars.ts`](../src/hooks/useCSSVars.ts)) — returns a ref; applies `vars` with `useLayoutEffect` + `element.style.setProperty` before paint. Use on a single wrapper when values come from props/state.
- **`applyVars(el, vars)`** ([`src/lib/applyCssVars.ts`](../src/lib/applyCssVars.ts)) — same `setProperty` / `removeProperty` logic for **callback refs** inside `.map()` or when a hook is awkward.
- **Portals (popover, tooltip):** attach a ref to the portaled root and call `applyVars` from **`useLayoutEffect`** when `top` / `left` / `--c360-*` change (no React `style` prop).

## When `style={{ }}` is still OK

- **Third-party APIs:** e.g. `react-simple-maps` `<Geography style={…}>` — the library expects an inline style object; keep that as the **only** remaining `style={{` site in `src/` if possible.

Avoid large inline objects for static visuals—move to a class.

## `npm run css:inventory`

Writes **`reports/css-inventory.txt`** and prints a summary. Use it to:

| Section    | Meaning                                                                                                                            |
| ---------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| **1–2**    | Whether Tailwind/PostCSS packages or configs appeared (this project should stay custom-only unless you intentionally add tooling). |
| **3**      | **`@import` graph** from `globals.css` — verify new partials are reachable.                                                        |
| **4**      | Size and approximate `.c360` rule counts per `.css` file — spot outsized files.                                                    |
| **5**      | Barrel order of numbered partials.                                                                                                 |
| **6–7**    | External stylesheets / Tailwind class signals in TSX.                                                                              |
| **8 / 8b** | Files using `style={{` — prioritize files with many hits or blocks **without** `--c360-` hints (often good refactor candidates).   |
| **9**      | Suggested workflow (same as below).                                                                                                |

CI uploads this report as an artifact (see `.github/workflows/app-ci.yml`).

## Splitting oversized partials

1. Choose a **cohesive block** (one feature or page family), ideally already marked by a comment banner.
2. Create **`app/css/components/NN-<topic>.css`** (next free `NN` or insert logically next to related partials).
3. Move rules into the new file; keep **one concern per file** where possible.
4. Add **`@import "./components/NN-<topic>.css";`** to **`app/css/components.css`** (order usually matches load priority; group with related imports).
5. Re-run **`npm run css:inventory`** and a quick UI smoke test for affected pages.

Example precedent: maps/widgets live in **`18-app-dynamic-maps-widgets.css`**; contacts/sequences were split into **`19-contacts-and-sequences.css`**.

## Best-practices checker (Styling / CSS)

[`scripts/check-best-practices.mjs`](../scripts/check-best-practices.mjs) includes points **41–45** (globals chain, components barrel, no Tailwind config at app root, core tokens, soft cap on `src/` files containing `style={{`). Tune **`max_inline_style_files`** in [`.next-checker-config.json`](../.next-checker-config.json) if the cap is too tight for a spike.

## Tailwind / PostCSS

The product stance is **custom CSS first**. Adding Tailwind would duplicate tokens and imply a long migration. If you evaluate Tailwind or PostCSS-only later, document the scope (new surfaces only vs. full app) and update this file plus the Styling checks in `check-best-practices.mjs` if the policy changes.
