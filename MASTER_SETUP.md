# 🎰 CloutScape Master Setup Guide

## 🚀 Ultra-Quick Launch (Ubuntu)

```bash
git clone https://github.com/damienmarx/CloutxMi.git cloutscape && cd cloutscape && chmod +x deploy-production.sh && ./deploy-production.sh
```

**That's literally it!** The script does EVERYTHING automatically.

---

## 📋 What Gets Installed

✅ Node.js 22
✅ pnpm package manager  
✅ MySQL 8.0 database
✅ All application dependencies
✅ CloutScape application (built)
✅ Systemd service
✅ Cloudflared tunnel client
✅ Log rotation
✅ Security hardening

---

## ☁️ Step 2: Connect to cloutscape.org

After deployment script completes:

```bash
# 1. Login to Cloudflare
cloudflared tunnel login

# 2. Create tunnel
cloudflared tunnel create cloutscape-prod

# 3. Route DNS
cloudflared tunnel route dns cloutscape-prod cloutscape.org
cloudflared tunnel route dns cloutscape-prod www.cloutscape.org

# 4. Install as service
sudo cloudflared service install
sudo systemctl start cloudflared
sudo systemctl enable cloudflared
```

**Done!** Visit https://cloutscape.org 🎉

---

## 🤖 Step 3: Discord Bot Setup

### Create Discord Bot

1. Go to https://discord.com/developers/applications
2. Click "New Application" → Name it "CloutScape Bot"
3. Go to "Bot" tab → Click "Add Bot"
4. Under "Privileged Gateway Intents", enable:
   - ✅ Server Members Intent
   - ✅ Message Content Intent
5. Click "Reset Token" → Copy the token

### Add Bot to Server

1. Go to "OAuth2" → "URL Generator"
2. Select Scopes:
   - ✅ bot
3. Select Bot Permissions:
   - ✅ Administrator (or customize)
4. Copy URL at bottom
5. Paste in browser → Select your server → Authorize

### Configure Bot

Edit `/app/.env`:

```env
DISCORD_BOT_TOKEN=your_bot_token_here
DISCORD_GUILD_ID=your_server_id_here
```

Get Server ID: Right-click your server → Copy Server ID (enable Developer Mode in Discord settings first)

### Auto-Setup Server

In your Discord server, type:
```
!clout setup
```

The bot will:
- 🗑️ Delete old channels
- 📢 Create Information category (rules, announcements, how-to-play)
- 🎰 Create Casino category (general, big-wins, leaderboards, strategy)
- 💰 Create Payments category (deposits, withdrawals, rain-drops)
- 👑 Create VIP Lounges (Diamond, Platinum, Gold)
- 🎧 Create Voice Channels
- 🛠️ Create Support category (tickets, faq)
- 👥 Create luxury roles (Diamond VIP, Platinum VIP, etc.)
- 🔒 Set up permissions

**Your Discord is now CloutScape-themed!**

### Bot Commands

- `!clout setup` - Setup/reset server structure
- `!clout balance` - Check your balance
- `!clout deposit` - Get deposit info
- `!clout help` - Show all commands

---

## 💳 Step 4: Payment Processing

### Option A: Universal Wallet (Recommended)

**Your Crypto Wallets** (add to `/app/.env`):

```env
# Bitcoin
BITCOIN_WALLET=your_btc_address_here

# Ethereum & ERC-20
ETHEREUM_WALLET=your_eth_address_here

# BNB & BEP-20
BNB_WALLET=your_bnb_address_here

# Solana
SOLANA_WALLET=your_sol_address_here

# OSRS GP (your RSN)
OSRS_USERNAME=YourRSN
```

Users deposit to these addresses, then you manually credit their accounts.

### Option B: Automated Payment API

Install payment processor:

```bash
npm install --save coinbase-commerce-node
```

Add to `/app/.env`:

```env
COINBASE_COMMERCE_API_KEY=your_api_key_here
COINBASE_COMMERCE_WEBHOOK_SECRET=your_webhook_secret
```

Supported: BTC, ETH, LTC, BCH, USDC, USDT, DAI

### Manual Payment Flow

1. User clicks "Deposit" → shown your wallet address
2. User sends crypto → takes screenshot/tx hash
3. User sends to Discord `#deposits` channel OR support email
4. You verify transaction
5. You credit user account via admin panel

### Backup Payment (Discord)

If main site is down, users can pay via Discord:

1. User DMs bot with payment proof
2. Bot forwards to admin channel
3. Admin credits account manually

---

## 🎮 Step 5: Configure Games

Edit `/app/.env`:

```env
# Game Limits
GAME_MIN_BET=0.01
GAME_MAX_BET=10000.00

# House Edge (2% = 0.02)
GAME_HOUSE_EDGE=0.02

# Big Win Threshold (notify in Discord)
BIG_WIN_THRESHOLD=500.00

# VIP Tiers
VIP_BRONZE_MIN_WAGER=0
VIP_SILVER_MIN_WAGER=5000
VIP_GOLD_MIN_WAGER=25000
VIP_PLATINUM_MIN_WAGER=100000
VIP_DIAMOND_MIN_WAGER=500000
```

Restart application:
```bash
sudo systemctl restart cloutscape
```

---

## 🔒 Step 6: Security Hardening

### Change Default Passwords

Edit `/app/.env`:

```env
# Generate with: openssl rand -hex 32
JWT_SECRET=your_new_32_char_random_string
ENCRYPTION_KEY=your_new_32_char_random_string
SESSION_SECRET=your_new_32_char_random_string

# Database password
DATABASE_URL=mysql://cloutscape_user:YOUR_NEW_PASSWORD@localhost:3306/cloutscape_db
```

Update MySQL password:
```bash
sudo mysql
ALTER USER 'cloutscape_user'@'localhost' IDENTIFIED BY 'YOUR_NEW_PASSWORD';
FLUSH PRIVILEGES;
EXIT;
```

### Enable Firewall

```bash
sudo ufw allow 22    # SSH
sudo ufw allow 80    # HTTP (Cloudflare)
sudo ufw allow 443   # HTTPS (Cloudflare)
sudo ufw enable
```

### Set Up Backups

```bash
mkdir -p /app/backups
nano /app/scripts/backup.sh
```

Add:
```bash
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
mysqldump -u cloutscape_user -pYOUR_PASSWORD cloutscape_db > /app/backups/db_$DATE.sql
find /app/backups -name "db_*.sql" -mtime +7 -delete
```

Schedule:
```bash
chmod +x /app/scripts/backup.sh
crontab -e
# Add: 0 2 * * * /app/scripts/backup.sh
```

---

## 👑 Step 7: Create Admin Account

1. Visit https://cloutscape.org/register
2. Register with your email
3. Access database:
   ```bash
   mysql -u cloutscape_user -p cloutscape_db
   ```
4. Make yourself admin:
   ```sql
   UPDATE users SET role='admin' WHERE email='your@email.com';
   EXIT;
   ```

---

## 📊 Monitoring & Management

### Real-Time Logs

```bash
# Application logs
sudo journalctl -u cloutscape -f

# Cloudflare tunnel logs
sudo journalctl -u cloudflared -f

# MySQL logs
sudo tail -f /var/log/mysql/error.log
```

### Service Control

```bash
# Restart app
sudo systemctl restart cloutscape

# Restart tunnel
sudo systemctl restart cloudflared

# Restart MySQL
sudo systemctl restart mysql

# Check status
sudo systemctl status cloutscape
```

### Database Management

```bash
# Access database
mysql -u cloutscape_user -p cloutscape_db

# View recent bets
SELECT * FROM transactions ORDER BY createdAt DESC LIMIT 10;

# View user balances
SELECT u.username, w.balance FROM users u JOIN wallets w ON u.id = w.userId ORDER BY w.balance DESC LIMIT 10;

# View VIP status
SELECT u.username, v.tier, v.totalWagered FROM users u JOIN vipTiers v ON u.id = v.userId ORDER BY v.totalWagered DESC;
```

---

## 🎁 Step 8: Referral System Setup

### Enable Referrals

Add to `/app/.env`:

```env
REFERRAL_ENABLED=true
REFERRAL_COMMISSION=0.05  # 5% commission
REFERRAL_TIER_1=0.05      # Direct referrals: 5%
REFERRAL_TIER_2=0.02      # 2nd level: 2%
REFERRAL_TIER_3=0.01      # 3rd level: 1%
```

### How It Works

1. User gets unique referral link: `https://cloutscape.org?ref=USERNAME`
2. New users sign up via link
3. Referrer earns commission on ALL wagers
4. Commission paid weekly/monthly (configurable)

### Tracking Referrals

```sql
-- View top referrers
SELECT 
    u.username,
    COUNT(r.id) as referrals,
    SUM(r.totalCommission) as earned
FROM users u 
JOIN referrals r ON u.id = r.referrerId
GROUP BY u.id
ORDER BY earned DESC
LIMIT 10;
```

---

## 🚨 Troubleshooting

### Site Not Accessible

```bash
# Check if app is running
sudo systemctl status cloutscape

# Check tunnel
sudo systemctl status cloudflared

# View errors
sudo journalctl -u cloutscape -n 100
sudo journalctl -u cloudflared -n 100
```

### Database Errors

```bash
# Test connection
mysql -u cloutscape_user -p cloutscape_db

# Check MySQL status
sudo systemctl status mysql

# View MySQL errors
sudo tail -f /var/log/mysql/error.log
```

### Build Failures

```bash
cd /app
rm -rf node_modules .pnpm-store
pnpm install
pnpm build
sudo systemctl restart cloutscape
```

### Discord Bot Not Responding

1. Check token is correct in `.env`
2. Check bot has required intents enabled
3. Verify bot is in your server
4. Check bot logs:
   ```bash
   sudo journalctl -u cloutscape -f | grep Discord
   ```

---

## 📈 Growth & Scaling

### When You Get More Traffic

1. **Upgrade MySQL**
   ```bash
   sudo nano /etc/mysql/mysql.conf.d/mysqld.cnf
   ```
   Add:
   ```ini
   innodb_buffer_pool_size = 4G
   max_connections = 500
   ```

2. **Add More Memory to Node**
   Edit `/etc/systemd/system/cloutscape.service`:
   ```ini
   Environment=NODE_OPTIONS=--max-old-space-size=8192
   ```

3. **Use Redis for Sessions**
   ```bash
   sudo apt-get install redis-server
   ```

4. **Set Up Load Balancer**
   Run multiple instances behind nginx

---

## 💎 Premium Features

### Add Affiliate Dashboard

Users can track:
- Total referrals
- Commission earned
- Referral activity
- Payout history

### Add Tournament System

- Scheduled events
- Entry fees
- Prize pools
- Leaderboards

### Add Live Streaming

Integrate Twitch/YouTube for:
- Stream embedded in site
- Streamer bonus codes
- Live bet tracking

---

## 📞 Support Channels

- **Email**: support@cloutscape.org
- **Discord**: Your server
- **GitHub**: https://github.com/damienmarx/CloutxMi/issues

---

## ✅ Launch Checklist

Before going live:

- [ ] Application builds successfully
- [ ] Database is created and migrated
- [ ] Service starts automatically
- [ ] Cloudflare tunnel connected
- [ ] https://cloutscape.org loads
- [ ] Discord bot is online
- [ ] Discord server is themed
- [ ] Admin account created
- [ ] Game limits configured
- [ ] Payment wallets added
- [ ] Backups scheduled
- [ ] Firewall enabled
- [ ] SSL working (Cloudflare)
- [ ] Legal disclaimers visible
- [ ] DEGEN BOX functional
- [ ] Referral links working
- [ ] All 7 games tested
- [ ] Provably fair verification working

---

## 🎰 You're Live!

```
        ⭐ CLOUTSCAPE IS RUNNING ⭐
        
   💎 Domain: https://cloutscape.org
   🎮 Games: 7 provably fair games  
   🤖 Discord: Automated & themed
   💰 Payments: Ready for deposits
   🔒 Security: Hardened & compliant
   📈 Monitoring: Active
   
   START MAKING THAT CRYPTO! 🚀
```

---

**Need help? Check logs first:**
```bash
sudo journalctl -u cloutscape -f
```

**Happy gaming! 🎲💎✨**
