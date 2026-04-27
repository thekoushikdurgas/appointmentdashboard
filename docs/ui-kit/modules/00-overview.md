> **Source:** split from [`extended-module-notes.md`](../extended-module-notes.md) (index). Module order follows the original monolith.

# UI kit mapping — extended module notes

> **Split from** [`UI_KIT_MAPPING.md`](../UI_KIT_MAPPING.md) **(2026-04-05)** so the parent file stays a short index + §§1–7 + §4/§4a. Edit **either** the spine checklists in the parent **or** the files under [`modules/`](./) for deep per-module narratives — do not duplicate roadmap tables.

---

Here is a concise read of how `contact360.io/api` and `contact360.io/app` fit together, and a practical way to split “wire every module, types, requests/responses, pages” into smaller tasks.

---

## Module tracking

**Checkboxes:** `[x]` **completed** · `[ ]` **incomplete** — tag with _(planned)_ / _(pending)_ / _(gap)_ / _(partial)_ per [`README.md`](../README.md#task-tracking-graphql--ui).

|                      | GraphQL | UI  |
| -------------------- | ------- | --- |
| **Meta (this file)** | —       | —   |

| Track       | What to update                                                                       |
| ----------- | ------------------------------------------------------------------------------------ |
| **GraphQL** | Operations, variables, and `Gql*` / codegen alignment vs `contact360.io/api` schema. |
| **UI**      | Routes under `app/`, feature components, Dashboard UI kit patterns, copy/UX.         |

## Codegen module map (`src/graphql/generated/types.ts`)

Strawberry merges **one namespace per domain**. The generated file exposes a **`Query`** and **`Mutation`** root whose fields map to nested types (`ActivityQuery`, `AuthMutation`, …). Use this when tracing **`Gql*`** types to a domain.

**`Query` fields → `*Query` types**

| Root field          | Generated type         | Notes                                               |
| ------------------- | ---------------------- | --------------------------------------------------- |
| `activities`        | `ActivityQuery`        |                                                     |
| `admin`             | `AdminQuery`           |                                                     |
| `aiChats`           | `AiChatQuery`          |                                                     |
| `analytics`         | `AnalyticsQuery`       |                                                     |
| `auth`              | `AuthQuery`            |                                                     |
| `billing`           | `BillingQuery`         |                                                     |
| `campaignSatellite` | `CampaignModuleQuery`  | JSON: `campaigns`, `sequences`, `campaignTemplates` |
| `companies`         | `CompanyQuery`         |                                                     |
| `contacts`          | `ContactQuery`         |                                                     |
| `email`             | `EmailQuery`           |                                                     |
| `featureOverview`   | `FeatureOverviewQuery` | Sibling of `usage`, not under `usage { }`           |
| `health`            | `HealthQuery`          |                                                     |
| `jobs`              | `JobQuery`             |                                                     |
| `notifications`     | `NotificationQuery`    |                                                     |
| `pages`             | `PagesQuery`           |                                                     |
| `profile`           | `ProfileQuery`         |                                                     |
| `resume`            | `ResumeQuery`          |                                                     |
| `s3`                | `S3Query`              |                                                     |
| `salesNavigator`    | `SalesNavigatorQuery`  |                                                     |
| `savedSearches`     | `SavedSearchQuery`     |                                                     |
| `twoFactor`         | `TwoFactorQuery`       |                                                     |
| `upload`            | `UploadQuery`          |                                                     |
| `usage`             | `UsageQuery`           |                                                     |
| `users`             | `UserQuery`            |                                                     |

**`Mutation` fields → `*Mutation` types**

| Root field       | Generated type           | Notes                                                          |
| ---------------- | ------------------------ | -------------------------------------------------------------- |
| `admin`          | `AdminMutation`          |                                                                |
| `aiChats`        | `AiChatMutation`         |                                                                |
| `analytics`      | `AnalyticsMutation`      |                                                                |
| `auth`           | `AuthMutation`           |                                                                |
| `billing`        | `BillingMutation`        |                                                                |
| `companies`      | `CompanyMutation`        |                                                                |
| `contacts`       | `ContactMutation`        |                                                                |
| `email`          | `EmailMutation`          |                                                                |
| `jobs`           | `JobMutation`            |                                                                |
| `linkedin`       | `LinkedInMutation`       | **Query root has no `linkedin`** — search/upsert are mutations |
| `notifications`  | `NotificationMutation`   |                                                                |
| `profile`        | `ProfileMutation`        |                                                                |
| `resume`         | `ResumeMutation`         |                                                                |
| `s3`             | `S3Mutation`             |                                                                |
| `salesNavigator` | `SalesNavigatorMutation` |                                                                |
| `savedSearches`  | `SavedSearchMutation`    |                                                                |
| `twoFactor`      | `TwoFactorMutation`      |                                                                |
| `upload`         | `UploadMutation`         |                                                                |
| `usage`          | `UsageMutation`          |                                                                |
| `users`          | `UserMutation`           |                                                                |

## How the API is organized

The backend is **FastAPI + Strawberry GraphQL**. The root schema composes many modules under `contact360.io/api/app/graphql/modules/`, each with `queries.py`, `mutations.py`, `types.py`, `inputs.py` where needed. The **single entry** for the app is still **`POST /graphql`** (see `schema.py`).

**Query namespaces** (examples): `auth`, `users`, `contacts`, `companies`, `activities`, `analytics`, `billing`, `email`, `campaignSatellite`, `jobs`, `usage`, `featureOverview`, `pages`, `s3`, `upload`, `aiChats`, `notifications`, `salesNavigator`, `admin`, `health`, `savedSearches`, `twoFactor`, `profile`, `resume`.

**Mutation namespaces** mirror most of those (not every query module repeats as mutation-only; `campaignSatellite` is query-oriented in the snippet you have).

So “modular” on the server already means **one Strawberry package per domain**, merged in:

```55:131:d:\code\ayan\contact\contact360.io\api\app\graphql\schema.py
@strawberry.type
class Query:
    """Root query type combining all query modules."""

    # Auth queries
    auth: AuthQuery = strawberry.field(resolver=lambda: AuthQuery())
    ...
    resume: ResumeQuery = strawberry.field(resolver=lambda: ResumeQuery())
```

---

## How the app talks to the API

1. **`graphqlClient.ts`** — `graphql-request` + JWT refresh; all calls go to `GRAPHQL_URL` from `config.ts` (with Next rewrites in dev).
2. **`src/services/graphql/*.ts`** — one service file per domain, aligned with the API module names (`contactsService`, `billingService`, `campaignSatelliteService`, etc.). Barrel export in `index.ts`.
3. **Types**
   - **Canonical**: `src/graphql/generated/types.ts` — produced by **GraphQL Code Generator** from a live schema (`codegen.ts` introspects `CODEGEN_SCHEMA_URL` / default `http://127.0.0.1:8000/graphql`).
   - **Convenience**: `src/types/api-modules.ts` re-exports `Gql*` types and legacy aliases (`Contact`, `BillingInfo`, …).
   - **Extra hand-written**: `src/types/graphql-gateway.ts` documents **camelCase wire shapes** and helpers like `normalizeGatewayRole`; some of this **overlaps** generated `Gql*` types, so you have two mental models unless you consolidate.
4. **Hooks** — `useContacts`, `useBilling`, `useAIChat`, etc.; not every route has a dedicated hook, and some pages call services directly.

---

## What “implement modular one by one” should mean in practice

For each **API module**, you want a repeatable vertical slice:

| Layer             | Responsibility                                                                          |
| ----------------- | --------------------------------------------------------------------------------------- |
| Schema (API)      | Types, inputs, query/mutation fields                                                    |
| Codegen (app)     | Regenerate `Gql*` types after schema changes                                            |
| Service (app)     | Raw `gql` documents + `graphqlRequest<T>` with correct variables                        |
| Types (app)       | Prefer `Gql*` / `api-modules` exports; avoid duplicate local `interface` where possible |
| Hook (optional)   | Caching, loading/error state, mutations                                                 |
| Page / components | Map response fields to UI; no mock constants for “live” metrics if real data exists     |

You already follow this in places (e.g. **Usage** uses `usageService` and typed `FeatureUsage`). **Dashboard** mixes real services with **mock sparklines and static chart series**, so it is only partially aligned. **Campaigns** imports `campaignSatelliteService` but defines a **local** `Campaign` / `CampaignStatus` instead of generated campaign types — a typical gap to close module-by-module.

---

## Smaller tasks (recommended order)

### Cross-cutting (do once, then reuse)

- [ ] **Document the module map** — API root field → `*Service.ts` → routes → hooks. _(planned)_
  - [ ] **GraphQL** — Column links to `types.ts` `*Query`/`*Mutation` (see [Codegen module map](#codegen-module-map-srcgraphqlgeneratedtypests) above).
  - [ ] **UI** — `ROUTES.*` / `navConfig` alignment.
- [x] **Codegen workflow** — API up; `npm run codegen`; commit `types.ts` when schema changes. _(partial)_
  - [x] **GraphQL** — `codegen.ts` + `types.ts` in repo.
  - [ ] **UI** — Team [`README`](../../../README.md) dev notes when stable.
- [ ] **Pick one type source** — Prefer **`@/graphql/generated/types` + `@/types/api-modules`**; trim duplicate `Gateway*` where it mirrors `Gql*`. _(gap)_
  - [ ] **GraphQL** — Consolidate aliases in `api-modules.ts`.
  - [ ] **UI** — Replace local interfaces on pages incrementally.
- [ ] **Error and loading pattern** — `DataState` + toast from `graphqlClient`. _(planned)_
  - [ ] **GraphQL** — Centralize error parsing from gateway `extensions`.
  - [ ] **UI** — Shared skeleton/empty/error components per route.

### Per API module (repeat in dependency order)

For each domain: **GraphQL** — service ↔ `types.ts` namespace; **UI** — routes and components. Tags apply per track when they differ.

Suggested sequence (auth and user context first, then data-heavy features):

- [ ] **Auth + users** — [`01-auth.md`](01-auth.md), [`02-users.md`](02-users.md). _(partial)_
  - [ ] **GraphQL** — Optional `pageType` / `session` / `uploadAvatar` alignment.
  - [x] **UI** — Login/register/session; `AuthContext` / `RoleContext`.
- [ ] **Profile + twoFactor** — [`28-profile.md`](28-profile.md), [`27-two-factor.md`](27-two-factor.md). _(partial)_
  - [x] **GraphQL** — Core queries/mutations wired.
  - [x] **UI** — `/profile` tabs; team/role edge cases remain.
- [ ] **Contacts + companies** — [`03-contacts.md`](03-contacts.md), [`04-companies.md`](04-companies.md). _(partial)_
  - [ ] **GraphQL** — Export/import/batch/filterData parity.
  - [x] **UI** — CRUD, VQL, `companies/[id]` (deep-link gaps in companies doc).
- [ ] **Activities + analytics** — [`11-activities.md`](11-activities.md), [`18-analytics.md`](18-analytics.md). _(partial)_
  - [ ] **GraphQL** — `activityStats(filters:)`; perf metrics submission.
  - [x] **UI** — Feed/calendar/analytics tab; dashboard main chart uses **`analyticsService`** (see [`GRAPHQL_PARITY.md`](../../GRAPHQL_PARITY.md)); kit polish (carousel, sparklines) in spine §4.
- [ ] **Billing + usage** — [`14-billing.md`](14-billing.md), [`09-usage.md`](09-usage.md). _(partial)_
  - [x] **GraphQL** — Core billing/usage queries.
  - [x] **UI** — Plans/invoices/usage pages; `featureOverview` under-selected in usage service.
- [ ] **Email + jobs** — [`15-email.md`](15-email.md), [`16-jobs.md`](16-jobs.md). _(partial)_
  - [x] **GraphQL** — Services exist.
  - [x] **UI** — Primary routes wired.
- [ ] **S3 + upload** — [`07-s3.md`](07-s3.md), [`10-upload-handoff.md`](10-upload-handoff.md). _(partial)_
  - [x] **GraphQL** — `s3Service` / upload mutations aligned with `S3Query` / `UploadMutation` (see [`GRAPHQL_PARITY.md`](../../GRAPHQL_PARITY.md)); re-run codegen after schema changes.
  - [ ] **UI** — `/files`: CSV E2E polish (progress, prefix filter, detail drawer per `07-s3.md`).
- [ ] **Notifications** — [`05-notifications.md`](05-notifications.md). _(partial)_
  - [x] **GraphQL** — Preferences + CRUD aligned.
  - [x] **UI** — `/notifications` (pagination + **Load more**, `/notifications/[id]`); E2E / gateway empty states remain in module doc.
- [x] **Saved searches** — [`extended-module-notes.md`](../extended-module-notes.md) (`savedSearches`). _(partial)_
  - [x] **GraphQL**
  - [x] **UI**
- [ ] **LinkedIn + salesNavigator** — [`21-linkedin.md`](21-linkedin.md), [`23-sales-navigator.md`](23-sales-navigator.md). _(partial)_
  - [x] **GraphQL** — `Mutation.linkedin` / `salesNavigator` namespaces.
  - [ ] **UI** — Mock paths / edge cases.
- [x] **AI chats** — [`17-ai-chats.md`](17-ai-chats.md). _(partial)_
  - [x] **GraphQL** — `aiChatService` / `AiChatMutation.sendMessage` (see [`extended-module-notes.md`](../extended-module-notes.md)).
  - [x] **UI** — `/ai-chat` via `useAIChat`.
- [ ] **Resume** — [`29-resume.md`](29-resume.md). _(partial)_
  - [x] **GraphQL** — Resume CRUD; regenerate `Gql*` after schema bumps.
  - [x] **UI** — `/resume` + modals + nav; BFF for `/v1/ai/*` and structured forms remain in module doc.
- [ ] **Admin + health** — [`13-admin.md`](13-admin.md), [`08-health.md`](08-health.md). _(partial)_
  - [ ] **GraphQL** — Admin service drift vs `AdminQuery`.
  - [x] **UI** — Admin shell; product `/status` **retired** (operator status in Django admin).
- [ ] **Campaign satellite** — [`22-campaigns.md`](22-campaigns.md) … [`25-campaign-templates.md`](25-campaign-templates.md). _(partial)_
  - [x] **GraphQL** — `campaignSatellite` JSON queries when env set.
  - [ ] **UI** — Writes often “coming soon”.
- [ ] **Analytics mutations** — `analytics.submitPerformanceMetric`. _(planned)_
  - [ ] **GraphQL** — Wire client if product requires metrics.
  - [ ] **UI** — Dashboard instrumentation.

### Page-level checklist (parallel to the above)

For each file under `app/(dashboard)/**/page.tsx` (and auth routes):

- [ ] **GraphQL** — Imports: service vs mock; variables match Strawberry **camelCase**; types from **`api-modules` / `types.ts`**.
- [ ] **UI** — Loading/error/empty; kit patterns (`c360-*`); optional **hook** when mutations + cache grow.

---

## Important constraints to remember

- **`campaignSatellite`** is optional in the API; UI should handle empty/errors when the satellite URL is not configured.
- **`graphql-gateway.ts`** vs **`Gql*`** duplication is a real source of drift; consolidating reduces “implement twice” work.
- The physical folder `contact360.io/api` **is** the Python API (not only `deploy/`); the GraphQL surface is the contract the app should follow module-by-module.

---

**Sources:** `contact360.io/api/app/graphql/schema.py`, `contact360.io/app/src/lib/graphqlClient.ts`, `contact360.io/app/src/types/api-modules.ts`, `contact360.io/app/codegen.ts`, `contact360.io/app/src/services/graphql/index.ts`, `contact360.io/app/src/lib/navConfig.ts`, and spot checks on `dashboard`, `campaigns`, `linkedin`, and `usage` pages.
