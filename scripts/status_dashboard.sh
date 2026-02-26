#!/bin/bash
# CloutScape Status Dashboard
# Developed by your Personal CloutScape Agent

source "$(dirname "${BASH_SOURCE[0]}")/lib/utils.sh"

check_service() {
    if pgrep -x "$1" >/dev/null || pm2 describe "$1" >/dev/null 2>&1; then
        echo -e "${GREEN}RUNNING${NC}"
    else
        echo -e "${RED}STOPPED${NC}"
    fi
}

echo -e "${CYAN}--- CloutScape Environment Status ---${NC}"
printf "%-20s : %s\n" "Node.js" "$(node -v 2>/dev/null || echo -e "${RED}NOT FOUND${NC}")"
printf "%-20s : %s\n" "pnpm" "$(pnpm -v 2>/dev/null || echo -e "${RED}NOT FOUND${NC}")"
printf "%-20s : %s\n" "MySQL" "$(check_service mysql)"
printf "%-20s : %s\n" "PM2 Backend" "$(check_service cloutscape-backend)"
printf "%-20s : %s\n" "Cloudflare Tunnel" "$(check_service cloudflared)"

echo -e "\n${CYAN}--- Deployment Info ---${NC}"
printf "%-20s : %s\n" "Project Root" "$(cd "$(dirname "$0")/.." && pwd)"
printf "%-20s : %s\n" "Last Git Commit" "$(git log -1 --format=%h 2>/dev/null || echo "N/A")"
printf "%-20s : %s\n" "Active Tunnel" "$(cloudflared tunnel list 2>/dev/null | grep active | awk '{print $2}' || echo "None")"

echo -e "\n${YELLOW}Use 'cs-help' for a list of available commands.${NC}"
