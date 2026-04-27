# UI kit mapping — extended module notes (index)

> **Split from** [`UI_KIT_MAPPING.md`](../UI_KIT_MAPPING.md) **(2026-04-05)**. Long-form narratives live in **`modules/*.md`** (one slice per domain). Start with **[`modules/00-overview.md`](modules/00-overview.md)** for how `contact360.io/api` and `contact360.io/app` fit together and how to split wiring work; open a row below when debugging a single module.

**Task tracking:** See [`README.md`](README.md#task-tracking-graphql--ui) for checkbox legend (**GraphQL** vs **UI** tracks).

## Roll-up status (GraphQL client vs app UI)

Quick roll-up: **`[x]`** primary flows OK · **`[ ]`** incomplete — see tags in each module. Legend: [`README.md`](README.md#task-tracking-graphql--ui).

| Module file                                                    | GraphQL         | UI              | Notes                                                                                                                                                                               |
| -------------------------------------------------------------- | --------------- | --------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [`00-overview.md`](modules/00-overview.md)                     | —               | —               | Meta + [codegen module map](modules/00-overview.md#codegen-module-map-srcgraphqlgeneratedtypests)                                                                                   |
| [`01-auth.md`](modules/01-auth.md)                             | [x] _(partial)_ | [x] _(partial)_ | `authOperations` + `pageType`; geo; refresh `pages` + bridge; `useAuthSession`; `feature/auth` + form hooks + `auth-shell.css`; forgot-password `Alert` stub                        |
| [`02-users.md`](modules/02-users.md)                           | [x] _(partial)_ | [x] _(partial)_ | `userStats` / `uploadAvatar` / `updateUser`; `usersOperations`; `useProfileGeneral` + General tab UX                                                                                |
| [`03-contacts.md`](modules/03-contacts.md)                     | [x]             | [x]             | `useJobPoller` hook replaces `window.setTimeout`; `ContactDetailPanel` Find-Email + View-Profile wired; `Checkbox.indeterminate` native DOM fixed                                   |
| [`04-companies.md`](modules/04-companies.md)                   | [x]             | [x] _(partial)_ | `companiesOperations`; VQL list search; export modal; paginated `companyContacts`; create form = `CreateCompanyInput`                                                               |
| [`05-notifications.md`](modules/05-notifications.md)           | [x]             | [x]             | Load-more pagination (`hasNext`/`loadMore`) already wired; type filter active                                                                                                       |
| [`07-s3.md`](modules/07-s3.md)                                 | [x]             | [ ] _(partial)_ | All query fields prefixed (`s3FileData`, etc.); `CompleteUploadInput { uploadId }` aligned                                                                                          |
| [`08-health.md`](modules/08-health.md)                         | [x]             | [x] _(partial)_ | `healthOperations`; app **`/status`** + health hooks **removed** (admin)                                                                                                            |
| [`09-usage.md`](modules/09-usage.md)                           | [x]             | [x] _(partial)_ | `usageOperations`; `trackUsage`/`resetUsage`; `useUsage`+`useFeatureOverview`; panel tabs + tables; **no** in-app SuperAdmin reset                                                  |
| [`10-upload-handoff.md`](modules/10-upload-handoff.md)         | [x]             | [x] _(partial)_ | `uploadOperations`; `/upload` + `useMultipartUpload` + `multipartGatewayUpload`; S3 CSV path still on `/files`                                                                      |
| [`11-activities.md`](modules/11-activities.md)                 | [x]             | [x]             | `activityStats(filters:)` fixed; `status===success` fixed; analytics grouping by real enum                                                                                          |
| [`13-admin.md`](modules/13-admin.md)                           | [x]             | —               | **App:** admin UI removed — **ops:** Django `admin_ops` + gateway `admin`                                                                                                           |
| [`14-billing.md`](modules/14-billing.md)                       | [x] _(partial)_ | [x] _(partial)_ | `BillingCheckoutWizard` now uses `Radio`/`Input` components; `onUploadProof` navigates to payment-proof tab; `BillingPaymentProofForm` wired to `billingService.submitPaymentProof` |
| [`15-email.md`](modules/15-email.md)                           | [ ] _(partial)_ | [x] _(partial)_ | Bulk wizard                                                                                                                                                                         |
| [`16-jobs.md`](modules/16-jobs.md)                             | [ ] _(partial)_ | [ ] _(partial)_ | Polling + export linkage                                                                                                                                                            |
| [`17-ai-chats.md`](modules/17-ai-chats.md)                     | [x]             | [x]             | Confirmed prod path: `aiChatService.sendMessage` → `AiChatMutation.sendMessage`                                                                                                     |
| [`18-analytics.md`](modules/18-analytics.md)                   | [x] _(partial)_ | [x] _(partial)_ | Dashboard random mocks removed; real metrics from `analyticsService`                                                                                                                |
| [`18-health-envelope.md`](modules/18-health-envelope.md)       | [ ] _(planned)_ | [ ] _(planned)_ | Matrix doc vs repo                                                                                                                                                                  |
| [`19-pages.md`](modules/19-pages.md)                           | [x]             | [x]             | DocsAI + nav                                                                                                                                                                        |
| [`21-linkedin.md`](modules/21-linkedin.md)                     | [x] _(partial)_ | [x] _(partial)_ | `LinkedInUrlSearch` + result row components added                                                                                                                                   |
| [`22-campaigns.md`](modules/22-campaigns.md)                   | [x] _(partial)_ | [x] _(partial)_ | `CampaignRow` + `CampaignWriteActions` components added                                                                                                                             |
| [`23-sales-navigator.md`](modules/23-sales-navigator.md)       | [x] _(partial)_ | [ ] _(partial)_ | Save profiles                                                                                                                                                                       |
| [`24-sequences.md`](modules/24-sequences.md)                   | [x] _(partial)_ | [ ] _(partial)_ | Reads OK; writes soon                                                                                                                                                               |
| [`25-campaign-templates.md`](modules/25-campaign-templates.md) | [x] _(partial)_ | [ ] _(partial)_ | Templates + editor                                                                                                                                                                  |
| [`27-two-factor.md`](modules/27-two-factor.md)                 | [x]             | [x]             | Security tab                                                                                                                                                                        |
| [`28-profile.md`](modules/28-profile.md)                       | [x]             | [x] _(partial)_ | `CreateApiKeyInput` casing fixed; Team/API keys/sessions wired                                                                                                                      |
| [`29-resume.md`](modules/29-resume.md)                         | [x]             | [x]             | `/resume` page live; `ResumeCard`/`Create`/`Edit` modal components added; nav entry added                                                                                           |

_Update this table when you close gaps in a module file so the index stays honest._

## Module index

| Order | Reference / topic                              | File                                                                   |
| ----- | ---------------------------------------------- | ---------------------------------------------------------------------- |
| 0     | API ↔ app integration, task split              | [`modules/00-overview.md`](modules/00-overview.md)                     |
| 1     | `01_AUTH_MODULE`                               | [`modules/01-auth.md`](modules/01-auth.md)                             |
| 2     | `02_USERS_MODULE`                              | [`modules/02-users.md`](modules/02-users.md)                           |
| 3     | `03_CONTACTS_MODULE`                           | [`modules/03-contacts.md`](modules/03-contacts.md)                     |
| 4     | `04_COMPANIES_MODULE`                          | [`modules/04-companies.md`](modules/04-companies.md)                   |
| 5     | `05_NOTIFICATIONS_MODULE`                      | [`modules/05-notifications.md`](modules/05-notifications.md)           |
| 6     | `07_S3_MODULE`                                 | [`modules/07-s3.md`](modules/07-s3.md)                                 |
| 7     | `08_HEALTH_MODULE`                             | [`modules/08-health.md`](modules/08-health.md)                         |
| 8     | `09_USAGE_MODULE`                              | [`modules/09-usage.md`](modules/09-usage.md)                           |
| 9     | Upload module handoff                          | [`modules/10-upload-handoff.md`](modules/10-upload-handoff.md)         |
| 10    | `11_ACTIVITIES_MODULE`                         | [`modules/11-activities.md`](modules/11-activities.md)                 |
| 11    | `13_ADMIN_MODULE`                              | [`modules/13-admin.md`](modules/13-admin.md)                           |
| 12    | `14_BILLING_MODULE`                            | [`modules/14-billing.md`](modules/14-billing.md)                       |
| 13    | `15_EMAIL_MODULE`                              | [`modules/15-email.md`](modules/15-email.md)                           |
| 14    | `16_JOBS_MODULE`                               | [`modules/16-jobs.md`](modules/16-jobs.md)                             |
| 15    | `17_AI_CHATS_MODULE`                           | [`modules/17-ai-chats.md`](modules/17-ai-chats.md)                     |
| 16    | `18_ANALYTICS_MODULE`                          | [`modules/18-analytics.md`](modules/18-analytics.md)                   |
| 17    | `18_HEALTH_ENVELOPE_MATRIX`                    | [`modules/18-health-envelope.md`](modules/18-health-envelope.md)       |
| 18    | `19_PAGES_MODULE`                              | [`modules/19-pages.md`](modules/19-pages.md)                           |
| 19    | `21_LINKEDIN_MODULE`                           | [`modules/21-linkedin.md`](modules/21-linkedin.md)                     |
| 20    | `22_CAMPAIGNS_MODULE`                          | [`modules/22-campaigns.md`](modules/22-campaigns.md)                   |
| 21    | `23_SALES_NAVIGATOR_MODULE`                    | [`modules/23-sales-navigator.md`](modules/23-sales-navigator.md)       |
| 22    | `24_SEQUENCES_MODULE`                          | [`modules/24-sequences.md`](modules/24-sequences.md)                   |
| 23    | `25_CAMPAIGN_TEMPLATES_MODULE`                 | [`modules/25-campaign-templates.md`](modules/25-campaign-templates.md) |
| 24    | `27_TWO_FACTOR_MODULE`                         | [`modules/27-two-factor.md`](modules/27-two-factor.md)                 |
| 25    | `28_PROFILE_MODULE`                            | [`modules/28-profile.md`](modules/28-profile.md)                       |
| 26    | `29_RESUME_AI_REST_SERVICE` (GraphQL `resume`) | [`modules/29-resume.md`](modules/29-resume.md)                         |

**Maintenance:** Edits to deep narratives should target the relevant **`modules/<name>.md`** file. Keep [`../UI_KIT_MAPPING.md`](../UI_KIT_MAPPING.md) as the roadmap spine (§4/§4a); avoid duplicating phased task tables across files.
