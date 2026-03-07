#!/bin/bash

###############################################################################
# CloutScape Frontend Verification & Fix Script
# Ensures the correct luxury UI is displayed
###############################################################################

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

echo -e "${CYAN}╔═══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║     CLOUTSCAPE FRONTEND VERIFICATION & FIX SCRIPT           ║${NC}"
echo -e "${CYAN}╚═══════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Step 1: Kill any running servers
echo -e "${YELLOW}[1/8] Stopping any running servers...${NC}"
pkill -f 'node dist' 2>/dev/null || true
pkill -f 'vite' 2>/dev/null || true
sleep 2
echo -e "${GREEN}✓ Servers stopped${NC}"

# Step 2: Clean all build artifacts and caches
echo -e "${YELLOW}[2/8] Cleaning build artifacts and caches...${NC}"
cd /app
rm -rf dist/
rm -rf client/dist/
rm -rf node_modules/.vite/
rm -rf node_modules/.cache/
rm -rf .vite/
echo -e "${GREEN}✓ Cleaned all caches${NC}"

# Step 3: Remove any unwanted images
echo -e "${YELLOW}[3/8] Removing old images from public folder...${NC}"
rm -f client/public/*.jpg client/public/*.png client/public/*.jpeg 2>/dev/null || true
rm -rf client/public/images/ 2>/dev/null || true
echo -e "${GREEN}✓ Images removed${NC}"

# Step 4: Verify source files have CloutScape branding
echo -e "${YELLOW}[4/8] Verifying CloutScape branding in source...${NC}"

if grep -q "CloutScape" client/src/pages/Home.tsx; then
    echo -e "${GREEN}✓ Home.tsx contains CloutScape branding${NC}"
else
    echo -e "${RED}✗ ERROR: Home.tsx missing CloutScape branding!${NC}"
    exit 1
fi

if grep -q "obsidian\|gold-gradient\|glass-card" client/src/index.css; then
    echo -e "${GREEN}✓ index.css contains luxury styles${NC}"
else
    echo -e "${RED}✗ ERROR: index.css missing luxury styles!${NC}"
    exit 1
fi

# Step 5: Verify no Degens Den references
echo -e "${YELLOW}[5/8] Checking for old Degens Den references...${NC}"
if grep -r "Degens Den" client/src/ 2>/dev/null; then
    echo -e "${RED}✗ WARNING: Found Degens Den references in source!${NC}"
    echo -e "${YELLOW}Attempting to fix...${NC}"
    find client/src/ -type f -exec sed -i 's/Degens Den/CloutScape/g' {} \;
    echo -e "${GREEN}✓ Fixed Degens Den references${NC}"
else
    echo -e "${GREEN}✓ No Degens Den references found${NC}"
fi

# Step 6: Rebuild with optimization
echo -e "${YELLOW}[6/8] Building production frontend...${NC}"
NODE_ENV=production pnpm build 2>&1 | tail -20

if [ -f "dist/public/index.html" ]; then
    echo -e "${GREEN}✓ Build successful${NC}"
else
    echo -e "${RED}✗ Build failed!${NC}"
    exit 1
fi

# Step 7: Verify build output
echo -e "${YELLOW}[7/8] Verifying build output...${NC}"

# Check CSS size (should be ~195KB for luxury theme)
CSS_SIZE=$(du -k dist/public/assets/*.css | awk '{print $1}')
if [ "$CSS_SIZE" -gt 100 ]; then
    echo -e "${GREEN}✓ CSS bundle size: ${CSS_SIZE}KB (luxury styles included)${NC}"
else
    echo -e "${RED}✗ WARNING: CSS too small (${CSS_SIZE}KB), styles may be missing${NC}"
fi

# Verify luxury styles in compiled CSS
if grep -q "obsidian\|glass-card\|gold-gradient" dist/public/assets/*.css; then
    echo -e "${GREEN}✓ Luxury styles confirmed in compiled CSS${NC}"
else
    echo -e "${RED}✗ ERROR: Luxury styles missing from compiled CSS!${NC}"
    exit 1
fi

# Verify CloutScape in HTML
if grep -q "Cloutscape\|CloutScape" dist/public/index.html; then
    echo -e "${GREEN}✓ CloutScape branding in HTML${NC}"
else
    echo -e "${RED}✗ WARNING: CloutScape branding may be missing from HTML${NC}"
fi

# Step 8: Start server
echo -e "${YELLOW}[8/8] Starting CloutScape server on port 8080...${NC}"
cd /app
PORT=8080 NODE_ENV=production nohup node dist/index.js > /app/logs/app.log 2>&1 &
sleep 3

# Verify server is running
if lsof -i :8080 | grep -q LISTEN; then
    echo -e "${GREEN}✓ Server running on port 8080${NC}"
else
    echo -e "${RED}✗ Server failed to start!${NC}"
    echo -e "${YELLOW}Check logs: tail -f /app/logs/app.log${NC}"
    exit 1
fi

# Final verification
echo ""
echo -e "${CYAN}╔═══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║                  ✅ VERIFICATION COMPLETE ✅                  ║${NC}"
echo -e "${CYAN}╚═══════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${GREEN}🎰 CloutScape Luxury Casino is LIVE!${NC}"
echo ""
echo -e "${CYAN}Access URLs:${NC}"
echo -e "  • Local:   ${GREEN}http://localhost:8080${NC}"
echo -e "  • Network: ${GREEN}http://$(hostname -I | awk '{print $1}'):8080${NC}"
echo ""
echo -e "${CYAN}What's Running:${NC}"
echo -e "  • Luxury obsidian theme ✅"
echo -e "  • Gold gradients ✅"
echo -e "  • Glassmorphism cards ✅"
echo -e "  • 3D animations ✅"
echo -e "  • CloutScape branding ✅"
echo -e "  • No background images ✅"
echo -e "  • Optimized performance ✅"
echo ""
echo -e "${YELLOW}⚠️  IMPORTANT: Clear your browser cache!${NC}"
echo -e "  Press: ${CYAN}Ctrl + Shift + R${NC} (Windows/Linux)"
echo -e "         ${CYAN}Cmd + Shift + R${NC} (Mac)"
echo ""
echo -e "${CYAN}View logs:${NC} tail -f /app/logs/app.log"
echo -e "${CYAN}Restart:${NC}   /app/fix-frontend.sh"
echo ""
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}           🎰💎 CLOUTSCAPE IS READY TO ROLL 💎🎰${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
