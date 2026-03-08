#!/usr/bin/env bash
###############################################################################
# Degens¤Den Production Startup Script
# Handles: Process cleanup, MySQL check, App start, Cloudflared tunnel
###############################################################################
set -euo pipefail

# Colors
G='\033[0;32m' Y='\033[1;33m' R='\033[0;31m' C='\033[0;36m' N='\033[0m'
ok()   { echo -e "${G}[✓]${N} $*"; }
warn() { echo -e "${Y}[!]${N} $*"; }
fail() { echo -e "${R}[✗]${N} $*"; exit 1; }
info() { echo -e "${C}[→]${N} $*"; }

APP_DIR="/app"
LOG_DIR="$APP_DIR/logs"
mkdir -p "$LOG_DIR"

cd "$APP_DIR"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  🎰 DEGENS¤DEN PRODUCTION STARTUP 🎰"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# 1. Kill old processes
info "Cleaning old processes..."
pkill -f "node.*dist/index.js" 2>/dev/null || true
pkill -f "tsx.*server" 2>/dev/null || true
ok "Old node processes cleaned"

# 2. Check MySQL
info "Checking MySQL..."
if ! mysql -u root -e "SELECT 1" > /dev/null 2>&1; then
  warn "MySQL not responding, attempting restart..."
  pkill -9 mysqld mariadbd 2>/dev/null || true
  sleep 2
  mysqld --user=mysql --bind-address=0.0.0.0 --port=3306 > "$LOG_DIR/mysql.log" 2>&1 &
  sleep 8
  if mysql -u root -e "SELECT 1" > /dev/null 2>&1; then
    ok "MySQL restarted"
  else
    fail "MySQL failed to start. Check $LOG_DIR/mysql.log"
  fi
else
  ok "MySQL is running"
fi

# 3. Source environment
if [ -f "$APP_DIR/.env" ]; then
  export $(grep -v '^#' "$APP_DIR/.env" | xargs)
  ok "Environment loaded"
else
  warn "No .env file found"
fi

# 4. Start application
info "Starting Degens¤Den server..."
cd "$APP_DIR"
PORT=${PORT:-8080}

nohup node dist/index.js > "$LOG_DIR/app.log" 2>&1 &
APP_PID=$!
echo "$APP_PID" > "$APP_DIR/.app.pid"
sleep 4

# 5. Health check
info "Checking application health..."
for i in {1..10}; do
  if curl -sf "http://localhost:$PORT" > /dev/null 2>&1; then
    ok "Application is responding on port $PORT (PID: $APP_PID)"
    break
  fi
  if [ $i -eq 10 ]; then
    warn "Application not responding after 10 attempts"
    warn "Check logs: tail -50 $LOG_DIR/app.log"
  fi
  sleep 2
done

# 6. Check for Discord bot
if [ -n "${DISCORD_BOT_TOKEN:-}" ] && [ -n "${DISCORD_GUILD_ID:-}" ]; then
  ok "Discord bot configured (Token: ${DISCORD_BOT_TOKEN:0:20}...)"
else
  warn "Discord bot not configured"
fi

# 7. Cloudflared tunnel check
info "Checking Cloudflared tunnel..."
if command -v cloudflared &>/dev/null; then
  ok "Cloudflared installed"
  
  # Check if tunnel exists
  if cloudflared tunnel list 2>&1 | grep -q "cloutscape-prod"; then
    ok "Tunnel 'cloutscape-prod' exists"
    
    # Start tunnel
    info "Starting Cloudflared tunnel..."
    pkill -f "cloudflared tunnel" 2>/dev/null || true
    sleep 2
    
    # Try to find config
    CF_CONFIG=""
    for p in "/root/.cloudflared/config.yml" "$APP_DIR/cloudflared-config.yml"; do
      if [ -f "$p" ]; then
        CF_CONFIG="$p"
        break
      fi
    done
    
    if [ -n "$CF_CONFIG" ]; then
      nohup cloudflared tunnel --config "$CF_CONFIG" run cloutscape-prod > "$LOG_DIR/tunnel.log" 2>&1 &
      TUNNEL_PID=$!
      echo "$TUNNEL_PID" > "$APP_DIR/.tunnel.pid"
      sleep 3
      
      if kill -0 "$TUNNEL_PID" 2>/dev/null; then
        ok "Cloudflared tunnel started (PID: $TUNNEL_PID)"
      else
        warn "Tunnel may have exited. Check: tail -30 $LOG_DIR/tunnel.log"
      fi
    else
      warn "No cloudflared config found. Create one at: $APP_DIR/cloudflared-config.yml"
    fi
  else
    warn "Tunnel 'cloutscape-prod' not found. Run: cloudflared tunnel create cloutscape-prod"
  fi
else
  warn "Cloudflared not installed. Install from: https://github.com/cloudflare/cloudflared/releases"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  ✓ DEGENS¤DEN IS LIVE!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "  Local:  http://localhost:$PORT"
echo "  Logs:   $LOG_DIR/"
echo ""
echo "  To view logs:"
echo "    tail -f $LOG_DIR/app.log"
echo "    tail -f $LOG_DIR/tunnel.log"
echo ""
echo "  To stop:"
echo "    kill \$(cat $APP_DIR/.app.pid)"
echo "    kill \$(cat $APP_DIR/.tunnel.pid)"
echo ""
