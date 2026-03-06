# 🎰 CloutScape - Luxury Crypto Casino Platform 2026

<div align="center">

![CloutScape Logo](client/public/cloutscape-hero.jpg)

### **The Ultimate Crypto Casino Experience**  
_Luxury Obsidian Glassware Edition_

[![License: MIT](https://img.shields.io/badge/License-MIT-gold.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)](https://nodejs.org/)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](http://makeapullrequest.com)

[🎮 Live Demo](https://cloutscape.org) • [📖 Documentation](#documentation) • [🚀 Quick Start](#quick-start) • [💎 Features](#features)

</div>

---

## ✨ Overview

**CloutScape** is a production-ready, feature-rich cryptocurrency casino platform built with cutting-edge web technologies. Experience the luxury of obsidian black aesthetics combined with gold accents, glassmorphism effects, and 3D animations.

### 🎯 Key Highlights

- **7 Provably Fair Games** - Slots 3D, Keno, Crash, Blackjack, Roulette, Dice, Classic Slots
- **Luxury Obsidian Theme** - Stunning glassmorphism with gold gradients and neon glows
- **Real-Time Features** - Live chat, rain system, leaderboards
- **Crypto Integration** - Full wallet management and OSRS GP exchange
- **VIP Tier System** - 5-tier progression with cashback and multipliers
- **One-Click Deployment** - Easy setup with automated scripts
- **Cloudflare Tunnel** - Secure HTTPS deployment to cloutscape.org

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18+ ([Download](https://nodejs.org/))
- **MySQL** 5.7+ or 8.0+
- **pnpm** 10.4+
- **Git**

### One-Click Installation

```bash
# Clone the repository
git clone https://github.com/damienmarx/CloutxMi.git
cd CloutxMi

# Run one-click deployment
chmod +x deploy-one-click.sh
./deploy-one-click.sh
```

The script will automatically:
- ✅ Check system requirements
- ✅ Set up MySQL database
- ✅ Install dependencies
- ✅ Run database migrations
- ✅ Build the application
- ✅ Install Cloudflared
- ✅ Create systemd service
- ✅ Start the application

### Manual Installation

```bash
# 1. Install dependencies
pnpm install

# 2. Configure environment
cp .env.example .env
# Edit .env with your database credentials

# 3. Set up database
mysql -u root -p
CREATE DATABASE cloutscape_db;
CREATE USER 'cloutscape_user'@'localhost' IDENTIFIED BY 'your_password';
GRANT ALL PRIVILEGES ON cloutscape_db.* TO 'cloutscape_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;

# 4. Run migrations
pnpm db:push

# 5. Start development server
pnpm dev

# 6. Build for production
pnpm build

# 7. Start production server
pnpm start
```

---

## 💎 Features

### 🎮 Gaming Suite

| Game | Description | RTP | Volatility | Features |
|------|-------------|-----|------------|----------|
| **3D Slots** | Immersive 3D OSRS-themed slots | 98.5% | Extreme | 5 reels, multiple paylines, up to 500x |
| **Keno** | Pick 2-10 numbers from 1-80 | 96.0% | High | Turbo mode, instant results |
| **Crash** | Multiplier prediction game | 97.0% | Extreme | Real-time, variable payouts |
| **Blackjack** | Classic card game | 99.5% | Low | Hit/Stand/Double Down |
| **Roulette** | 37-number European wheel | 97.3% | Medium | Red/Black, Dozens, Columns |
| **Dice** | Roll prediction game | 98.0% | High | Over/Under (1.98x), Exact (100x) |
| **Classic Slots** | Traditional slot machine | 96.5% | Medium | Multi-payline |

### 💰 Financial System

- **Wallet Management** - Real-time USD balance tracking
- **Deposits & Withdrawals** - Secure fund transfers
- **Player Tips** - Send funds to other players
- **OSRS GP Exchange** - Convert OSRS GP ↔ USD with live rates
- **Atomic Transactions** - Database-level safety
- **Transaction History** - Complete audit trail

### 👥 Community Features

- **Live Chat** - Real-time messaging with profanity filter
- **Rain System** - Random reward distribution to active players
- **Leaderboards** - Weekly/monthly rankings
- **User Statistics** - Comprehensive play tracking
- **Referral System** - Earn commissions from referrals
- **Tournaments** - Competitive events with prize pools

### 👑 VIP Program

| Tier | Min Wager | Cashback | Multiplier | Benefits |
|------|-----------|----------|------------|----------|
| 💎 Diamond | $500,000 | 3.0% | 1.25x | VIP treatment + all perks |
| 🌟 Platinum | $100,000 | 2.0% | 1.15x | Exclusive bonuses |
| 🥇 Gold | $25,000 | 1.5% | 1.1x | Priority support |
| 🥈 Silver | $5,000 | 1.0% | 1.05x | Increased rewards |
| 🥉 Bronze | $0 | 0.5% | 1.0x | Base access |

### 🔒 Security & Compliance

- **PBKDF2 Password Hashing** - Industry-standard security
- **Session Authentication** - Secure cookie-based sessions
- **SQL Injection Prevention** - Parameterized queries
- **CSRF Protection** - Token-based security
- **Rate Limiting** - API abuse prevention
- **2FA Support** - Two-factor authentication
- **Self-Exclusion** - Responsible gambling features
- **Age Verification** - Compliance checks

### 🎨 Design & UX

- **Luxury Obsidian Theme** - Deep black with gold accents
- **Glassmorphism** - Frosted glass effects with backdrop blur
- **3D Animations** - Tilted modular cards with perspective
- **Gold Gradients** - Premium color schemes
- **Neon Glows** - Interactive element highlighting
- **Smooth Transitions** - Cubic-bezier animations
- **Particle Effects** - Ambient background animations
- **Responsive Design** - Mobile-first approach
- **Custom Scrollbars** - Gold gradient styling
- **Luxury Fonts** - Playfair Display, Cinzel, Montserrat

---

## 📦 Tech Stack

### Frontend
- **React 19** - Latest React with concurrent features
- **TypeScript** - Type-safe development
- **Vite 7** - Lightning-fast build tool
- **TailwindCSS 4** - Utility-first CSS framework
- **Framer Motion** - Advanced animations
- **Wouter** - Lightweight routing
- **tRPC** - End-to-end type-safe APIs

### Backend
- **Node.js** - JavaScript runtime
- **Express** - Web framework
- **tRPC** - Type-safe RPC framework
- **Socket.IO** - Real-time communication
- **MySQL** - Relational database
- **Drizzle ORM** - Type-safe database access

### Infrastructure
- **Cloudflare Tunnel** - Secure HTTPS access
- **Systemd** - Service management
- **pnpm** - Fast, disk space efficient package manager

---

## 📁 Project Structure

```
CloutScape/
├── client/                    # React frontend
│   ├── src/
│   │   ├── pages/            # Game and feature pages
│   │   ├── components/       # Reusable UI components
│   │   ├── styles/           # CSS and themes
│   │   ├── _core/            # Core utilities
│   │   └── App.tsx           # Main application
│   └── public/               # Static assets
├── server/                    # Node.js backend
│   ├── _core/                # Core server utilities
│   ├── routers/              # tRPC routers
│   ├── db.ts                 # Database functions
│   ├── auth.ts               # Authentication
│   ├── wallet.ts             # Wallet operations
│   └── gameLogic.ts          # Game calculations
├── drizzle/                  # Database schema & migrations
│   └── schema.ts             # Drizzle ORM schema
├── shared/                   # Shared types & constants
├── scripts/                  # Utility scripts
├── deploy-one-click.sh       # One-click deployment
├── cloudflared-config.yml    # Cloudflare Tunnel config
└── package.json              # Dependencies
```

---

## 🌐 Deployment

### Cloudflare Tunnel Setup

```bash
# 1. Login to Cloudflare
cloudflared tunnel login

# 2. Create tunnel
cloudflared tunnel create cloutscape-prod

# 3. Route DNS
cloudflared tunnel route dns cloutscape-prod cloutscape.org
cloudflared tunnel route dns cloutscape-prod www.cloutscape.org

# 4. Start tunnel
cloudflared tunnel run cloutscape-prod

# Or install as service
sudo cloudflared service install
sudo systemctl start cloudflared
```

### Service Management

```bash
# View logs
journalctl -u cloutscape -f

# Restart application
sudo systemctl restart cloutscape

# Stop application
sudo systemctl stop cloutscape

# Check status
sudo systemctl status cloutscape
```

---

## 🔧 Configuration

### Environment Variables

Key environment variables in `.env`:

```env
# Database
DATABASE_URL=mysql://user:password@localhost:3306/cloutscape_db

# Security
JWT_SECRET=your_jwt_secret_key
ENCRYPTION_KEY=your_encryption_key
SESSION_SECRET=your_session_secret

# Application
NODE_ENV=production
PORT=3000

# Cloudflare
CLOUDFLARE_API_KEY=your_cloudflare_api_key
CLOUDFLARE_DOMAIN=cloutscape.org
```

### Game Configuration

Adjust game settings in `.env`:

```env
GAME_MIN_BET=0.01
GAME_MAX_BET=10000
GAME_HOUSE_EDGE=0.02
```

---

## 🧪 Development

### Available Commands

```bash
# Development
pnpm dev              # Start dev server
pnpm build            # Build for production
pnpm start            # Start production server

# Database
pnpm db:push          # Run migrations
pnpm db:generate      # Generate migrations

# Code Quality
pnpm check            # TypeScript check
pnpm format           # Format code
pnpm test             # Run tests
```

### Development Workflow

1. Start development server: `pnpm dev`
2. Frontend runs on: `http://localhost:5173`
3. Backend API: `http://localhost:3000/api/trpc`
4. Hot reload enabled for both frontend and backend

---

## 📊 API Documentation

### Authentication Endpoints

```typescript
// Register
POST /api/trpc/auth.register
{ username, email, password, confirmPassword }

// Login
POST /api/trpc/auth.login
{ username, password }

// Get current user
GET /api/trpc/auth.me

// Logout
POST /api/trpc/auth.logout
```

### Wallet Endpoints

```typescript
// Get balance
GET /api/trpc/wallet.getBalance

// Deposit funds
POST /api/trpc/wallet.deposit
{ amount }

// Withdraw funds
POST /api/trpc/wallet.withdraw
{ amount }

// Transfer to player
POST /api/trpc/wallet.tip
{ toUsername, amount }
```

### Game Endpoints

```typescript
// Play game
POST /api/trpc/games.play{GameName}
{ betAmount, ...gameSpecificData }

// Get game history
GET /api/trpc/games.getHistory
{ gameType?, limit? }

// Verify fairness
POST /api/trpc/games.verifyFairness
{ gameId }
```

---

## 🛠️ Troubleshooting

### Database Connection Issues

```bash
# Test MySQL connection
mysql -h localhost -u cloutscape_user -p cloutscape_db

# Check DATABASE_URL format
cat .env | grep DATABASE_URL
```

### Port Already in Use

```bash
# Change port in .env
PORT=3001

# Or kill process using port
lsof -ti:3000 | xargs kill -9
```

### Build Failures

```bash
# Clear cache and reinstall
rm -rf node_modules pnpm-lock.yaml
pnpm install
pnpm build
```

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- Built with modern web technologies and best practices
- Inspired by luxury design principles
- Powered by the crypto community

---

## 📞 Support

- **GitHub Issues**: [Report a bug](https://github.com/damienmarx/CloutxMi/issues)
- **Email**: support@cloutscape.org
- **Domain**: [cloutscape.org](https://cloutscape.org)

---

<div align="center">

**Made with 💎 by CloutScape Team**

[⬆ Back to Top](#-cloutscape---luxury-crypto-casino-platform-2026)

</div>
