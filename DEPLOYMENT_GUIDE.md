# CloutScape Deployment Guide

## Quick Start (One-Command Deployment)

```bash
curl -fsSL https://raw.githubusercontent.com/damienmarx/CloutxMi/main/MASTER_SETUP.sh | bash
```

This single command will:
- Install all system dependencies
- Clone the repository
- Configure MySQL database
- Setup environment variables
- Install project dependencies
- Build the application
- Configure Cloudflare Tunnel
- Setup process management

---

## Manual Setup (Step-by-Step)

### Prerequisites

- Ubuntu 20.04 or later
- Sudo access
- 2GB+ RAM
- 10GB+ disk space
- Cloudflare account with domain management access

### Step 1: System Setup

```bash
# Update system
sudo apt-get update
sudo apt-get upgrade -y

# Install dependencies
sudo apt-get install -y \
  curl git build-essential wget unzip \
  mysql-server mysql-client \
  nodejs npm
```

### Step 2: Node.js Setup

```bash
# Install pnpm
sudo npm install -g pnpm

# Verify installations
node --version
npm --version
pnpm --version
```

### Step 3: Clone Repository

```bash
# Clone the repo
git clone https://github.com/damienmarx/CloutxMi.git ~/cloutscape
cd ~/cloutscape
```

### Step 4: Database Setup

```bash
# Start MySQL
sudo service mysql start

# Create database and user
sudo mysql -u root << EOF
CREATE DATABASE cloutscape_db;
CREATE USER 'cloutscape_user'@'localhost' IDENTIFIED BY 'your_secure_password';
GRANT ALL PRIVILEGES ON cloutscape_db.* TO 'cloutscape_user'@'localhost';
FLUSH PRIVILEGES;
EOF
```

### Step 5: Environment Configuration

```bash
# Copy environment template
cp .env.example .env

# Edit environment variables
nano .env
```

**Required environment variables:**

```env
DATABASE_URL="mysql://cloutscape_user:password@127.0.0.1:3306/cloutscape_db"
NODE_ENV=production
APP_PORT=3000
DOMAIN=cloutscape.org
JWT_SECRET=your_jwt_secret
SESSION_SECRET=your_session_secret
```

### Step 6: Install Dependencies

```bash
npm install --legacy-peer-deps
```

### Step 7: Database Migrations

```bash
npm run db:push
```

### Step 8: Build Application

```bash
npm run build
```

---

## Cloudflare Tunnel Setup

### Prerequisites

- Cloudflare account
- Domain registered with Cloudflare
- Cloudflare nameservers configured

### Step 1: Install Cloudflared

```bash
# Download and install
wget https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64
sudo mv cloudflared-linux-amd64 /usr/local/bin/cloudflared
sudo chmod +x /usr/local/bin/cloudflared

# Verify installation
cloudflared --version
```

### Step 2: Authenticate

```bash
cloudflared tunnel login
# This will open a browser window to authenticate with Cloudflare
```

### Step 3: Create Tunnel

```bash
cloudflared tunnel create cloutscape-tunnel
```

### Step 4: Configure Tunnel

Create `~/.cloudflare/config.yml`:

```yaml
tunnel: cloutscape-tunnel
credentials-file: ~/.cloudflare/cloutscape-tunnel.json

ingress:
  - hostname: cloutscape.org
    service: http://localhost:3000
  - hostname: www.cloutscape.org
    service: http://localhost:3000
  - service: http_status:404
```

### Step 5: Route DNS

```bash
cloudflared tunnel route dns cloutscape-tunnel cloutscape.org
cloudflared tunnel route dns cloutscape-tunnel www.cloutscape.org
```

### Step 6: Start Tunnel

```bash
cloudflared tunnel run cloutscape-tunnel
```

---

## Application Startup

### Option 1: Direct Start

```bash
cd ~/cloutscape
npm start
```

### Option 2: PM2 Process Manager (Recommended)

```bash
# Install PM2
sudo npm install -g pm2

# Start application
pm2 start ecosystem.config.js

# Monitor logs
pm2 logs cloutscape

# Setup auto-restart on reboot
pm2 startup
pm2 save
```

### Option 3: Systemd Service

```bash
# Enable service
sudo systemctl enable cloutscape

# Start service
sudo systemctl start cloutscape

# Check status
sudo systemctl status cloutscape

# View logs
journalctl -u cloutscape -f
```

---

## Monitoring & Maintenance

### Check Application Status

```bash
# With PM2
pm2 status

# With systemd
sudo systemctl status cloutscape

# Check port
sudo lsof -i :3000
```

### View Logs

```bash
# PM2 logs
pm2 logs cloutscape

# Systemd logs
journalctl -u cloutscape -f

# Application logs
tail -f ~/cloutscape/logs/app.log
```

### Database Maintenance

```bash
# Connect to database
mysql -u cloutscape_user -p cloutscape_db

# Backup database
mysqldump -u cloutscape_user -p cloutscape_db > backup.sql

# Restore database
mysql -u cloutscape_user -p cloutscape_db < backup.sql
```

### Tunnel Status

```bash
# Check tunnel status
cloudflared tunnel info cloutscape-tunnel

# View tunnel logs
cloudflared tunnel logs cloutscape-tunnel

# List all tunnels
cloudflared tunnel list
```

---

## Troubleshooting

### Application Won't Start

```bash
# Check Node.js version
node --version

# Check npm dependencies
npm list

# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install --legacy-peer-deps

# Rebuild
npm run build
```

### Database Connection Error

```bash
# Check MySQL status
sudo service mysql status

# Check database exists
mysql -u root -e "SHOW DATABASES;"

# Check user permissions
mysql -u root -e "SELECT user, host FROM mysql.user WHERE user='cloutscape_user';"

# Test connection
mysql -u cloutscape_user -p -h 127.0.0.1 cloutscape_db -e "SELECT 1;"
```

### Tunnel Connection Issues

```bash
# Test tunnel connectivity
cloudflared tunnel test cloutscape-tunnel

# Check DNS resolution
nslookup cloutscape.org

# Verify Cloudflare nameservers
dig cloutscape.org NS

# Restart tunnel
cloudflared tunnel run cloutscape-tunnel
```

### Port Already in Use

```bash
# Find process using port 3000
sudo lsof -i :3000

# Kill process (if needed)
sudo kill -9 <PID>

# Change port in .env if needed
APP_PORT=3001
```

---

## Security Best Practices

1. **Environment Variables**: Never commit `.env` to git
2. **Database Password**: Use strong, randomly generated passwords
3. **JWT Secret**: Use a long, random string
4. **HTTPS**: Always use HTTPS in production (Cloudflare provides this)
5. **Firewall**: Restrict access to database and application ports
6. **Regular Backups**: Backup database regularly
7. **Updates**: Keep dependencies updated

---

## Performance Optimization

### Enable Caching

```bash
# In .env
CACHE_ENABLED=true
CACHE_TTL=3600
```

### Database Optimization

```bash
# Add indexes for frequently queried columns
mysql -u cloutscape_user -p cloutscape_db << EOF
ALTER TABLE userStats ADD INDEX idx_userId (userId);
ALTER TABLE vipTiers ADD INDEX idx_userId (userId);
ALTER TABLE transactions ADD INDEX idx_userId (userId);
EOF
```

### Application Clustering

```bash
# In ecosystem.config.js, adjust instances
instances: 'max'  # Uses all CPU cores
```

---

## Scaling Considerations

### Load Balancing

For multiple servers:
- Use Cloudflare Load Balancing
- Configure multiple tunnel endpoints
- Use a reverse proxy (nginx)

### Database Scaling

- Consider read replicas for high traffic
- Implement connection pooling
- Archive old data regularly

### Caching Layer

- Implement Redis for session storage
- Cache frequently accessed data
- Use CDN for static assets

---

## Support & Resources

- **Documentation**: https://github.com/damienmarx/CloutxMi
- **Cloudflare Docs**: https://developers.cloudflare.com/
- **Node.js Docs**: https://nodejs.org/docs/
- **MySQL Docs**: https://dev.mysql.com/doc/

---

## Version History

- **v1.0.0** - Initial deployment guide
- **v1.1.0** - Added Cloudflare Tunnel integration
- **v1.2.0** - Added troubleshooting section

---

**Last Updated**: February 26, 2026
**Maintained By**: CloutScape Development Team
