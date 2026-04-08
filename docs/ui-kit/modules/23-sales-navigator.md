> **Source:** split from [`extended-module-notes.md`](../extended-module-notes.md) (index). Module order follows the original monolith.
> **23_SALES_NAVIGATOR_MODULE.md** vs **`contact360.io/api`** and **`contact360.io/app`**, plus Dashboard UI kit mapping.

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

**Codegen:** `SalesNavigatorQuery`, `SalesNavigatorMutation` — root `query.salesNavigator`, `mutation.salesNavigator`.

## What 23 defines

**On the Contact360 gateway**

| Operation                                   | Kind     | Contract                                                                                                                                                                |
| ------------------------------------------- | -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `salesNavigator.salesNavigatorRecords`      | Query    | Optional `SalesNavigatorFilterInput` (`limit`, `offset`). Returns **`UserScrapingConnection`**: scraping **metadata rows** for the **current user**, not arbitrary VQL. |
| `salesNavigator.saveSalesNavigatorProfiles` | Mutation | `SaveProfilesInput { profiles: [JSON!]! }` (max **1000**). Proxies to Sales Navigator / Connectra save path. Returns **`SaveProfilesResponse`**.                        |

**Explicitly not on gateway:** `getSyncStatus`, `listSyncJobs` — treat as removed/future.

**Downstream REST (satellite):** `POST /v1/save-profiles` with snake_case profile objects (`profile_url`, `company_url`, …); response includes `saved_count`, `contacts_created`, etc. (GraphQL layer may expose a **subset** of that.)

---

## API implementation (`contact360.io/api`)

**Query** (`queries.py`): Auth required; `UserScrapingRepository.list_by_user`; builds **`UserScrapingRecord`** with `id`, `userId`, `timestamp`, `version`, `source`, `searchContext`, `pagination`, `userInfo`, `applicationInfo`, `createdAt`, `updatedAt` (Strawberry → camelCase in schema).

**Mutation** (`mutations.py`): Field name is **`saveSalesNavigatorProfiles`**, not `saveProfiles`. Input: **`SaveProfilesInput.profiles`** (list of JSON objects). Returns **`SaveProfilesResponse`**:

```189:196:d:\code\ayan\contact\contact360.io\api\app\graphql\modules\sales_navigator\types.py
class SaveProfilesResponse:
    """Response from profiles save."""

    success: bool = True
    total_profiles: int = 0
    saved_count: int = 0
    errors: list[str] = strawberry.field(default_factory=list)
```

No `summary { saved, skipped, failed }` type exists on the server. The REST doc’s `contacts_created` / `contacts_updated` are **not** surfaced on this GraphQL type (only what `save_profiles_array_async` puts in `result` — currently mapped to `saved_count` + `errors`).

**Note:** `types.py` also defines rich types (`SalesNavigatorProfile`, `SalesNavigatorScrapeResponse`, etc.) that are **not** wired as the live query/mutation return types for this module; the **shipped** surface is **scraping records** + **save JSON** + **save response** above.

---

## App implementation (`contact360.io/app`)

### `salesNavigatorService.ts`

- **`listRecords`:** Queries `salesNavigatorRecords` with **`searchContext`**, **`pagination`**, **`userInfo`**, **`applicationInfo`**, plus core row fields and **`pageInfo`**.
- **`saveSalesNavigatorProfiles` / `saveProfilesFromForms`:** Mutation **`saveSalesNavigatorProfiles`** with selection **`success`**, **`totalProfiles`**, **`savedCount`**, **`errors`**. Form profiles are mapped via **`toSatelliteProfileJson`** (camelCase → snake_case for the satellite).
- **`SaveProfilesInput`** remains **`profiles` only** — no extra keys are sent.

### `useSalesNavigator.ts`

- **`saveProfiles`** uses **`saveProfilesFromForms`** and returns **`SaveProfilesResponse`** (`savedCount`, `errors`, …). **`fetchRecords`** supports **`offset`**; **`nextPage`** / **`prevPage`** use **`pageInfo`**. **`saveProfilesBulkJson`** chunks at **`SALES_NAV_SAVE_MAX_PROFILES`**.

### `/sales-navigator` page

- Toasts and bulk flow use **`savedCount`**, **`totalProfiles`**, and **`errors`**. Pagination controls and expanded-row JSON for metadata fields are implemented.

### Codegen (`GqlUserScrapingRecord`, `GqlSaveProfilesResponse`, …)

- Prefer **service-layer** `UserScrapingRecord` / `SaveProfilesResponse` aliases from **`salesNavigatorService`** aligned with the live selections. Regenerate codegen when the API schema changes.

---

## Dashboard UI kit mapping

| Need                     | Kit-style direction                                                                                                                 |
| ------------------------ | ----------------------------------------------------------------------------------------------------------------------------------- |
| **Scrape history table** | Datatables-style table; badges for `source` / `version`; relative time in cells.                                                    |
| **Pagination**           | Use `pageInfo.hasNext` / `limit` / `offset` with kit pagination controls.                                                           |
| **Add / bulk profiles**  | `form-element.html` inputs; textarea for **JSON array** or repeated rows; **progress bar** for batches (chunk ≤ 1000).              |
| **Record detail**        | Modal or side panel: pretty-print **`searchContext`**, **`pagination`**, **`userInfo`** JSON (collapsible sections).                |
| **Save result**          | Alert/summary line: success + **`savedCount`** + list **`errors`**; optional breakdown if API later exposes created/updated counts. |
| **Flow diagram**         | Optional: extension → gateway → satellite → Connectra (docs only unless you build an onboarding graphic).                           |

---

## Smaller tasks (phased)

### Phase A — GraphQL client correctness (blocking)

- [x] Rename mutation to **`saveSalesNavigatorProfiles`** and selection set to **`success`**, **`totalProfiles`**, **`savedCount`**, **`errors`** (camelCase per schema).
- [x] Map **`SalesNavigatorProfile`** (camelCase UI) → **JSON objects** with **snake_case** keys expected by the satellite (`profile_url`, `company_url`, `connection_degree`, …) per 23.
- [x] Drop **`pageMetadata`** from the mutation input unless the gateway adds it to **`SaveProfilesInput`**.
- [x] Update **`useSalesNavigator`**: return type derived from **`savedCount`** + **`errors`**; **`fetchRecords`** supports **`offset`** for pagination.

### Phase B — UI behavior

- [x] **Sales Navigator** page toasts and error display use **`savedCount`** / **`totalProfiles`** / **`errors`**.
- [x] **Pagination** via **`nextPage`** / **`prevPage`** and **`pageInfo.hasNext`** / **`hasPrevious`**.
- [x] Expanded row shows JSON for **`searchContext`**, **`pagination`**, **`userInfo`**, **`applicationInfo`** (where present).
- [x] **Bulk import:** paste JSON array; **`parseProfilesJsonArray`** + **`chunkArray`** at **`SALES_NAV_SAVE_MAX_PROFILES`**.

### Phase C — Types andcodegen

- [ ] Regenerate schema/codegen from **`contact360.io/api`**; replace hand-woven types or align **`salesNavigatorService`** with generated types for **records** + **save** only.
- [ ] Remove or fix **`api-modules.ts`** exports that re-export wrong **`Gql*`** sales navigator shapes.

### Phase D — Product / API enhancements (optional)

- [ ] If UX needs **contacts_created / contacts_updated**, extend **`SaveProfilesResponse`** in the API to mirror REST and then extend the client.
- [x] **`getSyncStatus`** / **`listSyncJobs`** never existed in the codebase -- no purge needed.
- [ ] Cross-check **`docs/frontend/salesnavigator-ui-bindings.md`** (cited in 23) against this stack after fixes.

### Phase E — Dashboard kit polish

- [ ] Align table, modals, and step/bulk flows with kit spacing and form patterns; **radio** for “single row vs JSON bulk” if you add modes.

---

## Summary

- **23** matches the **implemented** gateway: **`salesNavigatorRecords`** (user scraping metadata + pagination) and **`saveSalesNavigatorProfiles`** (JSON profile array, max 1000).
- The app uses **`saveSalesNavigatorProfiles`**, **`SaveProfilesResponse`** fields, and **snake_case** satellite payloads via **`toSatelliteProfileJson`** / bulk JSON import.
- **Codegen:** keep operations and selections in sync with **`contact360.io/api`**; static contract tests cover **`salesNavigatorService`** shape in **`graphql.contracts.test.ts`**.
- Optional follow-ups: **Phase D** REST parity on the response type, **Phase E** Dashboard kit polish (spacing, progress UI for bulk), **`featureAccess`** gating if product requires it.
