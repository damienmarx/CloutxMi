#!/bin/bash

################################################################################
# CloutScape Casino - Ubuntu Environment Setup & Validation Script
# CloutScape / Degens Den - Professional Casino Platform
# 
# This script sets up and validates the complete CloutScape environment
# including Node.js, MySQL, environment variables, and all dependencies.
################################################################################

set -e

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Script configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_NAME="CloutScape"
NODE_VERSION="18"
MYSQL_VERSION="8.0"
LOG_FILE="${SCRIPT_DIR}/setup.log"

################################################################################
# Logging Functions
################################################################################

log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1" | tee -a "$LOG_FILE"
}

success() {
    echo -e "${GREEN}✓ $1${NC}" | tee -a "$LOG_FILE"
}

error() {
    echo -e "${RED}✗ $1${NC}" | tee -a "$LOG_FILE"
}

warning() {
    echo -e "${YELLOW}⚠ $1${NC}" | tee -a "$LOG_FILE"
}

info() {
    echo -e "${CYAN}ℹ $1${NC}" | tee -a "$LOG_FILE"
}

################################################################################
# System Check Functions
################################################################################

check_os() {
    log "Checking operating system..."
    if [[ "$OSTYPE" != "linux-gnu"* ]]; then
        error "This script only supports Linux (Ubuntu). Detected: $OSTYPE"
        exit 1
    fi
    
    if ! grep -q "Ubuntu" /etc/os-release 2>/dev/null; then
        warning "This script is optimized for Ubuntu. Other Linux distributions may work but are not officially supported."
    fi
    
    success "Operating system check passed"
}

check_sudo() {
    log "Checking sudo privileges..."
    if ! sudo -n true 2>/dev/null; then
        error "This script requires sudo privileges. Please run with sudo or configure passwordless sudo."
        exit 1
    fi
    success "Sudo privileges confirmed"
}

check_command() {
    if command -v "$1" &> /dev/null; then
        return 0
    else
        return 1
    fi
}

################################################################################
# Installation Functions
################################################################################

install_node() {
    log "Checking Node.js installation..."
    
    if check_command node; then
        NODE_INSTALLED=$(node -v)
        success "Node.js already installed: $NODE_INSTALLED"
        return 0
    fi
    
    log "Installing Node.js ${NODE_VERSION}..."
    curl -fsSL https://deb.nodesource.com/setup_${NODE_VERSION}.x | sudo -E bash - || {
        error "Failed to add NodeSource repository"
        exit 1
    }
    
    sudo apt-get update -qq
    sudo apt-get install -y nodejs || {
        error "Failed to install Node.js"
        exit 1
    }
    
    success "Node.js installed: $(node -v)"
}

install_pnpm() {
    log "Checking pnpm installation..."
    
    if check_command pnpm; then
        PNPM_VERSION=$(pnpm -v)
        success "pnpm already installed: $PNPM_VERSION"
        return 0
    fi
    
    log "Installing pnpm..."
    npm install -g pnpm || {
        error "Failed to install pnpm"
        exit 1
    }
    
    success "pnpm installed: $(pnpm -v)"
}

install_mysql() {
    log "Checking MySQL installation..."
    
    if check_command mysql; then
        MYSQL_VERSION=$(mysql --version)
        success "MySQL already installed: $MYSQL_VERSION"
        return 0
    fi
    
    log "Installing MySQL Server..."
    sudo apt-get update -qq
    sudo DEBIAN_FRONTEND=noninteractive apt-get install -y mysql-server || {
        error "Failed to install MySQL Server"
        exit 1
    }
    
    # Start MySQL service
    sudo systemctl start mysql || warning "Could not start MySQL service"
    sudo systemctl enable mysql || warning "Could not enable MySQL service"
    
    success "MySQL installed and started"
}

install_git() {
    log "Checking Git installation..."
    
    if check_command git; then
        GIT_VERSION=$(git --version)
        success "Git already installed: $GIT_VERSION"
        return 0
    fi
    
    log "Installing Git..."
    sudo apt-get update -qq
    sudo apt-get install -y git || {
        error "Failed to install Git"
        exit 1
    }
    
    success "Git installed: $(git --version)"
}

################################################################################
# Environment Configuration Functions
################################################################################

setup_env_file() {
    log "Setting up environment configuration..."
    
    ENV_FILE="${SCRIPT_DIR}/.env.local"
    
    if [ -f "$ENV_FILE" ]; then
        warning "Environment file already exists at $ENV_FILE"
        read -p "Do you want to reconfigure it? (y/n) " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            success "Using existing environment file"
            return 0
        fi
    fi
    
    log "Creating environment configuration..."
    
    # Generate secure random strings
    SESSION_SECRET=$(openssl rand -base64 32)
    JWT_SECRET=$(openssl rand -base64 32)
    
    # Prompt for database configuration
    read -p "Enter MySQL host (default: localhost): " DB_HOST
    DB_HOST=${DB_HOST:-localhost}
    
    read -p "Enter MySQL user (default: damien): " DB_USER
    DB_USER=${DB_USER:-damien}
    
    read -sp "Enter MySQL password (default: sheba): " DB_PASS
    DB_PASS=${DB_PASS:-sheba}
    echo
    
    read -p "Enter MySQL database name (default: monalisa): " DB_NAME
    DB_NAME=${DB_NAME:-monalisa}
    
    # Construct DATABASE_URL
    DATABASE_URL="mysql://${DB_USER}:${DB_PASS}@${DB_HOST}:3306/${DB_NAME}"
    
    # Create .env.local file
    cat > "$ENV_FILE" << EOF
# CloutScape Casino Environment Configuration
# Generated: $(date)

# Database Configuration
DATABASE_URL="${DATABASE_URL}"

# Authentication
SESSION_SECRET="${SESSION_SECRET}"
JWT_SECRET="${JWT_SECRET}"

# Application
NODE_ENV=development
PORT=3000
VITE_API_URL=http://localhost:3000

# Features
ENABLE_OSRS_INTEGRATION=true
ENABLE_CRYPTO_WALLET=true
ENABLE_LIVE_CHAT=true
ENABLE_RAIN_SYSTEM=true

# Security
CSRF_PROTECTION=true
RATE_LIMIT_ENABLED=true
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Logging
LOG_LEVEL=info
LOG_FILE=./logs/app.log
EOF
    
    success "Environment file created at $ENV_FILE"
}

setup_database() {
    log "Setting up MySQL database..."
    
    # Extract database credentials from .env.local
    if [ ! -f "${SCRIPT_DIR}/.env.local" ]; then
        warning "Environment file not found. Skipping database setup."
        return 1
    fi
    
    DB_URL=$(grep "^DATABASE_URL=" "${SCRIPT_DIR}/.env.local" | cut -d'=' -f2 | tr -d '"')
    
    # Parse MySQL connection string
    # Format: mysql://user:password@host:port/database
    DB_USER=$(echo "$DB_URL" | sed -E 's/mysql:\/\/([^:]+).*/\1/')
    DB_PASS=$(echo "$DB_URL" | sed -E 's/mysql:\/\/[^:]+:([^@]+).*/\1/')
    DB_HOST=$(echo "$DB_URL" | sed -E 's/.*@([^:]+).*/\1/')
    DB_NAME=$(echo "$DB_URL" | sed -E 's/.*\/([^\/]+)$/\1/')
    
    log "Creating database: $DB_NAME"
    
    # Create database
    mysql -h "$DB_HOST" -u "$DB_USER" -p"$DB_PASS" << EOF 2>/dev/null || {
        warning "Could not create database. It may already exist or credentials may be incorrect."
        return 1
    }
CREATE DATABASE IF NOT EXISTS $DB_NAME CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE $DB_NAME;
EOF
    
    success "Database created/verified: $DB_NAME"
}

################################################################################
# Dependency Installation Functions
################################################################################

install_dependencies() {
    log "Installing project dependencies..."
    
    cd "$SCRIPT_DIR" || exit 1
    
    if [ ! -f "package.json" ]; then
        error "package.json not found in $SCRIPT_DIR"
        exit 1
    fi
    
    log "Installing Node dependencies with pnpm..."
    pnpm install || {
        error "Failed to install dependencies"
        exit 1
    }
    
    success "Dependencies installed successfully"
}

################################################################################
# Database Migration Functions
################################################################################

run_migrations() {
    log "Running database migrations..."
    
    cd "$SCRIPT_DIR" || exit 1
    
    if ! check_command drizzle-kit; then
        warning "drizzle-kit not found. Skipping migrations."
        return 1
    fi
    
    log "Executing Drizzle migrations..."
    pnpm run db:push || {
        warning "Database migration encountered an issue. Please check manually."
        return 1
    }
    
    success "Database migrations completed"
}

################################################################################
# Feature Validation Functions
################################################################################

validate_node() {
    log "Validating Node.js environment..."
    
    if ! check_command node; then
        error "Node.js is not installed"
        return 1
    fi
    
    NODE_VERSION=$(node -v)
    success "Node.js validation passed: $NODE_VERSION"
}

validate_pnpm() {
    log "Validating pnpm..."
    
    if ! check_command pnpm; then
        error "pnpm is not installed"
        return 1
    fi
    
    PNPM_VERSION=$(pnpm -v)
    success "pnpm validation passed: $PNPM_VERSION"
}

validate_mysql() {
    log "Validating MySQL connection..."
    
    if ! check_command mysql; then
        warning "MySQL client not found"
        return 1
    fi
    
    if [ ! -f "${SCRIPT_DIR}/.env.local" ]; then
        warning "Environment file not found. Skipping MySQL validation."
        return 1
    fi
    
    DB_URL=$(grep "^DATABASE_URL=" "${SCRIPT_DIR}/.env.local" | cut -d'=' -f2 | tr -d '"')
    DB_USER=$(echo "$DB_URL" | sed -E 's/mysql:\/\/([^:]+).*/\1/')
    DB_PASS=$(echo "$DB_URL" | sed -E 's/mysql:\/\/[^:]+:([^@]+).*/\1/')
    DB_HOST=$(echo "$DB_URL" | sed -E 's/.*@([^:]+).*/\1/')
    DB_NAME=$(echo "$DB_URL" | sed -E 's/.*\/([^\/]+)$/\1/')
    
    if mysql -h "$DB_HOST" -u "$DB_USER" -p"$DB_PASS" -e "SELECT 1" "$DB_NAME" &>/dev/null; then
        success "MySQL connection validated"
        return 0
    else
        error "MySQL connection failed. Check credentials in .env.local"
        return 1
    fi
}

validate_git() {
    log "Validating Git configuration..."
    
    if ! check_command git; then
        error "Git is not installed"
        return 1
    fi
    
    # Check if git config is set
    if ! git config user.name &>/dev/null || ! git config user.email &>/dev/null; then
        warning "Git user configuration not set. Setting to Cloutscape-agent/worker"
        git config user.name "CloutScape Setup" || warning "Could not set git user name"
        git config user.email "setup@cloutscape.org" || warning "Could not set git user email"
    fi
    
    success "Git validation passed"
}

validate_project_structure() {
    log "Validating project structure..."
    
    REQUIRED_DIRS=(
        "client/src"
        "server"
        "drizzle"
    )
    
    for dir in "${REQUIRED_DIRS[@]}"; do
        if [ ! -d "${SCRIPT_DIR}/${dir}" ]; then
            error "Required directory missing: $dir"
            return 1
        fi
    done
    
    success "Project structure validation passed"
}

validate_features() {
    log "Validating casino features..."
    
    REQUIRED_FILES=(
        "client/src/pages/KenoGame.tsx"
        "client/src/pages/SlotsGame.tsx"
        "client/src/pages/BlackjackGame.tsx"
        "client/src/pages/LiveChat.tsx"
        "client/src/pages/RainSystem.tsx"
        "server/liveRouter.ts"
        "server/degensdenRouter.ts"
    )
    
    for file in "${REQUIRED_FILES[@]}"; do
        if [ ! -f "${SCRIPT_DIR}/${file}" ]; then
            error "Required feature file missing: $file"
            return 1
        fi
    done
    
    success "All casino features present"
}

################################################################################
# Build Functions
################################################################################

build_project() {
    log "Building project..."
    
    cd "$SCRIPT_DIR" || exit 1
    
    if ! check_command pnpm; then
        error "pnpm is required to build the project"
        return 1
    fi
    
    log "Building client and server..."
    pnpm run build || {
        error "Build failed"
        return 1
    }
    
    success "Project built successfully"
}

################################################################################
# Main Setup Workflow
################################################################################

main() {
    clear
    
    echo -e "${CYAN}"
    echo "╔════════════════════════════════════════════════════════════╗"
    echo "║                                                            ║"
    echo "║         🎰 CloutScape Casino - Environment Setup 🎰        ║"
    echo "║                                                            ║"
    echo "║              © CloutScape Development Team 2026           ║"
    echo "║                                                            ║"
    echo "╚════════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
    
    log "Starting CloutScape environment setup..."
    log "Project directory: $SCRIPT_DIR"
    log "Log file: $LOG_FILE"
    
    # System checks
    check_os
    check_sudo
    
    # Install required tools
    install_git
    install_node
    install_pnpm
    install_mysql
    
    # Environment setup
    setup_env_file
    setup_database
    
    # Install dependencies
    install_dependencies
    
    # Run migrations
    run_migrations
    
    # Validation
    info "Running comprehensive validation checks..."
    validate_node
    validate_pnpm
    validate_mysql
    validate_git
    validate_project_structure
    validate_features
    
    # Build
    info "Building project..."
    build_project
    
    # Summary
    echo -e "\n${GREEN}"
    echo "╔════════════════════════════════════════════════════════════╗"
    echo "║                                                            ║"
    echo "║              ✓ Setup Complete Successfully! ✓              ║"
    echo "║                                                            ║"
    echo "╚════════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
    
    echo -e "\n${CYAN}Next Steps:${NC}"
    echo "1. Review environment configuration: .env.local"
    echo "2. Start development server: pnpm run dev"
    echo "3. Access the application: http://localhost:3000"
    echo "4. Check logs: $LOG_FILE"
    
    success "Setup completed at $(date)"
}

# Run main function
main "$@"
