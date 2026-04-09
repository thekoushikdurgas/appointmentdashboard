# Dashboard app — distilled from central docs

Excerpts for **`contact360.io/app`**. See [`README.md`](README.md). Imported notes live under [`imported/analysis/`](imported/analysis/).

## Gaps (docs overhaul)

[`../root/docs/imported/plans/contact360_docs_overhaul_9f8e9039.plan.md`](../root/docs/imported/plans/contact360_docs_overhaul_9f8e9039.plan.md) (Phase 2 codebase). Track GraphQL vs UI in [`ui-kit/README.md`](ui-kit/README.md#task-tracking-graphql--ui), [`ui-kit/extended-module-notes.md`](ui-kit/extended-module-notes.md), and [`ui-kit/modules/00-overview.md`](ui-kit/modules/00-overview.md#codegen-module-map-srcgraphqlgeneratedtypests) (codegen map).

- [x] **AI chat** — _(partial)_ — **GraphQL:** `aiChatService` / `AiChatMutation.sendMessage` aligned — **UI:** `/ai-chat` via `useAIChat` (no mock send).
- [x] **LinkedIn** — _(partial)_ — **GraphQL:** `Mutation.linkedin` — **UI:** search + upsert wired; feature components `LinkedInUrlSearch` / `LinkedInSearchResultRow`.
- [x] **Admin CRUD** — **App:** admin UI removed; **ops:** Django `admin_ops` + gateway `admin` via `admin_client.py`.
- [x] **Settings** — **UI:** `app/(dashboard)/settings/page.tsx` exists (theme, notifications, 2FA panel).
- [x] **2FA / API keys** — _(partial)_ — **GraphQL:** `twoFactor` / `profile` — **UI:** `/profile`; verify edge cases.

## Connectra / 3.x surface

[`../../../EC2/sync.server/docs/imported/analysis/connectra-contact-company-task-pack.md`](../../../EC2/sync.server/docs/imported/analysis/connectra-contact-company-task-pack.md): contacts/companies **UI** present; backend integration **partial** for advanced flows.

## Task packs

Search [`imported/analysis/`](imported/analysis/) for Appointments360 and `*app*` / era **1.x–3.x** packs for billing, contacts, AI workflows.

## Imported analysis (this service)

| Artifact             | Path                                                                                          |
| -------------------- | --------------------------------------------------------------------------------------------- |
| Appointment360 packs | [`imported/analysis/appointment360-*.md`](imported/analysis/)                                 |
| Dashboard UX         | [`imported/analysis/dashboard-search-ux.md`](imported/analysis/dashboard-search-ux.md)        |
| App codebase         | [`docs/codebases/app-codebase-analysis.md`](../../../docs/codebases/app-codebase-analysis.md) |
| Frontend pages       | [`docs/frontend/pages/`](../../../docs/frontend/pages/)                                       |
| Plans archive        | [`../root/docs/imported/plans/`](../root/docs/imported/plans/)                                |
