# Contact360 App — Dashboard

User-facing dashboard SPA for [app.contact360.io](https://app.contact360.io).

- **Framework:** Next.js 16 (App Router), React 19, TypeScript
- **Styling:** Custom CSS with Dashboard UI kit design tokens (**no Tailwind** — intentional; see below)
- **API:** GraphQL via `graphql-request` → `contact360.io/api`
- **Deploy:** EC2 **`54.160.179.222`** (HTTP) and **`app.contact360.io`** (HTTPS recommended); reverse proxy (nginx) → `next start` on port **3000** (or Docker). Gateway: **`api.contact360.io`** — must allow **CORS** for `https://app.contact360.io` (and `http://localhost:3000` for dev) via `ALLOWED_ORIGINS` on the API.
- **Admin / logs:** Operations UI lives in [contact360.io/admin](https://admin.contact360.io) (separate repo); optional `NEXT_PUBLIC_ADMIN_URL` links from Settings.

## Quick start

```bash
cp .env.example .env.local
# Edit .env.local — set NEXT_PUBLIC_API_URL
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment variables

| Variable                              | Description           | Default                     |
| ------------------------------------- | --------------------- | --------------------------- |
| `NEXT_PUBLIC_API_URL`                 | Backend base URL      | `https://api.contact360.io` (prod build) |
| `NEXT_PUBLIC_GRAPHQL_URL`             | Full GraphQL endpoint | `${API_URL}/graphql` in prod; dev uses `/graphql` rewrite |
| `GRAPHQL_UPSTREAM_URL`                | Dev proxy target only | `https://api.contact360.io` |
| `NEXT_PUBLIC_APP_URL`                 | Canonical app URL     | `https://app.contact360.io` (optional) |
| `NEXT_PUBLIC_JOBS_S3_BUCKET`          | S3 bucket for jobs    | `appointment360uploads`    |
| `NEXT_PUBLIC_EXPORTS_FEATURE_ENABLED` | Enable export feature | `false`                    |

## Commands

| Command                        | Purpose                                                                                                                    |
| ------------------------------ | -------------------------------------------------------------------------------------------------------------------------- |
| `npm run dev`                  | Development server                                                                                                         |
| `npm run build`                | Production build                                                                                                           |
| `npm run start`                | Start production server                                                                                                    |
| `npm run lint`                 | ESLint                                                                                                                     |
| `npm run typecheck`            | TypeScript check                                                                                                           |
| `npm run test`                 | Vitest unit tests                                                                                                          |
| `npm run test:e2e`             | Playwright (`e2e/smoke.spec.ts`, `e2e/auth-guard.spec.ts`)                                                                  |
| `npm run check:best-practices` | Scored Next.js hygiene checklist (JSON under `reports/`; run `node scripts/check-best-practices.mjs --help`)               |
| `npm run css:inventory`        | CSS design-system report: `@import` graph, `.c360-*` inventory, inline `style={{}}` hotspots → `reports/css-inventory.txt` |
| `npm run health:smoke`         | `GET` gateway `/health` (override with `API_HEALTH_URL`) |
| `npm run codegen`              | Introspect GraphQL schema → `src/graphql/generated/types.ts` (requires a reachable gateway; set `CODEGEN_SCHEMA_URL` or run when `https://api.contact360.io/graphql` is up) |

Runs as part of `npm run ci` (after tests: `css:inventory`, then `check:best-practices`, then `build`). Options mirror the Django `check_best_practices` flow in `contact360.io/2`: `--category`, `--output`, `--format`, `--threshold` (default 80), `--no-fail`. Optional overrides: [.next-checker-config.json](.next-checker-config.json).

## Styling / CSS (custom design system)

- **Entry:** [`app/globals.css`](app/globals.css) pulls layered sheets from [`app/css/`](app/css/) (core, layout, components barrel, utilities, vendor, responsive).
- **Component partials:** [`app/css/components.css`](app/css/components.css) is the barrel; numbered files live under `app/css/components/NN-*.css`. Add new feature CSS to the smallest relevant partial, or introduce a new numbered file and `@import` it from the barrel.
- **Naming:** Prefer existing utilities in [`app/css/utilities.css`](app/css/utilities.css) and classes prefixed with `c360-` (e.g. `c360-btn`, `c360-card`).
- **Inline styles:** Prefer classes and `--c360-*` CSS variables on a wrapper. Keep `style={{}}` only for truly dynamic values (e.g. measured `top`/`left`, chart library APIs, portals).
- **Tailwind / PostCSS:** This app does not use Tailwind; adding it would duplicate the token system and imply a large migration. Prefer extending the custom layers above.
- **Reports:** `npm run css:inventory` (also step `[0]` in `codebase_state.bat`) writes `reports/css-inventory.txt` for audits and CI artifacts.
- **Deeper guide:** [docs/CSS.md](docs/CSS.md) — interpreting the inventory report, splitting partials, and checker thresholds.

## Internal docs (app)

- `docs/DIALOG-PATTERNS.md` — Sonner vs SweetAlert policy
- `docs/AI-CHAT.md` — AI transport notes

## Git setup

```bash
git remote add origin https://github.com/thekoushikdurgas/appointmentdashboard.git
git branch -M dashboard
git commit -m "Your message"
git push -u origin dashboard
```

## Security notes

- Serve the app over **HTTPS** in production; the default API base is **`https://api.contact360.io`** so the browser does not block mixed content.
- If you must use `http://` for the API, set `NEXT_PUBLIC_API_URL` explicitly (not recommended for HTTPS sites).

## Docker deploy

```bash
docker build -t contact360-app .
docker run -p 3000:3000 --env-file .env.local contact360-app
```

## Architecture

```
app/                    # Next.js App Router
├── (auth)/             # Login, Register
├── (dashboard)/        # Protected dashboard pages
└── css/                # Design token CSS layers

src/
├── components/         # UI primitives, layout, patterns, shared
├── context/            # AuthContext, ThemeContext, RoleContext
├── hooks/              # Feature hooks
├── lib/                # Config, GraphQL client, token manager
├── services/graphql/   # All API modules
└── types/              # TypeScript types
```

## Era roadmap

| Era  | Theme                | Key surfaces                  |
| ---- | -------------------- | ----------------------------- |
| 0.x  | Foundation           | Shell, design system, layout  |
| 1.x  | User/billing/credit  | Auth, profile, billing, usage |
| 2.x  | Email system         | Finder, verifier, jobs, files |
| 3.x  | Contact/company data | Contacts, companies, search   |
| 4.x  | Extension/SN         | LinkedIn, activities          |
| 5.x  | AI workflows         | AI chat, live voice           |
| 6.x  | Reliability          | Status, health                |
| 7.x  | Deployment           | Admin, governance             |
| 8.x  | Public APIs          | Analytics, API docs           |
| 9.x  | Ecosystem            | Integrations, [pageId]        |
| 10.x | Email campaign       | Campaigns, sequences          |
