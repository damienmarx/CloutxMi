#!/bin/bash

# CloutScape Master Setup Script
# This script prepares the local environment and initiates the deployment process.

set -e

# Configuration
LOG_FILE="setup_$(date +%Y%m%d_%H%M%S).log"
MASTER_DEPLOY_SCRIPT="./scripts/master_deploy.sh"

# Logging function
log() {
    local level=$1
    local message=$2
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] [$level] $message" | tee -a "$LOG_FILE"
}

# Error handling
handle_error() {
    local exit_code=$?
    local last_command=$BASH_COMMAND
    log "ERROR" "Command '$last_command' failed with exit code $exit_code."
    echo "----------------------------------------------------------"
    echo "SETUP FAILED!"
    echo "Check logs at: $LOG_FILE"
    echo "Common fixes:"
    echo "1. Ensure pnpm is installed: npm install -g pnpm"
    echo "2. Check your internet connection"
    echo "3. Verify your GitHub token has the correct permissions"
    echo "----------------------------------------------------------"
    exit $exit_code
}

trap handle_error ERR

log "INFO" "Starting CloutScape Master Setup..."

# 1. Check for required tools
log "INFO" "Checking for required tools..."
for tool in node npm pnpm git; do
    if ! command -v $tool &> /dev/null; then
        log "ERROR" "$tool is not installed. Please install it and try again."
        exit 1
    fi
done

# 2. Environment Configuration
log "INFO" "Configuring environment..."
if [ ! -f ".env" ]; then
    if [ -f ".env.example" ]; then
        log "INFO" "Creating .env from .env.example..."
        cp .env.example .env
    else
        log "WARN" ".env.example not found. Creating a template .env..."
        cat << ENV_TEMPLATE > .env
NODE_ENV=production
PORT=3000
DATABASE_URL=mysql://clout_admin:CloutScape_Secure_2026!@localhost:3306/cloutscape_production
GITHUB_TOKEN=
UPCLOUD_API_TOKEN=
ENV_TEMPLATE
    fi
    log "INFO" "Please update the .env file with your actual credentials."
fi

# 3. Install dependencies
log "INFO" "Installing project dependencies..."
pnpm install 2>&1 | tee -a "$LOG_FILE"

# 4. Run build to verify
log "INFO" "Running build to verify project integrity..."
pnpm run build 2>&1 | tee -a "$LOG_FILE"

# 5. Make scripts executable
log "INFO" "Making deployment scripts executable..."
chmod +x scripts/*.sh

# 6. Final Instructions
log "SUCCESS" "Master setup completed successfully!"
echo "----------------------------------------------------------"
echo "READY FOR DEPLOYMENT"
echo "To start the deployment process, run:"
echo "  ./scripts/master_deploy.sh"
echo "----------------------------------------------------------"
