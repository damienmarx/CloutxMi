#!/bin/bash
# Quick Cloudflare Tunnel Setup for CloutScape

echo "🔧 Setting up Cloudflare Tunnel for cloutscape.org..."

# Set environment
export CLOUDFLARE_API_KEY=i6w_cGOpC_N5_9rogXvbbtgsd4uwFVPvCGKGhatR
export CLOUDFLARE_EMAIL=damienbmk@gmail.com

# Create tunnel config directory
mkdir -p /root/.cloudflared

# Create a simple tunnel credentials file
cat > /root/.cloudflared/cloutscape-tunnel.json << 'EOF'
{
  "AccountTag": "placeholder",
  "TunnelSecret": "placeholder",
  "TunnelID": "cloutscape-prod"
}
EOF

# Copy config
cp /app/cloudflared-config.yml /root/.cloudflared/config.yml

# Try to login and create tunnel
echo "Please run these commands manually:"
echo ""
echo "1. Login to Cloudflare:"
echo "   cloudflared tunnel login"
echo ""
echo "2. Create tunnel:"
echo "   cloudflared tunnel create cloutscape-prod"
echo ""
echo "3. Route DNS:"
echo "   cloudflared tunnel route dns cloutscape-prod cloutscape.org"
echo "   cloudflared tunnel route dns cloutscape-prod www.cloutscape.org"
echo ""
echo "4. Run tunnel:"
echo "   cloudflared tunnel --config /app/cloudflared-config.yml run cloutscape-prod"
echo ""
