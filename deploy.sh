#!/bin/bash

# Master All-in-One Deployment Script for CloutScape on Ubuntu
# This script automates the entire setup: Installs free tools (Node.js, PostgreSQL, pnpm, git, cloudflared), sets up a free local PostgreSQL database, clones your repo, configures .env, deploys the app as a systemd service, and exposes it via Cloudflare Tunnel for free public access (HTTPS).
# Totally free: Uses open-source tools, no paid services required (Cloudflare free tier for Tunnel/DNS).
# Guided: Prompts for all inputs with clear instructions.
# Minimal Effort: Run this script on your Ubuntu server (e.g., local VM or free VPS like Oracle Cloud Always Free).
# Robust Error Handling: Retries, logs, validation, fallbacks.
# Assumptions: Ubuntu 20.04+ (server edition preferred), sudo access, internet connection. Run as non-root user with sudo.
# Usage: Save as deploy.sh, chmod +x deploy.sh, ./deploy.sh
# Logs: Written to deploy-master.log

set -euo pipefail

# Config
LOG_FILE="deploy-master.log"
MAX_RETRIES=3
BACKOFF_START=2
REPO_URL="https://github.com/damienmarx/CloutxMi.git"
APP_DIR="$HOME/CloutScape"
DB_NAME=""
DB_USER=""
DB_PASS=""
DOMAIN=""
API_SUBDOMAIN="api"
CLOUDFLARED_CONFIG_DIR="$HOME/.cloudflared"
TUNNEL_NAME="cloutscape-tunnel"
FRONTEND_PORT=3000
BACKEND_PORT=4000  # Adjust if your app uses different; assumes concurrent in pnpm dev
NODE_VERSION="22"
PG_VERSION="14"  # PostgreSQL 14+

# Log function
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

# Notify/Exit on error
error_exit() {
    log "ERROR: $1"
    exit 1
}

# Retry function with backoff
retry() {
    local n=1 backoff=$BACKOFF_START
    until [ $n -ge $MAX_RETRIES ]; do
        "$@" && return 0 || {
            log "Retry $n/$MAX_RETRIES failed for $@. Backoff ${backoff}s..."
            sleep $backoff
            backoff=$((backoff * 2))
        }
        n=$((n+1))
    done
    error_exit "Failed after $MAX_RETRIES attempts: $@"
}

# Validate Ubuntu
if ! grep -q "Ubuntu" /etc/os-release; then
    error_exit "This script requires Ubuntu. Exiting."
fi

# Step 1: System Update & Install Dependencies
log "Step 1: Updating system and installing free tools (Node.js $NODE_VERSION, PostgreSQL $PG_VERSION, pnpm, git, curl)..."
retry sudo apt update -y
retry sudo apt upgrade -y
retry sudo apt install -y curl git postgresql-$PG_VERSION
curl -fsSL https://deb.nodesource.com/setup_$NODE_VERSION.x | sudo -E bash -
retry sudo apt install -y nodejs
retry npm install -g pnpm
log "Dependencies installed."

# Step 2: Set Up Free PostgreSQL Database
log "Step 2: Setting up free local PostgreSQL database..."
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Prompt for DB details
read -p "Enter database name (default: cloutscape_db): " DB_NAME
DB_NAME=${DB_NAME:-cloutscape_db}
read -p "Enter database user (default: cloutscape_user): " DB_USER
DB_USER=${DB_USER:-cloutscape_user}
read -s -p "Enter database password: " DB_PASS
echo ""

# Create DB user and database with error handling
sudo -u postgres psql -c "CREATE USER $DB_USER WITH PASSWORD '$DB_PASS';" || log "User already exists, skipping."
sudo -u postgres psql -c "CREATE DATABASE $DB_NAME OWNER $DB_USER;" || log "DB already exists, skipping."
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;"
log "Database setup complete. DATABASE_URL=postgres://$DB_USER:$DB_PASS@localhost:5432/$DB_NAME"

# Step 3: Clone Repo and Install App
log "Step 3: Cloning repo and installing app..."
mkdir -p "$APP_DIR"
cd "$APP_DIR"
retry git clone "$REPO_URL" .
retry pnpm install
log "Repo cloned and deps installed."

# Step 4: Configure .env
log "Step 4: Configuring .env..."
cp .env.example .env || error_exit ".env.example not found."
sed -i "s|^DATABASE_URL=.*|DATABASE_URL=postgres://$DB_USER:$DB_PASS@localhost:5432/$DB_NAME|" .env

# Prompt for additional .env vars if needed (e.g., secrets)
read -p "Enter any other secrets (e.g., JWT_SECRET, press Enter if none): " OTHER_SECRET
if [ -n "$OTHER_SECRET" ]; then
    echo "$OTHER_SECRET" >> .env
fi
log ".env configured."

# Step 5: Run DB Migrations
log "Step 5: Running database migrations..."
retry pnpm db:push
log "Migrations complete."

# Step 6: Install Cloudflared for Free Public Exposure
log "Step 6: Installing cloudflared for free HTTPS tunnel..."
retry wget -q https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64 -O cloudflared
chmod +x cloudflared
sudo mv cloudflared /usr/local/bin/
cloudflared --version || error_exit "cloudflared install failed."

# Prompt for Cloudflare details
log "Go to dash.cloudflare.com/profile/api-tokens, create a token with 'Zero Trust: Edit' and 'DNS: Edit'."
read -p "Enter Cloudflare API Token: " API_TOKEN
read -p "Enter your domain (e.g., cloutscape.org): " DOMAIN
read -p "Enter Zone ID (from dashboard Overview): " ZONE_ID

# Authenticate
retry cloudflared tunnel login

# Create Tunnel
TUNNEL_ID=$(cloudflared tunnel list --name "$TUNNEL_NAME" -o json | jq -r '.[0].id' 2>/dev/null)
[ -z "$TUNNEL_ID" ] || [ "$TUNNEL_ID" == "null" ] && retry cloudflared tunnel create "$TUNNEL_NAME"
TUNNEL_ID=$(cloudflared tunnel list --name "$TUNNEL_NAME" -o json | jq -r '.[0].id')

# Generate config.yml
mkdir -p "$CLOUDFLARED_CONFIG_DIR"
CONFIG_FILE="$CLOUDFLARED_CONFIG_DIR/config.yml"
cat > "$CONFIG_FILE" << EOF
tunnel: $TUNNEL_ID
credentials-file: $CLOUDFLARED_CONFIG_DIR/$TUNNEL_ID.json

ingress:
  - hostname: $DOMAIN
    service: http://localhost:$FRONTEND_PORT
  - hostname: $API_SUBDOMAIN.$DOMAIN
    service: http://localhost:$BACKEND_PORT
  - service: http_status:404
EOF
log "Tunnel config created."

# Set up DNS
CNAME_TARGET="$TUNNEL_ID.cfargotunnel.com"
retry curl -s -X POST "https://api.cloudflare.com/client/v4/zones/$ZONE_ID/dns_records" \
    -H "Authorization: Bearer $API_TOKEN" \
    -H "Content-Type: application/json" \
    --data "{\"type\":\"CNAME\",\"name\":\"$DOMAIN\",\"content\":\"$CNAME_TARGET\",\"ttl\":1,\"proxied\":true}"
retry curl -s -X POST "https://api.cloudflare.com/client/v4/zones/$ZONE_ID/dns_records" \
    -H "Authorization: Bearer $API_TOKEN" \
    -H "Content-Type: application/json" \
    --data "{\"type\":\"CNAME\",\"name\":\"$API_SUBDOMAIN\",\"content\":\"$CNAME_TARGET\",\"ttl\":1,\"proxied\":true}"
log "DNS setup. Wait 1-5 min for propagation."

# Install cloudflared as service
retry cloudflared service install --config "$CONFIG_FILE"
sudo systemctl start cloudflared
sudo systemctl enable cloudflared
log "Tunnel service running."

# Step 7: Deploy App as Systemd Service
log "Step 7: Deploying app as systemd service..."
cat > /etc/systemd/system/cloutscape.service << EOF
[Unit]
Description=CloutScape App
After=network.target postgresql.service

[Service]
WorkingDirectory=$APP_DIR
ExecStart=/usr/bin/pnpm dev
Restart=always
User=$USER
EnvironmentFile=$APP_DIR/.env

[Install]
WantedBy=multi-user.target
EOF
sudo systemctl daemon-reload
sudo systemctl start cloutscape
sudo systemctl enable cloutscape
log "App deployed."

# Step 8: Health Check
log "Step 8: Verifying deployment..."
sleep 30  # Wait for startup/DNS
curl -sI "https://$DOMAIN" | grep -q "HTTP" || error_exit "Frontend check failed. Check logs."
curl -sI "https://$API_SUBDOMAIN.$DOMAIN" | grep -q "HTTP" || log "Backend check optional if ports differ."
log "Deployment complete! Access at https://$DOMAIN. Logs in $LOG_FILE and journalctl -u cloutscape."