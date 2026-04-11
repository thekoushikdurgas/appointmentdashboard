# Contacts page parity — architecture and gap matrix

This document satisfies Phase 0 of the contacts UX/UI parity plan: traces for both apps, a gap matrix, and Dashboard UI kit token alignment (implemented in `app/css/core.css` + `app/css/dashboard-kit.css`).

## appointment-d1 — data path

1. UI: [`app/(dashboard)/contacts/page.tsx`](<../app/(dashboard)/contacts/page.tsx>) composes `DataPageLayout`, `DataToolbar`, `ContactsFilters`, `ContactsTableContainer`, modals.
2. State: [`useContacts`](../src/hooks/contacts/useContacts.ts) bundles `useContactsFilters`, `useContactsData`, `useContactCount`, selection, modals, pagination.
3. Query: [`useContactsData`](../src/hooks/contacts/useContactsData.ts) calls `queryContacts` with `convertFiltersToVQL` from [`contactsService`](../src/services/contactsService.ts) (wraps `convertToVQLFilters` in [`filterUtils`](../src/lib/filterUtils.ts)).
4. Loading: optimistic rows, background sync, prefetch on scroll (see `ContactsTableContainer`).

## contact360.io/app — data path

1. UI: [`app/(dashboard)/contacts/page.tsx`](<../app/(dashboard)/contacts/page.tsx>) composes `DataPageLayout`, `ContactsFilterSidebar`, `VqlBuilderModal`, `ContactsDataTable`.
2. State: Page-local `search`, `activeTab`, `facetValues`, `sortBy`, `advancedListDraft` (`DraftQuery`), etc.; [`useContacts`](../src/hooks/useContacts.ts) holds list + `applyVqlQuery(VqlQueryInput)`.
3. Query: `applyFilters` merges sidebar-derived `DraftCondition[]` + optional advanced `rootGroup` into one `DraftQuery`, then `draftToVqlQueryInput` → `applyVqlQuery` (see [`vqlDraft.ts`](../src/lib/vqlDraft.ts)).
4. Pagination: list cache for early pages; `searchAfter` cursors for page &gt; 10 (see `useContacts.ts`).

**Constraint (implementation):** Keep app’s `DraftQuery` → `VqlQueryInput` pipeline; do not port `ContactsFilterState` / `convertToVQLFilters` without a separate API contract project.

## Gap matrix (app vs appointment-d1)

| Area                         | appointment-d1                                        | app (target behavior)                                                                   |
| ---------------------------- | ----------------------------------------------------- | --------------------------------------------------------------------------------------- |
| Layout shell                 | Resizable sidebar, toolbar slot, metadata, pagination | Extended `DataPageLayout` with toolbar/metadata/pagination slots + mobile filter drawer |
| Tabs                         | Toolbar tabs (Total, Net New, …)                      | Toolbar tabs; list scope still drives `applyFilters` (net_new / do_not_contact)         |
| Sidebar header               | Title, “N Active”, CLEAR, refresh metadata            | Same + optional close on mobile drawer                                                  |
| Advanced VQL                 | Simpler `VQLQueryBuilder` + `filterGroups`            | Keep richer `VqlBuilderModal` + `DraftQuery`                                            |
| Saved searches / bulk insert | Present in d1                                         | Out of scope unless backend parity                                                      |
| AI search                    | Sidebar AI row                                        | Feature-flagged stub or future API                                                      |

## Dashboard UI kit → c360 tokens

Reference: `docs/frontend/ideas/Dashboard ui kit` (Eatio / Bootstrap admin). Visuals are mapped to existing and new CSS variables in `app/css/core.css` and `app/css/dashboard-kit.css`:

- Primary / surfaces / borders / radius / shadow (card + table header density).
- Toolbar: kit-style tab underline and compact action row.
- Drawer: overlay + panel consistent with kit modal/backdrop tone.
