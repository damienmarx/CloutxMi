#!/bin/bash
# CloutScape Auto-Git Workflow
# Developed by your Personal CloutScape Agent

source "$(dirname "${BASH_SOURCE[0]}")/lib/utils.sh"

ACTION="${1:-update}"
PROJECT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"

cd "$PROJECT_ROOT"

case "$ACTION" in
    "update")
        info "Checking for updates from remote repository..."
        git fetch origin >> "$LOG_FILE" 2>&1
        
        LOCAL=$(git rev-parse HEAD)
        REMOTE=$(git rev-parse @{u})
        
        if [ "$LOCAL" != "$REMOTE" ]; then
            info "New updates found. Pulling changes..."
            git pull origin main >> "$LOG_FILE" 2>&1
            check_status $? "Git pull failed"
            
            info "Re-installing dependencies and rebuilding..."
            pnpm install >> "$LOG_FILE" 2>&1
            pnpm run build >> "$LOG_FILE" 2>&1
            
            info "Restarting backend..."
            pm2 restart cloutscape-backend >> "$LOG_FILE" 2>&1
            success "CloutScape updated to latest version!"
        else
            success "CloutScape is already up to date."
        fi
        ;;
    "commit")
        MESSAGE="${2:-Auto-update from CloutScape Agent}"
        info "Staging and committing changes..."
        git add . >> "$LOG_FILE" 2>&1
        git commit -m "$MESSAGE" >> "$LOG_FILE" 2>&1
        git push origin main >> "$LOG_FILE" 2>&1
        check_status $? "Git push failed"
        success "Changes pushed to remote."
        ;;
    *)
        error "Unknown action: $ACTION. Use 'update' or 'commit'."
        exit 1
        ;;
esac
