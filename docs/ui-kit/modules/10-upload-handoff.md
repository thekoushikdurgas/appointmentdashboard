> **Source:** split from [`extended-module-notes.md`](../extended-module-notes.md) (index). Handoff: **Upload module (doc + API) vs app**, UI kit mapping, and **task breakdown**.

---

## Module tracking

**Checkboxes** in **Phase** subsections below: `[x]` done · `[ ]` not done.

Full legend: [`README.md`](README.md#task-tracking-graphql--ui).

| Track       | What to update                                                               |
| ----------- | ---------------------------------------------------------------------------- |
| **GraphQL** | Operations, variables, and codegen alignment vs `contact360.io/api` schema.  |
| **UI**      | Routes under `app/`, feature components, Dashboard UI kit patterns, copy/UX. |

## Roll-up (this module)

|             | GraphQL | UI              |
| ----------- | ------- | --------------- |
| **Primary** | [x]     | [x] _(partial)_ |

> **`uploadOperations.ts`** + **`uploadService`** match **`UploadQuery` / `UploadMutation`** (`CompleteUploadInput { uploadId }`, `presignedUrl(uploadId, partNumber)`, **`fileSize` as BigInt string**). **`/upload`** page + **`UploadModulePanel`** + **`useMultipartUpload`**. **S3 CSV shortcut** remains on **`/files`** (`s3.initiateCsvUpload`).

**Codegen:** `UploadQuery`, `UploadMutation` — root `query.upload`, `mutation.upload`.

## 1. Canonical contract (aligned with `10_UPLOAD_MODULE.md`)

**Namespace:** `query.upload.*` / `mutation.upload.*`.

| Operation        | Inputs                                                                                            | Response                                                                |
| ---------------- | ------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| `initiateUpload` | `InitiateUploadInput`: `filename`, `fileSize` (BigInt), optional `contentType`, optional `prefix` | `uploadId`, `fileKey`, `s3UploadId`, `chunkSize`, `numParts`            |
| `presignedUrl`   | `uploadId`, `partNumber`                                                                          | `presignedUrl`, `alreadyUploaded`, `etag`                               |
| `registerPart`   | `uploadId`, `partNumber`, `etag`                                                                  | `status`, `partNumber`                                                  |
| `completeUpload` | `{ uploadId }` only                                                                               | `status`, `fileKey`, `s3Url`, `location`                                |
| `abortUpload`    | `{ uploadId }`                                                                                    | `status`, `uploadId`                                                    |
| `uploadStatus`   | `uploadId`                                                                                        | `uploadedParts`, `uploadedBytes`, `fileKey`, `fileSize`, `chunkSize`, … |

**Flow:** `initiateUpload` → per part: `presignedUrl` → `PUT` → `registerPart` → `completeUpload`. **`abortUpload`** on failure (best-effort) or cancel.

**Parallel path:** **`s3.initiateCsvUpload` / `s3.completeCsvUpload`** + same **`upload.presignedUrl`** parts — used from **`useS3Files`** / Files modal.

---

## 2. App implementation (current)

| Piece                                                                                   | Role                                                                                                              |
| --------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| [`uploadOperations.ts`](../../../src/graphql/uploadOperations.ts)                       | All six operation strings                                                                                         |
| [`uploadService.ts`](../../../src/services/graphql/uploadService.ts)                    | Typed client; **`initiateUpload`** sends **`fileSize: String(...)`** for BigInt                                   |
| [`multipartCsvUpload.ts`](../../../src/lib/multipartCsvUpload.ts)                       | **`uploadPresignedMultipartParts`** (+ **`fetch` `signal`**); alias **`uploadCsvMultipartParts`** for S3 CSV path |
| [`multipartGatewayUpload.ts`](../../../src/lib/multipartGatewayUpload.ts)               | **`uploadFileViaUploadModule`**: initiate → parts → complete; **abort** on error                                  |
| [`useMultipartUpload.ts`](../../../src/hooks/useMultipartUpload.ts)                     | Phase, progress, **cancel** (`AbortController`), **reset**                                                        |
| [`UploadModulePanel.tsx`](../../../src/components/feature/upload/UploadModulePanel.tsx) | Dropzone, **prefix radios**, **Progress**, success **fileKey** + copy + link to Files                             |
| [`/upload`](<../../../app/(dashboard)/upload/page.tsx>)                                 | Dashboard layout + panel                                                                                          |
| **Nav**                                                                                 | **`ROUTES.UPLOAD`** under Email next to Files                                                                     |

---

## 3. Dashboard UI kit mapping

| Need                 | App                                                                       |
| -------------------- | ------------------------------------------------------------------------- |
| File picker + prefix | Dropzone + **RadioGroup**                                                 |
| Progress             | **`Progress`** (bytes); optional **`uploadStatus` polling** not wired yet |
| Success / error      | **Alert**, **sonner** toast                                               |
| Post-upload          | **fileKey** copy; link **Files**                                          |

---

## 4. Smaller tasks (status)

### Phase A — Contract & client

- [x] **`uploadOperations` + `uploadService`** aligned with API + **`generated/types`**.
- [x] **`prefix`** on `initiateUpload` (UI: default / `upload/` / `exports/`).
- [x] **`graphql.contracts.test.ts`** asserts upload operation strings.

### Phase B — Domain logic

- [x] **`uploadPresignedMultipartParts`** with optional **`AbortSignal`** on **`fetch`**.
- [x] **`alreadyUploaded` + `etag`** skip PUT (unchanged).
- [x] **`abortUpload`** after failed multipart (before complete) and on **cancel** path via abort + catch.

### Phase C — UI

- [x] **`/upload`** page + kit patterns.
- [ ] **`uploadStatus` polling** during long uploads _(optional)_.

### Phase D — Integration & product

- [ ] Single product story: when to steer users to **`/upload`** vs **Files** S3 CSV — document in app copy/help.
- [ ] E2E QA: multi-part, single-part, abort, large file.

---

## 5. Summary

- **API** matches **`10_UPLOAD_MODULE.md`** (`completeUpload` is **`uploadId` only**; parts via **`registerPart`**).
- **App** exposes a first-class **Upload module** UI and shared **multipart PUT** helper used by both **`upload.*`** and **`s3` CSV** flows.
