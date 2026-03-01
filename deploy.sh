#!/bin/bash

# CloutxMi Automated One-Click Installer & Cloudflare Tunnel Deployment
# Target: 4c219319-4b84-4944-879c-3ed87f5ba925.cfargotunnel.com

set -e

# Configuration
PROJECT_DIR="$(pwd)"
TUNNEL_TOKEN="4c219319-4b84-4944-879c-3ed87f5ba925" # Extracted from the provided info
PORT=8080

echo "----------------------------------------------------------"
echo "Starting CloutxMi Automated Deployment..."
echo "----------------------------------------------------------"

# 1. Install Dependencies
echo "[1/5] Installing system dependencies..."
sudo apt update && sudo apt install -y curl jq git

# 2. Install Node.js & pnpm (if not present)
echo "[2/5] Checking Node.js and pnpm..."
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt install -y nodejs
fi

if ! command -v pnpm &> /dev/null; then
    sudo npm install -g pnpm
fi

# 3. Install Project Dependencies & Build
echo "[3/5] Installing project dependencies and building..."
pnpm install
pnpm build

# 4. Setup Cloudflare Tunnel
echo "[4/5] Setting up Cloudflare Tunnel..."
if ! command -v cloudflared &> /dev/null; then
    curl -L --output /tmp/cloudflared.deb https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb
    sudo dpkg -i /tmp/cloudflared.deb
    rm /tmp/cloudflared.deb
fi

# 5. Start the Application & Tunnel
echo "[5/5] Starting application and tunnel..."

# Create a simple background process for the app
echo "Starting server in background..."
nohup pnpm start > server.log 2>&1 &

# Start the tunnel using the token provided
echo "Starting Cloudflare Tunnel..."
nohup cloudflared tunnel run --token "$TUNNEL_TOKEN" > tunnel.log 2>&1 &

echo "----------------------------------------------------------"
echo "DEPLOYMENT SUCCESSFUL!"
echo "Your website should be live at: 4c219319-4b84-4944-879c-3ed87f5ba925.cfargotunnel.com"
echo "Check server.log and tunnel.log for any issues."
echo "----------------------------------------------------------"
