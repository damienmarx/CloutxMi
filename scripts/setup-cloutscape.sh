#!/bin/bash

################################################################################
# CloutScape Complete Setup Script
# Comprehensive setup for development and production environments
# Usage: ./scripts/setup-cloutscape.sh [dev|prod|staging]
################################################################################

set -e

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Configuration
ENVIRONMENT=${1:-dev}
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
LOG_DIR="${PROJECT_ROOT}/logs"
LOG_FILE="${LOG_DIR}/setup_${TIMESTAMP}.log"

# Create logs directory
mkdir -p "$LOG_DIR"

################################################################################
# Utility Functions
################################################################################

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1" | tee -a "$LOG_FILE"
}

log_success() {
    echo -e "${GREEN}[✓ SUCCESS]${NC} $1" | tee -a "$LOG_FILE"
}

log_error() {
    echo -e "${RED}[✗ ERROR]${NC} $1" | tee -a "$LOG_FILE"
}

log_warning() {
    echo -e "${YELLOW}[⚠ WARNING]${NC} $1" | tee -a "$LOG_FILE"
}

log_section() {
    echo -e "\n${CYAN}════════════════════════════════════════════════════════════${NC}" | tee -a "$LOG_FILE"
    echo -e "${CYAN}$1${NC}" | tee -a "$LOG_FILE"
    echo -e "${CYAN}════════════════════════════════════════════════════════════${NC}\n" | tee -a "$LOG_FILE"
}

check_command() {
    if ! command -v "$1" &> /dev/null; then
        log_error "$1 is not installed"
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
        log_info "Usage: ./scripts/setup-cloutscape.sh [dev|prod|staging]"
        exit 1
    fi

    # Normalize environment names
    if [[ "$ENVIRONMENT" == "development" ]]; then
        ENVIRONMENT="dev"
    elif [[ "$ENVIRONMENT" == "production" ]]; then
        ENVIRONMENT="prod"
    fi

    log_success "Environment: $ENVIRONMENT"
}

validate_prerequisites() {
    log_section "Validating Prerequisites"

    local missing_tools=()

    # Check required tools
    if ! check_command "node"; then
        missing_tools+=("Node.js")
    fi

    if ! check_command "pnpm"; then
        if ! check_command "npm"; then
            missing_tools+=("pnpm or npm")
        fi
    fi

    if ! check_command "git"; then
        missing_tools+=("git")
    fi

    if [[ ${#missing_tools[@]} -gt 0 ]]; then
        log_error "Missing required tools: ${missing_tools[*]}"
        exit 1
    fi

    log_success "All prerequisites validated"
}

################################################################################
# Directory Setup
################################################################################

setup_directories() {
    log_section "Setting Up Directories"

    local dirs=(
        "logs"
        "data"
        "backups"
        "uploads"
        "certificates"
        "config"
        "plugins"
    )

    for dir in "${dirs[@]}"; do
        if [[ ! -d "$PROJECT_ROOT/$dir" ]]; then
            mkdir -p "$PROJECT_ROOT/$dir"
            log_success "Created directory: $dir"
        else
            log_info "Directory exists: $dir"
        fi
    done

    # Set proper permissions
    chmod 755 "$PROJECT_ROOT/logs"
    chmod 755 "$PROJECT_ROOT/data"
    chmod 700 "$PROJECT_ROOT/certificates"
    chmod 755 "$PROJECT_ROOT/uploads"
}

################################################################################
# Environment File Setup
################################################################################

setup_env_files() {
    log_section "Setting Up Environment Files"

    local env_file="$PROJECT_ROOT/.env.${ENVIRONMENT}"
    local env_example="$PROJECT_ROOT/.env.example"

    if [[ ! -f "$env_file" ]]; then
        if [[ -f "$env_example" ]]; then
            cp "$env_example" "$env_file"
            log_success "Created $env_file from .env.example"
            log_warning "Please update $env_file with your configuration"
        else
            log_warning ".env.example not found, creating default .env.$ENVIRONMENT"
            cat > "$env_file" << 'EOF'
# CloutScape Environment Configuration

# Application
NODE_ENV=development
APP_NAME=CloutScape
APP_PORT=3000
APP_HOST=0.0.0.0

# Database
DATABASE_URL=mysql://root:password@localhost:3306/cloutscape_db

# JWT
JWT_SECRET=your-secret-key-here

# Encryption
ENCRYPTION_KEY=your-encryption-key-here

# Payment Methods
STRIPE_SECRET_KEY=sk_test_
STRIPE_PUBLIC_KEY=pk_test_

# Crypto
CRYPTO_API_KEY=your-crypto-api-key

# Cloudflare
CLOUDFLARE_API_TOKEN=your-cloudflare-token
CLOUDFLARE_ZONE_ID=your-zone-id

# Redis (for sessions and caching)
REDIS_URL=redis://localhost:6379

# CORS
CORS_ORIGIN=http://localhost:5173

# Logging
LOG_LEVEL=info
EOF
            log_success "Created default .env.$ENVIRONMENT"
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
    log_section "Installing Dependencies"

    cd "$PROJECT_ROOT"

    # Detect package manager
    if command -v pnpm &> /dev/null; then
        PKG_MANAGER="pnpm"
    else
        PKG_MANAGER="npm"
    fi

    log_info "Using package manager: $PKG_MANAGER"

    # Install root dependencies
    if [[ -f "package.json" ]]; then
        log_info "Installing root dependencies..."
        $PKG_MANAGER install
        log_success "Root dependencies installed"
    fi
}

################################################################################
# Database Setup
################################################################################

setup_database() {
    log_section "Database Setup"

    case $ENVIRONMENT in
        dev)
            log_info "Development environment - using local database"
            log_info "Ensure MySQL is running on localhost:3306"
            log_info "Run migrations with: pnpm db:push"
            ;;
        prod|staging)
            log_warning "Production/Staging database requires manual configuration"
            log_info "Set DATABASE_URL in .env.$ENVIRONMENT"
            log_info "Run migrations with: pnpm db:push"
            ;;
    esac
}

################################################################################
# SSL/TLS Certificate Setup
################################################################################

setup_certificates() {
    log_section "SSL/TLS Certificate Setup"

    case $ENVIRONMENT in
        dev)
            log_info "Generating self-signed certificates for development..."
            if ! [[ -f "$PROJECT_ROOT/certificates/server.key" ]]; then
                openssl req -x509 -newkey rsa:4096 -keyout "$PROJECT_ROOT/certificates/server.key" \
                    -out "$PROJECT_ROOT/certificates/server.crt" -days 365 -nodes \
                    -subj "/C=US/ST=State/L=City/O=CloutScape/CN=localhost" 2>/dev/null
                log_success "Self-signed certificates generated"
            else
                log_info "Certificates already exist"
            fi
            ;;
        prod|staging)
            log_warning "Production certificates should be managed by your hosting provider"
            log_info "Use Let's Encrypt or your certificate provider"
            ;;
    esac
}

################################################################################
# Security Setup
################################################################################

setup_security() {
    log_section "Security Configuration"

    local env_file="$PROJECT_ROOT/.env.${ENVIRONMENT}"

    # Generate JWT secret if not exists
    if ! grep -q "JWT_SECRET=" "$env_file" || grep -q "JWT_SECRET=your-secret-key-here" "$env_file"; then
        log_warning "Generating JWT_SECRET..."
        JWT_SECRET=$(openssl rand -base64 32)
        sed -i "s|JWT_SECRET=.*|JWT_SECRET=$JWT_SECRET|" "$env_file"
        log_success "JWT_SECRET generated"
    fi

    # Generate encryption key if not exists
    if ! grep -q "ENCRYPTION_KEY=" "$env_file" || grep -q "ENCRYPTION_KEY=your-encryption-key-here" "$env_file"; then
        log_warning "Generating ENCRYPTION_KEY..."
        ENCRYPTION_KEY=$(openssl rand -base64 32)
        sed -i "s|ENCRYPTION_KEY=.*|ENCRYPTION_KEY=$ENCRYPTION_KEY|" "$env_file"
        log_success "ENCRYPTION_KEY generated"
    fi

    log_success "Security configuration completed"
}

################################################################################
# Build Setup
################################################################################

setup_build() {
    log_section "Build Configuration"

    cd "$PROJECT_ROOT"

    # Detect package manager
    if command -v pnpm &> /dev/null; then
        PKG_MANAGER="pnpm"
    else
        PKG_MANAGER="npm"
    fi

    case $ENVIRONMENT in
        dev)
            log_info "Development build setup"
            log_success "Ready for development with: $PKG_MANAGER dev"
            ;;
        prod|staging)
            log_info "Production build setup"
            log_info "Building application..."
            $PKG_MANAGER run build
            log_success "Production build completed"
            ;;
    esac
}

################################################################################
# Git Setup
################################################################################

setup_git() {
    log_section "Git Configuration"

    cd "$PROJECT_ROOT"

    if [[ -d ".git" ]]; then
        log_info "Git repository already initialized"
        
        # Configure git hooks
        if [[ ! -f ".git/hooks/pre-commit" ]]; then
            log_info "Setting up git hooks..."
            mkdir -p .git/hooks
            cat > .git/hooks/pre-commit << 'EOF'
#!/bin/bash
# Pre-commit hook for code quality checks
pnpm run check 2>/dev/null || true
EOF
            chmod +x .git/hooks/pre-commit
            log_success "Git hooks configured"
        fi
    else
        log_warning "Not a git repository"
    fi
}

################################################################################
# Final Verification
################################################################################

verify_setup() {
    log_section "Verifying Setup"

    local checks_passed=0
    local checks_total=0

    # Check Node.js
    checks_total=$((checks_total + 1))
    if check_command "node"; then
        checks_passed=$((checks_passed + 1))
    fi

    # Check package manager
    checks_total=$((checks_total + 1))
    if check_command "pnpm" || check_command "npm"; then
        checks_passed=$((checks_passed + 1))
    fi

    # Check directories
    checks_total=$((checks_total + 1))
    if [[ -d "$PROJECT_ROOT/logs" ]]; then
        log_success "Logs directory exists"
        checks_passed=$((checks_passed + 1))
    fi

    # Check environment file
    checks_total=$((checks_total + 1))
    if [[ -f "$PROJECT_ROOT/.env.${ENVIRONMENT}" ]]; then
        log_success "Environment file exists"
        checks_passed=$((checks_passed + 1))
    fi

    echo ""
    log_info "Setup verification: $checks_passed/$checks_total checks passed"

    if [[ $checks_passed -eq $checks_total ]]; then
        log_success "Setup completed successfully!"
    else
        log_warning "Some checks failed, please review above"
    fi
}

################################################################################
# Main Execution
################################################################################

main() {
    log_section "CloutScape Setup Script"
    log_info "Project Root: $PROJECT_ROOT"
    log_info "Environment: $ENVIRONMENT"
    log_info "Log File: $LOG_FILE"

    validate_environment
    validate_prerequisites
    setup_directories
    setup_env_files
    setup_dependencies
    setup_database
    setup_certificates
    setup_security
    setup_build
    setup_git
    verify_setup

    log_section "Setup Complete"
    echo -e "${GREEN}CloutScape is ready for $ENVIRONMENT environment!${NC}"
    echo ""
    echo "Next steps:"
    echo "  1. Update .env.$ENVIRONMENT with your configuration"
    echo "  2. Run database migrations: pnpm db:push"
    echo "  3. Start development server: pnpm dev"
    echo ""
}

# Run main function
main
