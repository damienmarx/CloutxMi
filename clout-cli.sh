#!/bin/bash

################################################################################
# CloutScape Developer CLI (clout)
# Purpose: Simplify common developer tasks for new developers.
# Usage: source clout-cli.sh
################################################################################

# Color codes for pretty output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Print the CloutScape Banner
clout_banner() {
    echo -e "${CYAN}"
    echo "  _____ _                 _   _____                         "
    echo " / ____| |               | | / ____|                        "
    echo "| |    | | ___  _   _  __| || (___   ___ __ _ _ __   ___    "
    echo "| |    | |/ _ \| | | |/ _\` | \___ \ / __/ _\` | '_ \ / _ \\   "
    echo "| |____| | (_) | |_| | (_| | ____) | (_| (_| | |_) |  __/   "
    echo " \_____|_|\___/ \__,_|\__,_||_____/ \___\__,_| .__/ \___|   "
    echo "                                             | |            "
    echo "  Developer CLI v1.0.0                       |_|            "
    echo -e "${NC}"
}

# The main helper function
clout_help() {
    clout_banner
    echo -e "${YELLOW}Available Commands:${NC}"
    echo -e "  ${GREEN}clout setup${NC}      - Initial project setup (install deps, config DB)"
    echo -e "  ${GREEN}clout start${NC}      - Start the server in development mode"
    echo -e "  ${GREEN}clout build${NC}      - Build the project for production"
    echo -e "  ${GREEN}clout prod${NC}       - Start the server in production mode"
    echo -e "  ${GREEN}clout db:push${NC}    - Push database schema changes"
    echo -e "  ${GREEN}clout db:studio${NC}  - Open database GUI (Drizzle Studio)"
    echo -e "  ${GREEN}clout logs${NC}       - View application logs"
    echo -e "  ${GREEN}clout tunnel${NC}     - Start Cloudflare Tunnel"
    echo -e "  ${GREEN}clout deploy${NC}     - Run the Master Setup Script for deployment"
    echo -e "  ${GREEN}clout update${NC}     - Pull latest changes from GitHub"
    echo -e "  ${GREEN}clout help${NC}       - Show this help menu"
    echo ""
    echo -e "${BLUE}Tip:${NC} Use ${PURPLE}clout start${NC} to begin coding!"
}

# Define the aliases
clout() {
    case "$1" in
        setup)
            echo -e "${BLUE}[clout]${NC} Starting setup..."
            npm install --legacy-peer-deps && npm run db:push
            echo -e "${GREEN}[clout]${NC} Setup complete!"
            ;;
        start)
            echo -e "${BLUE}[clout]${NC} Starting development server..."
            npm run dev
            ;;
        build)
            echo -e "${BLUE}[clout]${NC} Building for production..."
            npm run build
            ;;
        prod)
            echo -e "${BLUE}[clout]${NC} Starting production server..."
            npm start
            ;;
        "db:push")
            echo -e "${BLUE}[clout]${NC} Pushing database schema..."
            npx drizzle-kit push
            ;;
        "db:studio")
            echo -e "${BLUE}[clout]${NC} Opening Drizzle Studio..."
            npx drizzle-kit studio
            ;;
        logs)
            echo -e "${BLUE}[clout]${NC} Showing logs (press Ctrl+C to exit)..."
            if command -v pm2 &> /dev/null; then
                pm2 logs cloutscape
            else
                tail -f logs/app.log 2>/dev/null || echo -e "${RED}No log file found.${NC}"
            fi
            ;;
        tunnel)
            echo -e "${BLUE}[clout]${NC} Starting Cloudflare Tunnel..."
            cloudflared tunnel run cloutscape-tunnel
            ;;
        deploy)
            echo -e "${BLUE}[clout]${NC} Running Master Setup Script..."
            chmod +x MASTER_SETUP.sh
            ./MASTER_SETUP.sh
            ;;
        update)
            echo -e "${BLUE}[clout]${NC} Pulling latest changes..."
            git pull origin main
            npm install --legacy-peer-deps
            echo -e "${GREEN}[clout]${NC} Project updated!"
            ;;
        *)
            clout_help
            ;;
    esac
}

# Auto-show help when sourced
clout_help

echo -e "${YELLOW}Optional:${NC} To make 'clout' permanent, add 'source $(pwd)/clout-cli.sh' to your ~/.bashrc"
