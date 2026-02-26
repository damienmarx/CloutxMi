# 🚀 CloutScape Deployment Guide

Complete guide for deploying CloutScape to production environments.

---

## Prerequisites

- Ubuntu 20.04+ server with root/sudo access
- Domain name (optional but recommended)
- SSL certificate (Let's Encrypt recommended)
- MySQL 8.0+ server
- Node.js 18+

---

## Local Production Build

### 1. Build the Application

```bash
cd /home/ubuntu/CloutScape

# Install dependencies
pnpm install

# Build for production
pnpm run build

# Verify build succeeded
ls -la dist/
```

### 2. Test Production Build

```bash
# Set production environment
export NODE_ENV=production

# Start production server
pnpm run preview

# Test at http://localhost:3000
```

---

## Server Setup

### 1. System Preparation

```bash
# Update system packages
sudo apt-get update && sudo apt-get upgrade -y

# Install required tools
sudo apt-get install -y curl wget git build-essential

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install pnpm
npm install -g pnpm

# Install MySQL
sudo apt-get install -y mysql-server
sudo systemctl start mysql
sudo systemctl enable mysql

# Install Nginx (reverse proxy)
sudo apt-get install -y nginx
sudo systemctl start nginx
sudo systemctl enable nginx

# Install PM2 (process manager)
sudo npm install -g pm2
```

### 2. Create Application User

```bash
# Create dedicated user for app
sudo useradd -m -s /bin/bash cloutscape

# Add to sudo group
sudo usermod -aG sudo cloutscape

# Switch to user
sudo su - cloutscape
```

### 3. Clone and Setup Repository

```bash
# Clone repository
git clone https://github.com/No6love9/CloutScape.git
cd CloutScape

# Run setup script
sudo bash setup-environment.sh

# Install dependencies
pnpm install

# Build application
pnpm run build
```

---

## Database Setup

### 1. Create Database User

```bash
sudo mysql -u root << EOF
CREATE USER 'cloutscape'@'localhost' IDENTIFIED BY 'strong_password_here';
GRANT ALL PRIVILEGES ON cloutscape.* TO 'cloutscape'@'localhost';
FLUSH PRIVILEGES;
EXIT;
EOF
```

### 2. Create Database

```bash
mysql -u cloutscape -p << EOF
CREATE DATABASE cloutscape CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
EXIT;
EOF
```

### 3. Run Migrations

```bash
cd /home/cloutscape/CloutScape
pnpm run db:push
```

---

## Environment Configuration

### 1. Create .env.local

```bash
cd /home/cloutscape/CloutScape
cat > .env.local << 'EOF'
# Database
DATABASE_URL=mysql://cloutscape:strong_password_here@localhost:3306/cloutscape

# Security
SESSION_SECRET=$(openssl rand -base64 32)
JWT_SECRET=$(openssl rand -base64 32)

# Application
NODE_ENV=production
PORT=3000
VITE_API_URL=https://yourdomain.com

# Features
ENABLE_OSRS_INTEGRATION=true
ENABLE_CRYPTO_WALLET=true
ENABLE_LIVE_CHAT=true
ENABLE_RAIN_SYSTEM=true

# Security
CSRF_PROTECTION=true
RATE_LIMIT_ENABLED=true
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Logging
LOG_LEVEL=info
LOG_FILE=/home/cloutscape/CloutScape/logs/app.log
EOF
```

### 2. Set Permissions

```bash
chmod 600 .env.local
```

---

## Nginx Configuration

### 1. Create Nginx Config

```bash
sudo tee /etc/nginx/sites-available/cloutscape > /dev/null << 'EOF'
upstream cloutscape {
    server 127.0.0.1:3000;
}

server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;

    # SSL certificates (Let's Encrypt)
    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

    # SSL configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript;
    gzip_min_length 1000;

    # Proxy settings
    location / {
        proxy_pass http://cloutscape;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Static files caching
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
EOF
```

### 2. Enable Site

```bash
sudo ln -s /etc/nginx/sites-available/cloutscape /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

---

## SSL Certificate Setup

### Using Let's Encrypt

```bash
# Install Certbot
sudo apt-get install -y certbot python3-certbot-nginx

# Get certificate
sudo certbot certonly --nginx -d yourdomain.com -d www.yourdomain.com

# Auto-renewal
sudo systemctl enable certbot.timer
sudo systemctl start certbot.timer
```

---

## Process Management with PM2

### 1. Create PM2 Ecosystem File

```bash
cd /home/cloutscape/CloutScape
cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [
    {
      name: 'cloutscape',
      script: './dist/server/index.js',
      instances: 'max',
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
      error_file: './logs/error.log',
      out_file: './logs/out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
    },
  ],
};
EOF
```

### 2. Start Application

```bash
# Start with PM2
pm2 start ecosystem.config.js

# Save PM2 config
pm2 save

# Setup PM2 startup
pm2 startup
# Follow the instructions provided by PM2
```

### 3. Monitor Application

```bash
# View logs
pm2 logs cloutscape

# Monitor processes
pm2 monit

# View status
pm2 status
```

---

## Monitoring & Maintenance

### 1. Log Rotation

```bash
sudo tee /etc/logrotate.d/cloutscape > /dev/null << 'EOF'
/home/cloutscape/CloutScape/logs/*.log {
    daily
    rotate 14
    compress
    delaycompress
    notifempty
    create 0640 cloutscape cloutscape
    sharedscripts
    postrotate
        pm2 reload cloutscape
    endscript
}
EOF
```

### 2. Backup Strategy

```bash
# Create backup script
cat > /home/cloutscape/backup.sh << 'EOF'
#!/bin/bash

BACKUP_DIR="/home/cloutscape/backups"
DATE=$(date +%Y%m%d_%H%M%S)

# Create backup directory
mkdir -p $BACKUP_DIR

# Backup database
mysqldump -u cloutscape -p$DB_PASSWORD cloutscape > $BACKUP_DIR/db_$DATE.sql

# Compress
gzip $BACKUP_DIR/db_$DATE.sql

# Keep only last 7 days
find $BACKUP_DIR -name "db_*.sql.gz" -mtime +7 -delete

echo "Backup completed: $BACKUP_DIR/db_$DATE.sql.gz"
EOF

chmod +x /home/cloutscape/backup.sh

# Schedule daily backups
(crontab -l 2>/dev/null; echo "0 2 * * * /home/cloutscape/backup.sh") | crontab -
```

### 3. Health Checks

```bash
# Create health check script
cat > /home/cloutscape/health-check.sh << 'EOF'
#!/bin/bash

# Check if application is running
curl -f http://localhost:3000/health || {
    echo "Application is down!"
    pm2 restart cloutscape
    exit 1
}

# Check database connection
mysql -u cloutscape -p$DB_PASSWORD -e "SELECT 1" cloutscape || {
    echo "Database connection failed!"
    exit 1
}

echo "Health check passed"
EOF

chmod +x /home/cloutscape/health-check.sh

# Schedule health checks every 5 minutes
(crontab -l 2>/dev/null; echo "*/5 * * * * /home/cloutscape/health-check.sh") | crontab -
```

---

## Performance Optimization

### 1. Database Optimization

```bash
# Add indexes for common queries
mysql -u cloutscape -p$DB_PASSWORD cloutscape << EOF
CREATE INDEX idx_user_username ON users(username);
CREATE INDEX idx_wallet_userid ON wallets(userId);
CREATE INDEX idx_transaction_userid ON transactions(userId);
CREATE INDEX idx_chat_userid ON chatMessages(userId);
EOF
```

### 2. Caching Strategy

- Enable Redis for session storage (optional)
- Use HTTP caching headers for static assets
- Implement database query caching

### 3. Load Balancing

For high traffic, consider:
- Multiple Node.js instances behind Nginx
- Database read replicas
- CDN for static assets

---

## Troubleshooting

### Application Won't Start

```bash
# Check PM2 logs
pm2 logs cloutscape

# Check Nginx
sudo nginx -t
sudo systemctl status nginx

# Check database connection
mysql -u cloutscape -p$DB_PASSWORD -e "SELECT 1" cloutscape
```

### High Memory Usage

```bash
# Check process memory
pm2 monit

# Increase max memory restart
pm2 update cloutscape --max-memory-restart 1G
```

### Database Connection Issues

```bash
# Check MySQL status
sudo systemctl status mysql

# Verify credentials
mysql -u cloutscape -p$DB_PASSWORD cloutscape -e "SELECT 1"

# Check connection limit
mysql -u root -e "SHOW VARIABLES LIKE 'max_connections';"
```

---

## Security Hardening

### 1. Firewall Configuration

```bash
sudo ufw enable
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw default deny incoming
sudo ufw default allow outgoing
```

### 2. Fail2Ban Setup

```bash
sudo apt-get install -y fail2ban

# Create config
sudo tee /etc/fail2ban/jail.local > /dev/null << 'EOF'
[DEFAULT]
bantime = 3600
findtime = 600
maxretry = 5

[sshd]
enabled = true

[nginx-http-auth]
enabled = true

[nginx-limit-req]
enabled = true
EOF

sudo systemctl restart fail2ban
```

### 3. SSH Hardening

```bash
# Disable root login
sudo sed -i 's/#PermitRootLogin yes/PermitRootLogin no/' /etc/ssh/sshd_config

# Disable password auth (use keys only)
sudo sed -i 's/#PasswordAuthentication yes/PasswordAuthentication no/' /etc/ssh/sshd_config

# Restart SSH
sudo systemctl restart ssh
```

---

## Post-Deployment Checklist

- [ ] Application running and accessible
- [ ] SSL certificate installed and valid
- [ ] Database backups configured
- [ ] Monitoring and alerting setup
- [ ] Log rotation configured
- [ ] Health checks running
- [ ] Firewall rules applied
- [ ] SSH hardened
- [ ] Performance baseline established
- [ ] Disaster recovery plan documented

---

## Support & Rollback

### Rollback Procedure

```bash
# Stop current version
pm2 stop cloutscape

# Checkout previous version
git checkout <previous-commit>

# Rebuild
pnpm run build

# Restart
pm2 start ecosystem.config.js
```

### Emergency Contact

- **Email**: worker@cloutscape.org
- **GitHub Issues**: https://github.com/No6love9/CloutScape/issues

---

**Last Updated**: February 2026 | **Version**: 2026.1.0
