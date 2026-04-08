> **Source:** split from [`extended-module-notes.md`](../extended-module-notes.md) (index). Module order follows the original monolith.
> Here is a concise, deep crosswalk of **Admin** (`13_ADMIN_MODULE.md` ↔ `contact360.io/api` ↔ `contact360.io/app`), plus **Dashboard UI kit** mapping and a **task breakdown**.

---

## Module tracking

**Checkboxes** in **Phase** subsections below: `[x]` done · `[ ]` not done. Tag open items when useful: _(planned)_ roadmap · _(gap)_ known mismatch vs gateway · _(pending)_ blocked or unscheduled.

Full legend: [`README.md`](README.md#task-tracking-graphql--ui).

| Track       | What to update                                                                       |
| ----------- | ------------------------------------------------------------------------------------ |
| **GraphQL** | Operations, variables, and `Gql*` / codegen alignment vs `contact360.io/api` schema. |
| **UI**      | Routes under `app/`, feature components, Dashboard UI kit patterns, copy/UX.         |

## Roll-up (this module)

|             | GraphQL | UI                         |
| ----------- | ------- | -------------------------- |
| **Primary** | [x]     | [x] _(partial → expanded)_ |

> **2026-04-06 (earlier):** `userStats`, `logs` / `pageInfo`, `searchLogs(input:)`, `userHistory(filters:)` aligned with gateway.
>
> **2026-04-06 (later):** `src/graphql/adminOperations.ts` centralizes all admin query/mutation strings; `adminService` adds `getLogStatistics`, `usersWithBuckets` via `listUsers(..., { useBuckets })`, `deleteUser`, `promoteToAdmin`, `promoteToSuperAdmin`; `updateUserCredits` sends only gateway fields. Admin page: RBAC (Admin vs SuperAdmin tabs), Observability (`logStatistics` + Recharts), History tab, log filters + pagination + expandable JSON, stat grid KPIs from 24h log stats, confirm modals for destructive/promote actions.

**Codegen:** `AdminQuery`, `AdminMutation` — root `query.admin`, `mutation.admin`.

## 1. Canonical contract (doc + API)

**Namespace:** `query.admin.*` / `mutation.admin.*`. **RBAC:** most operations are **SuperAdmin**; **`userStats`** is **Admin or SuperAdmin**; **`promoteToAdmin`** allows self-promote (see doc).

| Area            | Operations                                                                                                                                                               | Notes                                                                                                                                                                                                  |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Users**       | `users(filters)`, `usersWithBuckets(filters)`                                                                                                                            | `UserFilterInput`: `limit`, `offset` only (inherits pagination).                                                                                                                                       |
| **Stats**       | `userStats`                                                                                                                                                              | `AdminUserStats`: `totalUsers`, `activeUsers`, **`usersByRole`**, **`usersByPlan`** (JSON).                                                                                                            |
| **History**     | `userHistory(filters)`                                                                                                                                                   | `UserHistoryFilterInput`: `userId`, `eventType`, `limit`, `offset`.                                                                                                                                    |
| **Logs read**   | `logs(filters)`, `searchLogs(input)`, `logStatistics(timeRange)`                                                                                                         | `LogQueryFilterInput`: `level`, `logger`, `userId`, `requestId`, `startTime`, `endTime`, `limit`, `offset`. `LogSearchInput`: `query`, `limit`, `offset`. `timeRange`: `1h` \| `24h` \| `7d` \| `30d`. |
| **Log types**   | `LogEntry`                                                                                                                                                               | `id`, `timestamp`, `level`, **`logger`**, `message`, `context`, `performance`, `error`, `userId`, `requestId`.                                                                                         |
| **Connections** | `UserConnection`, `LogConnection`, `LogSearchConnection`, `UserHistoryConnection`                                                                                        | **`items` + `pageInfo`** (`total`, `limit`, `offset`, `hasNext`, `hasPrevious`) — not a flat `total` on the connection.                                                                                |
| **Mutations**   | `updateUserRole`, `updateUserCredits`, `deleteUser`, `promoteToAdmin`, `promoteToSuperAdmin`, `createLog`, `createLogsBatch`, `updateLog`, `deleteLog`, `deleteLogsBulk` | Inputs match doc (`userId` / `logId` in GraphQL from `user_id` / `log_id`).                                                                                                                            |

The Python modules under `app/graphql/modules/admin/` match this (e.g. `userHistory(filters: ...)`, `searchLogs(input: ...)`, `LogConnection.create` → `page_info`).

---

## 2. `contact360.io/app` gaps _(updated)_

### Resolved in app

- Core read paths align with the gateway: **`userStats`**, **`logs` + `pageInfo`**, **`searchLogs(input:)`**, **`userHistory(filters:)`**.
- **`usersWithBuckets`** for **Admin**; **`users`** for **SuperAdmin** (`listUsers(..., { useBuckets })`).
- **`logStatistics`** + Observability tab (Recharts) + header stat cards (24h snapshot).
- **Mutations**: `deleteUser`, `promoteToAdmin`, `promoteToSuperAdmin`; **`updateUserCredits`** sends only **`userId` + `credits`** (form explains optional “reason” is local-only).
- Operations live in **`src/graphql/adminOperations.ts`**; types follow **`graphql/generated/types.ts`** for selected fields.

### Remaining (optional)

- Log **write** mutations (`createLog`, bulk, `deleteLogsBulk`, …) not in UI yet.
- User search remains **client-side** on the loaded page (`UserFilterInput` has no server search).
- **`mapAdminStats`** still zero-fills legacy numeric slots; real log KPIs come from **`logStatistics`** in the grid where available.

---

## 3. Dashboard UI kit mapping

| Capability          | Kit reference                  | App direction                                                                                                            |
| ------------------- | ------------------------------ | ------------------------------------------------------------------------------------------------------------------------ |
| Admin overview KPIs | Widget stat cards              | `StatCard` + **`userStats`** + **`logStatistics`** (`totalLogs`, `errorRate`, `recent`-style signals via `userActivity`) |
| User table          | Datatable                      | Paginated table; row actions: role, credits, delete, promote                                                             |
| Filters             | Select2, dropdowns, date range | **Service/logger** select, **level** radios or select, **date range** for logs and stats                                 |
| Log viewer          | Tables + badges                | Level badge, monospace `message`, expandable **JSON** for `context` / `error`                                            |
| Charts              | Chart.js / Morris / Flot style | **`byLevel`**, **`by_logger`**, **`performanceTrends`**, **`topErrors`** from `logStatistics`                            |
| Destructive actions | Sweetalert / modals            | Confirm **delete user**, **bulk delete logs**, **promote super admin**                                                   |
| Loading             | Progress / preloader           | Skeleton rows, linear progress on tab switch                                                                             |
| Search              | Navbar search patterns         | **`searchLogs`** with debounced input                                                                                    |

---

## 4. Smaller tasks (recommended order)

**Phase A — Schema-accurate client**

1. Rewrite **`ADMIN_STATS`** to select **`totalUsers`, `activeUsers`, `usersByRole`, `usersByPlan`**; type JSON as `Record<string, unknown>` or known string→number maps; remove or re-derive “new users” from **`usersByPlan`/DB** only if the API later adds fields.
2. Fix **`ADMIN_USERS`** response typing to read **`pageInfo.total`** (and use **`hasNext`** for pagination).
3. Replace **`GET_LOGS`** with **`LogQueryFilterInput`**, correct field names (`logger`, `startTime`, `endTime`, …), and **`items { … timestamp logger context … }`** + **`pageInfo`**.
4. Fix **`SEARCH_LOGS`** to **`searchLogs(input: { query, limit, offset })`** and parse **`pageInfo`** + echo **`query`**.
5. Fix **`GET_USER_HISTORY`** to **`userHistory(filters: $filters)`** and map **`eventType`**, **`userEmail`**, **`country`**, etc.
6. Add **`logStatistics(timeRange: $timeRange)`** with full selection set needed for UI.
7. Add **`usersWithBuckets`** if the product needs bucket columns (Admin+).
8. Add mutations: **`deleteUser`**, **`promoteToAdmin`**, **`promoteToSuperAdmin`**, log CRUD + **`deleteLogsBulk`** as needed.
9. Regenerate or hand-fix **`graphql/generated/types.ts`** and extend **`graphql.contracts.test.ts`**.

**Phase B — Hooks and RBAC**

10. Split **`useAdmin`** into **`useAdminUsers`**, **`useAdminLogs`**, **`useAdminLogStats`**, **`useAdminUserHistory`** (optional) to avoid one mega hook and to align with SuperAdmin vs Admin.
11. Gate routes with **`useRole`**: **Admin** → stats-only or limited UI; **SuperAdmin** → full tabs.
12. Map **`ForbiddenError`** to clear empty states / toasts.

**Phase C — UI modules**

13. **Users tab:** table columns from `User` + `profile`; actions wired to **`updateUserRole`**, **`updateUserCredits`**, **`deleteUser`** with confirmations; optional **`usersWithBuckets`** column.
14. **Logs tab:** filter bar (level, logger, userId, date range); table; pagination from **`pageInfo`**; search uses **`searchLogs`**.
15. **Observability tab:** **`logStatistics`** with Recharts (by level, top errors, performance trend); **radio** or **tabs** for `timeRange`.
16. **History tab / drawer:** **`userHistory`** with `eventType` filter and geo columns from doc.
17. **SuperAdmin tools:** promote / bulk log delete with **`checkbox`** selection or filter-based bulk only per API rules.

**Phase D — Product / docs**

18. Document in UI that **`promoteToAdmin`** self-promote exists (security note).
19. Align **`usersService.ts`** admin duplicates with **`adminService`** (single source of truth).
20. Update **`13_ADMIN_MODULE.md`** checklist: “frontend bindings” → actual page/hook names once implemented.

---

## 5. Summary

- **`13_ADMIN_MODULE.md`** and **`contact360.io/api/app/graphql/modules/admin/`** are **aligned** on operations, inputs, and connection shapes.
- **`contact360.io/app` `adminService` is largely out of sync** with that schema (**userStats**, **logs**, **searchLogs**, **userHistory** shapes and arguments). The admin UI **structure** (tabs, tables, modals, `StatCard`, search) fits the Dashboard kit, but **implementing the module “modularly”** means fixing the GraphQL layer first, then wiring **stats + logStatistics + full log/history fields**, then adding **missing mutations** where the product needs them.
