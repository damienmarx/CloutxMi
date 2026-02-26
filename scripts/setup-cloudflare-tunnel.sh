#!/bin/bash

# Automated Cloudflare Tunnel Setup Script for CloutScape
# This script automates the installation of cloudflared, tunnel creation, 
# DNS setup, and service management for production deployment.

set -e

# Configuration
TUNNEL_NAME="cloutscape-tunnel"
CONFIG_DIR="/etc/cloudflared"
CONFIG_FILE="${CONFIG_DIR}/config.yml"
CREDENTIALS_FILE="${CONFIG_DIR}/${TUNNEL_NAME}.json"
LOG_FILE="/var/log/cloudflare-tunnel-setup.log"

# Domains to be tunneled (must match ingress rules in config.yml)
DOMAINS=("cloutscape.org" "www.cloutscape.org" "api.cloutscape.org" "ws.cloutscape.org")

# Logging function
log() {
    local level=$1
    local message=$2
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] [$level] $message" | tee -a "$LOG_FILE"
}

handle_error() {
    local exit_code=$?
    local last_command=$BASH_COMMAND
    log "ERROR" "Command \'$last_command\' failed with exit code $exit_code."
    log "CRITICAL" "Cloudflare Tunnel setup failed. Please check $LOG_FILE for details."
    echo "----------------------------------------------------------"
    echo "CLOUDFLARE TUNNEL SETUP FAILED!"
    echo "Please review the log file: $LOG_FILE for error details."
    echo "Ensure you have a Cloudflare account and the domain is active."
    echo "----------------------------------------------------------"
    exit $exit_code
}

trap handle_error ERR

log "INFO" "Starting Cloudflare Tunnel setup for CloutScape..."

# 1. Install cloudflared
log "INFO" "Checking for cloudflared installation..."
if ! command -v cloudflared &> /dev/null; then
    log "INFO" "cloudflared not found. Installing..."
    sudo apt update
    sudo apt install -y lsb-release
    curl -L --output /tmp/cloudflared.deb https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb
    sudo dpkg -i /tmp/cloudflared.deb
    rm /tmp/cloudflared.deb
    log "INFO" "cloudflared installed successfully."
else
    log "INFO" "cloudflared is already installed."
fi

# 2. Authenticate cloudflared
log "INFO" "Authenticating cloudflared with your Cloudflare account..."
log "INFO" "This step requires manual intervention. A browser window will open."
log "INFO" "Please follow the instructions to log in and select your domain."

# Create config directory if it doesn't exist
sudo mkdir -p "${CONFIG_DIR}"

# Run authentication and store credentials in the specified path
# cloudflared will automatically open a browser for authentication
if [ ! -f "${CREDENTIALS_FILE}" ]; then
    log "INFO" "Running cloudflared tunnel login. Please follow browser instructions."
    cloudflared tunnel login --credentials-file "${CREDENTIALS_FILE}"
    log "INFO" "cloudflared authenticated. Credentials saved to ${CREDENTIALS_FILE}"
else
    log "INFO" "cloudflared already authenticated. Credentials found at ${CREDENTIALS_FILE}"
fi

# 3. Create a Tunnel (if it doesn't exist)
log "INFO" "Creating Cloudflare Tunnel '${TUNNEL_NAME}'..."
# Check if tunnel already exists
TUNNEL_ID=$(cloudflared tunnel list --json | jq -r ".[] | select(.name==\"${TUNNEL_NAME}\") | .id")

if [ -z "$TUNNEL_ID" ]; then
    log "INFO" "Tunnel '${TUNNEL_NAME}' does not exist. Creating..."
    # Create the tunnel and capture its ID
    TUNNEL_CREATE_OUTPUT=$(cloudflared tunnel create "${TUNNEL_NAME}" --credentials-file "${CREDENTIALS_FILE}")
    TUNNEL_ID=$(echo "$TUNNEL_CREATE_OUTPUT" | grep -oE '[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}')
    if [ -z "$TUNNEL_ID" ]; then
        log "ERROR" "Failed to extract Tunnel ID from creation output."
        exit 1
    fi
    log "INFO" "Tunnel '${TUNNEL_NAME}' created with ID: ${TUNNEL_ID}"
else
    log "INFO" "Tunnel '${TUNNEL_NAME}' already exists with ID: ${TUNNEL_ID}"
fi

# 4. Configure Tunnel DNS records
log "INFO" "Configuring DNS records for the tunnel..."
for domain in "${DOMAINS[@]}"; do
    log "INFO" "Creating DNS record for ${domain} pointing to tunnel ${TUNNEL_ID}..."
    # cloudflared tunnel route dns <UUID> <hostname>
    cloudflared tunnel route dns "${TUNNEL_ID}" "${domain}" --credentials-file "${CREDENTIALS_FILE}"
    log "INFO" "DNS record for ${domain} configured."
done

# 5. Create/Update Tunnel Configuration File
log "INFO" "Creating/Updating tunnel configuration file: ${CONFIG_FILE}"
# The content of this file should match the cloudflare-tunnel.yml created previously
# Copy the existing cloudflare-tunnel.yml to the cloudflared config directory
sudo cp /home/ubuntu/CloutScape/config/cloudflare-tunnel.yml "${CONFIG_FILE}"
log "INFO" "Tunnel configuration file updated."

# 6. Run the Tunnel as a service
log "INFO" "Installing and running Cloudflare Tunnel as a systemd service..."
# cloudflared will automatically generate a systemd service file
sudo cloudflared --config "${CONFIG_FILE}" --credentials-file "${CREDENTIALS_FILE}" service install
sudo systemctl enable cloudflared
sudo systemctl start cloudflared
sudo systemctl status cloudflared --no-pager
log "INFO" "Cloudflare Tunnel service installed and started."

log "SUCCESS" "Cloudflare Tunnel setup completed successfully!"
echo "----------------------------------------------------------"
echo "Cloudflare Tunnel is now running."
echo "Please verify your Cloudflare dashboard for DNS records and tunnel status."
echo "----------------------------------------------------------"
