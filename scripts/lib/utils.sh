#!/bin/bash
# CloutScape Utility Library - Core Logging and Error Handling
# Developed by your Personal CloutScape Agent

# Colors for terminal output
NC='\033[0m'
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
MAGENTA='\033[0;35m'

# Logging configuration
LOG_FILE="${LOG_FILE:-/tmp/cloutscape_deploy.log}"

# Core logging functions
log() {
    local level="$1"
    local message="$2"
    local timestamp=$(date "+%Y-%m-%d %H:%M:%S")
    echo -e "[$timestamp] [$level] $message" >> "$LOG_FILE"
}

info() {
    log "INFO" "$1"
    echo -e "${BLUE}[INFO]${NC} $1"
}

success() {
    log "SUCCESS" "$1"
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

warning() {
    log "WARNING" "$1"
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

error() {
    log "ERROR" "$1"
    echo -e "${RED}[ERROR]${NC} $1" >&2
}

# Adaptive error handling with fallback support
# Usage: check_status $? "Operation failed" "Optional fallback command"
check_status() {
    local status=$1
    local message=$2
    local fallback=$3
    
    if [ $status -ne 0 ]; then
        error "$message (Exit code: $status)"
        if [ -n "$fallback" ]; then
            warning "Attempting fallback: $fallback"
            eval "$fallback"
            return $?
        fi
        return $status
    fi
    return 0
}

# Command existence check
check_command() {
    if ! command -v "$1" &> /dev/null; then
        return 1
    fi
    return 0
}

# WSL2 environment detection
is_wsl2() {
    if grep -qi "microsoft" /proc/version; then
        return 0
    fi
    return 1
}

# Cleanup handler
cleanup() {
    local exit_code=$?
    if [ $exit_code -ne 0 ]; then
        error "Script exited with error code $exit_code. Check $LOG_FILE for details."
    fi
    # Add custom cleanup logic here if needed
}

trap cleanup EXIT
