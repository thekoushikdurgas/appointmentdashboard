# EC2 deploy scripts (Contact360 dashboard)

| Script          | Who runs            | Purpose                                                             |
| --------------- | ------------------- | ------------------------------------------------------------------- |
| `ec2-setup.sh`  | `sudo`              | One-time server: Node 20, PM2, nginx, UFW.                          |
| `ec2-deploy.sh` | app user (`ubuntu`) | `npm install`, `next build`, `pm2 start` via `ecosystem.config.js`. |
| `ec2-update.sh` | app user            | `git pull`, rebuild, `pm2 reload`.                                  |
| `lib.sh`        | _(sourced)_         | Shared helpers — **do not execute directly**.                       |

## Required files in app root

- `package.json`, `next.config.*`, `ecosystem.config.js` (committed in this repo).
- `.env.production` — copy from `.env.production.example` for production URLs and `PORT`.

## Optional environment variables (shell / `.env.production`)

| Variable              | Meaning                                                                                                         |
| --------------------- | --------------------------------------------------------------------------------------------------------------- |
| `CONTACT360_API_ROOT` | Path to `contact360.io/api` on the **same** host — enables optional `scripts/verify_db_schema.py` after deploy. |
| `SKIP_DB_CHECK=1`     | Skip DB verification.                                                                                           |
| `API_HEALTH_URL`      | Full URL for `curl` health check (overrides `NEXT_PUBLIC_API_URL/health`).                                      |
| `PM2_APP_NAME`        | Override PM2 process name (default `contact360-dashboard`).                                                     |

**Note:** The Next.js app does not connect to PostgreSQL. Table/column checks run the **API**’s `verify_db_schema.py`, which needs `DATABASE_URL` and Python deps in that repo.

## Nginx

See `ec2-nginx-dashboard.conf` (if present) and comments at the end of `ec2-deploy.sh`.
