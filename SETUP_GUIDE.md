# 🚀 Degens¤Den Quick Setup Guide

## Option 1: One-Click Deployment (Recommended)

The easiest way to get Degens¤Den running:

```bash
chmod +x deploy-one-click.sh
./deploy-one-click.sh
```

This automated script will:
- ✅ Check system requirements
- ✅ Install MySQL and configure database
- ✅ Install all dependencies
- ✅ Run database migrations
- ✅ Build the application
- ✅ Set up Cloudflared tunnel
- ✅ Create systemd service
- ✅ Start the application

After completion, visit: **http://localhost:3000**

---

## Option 2: Docker Compose Deployment

Perfect for containerized environments:

```bash
# 1. Set up environment
cp .env.example .env
# Edit .env with your configuration

# 2. Start all services
docker-compose up -d

# 3. Check logs
docker-compose logs -f

# 4. Stop services
docker-compose down
```

Services included:
- MySQL database
- Degens¤Den application
- Cloudflared tunnel (optional)

---

## Option 3: Manual Setup

For developers who want full control:

### Step 1: Prerequisites

Install required software:

```bash
# Node.js 18+ (using nvm)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install 22
nvm use 22

# pnpm
npm install -g pnpm@10.4.1

# MySQL
sudo apt-get update
sudo apt-get install mysql-server
```

### Step 2: Database Setup

```bash
# Start MySQL
sudo systemctl start mysql
sudo systemctl enable mysql

# Create database
sudo mysql << EOF
CREATE DATABASE degensden_db;
CREATE USER 'degensden_user'@'localhost' IDENTIFIED BY 'Degens¤Den2026Secure!';
GRANT ALL PRIVILEGES ON degensden_db.* TO 'degensden_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
EOF
```

### Step 3: Application Setup

```bash
# Clone repository
git clone https://github.com/damienmarx/degensden.git
cd degensden

# Install dependencies
pnpm install

# Configure environment
cp .env.example .env
nano .env  # Edit database credentials

# Run migrations
pnpm db:push

# Build application
pnpm build

# Start development server
pnpm dev

# Or start production server
pnpm start
```

---

## Cloudflare Tunnel Setup

To make your casino accessible at **degensden.org**:

### Step 1: Install Cloudflared

```bash
# Download and install
wget -q https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb
sudo dpkg -i cloudflared-linux-amd64.deb
```

### Step 2: Authenticate

```bash
cloudflared tunnel login
```

This opens a browser to authenticate with your Cloudflare account.

### Step 3: Create Tunnel

```bash
cloudflared tunnel create degensden-prod
```

Note the tunnel ID displayed.

### Step 4: Configure DNS

```bash
# Route your domain to the tunnel
cloudflared tunnel route dns degensden-prod degensden.org
cloudflared tunnel route dns degensden-prod www.degensden.org
```

### Step 5: Copy Configuration

```bash
# Copy our pre-made config
cp cloudflared-config.yml ~/.cloudflared/config.yml

# Edit with your tunnel credentials
nano ~/.cloudflared/config.yml
```

Update the `credentials-file` path with your tunnel JSON file location.

### Step 6: Run Tunnel

**Option A: Run in terminal (for testing)**
```bash
cloudflared tunnel run degensden-prod
```

**Option B: Install as service (recommended for production)**
```bash
sudo cloudflared service install
sudo systemctl start cloudflared
sudo systemctl enable cloudflared
```

### Step 7: Verify

Visit **https://degensden.org** in your browser!

---

## First-Time Access

1. **Create Admin Account**
   - Go to https://degensden.org/register
   - Register your admin account
   - Update role to 'admin' in database if needed

2. **Test Games**
   - Navigate to each game
   - Place test bets
   - Verify functionality

3. **Configure Settings**
   - Adjust game limits in .env
   - Configure VIP tiers
   - Set up payment methods

---

## Useful Commands

```bash
# View application logs
journalctl -u degensden -f

# Restart application
sudo systemctl restart degensden

# Check application status
sudo systemctl status degensden

# View Cloudflared tunnel status
sudo systemctl status cloudflared

# View database
mysql -u degensden_user -p degensden_db

# Backup database
mysqldump -u degensden_user -p degensden_db > backup.sql

# Restore database
mysql -u degensden_user -p degensden_db < backup.sql
```

---

## Troubleshooting

### Application won't start

```bash
# Check logs
journalctl -u degensden -n 50

# Verify database connection
mysql -u degensden_user -p degensden_db

# Rebuild application
pnpm build
```

### Database connection failed

```bash
# Check MySQL is running
sudo systemctl status mysql

# Test connection
mysql -h localhost -u degensden_user -p

# Check DATABASE_URL in .env
cat .env | grep DATABASE_URL
```

### Port already in use

```bash
# Find process using port 3000
lsof -ti:3000

# Kill the process
lsof -ti:3000 | xargs kill -9

# Or change port in .env
echo "PORT=3001" >> .env
```

### Cloudflared tunnel not working

```bash
# Check tunnel status
cloudflared tunnel info degensden-prod

# View tunnel logs
journalctl -u cloudflared -f

# Restart tunnel
sudo systemctl restart cloudflared
```

---

## Security Checklist

Before going live:

- [ ] Change all default passwords in `.env`
- [ ] Generate secure JWT_SECRET (32+ characters)
- [ ] Generate secure ENCRYPTION_KEY (32 characters)
- [ ] Enable HTTPS (via Cloudflare Tunnel)
- [ ] Set up regular database backups
- [ ] Configure firewall rules
- [ ] Enable rate limiting
- [ ] Review CORS settings
- [ ] Enable 2FA for admin accounts
- [ ] Set appropriate game limits

---

## Performance Optimization

For production:

1. **Enable MySQL query caching**
```sql
SET GLOBAL query_cache_size = 67108864;
SET GLOBAL query_cache_type = 1;
```

2. **Optimize Node.js**
```bash
# Increase memory limit if needed
NODE_OPTIONS=--max-old-space-size=4096 pnpm start
```

3. **Enable gzip compression**
Already configured in Express middleware.

4. **Use PM2 for process management (alternative to systemd)**
```bash
npm install -g pm2
pm2 start dist/index.js --name degensden
pm2 startup
pm2 save
```

---

## Monitoring

Set up monitoring for production:

```bash
# View real-time metrics
watch -n 1 'journalctl -u degensden -n 20'

# Monitor MySQL
mysqladmin -u degensden_user -p processlist

# Check disk space
df -h

# Monitor memory
free -h
```

---

## Need Help?

- **GitHub Issues**: https://github.com/damienmarx/degensden/issues
- **Email**: support@degensden.org
- **Documentation**: See [README.md](README.md)

---

**Happy Gaming! 🎰💎**
