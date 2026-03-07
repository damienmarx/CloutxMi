#!/bin/bash
###############################################################################
# Degens¤Den — Pull Latest & Redeploy
# Pulls from GitHub degens-den-complete branch and re-runs smart deploy
###############################################################################

set -euo pipefail

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; CYAN='\033[0;36m'; NC='\033[0m'
log()  { echo -e "${GREEN}[✓] $1${NC}"; }
info() { echo -e "${CYAN}[→] $1${NC}"; }
warn() { echo -e "${YELLOW}[!] $1${NC}"; }

APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo -e "${CYAN}"
echo "╔════════════════════════════════════════════════╗"
echo "║   Degens¤Den — Pull & Redeploy                 ║"
echo "║   cloutscape.org                               ║"
echo "╚════════════════════════════════════════════════╝"
echo -e "${NC}"

# ── Stop running server gracefully ─────────────────────────────────────────
info "Stopping current server..."
if command -v pm2 &>/dev/null; then
  pm2 stop degensden 2>/dev/null || true
  log "PM2 process stopped"
elif [[ -f "$APP_DIR/.server.pid" ]]; then
  kill $(cat "$APP_DIR/.server.pid") 2>/dev/null || true
  rm -f "$APP_DIR/.server.pid"
  log "Server process stopped"
else
  pkill -f "node dist/server" 2>/dev/null || true
  warn "Server stopped (was not managed)"
fi

# ── Pause tunnel during update ──────────────────────────────────────────────
info "Pausing Cloudflare Tunnel..."
if systemctl is-active --quiet cloudflared 2>/dev/null; then
  sudo systemctl stop cloudflared
  TUNNEL_WAS_SYSTEMD=true
  log "cloudflared service paused"
elif [[ -f "$APP_DIR/.tunnel.pid" ]]; then
  kill $(cat "$APP_DIR/.tunnel.pid") 2>/dev/null || true
  rm -f "$APP_DIR/.tunnel.pid"
  TUNNEL_WAS_SYSTEMD=false
  log "Tunnel process paused"
else
  TUNNEL_WAS_SYSTEMD=false
fi

# ── Pull latest code ────────────────────────────────────────────────────────
info "Pulling latest from GitHub (degens-den-complete)..."
cd "$APP_DIR"
git fetch origin
git reset --hard origin/degens-den-complete
git pull origin degens-den-complete 2>/dev/null || git pull origin main 2>/dev/null || true
log "Latest code pulled"

# ── Run full deploy ─────────────────────────────────────────────────────────
info "Running smart deploy..."
chmod +x "$APP_DIR/deploy.sh"
exec "$APP_DIR/deploy.sh"
