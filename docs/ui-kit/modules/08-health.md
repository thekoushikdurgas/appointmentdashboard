> **Source:** split from [`extended-module-notes.md`](../extended-module-notes.md) (index). Module order follows the original monolith.

Here is a concise alignment of **`08_HEALTH_MODULE.md`**, **`contact360.io/api`**, **`contact360.io/app`**, the **Dashboard UI kit**, and a **task breakdown**.

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

**Codegen:** `HealthQuery` — root `query.health` (queries only; no `HealthMutation`).

## 1. What the Health module is (doc ↔ API)

**Location:** `contact360.io/api/app/graphql/modules/health/` — **queries only**, no mutations.

| Query                  | Auth                | Purpose                                                                                                                                                                                     |
| ---------------------- | ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **`apiMetadata`**      | None                | `ApiMetadata`: `name`, `version`, `docs`                                                                                                                                                    |
| **`apiHealth`**        | None                | `ApiHealth`: `status`, `environment` (config-driven “healthy”)                                                                                                                              |
| **`vqlHealth`**        | **Bearer required** | Connectra probe via `ConnectraClient.health_check()` → `VQLHealth` (`connectraEnabled`, `connectraStatus`, `connectraBaseUrl`, `connectraDetails`, `connectraError`, `monitoringAvailable`) |
| **`vqlStats`**         | **Bearer required** | `VQLStats`: `message`, `note` (placeholder text today)                                                                                                                                      |
| **`performanceStats`** | **SuperAdmin only** | `PerformanceStats`: `cache`, `slowQueries`, `database`, `s3`, `endpointPerformance`, `tokenBlacklistCleanup`                                                                                |

**REST (FastAPI):** Doc also lists **`GET /health`**, **`/health/db`**, etc. — useful for ops/load balancers; the **Next app** normally uses **GraphQL** only unless you add a dedicated probe client.

**Dependencies:** Connectra **`GET /health`** (with API key on sync server), s3storage **`GET /api/v1/health`** for the SuperAdmin **`performanceStats.s3`** branch, etc., as in the doc.

---

## 2. What the app implements today

**`healthService.ts`** + [`healthOperations.ts`](../../../src/graphql/healthOperations.ts)

- **`getSystemHealth()`** / **`getPublicHealth()`** — `apiHealth` + `apiMetadata` with **`skipAuth: true`**; **`SystemHealth`** includes raw **`apiMetadata`** / **`apiHealth`** for docs link and environment chip.
- **`getVqlHealth()`** — `vqlHealth` + `vqlStats` (requires auth). Types from **`generated/types`**.
- **`getPerformanceStats()`** — **`performanceStats`** including **`tokenBlacklistCleanup`** (SuperAdmin; expect **403** for others).

**`useHealthStatus`** — **removed** with the retired **`/status`** app page; use **Django admin** system status for operators. **`healthService`** remains for possible dashboard widgets.

**`status/page.tsx`** — **`DashboardPageLayout`**, kit **Tabs** (filter variant): **Overview** (public), **Connectra**, **Reference**. Overview: API card with **`resolveGatewayDocsUrl`**, incidents empty copy. **Operations** (performance stats / token cleanup) was removed from the app — use Django admin / gateway tools.

**Remaining gaps vs ideal doc:** **Incidents** are still not sourced from a real incident pipeline; **overview** uptime/latency may remain simplified until metrics exist.

---

## 3. Types and variables (checklist)

- **Public:** no variables; query `health { apiMetadata { name version docs } apiHealth { status environment } }`.
- **Authenticated:** same `health` selection adding `vqlHealth { … }`, `vqlStats { message note }` — requires **`Authorization`** (your `graphqlClient` already supports tokens).
- **SuperAdmin:** add `performanceStats { cache { … } slowQueries { … } database { … } s3 { … } endpointPerformance { … } tokenBlacklistCleanup { … } }` — use **camelCase** in GraphQL (e.g. `slowQueries`, `endpointPerformance`, `tokenBlacklistCleanup`).

Align TS types with **codegen** or hand-written interfaces matching **`health/types.py`** field names after Strawberry’s camelCase.

---

## 4. Dashboard UI kit (how to use it)

- **`widget-basic.html`**: KPI cards for **API**, **Connectra**, **DB pool**, **S3**, **cache hit rate**.
- **Tables / lists**: slow endpoints, incident-style blocks (if you later source real incidents from elsewhere).
- **Progress / badges**: overall status strip, per-row **Badge** (you already use `CheckCircle` / `AlertTriangle`).
- **Tabs (optional):** “Overview (public)” | “Platform (signed in)” | “Operations (SuperAdmin)” to match **auth tiers** without crowding one page.

Keep **`--c360-*`** and existing **`Card`, `Button`, `Alert`, `Skeleton`**.

---

## 5. Smaller tasks (recommended order)

### Phase A — Contract & services

- [x] **Codegen / introspection** — `PerformanceStats.tokenBlacklistCleanup` aligned with **`generated/types`**; query in **`healthOperations.ts`**.
- [x] **`healthService` exposes gateway health slices** — public, VQL, performance (+ **`tokenBlacklistCleanup`**).
- [x] **Optional split** — **`getPublicHealth()`** alias added; **403** still surfaced in Operations tab copy.

### Phase B — Mapping to UI model

- [ ] **Derive richer `ServiceHealth[]`** — Uptime on overview remains indicative until SLO metrics exist; DB/S3 live under Operations tab.
- [x] **Clarify `incidents`** — Overview **Incidents** card always shown with **“No incidents reported…”** copy when list is empty.

### Phase C — Hooks & page behavior

- [x] _(retired)_ **`/status`** app route — replaced by **admin** operator status; hooks **`usePublicHealth` / `useVqlHealthData` / `useHealthStatus`** removed from the app client.
- [x] **`status/page.tsx` tabs** — Same three slices; **Tabs** UI component + **`DashboardPageLayout`**.

### Phase D — UX (kit-aligned)

- [ ] **Overall banner** — Combine API + Connectra into one strip (today: overview = public API only).
- [x] **SuperAdmin dashboard** — Cache (incl. **Progress** hit rate), DB, slow queries, S3, **token blacklist cleanup**, endpoints.
- [x] **Refresh** — Manual per tab + overview **60s** poll; **“Last checked”** on banner (client timestamp of successful public fetch).

### Phase E — Ops & docs

- [x] **Link `apiMetadata.docs`** — **`resolveGatewayDocsUrl`** + **API docs** control on overview.
- [ ] **Optional:** REST **`GET /health`** probe route — only if product needs it.

---

## 6. Summary

- **`08_HEALTH_MODULE.md`** and **`health/queries.py`** define **five** queries with **clear auth tiers** and rich **`performanceStats`** for SuperAdmin.
- **`healthService`** still documents **public**, **Connectra (VQL)**, and **SuperAdmin performance** slices for callers; the **dedicated product `/status` page** was **removed** (use **Django admin** for operator health).
- **Remaining:** richer **incidents**, optional **hook** abstraction, and **overview** metrics that are less synthetic when product defines SLOs.

**Dashboard UI kit** fits **widget cards**, **badges**, **tabs** for tiered visibility, and future **charts** if you add metrics over time.
