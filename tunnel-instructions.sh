#!/bin/bash

cat << 'EOF'

╔═══════════════════════════════════════════════════════════════╗
║                                                               ║
║     ⚠️  CLOUDFLARE TUNNEL SETUP REQUIRED ⚠️                  ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝

Your Degens¤Den casino is running on port 8080 but needs Cloudflare
Tunnel to be accessible at cloutscape.org

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📋 OPTION 1: Quick Setup (5 minutes)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Run these commands in your terminal:

1. Login to Cloudflare (opens browser):
   cloudflared tunnel login

2. Create tunnel:
   cloudflared tunnel create cloutscape-prod

3. Route DNS:
   cloudflared tunnel route dns cloutscape-prod cloutscape.org
   cloudflared tunnel route dns cloutscape-prod www.cloutscape.org

4. Start tunnel:
   cloudflared tunnel --config /root/.cloudflared/config.yml run cloutscape-prod

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📋 OPTION 2: Run as Service (Recommended)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

After creating the tunnel (steps 1-3 above):

   cloudflared service install
   systemctl start cloudflared
   systemctl enable cloudflared

This will keep the tunnel running even after reboot.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📋 OPTION 3: Use Cloudflare Dashboard
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. Go to https://one.dash.cloudflare.com/
2. Select your account
3. Go to Networks → Tunnels
4. Click "Create a tunnel"
5. Name it "cloutscape-prod"
6. Install connector (choose Docker or other)
7. Add public hostname:
   - Public hostname: cloutscape.org
   - Service: http://localhost:8080

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✅ CURRENT STATUS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

   Degens¤Den Server:  ✅ RUNNING on port 8080
   Local Access:       ✅ http://localhost:8080
   Cloudflare Tunnel:  ⏳ NOT CONFIGURED
   Public Access:      ❌ https://cloutscape.org (awaiting tunnel)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🔧 Need Help?
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

   Cloudflare version: $(cloudflared --version)
   Config file: /root/.cloudflared/config.yml
   App config: /app/cloudflared-config.yml
   
   Your config is already set to route port 8080 to cloutscape.org
   You just need to authenticate and create the tunnel!

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

After tunnel is running, test with:
   curl https://cloutscape.org

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

EOF
