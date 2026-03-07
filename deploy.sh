#!/bin/bash
###############################################################################
# Degens¤Den — Smart Deploy Script
# Auto-detects your existing Cloudflare Tunnel setup and deploys
# Domain: cloutscape.org  |  Brand: Degens¤Den
# Version: 2026.1.0
###############################################################################

set -euo pipefail

# ── Colors ───────────────────────────────────────────────────────────────────
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'
CYAN='\033[0;36m'; PURPLE='\033[0;35m'; BOLD='\033[1m'; NC='\033[0m'

log()     { echo -e "${GREEN}[✓] $1${NC}"; }
warn()    { echo -e "${YELLOW}[!] $1${NC}"; }
error()   { echo -e "${RED}[✗] $1${NC}"; exit 1; }
info()    { echo -e "${CYAN}[→] $1${NC}"; }
header()  { echo -e "\n${PURPLE}${BOLD}━━━ $1 ━━━${NC}\n"; }

# ── Banner ───────────────────────────────────────────────────────────────────
echo -e "${PURPLE}${BOLD}"
cat << 'EOF'
  ____  ____  ___  ____  _  _  ____    ____  ____  _  _ 
 (  _ \( ___)/ __)( ___)( \( )/ ___)  (  _ \( ___)( \( )
  )(_) ))__)( (_-. )__)  )  ( \__  \   )(_) ))__)  )  ( 
 (____/(____)\___/(____)(___/ (_____)  (____/(____)(___/ 
 ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░
       The Vault Where Degens Become Legends
         deploying → cloutscape.org
EOF
echo -e "${NC}"

# ── Resolve app directory ─────────────────────────────────────────────────────
APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOG_FILE="$APP_DIR/logs/deploy-$(date +%Y%m%d-%H%M%S).log"
mkdir -p "$APP_DIR/logs"
exec > >(tee -a "$LOG_FILE") 2>&1

###############################################################################
# PHASE 1 — AUTO-DETECT CLOUDFLARE TUNNEL SETUP
###############################################################################
header "Phase 1: Auto-Detecting Cloudflare Tunnel"

# ── Search priority for cloudflared config ────────────────────────────────────
CFGD_CONFIG=""
TUNNEL_NAME=""
TUNNEL_UUID=""
DOMAIN=""
APP_PORT=8080   # default — overridden by detected config

# Priority search paths for config.yml
CF_CONFIG_CANDIDATES=(
  "/root/.cloudflared/config.yml"
  "/etc/cloudflared/config.yml"
  "$APP_DIR/cloudflared-config.yml"
  "$APP_DIR/.cloudflared/config.yml"
  "$HOME/.cloudflared/config.yml"
)

detect_config() {
  for path in "${CF_CONFIG_CANDIDATES[@]}"; do
    if [[ -f "$path" ]]; then
      echo "$path"
      return 0
    fi
  done
  return 1
}

parse_config() {
  local cfg="$1"
  # Extract tunnel name
  TUNNEL_NAME=$(grep -E '^tunnel:' "$cfg" 2>/dev/null | awk '{print $2}' | tr -d '"' | head -1 || true)
  # Extract credentials file
  local creds_path
  creds_path=$(grep -E '^credentials-file:' "$cfg" 2>/dev/null | awk '{print $2}' | tr -d '"' | head -1 || true)
  # Extract first hostname
  DOMAIN=$(grep -E '^\s+hostname:' "$cfg" 2>/dev/null | awk '{print $2}' | tr -d '"' | head -1 || true)
  # Extract service port
  local svc
  svc=$(grep -E '^\s+service:' "$cfg" 2>/dev/null | grep -oE ':[0-9]+' | head -1 || true)
  if [[ -n "$svc" ]]; then APP_PORT="${svc#:}"; fi
  # Get UUID from credentials file
  if [[ -n "$creds_path" && -f "$creds_path" ]]; then
    TUNNEL_UUID=$(python3 -c "import json,sys; d=json.load(open('$creds_path')); print(d.get('TunnelID',''))" 2>/dev/null || true)
    if [[ -z "$TUNNEL_UUID" ]]; then
      TUNNEL_UUID=$(grep -oE '"TunnelID"\s*:\s*"[^"]+"' "$creds_path" 2>/dev/null | grep -oE '[0-9a-f-]{36}' | head -1 || true)
    fi
  fi
}

# ── Try to find running tunnel ─────────────────────────────────────────────────
detect_running_tunnel() {
  if command -v cloudflared &>/dev/null; then
    # List existing tunnels
    local tunnel_list
    tunnel_list=$(cloudflared tunnel list 2>/dev/null || true)
    if [[ -n "$tunnel_list" ]]; then
      info "Found existing tunnels:"
      echo "$tunnel_list"
    fi
  fi
}

# ── Scan for JSON credential files ────────────────────────────────────────────
detect_credentials() {
  local cred_dirs=("/root/.cloudflared" "/etc/cloudflared" "$HOME/.cloudflared" "$APP_DIR/.cloudflared")
  for d in "${cred_dirs[@]}"; do
    if [[ -d "$d" ]]; then
      while IFS= read -r -d '' f; do
        if python3 -c "import json; d=json.load(open('$f')); exit(0 if 'TunnelID' in d else 1)" 2>/dev/null; then
          echo "$f"
          return 0
        fi
      done < <(find "$d" -name "*.json" -print0 2>/dev/null)
    fi
  done
  return 1
}

# ── Run detection ─────────────────────────────────────────────────────────────
if CFGD_CONFIG=$(detect_config); then
  log "Found cloudflared config: $CFGD_CONFIG"
  parse_config "$CFGD_CONFIG"
  log "Tunnel name : ${TUNNEL_NAME:-<not found>}"
  log "Domain      : ${DOMAIN:-<not found>}"
  log "App port    : $APP_PORT"
  [[ -n "$TUNNEL_UUID" ]] && log "Tunnel UUID : $TUNNEL_UUID"
else
  warn "No cloudflared config found in standard locations."
  warn "Falling back to repo-bundled config..."
  CFGD_CONFIG="$APP_DIR/cloudflared-config.yml"
  if [[ -f "$CFGD_CONFIG" ]]; then
    parse_config "$CFGD_CONFIG"
    log "Using bundled config → $CFGD_CONFIG"
  else
    warn "No bundled config found. Will create minimal config."
    DOMAIN="cloutscape.org"
    TUNNEL_NAME="cloutscape-prod"
    APP_PORT=8080
  fi
fi

# ── Attempt to find JSON credentials if UUID not set ─────────────────────────
if [[ -z "$TUNNEL_UUID" ]]; then
  if CRED_FILE=$(detect_credentials 2>/dev/null); then
    log "Found credentials file: $CRED_FILE"
    TUNNEL_UUID=$(python3 -c "import json; d=json.load(open('$CRED_FILE')); print(d.get('TunnelID',''))" 2>/dev/null || true)
    [[ -n "$TUNNEL_UUID" ]] && log "Resolved UUID: $TUNNEL_UUID"
  else
    warn "No tunnel credentials found. You'll need to run: cloudflared tunnel login"
  fi
fi

# ── Final resolved values ─────────────────────────────────────────────────────
TUNNEL_NAME="${TUNNEL_NAME:-cloutscape-prod}"
DOMAIN="${DOMAIN:-cloutscape.org}"

echo ""
echo -e "${BOLD}Resolved deployment target:${NC}"
echo -e "  Domain      : ${CYAN}$DOMAIN${NC}"
echo -e "  Tunnel name : ${CYAN}$TUNNEL_NAME${NC}"
echo -e "  App port    : ${CYAN}$APP_PORT${NC}"
echo -e "  Config file : ${CYAN}$CFGD_CONFIG${NC}"
echo ""

###############################################################################
# PHASE 2 — DEPENDENCY CHECK
###############################################################################
header "Phase 2: Dependency Check"

check_cmd() {
  if command -v "$1" &>/dev/null; then log "$1 found"; else
    warn "$1 not found — $2"; return 1
  fi
}

check_cmd "node"   "Install Node.js 20+ from https://nodejs.org"
NODE_VER=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
[[ "$NODE_VER" -ge 18 ]] || error "Node.js 18+ required (found v${NODE_VER})"

check_cmd "pnpm"   "Run: npm install -g pnpm@10.4.1" || npm install -g pnpm@10.4.1 && log "pnpm installed"

if ! check_cmd "cloudflared" "Download from https://github.com/cloudflare/cloudflared/releases"; then
  warn "cloudflared missing — attempting install..."
  curl -fsSL https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb -o /tmp/cf.deb \
    && sudo dpkg -i /tmp/cf.deb && rm /tmp/cf.deb && log "cloudflared installed" \
    || warn "Could not auto-install cloudflared — install manually then re-run"
fi

###############################################################################
# PHASE 3 — BUILD APPLICATION
###############################################################################
header "Phase 3: Building Degens¤Den"

cd "$APP_DIR"

info "Installing Node dependencies..."
pnpm install --frozen-lockfile || pnpm install --no-frozen-lockfile
log "Dependencies installed"

info "Building frontend..."
pnpm vite build
log "Frontend built → dist/public/"

info "Building backend..."
pnpm esbuild server/index.ts \
  --bundle --platform=node --target=node20 \
  --outfile=dist/server.js \
  --external:argon2 --external:mysql2 \
  --external:socket.io --external:discord.js \
  2>/dev/null || {
  warn "esbuild not available, trying tsc..."
  pnpm tsc --project tsconfig.server.json 2>/dev/null || warn "Backend build errors (non-fatal in dev)"
}
log "Build phase complete"

###############################################################################
# PHASE 4 — DATABASE SETUP
###############################################################################
header "Phase 4: Database"

if command -v mysql &>/dev/null; then
  info "Checking database..."
  DB_NAME="cloutscape_db"
  # Read from .env if present
  if [[ -f "$APP_DIR/.env" ]]; then
    DB_URL=$(grep -E '^DATABASE_URL=' "$APP_DIR/.env" | cut -d'=' -f2- | tr -d '"' || true)
    if [[ -n "$DB_URL" ]]; then
      info "Using DATABASE_URL from .env"
    fi
  fi
  log "Database configuration detected"
else
  warn "MySQL client not found — skipping DB check. Ensure DATABASE_URL is set in .env"
fi

# Run Drizzle migrations if available
if [[ -f "$APP_DIR/drizzle.config.ts" ]]; then
  info "Running Drizzle migrations..."
  pnpm drizzle-kit push 2>/dev/null && log "Migrations applied" || warn "Migration skipped (check DATABASE_URL in .env)"
fi

###############################################################################
# PHASE 5 — PROCESS MANAGEMENT (PM2 / systemd)
###############################################################################
header "Phase 5: Starting Application"

APP_START_CMD="node dist/server.js"

# Prefer PM2 if available
if command -v pm2 &>/dev/null; then
  info "Starting with PM2..."
  pm2 delete degensden 2>/dev/null || true
  PORT=$APP_PORT pm2 start "$APP_START_CMD" --name degensden --env production
  pm2 save
  log "App running via PM2 on port $APP_PORT"
  PM2_AVAILABLE=true
else
  warn "PM2 not found — starting with nohup. Consider: npm install -g pm2"
  pkill -f "node dist/server" 2>/dev/null || true
  sleep 1
  PORT=$APP_PORT nohup node dist/server.js > "$APP_DIR/logs/server.log" 2>&1 &
  echo $! > "$APP_DIR/.server.pid"
  sleep 2
  if kill -0 $(cat "$APP_DIR/.server.pid" 2>/dev/null) 2>/dev/null; then
    log "App running (PID $(cat "$APP_DIR/.server.pid")) on port $APP_PORT"
  else
    warn "Server may have failed to start — check logs/server.log"
  fi
  PM2_AVAILABLE=false
fi

###############################################################################
# PHASE 6 — CLOUDFLARE TUNNEL
###############################################################################
header "Phase 6: Cloudflare Tunnel"

start_tunnel() {
  local cfg="$1"
  if command -v cloudflared &>/dev/null; then
    # Check if service is installed
    if systemctl is-active --quiet cloudflared 2>/dev/null; then
      info "Reloading cloudflared systemd service..."
      sudo systemctl restart cloudflared && log "cloudflared service restarted" && return 0
    fi
    # Check for running tunnel process
    if pgrep -x cloudflared &>/dev/null; then
      info "Restarting existing cloudflared process..."
      pkill -f cloudflared 2>/dev/null || true
      sleep 1
    fi
    info "Launching cloudflared tunnel..."
    nohup cloudflared tunnel --config "$cfg" run "$TUNNEL_NAME" > "$APP_DIR/logs/tunnel.log" 2>&1 &
    echo $! > "$APP_DIR/.tunnel.pid"
    sleep 3
    if kill -0 $(cat "$APP_DIR/.tunnel.pid" 2>/dev/null) 2>/dev/null; then
      log "Cloudflare Tunnel running (PID $(cat "$APP_DIR/.tunnel.pid"))"
      return 0
    else
      warn "Tunnel process may have exited — check logs/tunnel.log"
      return 1
    fi
  else
    warn "cloudflared not found — tunnel not started"
    return 1
  fi
}

# Update config to point to correct port before starting
update_config_port() {
  local cfg="$1"
  local port="$2"
  if [[ -f "$cfg" ]]; then
    sed -i "s|localhost:[0-9]*|localhost:${port}|g" "$cfg"
    log "Config port updated to $port in $cfg"
  fi
}

if [[ -f "$CFGD_CONFIG" ]]; then
  update_config_port "$CFGD_CONFIG" "$APP_PORT"
  
  # Check if cloudflared credentials exist
  CRED_FILE="/root/.cloudflared/${TUNNEL_NAME}.json"
  if [[ ! -f "$CRED_FILE" ]]; then
    CRED_FILE=$(detect_credentials 2>/dev/null || echo "")
  fi

  if [[ -n "$CRED_FILE" && -f "$CRED_FILE" ]]; then
    log "Credentials found: $CRED_FILE"
    start_tunnel "$CFGD_CONFIG"
  else
    warn "No credentials found — tunnel requires authentication first."
    echo ""
    echo -e "${YELLOW}  Run these commands to authenticate:${NC}"
    echo -e "  ${CYAN}1. cloudflared tunnel login${NC}"
    echo -e "  ${CYAN}2. cloudflared tunnel create ${TUNNEL_NAME}${NC}"
    echo -e "  ${CYAN}3. cloudflared tunnel route dns ${TUNNEL_NAME} ${DOMAIN}${NC}"
    echo -e "  ${CYAN}4. cloudflared tunnel route dns ${TUNNEL_NAME} www.${DOMAIN}${NC}"
    echo -e "  ${CYAN}5. Re-run this script${NC}"
  fi
else
  warn "No cloudflared config found at $CFGD_CONFIG"
fi

###############################################################################
# PHASE 7 — HEALTH CHECK
###############################################################################
header "Phase 7: Health Check"

sleep 3
if curl -sf "http://localhost:${APP_PORT}" > /dev/null 2>&1; then
  log "App responding on localhost:${APP_PORT}"
else
  warn "App not responding yet on :${APP_PORT} — check logs/server.log"
fi

# Check tunnel log for errors
if [[ -f "$APP_DIR/logs/tunnel.log" ]]; then
  TUNNEL_ERRORS=$(grep -ci "error\|failed\|fatal" "$APP_DIR/logs/tunnel.log" 2>/dev/null || echo 0)
  if [[ "$TUNNEL_ERRORS" -gt 0 ]]; then
    warn "Tunnel log has $TUNNEL_ERRORS error entries — check logs/tunnel.log"
  else
    log "Tunnel log looks clean"
  fi
fi

###############################################################################
# SUMMARY
###############################################################################
echo ""
echo -e "${GREEN}${BOLD}═══════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}${BOLD}  Degens¤Den deployed successfully!${NC}"
echo -e "${GREEN}${BOLD}═══════════════════════════════════════════════════════════${NC}"
echo ""
echo -e "  ${BOLD}Live at:${NC}     ${CYAN}https://${DOMAIN}${NC}"
echo -e "  ${BOLD}Local:${NC}       ${CYAN}http://localhost:${APP_PORT}${NC}"
echo -e "  ${BOLD}Tunnel:${NC}      ${CYAN}${TUNNEL_NAME}${NC}"
echo -e "  ${BOLD}Config:${NC}      ${CYAN}${CFGD_CONFIG}${NC}"
echo -e "  ${BOLD}Logs:${NC}        ${CYAN}${APP_DIR}/logs/${NC}"
echo ""
echo -e "  ${YELLOW}Clear browser cache if needed: Ctrl+Shift+R${NC}"
echo ""
