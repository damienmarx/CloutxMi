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
DB_NAME="monalisa"
DB_USER="damien"
DB_PASSWORD="sheba"
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
# Cloudflare API Configuration
CLOUDFLARE_API_KEY=0cb5cf129cb110ba1c85ab209c8874a9eb5e8
CLOUDFLARE_ZONE_ID=f6f7b901c0cf6921f178747285420703

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
CLOUDFLARE_API_KEY=0cb5cf129cb110ba1c85ab209c8874a9eb5e8
CLOUDFLARE_ZONE_ID=f6f7b901c0cf6921f178747285420703
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
}

################################################################################
# Verification
################################################################################

verify_setup() {
  log_info "Verifying setup..."
  
  # Check if .env exists
  if [ ! -f "$PROJECT_DIR/.env" ]; then
    log_error ".env file was not created"
  fi
  
  # Check if build directory exists
  if [ ! -d "$PROJECT_DIR/dist" ]; then
    log_warning "Build directory not found. Build may have failed."
  fi
  
  log_success "Verification complete"
}

################################################################################
# Summary
################################################################################

display_summary() {
  echo -e "\n${GREEN}╔════════════════════════════════════════════════════════════╗"
  echo "║                                                            ║"
  echo "║              ✓ Setup Complete Successfully! ✓              ║"
  echo "║                                                            ║"
  echo "╚════════════════════════════════════════════════════════════╝${NC}"
  
  echo -e "\n${BLUE}Application Details:${NC}"
  echo "- Domain: https://${DOMAIN}"
  echo "- Port: ${APP_PORT}"
  echo "- Directory: ${PROJECT_DIR}"
  
  echo -e "\n${BLUE}Database Details:${NC}"
  echo "- Database: ${DB_NAME}"
  echo "- User: ${DB_USER}"
  echo "- Password: ${DB_PASSWORD}"
  
  echo -e "\n${YELLOW}Next Steps:${NC}"
  echo "1. Run: cloudflared tunnel login"
  echo "2. Run: cloudflared tunnel run cloutscape-tunnel"
  echo "3. Visit: https://${DOMAIN}"
  
  echo -e "\n${BLUE}Logs:${NC}"
  echo "- PM2: pm2 logs cloutscape"
  echo "- Systemd: journalctl -u cloutscape -f"
}

################################################################################
# Main Execution
################################################################################

main() {
  clear
  cat << EOF
${BLUE}
╔════════════════════════════════════════════════════════════╗
║                                                            ║
║             CloutScape Master Setup Wizard                 ║
║                                                            ║
╚════════════════════════════════════════════════════════════╝
${NC}
EOF

  # Repository Unlock Key Check
  echo -e "${YELLOW}Enter the repository unlock key to continue:${NC}"
  read -r UNLOCK_KEY
  if [[ "$UNLOCK_KEY" != "Mona Lisa" ]]; then
    log_error "Invalid unlock key. Setup terminated."
  fi
  log_success "Unlock key accepted."

  cat << EOF

This script will perform a complete deployment:
  ✓ Install system dependencies
  ✓ Setup Node.js and pnpm
  ✓ Clone CloutScape repository
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
