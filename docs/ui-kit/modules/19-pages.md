> **Source:** split from [`extended-module-notes.md`](../extended-module-notes.md) (index). Module order follows the original monolith.
> Structured analysis of **19_PAGES_MODULE.md** vs **`contact360.io/api`** and **`contact360.io/app`**, plus UI kit mapping and phased tasks.

---

## Module tracking

**Checkboxes** in **Phase** subsections below: `[x]` done · `[ ]` not done. Tag open items when useful: _(planned)_ roadmap · _(gap)_ known mismatch vs gateway · _(pending)_ blocked or unscheduled.

Full legend: [`README.md`](README.md#task-tracking-graphql--ui).

| Track       | What to update                                                                       |
| ----------- | ------------------------------------------------------------------------------------ |
| **GraphQL** | Operations, variables, and `Gql*` / codegen alignment vs `contact360.io/api` schema. |
| **UI**      | Routes under `app/`, feature components, Dashboard UI kit patterns, copy/UX.         |

## Roll-up (this module)

|             | GraphQL | UI  |
| ----------- | ------- | --- |
| **Primary** | [x]     | [x] |

**Codegen:** `PagesQuery` — root `query.pages` (read-only namespace in current schema).

## What the spec defines

**19_PAGES_MODULE.md** describes a **unified `pages` GraphQL namespace** backed by **DocsAI** (via `PagesService` / `DocsAIClient`). It includes:

- **Queries:** `page`, `pages`, `pageContent`, `pagesByType`, `pageTypes`, `pageStatistics`, `pagesByState`, `pagesByStateCount`, `pagesByUserType`, `pagesByDocsaiUserType`, `myPages` (auth), five **`pageId`-scoped JSON** fields (`pageAccessControl`, `pageSections`, `pageComponents`, `pageEndpoints`, `pageVersions`), `dashboardPages`, `marketingPages`.
- **Types:** `PageSummary`, `PageDetail`, `PageList`, `PageContent`, `PageTypeInfo` / `PageTypeList`, `TypeStatistics`, `DashboardPageList`.
- **Auth integration:** `PageSummary[]` on **`AuthPayload`** (login / register / refresh).
- **No mutations** in this module.

---

## API implementation (`contact360.io/api`)

The module exists at `app/graphql/modules/pages/` (`queries.py`, `types.py`) and is mounted on the schema as **`pages: PagesQuery`** (see `schema.py`). Types match the doc conceptually:

- **`PageDetail`** in Python has `description`, `content_url`, `version`, `category`, `created_at`, `updated_at` — **not** inline `content` (that is a separate **`pageContent`** query per the doc).
- **`PageList`** / **`DashboardPageList`** match the doc’s shape (with pagination metadata on the dashboard list).
- **`myPages`** maps the current user’s role → DocsAI user type via `role_to_docsai_user_type` and calls `get_pages_for_docsai_user_type`.
- **Auth** mutations pull pages the same way (`auth/mutations.py`).

So the **server side is largely aligned with 19**; the canonical names in GraphQL are **camelCase** (`pageId`, `pageType`, `contentUrl`, …) as usual for Strawberry.

---

## App implementation (`contact360.io/app`)

### Two different “page” systems

1. **Unified Pages module (19)** — `src/services/graphql/pagesService.ts`
2. **Dynamic pages** — `src/lib/pageApi.ts` uses **`dynamicPage` / `dynamicPages`**, and `app/(dashboard)/dashboard/[pageId]/page.tsx` uses **`pageApi.getPage`**, not `pagesService`.

So product **dashboard shell pages** are **not** driven by the 19 module today.

### `pagesService.ts` vs server and vs 19

| Issue                            | Detail                                                                                                                                                                                                                                                                           |
| -------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Wrong selections on `page`**   | Queries request `content`, `createdAt`, `updatedAt` on `page(...)`. **`PageDetail` does not expose `content`**; markdown belongs to **`pageContent(pageId)`**. Timestamps/optional fields should match **`PageDetail`** (`description`, `contentUrl`, `version`, `category`, …). |
| **List types**                   | `pages`, `myPages`, and `dashboardPages` return **`PageSummary`**-shaped rows (per doc), not full `PageDetail`. The shared `PAGE_FIELDS` block is inappropriate for lists.                                                                                                       |
| **`pageType` / `status` typing** | App uses `DOCS` \| `MARKETING` \| `DRAFT` etc. The API/doc use **lowercase strings** (`docs`, `published`, …). Variables sent as uppercase may **fail validation** unless the server normalizes them.                                                                            |
| **`dashboardPages`**             | Doc supports `page`, `pageSize`, `pageType`, `status`, `search`. The client calls **`dashboardPages { }` with no variables** — only defaults.                                                                                                                                    |
| **Coverage**                     | No `pageContent`, `pagesByType`, `pageTypes`, `pageStatistics`, state/user-type queries, JSON sub-resources, or **`marketingPages`**.                                                                                                                                            |

### Codegen (`graphql/generated/types.ts`)

`GqlPageDetail` / `GqlPageList` mirror the **broken client assumptions** (e.g. `content` on detail, uppercase enums, list as `GqlPageDetail[]`) rather than the **live** `pages` schema from 19. **`GqlPageSummary`** under auth is closer to what lists should use.

---

## Dashboard UI kit (ideas folder)

Use it as a **pattern library**, not a drop-in bundle for Next.js:

| Need                                      | Kit direction                                                                                                          |
| ----------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| **Docs / marketing index**                | Table + search (`datatables` / form patterns), badges for `status`, tabs or pills for `pageType`.                      |
| **Page detail**                           | Card layout + typography; body = **markdown** (separate from kit).                                                     |
| **Stats (`pageStatistics`, `pageTypes`)** | `chart-chartjs.html` / widgets for counts; **progress bars** for published vs draft vs deleted shares.                 |
| **Paginated admin lists**                 | `dashboardPages` / `marketingPages` → pagination controls (you already have `Pagination.tsx`); align spacing with kit. |
| **Filters**                               | Checkboxes (include drafts/deleted), **radio** or select for status, text **input** for search.                        |
| **JSON inspector**                        | Sections/components/endpoints/versions → collapsible panels or monospace blocks (kit “widget-basic” / cards).          |
| **Loading**                               | Skeletons + optional **progress** for long fetches.                                                                    |

---

## Smaller tasks (recommended order)

### Phase A — Contract truth

- [ ] **Regenerate** GraphQL schema from `contact360.io/api` and **regenerate** app codegen so **`pages`** types match **`PageDetail` / `PageSummary` / `PageContent` / `DashboardPageList` / `TypeStatistics` / `PageTypeList`**.
- [ ] Add **`src/types/pages.ts`** (or extend `api-modules.ts`) with **string unions** aligned to the doc: `PageType = 'docs' | 'marketing' | 'dashboard'`, `PageStatus = 'draft' | 'published' | 'deleted'`, plus DocsAI `userType` for `pagesByDocsaiUserType`.

### Phase B — `pagesService` (parity with 19)

- [ ] **Split field sets:** `PAGE_SUMMARY_FIELDS` for lists; `PAGE_DETAIL_FIELDS` for `page` (no `content`).
- [ ] Implement **`getPageContent(pageId)`** → `pageContent { pageId content }`.
- [ ] Implement **`listPages`** with full filter args from the doc (`includeDrafts`, `includeDeleted`, …).
- [ ] Add **`pagesByType`**, **`pageTypes`**, **`pageStatistics`**, **`pagesByState`**, **`pagesByStateCount`**, **`pagesByUserType`**, **`pagesByDocsaiUserType`** as needed by product.
- [ ] **`getDashboardPages` / `getMarketingPages`** with **`page`, `pageSize`, `status`, `search`** (+ `pageType` where applicable).
- [ ] **`getMyPages(pageType?)`** with auth (no `skipAuth`).
- [ ] Optional: **JSON helpers** for the five `pageId` sub-resources (typed as `unknown` or Zod-validated JSON).

### Phase C — Auth and context

- [ ] Ensure **login / register / refresh** responses expose **`pages: PageSummary[]`** in the client auth layer; optionally **`PagesContext`** (nav items, “allowed routes”) consumed by layout/sidebar.
- [ ] **Derive nav** from `pages` or `myPages` vs hardcoded menus (policy in product).

### Phase D — Routes and UX (product decision)

- [ ] **Decide:** Should in-app docs/marketing use **`pages` + `pageContent`** or keep **`dynamicPage`**? If unified: add routes e.g. `/docs/[pageId]`, `/p/[route]`, and migrate or bridge.
- [ ] **Docs hub page:** tabs (`docs` | `marketing` | `dashboard` or subset), **search** input, **table** of `PageSummary`, link to detail.
- [ ] **Detail page:** `page` for metadata + `contentUrl` or `pageContent` for body; show **version**, **status**, **category**; handle **404** / **503** from doc.
- [ ] **Optional ops view:** `pageStatistics` + charts/progress; **SuperAdmin**-only if you gate by role.

### Phase E — Hooks, components, polish

- [ ] **`usePage`**, **`usePageContent`**, **`usePagesList`**, **`useMyPages`**, **`useDashboardPages`** (with query keys for React Query if you use it).
- [ ] Reusable **PageStatusBadge**, **PageTypeBadge**, **MarkdownPageBody**, **JsonPanel**.
- [ ] **Accessibility:** keyboard nav for tabs, table semantics, loading/error empty states (`DataState`-style).

### Phase F — Docs and CI

- [ ] Update **`GRAPHQL_PARITY.md`** (or equivalent) to list each 19 operation ↔ `pagesService` method ↔ route.
- [ ] **Contract test** or snapshot: minimal queries against dev API so **selection sets** cannot drift again.

---

## Summary

- **19** is implemented on the **API** as a full **`pages`** module; **DocsAI** is the data source; **auth** already attaches **`PageSummary`** to **`AuthPayload`**.
- The **app** mostly **does not** consume that module correctly: **`pagesService` queries invalid fields**, mixes **list vs detail** shapes, and **dashboard pages** use a **different GraphQL API** (`dynamicPage`). **Codegen pages types** are **not trustworthy** until regenerated from the real schema.
- **Dashboard UI kit** maps naturally to **tables, tabs, filters, charts, and pagination** for browsing and ops; **markdown** rendering is outside the kit.

If you switch to agent mode, a sensible first PR is: **fix `pagesService` selection sets + types**, add **`getPageContent`**, regenerate **codegen**, then add a minimal **`/docs` hub** that lists **`pagesByType(..., status: published)`** and opens a detail view.
