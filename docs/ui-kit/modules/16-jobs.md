> **Source:** split from [`extended-module-notes.md`](../extended-module-notes.md) (index). Module order follows the original monolith.
> Here is a concise crosswalk of **Jobs** (`16_JOBS_MODULE.md` ↔ `contact360.io/api` ↔ `contact360.io/app`), **Dashboard UI kit** mapping, and a **task breakdown**.

---

## Module tracking

**Checkboxes** in **Phase** subsections below: `[x]` done · `[ ]` not done. Tag open items when useful: _(planned)_ roadmap · _(gap)_ known mismatch vs gateway · _(pending)_ blocked or unscheduled.

Full legend: [`README.md`](README.md#task-tracking-graphql--ui).

| Track       | What to update                                                                       |
| ----------- | ------------------------------------------------------------------------------------ |
| **GraphQL** | Operations, variables, and `Gql*` / codegen alignment vs `contact360.io/api` schema. |
| **UI**      | Routes under `app/`, feature components, Dashboard UI kit patterns, copy/UX.         |

## Roll-up (this module)

|             | GraphQL              | UI                          |
| ----------- | -------------------- | --------------------------- |
| **Primary** | [x] _(Phase A core)_ | [x] _(Jobs + Export pages)_ |

**Codegen:** `JobQuery`, `JobMutation` — root `query.jobs`, `mutation.jobs`.

## 1. Canonical contract (doc + API)

**Namespace:** `query.jobs { job, jobs }`, `mutation.jobs { … }`.

| Operation                                                            | Parameters (GraphQL)                                 | Returns                     |
| -------------------------------------------------------------------- | ---------------------------------------------------- | --------------------------- |
| `job`                                                                | `jobId: ID!`                                         | `SchedulerJob`              |
| `jobs`                                                               | `limit`, `offset`, `status`, `jobType`, `jobFamily`  | `JobConnection`             |
| `createEmailFinderExport`                                            | `CreateEmailFinderExportInput!`                      | `SchedulerJob`              |
| `createEmailVerifyExport`                                            | `CreateEmailVerifyExportInput!`                      | `SchedulerJob`              |
| `createContact360Export`                                             | `CreateContact360ExportInput!`                       | `SchedulerJob`              |
| `createContact360Import`                                             | `CreateContact360ImportInput!`                       | `SchedulerJob` (SuperAdmin) |
| `pauseJob` / `resumeJob` / `terminateJob`                            | `PauseJobInput!` etc. (`jobId`)                      | `JSON!`                     |
| `pauseConnectraJob` / `resumeConnectraJob` / `terminateConnectraJob` | `jobUuid: String!`                                   | `JSON!`                     |
| `retryJob`                                                           | `RetryJobInput!` (`jobId` + optional retry metadata) | `JSON!`                     |

**`JobConnection`:** `jobs: [SchedulerJob!]!`, `pageInfo` (not `items`).

**`SchedulerJob`:** includes `requestPayload`, `responsePayload`, stored `statusPayload`, plus **async field `statusPayload`** that **refreshes live** from email.server or Connectra when `source_service` matches.

**Taxonomy:** `source_service` `email_server` | `sync_server`; `job_family` `email_job` | `contact_job` | `company_job` (Jobs UI family filter no longer lists `linkedin_job`).

**`CreateContact360ExportInput` (API `inputs.py`):** `outputPrefix`, **`service`** (`"contact"` \| `"company"`), **`vql`** (JSON), optional `workflowId`, `s3Bucket`, `sliceCount`, `pageSize`, `retryCount`, `retryInterval`, `savedSearchId`.

**`CreateContact360ImportInput`:** `s3Bucket`, `s3Key`, `outputPrefix`, optional `workflowId`, `csvColumns` (JSON), `chunkCount`, `retryCount`, `retryInterval`, **`importTarget`** (`contact` \| `company`).

**Email export inputs:** `inputCsvKey`, `outputPrefix`, optional `s3Bucket`, `csvColumns` (snake in Python → camelCase in JSON), verify variant adds optional **`provider`**.

---

## 2. `jobsService.ts` vs API

**Aligned well:**

- List/get query shape: `jobs { jobs { jobs { … } pageInfo { … } } }` matches `JobConnection`.
- Mutations for email finder/verify export, pause/resume/terminate, Connectra pause/resume/terminate, retry are present with plausible argument shapes for **email** paths.
- `createEmailFinderExport` / `createEmailVerifyExport` use **`inputCsvKey`**, **`outputPrefix`**, optional **`s3Bucket`** / **`csvColumns`** — consistent with gateway inputs.

**Resolved in app (2026-04):**

1. **`JOB_FIELDS`** includes **`requestPayload`**, **`responsePayload`**, **`statusPayload`**. **`mapJob`** uses **`parseStatusPayload`** (`src/lib/jobs/statusPayload.ts`) for progress/total/processed/output hints; merges **`responsePayload`** download hints when useful.

2. **`createContact360Export`** — Typed as **`CreateContact360ExportInput`** (`outputPrefix`, **`service`**, **`vql`**, optional fields per schema).

3. **`createContact360Import`** — Typed as **`CreateContact360ImportInput`** (no legacy `type`/`fileKey` wrapper).

**Remaining gaps:**

4. **`retry`** — Sends `{ jobId }` only; API allows optional `retryCount`, `retryInterval`, `runAfter`, `data`, `priority`. Fine for minimal retry; extend if product needs them.

5. **Legacy Gql\*** — If any old **`GqlJobConnection`** / **`items`** aliases remain elsewhere, prefer **`jobsService`** + **`generated/types.ts`**.

---

## 3. UI / hooks vs module

**`useJobs`**

- Polls **`jobsService.list`** on an interval — good for a **list-level** refresh.
- Does **not** call **`jobs.job(jobId)`** with **`statusPayload`** for per-row detail/progress.
- **`canRetry` / `canPause` / `canCancel`** — email vs sync; **`canPauseConnectra` / `canResumeConnectra` / `canTerminateConnectra`** when **`source_service === sync_server`**. Mutations use scheduler **`jobId`** as **`jobUuid`** for Connectra (per gateway).

**Export page (`export/page.tsx`)**

- Lists **export-related** jobs (client filter on family/type/subtype); **`useJobs()`** without invalid **`jobFamily: "export"`**.
- **New export** uses **`createContact360Export`** with **`outputPrefix`**, **`service`**, **`vql`**. **Download** calls **`jobsService.get(scheduler job id)`** — **`job.jobId`**, not DB **`id`**.

**Jobs page (`jobs/page.tsx`)**

- **Email finder/verify** export path: **`inputCsvKey`** / **`outputPrefix`** — unchanged.
- **Contact/company** branch: **`outputPrefix`**, **VQL JSON**, **`service`** from selection — aligned with **`CreateContact360ExportInput`**.
- **Family filter** — **`linkedin_job`** removed.
- **Connectra** pause / resume / terminate buttons wired when **`MappedJob`** flags allow.

**Other consumers**

- **Dashboard / activities** use **`jobsService.list`** for widgets — OK for counts; progress/detail still limited without **`statusPayload`**.

---

## 4. Dashboard UI kit mapping

| Need               | Kit / app direction                                                                                                 |
| ------------------ | ------------------------------------------------------------------------------------------------------------------- |
| Job list           | Datatable (`table-datatable-basic.html`), row **badges** for status                                                 |
| Filters            | **Select** for `jobFamily`, `status`, `jobType`; optional search                                                    |
| Progress           | **Progress bar** bound to **`statusPayload`** (e.g. `progressPercent` / processed vs total from email.server shape) |
| Actions            | **Buttons**: pause / resume / cancel (email); separate **Connectra** actions when `source_service === sync_server`  |
| Create job wizards | **Tabs** or steps: upload CSV → column map → **radio** contact vs company → submit                                  |
| JSON / debug       | Expandable row for **`requestPayload`** / **`responsePayload`**                                                     |
| Charts             | Optional **job volume by family** (from list stats) — chart widgets from kit                                        |

---

## 5. Smaller tasks (implementation order)

**Phase A — GraphQL client correctness**

1. [x] Extend **`JOB_FIELDS`** with **`statusPayload`**, **`requestPayload`** / **`responsePayload`**.
2. [x] Parse **`statusPayload`** in **`mapJob`** via **`parseStatusPayload`**.
3. [x] **`createContact360Export`** uses **`CreateContact360ExportInput`**.
4. [x] **`createContact360Import`** uses **`CreateContact360ImportInput`**.
5. [ ] Optional **`retry`** metadata if product needs **`retryCount`** / etc.
6. [ ] Sweep legacy **`Gql*`** names if any remain outside **`jobsService`**.

**Phase B — Hooks**

7. [ ] **`useJobDetail(jobId)`** — poll **`jobs.job`** when a row is expanded.
8. [x] **Export page** — no invalid **`jobFamily: "export"`**; client-side filter for export-related rows.
9. [ ] Optionally split **`useEmailExportJobs`** vs **`useSyncJobs`**.

**Phase C — Pages**

10. [x] **Export page** — **`createContact360Export`** + **`job.jobId`** for fetch/download.
11. [x] **Jobs page** — contact/company create + **Connectra** actions; [ ] add **provider** for **verify** export if required.
12. [ ] **Email bulk tab** — single polling strategy vs **`email.emailJobStatus`** (cross-module).
13. [x] **Connectra** buttons when **`sync_server`**.

**Phase D — Docs / product**

14. Align **`16_JOBS_MODULE.md`** checklist with **frontend page bindings** once fixed.
15. Remove or gate **`linkedin_job`** in filters if the API never returns it.

---

## 6. Summary

- **`contact360.io/api` `jobs` module** matches **`16_JOBS_MODULE.md`**: list/get, email S3 exports, Connectra import/export inputs, pause/resume/terminate/retry, and **live `statusPayload`** on `SchedulerJob`.
- **`jobsService.ts`** is **strong for listing and email export mutations** but **does not fetch `statusPayload`**, and **Connectra create mutations are wired with the wrong variable shape** in the app.
- **Export / Jobs pages** currently **cannot** successfully start **Contact360 exports/imports** as the gateway defines them; **job family filter `"export"`** is inconsistent with the schema.
- **Modular completion** means **fixing create-input mapping**, **surfacing `statusPayload` for progress**, and **aligning UI filters and actions** with **`source_service` / `job_family`** — then layering **Dashboard kit** tables, progress bars, and wizards on top.
