# Hiring signals (UI + GraphQL)

## `runId` on `hireSignal.jobs`

The hiring-signals **Signals** list can be filtered by Apify run id when drilling down from the **Runs** tab (“Signals” on a satellite or tracked scrape row).

The app sends `runId` in `HireSignalJobs` (`src/services/graphql/hiringSignalService.ts`). The **gateway** schema must include a `runId` (or equivalent) argument on `hireSignal.jobs` that proxies to job.server’s `run_id` / `apify_run_id` filter. If the argument is missing, GraphQL will error until the gateway is updated.

## UI patterns

- **Filters:** `HireSignalFilterProvider` / `useHireSignalFilter` (`src/context/HireSignalFilterContext.tsx`) hold draft sidebar state; `useHireSignalRuns` owns runs tab loading and actions.
- **Toolbar:** `DataToolbar` on the Signals tab mirrors the contacts page (tabs, density, mobile filter badge, actions).
