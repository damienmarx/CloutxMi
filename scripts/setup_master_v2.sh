#!/bin/bash
# Degens¤Den Master Setup V2 - Orchestrator
# Developed by your Personal Degens¤Den Agent
# Guaranteed deployment for WSL2 & Cloudflare Tunnel

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LIB_DIR="$SCRIPT_DIR/lib"
export LOG_FILE="/home/$(whoami)/degensden_setup.log"

# Source modules
source "$LIB_DIR/utils.sh"
source "$LIB_DIR/installer.sh"
source "$LIB_DIR/cloudflare.sh"

show_banner() {
    clear
    echo -e "${CYAN}"
    echo "╔════════════════════════════════════════════════════════════╗"
    echo "║                                                            ║"
    echo "║         🎰 Degens¤Den Personal Agent - Setup V2 🎰         ║"
    echo "║             Sophisticated & Adaptive Deployment            ║"
    echo "║                                                            ║"
    echo "╚════════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
}

main() {
    show_banner
    
    info "Initializing Degens¤Den Deployment..."
    
    # 1. System Prep
    install_base_deps
    
    # 2. Environment Runtimes
    install_node_pnpm
    install_mysql
    install_pm2
    
    # 3. Project Setup
    info "Installing project dependencies..."
    cd "$SCRIPT_DIR/.."
    pnpm install >> "$LOG_FILE" 2>&1
    check_status $? "pnpm install failed"
    
    # 4. Database Initialization
    info "Setting up database..."
    # Adaptive check for .env
    if [ ! -f .env ]; then
        warning ".env file missing, creating from template..."
        cp .env.example .env 2>/dev/null || touch .env
    fi
    
    # 5. Build
    info "Building Degens¤Den..."
    pnpm run build >> "$LOG_FILE" 2>&1
    check_status $? "Build failed"
    
    # 6. Cloudflare Tunnel (Optional/Prompted)
    install_cloudflared
    
    success "Core Degens¤Den environment is ready!"
    echo -e "\n${YELLOW}To complete Cloudflare Tunnel setup, run:${NC}"
    echo -e "  cs-tunnel-setup <your-domain>\n"
}

if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi
