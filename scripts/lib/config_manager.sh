#!/bin/bash
# CloutScape Dynamic Config Manager
# Developed by your Personal CloutScape Agent

source "$(dirname "${BASH_SOURCE[0]}")/utils.sh"

# Load current .env into environment
load_env() {
    local env_file="${1:-.env}"
    if [ -f "$env_file" ]; then
        info "Loading configuration from $env_file"
        export $(grep -v '^#' "$env_file" | xargs)
    else
        warning "$env_file not found"
    fi
}

# Update or add a key-value pair in .env
set_env_var() {
    local key="$1"
    local value="$2"
    local env_file="${3:-.env}"
    
    if [ ! -f "$env_file" ]; then
        touch "$env_file"
    fi
    
    if grep -q "^$key=" "$env_file"; then
        sed -i "s|^$key=.*|$key=$value|" "$env_file"
    else
        echo "$key=$value" >> "$env_file"
    fi
    
    success "Config updated: $key"
}

# Generate a sophisticated database URL if not present
ensure_db_url() {
    if [ -z "$DATABASE_URL" ]; then
        info "Generating default Database URL..."
        local db_user="clout_user"
        local db_pass=$(openssl rand -hex 12)
        local db_name="cloutscape"
        
        set_env_var "DATABASE_URL" "mysql://$db_user:$db_pass@localhost:3306/$db_name"
    fi
}
