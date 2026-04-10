# EC2 deploy scripts (Contact360 dashboard)

| Script                  | Who runs              | Purpose                                                                 |
| ----------------------- | --------------------- | ----------------------------------------------------------------------- |
| `ec2-setup.sh`          | `sudo`                | One-time server: Node 20, PM2, nginx, UFW.                              |
| `ec2-deploy.sh`         | app user (`ubuntu`) | Interactive first deploy: `npm install`, `next build`, PM2 start.     |
| `ec2-update.sh`         | app user              | Interactive update: `git pull`, rebuild, `pm2 reload`.                  |
| `ec2-github-deploy.sh`  | app user / CI         | **Non-interactive** PM2 deploy (npm ci, build, PM2). Used by GitHub Actions; stops legacy Docker compose on :3000 if present. |
| `lib.sh`                | _(sourced)_           | Shared helpers — **do not execute directly**.                           |

## GitHub Actions (`.github/workflows/deploy.yml`)

1. SSH to EC2, `git fetch` / `reset` to the pushed branch.
2. Writes `.env.production` from repository secrets (`NEXT_PUBLIC_*`).
3. Runs **`bash deploy/ec2-github-deploy.sh`** — no Docker: `npm ci --legacy-peer-deps`, `next build`, `pm2 start` via `ecosystem.config.js`.

Requires on the instance: **Node + npm + PM2** (run `sudo ./deploy/ec2-setup.sh` once), clone at e.g. `$HOME/appointmentdashboard`, and `chmod +x deploy/*.sh` optional (`bash` does not require it).

If you previously used **Docker** on the same host, this script runs **`docker compose … down`** when `docker-compose.prod.yml` exists so port **3000** is free for PM2.

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
