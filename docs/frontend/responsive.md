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

## Filter sidebars (`DataPageLayout`)

Entity list filters (contacts, companies, hiring signals, activities, demands, market insights) are always rendered inline via `DataPageLayout`:

- **Desktop (≥1024px):** ~300px sticky left column beside the main content. The filter header includes a **pin** control only: pinned keeps the full panel open; unpinned collapses to a **~49px (3.05rem) icon rail** (filter icon, active-count badge, pin, and icon-only actions such as refresh). **Hover peek** on the collapsed rail temporarily expands the full panel when unpinned (mirrors [mydesigns sidebar](../../docs/frontend/ideas/mydesigns/done/sidebar.md)); leaving the column collapses it again. Peek state is not persisted. Filter sections and header labels slide left (`x: -20`) and fade with staggered reveals via framer-motion (`filterSidebarMotion`, `FilterSidebarHeader`, `DataPageLayout`, `FilterSidebarBody`). `prefers-reduced-motion` falls back to CSS grid transitions. Pin/expanded preference is stored per page in `localStorage` (`STORAGE_KEYS.DATA_FILTERS_PEEK_PINNED_*`).
- **Below 1024px:** filters stack full width above the table; the filter list scrolls with the page (no mobile drawer or toolbar **Filters** button). Pin/collapse controls are hidden and the panel stays expanded.

Filter `Select` and `FilterCombobox` controls use document-flow inline menus inside the sidebar (no Radix portal poppers).

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
