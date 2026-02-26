#!/bin/bash
# CloutScape Installer Module - Dependency Management
# Developed by your Personal CloutScape Agent

source "$(dirname "${BASH_SOURCE[0]}")/utils.sh"

install_base_deps() {
    info "Updating system and installing base dependencies..."
    sudo apt-get update -y >> "$LOG_FILE" 2>&1
    sudo apt-get install -y curl git build-essential wget jq >> "$LOG_FILE" 2>&1
    check_status $? "Failed to install base dependencies"
}

install_node_pnpm() {
    info "Checking for Node.js and pnpm..."
    
    if ! check_command node || [[ $(node -v) != v20* ]]; then
        info "Installing Node.js 20..."
        curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash - >> "$LOG_FILE" 2>&1
        sudo apt-get install -y nodejs >> "$LOG_FILE" 2>&1
        check_status $? "Node.js installation failed"
    else
        success "Node.js $(node -v) already installed"
    fi

    if ! check_command pnpm; then
        info "Installing pnpm..."
        sudo npm install -g pnpm >> "$LOG_FILE" 2>&1
        check_status $? "pnpm installation failed"
    else
        success "pnpm $(pnpm -v) already installed"
    fi
}

install_mysql() {
    info "Ensuring MySQL is available..."
    if ! check_command mysql; then
        info "Installing MySQL Server..."
        sudo apt-get install -y mysql-server >> "$LOG_FILE" 2>&1
        check_status $? "MySQL installation failed"
    fi
    
    # WSL2 specific: MySQL often doesn't start automatically
    if is_wsl2; then
        info "Detected WSL2, ensuring MySQL service is running..."
        sudo service mysql start >> "$LOG_FILE" 2>&1
    fi
}

install_cloudflared() {
    info "Checking for cloudflared..."
    if ! check_command cloudflared; then
        info "Installing cloudflared..."
        curl -L --output cloudflared.deb https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb >> "$LOG_FILE" 2>&1
        sudo dpkg -i cloudflared.deb >> "$LOG_FILE" 2>&1
        rm cloudflared.deb
        check_status $? "cloudflared installation failed"
    else
        success "cloudflared already installed"
    fi
}

install_pm2() {
    if ! check_command pm2; then
        info "Installing PM2..."
        sudo npm install -g pm2 >> "$LOG_FILE" 2>&1
        check_status $? "PM2 installation failed"
    else
        success "PM2 already installed"
    fi
}
