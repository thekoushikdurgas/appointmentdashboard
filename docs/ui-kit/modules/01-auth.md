> **Source:** split from [`extended-module-notes.md`](../extended-module-notes.md) (index). Module order follows the original monolith.

Here is a concise synthesis of **API + doc + app + UI kit**, then a **task breakdown** you can execute in order.

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

> **2026-04-06:** Centralized documents in `src/graphql/authOperations.ts`; `pageType` on login/register/refresh; client geo hint on login (toggle); silent refresh merges `pages` via `authRefreshBridge`; `useAuthSession`; `AuthContext` delegates login/register to `authService`; login field errors + kit row (checkbox + forgot link). **Update:** auth UI split into `src/components/feature/auth/*`, `useLoginForm` / `useRegisterForm`, `styles/auth/auth-shell.css`; forgot-password page shows warning `Alert` until API exists.

**Codegen:** [`AuthQuery`](../../../src/graphql/generated/types.ts), [`AuthMutation`](../../../src/graphql/generated/types.ts) — root `query.auth`, `mutation.auth`.

## 1. What `01_AUTH_MODULE.md` defines (contract)

| Area           | Content                                                                                                                             |
| -------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| **Queries**    | `auth.me` → `User \| null` (optional auth). `auth.session` → `SessionInfo!` (**requires** Bearer; errors if anonymous).             |
| **Mutations**  | `login`, `register`, `refreshToken` take **`input`** + optional **`pageType: String`**; `logout` → `Boolean!` (requires auth).      |
| **Inputs**     | `LoginInput` / `RegisterInput`: `email`, `password`, optional `geolocation: GeolocationInput`. `RefreshTokenInput`: `refreshToken`. |
| **Outputs**    | `AuthPayload`: `accessToken`, `refreshToken`, `user: UserInfo`, `pages` (may be null/empty if DocsAI fetch fails).                  |
| **Wire names** | JSON variables use **camelCase** (`refreshToken`, `pageType`, nested `geolocation`).                                                |

The doc also explains **role → userType → pages** and optional **`pageType`** filter (`docs` | `marketing` | `dashboard`).

---

## 2. What the API actually implements

Python matches the doc: same fields, optional `page_type` on login/register/refresh, geolocation dict built from `GeolocationInput`, `logout` blacklists the **access** token from `Authorization`, `session` raises when unauthenticated.

```29:113:d:\code\ayan\contact\contact360.io\api\app\graphql\modules\auth\mutations.py
    async def login(
        self,
        input: LoginInput,
        info: strawberry.Info,
        page_type: str | None = None,
    ) -> AuthPayload:
        ...
            return AuthPayload(
                access_token=access_token,
                refresh_token=refresh_token,
                user=UserInfo(
                    uuid=strawberry.ID(user.uuid),
                    email=user.email,
                    name=user.name,
                    role=role,
                    user_type=docsai_user_type,
                ),
                pages=pages,
            )
```

```14:43:d:\code\ayan\contact\contact360.io\api\app\graphql\modules\auth\queries.py
    async def me(self, info: strawberry.Info) -> User | None:
        ...
    async def session(self, info: strawberry.Info) -> SessionInfo:
        ...
        if not user:
            raise UnauthorizedError("Authentication required")
```

---

## 3. What the app does today (gaps vs module)

**Aligned**

- Login/register/logout and **`auth { me }`** for full profile after sign-in are wired in `AuthContext` (via `authService` + `authOperations.ts`).
- `UserInfo` selection is centralized and matches the gateway type.
- **`pageType`** and **`geolocation`** on login/register match the gateway; refresh returns **`pages`** and updates sidebar state via **`authRefreshBridge`**.

```1:15:d:\code\ayan\contact\contact360.io\app\src\graphql\authSelections.ts
/**
 * GraphQL field selections aligned with the gateway `UserInfo` type
 * (`contact360.io/api/app/graphql/modules/auth/types.py`).
 * ...
 */
export const AUTH_PAYLOAD_USER_FIELDS = `
  uuid
  email
  name
  role
  userType
` as const;
```

- Token refresh calls **`auth.refreshToken`** (without auth header), with the same **`AuthPayload`** field selection as login.

**Remaining gaps vs `01_AUTH_MODULE.md`**

1. **`pageType` product use** — Wired as `DEFAULT_AUTH_PAGE_TYPE` in `src/lib/authDefaults.ts` (currently `null` = unfiltered). Set to `docs` / `marketing` / `dashboard` when nav should receive a filtered set only.
2. **Forgot password** — UI exists with an **in-page warning** (`Alert`) that no gateway mutation is wired; behavior remains simulated until the API exposes reset.
3. **E2E matrix** — Automated tests still optional; a **manual checklist** is documented in Phase D below.

---

## 3b. `src/` layout for auth (pages stay thin)

| Area               | Location                                                                                                                                                                          |
| ------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Route shell**    | `app/(auth)/layout.tsx`, `app/(auth)/login/page.tsx`, `app/(auth)/forgot-password/page.tsx`                                                                                       |
| **Feature UI**     | `src/components/feature/auth/*` (`AuthBrandHeader`, `AuthTabList`, `AuthLoginForm`, `AuthRegisterForm`, `AuthLoginFallback`)                                                      |
| **Form state**     | `src/hooks/useLoginForm.ts`, `src/hooks/useRegisterForm.ts`                                                                                                                       |
| **Auth shell CSS** | `src/styles/auth/auth-shell.css` (imported from `(auth)/layout`)                                                                                                                  |
| **Operations**     | `src/graphql/authOperations.ts`, `src/graphql/authSelections.ts`                                                                                                                  |
| **Runtime**        | `src/context/AuthContext.tsx`, `src/services/graphql/authService.ts`, `src/lib/graphqlClient.ts`, `src/lib/authRefreshBridge.ts`, `src/lib/authDefaults.ts`, `src/lib/authGeo.ts` |

---

## 4. Dashboard UI kit → what to borrow (patterns, not Bootstrap drop-in)

`docs/frontend/ideas/Dashboard ui kit/page-login.html` encodes:

- Centered **auth shell** (full-height, single column).
- **Labeled** email/password fields, **primary block button**.
- Row: **checkbox** (“Remember…”) + **Forgot password** link.
- Footer: **Sign up** link.

Your app already uses **design tokens** (`c360-auth-card`, `--c360-*`) and tabbed login/register. The kit suggests **incremental** UX additions: remember-me (if you define behavior), clearer forgot-password placement, and form layout/rhythm consistent with `form-element` / validation pages in the same kit (labels, errors, spacing). You would **reimplement in React + your CSS variables**, not ship the kit’s Bootstrap/CSS bundle as-is.

---

## 5. Smaller tasks (modular, end-to-end)

### Phase A — Contract and types (auth module only)

- [x] **Codegen check** — Types live in `src/graphql/generated/types.ts` (`LoginInput`, `RegisterInput`, `RefreshTokenInput`, `GeolocationInput`, `AuthPayload`, `SessionInfo`, `UserInfo`, `AuthMutation*Args`); verify after `npm run codegen` when the API changes.
- [x] **Single source of truth for operations** — `src/graphql/authOperations.ts`: `AUTH_LOGIN_MUTATION`, `AUTH_REGISTER_MUTATION`, `AUTH_REFRESH_MUTATION`, `AUTH_LOGOUT_MUTATION`, `AUTH_ME_QUERY`, `AUTH_SESSION_QUERY` (variables `input` + `pageType` where applicable).
- [x] **Typed variables** — Use generated `*Input` / `AuthMutation*Args` as reference; `authService` builds variables matching the schema.
- [x] **Optional `pageType`** — Passed on login, register, and refresh (`DEFAULT_AUTH_PAGE_TYPE` in `src/lib/authDefaults.ts`; override via `AuthLoginOptions` / `AuthRegisterOptions`).
- [x] **Optional `geolocation` on login** — `buildClientGeolocationHint()` in `src/lib/authGeo.ts`; user can disable via “Stay signed in…” (`attachClientGeo: false`).
- [x] **Refresh and `pages`** — `graphqlClient` refresh uses full `AuthPayload` selection; `notifyAuthPagesRefreshed` updates `AuthContext` `accessiblePages`.

### Phase B — Context, hooks, utilities

- [x] **Thin `AuthContext`** — Login/register via `authService`; `me` / logout use `authOperations` strings (no duplicate login/register documents).
- [x] **`useAuthSession`** — `src/hooks/useAuthSession.ts` → `auth.session` when authenticated.
- [x] **`useLogin` / `useRegister` (form hooks)** — `useLoginForm` / `useRegisterForm` own field state, validation, and submit wiring; `/login` composes them with feature components.
- [x] **Remember me / stay signed in** — Checkbox controls whether client geo is sent with login (tokens unchanged; still `localStorage`).

### Phase C — UI/UX aligned with kit + contract

- [x] **Login/register layout** — Login: checkbox + forgot link row, full-width submit, `c360-*` tokens preserved.
- [x] **Loading / progress** — Submit uses existing `Button` `loading` prop.
- [x] **Errors** — `getGraphQLFieldErrors` / `firstFieldMessage` for inline `Input` errors; gateway toasts unchanged.
- [x] **Accessibility** — `aria-selected` on tabs; `Input` `aria-invalid` via `error` prop; password toggle `aria-label` unchanged.
- [x] **Forgot password** — **Placeholder** until gateway mutation; `/forgot-password` shows a **warning `Alert`** (no API call); submit still simulates delay only.

### Phase D — Integration and verification

- [x] **Manual smoke matrix** (documented; run before releases):
  - [ ] Login success → dashboard (or intended post-login route).
  - [ ] Login failure → inline field errors / toast as implemented.
  - [ ] Register success → auto sign-in or expected redirect.
  - [ ] Logout → tokens cleared; protected routes redirect to login.
  - [ ] Expired access + valid refresh → silent refresh; session continues.
  - [ ] Refresh failure (revoked refresh) → redirect to login.
- [ ] **Automated E2E** — Optional Playwright/Cypress suite for the above (not required for doc parity).
- [ ] **`accessiblePages` consumer** — Test nav with `DEFAULT_AUTH_PAGE_TYPE` set vs `null` when enabling filtered `pageType`.

---

## 6. Summary

- The **API and `01_AUTH_MODULE.md`** align with the app for **login/register/logout/me**, optional **`pageType`**, **geolocation on login** (client hint), **full `AuthPayload` on refresh** (tokens + `pages` sync), and an optional **`useAuthSession`** hook for **`auth.session`**.
- The **Dashboard UI kit** patterns on login include the **checkbox + forgot password** row, **inline field errors**, **progress while submitting**, and the **centered auth shell** (`c360-auth-*` + `auth-shell.css`).
- **Forgot password** remains a **UI stub** with a visible **API-not-wired** notice; **automated E2E** and **`pageType` nav filtering** tests remain optional follow-ups.
