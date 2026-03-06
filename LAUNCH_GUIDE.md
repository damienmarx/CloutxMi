# 🚀 CloutScape Quick Launch Guide for Ubuntu

## One-Command Launch

```bash
git clone https://github.com/damienmarx/CloutxMi.git && cd CloutxMi && chmod +x deploy-production.sh && ./deploy-production.sh
```

That's it! The script will:
- ✅ Install all dependencies (Node.js, MySQL, pnpm)
- ✅ Create and configure database
- ✅ Build the application
- ✅ Set up systemd service
- ✅ Start CloutScape on port 3000

---

## Post-Deployment: Cloudflare Tunnel Setup

After the script completes, set up your domain:

### 1. Login to Cloudflare

```bash
cloudflared tunnel login
```

This opens your browser to authenticate.

### 2. Create Tunnel

```bash
cloudflared tunnel create cloutscape-prod
```

Note the tunnel ID shown.

### 3. Configure Tunnel

The config file is already created at `/app/cloudflared-config.yml`. Update the credentials path:

```bash
nano ~/.cloudflared/config.yml
```

Make sure `credentials-file` points to your tunnel JSON:
```yaml
credentials-file: /root/.cloudflared/<TUNNEL_ID>.json
```

### 4. Route Your Domain

```bash
cloudflared tunnel route dns cloutscape-prod cloutscape.org
cloudflared tunnel route dns cloutscape-prod www.cloutscape.org
```

### 5. Start Tunnel

**Option A: Run in terminal (testing)**
```bash
cloudflared tunnel run cloutscape-prod
```

**Option B: Install as service (production)**
```bash
sudo cloudflared service install
sudo systemctl start cloudflared
sudo systemctl enable cloudflared
```

---

## Verify Everything Works

1. **Check application**
   ```bash
   curl http://localhost:3000
   ```

2. **Check service status**
   ```bash
   sudo systemctl status cloutscape
   ```

3. **View logs**
   ```bash
   sudo journalctl -u cloutscape -f
   ```

4. **Visit your site**
   - Local: http://localhost:3000
   - Public: https://cloutscape.org (after tunnel setup)

---

## Managing CloutScape

### Service Commands

```bash
# Start
sudo systemctl start cloutscape

# Stop
sudo systemctl stop cloutscape

# Restart
sudo systemctl restart cloutscape

# Status
sudo systemctl status cloutscape

# Logs
sudo journalctl -u cloutscape -f
```

### Database Access

```bash
mysql -u cloutscape_user -p cloutscape_db
# Password: CloutScape2026Secure!
```

### Update Application

```bash
cd /app
git pull
pnpm install
pnpm build
sudo systemctl restart cloutscape
```

---

## Discord Bot Setup (Optional)

1. **Create Discord Bot**
   - Go to https://discord.com/developers/applications
   - Create new application
   - Go to Bot tab → Add Bot
   - Copy bot token
   - Enable required intents: Server Members, Message Content

2. **Add to Your Server**
   - Go to OAuth2 → URL Generator
   - Select scopes: `bot`
   - Select permissions: `Administrator`
   - Copy URL and open in browser
   - Add bot to your server

3. **Configure Bot**
   
   Add to `.env`:
   ```env
   DISCORD_BOT_TOKEN=your_bot_token_here
   DISCORD_GUILD_ID=your_server_id_here
   ```

4. **Setup Server**
   
   In Discord, type:
   ```
   !clout setup
   ```

This will automatically create all channels and roles!

---

## Features Enabled

### ✅ Provably Fair Gaming
- Every game result is verifiable
- Server seed hash shown before play
- Full cryptographic transparency
- Visit `/provably-fair` to verify results

### ✅ DEGEN BOX
- Lock funds for 24h, 7d, 30d, or permanent
- Prevents impulsive gambling
- Cannot be unlocked early (except admin)
- Access via `/dashboard`

### ✅ Discord Integration
- Big win notifications
- Payment alerts
- Automated server setup
- Luxury themed channels

### ✅ Legal Compliance
- No Jagex affiliation disclaimer
- No refunds policy (except foul play)
- Age verification (18+)
- Responsible gambling tools
- View at `/legal`

### ✅ Referral System
- Coming soon - Earn commissions
- Tiered rewards
- Real-time tracking

---

## Troubleshooting

### Application Won't Start

```bash
# Check logs
sudo journalctl -u cloutscape -n 100

# Check if port is in use
lsof -i :3000

# Restart MySQL
sudo systemctl restart mysql

# Rebuild
cd /app
pnpm build
sudo systemctl restart cloutscape
```

### Database Connection Failed

```bash
# Test connection
mysql -u cloutscape_user -p cloutscape_db

# Reset password
sudo mysql
ALTER USER 'cloutscape_user'@'localhost' IDENTIFIED BY 'CloutScape2026Secure!';
FLUSH PRIVILEGES;
EXIT;
```

### Cloudflare Tunnel Issues

```bash
# Check tunnel status
cloudflared tunnel info cloutscape-prod

# View tunnel logs
sudo journalctl -u cloudflared -f

# Restart tunnel
sudo systemctl restart cloudflared
```

### Build Errors

```bash
# Clear cache
rm -rf node_modules .pnpm-store
pnpm install

# Fix permissions
sudo chown -R $USER:$USER /app

# Rebuild
pnpm build
```

---

## Security Checklist

Before going live:

- [ ] Change database password in `/app/.env`
- [ ] Generate new JWT_SECRET (32+ random characters)
- [ ] Generate new ENCRYPTION_KEY (32 random characters)
- [ ] Enable firewall
  ```bash
  sudo ufw allow 22
  sudo ufw allow 80
  sudo ufw allow 443
  sudo ufw enable
  ```
- [ ] Set up SSL (automatic via Cloudflare)
- [ ] Configure backup script
- [ ] Enable 2FA for admin account
- [ ] Review game limits in `.env`

---

## Performance Optimization

For production workloads:

### 1. MySQL Optimization

Add to `/etc/mysql/mysql.conf.d/mysqld.cnf`:

```ini
[mysqld]
innodb_buffer_pool_size = 2G
max_connections = 200
query_cache_size = 64M
query_cache_type = 1
```

Restart MySQL:
```bash
sudo systemctl restart mysql
```

### 2. Node.js Memory

Edit `/etc/systemd/system/cloutscape.service`:

```ini
Environment=NODE_OPTIONS=--max-old-space-size=4096
```

Reload and restart:
```bash
sudo systemctl daemon-reload
sudo systemctl restart cloutscape
```

### 3. Enable gzip

Already enabled in Express config.

---

## Backup Strategy

### Database Backup Script

Create `/app/scripts/backup-db.sh`:

```bash
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
mysqldump -u cloutscape_user -pCloutScape2026Secure! cloutscape_db > /app/backups/db_$DATE.sql
# Keep last 7 days
find /app/backups -name "db_*.sql" -mtime +7 -delete
```

Schedule daily backups:
```bash
chmod +x /app/scripts/backup-db.sh
crontab -e
# Add line:
0 2 * * * /app/scripts/backup-db.sh
```

---

## Monitoring

### Real-time Monitoring

```bash
# Application logs
sudo journalctl -u cloutscape -f

# MySQL processes
watch -n 1 'mysqladmin -u cloutscape_user -pCloutScape2026Secure! processlist'

# System resources
htop

# Disk usage
df -h

# Network connections
netstat -tuln | grep 3000
```

### Set Up Email Alerts (Optional)

Install mailutils:
```bash
sudo apt-get install mailutils
```

Create alert script `/app/scripts/alert.sh`:
```bash
#!/bin/bash
if ! systemctl is-active --quiet cloutscape; then
    echo "CloutScape is down!" | mail -s "ALERT: CloutScape Down" your@email.com
fi
```

Run every 5 minutes:
```bash
crontab -e
*/5 * * * * /app/scripts/alert.sh
```

---

## Support

- **Email**: support@cloutscape.org
- **GitHub Issues**: https://github.com/damienmarx/CloutxMi/issues
- **Logs**: `/app/logs/` and `sudo journalctl -u cloutscape`

---

## Quick Reference

| Command | Purpose |
|---------|---------|
| `sudo systemctl restart cloutscape` | Restart application |
| `sudo journalctl -u cloutscape -f` | View live logs |
| `mysql -u cloutscape_user -p cloutscape_db` | Access database |
| `cd /app && git pull && pnpm build && sudo systemctl restart cloutscape` | Update app |
| `cloudflared tunnel run cloutscape-prod` | Start tunnel |
| `sudo systemctl status cloudflared` | Check tunnel status |

---

**You're all set! CloutScape is now running on cloutscape.org 🎰💎**

For advanced features, payment processing, and custom modifications, refer to the main documentation.
