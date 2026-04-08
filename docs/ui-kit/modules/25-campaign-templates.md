> **Source:** split from [`extended-module-notes.md`](../extended-module-notes.md) (index). Module order follows the original monolith.
> **25_CAMPAIGN_TEMPLATES_MODULE.md** vs **`contact360.io/api`** and **`contact360.io/app`**, plus Dashboard UI kit mapping.

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

**Codegen:** `CampaignModuleQuery.campaignTemplates` — root `query.campaignSatellite { campaignTemplates }` (JSON). Typed **`GqlCampaignTemplate`** is **aspirational**; the live contract is **`parseCampaignTemplates`** / **`parseCampaignTemplatesJson`** + **`CampaignSatelliteTemplate`** / **`TemplateListRow`**.

## What 25 defines

### Shipped on the Contact360 gateway (actual)

| Item           | Detail                                                                                               |
| -------------- | ---------------------------------------------------------------------------------------------------- |
| **GraphQL**    | `query { campaignSatellite { campaignTemplates } }`                                                  |
| **Field name** | **`campaignTemplates`** (camelCase)                                                                  |
| **Return**     | **`JSON!`** from satellite **`GET /campaign-templates`**, or **`[]`** if `CAMPAIGN_API_URL` is unset |
| **Auth**       | Required (`require_auth` in `campaigns/queries.py`)                                                  |
| **Mutations**  | **None** for template CRUD on `campaignSatellite`                                                    |

Templates on the gateway are **read-only JSON**, same namespace as **campaigns** and **sequences** (`CampaignModuleQuery`).

### Planned (not on gateway)

Typed GraphQL + **direct REST** on the Go email campaign service: `POST /templates`, `POST /templates/:id/preview`, `POST /templates/generate`, plus planned mutations (`createCampaignTemplate`, `getCampaignTemplate`, etc.). **Variable reference** (`{{.FirstName}}`, …), **S3** layout, and **DB `templates`** table describe the **service**, not the gateway’s single JSON field.

---

## API implementation (`contact360.io/api`)

Matches **25**:

```55:63:d:\code\ayan\contact\contact360.io\api\app\graphql\modules\campaigns\queries.py
    @strawberry.field(name="campaignTemplates")
    async def campaign_templates(self, info: strawberry.Info) -> JSON:
        """List campaign templates from satellite GET /campaign-templates."""
        require_auth(info.context.user)
        if not settings.CAMPAIGN_API_URL:
            return []
        try:
            async with CampaignServiceClient() as client:
                return await client.list_campaign_templates()
```

`CampaignServiceClient.list_campaign_templates()` performs **`GET /campaign-templates`**; response shape is whatever the satellite returns (list or wrapped object — **not** normalized in the gateway).

---

## App implementation (`contact360.io/app`)

### `campaignSatelliteService.ts`

- **`listTemplates()`** queries `campaignSatellite { campaignTemplates }` — aligned with **25** and the API.
- **`parseCampaignTemplates`** / **`parseCampaignTemplatesJson`** unwrap arrays or `{ data | items | campaignTemplates | templates }` wrappers.

### `templateListMapping.ts`

- **`TemplateListRow`**, **`mapTemplateSatelliteToRow`**, **`templateHtmlBody`** (`body`, `html_body`, `htmlBody`, …).
- **`isAiGenerated`** from `is_ai_generated` / `isAiGenerated` when present.

### `useCampaignTemplates.ts`

- Fetch, refresh, **`notConfigured`**, **`clearError`**.

### `/campaigns/templates`

- **`DashboardPageLayout`**, **`campaigns`** feature gate (same as Campaigns).
- Live grid from **`useCampaignTemplates`**; loading / empty / error / not-configured.
- **Preview** modal: read-only subject + HTML body; merge-token **copy** buttons use Go-style **`{{.Field}}`** per backend doc; **no fake save** to local state.
- **New template** disabled with title explaining REST/mutations.

### `/campaigns/new` (wizard)

- **`useCampaignTemplates`** — **Select** options use satellite template **`id`** and label **`name — subject`**.
- Review step shows resolved template name; warning when satellite unconfigured.

### Codegen (`GqlCampaignTemplate`)

- Fixed shape in codegen — **not** the live **`JSON`** contract; use **`TemplateListRow`** for UI.

---

## Dashboard UI kit mapping (aligned to 25)

| 25 / product need    | Kit-style pattern                                                                   |
| -------------------- | ----------------------------------------------------------------------------------- |
| **Templates list**   | Card grid; **badge** for AI when **`is_ai_generated`** in payload.                  |
| **Template builder** | Future: split layout + editor; today preview is read-only with honest copy.         |
| **Subject + body**   | Preview shows subject + monospace HTML block when list payload includes body.       |
| **Variables**        | Copy buttons for **`{{.FirstName}}`**, **`{{.LastName}}`**, … (module 25 REST doc). |
| **Campaign wizard**  | **Select** populated from **`listTemplates()`** (satellite ids).                    |

---

## Smaller tasks (phased)

### Phase A — Live read path (gateway only)

- [x] **`parseCampaignTemplatesJson`** alias + **`extractArray`** unwrap (same as campaigns/sequences).
- [x] **`/campaigns/templates`** wired to **`listTemplates()`** with loading / empty / unavailable handling.
- [x] Map JSON → **`TemplateListRow`** (id, name, subject, category, AI flag).

### Phase B — Types and honesty in the UI

- [x] **`CampaignSatelliteTemplate`** / **`TemplateListRow`** for payloads; do not treat **`GqlCampaignTemplate`** as live contract.
- [x] **Create** disabled; **preview** read-only (no local “save” that mutates list).

### Phase C — Campaign wizard integration

- [x] **`/campaigns/new`** loads **`useCampaignTemplates()`** and replaces mock template **`Select`** options with satellite ids.

### Phase D — REST / 10.x features (when available)

- [ ] BFF or Next route → **`POST /templates`**, **`preview`**, **`generate`**.
- [ ] **`/campaigns/templates/:id/edit`**: fetch body, save, iframe/sandbox preview.

### Phase E — Hooks / reuse

- [x] **`useCampaignTemplates()`**.
- [ ] Shared **`TemplatePicker`** component if multiple callers need it beyond wizard + future sequences.

### Phase F — Dashboard kit polish

- [x] Grid + **`--c360-*`** tokens; **modal** preview pattern.
- [ ] Richer **TemplateGrid** / **AIPromptDrawer** when APIs exist.

---

## Summary

- **25** matches the gateway: **only** **`campaignSatellite.campaignTemplates`** as authenticated **`JSON`**; **no** template mutations on the gateway.
- The app uses **`listTemplates`**, **`parseCampaignTemplates`**, **`useCampaignTemplates`**, honest preview UX, and wizard **Select** bound to satellite template ids.
- **Codegen `GqlCampaignTemplate`** does not reflect the **actual** contract.
- **Next:** REST/BFF for CRUD/preview/AI (Phase D); optional **`TemplatePicker`** extract (Phase E).

This module is the **templates** slice of the same **`campaignSatellite`** story as **22** (campaigns) and **24** (sequences); **one service client** and **consistent JSON parsing** across all three fields reduces duplicate work.
