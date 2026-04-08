> **Source:** split from [`extended-module-notes.md`](../extended-module-notes.md) (index). Module order follows the original monolith.
> **22_CAMPAIGNS_MODULE.md** vs **`contact360.io/api`** and **`contact360.io/app`**, plus Dashboard UI kit mapping.

---

## Module tracking

**Checkboxes** in **Phase** subsections below: `[x]` done · `[ ]` not done. Tag open items when useful: _(planned)_ roadmap · _(gap)_ known mismatch vs gateway · _(pending)_ blocked or unscheduled.

Full legend: [`README.md`](README.md#task-tracking-graphql--ui).

| Track       | What to update                                                                       |
| ----------- | ------------------------------------------------------------------------------------ |
| **GraphQL** | Operations, variables, and `Gql*` / codegen alignment vs `contact360.io/api` schema. |
| **UI**      | Routes under `app/`, feature components, Dashboard UI kit patterns, copy/UX.         |

## Roll-up (this module)

|             | GraphQL | UI                               |
| ----------- | ------- | -------------------------------- |
| **Primary** | [x]     | [x] _(read-only + placeholders)_ |

> **2026-04-06:** Feature components `CampaignRow`, `CampaignWriteActions` (writes still gated until satellite exposes mutations).
> **2026-04-06 (update):** `parseCampaigns` + `mapCampaignSatelliteToListRow`, `useCampaignsList`, `fetchSatelliteBundle`, `/campaigns/[id]` placeholder, `campaigns` feature gate, shared satellite error helper, View links wired.

**Codegen:** `CampaignModuleQuery` — root `query.campaignSatellite` (`campaigns`, `sequences`, `campaignTemplates` as JSON).

## What 22 says (two layers)

### A) **Shipped on the Contact360 gateway (actual)**

- Single namespace: **`campaignSatellite`** on root **`Query`** (not `Mutation`).
- **Three fields, all `JSON!`:** `campaigns`, `sequences`, `campaignTemplates`.
- **Auth:** Bearer required (`require_auth` in code).
- **Env:** `CAMPAIGN_API_URL`, `CAMPAIGN_API_KEY`, `CAMPAIGN_API_TIMEOUT`.
- If URL is unset, resolvers return **`[]`** (empty list).
- **No** create/update/delete campaigns via GraphQL on the gateway today.

### B) **Planned (era 10.x) — not on gateway**

Typed operations: `createCampaign`, `getCampaign`, `listCampaigns`, `updateCampaign`, `deleteCampaign`, `getCampaignStats`, plus `CreateCampaignInput`, `Campaign`, enums, etc.

### C) **Direct REST (Go satellite)**

`POST /campaign` and others; doc points to the service repo for writes.

---

## API implementation (`contact360.io/api`)

Matches **22 section A**:

```20:70:d:\code\ayan\contact\contact360.io\api\app\graphql\modules\campaigns\queries.py
    async def campaigns(self, info: strawberry.Info) -> JSON:
        """List campaigns from satellite GET /campaigns."""
        require_auth(info.context.user)
        if not settings.CAMPAIGN_API_URL:
            ...
            return []
        ...
                return await client.list_campaigns()
    ...
    async def sequences(self, info: strawberry.Info) -> JSON:
        """List sequences from satellite GET /sequences."""
        ...
    @strawberry.field(name="campaignTemplates")
    async def campaign_templates(self, info: strawberry.Info) -> JSON:
        """List campaign templates from satellite GET /campaign-templates."""
```

`CampaignServiceClient` calls **`GET /campaigns`**, **`GET /sequences`**, **`GET /campaign-templates`** and returns whatever JSON the HTTP client returns (may be an **object** or **array** — not normalized in the gateway).

---

## App implementation (`contact360.io/app`)

### `campaignSatelliteService.ts`

- **`listCampaigns`**, **`listSequences`**, **`listTemplates`**, plus **`fetchSatelliteBundle`** (one query).
- Return types are **`unknown`** JSON — **`parse*`** helpers normalize to typed rows where used.

### `/campaigns` page

- Loads **`listCampaigns()`**; **`parseCampaigns`** unwraps arrays or **`campaigns` / `data` / `items`**; **`mapCampaignSatelliteToListRow`** maps nested **`campaignData`** and metrics.
- **`useCampaignsList`** — loading, error, **`notConfigured`** (satellite down / env); **`DashboardPageLayout`**.
- **View** → **`/campaigns/[id]`** placeholder (no `getCampaign` on gateway yet). **Pause / resume / analytics / delete** still disabled.
- **`checkAccess('campaigns')`** — Professional+ (else billing upsell).

### `/campaigns/templates`

- **`listTemplates()`** + **`parseCampaignTemplates`**; **`isCampaignSatelliteUnavailableMessage`** for degraded state.

### `/campaigns/sequences`

- **`listSequences()`** + **`parseSequences`**; same error helper.

### `/campaigns/new`

- Wizard UI; launch toast states **no API enqueue** (gateway has no create mutation).

### Codegen (`GqlCampaign`, `GqlCampaignConnection`, …)

- Describes a **typed** campaign model (connection, sequences, templates with fixed fields) that **does not exist** on the gateway; **`campaignSatellite`** returns **scalar JSON**. Those generated types are **misleading** for the current API.

---

## Dashboard UI kit mapping

| Current / planned UX    | Kit-style direction                                                                                                                      |
| ----------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| **Campaign list**       | Data table + badges (`ecom-*` / datatables patterns); search bar (forms).                                                                |
| **Tabs**                | Overview \| Templates \| Sequences (top nav) using kit tab styles.                                                                       |
| **New campaign wizard** | `form-wizard.html` pattern; **progress** = step indicator (you already have steps); radios for schedule/audience.                        |
| **Metrics**             | `chart-chartjs.html` / widgets for opens/clicks when real stats exist.                                                                   |
| **Empty / degraded**    | Callout when `CAMPAIGN_API_URL` unset (all empty) vs real empty list vs 503.                                                             |
| **Write flows**         | Until gateway mutations exist: **“Open campaign service”** or server-side proxy to **REST** `POST /campaign` with clear CORS/auth story. |

---

## Smaller tasks (phased)

### Phase A — Contract and data shape

- [ ] **Document actual satellite JSON** (sample `GET /campaigns` / `/sequences` / `/campaign-templates` responses) next to 22 or in OpenAPI from the Go service.
- [x] **Normalize in app:** **`extractArray`** + **`parseCampaigns` / `parseSequences` / `parseCampaignTemplates`**.
- [ ] **Remove or quarantine** stale **`GqlCampaign*` / connection** types from codegen docs unless/until typed GraphQL ships.

### Phase B — `campaignSatelliteService` + types

- [x] **`CampaignSatelliteCampaign`** / sequence / template interfaces in **`campaignSatelliteShapes.ts`** (best-effort).
- [x] **`parseCampaigns`** (and siblings) + **`mapCampaignSatelliteToListRow`** for the list table.
- [x] **`fetchSatelliteBundle`** — single **`campaignSatellite { campaigns sequences campaignTemplates }`** query.

### Phase C — Wire UI to real data

- [x] **`/campaigns/templates`** — **`listTemplates()`** + parsing + empty / not-configured states.
- [x] **`/campaigns/sequences`** — **`listSequences()`** + parsing; step chips from **`steps`** count.
- [x] **`/campaigns`** — **non-array** JSON via **`parseCampaigns`**; **View** → **`/campaigns/[id]`** placeholder until detail API exists.

### Phase D — Writes (product + backend)

- [ ] **Decide path:** proxy **`POST /campaign`** through Next API route or gateway mutation (era 10.x).
- [ ] **`/campaigns/new`:** map form → **REST body** (`template_id`, `name`, `filepath`, `audience_source`, … per 22); handle **402/429** in UI.
- [ ] **Pause/resume/delete:** only after satellite + gateway (or BFF) expose safe operations.

### Phase E — Hooks, context, access

- [x] **`useCampaignsList`** — list refresh + satellite-unavailable detection.
- [x] **Feature gate:** **`checkAccess('campaigns')`** on **`/campaigns`** (aligns with **`featureAccess`**).
- [x] **`isCampaignSatelliteUnavailableMessage`** — shared 503 / env strings; templates & sequences use it.

### Phase F — Dashboard kit polish

- [ ] Align table, wizard steps, and **progress bar** with kit spacing/tokens (`--c360-*` already in use).
- [ ] **Charts** for open/click rates when payload includes metrics (or when `getCampaignStats` exists later).

---

## Summary

- **22** matches the **implemented** gateway: **`campaignSatellite.campaigns | sequences | campaignTemplates`** as **authenticated JSON** only; **mutations and typed `Campaign` GraphQL are planned, not shipped**.
- **App:** **templates** and **sequences** use live JSON lists; **campaigns** list uses **parse + map**; **new campaign** wizard and **row writes** remain **non-functional** until API/BFF; **codegen `Campaign*` object types** remain misleading vs **`JSON`** scalars.
- **Next:** **BFF or gateway** for **create/update**; replace **`/campaigns/[id]`** placeholder when **`getCampaign`** ships; optional **Zod** for satellite payloads.

If you want implementation work, switch to agent mode and say whether the satellite returns a **bare array** or a **wrapped object** (a sample JSON helps).
