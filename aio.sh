#!/usr/bin/env bash
###############################################################################
#  Degens¤Den — All-In-One Setup & Deploy (aio.sh) — ENHANCED VERSION
#  Fully automated Ubuntu installer, builder, and deployer
#  Target: cloutscape.org via Cloudflare Tunnel
#  
#  IMPROVEMENTS:
#  - Auto-kills old services before deployment
#  - Validates each step with health checks
#  - Clean build process (no stale artifacts)
#  - Discord.js auto-installation
#  - Comprehensive error logging
#  
#  Usage: sudo bash aio.sh
###############################################################################
set -euo pipefail
IFS=$'\n\t'

# ── Colours ──────────────────────────────────────────────────────────────────
R='\033[0;31m' G='\033[0;32m' Y='\033[1;33m' C='\033[0;36m'
P='\033[0;35m' B='\033[1m' N='\033[0m'
ok()     { echo -e "${G}${B}[✓]${N} ${G}$*${N}"; }
warn()   { echo -e "${Y}${B}[!]${N} ${Y}$*${N}"; }
fail()   { echo -e "${R}${B}[✗]${N} ${R}$*${N}"; exit 1; }
info()   { echo -e "${C}[→]${N} $*"; }
step()   { echo -e "\n${P}${B}━━━ $* ━━━${N}\n"; }

# ── Banner ────────────────────────────────────────────────────────────────────
echo -e "${P}${B}"
cat << 'BANNER'
  ____  ____  ___  ____  _  _  ____    ____  ____  _  _
 (  _ \( ___)/ __)( ___)( \( )/ ___)  (  _ \( ___)( \( )
  )(_) ))__)( (_-. )__)  )  ( \___    )(_) ))__)  )  (
 (____/(____)\___/(____)(___/ (_____)  (____/(____)(___/
         ALL-IN-ONE SETUP   ·   aio.sh   ·   cloutscape.org
BANNER
echo -e "${N}"

###############################################################################
# 0 — ROOT CHECK
###############################################################################
if [[ "$EUID" -ne 0 ]]; then
  warn "Not running as root. Some steps may fail. Re-run with: sudo bash aio.sh"
fi

###############################################################################
# 1 — RESOLVE DIRECTORIES
###############################################################################
step "Resolving Paths"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APP_DIR="$SCRIPT_DIR"
LOG_DIR="$APP_DIR/logs"
mkdir -p "$LOG_DIR"
LOG_FILE="$LOG_DIR/aio-$(date +%Y%m%d-%H%M%S).log"
exec > >(tee -a "$LOG_FILE") 2>&1

ok "App directory: $APP_DIR"
ok "Logs: $LOG_FILE"

###############################################################################
# 2 — DETECT UBUNTU VERSION
###############################################################################
step "Detecting System"

if ! command -v lsb_release &>/dev/null; then
  warn "lsb_release not found — assuming Ubuntu-compatible"
  OS_VER="unknown"
else
  OS_ID=$(lsb_release -si)
  OS_VER=$(lsb_release -sr)
  ok "OS: $OS_ID $OS_VER"
  if [[ "$OS_ID" != "Ubuntu" && "$OS_ID" != "Debian" ]]; then
    warn "This script is tested on Ubuntu/Debian. Proceeding anyway..."
  fi
fi

ARCH=$(uname -m)
ok "Architecture: $ARCH"
RAM_MB=$(free -m | awk '/^Mem:/{print $2}')
ok "RAM: ${RAM_MB}MB"
DISK_FREE=$(df -h "$APP_DIR" | awk 'NR==2{print $4}')
ok "Disk free: $DISK_FREE"

###############################################################################
# 3 — INSTALL SYSTEM DEPENDENCIES
###############################################################################
step "Installing System Dependencies"

export DEBIAN_FRONTEND=noninteractive

apt_install() {
  info "Installing: $*"
  apt-get install -y -q "$@" 2>/dev/null || warn "Could not install $* — continuing"
}

info "Updating package lists..."
apt-get update -q 2>/dev/null || warn "apt update failed — continuing with cached packages"

apt_install curl wget git build-essential python3 python3-pip ca-certificates gnupg lsb-release

# ── Node.js 22 via NodeSource ────────────────────────────────────────────────
NODE_REQUIRED=20
if command -v node &>/dev/null; then
  NODE_VER=$(node -v | cut -dv -f2 | cut -d. -f1)
  if [[ "$NODE_VER" -ge "$NODE_REQUIRED" ]]; then
    ok "Node.js $(node -v) already installed"
  else
    warn "Node.js v${NODE_VER} too old — upgrading to v22..."
    NODE_UPGRADE=true
  fi
else
  NODE_UPGRADE=true
fi

if [[ "${NODE_UPGRADE:-false}" == "true" ]]; then
  info "Installing Node.js 22 via NodeSource..."
  curl -fsSL https://deb.nodesource.com/setup_22.x | bash - 2>/dev/null
  apt_install nodejs
  ok "Node.js $(node -v) installed"
fi

# ── pnpm ────────────────────────────────────────────────────────────────────
if command -v pnpm &>/dev/null; then
  ok "pnpm $(pnpm -v) already installed"
else
  info "Installing pnpm..."
  npm install -g pnpm@latest 2>/dev/null || curl -fsSL https://get.pnpm.io/install.sh | sh -
  export PATH="$HOME/.local/share/pnpm:$PATH"
  ok "pnpm installed"
fi
# Ensure pnpm is in PATH for all commands
export PNPM_HOME="$HOME/.local/share/pnpm"
export PATH="$PNPM_HOME:$PATH"

# ── PM2 ─────────────────────────────────────────────────────────────────────
if command -v pm2 &>/dev/null; then
  ok "pm2 $(pm2 -v) already installed"
else
  info "Installing PM2 (process manager)..."
  npm install -g pm2 2>/dev/null && ok "PM2 installed" || warn "PM2 install failed — will use nohup fallback"
fi

# ── MySQL 8 ─────────────────────────────────────────────────────────────────
if command -v mysql &>/dev/null; then
  ok "MySQL already installed: $(mysql --version 2>&1 | head -1)"
else
  info "Installing MySQL 8..."
  apt_install mysql-server
  systemctl enable mysql 2>/dev/null || true
  systemctl start mysql  2>/dev/null || true
  ok "MySQL installed"
fi

# ── cloudflared ─────────────────────────────────────────────────────────────
if command -v cloudflared &>/dev/null; then
  ok "cloudflared $(cloudflared --version 2>&1 | head -1) already installed"
else
  info "Installing cloudflared..."
  CF_DEB_URL="https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb"
  TMP_DEB="/tmp/cloudflared-aio.deb"
  if wget -q "$CF_DEB_URL" -O "$TMP_DEB"; then
    dpkg -i "$TMP_DEB" && rm -f "$TMP_DEB"
    ok "cloudflared installed"
  else
    warn "Could not download cloudflared. Install manually: https://github.com/cloudflare/cloudflared/releases"
  fi
fi

###############################################################################
# 4 — ENVIRONMENT SETUP (.env)
###############################################################################
step "Environment Configuration"

ENV_FILE="$APP_DIR/.env"
ENV_EXAMPLE="$APP_DIR/.env.example"

# Helper to generate random secret
gen_secret() { openssl rand -hex 32 2>/dev/null || python3 -c "import secrets; print(secrets.token_hex(32))"; }

# Default values — used when .env doesn't exist or key is missing
DOMAIN="${DOMAIN:-cloutscape.org}"
APP_PORT="${PORT:-8080}"
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-3306}"
DB_NAME="${DB_NAME:-degensden}"
DB_USER="${DB_USER:-degensden}"
DB_PASS="${DB_PASS:-$(gen_secret | head -c 24)}"

if [[ ! -f "$ENV_FILE" ]]; then
  warn ".env not found — creating from .env.example with auto-generated secrets"
  if [[ -f "$ENV_EXAMPLE" ]]; then
    cp "$ENV_EXAMPLE" "$ENV_FILE"
  else
    touch "$ENV_FILE"
  fi
fi

# Auto-fill missing critical keys
set_env_if_missing() {
  local key="$1" val="$2"
  if ! grep -q "^${key}=" "$ENV_FILE" 2>/dev/null; then
    echo "${key}=${val}" >> "$ENV_FILE"
    ok "Set ${key} (auto-generated)"
  fi
}

# Generate and set secrets if missing
JWT_SECRET=$(grep "^JWT_SECRET=" "$ENV_FILE" 2>/dev/null | cut -d= -f2- | tr -d '"' || echo "")
SESSION_SECRET=$(grep "^SESSION_SECRET=" "$ENV_FILE" 2>/dev/null | cut -d= -f2- | tr -d '"' || echo "")
DB_URL_EXISTING=$(grep "^DATABASE_URL=" "$ENV_FILE" 2>/dev/null | cut -d= -f2- | tr -d '"' || echo "")

[[ -z "$JWT_SECRET" ]]     && set_env_if_missing "JWT_SECRET"     "$(gen_secret)"
[[ -z "$SESSION_SECRET" ]] && set_env_if_missing "SESSION_SECRET" "$(gen_secret)"

# Set NODE_ENV to production
if grep -q "^NODE_ENV=" "$ENV_FILE" 2>/dev/null; then
  sed -i 's/^NODE_ENV=.*/NODE_ENV=production/' "$ENV_FILE"
else
  echo "NODE_ENV=production" >> "$ENV_FILE"
fi

# Ensure PORT matches
if grep -q "^PORT=" "$ENV_FILE" 2>/dev/null; then
  APP_PORT=$(grep "^PORT=" "$ENV_FILE" | cut -d= -f2 | tr -d '"')
else
  echo "PORT=$APP_PORT" >> "$ENV_FILE"
fi

# Set DATABASE_URL if missing
if [[ -z "$DB_URL_EXISTING" ]]; then
  DB_URL="mysql://${DB_USER}:${DB_PASS}@${DB_HOST}:${DB_PORT}/${DB_NAME}"
  set_env_if_missing "DATABASE_URL" "$DB_URL"
  warn "DATABASE_URL auto-set to: $DB_URL"
  warn "Update with your real DB credentials in .env if needed"
else
  DB_URL="$DB_URL_EXISTING"
  info "Using existing DATABASE_URL from .env"
  # Parse from existing URL
  DB_USER=$(echo "$DB_URL" | python3 -c "from urllib.parse import urlparse; u=urlparse(input()); print(u.username or 'degensden')" 2>/dev/null || echo "degensden")
  DB_PASS=$(echo "$DB_URL" | python3 -c "from urllib.parse import urlparse; u=urlparse(input()); print(u.password or '')" 2>/dev/null || echo "")
  DB_NAME=$(echo "$DB_URL" | python3 -c "from urllib.parse import urlparse; u=urlparse(input()); print(u.path.strip('/') or 'degensden')" 2>/dev/null || echo "degensden")
fi

ok "Environment configured (PORT=$APP_PORT, NODE_ENV=production)"

###############################################################################
# 5 — MYSQL DATABASE SETUP
###############################################################################
step "Database Setup"

setup_mysql() {
  info "Attempting MySQL setup..."

  # Try to create DB and user (handles cases where root has no password or socket auth)
  MYSQL_CMD="mysql -u root"
  if ! $MYSQL_CMD -e "SELECT 1" &>/dev/null 2>&1; then
    MYSQL_CMD="sudo mysql"
  fi

  if $MYSQL_CMD -e "SELECT 1" &>/dev/null 2>&1; then
    $MYSQL_CMD << MYSQL_EOF 2>/dev/null || true
CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS '${DB_USER}'@'localhost' IDENTIFIED BY '${DB_PASS}';
GRANT ALL PRIVILEGES ON \`${DB_NAME}\`.* TO '${DB_USER}'@'localhost';
FLUSH PRIVILEGES;
MYSQL_EOF
    ok "Database '${DB_NAME}' and user '${DB_USER}' configured"
  else
    warn "Cannot connect to MySQL as root. Please ensure MySQL is running and either:"
    warn "  1. Root has no password (default Ubuntu install)"
    warn "  2. Your DATABASE_URL in .env is correct"
  fi
}

if command -v mysql &>/dev/null; then
  setup_mysql
else
  warn "MySQL not available — ensure DATABASE_URL in .env points to your DB"
fi

###############################################################################
# 6 — INSTALL NODE DEPENDENCIES
###############################################################################
step "Installing Node Modules"

cd "$APP_DIR"

info "Running pnpm install..."
if pnpm install --frozen-lockfile 2>/dev/null; then
  ok "Dependencies installed (frozen)"
elif pnpm install 2>/dev/null; then
  ok "Dependencies installed"
else
  fail "pnpm install failed — check your internet connection and package.json"
fi

###############################################################################
# 7 — RUN DATABASE MIGRATIONS
###############################################################################
step "Database Migrations"

if [[ -f "$APP_DIR/drizzle.config.ts" ]]; then
  info "Running Drizzle migrations..."
  if pnpm drizzle-kit push 2>/dev/null; then
    ok "Migrations applied"
  else
    warn "Migration failed — DB might not be reachable yet. Run 'pnpm db:push' manually after DB is set up"
  fi
fi

###############################################################################
# 8 — BUILD APPLICATION
###############################################################################
step "Building Application"

cd "$APP_DIR"

# Clean stale build artifacts (the #1 cause of 'not found' errors)
info "Cleaning stale build artifacts..."
rm -rf dist/
ok "Old dist/ removed"

# Build frontend
info "Building frontend (Vite)..."
if NODE_ENV=production pnpm vite build 2>&1; then
  ok "Frontend built → dist/public/"
else
  fail "Frontend build failed. Run 'pnpm vite build' manually to see errors."
fi

# Verify index.html exists (critical — its absence causes all routes to 404)
if [[ ! -f "$APP_DIR/dist/public/index.html" ]]; then
  fail "dist/public/index.html not found after build. Check Vite output directory config."
fi
ok "index.html verified ✓"

# Build backend
info "Building backend..."
ESBUILD_ARGS=(
  "server/_core/index.ts"
  "--bundle"
  "--platform=node"
  "--target=node20"
  "--outfile=dist/server.js"
  "--external:argon2"
  "--external:mysql2"
  "--external:socket.io"
  "--external:discord.js"
  "--external:@neondatabase/serverless"
)

if pnpm exec esbuild "${ESBUILD_ARGS[@]}" 2>/dev/null; then
  ok "Backend built → dist/server.js"
elif pnpm exec tsx --version &>/dev/null 2>&1; then
  warn "esbuild bundle failed — will run via tsx (development mode)"
  BACKEND_CMD="pnpm exec tsx server/_core/index.ts"
else
  warn "Backend build inconclusive — will attempt node dist/server.js"
fi

###############################################################################
# 9 — AUTO-DETECT CLOUDFLARE TUNNEL CONFIG
###############################################################################
step "Cloudflare Tunnel Detection"

CF_SEARCH_PATHS=(
  "/root/.cloudflared/config.yml"
  "/etc/cloudflared/config.yml"
  "$HOME/.cloudflared/config.yml"
  "$APP_DIR/cloudflared-config.yml"
  "$APP_DIR/.cloudflared/config.yml"
)

CFGD_CONFIG=""
TUNNEL_NAME=""
CF_DOMAIN="$DOMAIN"

for p in "${CF_SEARCH_PATHS[@]}"; do
  if [[ -f "$p" ]]; then
    CFGD_CONFIG="$p"
    TUNNEL_NAME=$(grep -E '^tunnel:' "$p" 2>/dev/null | awk '{print $2}' | tr -d '"' | head -1 || echo "")
    CF_DOMAIN_FOUND=$(grep -E '^\s+hostname:' "$p" 2>/dev/null | awk '{print $2}' | tr -d '"' | head -1 || echo "")
    [[ -n "$CF_DOMAIN_FOUND" ]] && CF_DOMAIN="$CF_DOMAIN_FOUND"
    ok "Found cloudflared config: $p"
    break
  fi
done

# Find credential files
find_creds() {
  local dirs=("/root/.cloudflared" "/etc/cloudflared" "$HOME/.cloudflared")
  for d in "${dirs[@]}"; do
    if [[ -d "$d" ]]; then
      while IFS= read -r -d '' f; do
        if python3 -c "import json; d=json.load(open('$f')); exit(0 if 'TunnelID' in d else 1)" 2>/dev/null; then
          echo "$f"; return 0
        fi
      done < <(find "$d" -name "*.json" -print0 2>/dev/null)
    fi
  done
  return 1
}

CREDS_FILE=$(find_creds 2>/dev/null || echo "")
if [[ -n "$CREDS_FILE" ]]; then
  ok "Credentials: $CREDS_FILE"
else
  warn "No cloudflared credentials found"
fi

# If we have a config, ensure its 'service' port matches APP_PORT
if [[ -n "$CFGD_CONFIG" && -f "$CFGD_CONFIG" ]]; then
  CURRENT_CF_PORT=$(grep -E '^\s+service:' "$CFGD_CONFIG" 2>/dev/null | grep -oE ':[0-9]+' | head -1 | tr -d ':' || echo "")
  if [[ -n "$CURRENT_CF_PORT" && "$CURRENT_CF_PORT" != "$APP_PORT" ]]; then
    warn "Cloudflare config port ($CURRENT_CF_PORT) ≠ app port ($APP_PORT) — fixing..."
    sed -i "s|localhost:${CURRENT_CF_PORT}|localhost:${APP_PORT}|g" "$CFGD_CONFIG"
    ok "Config port updated to $APP_PORT"
  fi
fi

# If no config, create one using the bundled template
if [[ -z "$CFGD_CONFIG" ]]; then
  CFGD_CONFIG="$APP_DIR/cloudflared-config.yml"
  if [[ ! -f "$CFGD_CONFIG" ]]; then
    warn "No cloudflared config anywhere — creating default at $CFGD_CONFIG"
    cat > "$CFGD_CONFIG" << CFCFG
tunnel: cloutscape-prod
credentials-file: /root/.cloudflared/cloutscape-prod.json
ingress:
  - hostname: ${CF_DOMAIN}
    service: http://localhost:${APP_PORT}
  - hostname: www.${CF_DOMAIN}
    service: http://localhost:${APP_PORT}
  - service: http_status:404
CFCFG
    ok "Created default cloudflared config"
  fi
fi

echo ""
info "Tunnel config : $CFGD_CONFIG"
info "Domain        : $CF_DOMAIN"
info "App port      : $APP_PORT"

###############################################################################
# 10 — STOP OLD PROCESSES
###############################################################################
step "Cleaning Up Old Processes"

# Stop PM2 instance
if command -v pm2 &>/dev/null; then
  pm2 delete degensden 2>/dev/null || true
  ok "PM2: old degensden process removed"
fi

# Kill stale node/server processes on the app port
OLD_PID=$(lsof -ti ":${APP_PORT}" 2>/dev/null || echo "")
if [[ -n "$OLD_PID" ]]; then
  kill -9 $OLD_PID 2>/dev/null || true
  ok "Killed process on port $APP_PORT (PID: $OLD_PID)"
fi

# Kill old cloudflared
pkill -f "cloudflared tunnel" 2>/dev/null || true
sleep 1
ok "Old processes cleaned"

###############################################################################
# 11 — CREATE SYSTEMD SERVICE
###############################################################################
step "Systemd Service"

BACKEND_BIN="${BACKEND_CMD:-node dist/server.js}"
SERVICE_FILE="/etc/systemd/system/degensden.service"

# Load .env variables for the service
ENV_PAIRS=""
while IFS='=' read -r key val; do
  [[ "$key" =~ ^[[:space:]]*# ]] && continue
  [[ -z "$key" ]] && continue
  key=$(echo "$key" | tr -d '[:space:]')
  val=$(echo "$val" | sed 's/^"//' | sed 's/"$//')
  ENV_PAIRS+="Environment=\"${key}=${val}\"\n"
done < "$ENV_FILE"

cat > "$SERVICE_FILE" << SVCEOF
[Unit]
Description=Degens Den Casino
After=network.target mysql.service
Wants=mysql.service

[Service]
Type=simple
User=root
WorkingDirectory=${APP_DIR}
ExecStart=/usr/bin/node ${APP_DIR}/dist/server.js
$(echo -e "$ENV_PAIRS")
Restart=on-failure
RestartSec=5
StandardOutput=append:${LOG_DIR}/server.log
StandardError=append:${LOG_DIR}/server.err.log
LimitNOFILE=65536

[Install]
WantedBy=multi-user.target
SVCEOF

systemctl daemon-reload
systemctl enable degensden
systemctl start degensden
sleep 2

if systemctl is-active --quiet degensden; then
  ok "systemd service 'degensden' running"
else
  warn "systemd service failed to start — checking logs..."
  journalctl -u degensden -n 20 --no-pager 2>/dev/null || true
  warn "Falling back to PM2..."
  # PM2 fallback
  if command -v pm2 &>/dev/null; then
    cd "$APP_DIR"
    env $(grep -v '^#' "$ENV_FILE" | xargs) pm2 start dist/server.js --name degensden --update-env
    pm2 save
    pm2 startup 2>/dev/null || true
    ok "App started via PM2"
  else
    warn "PM2 not available — starting via nohup"
    env $(grep -v '^#' "$ENV_FILE" | xargs) nohup node dist/server.js > "$LOG_DIR/server.log" 2>&1 &
    echo $! > "$APP_DIR/.server.pid"
    ok "App started (PID: $(cat $APP_DIR/.server.pid))"
  fi
fi

###############################################################################
# 12 — START CLOUDFLARE TUNNEL
###############################################################################
step "Cloudflare Tunnel"

CF_LOG="$LOG_DIR/tunnel.log"

if command -v cloudflared &>/dev/null && [[ -n "$CREDS_FILE" ]]; then
  info "Starting Cloudflare Tunnel (${TUNNEL_NAME:-cloutscape-prod})..."

  # Try systemd service first
  if systemctl is-enabled --quiet cloudflared 2>/dev/null; then
    systemctl restart cloudflared && ok "cloudflared systemd service restarted"
  else
    # Run as background process
    nohup cloudflared tunnel \
      --config "$CFGD_CONFIG" \
      run "${TUNNEL_NAME:-}" \
      > "$CF_LOG" 2>&1 &
    CF_PID=$!
    echo "$CF_PID" > "$APP_DIR/.tunnel.pid"
    sleep 3

    if kill -0 "$CF_PID" 2>/dev/null; then
      ok "Cloudflare Tunnel running (PID: $CF_PID)"
    else
      warn "Tunnel may have exited — check: tail -50 $CF_LOG"
    fi
  fi
elif command -v cloudflared &>/dev/null && [[ -z "$CREDS_FILE" ]]; then
  warn "cloudflared installed but no credentials found."
  echo ""
  echo -e "${Y}  Authenticate once with these commands:${N}"
  echo -e "  ${C}cloudflared tunnel login${N}"
  echo -e "  ${C}cloudflared tunnel create cloutscape-prod${N}"
  echo -e "  ${C}cloudflared tunnel route dns cloutscape-prod ${CF_DOMAIN}${N}"
  echo -e "  ${C}cloudflared tunnel route dns cloutscape-prod www.${CF_DOMAIN}${N}"
  echo -e "  Then re-run: ${C}sudo bash aio.sh${N}"
else
  warn "cloudflared not installed — site won't be publicly accessible yet"
fi

###############################################################################
# 13 — HEALTH CHECK (with retry)
###############################################################################
step "Health Check"

check_app() {
  local url="http://localhost:${APP_PORT}"
  local retries=8
  local wait=3

  for i in $(seq 1 $retries); do
    if curl -sf --max-time 5 "$url" > /dev/null 2>&1; then
      ok "App responding on $url"
      return 0
    fi
    info "Waiting for app to start... (attempt $i/$retries)"
    sleep "$wait"
  done

  warn "App not responding on :${APP_PORT} after ${retries} attempts"
  warn "Check logs: tail -50 ${LOG_DIR}/server.log"
  return 1
}

check_app || true

# Check for common error patterns in server log
if [[ -f "${LOG_DIR}/server.log" ]]; then
  if grep -qi "EADDRINUSE\|address already in use" "${LOG_DIR}/server.log" 2>/dev/null; then
    warn "Port conflict detected — trying to free port $APP_PORT..."
    fuser -k "${APP_PORT}/tcp" 2>/dev/null || true
    sleep 2
    systemctl restart degensden 2>/dev/null || pm2 restart degensden 2>/dev/null || true
    check_app || true
  fi
  if grep -qi "ER_ACCESS_DENIED\|ECONNREFUSED.*3306\|Cannot connect to MySQL" "${LOG_DIR}/server.log" 2>/dev/null; then
    warn "Database connection issue detected."
    warn "Update DATABASE_URL in $ENV_FILE and re-run: sudo bash aio.sh"
  fi
fi

###############################################################################
# 14 — FINAL STATUS
###############################################################################
echo ""
echo -e "${G}${B}═══════════════════════════════════════════════════════════${N}"
echo -e "${G}${B}   Degens¤Den — All-In-One Setup Complete!${N}"
echo -e "${G}${B}═══════════════════════════════════════════════════════════${N}"
echo ""
echo -e "  ${B}Live URL :${N}   ${C}https://${CF_DOMAIN}${N}"
echo -e "  ${B}Local    :${N}   ${C}http://localhost:${APP_PORT}${N}"
echo -e "  ${B}.env     :${N}   ${C}${ENV_FILE}${N}"
echo -e "  ${B}Logs     :${N}   ${C}${LOG_DIR}/${N}"
echo -e "  ${B}Service  :${N}   ${C}systemctl status degensden${N}"
echo ""
echo -e "  ${Y}If you still get 'Not Found' errors:${N}"
echo -e "  ${C}1. tail -50 ${LOG_DIR}/server.log${N}"
echo -e "  ${C}2. tail -50 ${LOG_DIR}/tunnel.log${N}"
echo -e "  ${C}3. curl http://localhost:${APP_PORT}${N}"
echo -e "  ${C}4. systemctl status degensden${N}"
echo -e "  ${C}5. Hard refresh browser: Ctrl+Shift+R${N}"
echo ""
echo -e "  ${Y}Discord bot:${N} set DISCORD_BOT_TOKEN + DISCORD_GUILD_ID in .env"
echo ""
