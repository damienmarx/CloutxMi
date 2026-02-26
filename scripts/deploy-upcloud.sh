#!/bin/bash
# CloutScape Deployment Script for UpCloud
# This script is designed to be run on the target UpCloud server.

set -e

# Configuration
LOG_FILE="/var/log/cloutscape_deploy.log"
APP_DIR="/var/www/CloutScape"
DOMAIN="cloutscape.org"

# Logging function
log() {
    local level=$1
    local message=$2
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] [$level] $message" | sudo tee -a "$LOG_FILE"
}

# Error handling
handle_error() {
    local exit_code=$?
    local last_command=$BASH_COMMAND
    log "ERROR" "Command '$last_command' failed with exit code $exit_code."
    echo "----------------------------------------------------------"
    echo "DEPLOYMENT FAILED!"
    echo "Check logs at: $LOG_FILE"
    echo "Common fixes:"
    echo "1. Check if port 3000 is already in use: sudo lsof -i :3000"
    echo "2. Verify MySQL service is running: sudo systemctl status mysql"
    echo "3. Check Nginx configuration: sudo nginx -t"
    echo "----------------------------------------------------------"
    exit $exit_code
}

trap handle_error ERR

log "INFO" "Starting CloutScape deployment on UpCloud..."

# 1. System Dependencies
log "INFO" "Installing system dependencies..."
export DEBIAN_FRONTEND=noninteractive
sudo apt-get update
sudo apt-get install -y curl git nginx mysql-server certbot python3-certbot-nginx 2>&1 | sudo tee -a "$LOG_FILE"

# 2. Node.js Setup (v20)
log "INFO" "Setting up Node.js v20..."
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo bash -
    sudo apt-get install -y nodejs 2>&1 | sudo tee -a "$LOG_FILE"
fi

# 3. Global Tools
log "INFO" "Installing global tools (pnpm, pm2)..."
sudo npm install -g pnpm pm2 2>&1 | sudo tee -a "$LOG_FILE"

# 4. Database Setup
log "INFO" "Configuring MySQL database..."
sudo mysql -e "CREATE DATABASE IF NOT EXISTS cloutscape_production;"
sudo mysql -e "CREATE USER IF NOT EXISTS 'clout_admin'@'localhost' IDENTIFIED BY 'CloutScape_Secure_2026!';"
sudo mysql -e "GRANT ALL PRIVILEGES ON cloutscape_production.* TO 'clout_admin'@'localhost';"
sudo mysql -e "FLUSH PRIVILEGES;"

# 5. Application Build
log "INFO" "Installing application dependencies and building..."
cd "$APP_DIR"
pnpm install 2>&1 | sudo tee -a "$LOG_FILE"
pnpm run build 2>&1 | sudo tee -a "$LOG_FILE"

# 6. Process Management
log "INFO" "Starting application with PM2..."
pm2 delete cloutscape || true
NODE_ENV=production pm2 start dist/index.js --name "cloutscape" 2>&1 | sudo tee -a "$LOG_FILE"
pm2 save
# Setup PM2 to start on boot
pm2 startup | grep "sudo env" | bash || true

# 7. Nginx Configuration
log "INFO" "Configuring Nginx..."
cat << NGINX_CONF | sudo tee /etc/nginx/sites-available/$DOMAIN
server {
    listen 80;
    server_name $DOMAIN www.$DOMAIN;

    location / {
        proxy_pass http://cloutscape.org;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}
NGINX_CONF

sudo ln -sf /etc/nginx/sites-available/$DOMAIN /etc/nginx/sites-enabled/
[ -f /etc/nginx/sites-enabled/default ] && sudo unlink /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl restart nginx

log "SUCCESS" "Deployment finished successfully! Domain: $DOMAIN"
echo "Next step: Run 'sudo certbot --nginx -d $DOMAIN -d www.$DOMAIN' for SSL."
