/**
 * Optional `pageType` for auth mutations (`login` / `register` / `refreshToken`).
 * Gateway filters DocsAI `pages` when set: `docs` | `marketing` | `dashboard`.
 * `null` / `undefined` = no filter (full set for the user’s role).
 */
export const DEFAULT_AUTH_PAGE_TYPE: string | null = null;
