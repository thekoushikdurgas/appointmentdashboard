> **Source:** split from [`extended-module-notes.md`](../extended-module-notes.md) (index). Module order follows the original monolith.
> **24_SEQUENCES_MODULE.md** vs **`contact360.io/api`** and **`contact360.io/app`**, plus Dashboard UI kit mapping.

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

**Codegen:** `CampaignModuleQuery.sequences` — root `query.campaignSatellite { sequences }` (JSON). Typed `GqlCampaignSequence` in codegen is **not** the live contract; use **`parseSequences`** / **`parseSequencesJson`** + **`CampaignSatelliteSequence`**.

## What 24 defines

### Shipped on the Contact360 gateway (actual)

| Surface         | Details                                                                                               |
| --------------- | ----------------------------------------------------------------------------------------------------- |
| **GraphQL**     | `query { campaignSatellite { sequences } }`                                                           |
| **Return type** | **`JSON!`** (payload from satellite **`GET /sequences`**, or **`[]`** if `CAMPAIGN_API_URL` is unset) |
| **Auth**        | Required (same as `campaigns` / `campaignTemplates` — `require_auth` in `campaigns/queries.py`)       |
| **Mutations**   | **None** under `campaignSatellite` for sequences                                                      |

So the “Sequences module” on the gateway is **not** a standalone `sequences { … }` root type; it is a **single JSON field** next to **`campaigns`** and **`campaignTemplates`**.

### Planned (not on gateway)

Typed operations: `createSequence`, `getSequence`, `listSequences`, `updateSequence`, `deleteSequence`, `triggerSequence`, `pauseSequence`, `resumeSequence`, plus `CreateSequenceInput`, `Sequence`, `SequenceStep`, enums — **era 10.x / service REST**, overlapping conceptually with read-only `campaignSatellite.sequences`.

---

## API implementation (`contact360.io/api`)

Sequences are implemented only as part of **`CampaignModuleQuery`**:

```38:52:d:\code\ayan\contact\contact360.io\api\app\graphql\modules\campaigns\queries.py
    @strawberry.field
    async def sequences(self, info: strawberry.Info) -> JSON:
        """List sequences from satellite GET /sequences."""
        require_auth(info.context.user)
        if not settings.CAMPAIGN_API_URL:
            return []
        try:
            async with CampaignServiceClient() as client:
                return await client.list_sequences()
```

This matches **24** exactly: **read-only JSON**, optional satellite, **no mutations** in this module.

---

## App implementation (`contact360.io/app`)

### `campaignSatelliteService.ts`

- **`listSequences()`** queries `campaignSatellite { sequences }` — aligned with **24** and the API.
- **`parseSequences`** / **`parseSequencesJson`** unwrap arrays or `{ data | items | sequences }` wrappers (same pattern as campaigns).

### `sequenceListMapping.ts`

- **`mapSequenceSatelliteToRow`**, **`sequenceStepCount`** (handles `steps` as number or array), **`sequenceActiveContacts`**, defensive field names.

### `useCampaignSequences.ts`

- Fetch, refresh, error, **`notConfigured`** (satellite unavailable message), **`clearError`**.

### `/campaigns/sequences` page

- **`DashboardPageLayout`**, same **`campaigns`** feature gate as **Campaigns**.
- **List** tab: live data, loading / empty / error / not-configured states; disabled **New sequence** / pause with honest titles.
- **Builder** tab: stub + warning (no gateway mutations).
- Info alert: read-only contract; no fake local mutations.

### Codegen (`GqlCampaignSequence`, etc.)

- Describes a **typed** sequence as if it were real GraphQL — **not** what the gateway returns today (**opaque `JSON`**). Prefer **`SequenceListRow`** / **`CampaignSatelliteSequence`** from parsed JSON.

---

## Dashboard UI kit mapping (by contract layer)

| Layer                  | UI (kit-style)                                                                                                                                                     |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Today: JSON list**   | Table or card list; **loading / empty / error**; unwrap if satellite returns `{ data: [...] }` vs raw array (same issue as campaigns).                             |
| **Step preview**       | Vertical **timeline** or nested cards (`widget-basic`); **Mail** / **Clock** / **GitBranch** icons.                                                                |
| **Future: builder**    | `form-wizard.html` + per-step cards; **numeric input** for `WAIT_DAYS`; **dropdown** for template on `SEND_EMAIL`; **radio** for branch conditions per 24’s table. |
| **Trigger / progress** | **Progress bar** during enqueue; status badges (`draft` / `active` / `paused`).                                                                                    |

---

## Smaller tasks (phased)

### Phase A — Align with **actual** GraphQL (24 + API)

- [x] **Document satellite JSON** (array vs wrapped object) via **`parseSequences`** / **`parseSequencesJson`**.
- [x] Wire **`/campaigns/sequences`** to **`campaignSatelliteService.listSequences()`** with loading/error/empty states.
- [x] **Map JSON → UI model** with **`sequenceListMapping`** (defensive optional fields).
- [x] **Disable or label** create / pause as **read-only** until mutations exist.

### Phase B — Service / hooks

- [x] **`useCampaignSequences()`** — fetch, refresh, error, clearError.
- [x] **`fetchSatelliteBundle`** already combines campaigns + sequences + templates for hub use.

### Phase C — Types and codegen

- [ ] Regenerate codegen from API; avoid treating **`GqlCampaignSequence`** as the live list contract.
- [ ] Update **`GRAPHQL_PARITY.md`** / internal docs if needed: sequences = **`campaignSatellite.sequences`**, not a root `Sequence` type.

### Phase D — When 10.x / REST is available

- [ ] Add **BFF or gateway** mutations per 24’s planned list; then implement **builder** and **detail** routes (`/campaigns/sequences/:id`).
- [ ] **Step editor** UI per 24’s “Sequence step UI elements”.
- [ ] **`triggerSequence`** wizard: audience source, confirmation, **progress** + polling.

### Phase E — Dashboard kit polish

- [x] **List | Builder** tabs (builder stub); kit-aligned cards and **badges**; **`--c360-*`** tokens.
- [ ] Richer table view, **progress** UX when triggers exist.

---

## Summary

- **24** matches the codebase: **sequences** are **only** **`campaignSatellite.sequences` → `JSON`**, **authenticated**, **no mutations** on the gateway.
- The **app** uses **`listSequences`**, **`parseSequences`**, **`useCampaignSequences`**, and honest UX for write actions.
- **Codegen `GqlCampaignSequence`** reflects a **planned** typed API, not the **shipped** one.
- **Next:** gateway mutations (Phase D), then builder/trigger flows and optional **GRAPHQL_PARITY** doc touch-up (Phase C).
