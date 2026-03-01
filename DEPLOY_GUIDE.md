# CloutxMi - Go Live on cloutscape.org via Cloudflare Tunnel

## Prerequisites

Before starting, ensure you have:
1. A Cloudflare account with `cloutscape.org` domain added
2. Access to your Cloudflare dashboard
3. A server/machine with internet access (Linux/Mac/Windows with WSL)
4. Git installed

---

## Step-by-Step Deployment Guide

### **Step 1: Clone the Fixed Repository**

```bash
git clone https://github.com/No6love9/CloutxMi-Fixed.git
cd CloutxMi-Fixed
```

### **Step 2: Install Cloudflared CLI**

Cloudflared is the tool that creates a secure tunnel from your server to Cloudflare's network.

**On Linux/Mac:**
```bash
curl -L --output cloudflared.tgz https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.tgz
tar -xzf cloudflared.tgz
sudo mv cloudflared /usr/local/bin/
sudo chmod +x /usr/local/bin/cloudflared
rm cloudflared.tgz
```

**On Windows (PowerShell as Admin):**
```powershell
Invoke-WebRequest -Uri "https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-windows-amd64.exe" -OutFile "cloudflared.exe"
```

### **Step 3: Authenticate Cloudflared with Your Cloudflare Account**

This step will open your browser and ask you to log in to Cloudflare.

```bash
cloudflared tunnel login
```

You will see output like:
```
Please open the following URL and log in with your Cloudflare account:
https://dash.cloudflare.com/argotunnel?callback=...
```

- Open the link in your browser
- Log in with your Cloudflare account
- Select the domain `cloutscape.org`
- Authorize the tunnel
- You'll see: "You have successfully authenticated!"

### **Step 4: Create Your Tunnel**

Create a named tunnel for your application:

```bash
cloudflared tunnel create cloutscape-prod
```

**Save the Tunnel ID** that appears (you'll need it later). Example output:
```
Tunnel credentials written to ~/.cloudflared/cloutscape-prod.json
Tunnel ID: 12345678-1234-1234-1234-123456789012
```

### **Step 5: Create the Tunnel Configuration File**

Create a file named `~/.cloudflared/config.yml`:

```bash
cat > ~/.cloudflared/config.yml << 'EOF'
tunnel: cloutscape-prod
credentials-file: ~/.cloudflared/cloutscape-prod.json

ingress:
  - hostname: cloutscape.org
    service: http://localhost:8080
  - hostname: www.cloutscape.org
    service: http://localhost:8080
  - hostname: api.cloutscape.org
    service: http://localhost:8080
  - service: http_status:404
EOF
```

### **Step 6: Route Your Domain to the Tunnel**

Connect your domain to the tunnel:

```bash
cloudflared tunnel route dns cloutscape-prod cloutscape.org
cloudflared tunnel route dns cloutscape-prod www.cloutscape.org
cloudflared tunnel route dns cloutscape-prod api.cloutscape.org
```

### **Step 7: Install Project Dependencies**

```bash
# Install pnpm if you don't have it
npm install -g pnpm

# Install project dependencies
pnpm install
```

### **Step 8: Build the Application**

```bash
pnpm build
```

### **Step 9: Start the Application**

In one terminal, start your server:

```bash
pnpm start
```

You should see:
```
Server running on http://localhost:8080/
```

### **Step 10: Start the Cloudflare Tunnel (In Another Terminal)**

In a second terminal, run:

```bash
cloudflared tunnel run cloutscape-prod
```

You should see output like:
```
Registered tunnel connection
...
```

### **Step 11: Verify Your Site is Live**

Open your browser and visit:
- `https://cloutscape.org`
- `https://www.cloutscape.org`
- `https://api.cloutscape.org`

Your site should now be live! 🎉

---

## Automated One-Click Deployment Script

If you want to automate all of this, run:

```bash
chmod +x deploy.sh
./deploy.sh
```

This script will:
1. Install all dependencies
2. Build the application
3. Start the server
4. Start the Cloudflare Tunnel
5. Display your live URL

---

## Troubleshooting

### **Issue: "Permission denied" when running cloudflared**
**Solution:** Make sure cloudflared is executable:
```bash
chmod +x /usr/local/bin/cloudflared
```

### **Issue: "Tunnel not found" error**
**Solution:** Verify your tunnel exists:
```bash
cloudflared tunnel list
```

### **Issue: Site shows "502 Bad Gateway"**
**Solution:** Make sure your application is running on port 8080:
```bash
pnpm start
```

### **Issue: DNS not resolving**
**Solution:** Wait 5-10 minutes for DNS propagation, then check Cloudflare dashboard:
1. Go to `https://dash.cloudflare.com`
2. Select your domain
3. Go to **DNS** → **Records**
4. Verify CNAME records point to your tunnel

---

## Production Recommendations

### **1. Run as a Service (Linux)**

Create a systemd service file `/etc/systemd/system/cloutscape.service`:

```bash
sudo tee /etc/systemd/system/cloutscape.service > /dev/null << 'EOF'
[Unit]
Description=CloutxMi Application
After=network.target

[Service]
Type=simple
User=ubuntu
WorkingDirectory=/home/ubuntu/CloutxMi-Fixed
ExecStart=/usr/bin/pnpm start
Restart=on-failure
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF
```

Enable and start:
```bash
sudo systemctl daemon-reload
sudo systemctl enable cloutscape
sudo systemctl start cloutscape
```

### **2. Run Tunnel as a Service**

```bash
sudo cloudflared service install
sudo systemctl enable cloudflared
sudo systemctl start cloudflared
```

### **3. Monitor Logs**

```bash
# Application logs
tail -f server.log

# Tunnel logs
journalctl -u cloudflared -f
```

---

## Next Steps

1. **Set up environment variables** - Create a `.env` file with your database connection and API keys
2. **Configure SSL/TLS** - Cloudflare automatically provides SSL
3. **Set up monitoring** - Use Cloudflare Analytics to monitor traffic
4. **Enable auto-renewal** - Cloudflare handles certificate renewal automatically

Your site is now live on `cloutscape.org`! 🚀
