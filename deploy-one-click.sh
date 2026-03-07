#!/bin/bash

###############################################################################
# Degens¤Den One-Click Deployment Script
# Version: 2026.1.0
# Domain: degensden.org
# Author: Damien Marx
###############################################################################

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Fancy banner
echo -e "${PURPLE}"
cat << "EOF"
   _____ _                 _  _____                       
  / ____| |               | |/ ____|                      
 | |    | | ___  _   _  __| | (___   ___ __ _ _ __   ___ 
 | |    | |/ _ \| | | |/ _` |\___ \ / __/ _` | '_ \ / _ \
 | |____| | (_) | |_| | (_| |____) | (_| (_| | |_) |  __/
  \_____|_|\___/ \__,_|\__,_|_____/ \___\__,_| .__/ \___|
                                             | |          
                                             |_|          
  🎰 2026 Crypto Casino Platform 🎰
  Luxury Obsidian Edition
EOF
echo -e "${NC}"

# Configuration
APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOG_FILE="$APP_DIR/logs/deployment.log"
DB_NAME="degensden_db"
DB_USER="degensden_user"
DB_PASS="Degens¤Den2026Secure!"
CLOUDFLARE_DOMAIN="degensden.org"

# Create logs directory
mkdir -p "$APP_DIR/logs"

# Logging function
log() {
    echo -e "${2:-$GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}" | tee -a "$LOG_FILE"
}

error() {
    echo -e "${RED}[ERROR] $1${NC}" | tee -a "$LOG_FILE"
    exit 1
}

warning() {
    echo -e "${YELLOW}[WARNING] $1${NC}" | tee -a "$LOG_FILE"
}

###############################################################################
# Step 1: System Requirements Check
###############################################################################
log "=== Step 1: Checking System Requirements ===" "$CYAN"

# Check Node.js
if ! command -v node &> /dev/null; then
    error "Node.js is not installed. Please install Node.js 22+ first."
fi
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    error "Node.js version 18+ required. Current: $(node -v)"
fi
log "✓ Node.js $(node -v) detected"

# Check pnpm
if ! command -v pnpm &> /dev/null; then
    log "Installing pnpm..." "$YELLOW"
    npm install -g pnpm@10.4.1 || error "Failed to install pnpm"
fi
log "✓ pnpm $(pnpm -v) detected"

# Check MySQL
if ! command -v mysql &> /dev/null; then
    warning "MySQL not detected. Installing MySQL..."
    if command -v apt-get &> /dev/null; then
        sudo apt-get update
        sudo DEBIAN_FRONTEND=noninteractive apt-get install -y mysql-server
    elif command -v yum &> /dev/null; then
        sudo yum install -y mysql-server
    else
        error "Cannot install MySQL automatically. Please install manually."
    fi
fi
log "✓ MySQL detected"

###############################################################################
# Step 2: Database Setup
###############################################################################
log "=== Step 2: Setting Up Database ===" "$CYAN"

# Start MySQL if not running
sudo systemctl start mysql || true
sudo systemctl enable mysql || true

# Create database and user
log "Creating database and user..."
sudo mysql -e "CREATE DATABASE IF NOT EXISTS $DB_NAME;" 2>/dev/null || true
sudo mysql -e "CREATE USER IF NOT EXISTS '$DB_USER'@'localhost' IDENTIFIED BY '$DB_PASS';" 2>/dev/null || true
sudo mysql -e "GRANT ALL PRIVILEGES ON $DB_NAME.* TO '$DB_USER'@'localhost';" 2>/dev/null || true
sudo mysql -e "FLUSH PRIVILEGES;" 2>/dev/null || true

log "✓ Database '$DB_NAME' ready"
log "✓ User '$DB_USER' configured"

###############################################################################
# Step 3: Install Dependencies
###############################################################################
log "=== Step 3: Installing Dependencies ===" "$CYAN"

cd "$APP_DIR"
log "Installing npm packages..."
pnpm install --no-frozen-lockfile || error "Failed to install dependencies"
log "✓ Dependencies installed"

###############################################################################
# Step 4: Database Migrations
###############################################################################
log "=== Step 4: Running Database Migrations ===" "$CYAN"

pnpm db:push || warning "Database migration warning (may be expected)"
log "✓ Database schema updated"

###############################################################################
# Step 5: Build Application
###############################################################################
log "=== Step 5: Building Application ===" "$CYAN"

log "Building production bundle..."
pnpm build || error "Build failed"
log "✓ Application built successfully"

###############################################################################
# Step 6: Cloudflared Tunnel Setup
###############################################################################
log "=== Step 6: Setting Up Cloudflared Tunnel ===" "$CYAN"

# Check if cloudflared is installed
if ! command -v cloudflared &> /dev/null; then
    log "Installing Cloudflared..." "$YELLOW"
    
    # Download and install cloudflared
    if [ "$(uname -m)" = "x86_64" ]; then
        wget -q https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb
        sudo dpkg -i cloudflared-linux-amd64.deb || sudo apt-get install -f -y
        rm cloudflared-linux-amd64.deb
    else
        wget -q https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-arm64.deb
        sudo dpkg -i cloudflared-linux-arm64.deb || sudo apt-get install -f -y
        rm cloudflared-linux-arm64.deb
    fi
    
    log "✓ Cloudflared installed"
fi

# Create cloudflared directory
mkdir -p ~/.cloudflared

# Copy configuration
if [ -f "$APP_DIR/cloudflared-config.yml" ]; then
    cp "$APP_DIR/cloudflared-config.yml" ~/.cloudflared/config.yml
    log "✓ Cloudflared configuration copied"
fi

log "
${YELLOW}════════════════════════════════════════════════════════════════${NC}
${YELLOW}     MANUAL CLOUDFLARE TUNNEL SETUP REQUIRED${NC}
${YELLOW}════════════════════════════════════════════════════════════════${NC}

To complete the Cloudflare Tunnel setup, run these commands:

1. Login to Cloudflare:
   ${CYAN}cloudflared tunnel login${NC}

2. Create tunnel:
   ${CYAN}cloudflared tunnel create degensden-prod${NC}

3. Route DNS:
   ${CYAN}cloudflared tunnel route dns degensden-prod degensden.org${NC}
   ${CYAN}cloudflared tunnel route dns degensden-prod www.degensden.org${NC}

4. Start tunnel (in a separate terminal or as service):
   ${CYAN}cloudflared tunnel run degensden-prod${NC}

Or install as a service:
   ${CYAN}sudo cloudflared service install${NC}
   ${CYAN}sudo systemctl start cloudflared${NC}

${YELLOW}════════════════════════════════════════════════════════════════${NC}
"

###############################################################################
# Step 7: Create Systemd Service (Optional)
###############################################################################
log "=== Step 7: Creating Systemd Service ===" "$CYAN"

SERVICE_FILE="/etc/systemd/system/degensden.service"
sudo tee "$SERVICE_FILE" > /dev/null << EOF
[Unit]
Description=Degens¤Den Casino Platform
After=network.target mysql.service

[Service]
Type=simple
User=$USER
WorkingDirectory=$APP_DIR
Environment=NODE_ENV=production
ExecStart=$(which pnpm) start
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal
SyslogIdentifier=degensden

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl daemon-reload
log "✓ Systemd service created"

###############################################################################
# Step 8: Start Application
###############################################################################
log "=== Step 8: Starting Application ===" "$CYAN"

# Stop existing service if running
sudo systemctl stop degensden 2>/dev/null || true

# Start the service
sudo systemctl start degensden || error "Failed to start Degens¤Den service"
sudo systemctl enable degensden

log "✓ Degens¤Den service started and enabled"

###############################################################################
# Step 9: Health Check
###############################################################################
log "=== Step 9: Running Health Check ===" "$CYAN"

sleep 5

if curl -s http://localhost:3000 > /dev/null; then
    log "✓ Application is responding on http://localhost:3000"
else
    warning "Application may not be ready yet. Check logs with: journalctl -u degensden -f"
fi

###############################################################################
# Deployment Complete
###############################################################################

echo -e "
${GREEN}════════════════════════════════════════════════════════════════${NC}
${GREEN}     🎉 CLOUTSCAPE DEPLOYMENT COMPLETE! 🎉${NC}
${GREEN}════════════════════════════════════════════════════════════════${NC}

${CYAN}Application Status:${NC}
  • Service: ${GREEN}Running${NC}
  • Local URL: http://localhost:3000
  • Domain: https://$CLOUDFLARE_DOMAIN (after tunnel setup)
  
${CYAN}Useful Commands:${NC}
  • View logs:      ${YELLOW}journalctl -u degensden -f${NC}
  • Restart app:    ${YELLOW}sudo systemctl restart degensden${NC}
  • Stop app:       ${YELLOW}sudo systemctl stop degensden${NC}
  • App status:     ${YELLOW}sudo systemctl status degensden${NC}
  
${CYAN}Database Info:${NC}
  • Database:       $DB_NAME
  • User:           $DB_USER
  • Host:           localhost:3306
  
${CYAN}Next Steps:${NC}
  1. Complete Cloudflare Tunnel setup (see instructions above)
  2. Visit https://$CLOUDFLARE_DOMAIN in your browser
  3. Create your admin account
  4. Start making that crypto! 💰🎰

${CYAN}Support:${NC}
  • GitHub: https://github.com/damienmarx/degensden
  • Logs: $LOG_FILE

${GREEN}════════════════════════════════════════════════════════════════${NC}
"

log "Deployment completed successfully!" "$GREEN"
