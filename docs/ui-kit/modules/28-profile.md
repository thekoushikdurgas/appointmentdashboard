> **Source:** split from [`extended-module-notes.md`](../extended-module-notes.md) (index). Module order follows the original monolith.
> Here is a structured analysis of **28_PROFILE_MODULE.md** vs **`contact360.io/api`** and **`contact360.io/app`**, plus Dashboard UI kit mapping and a phased task list.

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

> **2026-04-06:** GraphQL document uses `CreateApiKeyInput` (was `CreateAPIKeyInput`).

**Codegen:** `ProfileQuery`, `ProfileMutation` — root `query.profile`, `mutation.profile`.

## What 28 defines

- **Namespace:** `profile` on **Query** and **Mutation** (under your root types).
- **Queries:** `listAPIKeys` → `APIKeyList`; `listSessions` → `SessionList`; `listTeamMembers` → `TeamList` (doc: `TeamList` with `members` + `total`).
- **Mutations:** `createAPIKey`, `deleteAPIKey`, `revokeSession`, `revokeAllOtherSessions`, `inviteTeamMember`, `updateTeamMemberRole`, `removeTeamMember`.
- **Inputs:** `CreateAPIKeyInput` (`name`, `readAccess`, `writeAccess`, `expiresAt`); `InviteTeamMemberInput` (`email`, `role`).
- **Auth / isolation:** All operations require auth; API keys and sessions scoped to the user; team ops **owner-only** per doc.
- **Doc examples** use **snake_case** field names (`read_access`, `created_at`); typical Strawberry schemas expose **camelCase** to clients (`readAccess`, `createdAt`).

---

## API implementation (`contact360.io/api`)

`app/graphql/modules/profile/` implements the same surface as 28:

- Types in **`types.py`** use Python **snake_case** (`read_access`, `created_at`, `is_current`, …) → GraphQL usually **`readAccess`**, **`createdAt`**, **`isCurrent`**.
- **`createAPIKey`** returns an **`APIKey`** with **`key`** set to the full secret once (mutations patch `result.key` after `from_model`).
- **`APIKey.from_model`** sets **`key=None`** for normal loads; only create returns the plaintext key — matches 28.
- **`revokeAllOtherSessions`** returns **`bool`** (not a count).
- **`updateTeamMemberRole`** and **`removeTeamMember`** take parameter **`id`** (GraphQL argument name **`id`**, not `memberId`).

---

## App implementation (`contact360.io/app`)

### What aligns well

- **`profileService`** operation names and nesting (`profile { listAPIKeys … }`, etc.) match 28.
- **Field selections** use **camelCase** (`createdAt`, `readAccess`, …), consistent with a camelCase schema.
- **`useProfile`** loads **API keys, sessions, team** in parallel and exposes CRUD-style helpers.
- **`/profile` page** uses **tabs** (General, Security & 2FA, API Keys, Sessions, Team) and composes **`useProfile`** + **`TwoFactorPanel`** (security tab) + **`usersService`** — good modular UX.

- **`graphql/generated/types.ts`** **`GqlAPIKey`**, **`GqlSession`**, **`GqlTeamMember`**, etc. are **aligned** with the client’s row types (closer than many other modules).

### Resolved (GraphQL client)

1. **`updateTeamMemberRole`** / **`removeTeamMember`** — Documents use **`id: $id`** (see **`profileService.ts`**).

2. **`revokeAllOtherSessions`** — Typed as **`boolean`** on the mutation result.

3. **`inviteTeamMember`** — **`InviteTeamMemberInput`** only **`email`** + **`role`**; **`createApiKey`** uses **`CreateApiKeyInput`** from **`generated/types.ts`**.

### Product notes

- **Team tab:** **`ProfileTeamTab`** uses **`onUpdateRole`** with **`Member` / `Admin` / `Owner`**, invite role **select**, remove **confirm modal**, owner-only empty state.
- **403** on **`listTeamMembers`:** **`useProfile`** sets **`teamForbidden`**; UI shows owner-only message.

---

## Dashboard UI kit mapping

| 28 area      | Kit-style pattern                                                                                                                            |
| ------------ | -------------------------------------------------------------------------------------------------------------------------------------------- |
| **Tabs**     | You already mirror kit nav: horizontal tabs with icons (`User`, `Shield`, `Key`, …).                                                         |
| **API keys** | Table or card list; **modal** for create; **checkboxes** for read/write; **date picker** for `expiresAt`; **copy** + “shown once” **Alert**. |
| **Sessions** | Table with UA/IP; **badge** “This device”; **secondary button** revoke; **danger** “Sign out others”.                                        |
| **Team**     | Table + **modal** invite; **Select** or **radio** for role; confirm **modal** for remove.                                                    |
| **Progress** | Optional **progress bar** during parallel **`fetchAll`** or bulk revoke.                                                                     |
| **Forms**    | `form-element` patterns for General tab (name, job, bio) via **`usersService`**, separate from **`profile`** GraphQL.                        |

---

## Smaller tasks (phased)

### Phase A — GraphQL correctness (blocking)

- [x] **`updateTeamMemberRole(id: $id)`** / **`removeTeamMember(id: $id)`**.
- [x] **`revokeAllOtherSessions`** typed **`boolean`**.
- [x] **`createApiKey`** / **`useProfile.createApiKey`** use **`CreateApiKeyInput`**.

### Phase B — UX and errors

- [x] Owner-only **403** empty state for team.
- [x] **Create API key:** one-time secret **Alert**, **copy**, **download .txt**; **read/write** checkboxes; optional **datetime-local** → ISO **`expiresAt`**.
- [x] **Confirm modals:** delete key, revoke session, revoke all others, remove team member.

### Phase C — Completeness vs 28

- [x] **Team** row **role** `select` + invite **role** + **canonical** role strings.
- [x] **`expiresAt`** conversion via **`expiresAtFromDatetimeLocal`** in **`profileUtils.ts`**.
- [x] Subtitle copy references **owner-only** team APIs.

### Phase D — Hooks / architecture

- [ ] Split **`useProfileApiKeys`**, **`useProfileSessions`**, **`useProfileTeam`** if you want independent loading/error (smaller surfaces).
- [ ] Optional **`ProfileSecurityContext`** only if multiple routes need the same profile security state.

### Phase E — Docs

- [ ] Update **28** examples to show **camelCase** field names for GraphQL clients, or add a note that SDL introspection uses camelCase while the markdown uses snake_case for readability.

---

## Summary

- **28** matches **`contact360.io/api`**: **profile** operations for **keys, sessions, team**, including **one-time plaintext `key`** on **`createAPIKey`**.
- **App:** **`profileService`** uses **`CreateApiKeyInput`**; team mutations **`id: $id`**; **`revokeAllOtherSessions`** result typed **`boolean`**. Tabs: **`ProfileApiKeysTab`** (scopes, optional expiry, copy/download, delete confirm), **`ProfileSessionsTab`** (revoke confirms), **`ProfileTeamTab`** (invite role, row roles, remove confirm, owner-only state).
- **Follow-ups:** optional hook split (**Phase D**), **E2E** tests, **Phase E** doc example refresh for **camelCase** vs markdown **snake_case**.
