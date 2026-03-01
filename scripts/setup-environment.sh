#!/bin/bash

################################################################################
# CloutScape Environment Setup Script
# Comprehensive setup for development and production environments
# Usage: ./scripts/setup-environment.sh [dev|prod|staging]
################################################################################

set -e

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
ENVIRONMENT=${1:-dev}

source "$(dirname "${BASH_SOURCE[0]}")/modular_config_loader.sh"
load_config "$ENVIRONMENT"
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
LOG_FILE="${PROJECT_ROOT}/logs/setup_${TIMESTAMP}.log"

################################################################################
# Utility Functions
################################################################################

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1" | tee -a "$LOG_FILE"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1" | tee -a "$LOG_FILE"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1" | tee -a "$LOG_FILE"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1" | tee -a "$LOG_FILE"
}

check_command() {
    if ! command -v "$1" &> /dev/null; then
        log_error "$1 is not installed. Please install it first."
        return 1
    fi
    log_success "$1 is installed"
    return 0
}

################################################################################
# Validation Functions
################################################################################

validate_environment() {
    if [[ ! "$ENVIRONMENT" =~ ^(dev|development|prod|production|staging)$ ]]; then
        log_error "Invalid environment: $ENVIRONMENT"
        log_info "Usage: ./scripts/setup-environment.sh [dev|prod|staging]"
        exit 1
    fi

    # Normalize environment names
    if [[ "$ENVIRONMENT" == "development" ]]; then
        ENVIRONMENT="dev"
    elif [[ "$ENVIRONMENT" == "production" ]]; then
        ENVIRONMENT="prod"
    fi

    log_info "Setting up environment: $ENVIRONMENT"
}

validate_prerequisites() {
    log_info "Validating prerequisites..."

    local missing_tools=()

    # Check required tools
    if ! check_command "node"; then
        missing_tools+=("Node.js")
    fi

    if ! check_command "npm"; then
        missing_tools+=("npm")
    fi

    if ! check_command "git"; then
        missing_tools+=("git")
    fi

    if [[ "$ENVIRONMENT" != "dev" ]]; then
        if ! check_command "docker"; then
            missing_tools+=("Docker")
        fi

        if ! check_command "docker-compose"; then
            missing_tools+=("Docker Compose")
        fi
    fi

    if [[ ${#missing_tools[@]} -gt 0 ]]; then
        log_error "Missing required tools: ${missing_tools[*]}"
        exit 1
    fi

    log_success "All prerequisites are installed"
}

################################################################################
# Directory Setup
################################################################################

setup_directories() {
    log_info "Setting up project directories..."

    local dirs=(
        "logs"
        "data"
        "backups"
        "uploads"
        "certificates"
        "config"
    )

    for dir in "${dirs[@]}"; do
        if [[ ! -d "$PROJECT_ROOT/$dir" ]]; then
            mkdir -p "$PROJECT_ROOT/$dir"
            log_success "Created directory: $dir"
        fi
    done

    # Set proper permissions
    chmod 755 "$PROJECT_ROOT/logs"
    chmod 755 "$PROJECT_ROOT/data"
    chmod 700 "$PROJECT_ROOT/certificates"
}

################################################################################
# Environment File Setup
################################################################################

setup_env_files() {
    log_info "Skipping .env file creation as modular config loader handles it."
    return 0

    log_info "Setting up environment files..."

    local env_file=""
    local env_example="$PROJECT_ROOT/.env.example"

    case $ENVIRONMENT in
        dev)
            env_file="$PROJECT_ROOT/.env.development"
            ;;
        prod)
            env_file="$PROJECT_ROOT/.env.production"
            ;;
        staging)
            env_file="$PROJECT_ROOT/.env.staging"
            ;;
    esac

    if [[ ! -f "$env_file" ]]; then
        if [[ -f "$env_example" ]]; then
            cp "$env_example" "$env_file"
            log_success "Created $env_file from .env.example"
            log_warning "Please update $env_file with your configuration"
        else
            log_error ".env.example not found"
            exit 1
        fi
    else
        log_info "$env_file already exists"
    fi

    # Set secure permissions
    chmod 600 "$env_file"
}

################################################################################
# Node Dependencies
################################################################################

setup_dependencies() {
    log_info "Installing Node.js dependencies..."

    cd "$PROJECT_ROOT"

    # Install root dependencies
    if [[ -f "package.json" ]]; then
        log_info "Installing root dependencies..."
        $NPM_CMD install
        log_success "Root dependencies installed"
    fi

    # Install client dependencies
    if [[ -f "client/package.json" ]]; then
        log_info "Installing client dependencies..."
        cd client
        $NPM_CMD install
        cd ..
        log_success "Client dependencies installed"
    fi

    # Install server dependencies (if using Node backend)
    if [[ -f "server/package.json" ]]; then
        log_info "Installing server dependencies..."
        cd server
        $NPM_CMD install
        cd ..
        log_success "Server dependencies installed"
    fi
}

################################################################################
# Database Setup
################################################################################

setup_database() {
    log_info "Setting up database..."

    case $ENVIRONMENT in
        dev)
            log_info "Development database setup (local MySQL/SQLite)"
            # Database setup would be handled by docker-compose in dev
            ;;
        prod|staging)
            log_warning "Production/Staging database setup requires manual configuration"
            log_info "Ensure DATABASE_URL is set in your environment file"
            log_info "Run database migrations with: $NPM_CMD run db:migrate"
            ;;
    esac
}

################################################################################
# SSL/TLS Certificate Setup
################################################################################

setup_certificates() {
    log_info "Setting up SSL/TLS certificates..."

    case $ENVIRONMENT in
        dev)
            log_info "Generating self-signed certificates for development..."
            if ! [[ -f "$PROJECT_ROOT/certificates/server.key" ]]; then
                openssl req -x509 -newkey rsa:4096 -keyout "$PROJECT_ROOT/certificates/server.key" \
                    -out "$PROJECT_ROOT/certificates/server.crt" -days 365 -nodes \
                    -subj "/C=US/ST=State/L=City/O=CloutScape/CN=localhost"
                log_success "Self-signed certificates generated"
            fi
            ;;
        prod|staging)
            log_warning "Production certificates should be managed by your hosting provider"
            log_info "Use Let's Encrypt or your certificate provider"
            ;;
    esac
}

################################################################################
# Docker Setup
################################################################################

setup_docker() {
    if [[ "$ENVIRONMENT" == "dev" ]]; then
        log_info "Setting up Docker for development..."

        if ! [[ -f "$PROJECT_ROOT/docker-compose.yml" ]]; then
            log_error "docker-compose.yml not found"
            return 1
        fi

        log_info "Starting Docker containers..."
        docker-compose up -d

        # Wait for services to be ready
        sleep 5

        log_success "Docker containers started"
    fi
}

################################################################################
# Build Setup
################################################################################

setup_build() {
    log_info "Setting up build configuration..."

    # Use pnpm for consistency with the project's package manager
    if command -v pnpm &> /dev/null; then
        NPM_CMD="pnpm"
    else
        NPM_CMD="npm"
    fi


    cd "$PROJECT_ROOT"

    case $ENVIRONMENT in
        dev)
            log_info "Development build setup"
            ;;
        prod|staging)
            log_info "Production build setup"
            if [[ -f "client/package.json" ]]; then
                log_info "Building client application..."
                cd client
                $NPM_CMD run build
                cd ..
                log_success "Client build completed"
            fi
            ;;
    esac
}

################################################################################
# Security Setup
################################################################################

setup_security() {
    log_info "Setting up security configurations..."

    # Generate JWT secret if not exists
    if ! grep -q "JWT_SECRET=" "$PROJECT_ROOT/.env.$ENVIRONMENT"; then
        log_warning "JWT_SECRET not configured, generating random secret..."
        JWT_SECRET=$(openssl rand -base64 32)
        echo "JWT_SECRET=$JWT_SECRET" >> "$PROJECT_ROOT/.env.$ENVIRONMENT"
        log_success "JWT_SECRET generated"
    fi

    # Generate encryption key if not exists
    if ! grep -q "ENCRYPTION_KEY=" "$PROJECT_ROOT/.env.$ENVIRONMENT"; then
        log_warning "ENCRYPTION_KEY not configured, generating random key..."
        ENCRYPTION_KEY=$(openssl rand -base64 32)
        echo "ENCRYPTION_KEY=$ENCRYPTION_KEY" >> "$PROJECT_ROOT/.env.$ENVIRONMENT"
        log_success "ENCRYPTION_KEY generated"
    fi

    # Generate session secret if not exists
    if ! grep -q "SESSION_SECRET=" "$PROJECT_ROOT/.env.$ENVIRONMENT"; then
        log_warning "SESSION_SECRET not configured, generating random secret..."
        SESSION_SECRET=$(openssl rand -base64 32)
        echo "SESSION_SECRET=$SESSION_SECRET" >> "$PROJECT_ROOT/.env.$ENVIRONMENT"
        log_success "SESSION_SECRET generated"
    fi

    log_success "Security configurations completed"
}

################################################################################
# Health Check
################################################################################

health_check() {
    log_info "Running health checks..."

    local checks_passed=0
    local checks_total=0

    # Check Node.js
    checks_total=$((checks_total + 1))
    if check_command "node"; then
        checks_passed=$((checks_passed + 1))
    fi

    # Check npm
    checks_total=$((checks_total + 1))
    if check_command "npm"; then
        checks_passed=$((checks_passed + 1))
    fi

    # Check environment file
    checks_total=$((checks_total + 1))
    if [[ -f "$PROJECT_ROOT/.env.$ENVIRONMENT" ]]; then
        log_success "Environment file exists"
        checks_passed=$((checks_passed + 1))
    else
        log_error "Environment file not found"
    fi

    # Check directories
    checks_total=$((checks_total + 1))
    if [[ -d "$PROJECT_ROOT/logs" ]]; then
        log_success "Logs directory exists"
        checks_passed=$((checks_passed + 1))
    fi

    log_info "Health check: $checks_passed/$checks_total passed"

    if [[ $checks_passed -eq $checks_total ]]; then
        return 0
    else
        return 1
    fi
}

################################################################################
# Summary
################################################################################

print_summary() {
    echo ""
    echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${BLUE}║          CloutScape Environment Setup Complete             ║${NC}"
    echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
    echo ""
    echo -e "${GREEN}Environment:${NC} $ENVIRONMENT"
    echo -e "${GREEN}Project Root:${NC} $PROJECT_ROOT"
    echo -e "${GREEN}Log File:${NC} $LOG_FILE"
    echo ""
    echo -e "${YELLOW}Next Steps:${NC}"
    echo "1. Review and update .env.$ENVIRONMENT with your configuration"
    echo "2. Start the development server: npm run dev"
    echo "3. For production: $NPM_CMD run build && npm run start"
    echo ""
    echo -e "${YELLOW}Documentation:${NC}"
    echo "- Setup Guide: $PROJECT_ROOT/SETUP_GUIDE.md"
    echo "- API Documentation: $PROJECT_ROOT/API_DOCUMENTATION.md"
    echo "- Production Guide: $PROJECT_ROOT/PRODUCTION_DEPLOYMENT_GUIDE.md"
    echo ""
}

################################################################################
# Main Execution
################################################################################

main() {
    echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${BLUE}║        CloutScape Environment Setup Script                 ║${NC}"
    echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
    echo ""

    # Create logs directory
    mkdir -p "${PROJECT_ROOT}/logs"

    validate_environment
    validate_prerequisites
    setup_directories
    setup_env_files
    setup_dependencies
    setup_certificates
    setup_security
    setup_docker
    setup_build
    setup_database

    if health_check; then
        log_success "All setup checks passed!"
        print_summary
        exit 0
    else
        log_error "Some setup checks failed. Please review the log file."
        print_summary
        exit 1
    fi
}

# Run main function
main "$@"
