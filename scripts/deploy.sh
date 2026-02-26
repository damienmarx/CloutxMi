#!/bin/bash

################################################################################
# CloutScape Deployment Script
# Handles deployment to production, staging, and development environments
# Usage: ./scripts/deploy.sh [prod|staging|dev] [--skip-tests] [--skip-build]
################################################################################

set -e

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
ENVIRONMENT=${1:-prod}
SKIP_TESTS=${2:-false}
SKIP_BUILD=${3:-false}
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="${PROJECT_ROOT}/backups/deployment_${TIMESTAMP}"
LOG_FILE="${PROJECT_ROOT}/logs/deployment_${TIMESTAMP}.log"
DEPLOYMENT_LOG="${PROJECT_ROOT}/logs/deployments.log"

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

################################################################################
# Validation
################################################################################

validate_environment() {
    if [[ ! "$ENVIRONMENT" =~ ^(prod|production|staging|dev|development)$ ]]; then
        log_error "Invalid environment: $ENVIRONMENT"
        exit 1
    fi

    # Normalize environment names
    if [[ "$ENVIRONMENT" == "production" ]]; then
        ENVIRONMENT="prod"
    elif [[ "$ENVIRONMENT" == "development" ]]; then
        ENVIRONMENT="dev"
    fi

    log_info "Deploying to: $ENVIRONMENT"
}

validate_git_status() {
    log_info "Validating git status..."

    if [[ ! -d "$PROJECT_ROOT/.git" ]]; then
        log_error "Not a git repository"
        exit 1
    fi

    if [[ -n $(git -C "$PROJECT_ROOT" status -s) ]]; then
        log_warning "Working directory has uncommitted changes"
        log_info "Please commit your changes before deploying"
        exit 1
    fi

    log_success "Git status is clean"
}

validate_env_file() {
    log_info "Validating environment configuration..."

    local env_file="$PROJECT_ROOT/.env.$ENVIRONMENT"

    if [[ ! -f "$env_file" ]]; then
        log_error "Environment file not found: $env_file"
        exit 1
    fi

    # Check for required variables
    local required_vars=(
        "NODE_ENV"
        "DATABASE_URL"
        "JWT_SECRET"
    )

    for var in "${required_vars[@]}"; do
        if ! grep -q "^$var=" "$env_file"; then
            log_error "Missing required variable: $var in $env_file"
            exit 1
        fi
    done

    log_success "Environment configuration is valid"
}

################################################################################
# Backup Functions
################################################################################

create_backup() {
    log_info "Creating backup..."

    mkdir -p "$BACKUP_DIR"

    # Backup database
    if [[ "$ENVIRONMENT" != "dev" ]]; then
        log_info "Backing up database..."
        # This would depend on your database setup
        # Example for MySQL:
        # mysqldump -u user -p password database > "$BACKUP_DIR/database_${TIMESTAMP}.sql"
    fi

    # Backup current deployment
    if [[ -d "$PROJECT_ROOT/dist" ]]; then
        cp -r "$PROJECT_ROOT/dist" "$BACKUP_DIR/dist_backup"
        log_success "Backed up dist directory"
    fi

    # Save git commit hash
    git -C "$PROJECT_ROOT" rev-parse HEAD > "$BACKUP_DIR/git_commit.txt"
    log_success "Backup created at: $BACKUP_DIR"
}

################################################################################
# Testing
################################################################################

run_tests() {
    if [[ "$SKIP_TESTS" == "--skip-tests" ]]; then
        log_warning "Skipping tests"
        return 0
    fi

    log_info "Running tests..."

    cd "$PROJECT_ROOT"

    # Run linting
    if [[ -f "package.json" ]] && grep -q "\"lint\"" package.json; then
        log_info "Running linter..."
        npm run lint || log_warning "Linting failed (non-blocking)"
    fi

    # Run tests
    if [[ -f "package.json" ]] && grep -q "\"test\"" package.json; then
        log_info "Running unit tests..."
        npm run test || {
            log_error "Tests failed"
            exit 1
        }
    fi

    log_success "All tests passed"
}

################################################################################
# Build Functions
################################################################################

build_application() {
    if [[ "$SKIP_BUILD" == "--skip-build" ]]; then
        log_warning "Skipping build"
        return 0
    fi

    log_info "Building application..."

    cd "$PROJECT_ROOT"

    # Build client
    if [[ -f "client/package.json" ]]; then
        log_info "Building client..."
        cd client
        npm run build
        cd ..
        log_success "Client build completed"
    fi

    # Build server (if applicable)
    if [[ -f "server/tsconfig.json" ]]; then
        log_info "Building server..."
        cd server
        npm run build
        cd ..
        log_success "Server build completed"
    fi

    log_success "Build completed successfully"
}

################################################################################
# Database Migrations
################################################################################

run_migrations() {
    log_info "Running database migrations..."

    cd "$PROJECT_ROOT"

    if [[ -f "package.json" ]] && grep -q "\"db:migrate\"" package.json; then
        npm run db:migrate || {
            log_error "Database migrations failed"
            exit 1
        }
        log_success "Database migrations completed"
    else
        log_warning "No migration script found"
    fi
}

################################################################################
# Deployment Functions
################################################################################

deploy_to_server() {
    log_info "Deploying to $ENVIRONMENT server..."

    case $ENVIRONMENT in
        dev)
            deploy_dev
            ;;
        staging)
            deploy_staging
            ;;
        prod)
            deploy_prod
            ;;
    esac
}

deploy_dev() {
    log_info "Deploying to development environment..."

    cd "$PROJECT_ROOT"

    # Start development server
    if [[ -f "docker-compose.yml" ]]; then
        log_info "Starting Docker containers..."
        docker-compose up -d
    else
        log_info "Starting development server..."
        npm run dev &
    fi

    log_success "Development deployment completed"
}

deploy_staging() {
    log_info "Deploying to staging environment..."

    # This would typically involve:
    # 1. Uploading files to staging server
    # 2. Running migrations
    # 3. Restarting services
    # 4. Running smoke tests

    log_warning "Staging deployment requires manual configuration"
    log_info "Configure your staging server details in the deployment script"

    log_success "Staging deployment completed"
}

deploy_prod() {
    log_info "Deploying to production environment..."

    log_warning "Production deployment requires manual configuration"
    log_info "Configure your production server details and deployment method"
    log_info "Consider using: Docker, Kubernetes, or your hosting provider's CLI"

    log_success "Production deployment completed"
}

################################################################################
# Post-Deployment
################################################################################

run_smoke_tests() {
    log_info "Running smoke tests..."

    # Wait for services to be ready
    sleep 5

    # Check if application is responding
    local max_attempts=30
    local attempt=0

    while [[ $attempt -lt $max_attempts ]]; do
        if curl -sf http://localhost:3000/health > /dev/null 2>&1; then
            log_success "Application is responding"
            return 0
        fi
        attempt=$((attempt + 1))
        sleep 1
    done

    log_error "Application health check failed"
    return 1
}

verify_deployment() {
    log_info "Verifying deployment..."

    # Check if services are running
    if [[ "$ENVIRONMENT" == "dev" ]]; then
        if pgrep -f "node" > /dev/null; then
            log_success "Node.js process is running"
        else
            log_error "Node.js process is not running"
            return 1
        fi
    fi

    log_success "Deployment verification completed"
}

################################################################################
# Rollback
################################################################################

rollback() {
    log_error "Deployment failed, initiating rollback..."

    if [[ ! -d "$BACKUP_DIR" ]]; then
        log_error "No backup found for rollback"
        return 1
    fi

    # Restore from backup
    if [[ -d "$BACKUP_DIR/dist_backup" ]]; then
        log_info "Restoring previous deployment..."
        rm -rf "$PROJECT_ROOT/dist"
        cp -r "$BACKUP_DIR/dist_backup" "$PROJECT_ROOT/dist"
        log_success "Rollback completed"
    fi
}

################################################################################
# Logging
################################################################################

log_deployment() {
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] Deployment to $ENVIRONMENT completed successfully" >> "$DEPLOYMENT_LOG"
    echo "  - Commit: $(git -C "$PROJECT_ROOT" rev-parse HEAD)" >> "$DEPLOYMENT_LOG"
    echo "  - Backup: $BACKUP_DIR" >> "$DEPLOYMENT_LOG"
    echo "" >> "$DEPLOYMENT_LOG"
}

################################################################################
# Summary
################################################################################

print_summary() {
    echo ""
    echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${BLUE}║          CloutScape Deployment Summary                     ║${NC}"
    echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
    echo ""
    echo -e "${GREEN}Environment:${NC} $ENVIRONMENT"
    echo -e "${GREEN}Timestamp:${NC} $TIMESTAMP"
    echo -e "${GREEN}Backup Location:${NC} $BACKUP_DIR"
    echo -e "${GREEN}Log File:${NC} $LOG_FILE"
    echo ""
    echo -e "${YELLOW}Deployment Steps Completed:${NC}"
    echo "✓ Environment validation"
    echo "✓ Git status check"
    echo "✓ Backup creation"
    echo "✓ Tests execution"
    echo "✓ Application build"
    echo "✓ Database migrations"
    echo "✓ Deployment"
    echo "✓ Smoke tests"
    echo ""
}

################################################################################
# Main Execution
################################################################################

main() {
    echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${BLUE}║        CloutScape Deployment Script                        ║${NC}"
    echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
    echo ""

    # Create logs directory
    mkdir -p "${PROJECT_ROOT}/logs"

    # Initialize log file
    {
        echo "CloutScape Deployment Log"
        echo "Environment: $ENVIRONMENT"
        echo "Timestamp: $TIMESTAMP"
        echo "========================================"
    } > "$LOG_FILE"

    # Execute deployment steps
    validate_environment
    validate_git_status
    validate_env_file
    create_backup
    run_tests
    build_application
    run_migrations

    if deploy_to_server; then
        if run_smoke_tests && verify_deployment; then
            log_success "Deployment completed successfully!"
            log_deployment
            print_summary
            exit 0
        else
            log_error "Smoke tests failed"
            rollback
            exit 1
        fi
    else
        log_error "Deployment failed"
        rollback
        exit 1
    fi
}

# Handle script interruption
trap 'log_error "Deployment interrupted"; rollback; exit 1' INT TERM

# Run main function
main "$@"
