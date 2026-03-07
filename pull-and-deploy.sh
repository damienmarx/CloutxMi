#!/bin/bash

###############################################################################
# CloutScape Quick Update Script
# Pull latest from GitHub and deploy luxury frontend
###############################################################################

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

echo -e "${CYAN}╔═══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║         CLOUTSCAPE - PULL & DEPLOY FROM GITHUB              ║${NC}"
echo -e "${CYAN}╚═══════════════════════════════════════════════════════════════╝${NC}"
echo ""

cd /app

# Stop server
echo -e "${YELLOW}[1/4] Stopping server...${NC}"
pkill -f 'node dist' 2>/dev/null || true
sleep 2
echo -e "${GREEN}✓ Server stopped${NC}"

# Pull latest
echo -e "${YELLOW}[2/4] Pulling latest from GitHub...${NC}"
git fetch origin
git reset --hard origin/main
git pull origin main
echo -e "${GREEN}✓ Latest code pulled${NC}"

# Install any new dependencies
echo -e "${YELLOW}[3/4] Installing dependencies...${NC}"
npm install -g pnpm@10.4.1 2>/dev/null || true
pnpm install --no-frozen-lockfile
echo -e "${GREEN}✓ Dependencies updated${NC}"

# Run fix script
echo -e "${YELLOW}[4/4] Running frontend fix and rebuild...${NC}"
chmod +x /app/fix-frontend.sh
/app/fix-frontend.sh

echo ""
echo -e "${GREEN}╔═══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║              ✅ UPDATE COMPLETE! ✅                          ║${NC}"
echo -e "${GREEN}╚═══════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${CYAN}CloutScape is now running the latest version!${NC}"
echo -e "  • Luxury obsidian theme"
echo -e "  • All fixes applied"
echo -e "  • Server on port 8080"
echo ""
echo -e "${YELLOW}⚠️  Clear your browser cache: Ctrl+Shift+R${NC}"
echo ""
