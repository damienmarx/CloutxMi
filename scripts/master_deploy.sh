#!/bin/bash

# CloutScape Master Deployment Script
# This script handles environment setup and deployment to UpCloud with Railway fallback.

set -e

# Configuration
LOG_FILE="deploy_$(date +%Y%m%d_%H%M%S).log"
UPCLOUD_SCRIPT="./scripts/deploy-upcloud.sh"
RAILWAY_CONFIG="railway.json"

# Logging function
log() {
    local level=$1
    local message=$2
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] [$level] $message" | tee -a "$LOG_FILE"
}

# Error handling function
handle_error() {
    local exit_code=$?
    local last_command=$BASH_COMMAND
    log "ERROR" "Command '$last_command' failed with exit code $exit_code."
    
    if [[ "$DEPLOY_STAGE" == "UPCLOUD" ]]; then
        log "INFO" "UpCloud deployment failed. Attempting Railway fallback..."
        deploy_railway
    else
        log "CRITICAL" "Deployment failed at $DEPLOY_STAGE. Please check $LOG_FILE for details."
        echo "----------------------------------------------------------"
        echo "STEPS TO FIX:"
        echo "1. Check if all environment variables are set in .env"
        echo "2. Verify your UpCloud API token is valid"
        echo "3. Ensure you have the Railway CLI installed and logged in"
        echo "4. Check the log file: $LOG_FILE"
        echo "----------------------------------------------------------"
        exit $exit_code
    fi
}

trap handle_error ERR

deploy_upcloud() {
    DEPLOY_STAGE="UPCLOUD"
    log "INFO" "Starting UpCloud deployment..."
    if [ -f "$UPCLOUD_SCRIPT" ]; then
        bash "$UPCLOUD_SCRIPT" 2>&1 | tee -a "$LOG_FILE"
    else
        log "ERROR" "UpCloud deployment script not found at $UPCLOUD_SCRIPT"
        return 1
    fi
}

deploy_railway() {
    DEPLOY_STAGE="RAILWAY"
    log "INFO" "Starting Railway fallback deployment..."
    
    if ! command -v railway &> /dev/null; then
        log "WARN" "Railway CLI not found. Attempting to install..."
        npm install -g @railway/cli 2>&1 | tee -a "$LOG_FILE"
    fi

    log "INFO" "Triggering Railway deployment..."
    railway up --detach 2>&1 | tee -a "$LOG_FILE"
    
    if [ $? -eq 0 ]; then
        log "SUCCESS" "Railway deployment initiated successfully."
    else
        log "ERROR" "Railway deployment failed."
        return 1
    fi
}

# Main execution
log "INFO" "Starting CloutScape Master Setup & Deployment"

# 1. Environment Setup
log "INFO" "Setting up environment..."
if [ ! -f ".env" ]; then
    log "WARN" ".env file not found. Creating from template..."
    if [ -f ".env.example" ]; then
        cp .env.example .env
    else
        touch .env
        log "INFO" "Created empty .env file. Please fill in required variables."
    fi
fi

# 2. Install Dependencies
log "INFO" "Installing dependencies..."
pnpm install 2>&1 | tee -a "$LOG_FILE"

# 3. Build Project
log "INFO" "Building project..."
pnpm run build 2>&1 | tee -a "$LOG_FILE"

# 4. Primary Deployment (UpCloud)
deploy_upcloud

log "SUCCESS" "CloutScape deployment process completed."
