# Hiring signals (UI + GraphQL)

## `runId` on `hireSignal.jobs`

The hiring-signals **Signals** list can be filtered by Apify run id when drilling down from the **Runs** tab (“Signals” on a satellite or tracked scrape row).

The app sends `runId` in `HireSignalJobs` (`src/services/graphql/hiringSignalService.ts`). The **gateway** exposes `runId` on `hireSignal.jobs` (`contact360.io/api/app/graphql/modules/hire_signal/queries.py`) and forwards it to job.server as the `run_id` query parameter on `GET /api/v1/jobs`. Job.server filters Mongo with `apify_run_id` (`EC2/job.server`).

## UI patterns

- **Filters:** `HireSignalFilterProvider` / `useHireSignalFilter` (`src/context/HireSignalFilterContext.tsx`) hold draft sidebar state; `useHireSignalRuns` owns runs tab loading and actions.
- **Toolbar:** `DataToolbar` on the Signals tab mirrors the contacts page (tabs, density, mobile filter badge, actions).

## XLSX export (selected rows)

- **Table:** `HiringSignalsDataTable` calls `onExportSelected(linkedinJobIds)` with real `linkedinJobId` values (not row surrogate keys).
- **GraphQL:** `hireSignal.exportSelectedJobs(linkedinJobIds: [String!]!)` queues job.server `POST /api/v1/jobs/export` and inserts `scheduler_jobs` (`hire_signal_xlsx_export`, `source_service: job_server`).
- **Status / download:** Open **Jobs** from the top bar (briefcase) or in-app links; filter family **Hiring Signals**. Live `statusPayload` is refreshed from job.server; **Download XLSX** uses `hireSignal.exportDownloadUrl(exportJobId)` → job.server presigned URL (`GET /api/v1/jobs/export/download-url/:id`). Legacy URL `/jobs` opens the same drawer then returns to the dashboard.
- **Service helpers:** `exportSelectedHireSignalJobs`, `fetchHireSignalExportStatus`, `fetchHireSignalExportDownloadUrl` in `src/services/graphql/hiringSignalService.ts`.
