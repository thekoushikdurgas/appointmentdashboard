#!/bin/bash
# shellcheck shell=bash
###############################################################################
# Shared helpers for Contact360 app EC2 deploy scripts.
# Source from ec2-deploy.sh / ec2-update.sh:
#   SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
#   # shellcheck source=lib.sh
#   source "$SCRIPT_DIR/lib.sh"
###############################################################################

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

print_status() { echo -e "${GREEN}[INFO]${NC} $1"; }
print_warning() { echo -e "${YELLOW}[WARN]${NC} $1"; }
print_error() { echo -e "${RED}[ERROR]${NC} $1"; }
print_step() { echo -e "${CYAN}[STEP]${NC} $1"; }

# Resolve app root (parent of deploy/) — call after sourcing this file from deploy/*.sh
deploy_resolve_app_dir() {
  local lib_dir
  lib_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
  APP_DIR="$(cd "$lib_dir/.." && pwd)"
  export APP_DIR
}

# Default PM2 app name (must match ecosystem.config.js default)
PM2_APP_NAME_DEFAULT="${PM2_APP_NAME:-contact360-dashboard}"

load_production_env() {
  PM2_APP_NAME="${PM2_APP_NAME:-$PM2_APP_NAME_DEFAULT}"
  export PORT="${PORT:-3000}"
  if [ -f "$APP_DIR/.env.production" ]; then
    set -a
    # shellcheck disable=SC1090
    source "$APP_DIR/.env.production" 2>/dev/null || true
    set +a
  fi
  PM2_APP_NAME="${PM2_APP_NAME:-$PM2_APP_NAME_DEFAULT}"
  export PM2_APP_NAME
  export PORT
}

ensure_logs_dir() {
  mkdir -p "$APP_DIR/logs"
}

require_command() {
  local cmd="$1"
  local hint="$2"
  if ! command -v "$cmd" &>/dev/null; then
    print_error "Required command not found: $cmd"
    [ -n "$hint" ] && print_error "$hint"
    return 1
  fi
}

require_ecosystem_or_fail() {
  if [ ! -f "$APP_DIR/ecosystem.config.js" ]; then
    print_error "ecosystem.config.js not found in $APP_DIR"
    print_error "It should be committed in the contact360.io/app repository."
    return 1
  fi
}

pm2_app_online() {
  pm2 jlist 2>/dev/null | grep -q "\"name\":\"${PM2_APP_NAME}\"" && \
    pm2 jlist 2>/dev/null | grep -A2 "\"name\":\"${PM2_APP_NAME}\"" | grep -q '"pm2_env":{"status":"online"'
}

# Fallback: parse pm2 list text
pm2_app_running() {
  if pm2 list 2>/dev/null | grep -q "${PM2_APP_NAME}.*online"; then
    return 0
  fi
  pm2 describe "$PM2_APP_NAME" &>/dev/null && return 0
  return 1
}

###############################################################################
# Optional: HTTP health check against API (dashboard has no direct DB).
# Uses API_HEALTH_URL or derives from NEXT_PUBLIC_API_URL in .env.production.
###############################################################################
optional_api_health_check() {
  load_production_env
  local base="${API_HEALTH_URL:-}"
  if [ -z "$base" ] && [ -n "${NEXT_PUBLIC_API_URL:-}" ]; then
    base="${NEXT_PUBLIC_API_URL%/}/health"
  fi
  if [ -z "$base" ]; then
    print_warning "Skipping API health check (set API_HEALTH_URL or NEXT_PUBLIC_API_URL in .env.production)."
    return 0
  fi
  print_step "Checking API health: $base"
  if curl -sfS --max-time 15 "$base" >/dev/null; then
    print_status "API health check OK."
  else
    print_warning "API health check failed or unreachable (deploy continues). Verify URL and TLS."
  fi
}

###############################################################################
# Optional: PostgreSQL schema verification (runs API repo script; not the Next app).
# Requires: CONTACT360_API_ROOT pointing at contact360.io/api, Python venv, DATABASE_URL in API .env
###############################################################################
optional_database_schema_check() {
  if [ "${SKIP_DB_CHECK:-0}" = "1" ]; then
    print_warning "SKIP_DB_CHECK=1 — skipping database schema verification."
    return 0
  fi
  local api_root="${CONTACT360_API_ROOT:-}"
  if [ -z "$api_root" ] || [ ! -d "$api_root" ]; then
    print_warning "Skipping DB schema check (set CONTACT360_API_ROOT to your API repo path on this server)."
    return 0
  fi
  local verify_script="$api_root/scripts/verify_db_schema.py"
  if [ ! -f "$verify_script" ]; then
    print_warning "Not found: $verify_script — skipping DB check."
    return 0
  fi
  local py=""
  if [ -x "$api_root/venv/bin/python" ]; then
    py="$api_root/venv/bin/python"
  elif command -v python3 &>/dev/null; then
    py="python3"
  else
    print_warning "No Python found — skipping DB schema check."
    return 0
  fi
  print_step "Running API database schema verification..."
  (cd "$api_root" && "$py" scripts/verify_db_schema.py) && print_status "Database schema verification passed." || {
    print_warning "Database schema verification failed or exited non-zero — fix API/DB before relying on production."
    return 0
  }
}
