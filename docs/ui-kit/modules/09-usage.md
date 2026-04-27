> **Source:** split from [`extended-module-notes.md`](../extended-module-notes.md) (index). Module order follows the original monolith.
> Here is a concise alignment of **`09_USAGE_MODULE.md`**, **`contact360.io/api`**, **`contact360.io/app`**, the **Dashboard UI kit**, and a **task breakdown**.

---

## Module tracking

**Checkboxes** in **Phase** subsections below: `[x]` done · `[ ]` not done. Tag open items when useful: _(planned)_ roadmap · _(gap)_ known mismatch vs gateway · _(pending)_ blocked or unscheduled.

Full legend: [`README.md`](README.md#task-tracking-graphql--ui).

| Track       | What to update                                                                       |
| ----------- | ------------------------------------------------------------------------------------ |
| **GraphQL** | Operations, variables, and `Gql*` / codegen alignment vs `contact360.io/api` schema. |
| **UI**      | Routes under `app/`, feature components, Dashboard UI kit patterns, copy/UX.         |

## Roll-up (this module)

|             | GraphQL | UI              |
| ----------- | ------- | --------------- |
| **Primary** | [x]     | [x] _(partial)_ |

> **`usageOperations.ts`** centralizes queries/mutations; **`getFeatureOverview`** selects extended **`activities`** / **`jobs`** fields; **`useUsage`** + **`useFeatureOverview`** power the **Usage** tab on **`/activities?tab=usage`** (legacy **`/usage`** redirects there).

**Codegen:** `UsageQuery`, `UsageMutation`; root `query.featureOverview` → `FeatureOverviewQuery` (not under `usage { }`).

## 1. Module contract (doc ↔ API)

**Namespaces**

- **`usage`** — `query.usage(feature?: String)` → **`UsageResponse`** (`features: [FeatureUsageInfo!]!`).
- **`usage`** mutations — **`trackUsage(input: TrackUsageInput!)`**, **`resetUsage(input: ResetUsageInput!)`**.
- **Root `featureOverview`** (separate resolver on `Query`, not under `usage`) — **`featureOverview { featureOverview(feature: String!) }`** → **`FeatureOverview`**: `feature`, `usage`, **`activities: [Activity!]!`**, **`jobs: [SchedulerJob!]!`**.

**Inputs**

- **`TrackUsageInput`:** `feature: String!`, **`amount: Int!`** (default 1 in doc SDL).
- **`ResetUsageInput`:** `feature: String!`.

**`FeatureUsageInfo`:** `feature`, `used`, `limit`, **`remaining`** (-1 = unlimited), **`resetAt`**.

**Auth:** All of the above require a **logged-in user** (`require_auth`). **`resetUsage`** remains on the gateway for tooling; the **app no longer exposes** the SuperAdmin reset control (use Django admin / direct API for testing).

**Implementation notes (API)**

- Usage query is **cached** (~30s TTL) in `usage/queries.py`.
- **`featureOverview`** maps feature → activity types and filters **scheduler jobs** by `request_payload.feature` / `job_type` heuristics (`BULK_EXPORT`, `CONTACT360_IMPORT`, etc.).

---

## 2. What the app implements today

**[`usageOperations.ts`](../../../src/graphql/usageOperations.ts)** + **[`usageService.ts`](../../../src/services/graphql/usageService.ts)**

- **`getUsage(feature?)`** — `usage { usage(feature: $feature) { features { … } } }`.
- **`getFeatureOverview(feature)`** — Root **`featureOverview`** with **`usage`**, **`activities`** (incl. `errorMessage`), **`jobs`** (incl. `statusPayload`, `updatedAt`, etc.).
- **`trackUsage` / `resetUsage`** — **`graphqlMutation`** with **`TrackUsageInput` / `ResetUsageInput`** from **`generated/types`**.

**[`useUsage`](../../../src/hooks/useUsage.ts)** — Optional **`feature`** / **`features[]`** filter; **`refresh`**, **`trackUsage`**, **`resetUsage`** (both refresh list after success).

**[`useFeatureOverview`](../../../src/hooks/useFeatureOverview.ts)** — `{ overview, loading, error, refresh }` for one feature.

**[`/activities?tab=usage`](<../../../app/(dashboard)/activities/page.tsx>)** — **`useUsage()`** for the grid; **filter Tabs** (All features | Feature detail); **`FeatureUsageCard`** + **`FeatureOverviewPanel`**; links to the **Activity feed** (`/activities?tab=feed`) and **Jobs** drawer. **SuperAdmin**: **Reset usage** + **`ConfirmModal`**.

**[`usageDisplay.ts`](../../../src/lib/usageDisplay.ts)** — **`isUsageUnlimited`**, **`usageProgressPercent`**.

---

## 3. Gaps vs “modular” / full doc

| Area                    | Gap                                                                                                               |
| ----------------------- | ----------------------------------------------------------------------------------------------------------------- |
| **Charts**              | Optional Recharts bar for all features — not added (cards + **Progress** only).                                   |
| **Product integration** | Call **`trackUsage`** from quota-consuming flows only if server does not already increment — **verify** per flow. |
| **Admin / testing**     | **resetUsage** exposed for **SuperAdmin** only; still **dangerous** — keep confirm + copy.                        |

---

## 4. Dashboard UI kit (how to use it)

- **`widget-basic.html` / stat cards** — **Card + Badge + Progress** on **`FeatureUsageCard`**.
- **Tables** — **`featureOverview.jobs`** and **activities** in **`FeatureOverviewPanel`**.
- **Tabs** — Page-level **All features | Feature detail**; panel **Usage | Activity | Jobs**.
- **Progress** — Linear **progress** for capped features; **badge “Unlimited”** when **`remaining === -1`** or **`limit >= 999999`**.

---

## 5. Smaller tasks (recommended order)

### Phase A — Types & service parity

- [x] **Codegen** — Types from **`generated/types`**; operations in **`usageOperations.ts`**.
- [x] **Extend `getFeatureOverview` query** — Richer **`activities`** / **`jobs`** selections.
- [x] **Add `trackUsage` / `resetUsage`** to **`usageService`**.

### Phase B — Hooks & data flow

- [x] **`useUsage`** — Optional filters; **`refresh`**; **`trackUsage` / `resetUsage`** invalidate list.
- [x] **`useFeatureOverview(feature)`** — As above.

### Phase C — UI/UX (Usage page + kit patterns)

- [x] **`usage/page.tsx`** uses **`useUsage()`** + **`useFeatureOverview`**.
- [x] **Feature row actions** — Card title / keyboard opens **Feature detail** tab with selection.
- [x] **Detail view** — **Tabs**: Usage summary, **Activity** table, **Jobs** table + nav links.
- [ ] **Charts** — Optional **Recharts** bar (deferred).
- [x] **`resetUsage`** — **SuperAdmin** + **ConfirmModal**.

### Phase D — Product integration

- [ ] **Call `trackUsage`** from flows where the gateway does **not** increment server-side — **verify** to avoid double counting.
- [x] **Empty state** — Copy for no rows / no overview.

### Phase E — QA

- [ ] **Matrix** — All features, single-feature filter, unlimited user, after **`trackUsage`**, cache refresh (~30s).
- [ ] **featureOverview** — `EMAIL_FINDER`, `BULK_EXPORT`, `CONTACT360_IMPORT` job linkage per API heuristics.

---

## 6. Summary

- **`09_USAGE_MODULE.md`** defines **usage query**, **track/reset mutations**, and **root `featureOverview`**.
- **`contact360.io/app`** wires **`usageOperations`**, **featureOverview**, **`useUsage` / `useFeatureOverview`**, and **SuperAdmin reset** on the **Activities → Usage** tab.

**Dashboard UI kit** fits **cards, Progress, tabs, and tables** for the feature-centric usage surface.
