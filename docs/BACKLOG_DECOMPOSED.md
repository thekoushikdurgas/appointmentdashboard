# Decomposed backlog — app + API (from ui-kit docs)

**Purpose:** Consolidate **unchecked** / **partial** / **planned** / **pending** items from [`UI_KIT_MAPPING.md`](UI_KIT_MAPPING.md), [`GRAPHQL_PARITY.md`](GRAPHQL_PARITY.md), [`ui-kit/extended-module-notes.md`](ui-kit/extended-module-notes.md), [`DISTILLED_ANALYSIS.md`](DISTILLED_ANALYSIS.md), and [`ui-kit/modules/*.md`](ui-kit/modules/). Use this file to plan work; **tick module files and the spine** when slices close.

**Legend:** **App** = `contact360.io/app` · **API** = `contact360.io/api` · **Docs** = markdown only · **Both** = coordinated change.

---

## How to “complete” tasks (process)

1. **Pick one row** from §2–§6 (or a micro-task under it).
2. **App:** implement in `src/services/graphql/`, hooks, `app/(dashboard)/` routes, components; run `npm run codegen` with API up when schema changes.
3. **API:** implement in `app/graphql/modules/<domain>/` (Strawberry), align `schema.py`, tests.
4. **Verify:** affected route manually; `tsc --noEmit`; update [`GRAPHQL_PARITY.md`](GRAPHQL_PARITY.md) and the relevant **`modules/<nn>-*.md`** checkbox.
5. **Do not** paste compiler logs into spine docs (per [`UI_KIT_MAPPING.md`](UI_KIT_MAPPING.md) maintenance rule).

---

## 1. Doc hygiene (stale vs code)

| Topic                          | Note                                                                                                                                                                                                                                                                                                                              |
| ------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **`modules/07-s3.md`**         | Many bullets (prefixed `s3File*`, `completeCsvUpload`) match **current** `s3Service.ts` + [`GRAPHQL_PARITY.md`](GRAPHQL_PARITY.md) “Phase 2026-04-06” rows. Treat open items as **UX/E2E** (progress bar, prefix tabs, detail drawer), not “rename fields from scratch.” Refresh `07-s3.md` checkboxes when you next touch Files. |
| **`modules/00-overview.md`**   | Aligned (2026-04-06) with **extended roll-up** for S3, AI chats, Resume — see git history if diffing.                                                                                                                                                                                                                             |
| **`modules/27-two-factor.md`** | Mixes **API implementation** (pyotp, rate limits) with **app** tasks; split mentally: backend tickets vs client E2E.                                                                                                                                                                                                              |

---

## 2. P0 — Client ↔ schema correctness (spine §4a)

_Smallest unit: one service + codegen + one screen._

| ID   | Owner    | Micro-tasks                                                                                                                                                                                                                 |
| ---- | -------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| P0.1 | **App**  | **`savedSearchesService` / `useSavedSearches`:** `getSavedSearch`, `updateSearchUsage` → `Boolean`, filter enum `contact` / `company` / `all`. Run `npm run codegen`; fix selections/variables; exercise `/saved-searches`. |
| P0.2 | **App**  | **`salesNavigatorService`:** align `saveSalesNavigatorProfiles` payload/response with generated types; remove wrong **`api-modules`** re-exports; test Save on `/sales-navigator`.                                          |
| P0.3 | **App**  | **`twoFactorService`:** `regenerateBackupCodes` response shape (no fake `success` field); Security tab flow.                                                                                                                |
| P0.4 | **App**  | **`profileService`:** `updateTeamMemberRole` / `removeTeamMember` use `id`; `revokeAllOtherSessions` boolean handling.                                                                                                      |
| P0.5 | **App**  | **`linkedinService`:** `upsertByLinkedInUrl` — minimal `contactData` from UI per schema; map GraphQL errors to copy.                                                                                                        |
| P0.6 | **Both** | **`pagesService`:** extend queries only if product needs `pageContent`, `pagesByType`, filters — **API** adds fields → **App** splits `PAGE_SUMMARY_FIELDS` / detail (see [`19-pages.md`](ui-kit/modules/19-pages.md)).     |

---

## 3. Cross-cutting QA & spine §3.2

| ID  | Owner   | Micro-tasks                                                                                                                                                                                                                   |
| --- | ------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Q1  | **App** | **Route smoke pass:** each `(dashboard)` route against **real API**; fix camelCase / null handling.                                                                                                                           |
| Q2  | **App** | **Files CSV E2E:** `initiateCsvUpload` → presigned PUT → `registerPart` / complete → list contains file → optional delete (`useS3Files` + `uploadService` per [`10-upload-handoff.md`](ui-kit/modules/10-upload-handoff.md)). |
| Q3  | **App** | **Types:** consolidate `Gateway*` vs `Gql*` in `api-modules.ts` where duplicate; one module per PR.                                                                                                                           |

---

## 4. Spine [`UI_KIT_MAPPING.md`](UI_KIT_MAPPING.md) §4 phases (UI kit)

| Phase                   | Owner         | Micro-tasks                                                                                                                                                                                                                                                                                                 |
| ----------------------- | ------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **1 Auth**              | **API + App** | **Forgot password:** add `AuthMutation` (e.g. `requestPasswordReset(email)`) + email path in API if product requires; **App** replace `setTimeout` in [`forgot-password/page.tsx`](<../app/(auth)/forgot-password/page.tsx>). _Verified:_ no `requestPasswordReset` in API grep today — **blocked on API**. |
| **1 Auth**              | **App**       | **Lock screen:** keep documented logout/login OR add API “re-verify password” if added later.                                                                                                                                                                                                               |
| **2 Activities**        | **App**       | Recharts analytics strip; CSV export chart; **poll `jobsService`** for live job stats on Activities tab.                                                                                                                                                                                                    |
| **2 Dashboard**         | **App**       | Carousel; CountUp/sparkline; widget grid — optional deps per §2.4.                                                                                                                                                                                                                                          |
| **3 Contacts**          | **App**       | Choose **map lib** (React 19 peer: `react-simple-maps` vs SVG); country aggregates API hook; accordion rows; filter bar multi-select + export.                                                                                                                                                              |
| **4 Billing**           | **Both**      | Multi-step checkout UI; invoice print CSS; credit history from `usageService` / billing — **API** must expose stable invoice/history fields.                                                                                                                                                                |
| **4 Billing**           | **Both**      | [`14-billing.md`](ui-kit/modules/14-billing.md): payment proof upload + `submitPaymentProof`; SuperAdmin queue (`getPaymentSubmissions`).                                                                                                                                                                   |
| **5 Companies**         | **App**       | List view card/grid toggle; `[id]` find-emails wired to `emailService` (verify schema).                                                                                                                                                                                                                     |
| **6 Campaigns / email** | **API + App** | Satellite mutations (`createCampaign`, …) when Go/gateway exposes — then **App** enables buttons (see [`GRAPHQL_PARITY.md`](GRAPHQL_PARITY.md) Outstanding).                                                                                                                                                |
| **6 Email**             | **App**       | Bulk finder/verifier **wizard** with `Progress` steps.                                                                                                                                                                                                                                                      |
| **7 Shared**            | **App**       | Carousel, RangeSlider, DataTable, Pagination parity with kit.                                                                                                                                                                                                                                               |
| **8**                   | **App**       | `OnboardingTour` + `localStorage`.                                                                                                                                                                                                                                                                          |

---

## 5. [`GRAPHQL_PARITY.md`](GRAPHQL_PARITY.md) “Outstanding / future work”

| Area      | Owner         | Micro-tasks                                                                                                                                                                                                    |
| --------- | ------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Campaigns | **API → App** | Expose mutations from satellite/gateway → enable **App** write actions (pause/resume/delete).                                                                                                                  |
| Sequences | **API → App** | Same for `createSequence` / `pauseSequence`.                                                                                                                                                                   |
| Pages nav | **App**       | ~~Sidebar entries from `accessiblePages`~~ — **`mergeAccessiblePagesIntoSidebarSections`** + command palette (`flatNavEntriesForAccessiblePages`) in `navConfig.ts` / `Sidebar.tsx` / `NavCommandPalette.tsx`. |
| Billing   | **App**       | Core flows: `useBilling` + `billingService` (see `GRAPHQL_PARITY.md`); SuperAdmin plan CRUD / payment proof as needed.                                                                                         |
| Jobs      | **App**       | Polling: `useJobs` + Activities job chart (`jobBucketCounts`); optional SSE later.                                                                                                                             |

---

## 6. Per-module unchecked bullets (grouped)

### Auth & users ([`01-auth`](ui-kit/modules/01-auth.md), [`02-users`](ui-kit/modules/02-users.md))

- **App:** E2E (Playwright optional); `accessiblePages` nav tests; notification prefs on `updateProfile` when API stable; promotions (`users.promoteToAdmin` vs `admin.updateUserRole`); admin stats widget; GraphQL error copy.
- **Docs:** matrix test checklists in `02-users.md`.

### Contacts & companies ([`03`](ui-kit/modules/03-contacts.md), [`04`](ui-kit/modules/04-companies.md))

- **App:** `useContactFilters` / `useCompanyDetail` hooks; bulk create; SuperAdmin import modals; dynamic filters from `filterData`; `/contacts/[uuid]`; Connectra down messaging; company import/filter parity.

### Notifications ([`05`](ui-kit/modules/05-notifications.md))

- **App:** Pagination; `/notifications/[id]`; E2E; gateway error empty states.

### S3 ([`07`](ui-kit/modules/07-s3.md))

- **App:** Upload progress UI; abort; prefix filter; file detail drawer; presigned download `expiresIn`; E2E list upload complete download delete.
- **Docs:** Re-tick resolved GraphQL rows after confirming against `s3Service.ts`.

### Health & envelope ([`08`](ui-kit/modules/08-health.md), [`18-health-envelope`](ui-kit/modules/18-health-envelope.md))

- **App:** Richer `ServiceHealth` display; combined API + Connectra banner.
- **Both / Ops:** Health matrix docker-compose, CI acceptance; optional BFF probe API (CORS-safe).

### Usage ([`09`](ui-kit/modules/09-usage.md))

- **App:** Optional Recharts; `trackUsage` call sites audit; feature matrix scenarios; `featureOverview` job linkage.

### Upload handoff ([`10`](ui-kit/modules/10-upload-handoff.md))

- **App:** Optional `uploadStatus` polling; copy for `/upload` vs `/files`; multipart E2E.

### Billing ([`14`](ui-kit/modules/14-billing.md))

- **Both:** Payment proof + admin approval — **API** mutations + **App** forms.

### Email ([`15`](ui-kit/modules/15-email.md))

- **App:** Bulk tab polling strategy aligned with `email.emailJobStatus` / jobs module.

### Jobs ([`16`](ui-kit/modules/16-jobs.md))

- **App:** `useJobDetail` poll; split hooks; retry metadata if API adds fields.

### LinkedIn / campaigns / sequences / templates / sales nav ([`21`](ui-kit/modules/21-linkedin.md)–[`25`](ui-kit/modules/25-campaign-templates.md), [`23`](ui-kit/modules/23-sales-navigator.md))

- **App:** Codegen refresh; remove dead sync types; SDL doc examples for nested `upsertByLinkedInUrl`.
- **API:** Optional `exportLinkedInResults` or doc as future; optional `SaveProfilesResponse` extra fields.
- **Both:** Campaign **BFF** or gateway for `POST /campaign`; `/campaigns/new` form; **sequences** builder + trigger wizard; **templates** REST edit route + preview.

### Pages ([`19-pages`](ui-kit/modules/19-pages.md))

- **App:** Typed unions in `src/types/pages.ts`; `getPageContent`; extended list filters — **only if** API exposes matching `PagesQuery` fields.

### Two-factor ([`27`](ui-kit/modules/27-two-factor.md))

- **API:** pyotp secret generation, TOTP verify, backup-code branches, rate limits, audit — **backend-heavy**.
- **App:** Login challenge when 2FA enabled (cross-module); E2E.

### Profile ([`28`](ui-kit/modules/28-profile.md))

- **App:** Optional hook splits; doc camelCase examples.

### Resume ([`29`](ui-kit/modules/29-resume.md))

- **API / Infra:** BFF for `/v1/ai/*` (no client API key).
- **App:** Structured section forms when schema stable; E2E.

### [`DISTILLED_ANALYSIS.md`](DISTILLED_ANALYSIS.md)

- **App:** Dedicated **Settings** page vs profile redirect (product decision).

---

## 7. Hygiene (spine §4a P4)

- Update [`GRAPHQL_PARITY.md`](GRAPHQL_PARITY.md) after each module merge.
- `react-hooks/exhaustive-deps` for `useActivities` / `useSalesNavigator`.
- Optional `react/forbid-dom-props` `style` after CSS migration.

---

**Last updated:** 2026-04-06 — generated from doc grep + `s3Service` / `forgot-password` spot checks.
