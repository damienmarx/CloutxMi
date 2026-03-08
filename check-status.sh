#!/usr/bin/env bash
###############################################################################
# Degens¤Den System Status Checker
###############################################################################

G='\033[0;32m' Y='\033[1;33m' R='\033[0;31m' C='\033[0;36m' B='\033[1m' N='\033[0m'

echo -e "${B}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${N}"
echo -e "${B}  🎰 DEGENS¤DEN STATUS CHECK 🎰${N}"
echo -e "${B}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${N}"
echo ""

# MySQL
echo -e "${C}[MySQL]${N}"
if mysql -u root -e "SELECT 1" &>/dev/null; then
  echo -e "  ${G}✓ Running${N}"
  mysql -u root -e "SELECT COUNT(*) as 'Tables' FROM information_schema.tables WHERE table_schema='degensden';" 2>/dev/null | tail -1 | xargs echo "  Tables:"
else
  echo -e "  ${R}✗ Not responding${N}"
fi
echo ""

# Application
echo -e "${C}[Application]${N}"
if sudo supervisorctl status degensden | grep -q RUNNING; then
  PID=$(sudo supervisorctl status degensden | awk '{print $4}' | tr -d ',')
  echo -e "  ${G}✓ Running (PID: $PID)${N}"
  PORT=$(netstat -tlnp 2>/dev/null | grep "$PID" | grep -oE ':[0-9]+' | head -1 | tr -d ':')
  echo "  Port: $PORT"
else
  echo -e "  ${R}✗ Not running${N}"
fi
echo ""

# Discord Bot
echo -e "${C}[Discord Bot]${N}"
if grep -q "Discord.*Bot ready" /app/logs/degensden.log 2>/dev/null; then
  BOT_USER=$(grep "Logged in as" /app/logs/degensden.log 2>/dev/null | tail -1 | grep -oP 'as \K.*')
  echo -e "  ${G}✓ Connected${N}"
  echo "  User: $BOT_USER"
else
  echo -e "  ${Y}? Check logs${N}"
fi
echo ""

# Cloudflared
echo -e "${C}[Cloudflared]${N}"
if pgrep -f "cloudflared tunnel" &>/dev/null; then
  echo -e "  ${G}✓ Running${N}"
  pgrep -f "cloudflared tunnel" | xargs echo "  PID:"
else
  echo -e "  ${Y}! Not running (Setup required)${N}"
fi
echo ""

# Recent Errors
echo -e "${C}[Recent Logs]${N}"
if [ -f /app/logs/degensden.log ]; then
  ERRORS=$(grep -i "error\|failed\|exception" /app/logs/degensden.log | tail -3)
  if [ -n "$ERRORS" ]; then
    echo -e "  ${Y}Recent errors found:${N}"
    echo "$ERRORS" | sed 's/^/    /'
  else
    echo -e "  ${G}✓ No recent errors${N}"
  fi
else
  echo "  No log file"
fi
echo ""

# Quick Actions
echo -e "${B}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${N}"
echo -e "${C}Quick Actions:${N}"
echo "  sudo supervisorctl restart degensden    # Restart app"
echo "  tail -f /app/logs/degensden.log         # View logs"
echo "  cat /app/DEPLOYMENT_STATUS.md           # Full status"
echo ""
