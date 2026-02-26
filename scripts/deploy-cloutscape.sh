#!/bin/bash
# CloutScape Deployment Script for cloutscape.org
# This script automates the setup of Node.js, Nginx, MySQL, and PM2 on an Ubuntu server.

set -e

# Configuration
DOMAIN="cloutscape.org"
REPO_URL="https://github.com/No6love9/CloutScape.git"
APP_DIR="/var/www/CloutScape"
NODE_VERSION="20"

echo "--- Starting CloutScape Deployment on $DOMAIN ---"

# 1. Update System
echo "Updating system packages..."
sudo apt-get update && sudo apt-get upgrade -y

# 2. Install Dependencies
echo "Installing core dependencies..."
sudo apt-get install -y curl git build-essential nginx mysql-server ufw

# 3. Install Node.js and pnpm
echo "Installing Node.js $NODE_VERSION and pnpm..."
curl -fsSL https://deb.nodesource.com/setup_$NODE_VERSION.x | sudo -E bash -
sudo apt-get install -y nodejs
sudo npm install -g pnpm pm2

# 4. Configure Firewall
echo "Configuring UFW firewall..."
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw --force enable

# 5. Setup Application Directory
echo "Setting up application directory at $APP_DIR..."
sudo mkdir -p /var/www
sudo chown -R $USER:$USER /var/www

if [ -d "$APP_DIR" ]; then
    echo "Updating existing repository..."
    cd "$APP_DIR"
    git pull
else
    echo "Cloning repository..."
    git clone "$REPO_URL" "$APP_DIR"
    cd "$APP_DIR"
fi

# 6. Install App Dependencies and Build
echo "Installing application dependencies..."
pnpm install
echo "Building the application..."
pnpm run build

# 7. Nginx Configuration
echo "Configuring Nginx for $DOMAIN..."
cat <<EOF | sudo tee /etc/nginx/sites-available/$DOMAIN
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
EOF

sudo ln -sf /etc/nginx/sites-available/$DOMAIN /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl restart nginx

# 8. Start Application with PM2
echo "Starting application with PM2..."
# Note: Ensure .env is configured before this step in a real production environment
pm2 delete cloutscape || true
pm2 start pnpm --name "cloutscape" -- run start
pm2 save
pm2 startup

echo "--- Deployment Script Completed Successfully ---"
echo "Next Steps:"
echo "1. Configure your .env file in $APP_DIR"
echo "2. Run 'sudo certbot --nginx -d $DOMAIN -d www.$DOMAIN' for SSL"
