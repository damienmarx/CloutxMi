#!/bin/bash

echo "🚀 Setting up Cloudflare Tunnel for degensden.org..."
echo ""

# Create tunnel using API (without interactive login)
echo "Creating tunnel 'degensden-prod'..."

# Since we need to authenticate interactively, let's create a quick setup script
cat << 'TUNNELEOF' > /tmp/tunnel-setup.sh
#!/bin/bash

echo "══════════════════════════════════════════════════════════"
echo "  🔧 CLOUDFLARE TUNNEL SETUP FOR CLOUTSCAPE.ORG"
echo "══════════════════════════════════════════════════════════"
echo ""
echo "Please run these commands ONE BY ONE:"
echo ""
echo "1️⃣  Login to Cloudflare (opens browser):"
echo "    cloudflared tunnel login"
echo ""
echo "2️⃣  Create the tunnel:"
echo "    cloudflared tunnel create degensden-prod"
echo ""
echo "3️⃣  Route your domain:"
echo "    cloudflared tunnel route dns degensden-prod degensden.org"
echo "    cloudflared tunnel route dns degensden-prod www.degensden.org"
echo ""
echo "4️⃣  Start the tunnel:"
echo "    cloudflared tunnel --config /root/.cloudflared/config.yml run degensden-prod &"
echo ""
echo "5️⃣  Or install as a service:"
echo "    cloudflared service install"
echo "    systemctl start cloudflared"
echo "    systemctl enable cloudflared"
echo ""
echo "══════════════════════════════════════════════════════════"
echo "  After setup, your site will be live at:"
echo "  🌐 https://degensden.org"
echo "══════════════════════════════════════════════════════════"
TUNNELEOF

chmod +x /tmp/tunnel-setup.sh
/tmp/tunnel-setup.sh

# Alternative: Try to start tunnel directly if credentials exist
if [ -f /root/.cloudflared/*.json ]; then
    echo ""
    echo "Found existing credentials, starting tunnel..."
    cloudflared tunnel --config /root/.cloudflared/config.yml run degensden-prod &
    echo "✅ Tunnel started in background!"
    echo "🌐 Site should be accessible at https://degensden.org"
else
    echo ""
    echo "⚠️  No tunnel credentials found."
    echo "📝 Follow the instructions above to complete setup."
fi
