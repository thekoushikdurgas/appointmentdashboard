> **Source:** split from [`extended-module-notes.md`](../extended-module-notes.md) (index). Module order follows the original monolith.
> Here is a structured read of **`04_COMPANIES_MODULE.md`**, **`contact360.io/api`**, **`contact360.io/app`**, and how the **Dashboard UI kit** fits in, plus a **task list**.

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

> **2026-04-06:** Export/import/getFilters aligned with schema; detail route uses **`companiesService.get(id)`**.
>
> **2026-04-06 (companies pass):** [`companiesOperations.ts`](../../../src/graphql/companiesOperations.ts); **`companiesService`** uses **`VqlQueryInput`**, **`CreateCompanyInput` / `UpdateCompanyInput`**, **`CreateContact360ExportInput` / `CreateContact360ImportInput`**, **`CompanyFilterDataInput`**; **`count`**, **`companyQuery`**, **`filterData`**; **`companyContacts`** with **`limit` / `offset`**; **`useCompanies`** uses server VQL (**`buildCompanyListVql`**) for search; **[`CompanyExportModal`](../../../src/components/feature/companies/CompanyExportModal.tsx)** + job polling; create modal matches **`CreateCompanyInput`**; detail page loads **paginated `companyContacts`**.

**Codegen:** [`CompanyQuery`](../../../src/graphql/generated/types.ts), [`CompanyMutation`](../../../src/graphql/generated/types.ts), [`CreateCompanyInput`](../../../src/graphql/generated/types.ts), [`VqlQueryInput`](../../../src/graphql/generated/types.ts).

## 1. Module contract (doc ↔ API)

**Source of truth:** **Connectra** (VQL), same pattern as contacts.

**Queries under `companies`:** `company(uuid)`, `companies(query)`, `companyQuery(query!)`, `companyCount(query)`, `companyContacts(companyUuid, query, limit, offset)`, `filters`, `filterData(input)`.

**Mutations:** `createCompany` / `updateCompany` / `deleteCompany`; **`exportCompanies` / `importCompanies`** use **`CreateContact360ExportInput`** / **`CreateContact360ImportInput`** (same job types as contacts; **`service` / `importTarget`** forced to company downstream per API).

**`CreateCompanyInput` / `UpdateCompanyInput` (published schema):** `name`, `employeesCount`, `industries`, `keywords`, `address`, `annualRevenue`, `totalFunding`, `technologies`, `textSearch` — **not** `website` / `normalizedDomain` / `country` as top-level inputs. **`Company`** read type can still expose **`website`**, **`normalizedDomain`**, **`country`** from Connectra.

---

## 2. What the app implements today

**Service (`companiesService`):** **`list`**, **`count`**, **`companyQuery`**, **`get`**, **`create`**, **`update`**, **`delete`**, **`exportCompanies`**, **`importCompanies`**, **`companyContacts`**, **`getFilters`**, **`filterData`** — documents live in **`companiesOperations.ts`**.

**Hooks:** **`useCompanies`** — pagination, **`search`** → VQL **`name` contains** (merged with optional **`vqlQuery`**), **`exportVql`** for exports.

**UI:**

- **[`companies/page.tsx`](<../../../app/(dashboard)/companies/page.tsx>)** — list/card views, **Export** modal, **create** aligned with **`CreateCompanyInput`**.
- **[`companies/[id]/page.tsx`](<../../../app/(dashboard)/companies/[id]/page.tsx>)** — **`get(id)`** + **paginated `companyContacts`** (not list scan).

---

## 3. Dashboard UI kit (usage)

Patterns only: **`Card`**, **`Button`**, **`Pagination`**, **`Modal`**, **`Alert`**, **`Progress`**, **`--c360-*`** — list density, detail layout, export wizard + job polling (same story as contacts).

---

## 3b. `src/` layout (companies)

| Area           | Location                                                                        |
| -------------- | ------------------------------------------------------------------------------- |
| **Routes**     | `app/(dashboard)/companies/page.tsx`, `app/(dashboard)/companies/[id]/page.tsx` |
| **GraphQL**    | `src/graphql/companiesOperations.ts`                                            |
| **VQL helper** | `src/lib/companyListVql.ts`                                                     |
| **Service**    | `src/services/graphql/companiesService.ts`                                      |
| **Hook**       | `src/hooks/useCompanies.ts`                                                     |
| **Feature UI** | `src/components/feature/companies/*`                                            |

---

## 4. Smaller tasks (recommended order)

### Phase A — Contract & types

- [x] **Codegen types** — `Company*`, `VqlQueryInput`, job inputs.
- [x] **Create/update inputs** — UI create uses **`CreateCompanyInput`** only.

### Phase B — `companiesService`

- [x] **`getFilters`** — `items` + full **`CompanyFilter`** fields.
- [x] **`filterData`**, **`count`**, **`companyQuery`**.
- [x] **Export/import** — **`CreateContact360*`** + **`SchedulerJob`** (incl. **`statusPayload`** on mutation selection).
- [x] **`companyContacts`** — **`limit` / `offset`**.

### Phase C — Hooks & data flow

- [x] **`useCompanies`** — Server VQL search via **`buildCompanyListVql`**; **`exportVql`**.
- [ ] **`useCompanyDetail(id)`** — Optional extraction from `[id]/page.tsx` _(planned)_.

### Phase D — UI/UX (kit-aligned)

- [x] **`/companies/[id]`** — **`get`** + **paginated contacts**.
- [x] **List** — Server-side search; **Export** modal.
- [ ] **Import modal** — SuperAdmin + **`CreateContact360ImportInput`** _(planned)_.
- [ ] **Filter sidebar** — **`filters` / `filterData`** instead of static **`FilterSection`** _(planned)_.
- [ ] **Optional `useCompanyDetail` + tabs** (“Overview | Activity”) _(planned)_.

### Phase E — QA

- [ ] **E2E** — Create → list → detail → contacts pagination → export job.
- [ ] **Connectra errors** — Clear empty/error states _(incremental)_.

---

## 5. Summary

- **Gateway Companies module** is covered in **`companiesService`** with **operations centralized** and **codegen-first** inputs.
- **List search** is **server VQL**; **export** and **detail contacts** match the **jobs + `companyContacts`** contract.
- **Follow-ups:** **import UI**, **dynamic facets**, optional **`useCompanyDetail`**, richer **tabs** on detail.
