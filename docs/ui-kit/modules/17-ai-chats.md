> **Source:** split from [`extended-module-notes.md`](../extended-module-notes.md) (index). Module order follows the original monolith.
> Here is a structured analysis of **AI Chats** (`17_AI_CHATS_MODULE.md` ↔ `contact360.io/api` ↔ `contact360.io/app`), **Dashboard UI kit** mapping, and a **task breakdown**.

---

## Module tracking

**Checkboxes** in **Phase** subsections below: `[x]` done · `[ ]` not done. Tag open items when useful: _(planned)_ roadmap · _(gap)_ known mismatch vs gateway · _(pending)_ blocked or unscheduled.

Full legend: [`README.md`](README.md#task-tracking-graphql--ui).

| Track       | What to update                                                                       |
| ----------- | ------------------------------------------------------------------------------------ |
| **GraphQL** | Operations, variables, and `Gql*` / codegen alignment vs `contact360.io/api` schema. |
| **UI**      | Routes under `app/`, feature components, Dashboard UI kit patterns, copy/UX.         |

## Roll-up (this module)

|             | GraphQL | UI  |
| ----------- | ------- | --- |
| **Primary** | [x]     | [x] |

> **2026-04-06:** `/ai-chat` uses `useAIChat` → `aiChatService.sendMessage` → `AiChatMutation.sendMessage` (no mock send path).

**Codegen:** `AiChatQuery`, `AiChatMutation` — root `query.aiChats`, `mutation.aiChats`.

## 1. Canonical contract (doc + API)

**Namespace:** `query.aiChats { aiChats, aiChat }`, `mutation.aiChats { … }`.

| Operation                | API signature                                                                                                      | Return                                          |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------- |
| `aiChats`                | `filters: AIChatFilterInput` (pagination + `title`, `search`, `createdAtAfter`, `createdAtBefore`, `ordering`)     | `AIChatConnection`: **`items`**, **`pageInfo`** |
| `aiChat`                 | `chatId: String!`                                                                                                  | `AIChat` (uuid, userId, title, messages, dates) |
| `createAIChat`           | `input: CreateAIChatInput!` (optional `title`, optional initial `messages[]` with contacts/confidence/explanation) | `AIChat`                                        |
| `updateAIChat`           | `chatId`, `input: UpdateAIChatInput!`                                                                              | `AIChat`                                        |
| `deleteAIChat`           | `chatId: String!`                                                                                                  | `Boolean`                                       |
| `sendMessage`            | `chatId`, `input: SendMessageInput!` (`message`, optional **`model`: `ModelSelection`**)                           | `AIChat`                                        |
| `analyzeEmailRisk`       | **`input: AnalyzeEmailRiskInput!`** (`email`)                                                                      | `EmailRiskAnalysisResponse`                     |
| `generateCompanySummary` | **`input: GenerateCompanySummaryInput!`** (**`companyName`**, **`industry`**)                                      | `CompanySummaryResponse`                        |
| `parseContactFilters`    | **`input: ParseFiltersInput!`** (**`query`**)                                                                      | `ParseFiltersResponse`                          |

**`Message` (API):** `sender`, `text`, optional **`contacts[]`**, **`confidence`**, **`explanation`**.

**`ModelSelection` (current API code):** still maps to **Gemini** id strings (`gemini-1.5-flash`, etc.). The doc warns these may need to stay aligned with **Contact AI / Hugging Face** if the Lambda service changes.

---

## 2. `aiChatService.ts` vs API

### Aligned

- **List:** `aiChats { aiChats(filters) { items { uuid, title, createdAt, updatedAt } pageInfo { total } } }` — shape matches `AIChatConnection` (you only request `total` in `pageInfo`; you can add `limit`, `offset`, `hasNext`, `hasPrevious`).
- **Get / create / send / delete:** Correct nesting under `aiChats`, and **`SendMessageInput`** uses `{ message }` (valid; **`model`** is optional and omitted).
- **Internal UI model:** Maps `sender` `user`/`ai` to chat `role` `user`/`assistant` — fine for UI.

### Resolved in app (2026-04)

1. **`analyzeEmailRisk`** — `analyzeEmailRisk(input: $input)` with **`AnalyzeEmailRiskInput`**.

2. **`generateCompanySummary`** — `input: { companyName, industry }` (**`GenerateCompanySummaryInput`**).

3. **`parseContactFilters`** — `input: { query }` (**`ParseFiltersInput`**).

4. **`updateAIChat`** — **`aiChatService.updateSession(chatId, input)`** added for title/message updates (UI rename can follow).

5. **Selections** — **`messages`** include **`contacts { … }`**, **`confidence`**, **`explanation`**; chats include **`userId`** where returned.

6. **`sendMessage`** — Optional **`model`** (`ModelSelection`); **composer** has model **select** + default.

7. **`listSessions`** — Passes **`ordering: "-created_at"`**, **`pageInfo`** fields; sidebar **search** calls **`loadSessions({ search })`**.

8. **Message time** — Still client-side placeholder until schema exposes per-message timestamps.

---

## 3. UI (`ai-chat/page.tsx`, `useAIChat.ts`)

- **Chat shell:** Sidebar + thread + **model** select + tool modals (**email risk**, **company summary** with name/industry, **parse filters** with NL textarea + tag results).
- **Delete chat** — Confirm **modal** before delete.
- **Retry** — **`sendMessage(textOverride)`** so retry resends the failed text without stale input state.

---

## 4. Codegen (`Gql*` in `generated/types.ts`)

- Largely reflects **list/chat** shapes; still verify **`SendMessageInput`**, **`ModelSelection`**, and utility inputs against the printed schema after fixing the three mutations.

---

## 5. Dashboard UI kit mapping

| Need                      | Kit / app direction                                                                       |
| ------------------------- | ----------------------------------------------------------------------------------------- |
| Chat layout               | Split pane (inbox list + thread) like messaging widgets; **`Card`** for tools modals      |
| Session list              | List group / scrollable sidebar; **search** input bound to `filters.search`               |
| Composer                  | Textarea + **Send**; optional **model** as **radio** or **select**                        |
| AI messages with contacts | Table or **card grid** for `contacts[]`; **badges** for `confidence`                      |
| Risk / summary tools      | **Modal** + form fields; **progress** / spinner while Lambda runs                         |
| NL → filters              | Single **query** textarea; result as **tags** or readonly JSON; **Apply to contacts** CTA |
| Charts                    | Optional: risk score gauge — use kit chart/stat widgets sparingly                         |

---

## 6. Smaller tasks (implementation order)

**Phase A — Fix GraphQL client (blocking)**

1. [x] **`analyzeEmailRisk(input: $input)`** · 2. [x] **`generateCompanySummary(input: $input)`** · 3. [x] **`parseContactFilters(input: $input)`** · 4. [x] **`graphql.contracts.test.ts`**.

**Phase B — Parity with doc / richer chat**

5. [x] **`updateAIChat`** in **`aiChatService.updateSession`**. [ ] Rename-thread UI.
6. [x] **Message** fields + **bubbles** for contacts / confidence / explanation.
7. [x] **`model`** + **select** in composer.
8. [x] **Search** + **ordering** in list; [ ] full date-range pagination UI.

**Phase C — Hooks / context**

9. [ ] **`useAIChatTools`** (optional); tools currently call **`aiChatService`** from the page.
10. [x] Send retry + optimistic user bubble (existing pattern).

**Phase D — Docs / backend alignment**

11. Reconcile **`17_AI_CHATS_MODULE.md`** / **`ModelSelection`** with **`types.py`** once Contact AI uses HF ids end-to-end.
12. If product requires **summary by `companyUuid`**, add a **gateway field** or a **BFF** step (load company → call summary); do not invent `companyUuid` on the mutation without API support.

---

## 7. Summary

- **Gateway** exposes **wrapped `input`** types for utilities; **`aiChatService`** and **`/ai-chat`** now match (**`AnalyzeEmailRiskInput`**, **`GenerateCompanySummaryInput`**, **`ParseFiltersInput`**).
- **Rich chat:** **`messages.contacts`**, **`confidence`**, **`explanation`**, optional **`SendMessageInput.model`**, **`updateAIChat`** service method, sidebar **search**, **delete** confirm.
- **Follow-ups:** rename-thread UI, **`useAIChatTools`**, date-range filters, **HF vs Gemini `ModelSelection`** alignment per backend deploy.
