> **Source:** split from [`extended-module-notes.md`](../extended-module-notes.md) (index). Module order follows the original monolith.
> Here is an alignment of **`05_NOTIFICATIONS_MODULE.md`**, the **API implementation**, **`contact360.io/app`**, the **Dashboard UI kit**, and a **task breakdown**.

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

> **2026-04-06:** `notificationPreferences` / `updateNotificationPreferences` aligned with live schema.
>
> **2026-04-06 (notifications pass):** [`notificationsOperations.ts`](../../../src/graphql/notificationsOperations.ts); **`notificationsService`** uses **`Notification`**, **`NotificationFilterInput`**, **`MarkReadInput`**, **`DeleteNotificationsInput`**, **`UpdateNotificationPreferencesInput`**, **`PageInfo`**; **`get(notificationId)`**, **`markNotificationAsRead`**; list returns **`{ items, pageInfo }`**; **[`notificationDisplay.ts`](../../../src/lib/notificationDisplay.ts)** normalizes **type/priority** for badges; **type filter** → **`filters.type`**; feature **[`NotificationCard`](../../../src/components/feature/notifications/NotificationCard.tsx)**, **[`NotificationPreferencesTab`](../../../src/components/feature/notifications/NotificationPreferencesTab.tsx)**, **[`NotificationTypeFilter`](../../../src/components/feature/notifications/NotificationTypeFilter.tsx)**; **`Progress`** while loading; preferences **`update(patch)`** sends **partial** input only.

**Codegen:** [`NotificationQuery`](../../../src/graphql/generated/types.ts), [`NotificationMutation`](../../../src/graphql/generated/types.ts), [`GraphQlNotificationType`](../../../src/graphql/generated/types.ts), [`GraphQlNotificationPriority`](../../../src/graphql/generated/types.ts).

## 1. Module contract (doc + API)

**Namespace:** `notifications { ... }` on Query and Mutation.

| Operation                                                   | Notes                                                                  |
| ----------------------------------------------------------- | ---------------------------------------------------------------------- |
| `notifications(filters)`                                    | `NotificationFilterInput`: `limit`, `offset`, `unreadOnly`, **`type`** |
| `notification(notificationId)`                              | Single row                                                             |
| `unreadCount`                                               | `{ count }`                                                            |
| `notificationPreferences` / `updateNotificationPreferences` | Boolean channels                                                       |
| `markNotificationAsRead` / `markNotificationsAsRead`        | Single vs batch                                                        |
| `deleteNotifications`                                       | `notificationIds`                                                      |

**Enums:** `GraphQlNotificationType`, `GraphQlNotificationPriority` in codegen (uppercase strings). If the API returns lowercase, **`normalizeNotificationType` / `normalizeNotificationPriority`** in **`notificationDisplay.ts`** keep badge labels consistent.

**Not in API:** `deleteAllRead` — client simulates via paging + **`deleteNotifications`** (**`notificationsService.deleteAllRead`**).

---

## 2. What the app implements today

**Service:** [`notificationsService.ts`](../../../src/services/graphql/notificationsService.ts) — all operations above; documents in **`notificationsOperations.ts`**.

**Hooks:** [`useNotifications.ts`](../../../src/hooks/useNotifications.ts) — list + **`type`** filter + unread polling; **`useNotificationPreferences`** — load + **`UpdateNotificationPreferencesInput`** patches.

**UI:** [`app/(dashboard)/notifications/page.tsx`](<../../../app/(dashboard)/notifications/page.tsx>) — tabs (**All / Unread / Preferences**), type filter buttons, **`Progress`**, clear read / mark all read / refresh, feature components under **`src/components/feature/notifications/`**.

---

## 3. Dashboard UI kit (usage)

Patterns: **tabs** (`Tabs`), **checkboxes** (preferences), **badges** (type/priority), **buttons** (filters, actions), **`Progress`** (loading), **`Alert`** (errors), **`--c360-*`** layout — aligned with inbox / settings-style kit pages without shipping Bootstrap.

---

## 3b. `src/` layout (notifications)

| Area                | Location                                       |
| ------------------- | ---------------------------------------------- |
| **Route**           | `app/(dashboard)/notifications/page.tsx`       |
| **GraphQL**         | `src/graphql/notificationsOperations.ts`       |
| **Display helpers** | `src/lib/notificationDisplay.ts`               |
| **Service**         | `src/services/graphql/notificationsService.ts` |
| **Hooks**           | `src/hooks/useNotifications.ts`                |
| **Feature UI**      | `src/components/feature/notifications/*`       |

---

## 4. Smaller tasks (recommended order)

### Phase A — Contract & codegen

- [x] **Types** — `Notification`, `NotificationFilterInput`, `MarkReadInput`, `DeleteNotificationsInput`, `UpdateNotificationPreferencesInput`, `NotificationPreferences`, `PageInfo`.
- [x] **Operations file** — `notificationsOperations.ts`.

### Phase B — Service

- [x] **`list` / `get` / `unreadCount`** — wired; **`markNotificationAsRead`** + **`markNotificationsAsRead`**.
- [x] **`deleteNotifications`**, **`deleteAllRead`** (client loop).
- [x] **Preferences** — query + mutation with codegen input type.

### Phase C — Hooks & UX

- [x] **`useNotifications`** — optional **`type`** filter; refetch unread after mark/delete.
- [x] **`useNotificationPreferences`** — partial **`update`**.
- [x] **Badge normalization** — lowercase-safe display keys + colors.

### Phase D — UI

- [x] **Feature split** — `NotificationCard`, `NotificationPreferencesTab`, `NotificationTypeFilter`.
- [x] **Loading / errors** — `Progress`, `Alert` + retry.
- [x] **Pagination** — `useNotifications({ pageSize })` + **Load more** (`offset` / `hasNext`).
- [x] **Deep link** — `/notifications/[id]` loads **`notification`** + **`markNotificationAsRead`** when unread.

### Phase E — QA

- [ ] **E2E** — filter types, preferences toggles, mark all, clear read.
- [ ] **Connectra / gateway errors** — empty states _(incremental)_.

---

## 5. Summary

- **GraphQL** for notifications is **centralized**, **codegen-first**, and includes **`notification(single)`** for future detail routes.
- **UI** covers **tabs**, **type filter**, **normalized badges**, **job-less flows** (unlike export jobs), and **partial preference updates**.
- **Follow-ups:** **E2E**; incremental **gateway error** empty states.
