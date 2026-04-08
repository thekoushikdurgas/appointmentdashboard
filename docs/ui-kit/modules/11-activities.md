> **Source:** split from [`extended-module-notes.md`](../extended-module-notes.md) (index). Module order follows the original monolith.
> Here is a structured analysis of **Activities** (`11_ACTIVITIES_MODULE.md` ↔ `contact360.io/api` ↔ `contact360.io/app`) plus UI kit mapping and a **task breakdown**.

---

## Module tracking

**Checkboxes** in **Phase** subsections below: `[x]` done · `[ ]` not done. Tag open items when useful: _(planned)_ roadmap · _(gap)_ known mismatch vs gateway · _(pending)_ blocked or unscheduled.

Full legend: [`README.md`](README.md#task-tracking-graphql--ui).

| Track       | What to update                                                                       |
| ----------- | ------------------------------------------------------------------------------------ |
| **GraphQL** | Operations, variables, and `Gql*` / codegen alignment vs `contact360.io/api` schema. |
| **UI**      | Routes under `app/`, feature components, Dashboard UI kit patterns, copy/UX.         |

## Roll-up (this module)

|             | GraphQL | UI  |
| ----------- | ------- | --- |
| **Primary** | [x]     | [x] |

> **2026-04-06:** `activityStats(filters:)` arg fixed; `status === "success"` fixed in calendar; analytics grouping uses real `actionType`/`serviceType` enum values.

**Codegen:** `ActivityQuery` — root `query.activities` (read-only; no `ActivityMutation`).

## 1. Canonical contract (doc + API)

**Namespace:** `query { activities { … } }` — no mutations (logging happens in other resolvers).

| Query           | GraphQL argument                          | Returns              |
| --------------- | ----------------------------------------- | -------------------- |
| `activities`    | `filters: ActivityFilterInput` (optional) | `ActivityConnection` |
| `activityStats` | `filters: ActivityStatsInput` (optional)  | `ActivityStats`      |

**`ActivityFilterInput`:** `serviceType`, `actionType`, `status`, `startDate`, `endDate`, `limit`, `offset` (Strawberry/Python → **camelCase** in JSON: `startDate`, etc.).

**`Activity` fields (API `types.py`):** `id`, `userId`, `serviceType`, `actionType`, `status`, `requestParams`, `resultCount`, `resultSummary`, `errorMessage`, `ipAddress`, `userAgent`, `createdAt`.

**`ActivityConnection`:** `items`, `total`, `limit`, `offset`, `hasNext`, `hasPrevious`.

**`ActivityStats`:** `totalActivities`, `byServiceType`, `byActionType`, `byStatus`, `recentActivities` (JSON objects for the three `by*` fields).

**Enums (API `user.py`, aligned with doc §Input Types):**

- **Service:** `jobs`, `imports`, `contacts`, `companies`, `email`, `ai_chats`, `linkedin`, `sales_navigator`
- **Action:** `create`, `update`, `delete`, `query`, `search`, `export`, `import`, `send`, `verify`, `analyze`, `generate`, `parse`, `scrape`
- **Status:** `success`, `failed`, `partial`

The API `queries.py` implementation matches this: both fields use **`filters`**, not `input`.

---

## 2. `contact360.io/app` alignment

### What matches

- **`activities` list query** in `activitiesService.ts` uses `activities(filters: $filters)` and selects fields that exist on the API type (subset of full `Activity`).
- **Pagination fields** `hasNext` / `hasPrevious` are requested correctly.

### Critical mismatches

1. **`activityStats` argument name** — Service uses:

```44:46:contact360.io/app/src/services/graphql/activitiesService.ts
const ACTIVITY_STATS = `query ActivityStatsGateway($input: ActivityStatsInput) {
  activities {
    activityStats(input: $input) {
```

The gateway exposes **`activityStats(filters: …)`**, not `input`. Any caller of `getStats()` will get a **GraphQL validation error**. The Activities page does not call `getStats` today, so this bug is **latent** until something uses it (e.g. `useActivities`).

2. **Date filters on list** — `useActivities` includes `startDate` / `endDate`, but `activitiesService.list` **never forwards** them in `filters`, so date-scoped lists are impossible from the hook.

3. **Generated `Gql*` types** (`graphql/generated/types.ts`) describe a **different** shape (`metadata`, `fromDate`/`toDate`, wrong stats shape). They are **not** aligned with the live module; treat codegen as stale for activities until regenerated from the real schema.

### UI logic vs real data model

The Activities page (`app/(dashboard)/activities/page.tsx`) is built around **legacy-style event names** (`EMAIL_FOUND`, `JOB_COMPLETED`, …) and **status `completed`**, while the API returns **enum-style** `actionType` (`query`, `search`, …) and **status** `success` | `failed` | `partial`.

- **Icons / colors / badges:** `ACTIVITY_ICONS` / `ACTIVITY_COLORS` keys rarely match; most rows fall back to the generic icon.
- **Calendar colors:** `a.status === "completed"` never matches **`success`**; failed is correct; “success” paths get the default primary color instead of green.
- **Analytics tab:** Grouping uses `actionType.toUpperCase()` and checks for `EMAIL`, `CONTACT`, `JOB` — real values are **`query`**, **`search`**, etc., so **series are misleading or empty** unless you derive categories from `serviceType` + `actionType` explicitly.

**`ActivityBarChart`** on the dashboard uses **random placeholder data**, not `activityStats` or the activities list.

---

## 3. Dashboard UI kit → Activities UX

From `docs/frontend/ideas/Dashboard ui kit`, map:

| Need                     | Kit / app direction                                                                                                                     |
| ------------------------ | --------------------------------------------------------------------------------------------------------------------------------------- |
| Activity feed / timeline | List groups, cards (`ui-list-group`, `ui-card`); you already use `Card` + feed rows — align copy and badges with real enums             |
| Filters                  | Select2-style dropdowns (`uc-select2`), or app `Select` + date inputs; **checkboxes** for multi-select optional later                   |
| Stats overview           | Widget stat cards (`widget-stat`); you have `StatCard` — wire **`activityStats`** + `recentActivities`                                  |
| Pagination               | Table patterns (`table-datatable-basic`) or “Load more” using `hasNext` / `offset`                                                      |
| Charts                   | `chart-chartjs` / Morris / Flot concepts → keep **Recharts** but feed **`byServiceType` / `byActionType` / `byStatus`** (bar/pie/donut) |
| Empty / error            | Toastr / Sweetalert analogs in app                                                                                                      |
| Loading                  | Progress bar or skeleton for initial fetch                                                                                              |

**Suggested flows**

- **Feed:** filtered table or timeline → optional row expand for `requestParams` / `resultSummary` / `errorMessage` (JSON viewers).
- **Stats header:** `totalActivities`, `recentActivities`, optional date range (same vars as `ActivityStatsInput`).
- **Charts:** transform JSON buckets into Recharts `data` arrays; no random data in production paths.

---

## 4. Smaller tasks (implementation order)

**Phase A — GraphQL client correctness**

1. Fix **`activityStats`**: rename variable to `$filters`, use `activityStats(filters: $filters)`, pass `{ filters: { startDate, endDate } }` from `getStats`.
2. Extend **`activitiesService.list`** to pass **`startDate` / `endDate`** (and any other filter fields) through `filters`.
3. Optionally extend **Activity** selections: `requestParams`, `resultSummary`, `userAgent`, `ipAddress` for detail views.
4. Regenerate **codegen** / update **`GqlActivity`**, `GqlActivityConnection`, `GqlActivityStats`, `GqlActivityFilterInput` to match the printed schema.
5. Add or extend **`graphql.contracts.test.ts`** for activities queries (argument name `filters` on both operations).

**Phase B — Hooks and state**

6. Fix **`useActivities`**: stable filter dependency (see `ui_kit_usage tasks.md` note); ensure list + stats share the same date range when provided.
7. Add **`useActivityStats`** or split concerns if the dashboard only needs stats without the full list.
8. Expose **`hasNext` / `hasPrevious` / limit / offset** from the hook for pagination UI.

**Phase C — Activities page UX (modular)**

9. Replace **legacy icon map** with a small **utility**: `(serviceType, actionType, status) → { icon, color }` using the documented enums.
10. Fix **calendar** event colors to use **`success` / `failed` / `partial`**.
11. Rebuild **analytics** tab: primary chart from **`activityStats.byServiceType`** / **`byActionType`**; optional time series from **paginated** `activities` grouped by day (or a future dedicated query if product needs it).
12. Remove or gate **mock CSV analysis** unless backed by real data (different module).
13. Add **filter bar**: service (select), action (select), status (select or radio), date range, **Apply** / **Reset**; optional **checkbox** “Last 24h” mapped to stats + list.
14. Add **pagination** controls (prev/next or page size) using `limit`/`offset` and `hasNext`/`hasPrevious`.
15. Optional **detail drawer** / modal for one `Activity` row (JSON pretty-print).

**Phase D — Dashboard and shared components**

16. Wire **dashboard** widgets to **`activityStats`** or a slim `activities` query instead of only a raw list where appropriate.
17. Replace **`ActivityBarChart`** placeholder data with real stats or remove from dashboard until wired.

**Phase E — Docs / product**

18. In **`11_ACTIVITIES_MODULE.md`**, the early “Service Types” bullet list omits **`jobs`** and **`imports`**; align bullets with §Input Types (optional doc cleanup).

---

## 5. Summary

- **API** in `app/graphql/modules/activities/` matches **`11_ACTIVITIES_MODULE.md`** (including **`filters`** on `activityStats`).
- **App** list query is mostly correct; **`getStats` is wrong** (`input` vs `filters`), **dates are dropped** on list, **codegen types are wrong**, and the **Activities UI** assumes an old event vocabulary and **`completed`** status, so it **does not reflect** the real GraphQL model.
- **Implementation** should fix the client and hooks first, then **reshape the page** (icons, calendar, charts) around **`serviceType` / `actionType` / `status`** and **`activityStats` JSON**, using Dashboard kit patterns for filters, tables, and charts.
