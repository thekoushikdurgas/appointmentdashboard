# App data tables — performance notes

## MUI Data Grid (contacts, companies, jobs, files, hiring signals)

All primary list surfaces use `@mui/x-data-grid`, which **virtualizes rows** internally. You do not need `@tanstack/react-virtual` on top of these grids unless you replace MUI with a plain HTML list.

## Code splitting

`DataGrid` is loaded with `next/dynamic` (`ssr: false`) in:

- `src/components/feature/contacts/ContactsDataTable.tsx`
- `src/components/feature/companies/CompaniesDataTable.tsx`
- `src/components/feature/files/FilesDataTable.tsx`
- `src/components/feature/jobs/JobsDataTable.tsx`
- `src/components/feature/hiring-signals/HiringSignalsDataTable.tsx`

The component is cast to `typeof import("@mui/x-data-grid").DataGrid` so row generics (`Contact`, `Company`, etc.) stay type-safe.

## Globe / maps

- **COBE globe** (`HiringSignalJobsGlobe`) is lazy-loaded from `HiringSignalsHomeOverview` and `MarketInsightsPage`.
- **World map** (`WorldMap`, `react-simple-maps`) is lazy-loaded from `ContactsPageClient`.

## GraphQL field selection

- **Contacts**: list queries use `CONTACT_LIST_FIELDS` only; detail uses `CONTACT_DETAIL_FIELDS` — see `src/graphql/contactsOperations.ts`.
- **Hiring signals**: keep list payloads aligned with columns in `HiringSignalsDataTable` / analytics helpers; avoid expanding `hireSignal.jobs` selections without updating consumers.
