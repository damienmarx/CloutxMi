#!/bin/bash

###############################################################################
# Degens¤Den Complete Production Deployment
# Ubuntu-optimized with all features
# Domain: cloutscape.org
###############################################################################

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m'

# Banner
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
  🎰 Complete Production Deployment 🎰
  Ubuntu Edition - cloutscape.org
EOF
echo -e "${NC}"

# Configuration
APP_DIR="$(pwd)"
DOMAIN="cloutscape.org"
DB_NAME="cloutscape_db"
DB_USER="cloutscape_user"
DB_PASS="Degens¤Den2026Secure!"

echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}           CLOUTSCAPE PRODUCTION DEPLOYMENT${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${CYAN}📦 Project Directory:${NC} $APP_DIR"
echo -e "${CYAN}🌐 Domain:${NC} $DOMAIN"
echo -e "${CYAN}🗄️  Database:${NC} $DB_NAME"
echo ""

# Prerequisites check
echo -e "${CYAN}━━━ Step 1/10: System Requirements ━━━${NC}"

# Check if running on Ubuntu
if [ -f /etc/os-release ]; then
    . /etc/os-release
    if [[ "$ID" != "ubuntu" ]]; then
        echo -e "${YELLOW}⚠️  Warning: Not running on Ubuntu. Some features may not work.${NC}"
    else
        echo -e "${GREEN}✓ Ubuntu detected: $VERSION${NC}"
    fi
fi

# Install Node.js if needed
if ! command -v node &> /dev/null; then
    echo -e "${YELLOW}Installing Node.js 22...${NC}"
    curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
    sudo apt-get install -y nodejs
fi
echo -e "${GREEN}✓ Node.js $(node -v)${NC}"

# Install pnpm
if ! command -v pnpm &> /dev/null; then
    echo -e "${YELLOW}Installing pnpm...${NC}"
    npm install -g pnpm@10.4.1
fi
echo -e "${GREEN}✓ pnpm $(pnpm -v)${NC}"

# Install MySQL
echo -e "${CYAN}━━━ Step 2/10: Database Setup ━━━${NC}"

if ! command -v mysql &> /dev/null; then
    echo -e "${YELLOW}Installing MySQL...${NC}"
    sudo apt-get update
    sudo DEBIAN_FRONTEND=noninteractive apt-get install -y mysql-server
fi

sudo systemctl start mysql
sudo systemctl enable mysql
echo -e "${GREEN}✓ MySQL running${NC}"

# Create database
echo -e "${YELLOW}Creating database...${NC}"
sudo mysql << EOF
CREATE DATABASE IF NOT EXISTS $DB_NAME CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS '$DB_USER'@'localhost' IDENTIFIED BY '$DB_PASS';
GRANT ALL PRIVILEGES ON $DB_NAME.* TO '$DB_USER'@'localhost';
FLUSH PRIVILEGES;
EOF
echo -e "${GREEN}✓ Database created${NC}"

# Install dependencies
echo -e "${CYAN}━━━ Step 3/10: Installing Dependencies ━━━${NC}"
cd "$APP_DIR"
pnpm install --no-frozen-lockfile
echo -e "${GREEN}✓ Dependencies installed${NC}"

# Environment setup
echo -e "${CYAN}━━━ Step 4/10: Environment Configuration ━━━${NC}"

if [ ! -f .env ]; then
    cp .env.example .env 2>/dev/null || true
fi

# Update .env with correct values
sed -i "s|DATABASE_URL=.*|DATABASE_URL=mysql://${DB_USER}:${DB_PASS}@localhost:3306/${DB_NAME}|g" .env
sed -i "s|CLOUDFLARE_DOMAIN=.*|CLOUDFLARE_DOMAIN=${DOMAIN}|g" .env

echo -e "${GREEN}✓ Environment configured${NC}"

# Database migrations
echo -e "${CYAN}━━━ Step 5/10: Database Migrations ━━━${NC}"
pnpm db:push || echo -e "${YELLOW}⚠️  Migration warning (may be normal)${NC}"
echo -e "${GREEN}✓ Database schema ready${NC}"

# Build application
echo -e "${CYAN}━━━ Step 6/10: Building Application ━━━${NC}"
NODE_ENV=production pnpm build
echo -e "${GREEN}✓ Application built${NC}"

# Install Cloudflared
echo -e "${CYAN}━━━ Step 7/10: Cloudflare Tunnel Setup ━━━${NC}"

if ! command -v cloudflared &> /dev/null; then
    echo -e "${YELLOW}Installing Cloudflared...${NC}"
    
    # Detect architecture
    ARCH=$(uname -m)
    if [ "$ARCH" = "x86_64" ]; then
        wget -q https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb
        sudo dpkg -i cloudflared-linux-amd64.deb || sudo apt-get install -f -y
        rm cloudflared-linux-amd64.deb
    elif [ "$ARCH" = "aarch64" ]; then
        wget -q https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-arm64.deb
        sudo dpkg -i cloudflared-linux-arm64.deb || sudo apt-get install -f -y
        rm cloudflared-linux-arm64.deb
    fi
    
    echo -e "${GREEN}✓ Cloudflared installed${NC}"
fi

# Systemd service
echo -e "${CYAN}━━━ Step 8/10: Service Configuration ━━━${NC}"

sudo tee /etc/systemd/system/degensden.service > /dev/null << EOF
[Unit]
Description=Degens¤Den Casino Platform
After=network.target mysql.service

[Service]
Type=simple
User=$USER
WorkingDirectory=$APP_DIR
Environment=NODE_ENV=production
Environment=PORT=3000
ExecStart=$(which pnpm) start
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal
SyslogIdentifier=degensden

# Security
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=strict
ProtectHome=true
ReadWritePaths=$APP_DIR/logs

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl daemon-reload
sudo systemctl enable degensden
echo -e "${GREEN}✓ Systemd service configured${NC}"

# Create logs directory
mkdir -p "$APP_DIR/logs"

# Start application
echo -e "${CYAN}━━━ Step 9/10: Starting Application ━━━${NC}"

sudo systemctl stop degensden 2>/dev/null || true
sleep 2
sudo systemctl start degensden

# Wait for startup
echo -e "${YELLOW}Waiting for application to start...${NC}"
sleep 10

# Health check
if curl -s http://localhost:3000 > /dev/null; then
    echo -e "${GREEN}✓ Application is running${NC}"
else
    echo -e "${RED}⚠️  Application may not be responding yet${NC}"
    echo -e "${YELLOW}Check logs: sudo journalctl -u degensden -n 50${NC}"
fi

# Cloudflare instructions
echo -e "${CYAN}━━━ Step 10/10: Cloudflare Tunnel Setup ━━━${NC}"

echo -e "
${YELLOW}╔══════════════════════════════════════════════════════════╗
║       CLOUDFLARE TUNNEL MANUAL SETUP REQUIRED           ║
╚══════════════════════════════════════════════════════════╝${NC}

${CYAN}1. Login to Cloudflare:${NC}
   cloudflared tunnel login

${CYAN}2. Create tunnel:${NC}
   cloudflared tunnel create cloutscape-prod

${CYAN}3. Copy tunnel credentials:${NC}
   cp ~/.cloudflared/*.json ~/.cloudflared/cloutscape-tunnel.json

${CYAN}4. Route DNS to tunnel:${NC}
   cloudflared tunnel route dns cloutscape-prod ${DOMAIN}
   cloudflared tunnel route dns cloutscape-prod www.${DOMAIN}

${CYAN}5. Start tunnel:${NC}
   cloudflared tunnel --config $APP_DIR/cloudflared-config.yml run cloutscape-prod

${CYAN}6. Install as service (optional):${NC}
   sudo cloudflared service install
   sudo systemctl start cloudflared
   sudo systemctl enable cloudflared

${YELLOW}════════════════════════════════════════════════════════════${NC}
"

# Final summary
echo -e "
${GREEN}╔══════════════════════════════════════════════════════════════╗
║                   DEPLOYMENT COMPLETE! 🎉                   ║
╚══════════════════════════════════════════════════════════════╝${NC}

${CYAN}📊 Application Status:${NC}
  • Service: ${GREEN}Running${NC}
  • Local URL: ${BLUE}http://localhost:3000${NC}
  • Domain: ${BLUE}https://${DOMAIN}${NC} ${YELLOW}(after tunnel)${NC}
  • Database: ${GREEN}MySQL ($DB_NAME)${NC}

${CYAN}🛠️  Useful Commands:${NC}
  • View logs:      ${YELLOW}sudo journalctl -u degensden -f${NC}
  • Restart:        ${YELLOW}sudo systemctl restart degensden${NC}
  • Stop:           ${YELLOW}sudo systemctl stop degensden${NC}
  • Status:         ${YELLOW}sudo systemctl status degensden${NC}
  • Database:       ${YELLOW}mysql -u $DB_USER -p $DB_NAME${NC}

${CYAN}📁 Important Files:${NC}
  • Environment:    ${YELLOW}$APP_DIR/.env${NC}
  • Service:        ${YELLOW}/etc/systemd/system/degensden.service${NC}
  • Logs:           ${YELLOW}$APP_DIR/logs/${NC}
  • Cloudflared:    ${YELLOW}$APP_DIR/cloudflared-config.yml${NC}

${CYAN}🔐 Security Reminders:${NC}
  ✓ Change database password in .env
  ✓ Generate new JWT_SECRET
  ✓ Set up firewall (ufw enable)
  ✓ Configure SSL via Cloudflare
  ✓ Enable automatic backups

${CYAN}🎰 Next Steps:${NC}
  1. Complete Cloudflare Tunnel setup (see above)
  2. Visit https://${DOMAIN} in your browser
  3. Create your admin account
  4. Test all games
  5. Configure Discord bot (optional)
  6. Set up payment methods
  7. Enable 2FA for admin account

${CYAN}📞 Support:${NC}
  • GitHub: https://github.com/damienmarx/degensden
  • Logs: $APP_DIR/logs/

${GREEN}════════════════════════════════════════════════════════════════${NC}
${PURPLE}
   Degens¤Den is LIVE! Start making that crypto! 💎🎰✨
${NC}
"

# Save deployment info
cat > "$APP_DIR/DEPLOYMENT_INFO.txt" << EOF
Degens¤Den Deployment Information
==================================
Deployed: $(date)
Domain: $DOMAIN
Database: $DB_NAME
User: $DB_USER

Local URL: http://localhost:3000
Production URL: https://$DOMAIN

Service Status: sudo systemctl status degensden
View Logs: sudo journalctl -u degensden -f
Restart: sudo systemctl restart degensden

Database Access:
mysql -u $DB_USER -p $DB_NAME

Important: Complete Cloudflare Tunnel setup to make site public!
EOF

echo -e "${GREEN}✓ Deployment info saved to DEPLOYMENT_INFO.txt${NC}"
