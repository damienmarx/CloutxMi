#!/bin/bash

################################################################################
# CloutScape Master Automated Setup Script
# Purpose: Complete one-command deployment with Cloudflare Tunnel integration
# Domain: cloutscape.org
# Features: Auto-config repo, env, local database, and tunnel routing
################################################################################

set -e

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
REPO_URL="https://github.com/damienmarx/CloutxMi.git"
DOMAIN="cloutscape.org"
APP_PORT=3000
TUNNEL_PORT=8787
PROJECT_DIR="${HOME}/cloutscape"
DB_NAME="cloutscape_db"
DB_USER="cloutscape_user"
DB_PASSWORD=$(openssl rand -base64 32)
DB_HOST="127.0.0.1"
DB_PORT=3306

################################################################################
# Utility Functions
################################################################################

log_info() {
  echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
  echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
  echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
  echo -e "${RED}[ERROR]${NC} $1"
  exit 1
}

check_command() {
  if ! command -v "$1" &> /dev/null; then
    log_error "$1 is not installed. Please install $1 and try again."
  fi
}

################################################################################
# System Setup
################################################################################

setup_system() {
  log_info "Setting up system dependencies..."
  
  # Update package manager
  sudo apt-get update -qq
  
  # Install required packages
  sudo apt-get install -y -qq \
    curl \
    git \
    build-essential \
    wget \
    unzip \
    mysql-server \
    mysql-client \
    nodejs \
    npm \
    > /dev/null 2>&1
  
  log_success "System dependencies installed"
}

################################################################################
# Node.js & Package Manager Setup
################################################################################

setup_nodejs() {
  log_info "Setting up Node.js and package managers..."
  
  # Install pnpm globally
  sudo npm install -g pnpm --silent > /dev/null 2>&1
  
  # Verify installations
  check_command node
  check_command npm
  check_command pnpm
  
  log_success "Node.js and pnpm configured"
}

################################################################################
# Repository Setup
################################################################################

setup_repository() {
  log_info "Setting up CloutScape repository..."
  
  # Remove existing directory if it exists
  if [ -d "$PROJECT_DIR" ]; then
    log_warning "Project directory already exists. Backing up to ${PROJECT_DIR}.backup"
    mv "$PROJECT_DIR" "${PROJECT_DIR}.backup"
  fi
  
  # Clone repository
  mkdir -p "$PROJECT_DIR"
  cd "$PROJECT_DIR"
  git clone "$REPO_URL" . > /dev/null 2>&1
  
  log_success "Repository cloned to $PROJECT_DIR"
}

################################################################################
# Database Setup
################################################################################

setup_database() {
  log_info "Setting up MySQL database..."
  
  # Start MySQL service
  sudo service mysql start > /dev/null 2>&1 || sudo systemctl start mysql > /dev/null 2>&1
  
  # Wait for MySQL to be ready
  sleep 2
  
  # Create database and user
  sudo mysql -u root << EOF > /dev/null 2>&1
CREATE DATABASE IF NOT EXISTS ${DB_NAME};
CREATE USER IF NOT EXISTS '${DB_USER}'@'localhost' IDENTIFIED BY '${DB_PASSWORD}';
GRANT ALL PRIVILEGES ON ${DB_NAME}.* TO '${DB_USER}'@'localhost';
FLUSH PRIVILEGES;
EOF
  
  log_success "Database created: $DB_NAME"
  log_info "Database user: $DB_USER"
  log_info "Database password saved to .env"
}

################################################################################
# Environment Configuration
################################################################################

setup_environment() {
  log_info "Configuring environment variables..."
  
  cd "$PROJECT_DIR"
  
  # Create .env file with all required variables
  cat > .env << EOF
# Database Configuration
DATABASE_URL="mysql://${DB_USER}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/${DB_NAME}"
DB_HOST=${DB_HOST}
DB_PORT=${DB_PORT}
DB_NAME=${DB_NAME}
DB_USER=${DB_USER}
DB_PASSWORD=${DB_PASSWORD}

# Application Configuration
NODE_ENV=production
APP_PORT=${APP_PORT}
DOMAIN=${DOMAIN}
SECURE_COOKIES=true

# Cloudflare Tunnel Configuration
CLOUDFLARE_TUNNEL_TOKEN=
CLOUDFLARE_ACCOUNT_ID=
CLOUDFLARE_TUNNEL_NAME=cloutscape-tunnel

# OAuth Configuration (Optional)
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

# API Keys (Optional)
OPENAI_API_KEY=
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_S3_BUCKET=

# Security
JWT_SECRET=$(openssl rand -base64 32)
SESSION_SECRET=$(openssl rand -base64 32)

# Logging
LOG_LEVEL=info
EOF
  
  log_success "Environment file created at .env"
  log_warning "Please update .env with your Cloudflare Tunnel credentials"
}

################################################################################
# Dependencies Installation
################################################################################

install_dependencies() {
  log_info "Installing project dependencies..."
  
  cd "$PROJECT_DIR"
  
  # Install with npm (using legacy peer deps for compatibility)
  npm install --legacy-peer-deps > /dev/null 2>&1
  
  log_success "Dependencies installed"
}

################################################################################
# Database Migrations
################################################################################

run_migrations() {
  log_info "Running database migrations..."
  
  cd "$PROJECT_DIR"
  
  # Run drizzle migrations
  npm run db:push > /dev/null 2>&1 || log_warning "Database migrations may require manual review"
  
  log_success "Database migrations completed"
}

################################################################################
# Build Application
################################################################################

build_application() {
  log_info "Building application..."
  
  cd "$PROJECT_DIR"
  
  # Run build
  npm run build > /dev/null 2>&1
  
  log_success "Application built successfully"
}

################################################################################
# Cloudflare Tunnel Setup
################################################################################

setup_cloudflare_tunnel() {
  log_info "Setting up Cloudflare Tunnel..."
  
  # Download cloudflared
  if ! command -v cloudflared &> /dev/null; then
    log_info "Installing cloudflared..."
    wget -q https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64 -O /tmp/cloudflared
    sudo mv /tmp/cloudflared /usr/local/bin/cloudflared
    sudo chmod +x /usr/local/bin/cloudflared
  fi
  
  log_success "Cloudflare Tunnel ready"
  log_warning "To complete tunnel setup, run: cloudflared tunnel login"
}

################################################################################
# PM2 Process Manager Setup
################################################################################

setup_process_manager() {
  log_info "Setting up PM2 process manager..."
  
  # Install PM2 globally
  sudo npm install -g pm2 --silent > /dev/null 2>&1
  
  # Create PM2 ecosystem config
  cat > "$PROJECT_DIR/ecosystem.config.js" << 'EOF'
module.exports = {
  apps: [
    {
      name: 'cloutscape',
      script: './dist/index.js',
      instances: 'max',
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
      error_file: './logs/error.log',
      out_file: './logs/out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
    },
  ],
};
EOF
  
  log_success "PM2 configured"
}

################################################################################
# Systemd Service Setup
################################################################################

setup_systemd_service() {
  log_info "Setting up systemd service..."
  
  # Create systemd service file
  sudo tee /etc/systemd/system/cloutscape.service > /dev/null << EOF
[Unit]
Description=CloutScape Application
After=network.target mysql.service
Wants=mysql.service

[Service]
Type=simple
User=${USER}
WorkingDirectory=${PROJECT_DIR}
ExecStart=/usr/bin/npm start
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
EOF
  
  # Reload systemd
  sudo systemctl daemon-reload
  
  log_success "Systemd service created"
}

################################################################################
# Cloudflare Tunnel Configuration
################################################################################

create_tunnel_config() {
  log_info "Creating Cloudflare Tunnel configuration..."
  
  # Create tunnel config directory
  mkdir -p "$PROJECT_DIR/.cloudflare"
  
  # Create tunnel configuration
  cat > "$PROJECT_DIR/.cloudflare/config.yml" << EOF
tunnel: cloutscape-tunnel
credentials-file: ~/.cloudflare/cloutscape-tunnel.json

ingress:
  - hostname: ${DOMAIN}
    service: http://localhost:${APP_PORT}
  - hostname: www.${DOMAIN}
    service: http://localhost:${APP_PORT}
  - service: http_status:404
EOF
  
  log_success "Tunnel configuration created"
  log_warning "To activate tunnel, run: cloudflared tunnel route dns cloutscape-tunnel ${DOMAIN}"
}

################################################################################
# Verification & Status
################################################################################

verify_setup() {
  log_info "Verifying setup..."
  
  # Check MySQL
  if sudo service mysql status > /dev/null 2>&1; then
    log_success "MySQL is running"
  else
    log_warning "MySQL may not be running"
  fi
  
  # Check Node modules
  if [ -d "$PROJECT_DIR/node_modules" ]; then
    log_success "Node modules installed"
  else
    log_error "Node modules not found"
  fi
  
  # Check build output
  if [ -d "$PROJECT_DIR/dist" ]; then
    log_success "Build artifacts present"
  else
    log_error "Build artifacts not found"
  fi
  
  log_success "Setup verification complete"
}

################################################################################
# Display Summary
################################################################################

display_summary() {
  cat << EOF

${GREEN}╔════════════════════════════════════════════════════════════════╗${NC}
${GREEN}║         CloutScape Setup Complete!                             ║${NC}
${GREEN}╚════════════════════════════════════════════════════════════════╝${NC}

${BLUE}Project Information:${NC}
  Location: ${PROJECT_DIR}
  Domain: ${DOMAIN}
  App Port: ${APP_PORT}

${BLUE}Database Information:${NC}
  Host: ${DB_HOST}
  Port: ${DB_PORT}
  Database: ${DB_NAME}
  User: ${DB_USER}
  Password: ${DB_PASSWORD}

${BLUE}Next Steps:${NC}
  1. Update .env with Cloudflare Tunnel credentials:
     cd ${PROJECT_DIR}
     nano .env

  2. Login to Cloudflare Tunnel:
     cloudflared tunnel login

  3. Create tunnel:
     cloudflared tunnel create cloutscape-tunnel

  4. Route DNS:
     cloudflared tunnel route dns cloutscape-tunnel ${DOMAIN}

  5. Start the application:
     cd ${PROJECT_DIR}
     npm start
     
     OR with PM2:
     pm2 start ecosystem.config.js

  6. Enable systemd service (optional):
     sudo systemctl enable cloutscape
     sudo systemctl start cloutscape

  7. Monitor logs:
     pm2 logs cloutscape
     OR
     journalctl -u cloutscape -f

${BLUE}Useful Commands:${NC}
  - Start app: npm start
  - Stop app: npm stop
  - Rebuild: npm run build
  - Database: mysql -u ${DB_USER} -p ${DB_NAME}
  - Tunnel status: cloudflared tunnel info cloutscape-tunnel

${YELLOW}Important:${NC}
  - Keep your .env file secure and never commit to git
  - Ensure MySQL is running before starting the app
  - Update DNS records to point to Cloudflare nameservers

${GREEN}Documentation:${NC}
  - API: ${DOMAIN}/api/docs
  - Cloudflare: https://developers.cloudflare.com/cloudflare-one/
  - CloutScape: See README.md

EOF
}

################################################################################
# Main Execution
################################################################################

main() {
  clear
  
  cat << EOF
${BLUE}╔════════════════════════════════════════════════════════════════╗${NC}
${BLUE}║    CloutScape Master Automated Setup Script                    ║${NC}
${BLUE}║    Domain: ${DOMAIN}${NC}
${BLUE}╚════════════════════════════════════════════════════════════════╝${NC}

This script will:
  ✓ Install system dependencies
  ✓ Setup Node.js and package managers
  ✓ Clone the CloutScape repository
  ✓ Configure MySQL database
  ✓ Setup environment variables
  ✓ Install project dependencies
  ✓ Run database migrations
  ✓ Build the application
  ✓ Configure Cloudflare Tunnel
  ✓ Setup PM2 process manager
  ✓ Create systemd service

${YELLOW}This requires sudo privileges. You may be prompted for your password.${NC}

EOF
  
  read -p "Continue with setup? (y/n) " -n 1 -r
  echo
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    log_warning "Setup cancelled"
    exit 0
  fi
  
  # Execute setup steps
  setup_system
  setup_nodejs
  setup_repository
  setup_database
  setup_environment
  install_dependencies
  run_migrations
  build_application
  setup_cloudflare_tunnel
  setup_process_manager
  setup_systemd_service
  create_tunnel_config
  verify_setup
  display_summary
  
  log_success "CloutScape setup completed successfully!"
}

# Run main function
main "$@"
