> **Source:** split from [`extended-module-notes.md`](../extended-module-notes.md) (index). Module order follows the original monolith.
> Cross-doc matrix for HTTP health envelopes vs GraphQL health (see [`08-health.md`](08-health.md)).

---

## Module tracking

**Checkboxes** in **Phase** subsections below: `[x]` done · `[ ]` not done. Tag open items when useful: _(planned)_ roadmap · _(gap)_ known mismatch vs gateway · _(pending)_ blocked or unscheduled.

Full legend: [`README.md`](README.md#task-tracking-graphql--ui).

| Track       | What to update                                                                       |
| ----------- | ------------------------------------------------------------------------------------ |
| **GraphQL** | Operations, variables, and `Gql*` / codegen alignment vs `contact360.io/api` schema. |
| **UI**      | Routes under `app/`, feature components, Dashboard UI kit patterns, copy/UX.         |

## Roll-up (this module)

|             | GraphQL                  | UI                          |
| ----------- | ------------------------ | --------------------------- |
| **Primary** | [x] _(via 08 / codegen)_ | [x] _(status page + hooks)_ |

**Codegen:** Not a separate namespace — use [`HealthQuery`](../../../src/graphql/generated/types.ts) via [`08-health.md`](08-health.md). This file tracks **REST envelope** documentation parity.

## What `18_HEALTH_ENVELOPE_MATRIX.md` actually is

It is **not** a separate GraphQL module. It:

1. **Freezes HTTP `/health`-style JSON** across **11 core services** (paths differ: `/health`, `/api/v1/health`, `/v1/health`, etc.).
2. Defines **three envelope families** (minimal Gin, service identity, component-aware with `diagnostics`).
3. Points **GraphQL** readers to **[08_HEALTH_MODULE.md](d:\code\ayan\contact\docs\backend\graphql.modules\08_HEALTH_MODULE.md)** and schema regeneration from `contact360.io/api`.

So “modular GraphQL” for health is **`app/graphql/modules/health/`** and is documented in **08**, not 18.

---

## API parity (gateway + GraphQL)

**REST `GET /health`** (`contact360.io/api/app/main.py`): returns `status`, `service`, `version` — matches the matrix row for the Contact360 gateway (doc explicitly allows **`"healthy"`** instead of `"ok"` in examples).

**GraphQL** (`queries.py` / `types.py`): aligns with **08** for `apiMetadata`, `apiHealth`, `vqlHealth`, `vqlStats`, `performanceStats`. **Implementation note:** `performanceStats` also returns **`token_blacklist_cleanup`** (`TokenBlacklistCleanupStats`); the long SDL snippet in 08 may be incomplete vs the live schema — worth verifying with `schema.as_str()`.

**Connectra envelope:** Resolver treats Connectra JSON `status == "ok"` as healthy and maps `uptime_seconds` / `uptime` — consistent with 08 / connectra examples.

**S3 storage:** Probes storage service; treats `status == "ok"` as in 08 — consistent with the matrix’s “minimal ok” style for that service.

---

## App parity (`contact360.io/app`)

| Area                                                   | State                                                                                                                                                                             |
| ------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **`healthService.ts`**                                 | **`apiHealth` + `apiMetadata`** (public), **`vqlHealth` + `vqlStats`**, **`performanceStats`** (+ `tokenBlacklistCleanup`); synthetic **one-row** `SystemHealth` for the gateway. |
| **`vqlHealth` / `vqlStats` / `performanceStats`**      | **Wired** in `healthOperations.ts` + `healthService`; Operations tab **SuperAdmin-gated** client-side.                                                                            |
| **Codegen `ApiHealth`** (`graphql/generated/types.ts`) | **`{ status, environment }`** — matches queries.                                                                                                                                  |
| **`/status` page**                                     | **Live** GraphQL data; **Reference** tab = static HTTP matrix; overview **Alert** explains scope (no mock board).                                                                 |

---

## Dashboard UI kit mapping (ideas folder)

The kit is a large static HTML/Bootstrap-style set (`form-element.html`, `chart-chartjs.html`, `widget-basic.html`, etc.). For this feature, sensible mappings:

- **Matrix table** → DataTables-style table or simple responsive table + badges (kit: datatables / basic tables).
- **Per-service status** → Cards + colored badges (you already use `Card`, `Badge`, `Button`, `Alert`).
- **Cache hit rate / pool usage** → Progress bars (`widget-basic` / Bootstrap progress) once `performanceStats` is exposed.
- **Charts** (optional trends) → `chart-chartjs.html` patterns; only if you add time-series data (not in 18/08 as-is).
- **Tabs** (Overview | VQL | SuperAdmin ops | Matrix) → kit nav/tabs patterns or your existing layout primitives.

---

## Smaller tasks (phased)

### Phase A — Docs & contracts

- [ ] **Treat 18 + 08 as one story:** Add a short cross-link in 18 that “frontend GraphQL types = 08; envelope matrix = HTTP only unless a probe API is added.”
- [ ] **Regenerate SDL** from `contact360.io/api` and **reconcile 08** with `token_blacklist_cleanup` (and any other drift).
- [ ] **Locate or add** `docker-compose.health-matrix.yml` (doc references it; it may not exist under `docs/` search) and document how CI runs acceptance checks 1–4.

### Phase B — App types & GraphQL client

- [x] **Codegen** — `ApiHealth` aligns with **`{ status, environment }`** (live schema); operations in `healthOperations.ts` match `HealthQuery`.
- [x] **`src/types/health.ts`** — re-exports generated health types + `SystemHealth` from `healthService`.
- [x] **`healthService`** — `getPublicHealth()` / `getSystemHealth()`, `getVqlHealth()`, `getPerformanceStats()` (403 surfaced in UI).

### Phase C — Hooks & UX truthfulness

- [x] **`usePublicHealth`**, **`useVqlHealthData`**, **`useHealthStatus`** (composed); performance stats / token cleanup live on the gateway and may be used from **Django admin** or scripts.
- [x] **`/status`** — Overview + Connectra + Reference; **Operations** tab removed from the app (use Django ops / gateway for SuperAdmin health tools).

### Phase D — Health envelope matrix in product (optional; 18-specific)

- [ ] **Decide transport:** Pure **ops** (docker compose + scripts) vs **in-app matrix**. Browsers cannot reliably `fetch` all internal service URLs (CORS); a **gateway or admin BFF** that probes configured URLs server-side is the usual pattern.
- [ ] **Backend probe module** (if in-app): e.g. configurable list `{ name, url, requiredFields[], family }` → normalized result `{ httpStatus, body, missingFields[] }` matching 18’s table + envelope families.
- [x] **UI (partial):** **Reference** tab on `/status` — static matrix + envelope families from this doc (no live HTTP probes).

### Phase E — Polish with Dashboard kit

- [ ] Extract **status badge / metric card / progress** subcomponents styled consistently with kit tokens you already mirror (`--c360-*`).
- [ ] Add **tabs** and, if needed, **Chart.js** (or existing app chart lib) only when you have series data.

---

## Summary

- **18** = **HTTP health envelopes + compose matrix**; **GraphQL health** = **08** + `app/graphql/modules/health/`.
- **Gateway REST and GraphQL** match the docs; **app** consumes public + authenticated health fields; **Reference** tab documents the HTTP matrix without implying live probes.
- **Modular implementation** = document linkage (A) → types + services (B) → hooks + status UI (C) → optional server-side probe API for live matrix (D) → kit components (E).

If you want, the next step in **agent mode** can be: regenerate schema diff, then patch `healthService` + `/status` + codegen in one focused PR.
