#!/bin/bash
# CloutScape Cloudflare Module - Tunnel Management
# Developed by your Personal CloutScape Agent

source "$(dirname "${BASH_SOURCE[0]}")/utils.sh"

setup_tunnel() {
    local tunnel_name="${1:-cloutscape-tunnel}"
    info "Setting up Cloudflare Tunnel: $tunnel_name"
    
    if [ ! -f ~/.cloudflared/cert.pem ]; then
        warning "Cloudflare authentication required."
        echo "Please follow the link in your browser to authorize:"
        cloudflared tunnel login
    fi
    
    # Check if tunnel already exists
    if ! cloudflared tunnel list | grep -q "$tunnel_name"; then
        info "Creating new tunnel: $tunnel_name"
        cloudflared tunnel create "$tunnel_name" >> "$LOG_FILE" 2>&1
        check_status $? "Failed to create tunnel"
    else
        success "Tunnel $tunnel_name already exists"
    fi
}

configure_tunnel() {
    local tunnel_name="${1:-cloutscape-tunnel}"
    local domain="$2"
    local local_port="${3:-3000}"
    
    if [ -z "$domain" ]; then
        error "Domain name is required for tunnel configuration"
        return 1
    fi
    
    local tunnel_id=$(cloudflared tunnel list | grep "$tunnel_name" | awk '{print $1}')
    
    info "Configuring tunnel $tunnel_name ($tunnel_id) for $domain -> localhost:$local_port"
    
    mkdir -p ~/.cloudflared
    cat > ~/.cloudflared/config.yml <<EOF
tunnel: $tunnel_id
credentials-file: /home/$(whoami)/.cloudflared/$tunnel_id.json

ingress:
  - hostname: $domain
    service: http://localhost:$local_port
  - service: http_status:404
EOF

    info "Routing domain $domain to tunnel..."
    cloudflared tunnel route dns "$tunnel_name" "$domain" >> "$LOG_FILE" 2>&1
    check_status $? "Failed to route DNS"
}

run_tunnel() {
    local tunnel_name="${1:-cloutscape-tunnel}"
    info "Starting Cloudflare Tunnel in background via PM2..."
    
    pm2 delete "cloudflare-tunnel" >> "$LOG_FILE" 2>&1
    pm2 start "cloudflared tunnel run $tunnel_name" --name "cloudflare-tunnel" >> "$LOG_FILE" 2>&1
    check_status $? "Failed to start tunnel via PM2"
}
