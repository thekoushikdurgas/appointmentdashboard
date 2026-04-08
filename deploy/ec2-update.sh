#!/bin/bash
###############################################################################
# EC2 — update existing Contact360 dashboard (git pull, build, PM2 reload).
#
#   cd /path/to/app
#   ./deploy/ec2-update.sh
#
# Optional env: same as ec2-deploy.sh (CONTACT360_API_ROOT, SKIP_DB_CHECK, API_HEALTH_URL)
###############################################################################

set -eo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=lib.sh
source "$SCRIPT_DIR/lib.sh"

deploy_resolve_app_dir
cd "$APP_DIR"

echo "=========================================="
echo "Contact360 Dashboard Application Update"
echo "=========================================="
echo ""

load_production_env

if [ ! -f ".env.production" ]; then
  print_warning ".env.production not found — using defaults."
fi

require_ecosystem_or_fail || exit 1

if ! pm2 list 2>/dev/null | grep -q "$PM2_APP_NAME"; then
  print_error "PM2 app '$PM2_APP_NAME' not found. Run ./deploy/ec2-deploy.sh first."
  exit 1
fi

if ! pm2 list 2>/dev/null | grep "$PM2_APP_NAME" | grep -q online; then
  print_warning "App exists but may not be online."
  pm2 list | grep "$PM2_APP_NAME" || true
  read -r -p "Continue? (y/N) " -n 1 reply
  echo ""
  if [[ ! ${reply:-} =~ ^[Yy]$ ]]; then
    exit 1
  fi
fi

BACKUP_DIR=".next.backup.$(date +%Y%m%d_%H%M%S)"
BACKUP_SUCCESS=false
if [ -d ".next" ]; then
  print_status "Backing up .next → $BACKUP_DIR"
  if cp -r .next "$BACKUP_DIR" 2>/dev/null; then
    BACKUP_SUCCESS=true
  else
    print_warning "Backup failed — continuing."
  fi
fi

print_status "Git pull..."
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "main")
git pull origin "$CURRENT_BRANCH" 2>/dev/null || git pull origin main 2>/dev/null || git pull origin master 2>/dev/null || {
  print_warning "git pull failed — building current tree."
}

print_status "npm install..."
npm install || exit 1

print_status "npm run build..."
BUILD_OK=false
if npm run build && [ -d ".next" ]; then
  BUILD_OK=true
fi

if [ "$BUILD_OK" != true ]; then
  print_error "Build failed."
  if [ "$BACKUP_SUCCESS" = true ] && [ -d "$BACKUP_DIR" ]; then
    rm -rf .next && mv "$BACKUP_DIR" .next && print_warning "Restored previous .next"
  fi
  exit 1
fi

ensure_logs_dir

print_status "PM2 reload..."
if pm2 reload ecosystem.config.js --env production 2>/dev/null; then
  print_status "Reload OK (zero-downtime when supported)."
else
  pm2 restart "$PM2_APP_NAME"
fi

sleep 3
optional_api_health_check || true
optional_database_schema_check || true

pm2 save
pm2 list
pm2 logs "$PM2_APP_NAME" --lines 20 --nostream || true

if [ "$BACKUP_SUCCESS" = true ]; then
  cnt=$(find . -maxdepth 1 -name '.next.backup.*' -type d 2>/dev/null | wc -l)
  if [ "${cnt:-0}" -gt 3 ]; then
    find . -maxdepth 1 -name '.next.backup.*' -type d -printf '%T@ %p\n' 2>/dev/null | sort -n | head -n -3 | cut -d' ' -f2- | xargs rm -rf 2>/dev/null || true
  fi
fi

print_status "Update complete."
