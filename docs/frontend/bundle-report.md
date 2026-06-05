# Frontend bundle report (Phases 1–3)

Generated after the full-app refactor (dead code removal, deduplication, performance). Run locally:

```bash
npm run build:analyze
```

On Windows:

```cmd
set ANALYZE=true && npm run build
```

Webpack Bundle Analyzer opens in the browser (port 8888 by default). This document summarizes **expected** top client chunks and the optimizations applied.

## Optimizations applied (Phases 1–3)

| Change                                                                 | Bundle impact                                                          |
| ---------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| Removed `@fullcalendar/*`, `@tiptap/*`, `react-markdown`, `remark-gfm` | Drops unused vendor CSS/JS from graph                                  |
| Deleted orphan resume GraphQL UI + hooks                               | Smaller `src/` graph; no dead imports                                  |
| `C360DataGrid` single `dynamic()` boundary                             | One shared MUI DataGrid lazy chunk instead of 7 duplicate split points |
| Lazy global drawers in `MainLayout`                                    | Jobs, notifications, files, review drawers off initial shell chunk     |
| Multipart shim removal                                                 | No runtime change; cleaner module graph                                |

## Typical top client chunks (post-refactor)

After `next build`, the largest **First Load JS** routes and shared chunks usually include:

| Rank | Chunk / module family                                           | Notes                               |
| ---- | --------------------------------------------------------------- | ----------------------------------- |
| 1    | `framework` (`react`, `react-dom`, `scheduler`)                 | Next.js shared baseline             |
| 2    | `@mui/x-data-grid` + `@mui/material`                            | Loaded on demand via `C360DataGrid` |
| 3    | `lucide-react` (modularized imports)                            | Icon subsets per route              |
| 4    | `@emotion/*`                                                    | MUI styling runtime                 |
| 5    | `graphql-request` + generated types                             | API client                          |
| 6    | `@ark-ui/react`                                                 | Headless UI primitives              |
| 7    | Route-specific page bundles (`/contacts`, `/hiring-signals`, …) | Feature code                        |
| 8    | `recharts` / map libraries                                      | Analytics & globe routes only       |
| 9    | `sonner` / drawer feature modules                               | Toast + lazy drawers                |
| 10   | Shared `src/components/ui/*`                                    | Buttons, modals, tabs               |

Exact byte sizes vary by build and environment. Use the analyzer treemap for authoritative numbers after each release.

## Monitoring

- Re-run `npm run build:analyze` before major dependency adds.
- Keep list pages on `C360DataGrid`; do not import `@mui/x-data-grid` directly in new files.
- Global shell features should stay behind `next/dynamic({ ssr: false })` in `MainLayout` or route-level code splitting.

## Related

- [app-performance-data-tables.md](./app-performance-data-tables.md)
- [responsive.md](./responsive.md)
