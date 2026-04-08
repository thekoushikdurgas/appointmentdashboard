> **Source:** split from [`extended-module-notes.md`](../extended-module-notes.md) (index). Module order follows the original monolith.
> Here is a concise alignment of **`03_CONTACTS_MODULE.md`**, **`contact360.io/api`**, **`contact360.io/app`**, the **Dashboard UI kit**, and a **task breakdown**.

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

> **2026-04-06:** `batchCreateContacts(input: { contacts }) → [Contact!]!`; `exportContacts` / `importContacts` use `CreateContact360*` inputs → `SchedulerJob`; `getFilters` uses `filters { items, total }`.
>
> **2026-04-06 (contacts pass):** Centralized documents in [`src/graphql/contactsOperations.ts`](../../../src/graphql/contactsOperations.ts); `contactsService` uses generated `CreateContactInput`, `UpdateContactInput`, `CreateContact360ExportInput`, `CreateContact360ImportInput`, `ContactFilterDataInput`; added **`count`**, **`contactQuery`**, **`filterData`**; **`ContactExportModal`** + **`exportVql`** from **`useContacts`**; bulk **delete** calls **`contacts.delete`**; create modal fields match gateway **`CreateContactInput`** (no city/country).

**Codegen:** [`ContactQuery`](../../../src/graphql/generated/types.ts), [`ContactMutation`](../../../src/graphql/generated/types.ts), [`VqlQueryInput`](../../../src/graphql/generated/types.ts), [`CreateContact360ExportInput`](../../../src/graphql/generated/types.ts), [`SchedulerJob`](../../../src/graphql/generated/types.ts).

## 1. What the Contacts module is (doc + API)

- **Source of truth:** **Connectra** (VQL), not the gateway DB.
- **Namespace:** **`contacts`** on queries/mutations.

**Queries:**

| Operation              | Role                                                             |
| ---------------------- | ---------------------------------------------------------------- |
| `contact(uuid)`        | One contact                                                      |
| `contacts(query)`      | List + `ContactConnection` (`items`, `total`, `limit`, `offset`) |
| `contactCount(query)`  | Count with same VQL shape                                        |
| `contactQuery(query!)` | Non-null query variant                                           |
| `filters`              | `ContactFilterConnection` — **`items`** = **`ContactFilter`**    |
| `filterData(input)`    | Facet values (`ContactFilterData`)                               |

**Mutations:** `createContact`, `updateContact`, `deleteContact`, `batchCreateContacts` (`BatchCreateContactsInput`), `exportContacts` (`CreateContact360ExportInput`), `importContacts` (`CreateContact360ImportInput`).

**VQL:** GraphQL camelCase **`allOf` / `anyOf` / `conditions`** (see gateway schema).

---

## 2. What the app implements today

**Core:** **`contactsService.list` / `get` / `create` / `update` / `delete`** + **`useContacts`** + **[`contacts/page.tsx`](<../../../app/(dashboard)/contacts/page.tsx>)** (search, filters, VQL builder, table, map, pagination, selection).

**Service (`contactsService`):**

| Method                         | Maps to                                          |
| ------------------------------ | ------------------------------------------------ |
| `list`                         | `contacts(query)`                                |
| `count`                        | `contactCount(query)`                            |
| `contactQuery`                 | `contactQuery(query!)`                           |
| `get`                          | `contact(uuid)`                                  |
| `create` / `update` / `delete` | mutations                                        |
| `batchCreate`                  | `batchCreateContacts` → **`Contact[]`** (mapped) |
| `exportContacts`               | `exportContacts` → **`SchedulerJob`**            |
| `importContacts`               | `importContacts` → **`SchedulerJob`**            |
| `getFilters`                   | `filters { items, total }`                       |
| `filterData`                   | `filterData(input)`                              |

**UI:**

- **Export** — [`ContactExportModal`](../../../src/components/feature/contacts/ContactExportModal.tsx): `outputPrefix`, VQL preview, **`contacts.exportContacts`** with `service: "contact"`, polls **`jobsService.get(jobId)`**.
- **Bulk delete** — **`contacts.delete`** per selected row.
- **Create** — [`ContactCreateModal`](../../../src/components/feature/contacts/ContactCreateModal.tsx) uses **`CreateContactInput`** from codegen (no city/country until the gateway input adds them).

---

## 3. Dashboard UI kit — how to use it

Use the kit as **layout/pattern** reference with **`--c360-*`**:

- Tables / row actions — `ecom-customers.html`, `ecom-product-list.html`.
- Filters — `form-element`, dropdown patterns; existing **`FilterSection`**, **`VQLQueryBuilder`**.
- Export wizard / progress — `form-wizard.html`; **Modal + `Progress` + job polling** (export modal).
- Map — **`WorldMap`** from current page rows (full geo analytics may need server aggregates).

---

## 3b. `src/` layout (contacts)

| Area                | Location                                                                       |
| ------------------- | ------------------------------------------------------------------------------ |
| **Route**           | `app/(dashboard)/contacts/page.tsx`                                            |
| **GraphQL strings** | `src/graphql/contactsOperations.ts`                                            |
| **Service**         | `src/services/graphql/contactsService.ts`                                      |
| **Hook**            | `src/hooks/useContacts.ts`                                                     |
| **Feature UI**      | `src/components/feature/contacts/*`, `src/components/contacts/VQLQueryBuilder` |
| **Patterns**        | `src/components/patterns/*`, `src/components/shared/WorldMap`                  |

---

## 4. Smaller tasks (recommended order)

### Phase A — Contract and codegen

- [x] **Types** — `VqlQueryInput`, `Contact*`, `CreateContact360*`, `ContactFilterDataInput`, `SchedulerJob`.
- [x] **Single source for operations** — `contactsOperations.ts`.
- [x] **VQL builder → `VqlQueryInput`** — Page merges filters/sort into `applyVqlQuery`.

### Phase B — `contactsService`

- [x] **`batchCreate`** — `input: { contacts }` → `[Contact!]!` mapped to app **`Contact[]`**.
- [x] **`exportContacts` / `importContacts`** — Typed `CreateContact360*` inputs; **`SchedulerJob`** selection includes **`statusPayload`** where queried.
- [x] **`getFilters`** — `items { id, key, filterKey, filterType, displayName, active, service, directDerived }`.
- [x] **`filterData`**, **`count`**, **`contactQuery`**.

### Phase C — Hooks and state

- [x] **`useContacts`** — **`exportVql`** for export jobs (wide `limit`, `offset: 0`).
- [ ] **Facet hook** — Optional **`useContactFilters`** wrapping **`getFilters` + `filterData`** with cache _(planned)_.
- [ ] **Bulk create** — Wire selection to **`batchCreate`** or repeated **`create`** _(product)_.

### Phase D — UI/UX (kit-aligned)

- [x] **Export** — Modal + job polling + **`Progress`**.
- [x] **Bulk delete** — Wired to API.
- [ ] **Import (SuperAdmin)** — Modal for **`CreateContact360ImportInput`** (`s3Bucket`, `s3Key`, …) _(planned)_.
- [ ] **Filter sidebar from `filters` / `filterData`** — Replace static **`FILTER_SECTIONS`** where product-ready _(planned)_.
- [ ] **`/contacts/[uuid]`** — Deep link detail _(planned)_.
- [ ] **Accessibility** — Table/selection/modal audit _(incremental)_.

### Phase E — Verification

- [ ] **Connectra matrix** — List, count, export job, delete, VQL edge cases.
- [ ] **Connectra down** — User-visible **unavailable** messaging _(incremental)_.

---

## 5. Summary

- The **gateway Contacts module** (VQL + CRUD + batch + export/import + filters) is **represented in `contactsService`** with **codegen-aligned** inputs and **`contactsOperations`** as the document source.
- **Contacts UI** includes a **working export flow** and **real bulk delete**; **import** and **dynamic filter facets** remain **follow-ups**.
- The **Dashboard UI kit** informs **table density, modals, and job progress**, implemented with **existing `c360-*` components**.
