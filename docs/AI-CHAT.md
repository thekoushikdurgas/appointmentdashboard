# AI Chat transport

The dashboard sends messages through GraphQL `aiChats` mutations via `src/services/graphql/aiChatService.ts`.

**Streaming:** The gateway may expose SSE for token streaming; the current app path uses request/response GraphQL unless a dedicated streaming client is wired. See monorepo `docs/backend/endpoints/contact360.io/EVENTS-BOUNDARY.md` for the SSE contract and constraints.

**UI:** `app/(dashboard)/ai-chat/page.tsx` renders markdown responses with `react-markdown` + `remark-gfm`.
