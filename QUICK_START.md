# CloutScape Quick Start

## 🚀 One-Command Deployment

```bash
curl -fsSL https://raw.githubusercontent.com/damienmarx/CloutxMi/main/MASTER_SETUP.sh | bash
```

That's it! The script will handle everything.

---

## ⚡ What Gets Installed

✅ System dependencies (Node.js, MySQL, etc.)
✅ Project repository
✅ Database configuration
✅ Environment setup
✅ Dependencies installation
✅ Application build
✅ Cloudflare Tunnel integration
✅ Process management (PM2)
✅ Systemd service

---

## 📋 After Installation

### 1. Configure Cloudflare Tunnel

```bash
# Login to Cloudflare
cloudflared tunnel login

# Create tunnel
cloudflared tunnel create cloutscape-tunnel

# Route DNS
cloudflared tunnel route dns cloutscape-tunnel cloutscape.org
cloudflared tunnel route dns cloutscape-tunnel www.cloutscape.org

# Start tunnel (in a new terminal)
cloudflared tunnel run cloutscape-tunnel
```

### 2. Start the Application

```bash
cd ~/cloutscape

# Option A: Direct start
npm start

# Option B: With PM2 (recommended)
pm2 start ecosystem.config.js
pm2 logs cloutscape

# Option C: With systemd
sudo systemctl start cloutscape
journalctl -u cloutscape -f
```

### 3. Access Your Site

Open your browser and visit: **https://cloutscape.org**

---

## 🔧 Common Commands

```bash
# Start application
npm start

# Build application
npm run build

# Check database
mysql -u cloutscape_user -p cloutscape_db

# View logs (PM2)
pm2 logs cloutscape

# View logs (systemd)
journalctl -u cloutscape -f

# Stop application (PM2)
pm2 stop cloutscape

# Restart application (PM2)
pm2 restart cloutscape
```

---

## 🐛 Troubleshooting

### Application won't start
```bash
# Check if port 3000 is in use
sudo lsof -i :3000

# Check MySQL is running
sudo service mysql status

# Rebuild application
npm run build
```

### Database connection error
```bash
# Test database connection
mysql -u cloutscape_user -p -h 127.0.0.1 cloutscape_db

# Check database exists
mysql -u root -e "SHOW DATABASES;"
```

### Tunnel not connecting
```bash
# Test tunnel
cloudflared tunnel test cloutscape-tunnel

# Check DNS
nslookup cloutscape.org

# Restart tunnel
cloudflared tunnel run cloutscape-tunnel
```

---

## 📚 Full Documentation

For detailed setup instructions, see: [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)

---

## 🎯 Key Features

- **Gaming Platform**: Multiple games (slots, dice, roulette, blackjack, crash, keno)
- **VIP System**: 5-tier system with cashback and bonuses
- **Wallet System**: Crypto and traditional payment support
- **Leaderboards**: Real-time rankings and statistics
- **Live Chat**: Community interaction
- **Admin Dashboard**: Full platform management
- **Provably Fair**: Transparent game mechanics
- **Security**: JWT authentication, rate limiting, encryption

---

## 🌐 Domain Configuration

Your site is configured for: **cloutscape.org**

To use a different domain:
1. Edit `.env` and change `DOMAIN`
2. Update Cloudflare tunnel routes
3. Restart the application

---

## 💾 Database

- **Type**: MySQL
- **Host**: 127.0.0.1
- **Port**: 3306
- **Default Database**: cloutscape_db
- **Default User**: cloutscape_user

Credentials are in `.env` file.

---

## 🔐 Security Notes

- **Never** commit `.env` to git
- Use strong database passwords
- Enable HTTPS (Cloudflare provides this)
- Keep dependencies updated
- Regular backups recommended

---

## 📞 Support

- **GitHub**: https://github.com/damienmarx/CloutxMi
- **Issues**: Report bugs on GitHub
- **Docs**: See DEPLOYMENT_GUIDE.md for detailed documentation

---

## ✨ Next Steps

1. ✅ Run the master setup script
2. ✅ Configure Cloudflare Tunnel
3. ✅ Start the application
4. ✅ Access cloutscape.org
5. ✅ Configure admin account
6. ✅ Customize game settings

---

**Ready to go live?** Run the setup script and you'll be live in minutes!

```bash
curl -fsSL https://raw.githubusercontent.com/damienmarx/CloutxMi/main/MASTER_SETUP.sh | bash
```
