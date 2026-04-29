# Hiring signals (UI + GraphQL)

## `runId` on `hireSignal.jobs`

The hiring-signals **Signals** list can be filtered by Apify run id when drilling down from the **Runs** tab (“Signals” on a satellite or tracked scrape row).

The app sends `runId` in `HireSignalJobs` (`src/services/graphql/hiringSignalService.ts`). The **gateway** exposes `runId` on `hireSignal.jobs` (`contact360.io/api/app/graphql/modules/hire_signal/queries.py`) and forwards it to job.server as the `run_id` query parameter on `GET /api/v1/jobs`. Job.server filters Mongo with `apify_run_id` (`EC2/job.server`).

## UI patterns

- **Filters:** `HireSignalFilterProvider` / `useHireSignalFilter` (`src/context/HireSignalFilterContext.tsx`) hold **draft** sidebar state; **`mergeResumeSuggestions`** merges resume parser output into the draft only (user must click **Apply filters** to query). `useHiringSignals` owns applied `JobListFilters` used for fetching.
- **Text filters (title / company / location):** Draft fields `titles`, `companies`, `locations` are **string arrays**. The sidebar uses `HiringSignalTextFacetCombobox`, which loads distinct values via GraphQL `hireSignal.jobFilterOptions` (backed by job.server `GET /api/v1/jobs/filter-options`). Facet scoping includes draft selections for extended filters (workplace, employment types, etc.). Users can also **Add** a custom substring token. Applied filters map to `JobListFilters` and are sent through `HireSignalJobs` → `hireSignal.jobs`.
- **Extended filters:** `JobListFilters` + GraphQL variable `extendedJobFilters` carry workplace types, multi employment types, industries / exclusions, minimum salary (USD), experience buckets, role track, education minimum, clearance mode, H1B flag, and skills (`skillsAll`). See `buildExtendedJobFilters` in `hiringSignalService.ts` and the grouped sidebar (`HiringSignalsFilterSidebar.tsx`).
- **Semantics:** OR within each repeated token list dimension; AND across dimensions. Substrings are **literal** on the server (quoted regex). See `docs/backend/endpoints/job.server/HIRING-SIGNALS-FULL-CONTRACT.md`.
- **Toolbar:** **Hide applied** toggles `hideApplied` (gateway merges applied job ids). **Import resume** opens file picker → `suggestHireSignalFiltersFromResumeUpload` → chips/draft updated; toast reminds user to review and apply. `DataToolbar` mirrors the contacts page (tabs, density, mobile filter badge, actions).

## XLSX export (selected rows)

- **Toolbar + modal:** **Export XLSX** opens `HiringSignalsExportModal`; the table no longer has a dedicated export row.
- **GraphQL:** `hireSignal.exportSelectedJobs(linkedinJobIds: [String!]!)` queues job.server `POST /api/v1/jobs/export` and inserts `scheduler_jobs` (`hire_signal_xlsx_export`, `source_service: job_server`).
- **Status / download:** Open **Jobs** from the top bar (briefcase) or in-app links; filter family **Hiring Signals**. Live `statusPayload` is refreshed from job.server; **Download XLSX** uses `hireSignal.exportDownloadUrl(exportJobId)` → job.server presigned URL (`GET /api/v1/jobs/export/download-url/:id`). Legacy URL `/jobs` opens the same drawer then returns to the dashboard.
- **Service helpers:** `exportSelectedHireSignalJobs`, `fetchHireSignalExportStatus`, `fetchHireSignalExportDownloadUrl`, and job list helpers that reuse the same `JobListFilters` (including extended JSON and `hideApplied`) in `src/services/graphql/hiringSignalService.ts`.

## Rollout / QA (short)

1. Run Alembic migration for hire-signal prefs (hidden companies / applied jobs).
2. Confirm job.server deploy with derived-field ingest + indexes.
3. Manually verify: sidebar Apply, resume import → draft only → Apply, hide applied + export ID collection totals, run drill-down still honors filters.
