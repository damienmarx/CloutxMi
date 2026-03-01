#!/bin/bash

# CloutxMi Automated Deployment Script for cloutscape.org
# This script automates the entire deployment process via Cloudflare Tunnel
# Usage: ./deploy-cloutscape.sh

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
DOMAIN="cloutscape.org"
TUNNEL_NAME="cloutscape-prod"
PORT=8080
PROJECT_DIR="$(pwd)"

# Functions
print_header() {
    echo -e "${BLUE}========================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}========================================${NC}"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

print_step() {
    echo -e "${BLUE}→ $1${NC}"
}

# Main deployment flow
main() {
    print_header "CloutxMi Deployment for $DOMAIN"
    
    # Step 1: Check prerequisites
    print_step "Step 1: Checking prerequisites..."
    
    if ! command -v git &> /dev/null; then
        print_error "Git is not installed. Please install Git first."
        exit 1
    fi
    print_success "Git is installed"
    
    if ! command -v node &> /dev/null; then
        print_warning "Node.js not found. Installing..."
        curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
        sudo apt install -y nodejs
        print_success "Node.js installed"
    else
        print_success "Node.js is installed ($(node -v))"
    fi
    
    if ! command -v pnpm &> /dev/null; then
        print_warning "pnpm not found. Installing..."
        sudo npm install -g pnpm
        print_success "pnpm installed"
    else
        print_success "pnpm is installed ($(pnpm -v))"
    fi
    
    # Step 2: Install Cloudflared
    print_step "Step 2: Installing Cloudflared..."
    
    if ! command -v cloudflared &> /dev/null; then
        print_warning "cloudflared not found. Installing..."
        curl -L --output /tmp/cloudflared.tgz https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.tgz
        tar -xzf /tmp/cloudflared.tgz -C /tmp/
        sudo mv /tmp/cloudflared /usr/local/bin/
        sudo chmod +x /usr/local/bin/cloudflared
        rm /tmp/cloudflared.tgz
        print_success "cloudflared installed"
    else
        print_success "cloudflared is installed ($(cloudflared -v))"
    fi
    
    # Step 3: Install project dependencies
    print_step "Step 3: Installing project dependencies..."
    pnpm install
    print_success "Dependencies installed"
    
    # Step 4: Build the application
    print_step "Step 4: Building application..."
    pnpm build
    print_success "Application built"
    
    # Step 5: Check if tunnel credentials exist
    print_step "Step 5: Checking Cloudflare tunnel setup..."
    
    if [ ! -f ~/.cloudflared/${TUNNEL_NAME}.json ]; then
        print_warning "Tunnel credentials not found. You need to authenticate first."
        print_step "Running: cloudflared tunnel login"
        cloudflared tunnel login
        print_success "Authentication complete"
    else
        print_success "Tunnel credentials found"
    fi
    
    # Step 6: Create tunnel if it doesn't exist
    print_step "Step 6: Setting up tunnel..."
    
    TUNNEL_ID=$(cloudflared tunnel list --output json 2>/dev/null | grep -o "\"id\":\"[^\"]*\"" | grep -o "[^\"]*$" | head -1 || echo "")
    
    if [ -z "$TUNNEL_ID" ]; then
        print_warning "Tunnel '$TUNNEL_NAME' not found. Creating..."
        cloudflared tunnel create ${TUNNEL_NAME}
        TUNNEL_ID=$(cloudflared tunnel list --output json | grep -o "\"id\":\"[^\"]*\"" | grep -o "[^\"]*$" | head -1)
        print_success "Tunnel created with ID: $TUNNEL_ID"
    else
        print_success "Tunnel already exists"
    fi
    
    # Step 7: Create config file
    print_step "Step 7: Creating tunnel configuration..."
    
    mkdir -p ~/.cloudflared
    cat > ~/.cloudflared/config.yml << EOF
tunnel: ${TUNNEL_NAME}
credentials-file: ~/.cloudflared/${TUNNEL_NAME}.json

ingress:
  - hostname: ${DOMAIN}
    service: http://localhost:${PORT}
  - hostname: www.${DOMAIN}
    service: http://localhost:${PORT}
  - hostname: api.${DOMAIN}
    service: http://localhost:${PORT}
  - service: http_status:404
EOF
    print_success "Configuration file created"
    
    # Step 8: Route DNS
    print_step "Step 8: Routing DNS records..."
    
    cloudflared tunnel route dns ${TUNNEL_NAME} ${DOMAIN}
    cloudflared tunnel route dns ${TUNNEL_NAME} www.${DOMAIN}
    cloudflared tunnel route dns ${TUNNEL_NAME} api.${DOMAIN}
    print_success "DNS records configured"
    
    # Step 9: Create systemd services (optional)
    print_step "Step 9: Setting up systemd services (optional)..."
    
    read -p "Do you want to set up systemd services for auto-start? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        # Create app service
        sudo tee /etc/systemd/system/cloutscape-app.service > /dev/null << EOF
[Unit]
Description=CloutxMi Application
After=network.target

[Service]
Type=simple
User=$USER
WorkingDirectory=$PROJECT_DIR
ExecStart=/usr/bin/pnpm start
Restart=on-failure
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF
        
        sudo systemctl daemon-reload
        sudo systemctl enable cloutscape-app
        sudo systemctl start cloutscape-app
        print_success "Application service created and started"
        
        # Create tunnel service
        sudo cloudflared service install
        sudo systemctl enable cloudflared
        sudo systemctl start cloudflared
        print_success "Tunnel service created and started"
    fi
    
    # Final summary
    print_header "Deployment Complete!"
    print_success "Your site is now live on https://${DOMAIN}"
    echo ""
    print_step "Next steps:"
    echo "1. Open https://${DOMAIN} in your browser"
    echo "2. Check Cloudflare dashboard: https://dash.cloudflare.com"
    echo "3. Monitor logs:"
    echo "   - App logs: journalctl -u cloutscape-app -f"
    echo "   - Tunnel logs: journalctl -u cloudflared -f"
    echo ""
    print_warning "If you didn't set up systemd services:"
    echo "Run these commands in separate terminals:"
    echo "  Terminal 1: pnpm start"
    echo "  Terminal 2: cloudflared tunnel run ${TUNNEL_NAME}"
    echo ""
}

# Run main function
main "$@"
