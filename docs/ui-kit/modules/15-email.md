> **Source:** split from [`extended-module-notes.md`](../extended-module-notes.md) (index). Module order follows the original monolith.
> Here is a structured analysis of **Email** (`15_EMAIL_MODULE.md` ↔ `contact360.io/api` ↔ `contact360.io/app`), **Dashboard UI kit** mapping, and a **task breakdown**.

---

## Module tracking

**Checkboxes** in **Phase** subsections below: `[x]` done · `[ ]` not done. Tag open items when useful: _(planned)_ roadmap · _(gap)_ known mismatch vs gateway · _(pending)_ blocked or unscheduled.

Full legend: [`README.md`](README.md#task-tracking-graphql--ui).

| Track       | What to update                                                                       |
| ----------- | ------------------------------------------------------------------------------------ |
| **GraphQL** | Operations, variables, and `Gql*` / codegen alignment vs `contact360.io/api` schema. |
| **UI**      | Routes under `app/`, feature components, Dashboard UI kit patterns, copy/UX.         |

## Roll-up (this module)

|             | GraphQL         | UI               |
| ----------- | --------------- | ---------------- |
| **Primary** | [x] _(aligned)_ | [x] _(expanded)_ |

**Codegen:** `EmailQuery`, `EmailMutation` — root `query.email`, `mutation.email`.

> **2026-04-08 update:** Single finder supports **domain or website**. **Bulk finder** is **`findEmailsBulk`** only (sync, ≤50); larger CSVs → **Jobs** S3 **`createEmailFinderExport`**. **Bulk verifier** is **`verifyEmailsBulk`** (sync, first 2000 unique); larger lists → **Jobs** S3 **`createEmailVerifyExport`**. **Patterns:** **`addEmailPattern`**, **`addEmailPatternBulk`**, **`predictEmailPattern`**, S3 **`jobs.createEmailPatternExport`**. JSON-queue bulk job mutations were removed from the gateway. Hooks: **`useEmailVerification`**, **`useEmailJobPoller`** (S3 email jobs).

## 1. Canonical contract (doc + API)

**Namespace:** all fields under `query.email { … }` and `mutation.email { … }`.

| Operation                            | Input (GraphQL / camelCase)                                                                                                  | Output (high level)                                                                                                                    |
| ------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `findEmails`                         | `EmailFinderInput!`: `firstName`, `lastName`, **`domain` optional**, **`website` optional** (at least one of domain/website) | `EmailFinderResponse`: `emails[]`, `total`, `success`                                                                                  |
| `findEmailsBulk`                     | `BulkEmailFinderInput!`: `items[]` (`firstName`, `lastName`, **`domain` required** per item), max 50                         | `BulkEmailFinderResponse`: `processedCount`, `totalRequested`, `totalSuccessful`, `results[]` with nested `emails`, `error`, etc.      |
| `verifySingleEmail`                  | `SingleEmailVerifierInput!`: `email`, optional `provider`                                                                    | `SingleEmailVerifierResponse`: `result` (`status`, `emailState`, `emailSubState`, `certainty`, …), `success`                           |
| `verifyEmailsBulk`                   | `BulkEmailVerifierInput!`: `emails[]`, optional `provider`                                                                   | `BulkEmailVerifierResponse`: `results[]`, counts (**including `riskyCount`**), `success`                                               |
| `emailJobStatus`                     | `jobId: String!`                                                                                                             | `EmailJobStatusResponse`: `jobId`, `jobType`, `status`, **`processedRows`**, **`progressPercent`**, `outputCsvKey`, `provider`, `done` |
| `webSearch`                          | `WebSearchInput!`: `fullName`, `companyDomain`                                                                               | `JSON`                                                                                                                                 |
| `exportEmails` / `verifyexportEmail` | —                                                                                                                            | `ComingSoonResponse` (stubs)                                                                                                           |
| `addEmailPattern`                    | `EmailPatternAddInput!` (company, email, names, domain)                                                                      | `EmailPatternResult`                                                                                                                   |
| `addEmailPatternBulk`                | `EmailPatternBulkAddInput!`: `items[]`                                                                                       | `EmailPatternBulkAddResponse`                                                                                                          |
| `predictEmailPattern`                | `EmailPatternPredictInput!`: `firstName`, `lastName`, `domain`                                                               | `EmailPatternPredictResult`                                                                                                            |
| `predictEmailPatternBulk`            | `BulkEmailPatternPredictInput!`: `items[]`                                                                                   | `EmailPatternPredictBulkResult`                                                                                                        |

**S3 CSV streams:** not under `email` — use **Jobs module** (`jobs.createEmailFinderExport`, `jobs.createEmailVerifyExport`, `jobs.createEmailPatternExport`) after CSV is in S3 (per doc).

**Verification statuses (API):** `valid`, `invalid`, `catchall`, `unknown`, **`risky`**.

The Python modules in `app/graphql/modules/email/` match this (inputs in `inputs.py`, types in `types.py`).

---

## 2. `emailService.ts` vs API _(updated)_

**Aligned** with gateway for finder/verify/bulk/patterns/predict/jobs/`webSearch` (including **`riskyCount`**). **`verifyEmailsBulk`** defaults provider to **`mailtester`** when omitted.

**Codegen:** regenerate when convenient; **`emailService` types** remain the practical contract.

---

## 3. UI (`email/page.tsx`) vs module _(updated)_

- **Single finder** — Domain **or** website; lists **`EmailResult`** rows with **status / source** (no fake confidence).
- **Single verifier** — **`verifySingleEmail`** + provider **select**; shows status, state, certainty.
- **Bulk finder** — CSV (**papaparse**) → **`findEmailsBulk`** (≤50 sync); link to **Jobs** for S3 finder jobs + **`emailJobStatus`** when needed.
- **Bulk verifier** — Paste/list → **`verifyEmailsBulk`** (sync, capped); link to **Jobs** for S3 verify; **risky** and other counts surfaced.
- **Web search** — unchanged.
- **Patterns** — inner tabs: learn single, learn bulk, predict; S3 pattern jobs from **Jobs**.
- **Removed** mock **`EmailFinderBulkWizard`**.

**Still optional (product):** large-file **S3 + jobs** export flows (`createEmailFinderExport` / `createEmailVerifyExport`); stub queries `exportEmails` / `verifyexportEmail`.

---

## 4. Hooks / contexts _(updated)_

- **`useEmailFinderSingle`** — domain/website validation + full `EmailResult[]`.
- **`useEmailVerification`** — wraps **`verifySingleEmail`**.
- **`useEmailJobPoller`** — polls **`emailJobStatus`** for satellite jobs (e.g. S3 finder/verify/pattern).
- **Credits / limits:** unchanged — use billing/usage context globally.

---

## 5. Dashboard UI kit mapping

| Need                     | Kit / app direction                                                                                          |
| ------------------------ | ------------------------------------------------------------------------------------------------------------ |
| Single find/verify forms | `ui-card`, form `Input`, primary `Button` (already using `--c360-*`)                                         |
| Provider choice          | **Radio group** or **select** (`uc-select2` patterns) for verify / bulk-verify job                           |
| Bulk CSV                 | File dropzone (kit list/upload patterns), **progress bar** during upload + job                               |
| Results tables           | **Datatable** for `findEmailsBulk` / `verifyEmailsBulk` rows; **badges** for status (`valid`, `risky`, etc.) |
| Job polling              | **Progress** + status badge (you already use `Progress`); optional **indeterminate** while queued            |
| Web search               | Result list / accordion; raw JSON fallback in `<pre>`                                                        |
| Patterns                 | Form fields + success list; optional link to **companies** picker for `companyUuid`                          |
| Charts                   | Optional breakdown of verify counts (`validCount`, `invalidCount`, …) — bar/pie from kit chart pages         |

---

## 6. Smaller tasks (implementation order)

**Phase A — Client & types**

1. Regenerate or hand-fix **`Gql*`** email types to match the gateway.
2. Add **`useEmailFinderSingle`** (or form) support for **`website`** as alternative to **`domain`**.
3. Replace synthetic **confidence** with **`status` / `source`** (and optional certainty from verify).

**Phase B — Verifier UI**

4. Wire **Single verifier** to **`verifySingleEmail`**; add **provider** control; map **`risky`** in badge colors.
5. Implement **bulk verify** path: paste/list emails → **`verifyEmailsBulk`** (sync, ≤10k) **or** **`createEmailVerifyBulkJob`** (async) with correct **provider**; separate from bulk finder component.

**Phase C — Bulk finder & jobs**

6. Parse CSV → **`BulkEmailFinderItemInput[]`** for **`findEmailsBulk`** (≤50) or **`createEmailFinderBulkJob`** with real rows.
7. For large files: integrate **S3 upload** + **`jobsService.createEmailFinderExport`** / **`createEmailVerifyExport`** (see Jobs doc).
8. Unify polling: **`emailJobStatus`** vs **`jobs.get`** — document and implement per job kind.

**Phase D — Wizard & polish**

9. Replace **Bulk wizard** mock with the same pipeline as Phase C (upload → map columns → submit real mutation/job).
10. Optional **`exportEmailsComingSoon`** / **`verifyexportEmailComingSoon`** UI only if product still exposes those stubs.

**Phase E — Hooks & tests**

11. Add **`useEmailVerification`**, **`useEmailJobPoller(jobId, mode)`** to dedupe page logic.
12. Extend **`graphql.contracts.test.ts`** for **`riskyCount`**, **`createEmailVerifyBulkJob` `provider`**, and any new operations.

---

## 7. Summary _(updated)_

- **`contact360.io/api` `email` module** and **`15_EMAIL_MODULE.md`** align on operations, inputs, and responses (including **`risky`**, bulk aggregates, and job types).
- **`emailService.ts`** remains the practical client contract; **codegen** may still lag until regenerated.
- **`/email` UI** now wires **single verify**, **bulk verify**, **CSV bulk finder**, and **async bulk jobs** with **`emailJobStatus`** polling; **large S3 + Jobs exports** remain a follow-up when product prioritizes them.
