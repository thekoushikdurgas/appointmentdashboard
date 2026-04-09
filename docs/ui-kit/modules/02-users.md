> **Source:** split from [`extended-module-notes.md`](../extended-module-notes.md) (index). Module order follows the original monolith.
> Here is a concise alignment of **`02_USERS_MODULE.md`**, the **Python Users module**, what **`contact360.io/app`** actually does, how that relates to the **Dashboard UI kit**, and a **task list** you can execute in order.

---

## Module tracking

**Checkboxes** in **Phase** subsections below: `[x]` done · `[ ]` not done. Tag open items when useful: _(planned)_ roadmap · _(gap)_ known mismatch vs gateway · _(pending)_ blocked or unscheduled.

Full legend: [`README.md`](README.md#task-tracking-graphql--ui).

| Track       | What to update                                                                       |
| ----------- | ------------------------------------------------------------------------------------ |
| **GraphQL** | Operations, variables, and `Gql*` / codegen alignment vs `contact360.io/api` schema. |
| **UI**      | Routes under `app/`, feature components, Dashboard UI kit patterns, copy/UX.         |

## Roll-up (this module)

|             | GraphQL         | UI              |
| ----------- | --------------- | --------------- |
| **Primary** | [x] _(partial)_ | [x] _(partial)_ |

> **2026-04-06:** `GET_USER_STATS` aligned with `AdminUserStats` (no removed counter fields).
>
> **2026-04-06 (profile pass):** `users.uploadAvatar` uses `UploadAvatarInput` (`fileData` / `filePath`); `users.updateUser` wired for display name; `auth.me` profile fields shared via `USERS_PROFILE_FIELDS`; `AuthUser` carries `job_title`, `bio`, `timezone`, `avatar_url`; General tab uses `useProfileGeneral`, timezone + photo upload + `Progress`; header avatar uses `resolveProfileAvatarSrc`; `usersOperations` adds `users.user` / `users.users` / `users.userStats` service helpers.

**Codegen:** [`UserQuery`](../../../src/graphql/generated/types.ts), [`UserMutation`](../../../src/graphql/generated/types.ts), [`UpdateProfileInput`](../../../src/graphql/generated/types.ts), [`UpdateUserInput`](../../../src/graphql/generated/types.ts), [`UploadAvatarInput`](../../../src/graphql/generated/types.ts), [`UserStats`](../../../src/graphql/generated/types.ts), [`AdminUserStats`](../../../src/graphql/generated/types.ts) — root `query.users`, `mutation.users` vs `query.admin` for admin list/stats.

## 1. What the Users module is (contract)

Under the root field **`users`**, the doc and API agree on this shape:

| Operation                                              | Parameters                      | Returns                                                                                                                            |
| ------------------------------------------------------ | ------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| **Query `user`**                                       | `uuid: ID!`                     | `User!` (self or admin viewing others)                                                                                             |
| **Query `users`**                                      | `limit`, `offset`               | `[User!]!` (Admin/SuperAdmin)                                                                                                      |
| **Query `userStats`**                                  | —                               | `UserStats!` (Admin/SuperAdmin): totals + **`usersByRole` / `usersBySubscription` as lists** of `{ role/subscriptionPlan, count }` |
| **Mutation `updateProfile`**                           | `UpdateProfileInput!`           | `UserProfile!` (`jobTitle`, `bio`, `timezone`, `notifications` JSON)                                                               |
| **Mutation `uploadAvatar`**                            | `UploadAvatarInput!`            | `UserProfile!` — **`fileData` and/or `filePath`** (camelCase over the wire), exactly one source                                    |
| **Mutation `updateUser`**                              | `UpdateUserInput!`              | `User!` (`name`, `email` optional)                                                                                                 |
| **Mutations `promoteToAdmin` / `promoteToSuperAdmin`** | admin input types with `userId` | `User!` (SuperAdmin only)                                                                                                          |

Python names use snake_case; GraphQL exposes **camelCase** (`jobTitle`, `fileData`, `userStats`, etc.).

---

## 2. Important: two different “user stats” surfaces in the API

The **Users** module exposes **`users { userStats }`** → `UserStats` with **structured lists** (`UserRoleCount`, `UserSubscriptionCount`).

The **Admin** module exposes **`admin { userStats }`** → `AdminUserStats`:

- `totalUsers`, `activeUsers`, `usersByRole` (JSON map), `usersByPlan` (JSON map) — see `contact360.io/api/app/graphql/modules/admin/types.py`.

**Admin stats in the app:** use **`usersService.getUsersNamespaceUserStats()`** for **list-based** `UserStats` when a widget should match **`02_USERS_MODULE.md`** literally. **`admin.userStats`** is consumed from **Django `admin_ops`**, not the Next.js client.

---

## 3. What the app does today — gaps vs module + doc

### Aligned or partially aligned

- **`users.updateProfile`** — `usersService.updateProfile` with full `UserProfile` selection; variables typed as **`UpdateProfileInput`**.
- **`users.updateUser`** — `usersService.updateUser`; General tab saves **display name** when it changes.
- **`users.uploadAvatar`** — `fileData` (browser **data URL** / base64 accepted by gateway) or `filePath`; returns full **`UserProfile`** selection.
- **`auth { me }`** — Canonical session user + nested profile; profile field list is **one string** [`USERS_PROFILE_FIELDS`](../../../src/graphql/usersOperations.ts) reused in **`authOperations`** and **`usersService`** to avoid drift.
- **`admin.userStats`** — Query matches **`AdminUserStats`** (no obsolete counter fields).
- **`admin.users`** — Listing/pagination for admin UI; **`UserFilterInput`** in the API is currently **limit/offset only** (no `search` in schema).

### Optional / product choices

1. **`users { user }` / `users { users }` / `users { userStats }`** — Implemented on **`usersService`** as **`getUserByUuid`**, **`listUsersNamespace`**, **`getUsersNamespaceUserStats`** for parity/tests; **admin `admin.*`** is for **Django ops** only.
2. **`promoteToAdmin` / `promoteToSuperAdmin`** — Not called from the app; **admin role changes** may use **`admin.updateUserRole`**; document as product choice.
3. **`notifications` JSON on `updateProfile`** — Not exposed as checkboxes yet; add when product defines keys.
4. **E2E matrix** — Still recommended (Phase E).

---

## 3b. `src/` layout (profile / users)

| Area                     | Location                                                                                   |
| ------------------------ | ------------------------------------------------------------------------------------------ |
| **Route**                | `app/(dashboard)/profile/page.tsx` — tabs, header, composes hooks + feature tabs           |
| **General tab UI**       | `src/components/feature/profile/ProfileInfoTab.tsx`                                        |
| **General tab logic**    | `src/hooks/useProfileGeneral.ts`                                                           |
| **Avatar helpers**       | `src/lib/profileAvatarUpload.ts`, `resolveProfileAvatarSrc` in `src/lib/utils.ts`          |
| **Users GraphQL docs**   | `src/graphql/usersOperations.ts`                                                           |
| **Services**             | `src/services/graphql/usersService.ts`                                                    |
| **Auth + profile shape** | `src/context/AuthContext.tsx` (`AuthUser` profile fields), `src/graphql/authOperations.ts` |

---

## 4. Dashboard UI kit — how to use it (without copying Bootstrap wholesale)

Relevant references:

- **`app-profile.html`** — Tabs, cards, form groups.
- **`form-element.html`**, **`form-validation-jquery.html`**, **`ui-button.html`** — Labels, validation, buttons.
- **`widget-basic.html`** — Stats cards for **`userStats`**.

Contact360: **`--c360-*` tokens**, **`Card` / `Input` / `Button` / `Tabs`**, **`Alert`**, **`Progress`** (indeterminate on avatar upload), accessible file input + secondary button pattern.

---

## 5. Smaller tasks (recommended order)

### Phase A — Contract and types (Users module)

- [x] **Codegen types** — `User`, `UserProfile`, `UserStats`, `UserRoleCount`, `UserSubscriptionCount`, `UpdateProfileInput`, `UpdateUserInput`, `UploadAvatarInput`, `AdminUserStats`, `UserFilterInput`.
- [x] **Split “Users vs Admin”** — `usersService` in app; `admin` GraphQL from Django `admin_ops`.
- [x] **`admin.userStats` query** — Matches **`AdminUserStats`**.
- [x] **`users { userStats }` (optional)** — `usersService.getUsersNamespaceUserStats()` for list-based stats.

### Phase B — Services and hooks (`users` namespace)

- [x] **`usersService`** — `me` (via `auth`), `updateProfile`, `updateUser`, `uploadAvatar`, plus **`getUserByUuid`**, **`listUsersNamespace`**, **`getUsersNamespaceUserStats`**.
- [x] **`uploadAvatar`** — `UploadAvatarInput`-shaped variables; full profile selection on response.
- [x] **`updateUser`** — Wrapped; profile General tab updates **name** when changed.
- [ ] **`notifications` on `updateProfile`** — UI toggles _(planned)_ when API keys are fixed.
- [x] **`useProfileGeneral`** — Load/sync from `AuthUser`, save name + profile, avatar upload + `refreshUser`.

### Phase C — Role mutations (doc vs product)

- [ ] **Promotions** — Either wire **`users.promoteToAdmin`** / **`promoteToSuperAdmin`** or keep **`admin.updateUserRole`** only and treat as canonical _(product)_.

### Phase D — UI/UX (Profile + admin users, kit-aligned)

- [x] **Profile General tab** — Name → `updateUser`; job title, bio, timezone → `updateProfile`; errors + success **`Alert`**; loading on save; **Change profile photo** + **`Progress`**.
- [x] **Avatar** — API **`avatar_url`** preferred in header via **`resolveProfileAvatarSrc`**; fallback to generated initials URL.
- [x] **Tabs** — Existing `c360-tabs` on profile route.
- [ ] **Admin stats widget using `users.userStats`** — Optional second chart source _(planned)_.
- [x] **Accessibility** — File input `aria-label`; labels on text fields.

### Phase E — Verification

- [ ] **Matrix test** — Non-admin: `me`, `updateProfile`, `updateUser`, `uploadAvatar`. Admin: `admin.users`, `admin.userStats`. Optional: `users.users`, `users.userStats`. SuperAdmin: promotions if enabled.
- [ ] **GraphQL error mapping** — Forbidden / validation copy in UI _(incremental)_.

---

## 6. Summary

- **`02_USERS_MODULE.md`** matches the gateway for **User**, **UserProfile**, **updateProfile**, **uploadAvatar**, **updateUser**, and **users** queries.
- The app uses **`auth.me`** for the signed-in user, **`users.*`** mutations for profile/avatar/name, **`admin.*`** for admin list and **JSON `userStats`**, and exposes **optional `usersService` helpers** for strict **`users.user` / `users.users` / `users.userStats`** parity.
- **Dashboard UI kit** patterns are reflected in the **profile General** flow (forms, alerts, progress, tabs).
- **Follow-ups:** **`notifications` UI**, **automated E2E**, optional **admin widget** on **`users.userStats`**, **promote** vs **`admin.updateUserRole`** product decision.
