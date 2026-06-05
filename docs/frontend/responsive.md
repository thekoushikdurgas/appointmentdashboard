# Responsive design system

Contact360 uses custom `c360-*` CSS (no Tailwind). Breakpoints are shared between CSS `@media` rules and the React hooks in `src/hooks/common/useBreakpoint.ts`.

## Breakpoint table

| Token | Width  | Hook             | Typical layout                      |
| ----- | ------ | ---------------- | ----------------------------------- |
| xs    | 480px  | —                | Small phones                        |
| sm    | 640px  | —                | Tab lists scroll horizontally       |
| md    | 768px  | —                | Tablet; `c360-md-*` utilities apply |
| lg    | 1024px | `useIsDesktop()` | Desktop sidebar; inline filters     |
| xl    | 1280px | —                | Wide content areas                  |
| 2xl   | 1536px | `useIsWide()`    | `--c360-content-max-width: 1400px`  |

CSS custom properties (documentation / JS bridge only):

```css
--c360-bp-xs: 480px;
--c360-bp-sm: 640px;
--c360-bp-md: 768px;
--c360-bp-lg: 1024px;
--c360-bp-xl: 1280px;
--c360-bp-2xl: 1536px;
```

## JS hooks

```ts
import {
  useIsMobile, // max-width 767px
  useIsTablet, // 768px–1023px
  useIsDesktop, // min-width 1024px
  useIsWide, // min-width 1536px
  useMediaQuery,
} from "@/hooks/common/useBreakpoint";
```

## Shell behavior

| Viewport   | Sidebar                  | Main content                   | Bottom dock                  |
| ---------- | ------------------------ | ------------------------------ | ---------------------------- |
| ≥1024px    | Fixed rail / collapsible | `margin-left` follows sidebar  | Hidden                       |
| 768–1023px | Off-canvas drawer        | Full width                     | Hidden                       |
| ≤767px     | Off-canvas drawer        | Full width + safe-area padding | Visible (`MobileBottomDock`) |

Mobile pages use extra bottom padding on `.c360-page` so content is not covered by the dock (80px + safe-area inset).

## Filter drawer (`DataPageLayout`)

On viewports below 1024px, entity list filters (contacts, companies, hiring signals) collapse into a drawer. `useIsDesktop()` gates inline vs drawer filter UI in page clients.

## Table strategy

Dense lists use MUI `DataGrid` behind a single dynamic import (`src/components/ui/C360DataGrid.tsx`). Tables live inside `C360DataTableShell`, which provides horizontal scroll on narrow viewports rather than squashing columns.

## Responsive utilities

Defined in `app/css/responsive.css`:

- `c360-md-flex-row`, `c360-md-items-end`, `c360-md-grid-cols-2`, `c360-md-min-w-44` (≥768px)
- `c360-lg-grid-cols-3` (≥1024px)

Prefer these over ad-hoc `md:` / `lg:` pseudo-prefix class names (which have no CSS generator in this project).

## Tab overflow

On screens ≤640px, `.c360-tabs__list` scrolls horizontally so multi-tab routes (`/email`, `/billing`, etc.) remain reachable without wrapping off-screen.

## E2E viewport projects

`playwright.config.ts` defines:

- `mobile-chrome` — Pixel 5
- `ipad` — iPad Pro 11
- `desktop` — 1440×900
- `wide` — 2560×1440

Run responsive smoke across viewports:

```bash
npm run test:e2e:responsive
```

## Related docs

- [app-performance-data-tables.md](./app-performance-data-tables.md) — `C360DataGrid` lazy loading
- [bundle-report.md](./bundle-report.md) — bundle size after Phases 1–3
