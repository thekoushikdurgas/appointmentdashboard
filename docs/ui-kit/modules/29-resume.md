> **Source:** split from [`extended-module-notes.md`](../extended-module-notes.md) (index). Module order follows the original monolith.
> Alignment of **`29_RESUME_AI_REST_SERVICE.md`**, **`contact360.io/api`**, **`contact360.io/app`**, and Dashboard UI kit patterns.

---

## Module tracking

**Checkboxes** in **Phase** subsections below: `[x]` done · `[ ]` not done.

Full legend: [`README.md`](README.md#task-tracking-graphql--ui).

| Track       | What to update                                                                       |
| ----------- | ------------------------------------------------------------------------------------ |
| **GraphQL** | Operations, variables, and `Gql*` / codegen alignment vs `contact360.io/api` schema. |
| **UI**      | Routes under `app/`, feature components, Dashboard UI kit patterns, copy/UX.         |

## Roll-up (this module)

|             | GraphQL | UI              |
| ----------- | ------- | --------------- |
| **Primary** | [x]     | [x] _(partial)_ |

**Codegen:** `ResumeQuery` / `ResumeMutation` — `resume { resumes, resume(id), saveResume, deleteResume }`. `GqlResumeRecord` in **`generated/types.ts`** matches **`id`, `userId`, `resumeData`, `createdAt`, `updatedAt`**.

## 1. Architecture (summary)

- **resumeai** FastAPI: REST **`/v1`**, **`X-API-Key`** on protected routes; JSON in s3storage.
- **Contact360 gateway** exposes **GraphQL `resume`** CRUD only (proxies resumeai). **`/v1/ai/*`** is **not** on the gateway resume module — no browser calls to resumeai with API key.

## 2. App implementation (`contact360.io/app`)

### `resumeService.ts`

- **`list`**, **`get(id)`**, **`save`**, **`delete`** — field selections match gateway (`resumeData`, `SaveResumeInput`).

### `useResume.ts`

- List on mount, **`save`**, **`remove`**, **`refresh`**, **`clearError`**, **`getById`** (async, uses **`resumeService.get`**).

### `useResumeOne.ts`

- **`resume(id)`** for detail route: load, **`refresh`**, **`clearError`**.

### `resumeDisplay.ts` / `resumeErrors.ts`

- **`getResumeDisplayTitle`**: `resumeData.title`, then JSON Resume **`basics.name`**, **`basics.label`**, else short id.
- **`isResumeServiceUnavailableMessage`**: 503 / unavailable / resumeai hints for UI copy.

### Routes

- **`/resume`** — list + title modal; **`ResumeCard`** with **Open** → **`/resume/[id]`**.
- **`/resume/[id]`** — **Overview** | **JSON** tabs; monospace JSON editor; **Save JSON** → **`saveResume`**; delete with confirm.

### Static contracts

- **`graphql.contracts.test.ts`** asserts `resumeService` queries/mutations.

---

## 3. Smaller tasks (phased)

### Phase A — Contract, types, and parity

- [x] **Types:** Use **`GqlResumeRecord`** / **`SaveResumeInput`** from codegen where appropriate; local **`ResumeRecord`** in service aligned.
- [x] **Display helpers** — `resumeData` shape (`title`, `basics.*`) for list titles.
- [x] **Service unavailable** — warning-style alert when error message matches proxy/resumeai outage patterns.

### Phase B — CRUD UI (GraphQL only, no AI yet)

- [x] **Route** `/resume` + nav **Resume**; **`/resume/[id]`** detail.
- [x] **List** — cards, loading skeleton, empty/error, **Open** → detail.
- [x] **Detail** — `resume(id)` on load; JSON save; delete.
- [x] **`useResume`** — **`getById`**, **`clearError`**; **`useResumeOne`** for detail.

### Phase C — AI features (requires backend design)

- [ ] Gateway or BFF for **`/v1/ai/*`** (parse, ATS, …). No client-side API key.

### Phase D — UX polish

- [x] **Tabs** on detail (Overview / JSON).
- [ ] Structured section forms (Basics, Experience, …) when `resumeData` schema is stable in UI.

### Phase E — Ops and testing

- [ ] E2E: list → create → save JSON → delete (optional).

---

## 4. Summary

- **CRUD** is implemented end-to-end in the app: **GraphQL → gateway → resumeai**.
- **AI REST** remains **out of scope** until the gateway or BFF exposes it.
- **UI kit:** list/detail use **Card**, **Tabs**, **Button**, **Alert**, **`--c360-*`** tokens.
- **Next:** `POST /v1/ai/parse` and friends via **server-side** plumbing (Phase C).
