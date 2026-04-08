> **Source:** split from [`extended-module-notes.md`](../extended-module-notes.md) (index). Module order follows the original monolith.
> **21_LINKEDIN_MODULE.md** vs **`contact360.io/api`** and **`contact360.io/app`**, plus UI kit mapping and phased tasks.

---

## Module tracking

**Checkboxes** in **Phase** subsections below: `[x]` done · `[ ]` not done. Tag open items when useful: _(planned)_ roadmap · _(gap)_ known mismatch vs gateway · _(pending)_ blocked or unscheduled.

Full legend: [`README.md`](README.md#task-tracking-graphql--ui).

| Track       | What to update                                                                       |
| ----------- | ------------------------------------------------------------------------------------ |
| **GraphQL** | Operations, variables, and `Gql*` / codegen alignment vs `contact360.io/api` schema. |
| **UI**      | Routes under `app/`, feature components, Dashboard UI kit patterns, copy/UX.         |

## Roll-up (this module)

|             | GraphQL | UI                                 |
| ----------- | ------- | ---------------------------------- |
| **Primary** | [x]     | [x] _(partial — no server export)_ |

> **2026-04-06:** Feature components `LinkedInUrlSearch`, `LinkedInSearchResultRow` under `src/components/feature/linkedin/`.
> **2026-04-06 (update):** Typed `linkedinService`, `linkedinMappers`, `useLinkedInSearch`, `linkedinValidation`; companies + import company; bulk add; `linkedin_export` gate; CSV disabled until API exists.

**Codegen:** `LinkedInMutation` only — root `mutation.linkedin` (**no** `query.linkedin`).

## What the spec defines

- **Namespace:** `mutation { linkedin { … } }` — **mutations only** (no `Query.linkedin`).
- **Core operations in the short SDL:** `search(LinkedInSearchInput!)` → `LinkedInSearchResponse`, `upsertByLinkedInUrl(LinkedInUpsertInput!)` → `LinkedInUpsertResponse`.
- **Later sections** also describe **`exportLinkedInResults`** / **`LinkedInExportInput`** / **`LinkedInExportResponse`** (including two different example shapes: nested `contactExport`/`companyExport` vs flat `exportId`/`downloadUrl`).
- **Inputs:** `LinkedInSearchInput { url }`; `LinkedInUpsertInput { url, contactData, contactMetadata, companyData, companyMetadata }` (JSON scalars).
- **Outputs:** Nested **`ContactWithRelations`** / **`CompanyWithRelations`** wrapping **`ContactBasic`**, **`ContactMetadataBasic`**, **`CompanyBasic`**, **`CompanyMetadataBasic`** (plus totals).
- **Auth:** Bearer required; **credits** for Free/Pro (1 per search / upsert per doc); validation rules for LinkedIn URL prefix and length.

---

## API implementation (`contact360.io/api`)

**Implemented in** `app/graphql/modules/linkedin/` (`mutations.py`, `inputs.py`, `types.py`):

| Area                                 | Match to 21                                                                                                                                                                                                                                      |
| ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **`search`**                         | Present: validates URL, `LinkedInService.search_by_url`, maps to `LinkedInSearchResponse` with `contacts` / `companies` / totals.                                                                                                                |
| **`upsertByLinkedInUrl`**            | Present: validation requires **at least one JSON blob**; Connectra batch upsert + fetch; returns **`LinkedInUpsertResponse`** with `success`, `created`, **`contact` / `company` as `ContactWithRelations` / `CompanyWithRelations`**, `errors`. |
| **`exportLinkedInResults`**          | **Not implemented** in `mutations.py` — doc describes it, canonical SDL block does not; **server has no export mutation today**.                                                                                                                 |
| **Response types**                   | Python types include extra fields (e.g. `CompanyBasic.text_search`) and upsert return type is **wrapped** (`contact.contact`, not flat `contact.uuid`) unless clients query nested fields.                                                       |
| **Doc example for upsert selection** | Doc shows **flat** `contact { uuid firstName … }`; **live schema** expects **nested** `contact { contact { … } metadata { … } company { … } }` for `ContactWithRelations`.                                                                       |

So: **search + upsert match the spirit of 21**; **export is doc-only**; **upsert GraphQL selection sets in the doc are misleading** vs the actual `ContactWithRelations` shape.

---

## App implementation (`contact360.io/app`)

### `linkedinService.ts`

- **`searchByUrl`:** Hand-written mutation; response typed as **`LinkedInSearchResponse`** (codegen); includes **`company { uuid name }`** on contacts for context.
- **`upsertByLinkedInUrl`:** **`LinkedInUpsertPayload`** → **`LinkedInUpsertInput`** with at least one JSON blob; upsert selection includes nested **`contact` / `company`** on success.
- **No `exportLinkedInResults`** client (consistent with missing API).

### Codegen (`graphql/generated/types.ts`)

**`LinkedInSearchInput`**, **`LinkedInSearchResponse`**, **`LinkedInUpsertInput`**, **`LinkedInUpsertResponse`** — used for typing; operations remain hand-written strings (parity with other modules).

### UI: `app/(dashboard)/linkedin/page.tsx`

- **`useLinkedInSearch`** + **`mapLinkedInSearchResponse`** — contacts and companies from **`linkedin.search`**.
- **“Add to Contacts”** / **bulk** — **`contactData` + `contactMetadata`**; **“Import company”** — **`companyData` + `companyMetadata`**.
- **Export CSV** — disabled (no server mutation).
- **Gate:** **`linkedin_export`** via **`checkAccess`**; credits line + billing link when gated; **`refreshBillingLimits`** after successful imports.

---

## Dashboard UI kit mapping

| Spec / flow               | Kit-style patterns                                                                                            |
| ------------------------- | ------------------------------------------------------------------------------------------------------------- |
| **URL input + Search**    | Form controls from `form-element.html`; primary button; inline validation message under field.                |
| **Tabs**                  | **Search (person)** vs **Companies** vs **Upsert / import** (optional) using kit nav/tabs.                    |
| **Results**               | Data list/cards (you already use `Card`, `Badge`, checkbox); table variant from datatables for dense results. |
| **Multi-select + export** | Checkboxes + bulk action bar; if export ships later, **progress bar** during job/poll.                        |
| **Errors**                | Toast + field-level for `VALIDATION_ERROR` / `fieldErrors.url`.                                               |
| **Graphs**                | Optional usage chart (searches over time) only if you add analytics — not in 21.                              |

---

## Smaller tasks (phased)

### Phase A — Contract and docs

- [ ] **Regenerate SDL** from the API and **update 21**: either add **`exportLinkedInResults`** to the canonical SDL and implement it, or **mark export as future / remove** until implemented; resolve the two conflicting export examples in the doc.
- [ ] **Fix doc examples** for **`upsertByLinkedInUrl`** to use **nested** `contact { contact { … } }` / `company { company { … } }` matching `ContactWithRelations` / `CompanyWithRelations`.
- [ ] Regenerate app **codegen** and **replace or delete** stale **`GqlLinkedIn*`** types, or document “hand-written only” in parity doc.

### Phase B — Server vs product (choose one path)

- [ ] **Option 1 (strict API):** Keep validation; **client must send** minimal JSON (e.g. `contactData: {}` or `{ firstName, lastName }` from search result) on upsert.
- [ ] **Option 2 (lenient API):** Allow upsert with **only `url`** when search already found a record (product convenience) — requires API change and doc update.

### Phase C — `linkedinService` and types

- [x] **Typed** `LinkedInSearchResponse` / `LinkedInUpsertResponse` from codegen; row mapping in **`linkedinMappers`**.
- [x] **`upsertByLinkedInUrl`** accepts **`LinkedInUpsertPayload`** with **`contactData` / `contactMetadata` / `companyData` / `companyMetadata`** (JSON fields cast to gateway input).
- [ ] Map **GraphQL errors** (`VALIDATION_ERROR`, `SERVICE_UNAVAILABLE`) to user-visible messages (beyond toast defaults).

### Phase D — LinkedIn page UX

- [x] **Companies section** — render company cards; **Import company** uses **`companyData` + `companyMetadata`**.
- [x] **“Add to Contacts”** — **contactData + contactMetadata** from search row; bulk add for selected contacts.
- [x] **Feature gate** — **`linkedin_export`** via `RoleContext.checkAccess`; credits line + **`refreshBillingLimits`** after mutations.
- [x] **Export CSV** — **disabled** with title (no **`exportLinkedInResults`** on server).

### Phase E — Hooks and reuse

- [x] **`useLinkedInSearch`** — URL state, **`search()`** returns mapped rows + totals.
- [ ] **`useLinkedInUpsert()`** — optional thin hook (mutations stay in page).
- [x] **`linkedinValidation`** + **`types/linkedin.ts`**; existing **`LinkedInSearchResultRow`** components still available.

### Phase F — Testing

- [x] Contract test: **`linkedinService`** operations strings + type names.
- [ ] E2E: LinkedIn page search → list → add with valid payload.

---

## Summary

- **API today:** **`search`** and **`upsertByLinkedInUrl`** only; **no export mutation** despite long doc section.
- **Upsert response shape** in code uses **`ContactWithRelations` / `CompanyWithRelations`**, not flat `Contact` / `Company` as in some doc examples.
- **App:** Client sends **required JSON blobs** on upsert; **companies** shown and **import company** wired; **CSV export** disabled until API exists; **feature gate** + credit refresh.
- **Next:** optional **`exportLinkedInResults`** on API + client; align **21_LINKEDIN_MODULE.md** examples with nested GraphQL selections; E2E tests.
