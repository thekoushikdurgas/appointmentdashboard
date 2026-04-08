#!/bin/bash

###############################################################################
# EC2 initial server setup — Ubuntu 22.04/24.04 for Contact360 **dashboard** (Next.js).
#
# Usage:
#   chmod +x deploy/ec2-setup.sh
#   sudo ./deploy/ec2-setup.sh
#
# Installs: git, build-essential, ufw, nginx, curl, Node.js 20.x (NodeSource), PM2.
# Does **not** install PostgreSQL or Python — those belong on the API host or managed RDS.
#
# After setup, clone the app (this repo’s `contact360.io/app` folder as app root), then:
#   cp .env.production.example .env.production
#   ./deploy/ec2-deploy.sh
###############################################################################

set -e

echo "=========================================="
echo "Contact360 Dashboard EC2 Server Setup"
echo "=========================================="
echo ""

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

print_status() { echo -e "${GREEN}[INFO]${NC} $1"; }
print_warning() { echo -e "${YELLOW}[WARN]${NC} $1"; }
print_error() { echo -e "${RED}[ERROR]${NC} $1"; }

if [ "$EUID" -ne 0 ]; then
  print_error "Run as root or with sudo."
  exit 1
fi

print_status "Updating system packages..."
apt update && apt upgrade -y

print_status "Installing packages: git, build-essential, ufw, nginx, curl..."
apt install -y git build-essential ufw nginx curl

print_status "Configuring UFW (SSH + Nginx)..."
ufw allow OpenSSH
ufw allow 'Nginx Full'
ufw --force enable
print_status "Firewall OK."

print_status "Installing Node.js 20.x LTS (NodeSource)..."
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

command -v node &>/dev/null || { print_error "Node.js failed."; exit 1; }
command -v npm &>/dev/null || { print_error "npm failed."; exit 1; }
print_status "Node $(node -v) | npm $(npm -v)"

print_status "Installing PM2 globally..."
npm install -g pm2
command -v pm2 &>/dev/null || { print_error "PM2 failed."; exit 1; }
print_status "PM2 $(pm2 -v)"

print_status "PM2 startup (systemd for ubuntu user)..."
pm2 startup systemd -u ubuntu --hp /home/ubuntu 2>/dev/null | tail -5 || print_warning "Run the printed sudo command manually if needed."

APP_DIR="/home/ubuntu/appointment"
mkdir -p "$APP_DIR/logs"
chown -R ubuntu:ubuntu "$APP_DIR" 2>/dev/null || true

print_status ""
print_status "=========================================="
print_status "Server setup completed."
print_status "=========================================="
print_status ""
print_status "Default app directory: $APP_DIR"
print_status ""
print_status "Next steps (as user ubuntu):"
print_status "  1. Clone or copy the dashboard app so package.json lives in $APP_DIR"
print_status "     (monorepo: use the contact360.io/app folder contents as app root)."
print_status "  2. Ensure ecosystem.config.js is present (committed in app repo)."
print_status "  3. cd $APP_DIR && cp .env.production.example .env.production && nano .env.production"
print_status "  4. ./deploy/ec2-deploy.sh"
print_status ""
print_status "Optional — database schema check from deploy scripts:"
print_status "  Set CONTACT360_API_ROOT=/path/to/contact360.io/api on the same host"
print_status "  with API venv + DATABASE_URL; or run verify_db_schema.py only on the API server."
print_status ""
