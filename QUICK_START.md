# 🚀 DEGENS¤DEN QUICK START GUIDE

## One-Command Setup

After cloning this repository, run:

```bash
chmod +x quick-deploy.sh && ./quick-deploy.sh
```

This will automatically:
- ✅ Install all dependencies (Node.js, pnpm, MySQL, cloudflared)
- ✅ Set up database and run migrations
- ✅ Build frontend and backend
- ✅ Configure environment variables
- ✅ Start all services
- ✅ Launch Discord bot

---

## Manual Setup (3 Steps)

### 1. Clone Repository
```bash
git clone https://github.com/damienmarx/CloutxMi.git
cd CloutxMi
git checkout degens-den-complete
```

### 2. Configure Environment
```bash
cp .env.example .env
nano .env  # Edit Discord bot credentials
```

**Required Variables:**
- `DISCORD_BOT_TOKEN` - Your Discord bot token
- `DISCORD_GUILD_ID` - Your Discord server ID
- `DATABASE_URL` - Will be auto-configured

### 3. Run Deployment
```bash
sudo bash aio.sh
```

---

## What Gets Installed

- **Node.js 20+** - JavaScript runtime
- **pnpm** - Package manager
- **MySQL/MariaDB** - Database
- **discord.js** - Discord bot library
- **cloudflared** - Cloudflare tunnel (optional)

---

## Services After Install

- **App:** http://localhost:8080 (or auto-selected port)
- **MySQL:** localhost:3306
- **Discord Bot:** Auto-connects to your server
- **Logs:** `/app/logs/`

---

## Post-Install

### Check Status
```bash
bash check-status.sh
```

### View Logs
```bash
tail -f logs/degensden.log
```

### Restart Services
```bash
sudo supervisorctl restart degensden
```

### Setup Cloudflare Tunnel (Optional)
```bash
cloudflared tunnel login
cloudflared tunnel create cloutscape-prod
cloudflared tunnel route dns cloutscape-prod cloutscape.org
```

See `DEPLOYMENT_STATUS.md` for detailed tunnel setup.

---

## Troubleshooting

### App won't start
```bash
tail -50 logs/degensden.log
sudo supervisorctl status
```

### Database connection error
```bash
mysql -u root -e "SELECT 1"
ps aux | grep mysql
```

### Discord bot not connecting
Check `DISCORD_BOT_TOKEN` and `DISCORD_GUILD_ID` in `.env`

---

## Tech Stack

- **Frontend:** React 19 + Vite 7 + Tailwind 4
- **Backend:** Node.js + tRPC + Express + Socket.IO
- **Database:** MySQL (via Drizzle ORM)
- **Discord:** discord.js v14
- **Deployment:** Cloudflared tunnel

---

## Features

✅ 8 Casino Games (Provably Fair)  
✅ 5-Tier VIP System  
✅ Real-time Chat  
✅ Discord Integration  
✅ Dual Currency (USD + OSRS GP)  
✅ Tournaments & Challenges  
✅ Referral System  

---

**Need Help?** Check `DEPLOYMENT_STATUS.md` for comprehensive documentation.

🎰 **Happy Gaming!** 🎰
