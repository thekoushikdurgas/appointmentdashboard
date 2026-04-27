# Dashboard UI kit → Contact360 app — task tracker

**Single mapping doc (spine):** ties the HTML reference kit (`docs/frontend/ideas/Dashboard ui kit`) to `contact360.io/app` implementation, API parity notes, and phased backlog. **Per-module deep dives** are indexed at [`docs/ui-kit/extended-module-notes.md`](ui-kit/extended-module-notes.md) with content in [`docs/ui-kit/modules/`](ui-kit/modules/). Below: **status**, **conventions**, **§4/§4a task lists** — use `##` headings or the table in the next subsection.

### How this file is organized (read this first)

| Layer                      | Location                                                                                                              | Purpose                                                                                                                                                                                                                                                                                                                             |
| -------------------------- | --------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Spine**                  | §§1–7 below (this file)                                                                                               | Kit index, conventions, API parity checklist, phased UI tasks (§4), P0–P4 queue (§4a), related docs, decisions — **start here** for roadmap work.                                                                                                                                                                                   |
| **Deep module narratives** | [`docs/ui-kit/extended-module-notes.md`](ui-kit/extended-module-notes.md) → [`docs/ui-kit/modules/`](ui-kit/modules/) | Long-form API ↔ app notes (auth, users, contacts, billing, profile, …). Use **§4a** here for priorities; open the matching **`modules/*.md`** file for one domain.                                                                                                                                                                  |
| **Canonical parity table** | `docs/GRAPHQL_PARITY.md`                                                                                              | Gateway module ↔ service ↔ route matrix; update when wiring changes.                                                                                                                                                                                                                                                                |
| **Generated types**        | `src/graphql/generated/types.ts`                                                                                      | Run `npm run codegen` with API up; app code should prefer **`Gql*`** names from codegen + any documented manual aliases. Root **`Query` / `Mutation`** fields map to nested `*Query` / `*Mutation` types — see [`docs/ui-kit/modules/00-overview.md`](ui-kit/modules/00-overview.md#codegen-module-map-srcgraphqlgeneratedtypests). |
| **Index of UI docs**       | [`docs/ui-kit/README.md`](ui-kit/README.md)                                                                           | Short map of spine vs extended notes + **checkbox legend** (GraphQL vs UI).                                                                                                                                                                                                                                                         |

**Maintenance rule:** Do not paste full `tsc` / `eslint` logs into this file — they go stale in days. Record outcomes in checkboxes and link commands in `codebase_state.bat` / CI instead.

## Full App Parity Plan — Implementation Summary (April 2026)

| Phase | Task                                                                                                                                     | Status |
| ----- | ---------------------------------------------------------------------------------------------------------------------------------------- | ------ |
| P1    | `Gql*` type aliases + `typesPrefix` in codegen.ts                                                                                        | ✅     |
| P1    | Fix `uploadAvatar` filePath mismatch                                                                                                     | ✅     |
| P1    | Fix contacts VQL `logicalOperator` → `allOf/anyOf`                                                                                       | ✅     |
| P2a   | `contacts/page.tsx` → ContactFilterBar, ContactRow, ContactDetailPanel, ContactCreateModal, ContactPagination                            | ✅     |
| P2b   | `dashboard/page.tsx` → DashboardAdCarousel, DashboardStatRow, DashboardActivityFeed, DashboardChartSection                               | ✅     |
| P2c   | `billing/page.tsx` → BillingPlanCards, BillingCheckoutWizard, BillingInvoiceList, BillingCreditSummary                                   | ✅     |
| P2d   | `activities/page.tsx` → ActivityFeedTab, ActivityCalendarTab, ActivityAnalyticsTab + JobStatsTab                                         | ✅     |
| P2e   | Admin console **removed** from app — Django `admin_ops` + `NEXT_PUBLIC_ADMIN_URL`                                                        | ✅     |
| P2f   | `companies/[id]/page.tsx` → CompanyHeader, CompanyContactsTable, CompanyFindEmailsPanel                                                  | ✅     |
| P2g   | `email/page.tsx` → EmailFinderSingleTab, EmailBulkFinderTab, EmailBulkVerifierTab, EmailVerifierTab, EmailWebSearchTab, EmailPatternsTab | ✅     |
| P2h   | _(retired)_ app `/status` — use **Django admin** system status                                                                           | ✅     |
| P2i   | `SavedSearchesMenu` on **`/contacts`** & **`/companies`** (versioned VQL payload)                                                        | ✅     |
| P2j   | `profile/page.tsx` → ProfileInfoTab, ProfileSecurityTab, ProfileApiKeysTab, ProfileSessionsTab, ProfileTeamTab                           | ✅     |
| QA    | `tsc --noEmit` — 0 errors                                                                                                                | ✅     |

Static kit: `docs/frontend/ideas/Dashboard ui kit`. Use **layout/patterns**, not Bootstrap/jQuery drop-ins.

| Kit idea              | App implementation                                       |
| --------------------- | -------------------------------------------------------- |
| Page title + subtitle | `c360-page-header`, `DashboardPageLayout` / `PageHeader` |
| KPI / stat row        | `c360-stat-card`, `StatCard`                             |
| Cards                 | `c360-card`, `Card`                                      |
| Tables                | `c360-table`, `Table`                                    |
| Badges                | `Badge`                                                  |
| Progress              | `c360-progress`, `Progress`                              |
| Forms / inputs        | `Input`, `Button`, `Select`                              |
| Auth shells           | `(auth)/login`, `(auth)/register` + design tokens        |

### Styling architecture (current)

- **No Tailwind** in this app. Global styles: `app/globals.css` imports `app/css/core.css`, `layout.css`, `components.css`, `utilities.css`, `responsive.css`, and **`vendor.css`** (SweetAlert2, Tiptap, FullCalendar token hooks).
- **Naming:** BEM-style **`c360-*`** classes; prefer **classes + `--c360-*` tokens** over inline `style` except where values are truly dynamic (charts, drag handles, some editor geometry).
- **Fonts:** `next/font` (Poppins / Nunito) in `app/layout.tsx` — build-time, not a runtime CDN stylesheet.
- **Next.js App Router:** Do not put **`onClick` on `next/link`** inside **Server Components** (breaks static generation). Use a small **client** control (e.g. `ErrorPageGoBack`) for “Go back” on `not-found` / dedicated error routes.

### Routing / auth (current)

- **`middleware.ts`:** `GET /` → **`/login`** immediately (fast redirect; avoids slow first compile showing as 404 in dev on slow disks).
- **Tokens:** Stored in **localStorage** via `tokenManager` — the server cannot see them. **`app/page.tsx`** always `redirect("/login")` as a fallback; **`useAuthRedirect`** on `/login` sends authenticated users to **`/dashboard`**.

Design tokens: **`--c360-*`** in `app/css/core.css` (and related `app/css/*`). Prefer tokens over raw kit hex values.

pages :

app-calender.html
app-profile.html
chart-chartist.html
chart-chartjs.html
chart-flot.html
chart-morris.html
chart-peity.html
chart-sparkline.html
ecom-checkout.html
ecom-customers.html
ecom-invoice.html
ecom-product-detail.html
ecom-product-grid.html
ecom-product-list.html
ecom-product-order.html
email-compose.html
email-inbox.html
email-read.html
form-editor-summernote.html
form-element.html
form-pickers.html
form-validation-jquery.html
form-wizard.html
index.html (main dashboard)
map-jqvmap.html
page-analytics.html
page-error-400.html
page-error-403.html
page-error-404.html
page-error-500.html
page-error-503.html
page-forgot-password.html
page-general-customers.html
page-lock-screen.html
page-login.html
page-order-list.html
page-order.html
page-register.html
page-review.html
table-bootstrap-basic.html
table-datatable-basic.html
uc-nestable.html
uc-noui-slider.html
uc-select2.html
uc-sweetalert.html
uc-toastr.html
ui-accordion.html
ui-alert.html
ui-badge.html
ui-button-group.html
ui-button.html
ui-card.html
ui-carousel.html
ui-dropdown.html
ui-grid.html
ui-list-group.html
ui-media-object.html
ui-modal.html
ui-pagination.html
ui-popover.html
ui-progressbar.html
ui-tab.html
ui-typography.html
widget-basic.html

This document ties the **HTML reference kit** (`docs/frontend/ideas/Dashboard ui kit`, filenames listed below) to **concrete work** in `contact360.io/app` and, where noted, `contact360.io/api`. It supersedes the earlier unstructured bullet list.

---

## 1. HTML kit index (design reference)

Use these files only as **layout / pattern** references. Implement in React with `--c360-*` tokens and existing primitives under `src/components/ui/` and `src/components/shared/`.

| Area               | Reference HTML                                                                                                                                                                                                                      |
| ------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Shell / calendar   | `app-calender.html`                                                                                                                                                                                                                 |
| Profile            | `app-profile.html`                                                                                                                                                                                                                  |
| Charts             | `chart-chartist.html`, `chart-chartjs.html`, `chart-flot.html`, `chart-morris.html`, `chart-peity.html`, `chart-sparkline.html`                                                                                                     |
| Commerce / billing | `ecom-checkout.html`, `ecom-invoice.html`, `ecom-product-order.html`, `ecom-product-grid.html`, `ecom-product-list.html`, `ecom-product-detail.html`, …                                                                             |
| Email              | `email-compose.html`, `form-wizard.html`                                                                                                                                                                                            |
| Editor             | `form-editor-summernote.html`                                                                                                                                                                                                       |
| Maps               | `map-jqvmap.html` → prefer **`react-simple-maps`** (see §7)                                                                                                                                                                         |
| Analytics          | `page-analytics.html`                                                                                                                                                                                                               |
| Auth / errors      | `page-forgot-password.html`, `page-lock-screen.html`, `page-error-400.html` … `503`                                                                                                                                                 |
| Reviews            | `page-review.html`, `ui-media-object.html`                                                                                                                                                                                          |
| Tables / filters   | `table-datatable-basic.html`, `uc-select2.html`, `ui-button-group.html`, `ui-dropdown.html`                                                                                                                                         |
| Accordion / UI     | `ui-accordion.html`, `ui-alert.html`, `ui-badge.html`, `ui-button.html`, `ui-card.html`, `ui-carousel.html`, `ui-modal.html`, `ui-pagination.html`, `ui-progressbar.html`, `ui-tab.html`, `widget-basic.html`, `ui-popover.html`, … |

---

## 2. Cross-cutting engineering conventions (must follow)

These avoid repeat TypeScript / ESLint / runtime issues.

### 2.1 UI components

| Component                                   | Correct usage                                                                                                | Avoid                                                             |
| ------------------------------------------- | ------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------- |
| **`Alert`** (`src/components/ui/Alert.tsx`) | `variant`: `success` \| `warning` \| `danger` \| `info`; body in **`children`**; optional `title`, `onClose` | `type`, `message` props (do not exist)                            |
| **`Badge`**                                 | `color`, `dot`, `className`                                                                                  | `size` (not supported — use `className="c360-text-xs"` if needed) |
| **`Select`**                                | `onChange={(e) => ... e.target.value ...`                                                                    | Treating callback arg as string                                   |

### 2.2 GraphQL services barrel (`src/services/graphql/index.ts`)

- Export names must be unique. Example: use **`ContactsExportJobRef`** / **`CompaniesExportJobRef`** instead of duplicating `ExportJobRef` across modules.

### 2.3 React hooks

- **`useActivities`**: `useCallback` dependencies should include the full **`filter`** object (or a stable `useMemo`’d object at call sites) to satisfy `react-hooks/exhaustive-deps` without disabling the rule.

### 2.4 Dependencies (install)

- **`react-simple-maps@3`** declares peer `react` ^16–18; app may use **React 19**. Options: `npm install --legacy-peer-deps`, pin a fork/alternative, or implement a small SVG map without `react-simple-maps`. Track the choice in PR notes.

---

## 3. API ↔ app parity (backend contracts)

**Goal:** Every GraphQL module used by the app has matching **services**, **hooks**, **types**, and **pages**. The API **no longer** ships resolver **`DEMO_MODE`** / **`demo_data.py`** fallbacks — missing DB or upstream services surface **real errors** (aligns app expectations with production).

### 3.1 Done (baseline — verify in repo)

- [x] `src/types/api-modules.ts` + extended `graphql-gateway.ts` (contacts/companies).
- [x] Service gaps: billing, contacts, companies, email, jobs, notifications, profile, saved searches, resume, s3, sales navigator, users, ai chat, two-factor, admin; **`pagesService`**, **`uploadService`**.
- [x] Hooks: `useNotifications`, `useBilling`, `useProfile`, `useUsage`, `useResume`, `useSalesNavigator`, `useS3Files`, `useActivities`.
- [x] Pages wired: profile, billing, contacts, companies, jobs, email, ai-chat, admin, **activities** (incl. usage tab), **notifications**, **sales-navigator**, **resume** (`/resume`). _(Retired: standalone `/usage`, `/status`, `/analytics`, `/saved-searches` — see redirects + merges.)_
- [x] **API demo removal:** `demo_data.py` deleted; **`DEMO_MODE`** removed from settings; demo branches stripped from listed GraphQL query modules (see `GRAPHQL_PARITY.md` / API changelog in repo).

### 3.2 Remaining parity / QA tasks

- [ ] Run through each dashboard route with **real API** and fix field mismatches (camelCase vs schema) — see **Full module parity plan** (P0: saved searches, sales navigator, two-factor regenerate, profile team mutations, LinkedIn upsert, pages service field splits, health/codegen).
- [ ] Files page: end-to-end CSV upload (`uploadService` + `s3Service.completeCsvUpload`) QA.
- [x] `companies/[id]`: **partial** — detail uses `companiesService.get(id)` for deep links; “find emails” still verify against live schema.

---

## 4. Full UI kit implementation — phased tasks

Work is grouped to match the **Full UI Kit Implementation Plan** (auth/errors, activities/dashboard, contacts, billing, companies, campaigns/jobs/email, shared components, onboarding).

### Phase 1 — Auth & error pages

- [ ] `app/(auth)/forgot-password/page.tsx` — wire **`authService.requestPasswordReset`** (or gateway mutation) when exposed; today uses a **placeholder** delay + success UI.
- [ ] `app/(auth)/lock-screen/page.tsx` — real **password re-verify** when API supports it; today **documented placeholder** (logout + login for strict re-auth). Optional: **`AuthContext.isSuspicious`** wiring.
- [x] `app/400`, `403`, `404`, `500`, `503`, `app/error.tsx`, `app/not-found.tsx` — shared **`c360-error-page*`** styling; **no `Link`+`onClick` on server components** (`ErrorPageGoBack` client button).
- [x] `login`: link to **`/forgot-password`**.

**Refs:** `page-forgot-password.html`, `page-lock-screen.html`, `page-error-*.html`.

### Phase 2 — Activities + dashboard

- [x] **Activities:** FullCalendar tab + `CalendarView` — _(partial)_ — events from `activitiesService` / `useActivities`; calendar status uses `success`; analytics grouping uses real enums.
- [ ] **Activities:** Analytics strip (Recharts) inspired by `page-analytics.html`; CSV bar chart; **live job stats** (poll `jobsService`).
- [x] **Dashboard:** `AreaChart` — _(partial)_ — real `analyticsService` series (removed random live mock). Still open: `Carousel`, richer sparkline `StatCard`, `react-countup`, `WidgetGrid`.

**Refs:** `app-calender.html`, `page-analytics.html`, `chart-chartjs.html`, `chart-peity.html`, `chart-sparkline.html`, `chart-flot.html`, `widget-basic.html`, `ui-carousel.html`.

### Phase 3 — Contacts

- [x] `WorldMap` (`react-simple-maps`) — counts by country from VQL-scoped `contactGeoAnalytics` / `useCountryAggregates(exportVql)` (ISO alpha-2 → numeric mapping; see [CONTACTS_GEO_ANALYTICS.md](CONTACTS_GEO_ANALYTICS.md)).
- [ ] Accordion rows for contact detail (`ui-accordion.html` pattern).
- [ ] Filter bar: multi-select, button group, sort/export (`uc-select2`, `ui-button-group`, `ui-dropdown` patterns).

**Refs:** `map-jqvmap.html`, `page-order-list.html`, `ui-accordion.html`.

### Phase 4 — Billing

- [ ] Multi-step checkout (`ecom-checkout.html`) — `Progress` + steps.
- [ ] `InvoiceCard` print layout (`ecom-invoice.html`).
- [ ] Credit history table (`ecom-product-order.html`) — `usageService` / billing history APIs.

### Phase 5 — Companies

- [x] List page: **card / list** toggle (`ecom-product-grid.html` / `ecom-product-list.html`) -- implemented in `companies/page.tsx`.
- [ ] `[id]` page: real company data, “Find emails” via `emailService`.

**Refs:** `ecom-product-detail.html`.

### Phase 6 — Campaigns, jobs, email

- [ ] **Campaign templates:** Tiptap editor (`form-editor-summernote.html` pattern).
- [ ] **ReviewList / ReviewCard** — campaigns + jobs tabs (`page-review.html`, `ui-media-object.html`).
- [ ] **Email page:** bulk finder/verifier **wizard** (`form-wizard.html`) — `Progress` + steps.

### Phase 7 — Shared UI library + demo page

- [x] **Partial — class + token migration:** `Accordion`, `Alert`, `Badge`, `Button`, `ButtonGroup`, `Card`, `ConfirmModal`, `Input` / `Select` (affixes), `MediaObject`, `Modal`, `Popover`, `Progress` (base), `SweetAlert`, `Tooltip`, shared tab patterns (`c360-tabs*`), `TiptapEditor` + **`vendor.css`** — prefer **`c360-*`** over inline where static.
- [x] **Kit gaps / polish:** `Carousel`, `RangeSlider`, `DataTable`, `CountUpNumber` all exist; richer **`Pagination`** and chart-heavy widget polish remain.
- [x] `app/(dashboard)/ui-kit/page.tsx` — living showcase (continue extending as primitives grow).

### Phase 8 — Onboarding

- [ ] `OnboardingTour` — `Popover`, steps, `localStorage` completion (`ui-popover.html` hints).

---

## 4a. Consolidated smaller-task queues (cross-plan)

Use this as a **single execution spine** when the long module sections below feel overlapping. Details for each bullet live in **§3.2**, **Full module parity plan**, and backend docs `docs/backend/graphql.modules/*.md`.

| Priority | Focus                       | Smallest steps                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| -------- | --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **P0**   | Client ↔ schema correctness | Fix **`savedSearchesService`** (query name `getSavedSearch`, `UPDATE_USAGE` returns `Boolean`, filter type enum `contact`/`company`/`all`), **`salesNavigatorService`** (`saveSalesNavigatorProfiles`, response shape, snake_case profile payload), **`twoFactorService`** (`regenerateBackupCodes` — no `success` field), **`profileService`** (`updateTeamMemberRole` / `removeTeamMember` arg **`id`**, `revokeAllOtherSessions` → **boolean**), **`linkedinService`** upsert passes required metadata/contact fields. |
| **P1**   | Types                       | Run **`npm run codegen`** against live API; reconcile **`api-modules.ts`** / remove duplicate **`Gateway*`** where **`Gql*`** suffices; fix stale generated blocks (health, LinkedIn, sales navigator, 2FA, campaign satellite JSON).                                                                                                                                                                                                                                                                                     |
| **P2**   | Module verticals            | **Pages** service: split summary vs detail fields, `pageContent`, `pagesByType`; **campaign satellite**: `parseCampaigns` / templates / sequences; **status**: replace silent mock health with labeled real vs unavailable rows; **profile** Team tab: role **`Select`** + owner-only empty state.                                                                                                                                                                                                                        |
| **P3**   | UI kit backlog              | §4 Phases **2–6** remaining checkboxes; dashboard real charts vs mocks; billing wizard + invoice polish; contacts map + accordion.                                                                                                                                                                                                                                                                                                                                                                                        |
| **P4**   | Hygiene                     | Update **`GRAPHQL_PARITY.md`** after each module; **`react-hooks/exhaustive-deps`** on **`useActivities`** / **`useSalesNavigator`**; optional ESLint **`react/forbid-dom-props`** for `style` once folders are clean.                                                                                                                                                                                                                                                                                                    |

---

## 5. Smallest actionable slices (when a phase feels large)

1. **Install** approved dependencies (FullCalendar, Tiptap, CountUp, SweetAlert2, etc.) resolving React 19 peers as per §2.4.
2. **One reference HTML** → **one React component** → **wire one page section**.
3. **Run** `npm run lint`, `tsc --noEmit`, **`next build`** (and smoke-test the touched route). On Windows, if `npm` scripts fail (execution policy), run `node node_modules/typescript/bin/tsc --noEmit` and `node node_modules/next/dist/bin/next build`.
4. **Update this file**: check off completed checkboxes and bump the **last updated** footer.

---

## 6. Related docs

- `docs/codebases/app-codebase-analysis.md` — high-level app structure (if present in repo).
- Backend module docs: `docs/backend/graphql.modules/*.md`.
- Design tokens: `app/css/core.css`, `components.css` (`--c360-*`).

---

## 7. Open decisions log

| Topic             | Decision / note                                                                                                                                                                                        |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| World map library | `react-simple-maps` vs peer conflict with React 19 — resolve before large contact map work                                                                                                             |
| Demo / fake data  | **Removed from API:** no `DEMO_MODE` / `demo_data.py`. App should show **empty states** or **errors** from real API responses; status page should not pretend fake services are live without labeling. |
| NotificationCard  | Plan mentioned `src/components/shared/NotificationCard.tsx`; notifications page may inline card — extract if reused ≥2                                                                                 |
| Dev 404 noise     | First request to `/` or heavy routes after cold start can 404 on **slow disks** until compile finishes; **`middleware`** redirect on `/` mitigates; prefer fast local `.next` cache.                   |

---

## Extended module notes (moved)

Long-form narratives (**How the API is organized**, **How the app talks to the API**, modular vertical-slice table, and per-domain sections through the **profile** module **Next minimal PR**) are split across **`docs/ui-kit/modules/*.md`**, with a table of links in:

- **[`docs/ui-kit/extended-module-notes.md`](ui-kit/extended-module-notes.md)** (index)

Keep **this file** for the **spine**: kit index §1, conventions §2, parity §3, phased tasks **§4**, **§4a** queue, related docs §6, decisions §7. Edit the relevant **`modules/<domain>.md`** for deep module debugging — avoid duplicating roadmap tables in both places.

---

## Document maintenance

- After completing a phase in **§4** or a row in **§4a**, check boxes here and in **[`GRAPHQL_PARITY.md`](../GRAPHQL_PARITY.md)**.
- Keep **§3** in sync with API behavior (e.g. demo mode **off** permanently unless product reintroduces a flagged sandbox).
- Per-module narrative detail is under **[`ui-kit/modules/`](ui-kit/modules/)** (see the index in **`extended-module-notes.md`**); trim duplicate boilerplate when consolidating.

---

## Typecheck output (removed)

Stale terminal output from historical `npx tsc --noEmit` runs was removed from this file. **Do not paste full compiler logs into markdown.** Run locally:

```text
cd contact360.io/app
node node_modules/typescript/bin/tsc --noEmit
```

**Last doc maintenance:** 2026-04-05 — extended narratives: index at `docs/ui-kit/extended-module-notes.md`, body in `docs/ui-kit/modules/*.md`.
