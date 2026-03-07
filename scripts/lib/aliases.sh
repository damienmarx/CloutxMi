#!/bin/bash
# Degens¤Den Alias System
# Developed by your Personal Degens¤Den Agent

# This file should be sourced in .bashrc or .zshrc
CLOUT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
SCRIPTS_DIR="$CLOUT_ROOT/scripts"

# Core Aliases
alias cs-root="cd $CLOUT_ROOT"
alias cs-logs="tail -f /home/$(whoami)/degensden_setup.log"
alias cs-status="$SCRIPTS_DIR/status_dashboard.sh"
alias cs-deploy="$SCRIPTS_DIR/setup_master_v2.sh"
alias cs-update="$SCRIPTS_DIR/auto_git.sh update"
alias cs-start="pm2 start $CLOUT_ROOT/ecosystem.config.js"
alias cs-stop="pm2 stop degensden-backend"
alias cs-restart="pm2 restart degensden-backend"

# Cloudflare Specific
cs-tunnel-setup() {
    source "$SCRIPTS_DIR/lib/cloudflare.sh"
    setup_tunnel "degensden-tunnel"
    configure_tunnel "degensden-tunnel" "$1"
    run_tunnel "degensden-tunnel"
}

# Guided UI
alias cs-guide="$SCRIPTS_DIR/degensden_ui.sh"

# Help command
cs-help() {
    echo -e "\033[0;36mDegens¤Den Personal Agent - Command Reference\033[0m"
    echo "------------------------------------------------"
    echo "cs-deploy         : Run the master setup and deployment"
    echo "cs-status         : View environment and deployment status"
    echo "cs-start/stop     : Manage the Degens¤Den backend process"
    echo "cs-update         : Pull latest changes and rebuild"
    echo "cs-tunnel-setup   : Configure Cloudflare Tunnel (usage: cs-tunnel-setup domain.com)"
    echo "cs-guide          : Open the Degens¤Den for Dummies guided UI"
    echo "cs-logs           : View live deployment/setup logs"
    echo "------------------------------------------------"
}
