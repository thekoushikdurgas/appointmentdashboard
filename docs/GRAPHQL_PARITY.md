# GraphQL gateway ↔ app parity matrix

**Sources of truth:** [`contact360.io/api/app/graphql/schema.py`](../api/app/graphql/schema.py), [`app/graphql/modules/*`](../api/app/graphql/modules/), [`docs/backend/graphql.modules/`](../../docs/backend/graphql.modules/README.md).

**App client:** [`src/services/graphql/`](src/services/graphql/), [`src/lib/graphqlClient.ts`](src/lib/graphqlClient.ts), [`src/context/AuthContext.tsx`](src/context/AuthContext.tsx).

**UI kit mapping (spine + deep notes):** [`docs/UI_KIT_MAPPING.md`](UI_KIT_MAPPING.md) (checklists §4/§4a); per-module UI/contract narratives indexed in [`docs/ui-kit/extended-module-notes.md`](ui-kit/extended-module-notes.md) under [`docs/ui-kit/modules/`](ui-kit/modules/).

**Codegen:** With the API running, `CODEGEN_SCHEMA_URL=http://127.0.0.1:8000/graphql npm run codegen` regenerates [`src/graphql/generated/types.ts`](src/graphql/generated/types.ts) (see [`codegen.ts`](codegen.ts)).

### Task tracking (checkboxes + roll-up)

- **Legend:** [`docs/ui-kit/README.md`](ui-kit/README.md#task-tracking-graphql--ui) — **`[x]`** done · **`[ ]`** open; tags _(planned)_ / _(gap)_ / _(pending)_ / _(partial)_.
- **Per-module deep checklists:** [`docs/ui-kit/modules/*.md`](ui-kit/modules/) (Phase sections + roll-up tables).
- **One-page roll-up (GraphQL vs UI):** [`docs/ui-kit/extended-module-notes.md`](ui-kit/extended-module-notes.md) — update when wiring changes.
- **Codegen:** root `Query` / `Mutation` fields → `*Query` / `*Mutation` in [`src/graphql/generated/types.ts`](src/graphql/generated/types.ts); full map in [`docs/ui-kit/modules/00-overview.md`](ui-kit/modules/00-overview.md#codegen-module-map-srcgraphqlgeneratedtypests).

---

## Module parity table

| #   | Gateway root                  | API module         | App service                                               | App hook               | App route                                                    | Status     |
| --- | ----------------------------- | ------------------ | --------------------------------------------------------- | ---------------------- | ------------------------------------------------------------ | ---------- |
| 01  | `auth`                        | `auth/`            | `authService.ts`, `AuthContext.tsx`, `authSelections.ts`  | —                      | `/login`, `/register`                                        | ✅ Wired   |
| 02  | `users`                       | `users/`           | `usersService.ts`                                         | —                      | —                                                            | ✅ Wired   |
| 03  | `contacts`                    | `contacts/`        | `contactsService.ts`                                      | `useContacts.ts`       | `/contacts`                                                  | ✅ Wired   |
| 04  | `companies`                   | `companies/`       | `companiesService.ts`                                     | `useCompanies.ts`      | `/companies`, `/companies/[id]`                              | ✅ Wired   |
| 05  | `activities`                  | `activities/`      | `activitiesService.ts`                                    | `useActivities.ts`     | `/activities`, `/dashboard` (sparklines)                     | ✅ Wired   |
| 06  | `analytics`                   | `analytics/`       | `analyticsService.ts`                                     | `usePerformanceMetric` | `/dashboard` (area chart), `WebVitalsReporter`               | ✅ Wired   |
| 07  | `billing`                     | `billing/`         | `billingService.ts`                                       | `useBilling.ts`        | `/billing`                                                   | ✅ Wired   |
| 08  | `email`                       | `email/`           | `emailService.ts`                                         | —                      | `/email`                                                     | ✅ Wired   |
| 09  | `campaignSatellite`           | `campaigns/`       | `campaignSatelliteService.ts`                             | —                      | `/campaigns`, `/campaigns/sequences`, `/campaigns/templates` | ✅ Wired   |
| 10  | `jobs`                        | `jobs/`            | `jobsService.ts`                                          | `useJobs.ts`           | `/jobs`                                                      | ✅ Wired   |
| 11  | `usage` / `featureOverview`   | `usage/`           | `usageService.ts`                                         | `useUsage.ts`          | `/activities?tab=usage`                                      | ✅ Wired   |
| 12  | `s3` / `upload`               | `s3/`, `upload/`   | `s3Service.ts`, `uploadService.ts`                        | `useS3Files.ts`        | `/files`, `/export`                                          | ✅ Wired   |
| 13  | `aiChats`                     | `ai_chats/`        | `aiChatService.ts`                                        | `useAIChat.ts`         | `/ai-chat`                                                   | ✅ Wired   |
| 14  | `notifications`               | `notifications/`   | `notificationsService.ts`                                 | `useNotifications.ts`  | `/notifications`                                             | ✅ Wired   |
| 15  | `admin`                       | `admin/`           | — _(not used in app; Django `admin_ops` + gateway token)_ | —                      | —                                                            | ⏭️ Ops UI  |
| 16  | `resume`                      | `resume/`          | `resumeService.ts`                                        | `useResume.ts`         | `/resume`                                                    | ✅ Wired   |
| 17  | `linkedin`                    | `linkedin/`        | `linkedinService.ts`                                      | —                      | `/linkedin`                                                  | ✅ Wired   |
| 18  | `health`                      | `health/`          | `healthService.ts`                                        | —                      | _(app `/status` removed; use Django admin system status)_    | ✅ Service |
| 19  | `pages`                       | `pages/`           | `pagesService.ts`                                         | —                      | `/dashboard/[pageId]` (DocsAI)                               | ✅ Wired   |
| 20  | `salesNavigator`              | `sales_navigator/` | `salesNavigatorService.ts`                                | `useSalesNavigator.ts` | `/sales-navigator`                                           | ✅ Wired   |
| 21  | `campaignSatellite` campaigns | `campaigns/`       | `campaignSatelliteService.ts`                             | —                      | `/campaigns`                                                 | ✅ Wired   |
| 22  | `campaignSatellite` sequences | `campaigns/`       | `campaignSatelliteService.ts`                             | —                      | `/campaigns/sequences`                                       | ✅ Wired   |
| 23  | `campaignSatellite` templates | `campaigns/`       | `campaignSatelliteService.ts`                             | —                      | `/campaigns/templates`                                       | ✅ Wired   |
| 24  | `savedSearches`               | `saved_searches/`  | `savedSearchesService.ts`                                 | `SavedSearchesMenu`    | `/contacts`, `/companies`                                    | ✅ Wired   |
| 25  | `twoFactor`                   | `two_factor/`      | `twoFactorService.ts`                                     | `useTwoFactor.ts`      | `/profile` (Security tab)                                    | ✅ Wired   |
| 26  | `profile`                     | `profile/`         | `profileService.ts`                                       | `useProfile.ts`        | `/profile`                                                   | ✅ Wired   |

**Column “Status”:** **✅ Wired** means an app **service + primary route** exist. It does **not** guarantee full schema coverage or zero mocks — use the **GraphQL** / **UI** roll-up and Phase checklists in [`docs/ui-kit/extended-module-notes.md`](ui-kit/extended-module-notes.md).

---

## April 2026 UI audit fixes

| Area                      | Fix                                                                                                                                                                        |
| ------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| CSS tokens                | Added `--c360-text-primary`, `--c360-text-secondary`, `--c360-bg-primary`, `--c360-bg-tertiary`, `--c360-bg-hover` aliases to `core.css` `:root` and `[data-theme="dark"]` |
| Modal a11y                | Added focus-trap + `aria-labelledby` to base `Modal` component                                                                                                             |
| Tabs a11y                 | Added `ArrowLeft`/`ArrowRight` keyboard navigation to `TabsTrigger` (`tabIndex` roving)                                                                                    |
| Checkbox                  | Added `ref` callback to set native `.indeterminate` on `<input>` DOM node                                                                                                  |
| BillingCheckoutWizard     | Replaced raw `<input type="radio">` / `<input className="c360-input">` with `RadioGroup`/`Radio` and `Input` components                                                    |
| ContactDetailPanel        | Wired "Find Email" to `emailService.findEmails` with toast; "View Profile" navigates to `/contacts/[id]`                                                                   |
| useJobPoller              | Extracted shared `useJobPoller` hook; replaced `window.setTimeout` polling in `ContactImportModal` + `ContactExportModal`                                                  |
| Badge dark theme          | Added `[data-theme="dark"]` overrides for `--indigo`, `--emerald`, `--yellow` badge colors                                                                                 |
| Billing proof upload      | `onUploadProof` now navigates to `payment-proof` tab (wired to `BillingPaymentProofForm` + `billingService.submitPaymentProof`)                                            |
| DataState standardization | Used `DataState` component in campaigns, sales-navigator, and resume pages                                                                                                 |

---

## Client–schema alignment notes

### Notifications

- **Query:** `notificationPreferences` (not `preferences`).
- **Mutation:** `updateNotificationPreferences` with **`UpdateNotificationPreferencesInput`** (not `updatePreferences` / `NotificationPreferencesInput`).
- **Clear read:** The gateway has **no** `deleteAllRead` mutation. The app deletes read items by repeatedly fetching the first page and calling **`deleteNotifications`** until no read rows remain on that page.

### Sales Navigator

- **`SaveProfilesInput`** is **`profiles` only** — the client must not send extra fields such as `pageMetadata`.

### Profile team invites

- **`InviteTeamMemberInput`** is **`email`** + **`role`** only on the wire.

---

## Module detail: modules 18–28

### Module 18 — Health (Envelope Matrix)

**Docs:** `docs/backend/graphql.modules/18_HEALTH_ENVELOPE_MATRIX.md`

**API operations:**

- `health { apiVersion, uptime, environment, services, vqlHealth, vqlStats, performanceStats }`

**App service:** [`src/services/graphql/healthService.ts`](src/services/graphql/healthService.ts)

- `getSystemHealth()` → gateway health, service statuses, uptime
- `getVqlHealth()` → `{ vqlHealth, vqlStats }` — Connectra/VQL connectivity
- `getPerformanceStats()` → cache, slow queries, DB, S3, endpoint latencies (SuperAdmin)

**App route:** The dedicated **`/status`** page was **removed**; operator health is **`contact360.io/admin`** (system status + analytics). The **`healthService`** client remains for any future in-app health widgets.

**Key types:** `GqlApiHealth`, `VqlHealth`, `VqlStats`, `PerformanceStats`, `ConnectraDetails`

---

### Module 19 — Pages (DocsAI)

**Docs:** `docs/backend/graphql.modules/19_PAGES_MODULE.md`

**API operations:**

- Query: `pages { page(slug), pages(type, limit, offset), pageTypes, pageStatistics, marketingPages }`
- Query: `auth { me { pages { … } } }` — authenticated page list in `AuthPayload`

**App service:** [`src/services/graphql/pagesService.ts`](src/services/graphql/pagesService.ts)

- `getPage(slug)` / `getPageContent(slug)` — full page detail with content
- `listPages(opts)` / `listPagesByType(type, opts)` — paginated summaries
- `getPageTypes()` / `getPageStatistics()` / `getMarketingPages()` — discovery

**App route:** [`app/(dashboard)/dashboard/[pageId]/page.tsx`](<app/(dashboard)/dashboard/[pageId]/page.tsx>)

- Renders DocsAI page content dynamically from `pages.page(slug)`

**Wire:** `AuthContext` calls `pagesService.listPagesByType` post-login to populate sidebar nav

**Key types:** `GqlPage`, `GqlPageSummary`, `GqlPageStatistics`

---

### Module 21 — LinkedIn

**Docs:** `docs/backend/graphql.modules/21_LINKEDIN_MODULE.md`

**API operations:**

- Query: `linkedin { search(query, limit, searchType) }` → `{ contacts, companies }`
- Query: `linkedin { searchByUrl(profileUrl) }` → single profile
- Mutation: `upsertByLinkedInUrl(profileUrl, contactData)` → `GatewayContact`

**App service:** [`src/services/graphql/linkedinService.ts`](src/services/graphql/linkedinService.ts)

- `search(query, limit, searchType)` → `{ contacts, companies }`
- `searchByUrl(profileUrl)` → single contact
- `upsertByLinkedInUrl(profileUrl, contactData)` → contact record

**App route:** [`app/(dashboard)/linkedin/page.tsx`](<app/(dashboard)/linkedin/page.tsx>)

- Search bar with type toggle (People / Company / URL)
- Validates LinkedIn URL prefix before `searchByUrl`
- Renders contacts table + companies section below
- "Add to Contacts" button builds `contactData` from result row before upserting

**Key types:** `GqlLinkedInContact`, `GqlLinkedInCompany`, `GqlLinkedInSearchResult`

---

### Module 22 — Campaigns

**Docs:** `docs/backend/graphql.modules/22_CAMPAIGNS_MODULE.md`

**API operations (via campaign satellite):**

- Query: `campaignSatellite { campaigns }` → JSON scalar (bare array or wrapped)

**App service:** [`src/services/graphql/campaignSatelliteService.ts`](src/services/graphql/campaignSatelliteService.ts)

- `listCampaigns()` → parsed `GqlCampaign[]` via `parseCampaigns()`

**App route:** [`app/(dashboard)/campaigns/page.tsx`](<app/(dashboard)/campaigns/page.tsx>)

- Table of campaigns with status badge, open rate, click rate
- Refresh button; write actions (pause/resume/delete) disabled with "Coming soon" tooltip
- Uses `parseCampaigns()` helper to normalize satellite JSON response

**Key types:** `GqlCampaign`, `GqlCampaignStatus`

---

### Module 24 — Sequences

**Docs:** `docs/backend/graphql.modules/24_SEQUENCES_MODULE.md`

**API operations (via campaign satellite):**

- Query: `campaignSatellite { sequences }` → JSON scalar

**App service:** `campaignSatelliteService.ts`

- `listSequences()` → `GqlCampaignSequence[]` via `parseSequences()`

**App route:** [`app/(dashboard)/campaigns/sequences/page.tsx`](<app/(dashboard)/campaigns/sequences/page.tsx>)

- Cards per sequence with status badge, step count, active contacts
- Refresh; create/pause disabled with "Coming soon" tooltip

**Key types:** `GqlCampaignSequence`

---

### Module 25 — Campaign Templates

**Docs:** `docs/backend/graphql.modules/25_CAMPAIGN_TEMPLATES_MODULE.md`

**API operations (via campaign satellite):**

- Query: `campaignSatellite { templates }` → JSON scalar

**App service:** `campaignSatelliteService.ts`

- `listTemplates()` → `GqlCampaignTemplate[]` via `parseCampaignTemplates()`

**App route:** [`app/(dashboard)/campaigns/templates/page.tsx`](<app/(dashboard)/campaigns/templates/page.tsx>)

- Table of templates with subject, type, performance stats
- Inline TiptapEditor for editing body; variable insertion toolbar (FirstName, LastName, Email, Company, UnsubscribeURL)

**Key types:** `GqlCampaignTemplate`

---

### Module 26 — Saved Searches

**Docs:** `docs/backend/graphql.modules/26_SAVED_SEARCHES_MODULE.md`

**API operations:**

- Query: `savedSearches { savedSearches(limit, offset) }` → `GqlSavedSearch[]`
- Query: `savedSearches { getSavedSearch(id) }` → single `GqlSavedSearch`
- Mutation: `createSavedSearch(name, query, type, filters)` → `GqlSavedSearch`
- Mutation: `updateSavedSearch(id, name, query, type, filters)` → `GqlSavedSearch`
- Mutation: `deleteSavedSearch(id)` → `Boolean`
- Mutation: `updateSearchUsage(id)` → `Boolean`

**App service:** [`src/services/graphql/savedSearchesService.ts`](src/services/graphql/savedSearchesService.ts)

- `list(opts)`, `get(id)`, `create(input)`, `update(id, input)`, `delete(id)`, `updateUsage(id)`

**App UI:** [`src/components/feature/saved-searches/SavedSearchesMenu.tsx`](src/components/feature/saved-searches/SavedSearchesMenu.tsx) on **`/contacts`** and **`/companies`** (versioned VQL payload in `filters` JSON).

- List/apply/delete and **Save current** modal; `updateSavedSearchUsage` on apply
- Legacy `/saved-searches` **redirects** to `/contacts` (`next.config` redirects)

**Key types:** `GqlSavedSearch`, `GqlSavedSearchType`

---

### Module 27 — Two-Factor Authentication

**Docs:** `docs/backend/graphql.modules/27_TWO_FACTOR_MODULE.md`

**API operations:**

- Query: `twoFactor { twoFactorStatus }` → `GqlTwoFactorStatus`
- Mutation: `setup2FA` → `{ secret, qrCodeUrl, backupCodes }`
- Mutation: `verify2FA(token)` → `Boolean`
- Mutation: `disable2FA(token)` → `Boolean`
- Mutation: `regenerateBackupCodes(token)` → `{ backupCodes: string[] }`

**App service:** [`src/services/graphql/twoFactorService.ts`](src/services/graphql/twoFactorService.ts)

- `getStatus()`, `setup()`, `verify(token)`, `disable(token)`, `regenerateBackupCodes(token)`

**App hook:** [`src/hooks/useTwoFactor.ts`](src/hooks/useTwoFactor.ts)

**App route:** [`app/(dashboard)/profile/page.tsx`](<app/(dashboard)/profile/page.tsx>) — **Security** tab

- Status badge; Setup → QR code + 6-digit TOTP entry (client-side length validation)
- Disable with token; regenerate backup codes
- TOTP verified server-side via `pyotp.TOTP`

**Key types:** `GqlTwoFactorStatus`, `GqlTwoFactorSetup`

---

### Module 28 — Profile

**Docs:** `docs/backend/graphql.modules/28_PROFILE_MODULE.md`

**API operations:**

- Query: `profile { profileInfo }` → `GqlProfileInfo`
- Query: `profile { teamMembers }` → `GqlTeamMember[]`
- Query: `profile { apiKeys }` → `GqlApiKey[]`
- Query: `profile { activeSessions }` → `GqlSession[]`
- Mutation: `updateProfile(name, email, bio, avatarUrl)` → `GqlProfileInfo`
- Mutation: `changePassword(oldPassword, newPassword)` → `Boolean`
- Mutation: `updateTeamMemberRole(id, role)` → `GqlTeamMember`
- Mutation: `removeTeamMember(id)` → `Boolean`
- Mutation: `createApiKey(name, scopes)` → `GqlApiKey`
- Mutation: `revokeApiKey(id)` → `Boolean`
- Mutation: `revokeSession(id)` → `Boolean`
- Mutation: `revokeAllOtherSessions` → `Boolean`

**App service:** [`src/services/graphql/profileService.ts`](src/services/graphql/profileService.ts)

- Full CRUD for profile info, team, API keys, sessions

**App hook:** [`src/hooks/useProfile.ts`](src/hooks/useProfile.ts)

**App route:** [`app/(dashboard)/profile/page.tsx`](<app/(dashboard)/profile/page.tsx>)

- Tabs: **Profile** (edit name/email/bio/avatar), **Team** (role Select dropdown per member, remove), **Security** (2FA + password), **API Keys** (create/revoke), **Sessions** (revoke per session + revoke all)
- Team tab shows 403 empty state for non-owners

**Key types:** `GqlProfileInfo`, `GqlTeamMember`, `GqlApiKey`, `GqlSession`

---

## Sales Navigator (Module 20)

**Docs:** `docs/backend/graphql.modules/23_SALES_NAVIGATOR_MODULE.md`

**API operations:**

- Query: `salesNavigator { salesNavigatorRecords(limit, offset) }` → `{ records, pageInfo }`
- Mutation: `saveSalesNavigatorProfiles(profiles)` → `{ success, totalProfiles, savedCount, errors }`

**App service:** [`src/services/graphql/salesNavigatorService.ts`](src/services/graphql/salesNavigatorService.ts)

- `listRecords(opts)` → paginated `GqlUserScrapingRecord[]`
- `saveProfiles(profiles)` → `GqlSaveProfilesResponse`
- Serializes camelCase keys to snake_case before sending

**App hook:** [`src/hooks/useSalesNavigator.ts`](src/hooks/useSalesNavigator.ts)

**App route:** [`app/(dashboard)/sales-navigator/page.tsx`](<app/(dashboard)/sales-navigator/page.tsx>)

- Paginated table of scraping records (offset-based via `pageInfo.hasNext`)
- Expandable JSON panel per row showing `searchContext`, `pagination`, `userInfo`
- "Save Profiles" with `savedCount` + `errors` toast

**Key types:** `GqlUserScrapingRecord`, `GqlSaveProfilesResponse`, `GqlPageInfo`

---

## Shared data-flow pattern

```
graphqlClient.ts  (fetch + JWT headers)
      ↓
src/services/graphql/*.ts  (query/mutation documents + response parsing)
      ↓
src/hooks/use*.ts          (useState + useEffect + error/loading state)
      ↓
app/(dashboard)/**/page.tsx  (UI, reads hook state, calls hook actions)
```

---

## Completed improvements (Full App Parity plan)

| Area                 | Task                                                                                                | Status     |
| -------------------- | --------------------------------------------------------------------------------------------------- | ---------- |
| TypeScript / Codegen | Added `Gql*` type aliases for all generated types + manual types for satellite APIs                 | ✅ Done    |
| TypeScript / Codegen | Added `typesPrefix: "Gql"` to `codegen.ts` for future regeneration                                  | ✅ Done    |
| usersService         | Fixed `uploadAvatar` field mismatch (`filePath` not `fileKey`)                                      | ✅ Done    |
| Page decomposition   | `contacts/page.tsx` → 5 feature components                                                          | ✅ Done    |
| Page decomposition   | `dashboard/page.tsx` → 4 feature components                                                         | ✅ Done    |
| Page decomposition   | `billing/page.tsx` → 4 feature components                                                           | ✅ Done    |
| Page decomposition   | `activities/page.tsx` → 3 feature components + CalendarView wired                                   | ✅ Done    |
| Page decomposition   | `admin/page.tsx` → 4 feature components                                                             | ✅ Done    |
| Page decomposition   | `companies/[id]/page.tsx` → 3 feature components                                                    | ✅ Done    |
| Page decomposition   | `email/page.tsx` → 5 feature components including BulkWizard                                        | ✅ Done    |
| Page decomposition   | _(retired)_ `status/`, `saved-searches/` pages — use admin + Contacts/Companies `SavedSearchesMenu` | ✅ Done    |
| Page decomposition   | `profile/page.tsx` → 5 feature components                                                           | ✅ Done    |
| VqlFilterInput       | Fixed `logicalOperator` → `allOf/anyOf` and `value` types in contacts page                          | ✅ Done    |
| tsc --noEmit         | 0 TypeScript errors                                                                                 | ✅ Passing |

### Phase 2–7 overhaul additions (2026-04-06)

| Area                | Task                                                                                                                                                                                      | Status  |
| ------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------- |
| graphql-gateway.ts  | Removed `GatewayContact`, `GatewayContactConnection`, `GatewayCompany`, `GatewayCompanyConnection` (duplicated generated types)                                                           | ✅ Done |
| api-modules.ts      | Fixed `VQL*` → `Vql*` casing, `APIKey` → `ApiKey`, `S3HealthInfo` → `S3Health` to match generated schema                                                                                  | ✅ Done |
| activitiesService   | Fixed `activityStats` to use `filters:` argument instead of `input:`                                                                                                                      | ✅ Done |
| s3Service           | Prefixed all query field names (`s3FileData`, `s3FileInfo`, `s3FileSchema`, `s3FileStats`, `s3BucketMetadata`); fixed `rows { data }` unwrap                                              | ✅ Done |
| uploadService       | Fully rewritten: `CompleteUploadInput { uploadId }`, `presignedUrl(uploadId, partNumber)`, correct `abortUpload` / `uploadStatus` fields                                                  | ✅ Done |
| admin module (app)  | Removed `adminService` / Next `/admin` UI; gateway `admin` queries/mutations consumed from **Django `admin_ops`** (`apps/admin_ops/services/admin_client.py`) with operator session token | ✅ Done |
| contactsService     | Fixed `batchCreateContacts → Contact[]`; `exportContacts → SchedulerJob` with `CreateContact360ExportInput`; `importContacts`; `getFilters` items shape                                   | ✅ Done |
| companiesService    | Same export/import/getFilters fixes as contacts; `companiesService.get(id)` for deep link                                                                                                 | ✅ Done |
| profileService      | Fixed `CreateApiKeyInput` casing (`Api` not `API`) in GraphQL document                                                                                                                    | ✅ Done |
| usersService        | Removed non-existent fields `newUsersToday`/`newUsersThisWeek`/`newUsersThisMonth` from `GET_USER_STATS`                                                                                  | ✅ Done |
| usageService        | `featureOverview` now selects `activities` + `jobs` fields                                                                                                                                | ✅ Done |
| dashboard/page.tsx  | Removed `setInterval`/`Math.random` live chart mocks; wired real `analyticsService`                                                                                                       | ✅ Done |
| activities/page.tsx | Fixed `status === "success"` (was `"completed"`); fixed analytics grouping by real enum                                                                                                   | ✅ Done |
| admin console       | **Removed from app;** use Django admin + Settings link (`NEXT_PUBLIC_ADMIN_URL`) for super-admins                                                                                         | ✅ Done |
| ai-chat/page.tsx    | Confirmed prod path via `useAIChat` → `AiChatMutation.sendMessage`; no mock stubs                                                                                                         | ✅ Done |
| resume page         | New `/resume` page + `ResumeCard`, `ResumeCreateModal`, `ResumeEditModal` components; nav entry added                                                                                     | ✅ Done |
| usage page          | Feature drill-down tab: select feature → show `FeatureUsageCard` + `FeatureOverviewPanel`                                                                                                 | ✅ Done |
| Feature components  | New component folders: `resume/`, `campaigns/`, `ai-chat/`, `usage/`, `linkedin/`                                                                                                         | ✅ Done |
| Admin UI components | **Removed** (`feature/admin/*`); ops use Django templates                                                                                                                                 | ✅ Done |

## Outstanding / future work

| Area      | Task                                                                                                                                                                                                                                                                                      | Priority                |
| --------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------- |
| Campaigns | `createCampaign`, `pauseCampaign`, `resumeCampaign` mutations when satellite exposes them                                                                                                                                                                                                 | Medium                  |
| Sequences | `createSequence`, `pauseSequence` mutations                                                                                                                                                                                                                                               | Medium                  |
| Pages nav | **Done (app):** **My pages** in sidebar + command palette from `AuthContext.accessiblePages`; `hrefForGatewayPage` uses `route` or `/dashboard/[pageId]`. Further polish: ordering, icons per `pageType`.                                                                                 | Low                     |
| Billing   | **App:** `useBilling` loads `getBillingInfo`, `getPlans`, `getAddons`, `getInvoices` (paginated); `subscribe` / `purchaseAddon` / `cancelSubscription`. SuperAdmin `updatePlan` / plan CRUD use `billingService` where exposed. Sample printable invoice only when API returns zero rows. | Low (polish / admin UI) |
| Jobs page | **App:** `useJobs` polls list when jobs are active; Activities **Jobs** tab polls `jobsService.list` every 10s and charts `jobBucketCounts()` in `src/lib/jobs/jobBucketCounts.ts`. SSE not implemented.                                                                                  | Low (optional SSE)      |

---

**Legend:** ✅ Wired = service + route exist and fetch real data; ⚠️ Partial = service exists, UI uses mock; 🔲 Future = not yet wired
