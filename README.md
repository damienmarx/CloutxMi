# 🎰 CloutScape Casino Platform

**CloutScape** is a professional, feature-rich online casino platform built with modern web technologies. The gaming experience is branded as **Degens♧Den** with an obsidian/gold/black sinister aesthetic.

**Status**: Production Ready | **Version**: 2026.1.0 | **License**: All Rights Reserved © CloutScape Development Team

---

## 🌟 Features

### 🎮 Gaming Suite (7 Games)

| Game | Features | Max Payout |
|------|----------|-----------|
| **Slots 3D** | 5-reel, multiple paylines, OSRS-themed | 500x |
| **Keno** | Pick 2-10 numbers, turbo mode | 500x |
| **Crash** | Real-time multiplier prediction | Variable |
| **Blackjack** | Hit/Stand/Double Down, proper card logic | 2x |
| **Roulette** | 37-number wheel, red/black betting | 36x |
| **Dice** | Over/Under (1.98x), Exact (100x) | 100x |
| **Poker** | Full hand rankings, betting rounds | 500x |

### 💰 Financial System

- **Wallet Management**: Real-time USD balance tracking
- **Deposits & Withdrawals**: Secure fund transfers
- **Player Tips**: Send funds to other players
- **OSRS GP Exchange**: Convert OSRS GP ↔ USD with live rates
- **Atomic Transactions**: Database-level transaction safety

### 👥 Community & Social

- **Live Chat**: Real-time messaging with profanity filtering
- **Rain System**: Random reward distribution to active players
- **User Statistics**: Comprehensive play tracking (wins, losses, ROI, playtime)
- **VIP Program**: 5-tier system (Bronze → Diamond) with cashback and multipliers
- **Leaderboards**: Weekly/monthly rankings

### 🔐 Security & Compliance

- **PBKDF2 Password Hashing**: Industry-standard password security
- **Session Authentication**: Secure cookie-based sessions
- **SQL Injection Prevention**: Parameterized queries via Drizzle ORM
- **CSRF Protection**: Token-based cross-site request forgery prevention
- **Rate Limiting**: API endpoint protection against abuse
- **Atomic Wallet Operations**: Transaction consistency guarantees

### 🎨 Design & UX

- **Theme**: Obsidian background with gold and black accents (Degens Den)
- **Responsive**: Mobile-first design for all screen sizes
- **Animations**: Smooth transitions and interactive elements
- **Professional**: 2026-ready modern casino aesthetic

---

## 🚀 Quick Start

### Prerequisites

- **Ubuntu 20.04+** or compatible Linux distribution
- **Node.js 18+**
- **MySQL 8.0+**
- **pnpm** (or npm)
- **Git**

### Installation

#### Automated Setup (Recommended)

```bash
# Clone repository
git clone https://github.com/No6love9/CloutScape.git
cd CloutScape

# Run automated setup script
sudo bash setup-environment.sh
```

The setup script will:
- ✓ Install Node.js, MySQL, and dependencies
- ✓ Configure environment variables
- ✓ Create and migrate database
- ✓ Validate all features
- ✓ Build the project

#### Manual Setup

```bash
# Clone repository
git clone https://github.com/No6love9/CloutScape.git
cd CloutScape

# Install dependencies
pnpm install

# Configure environment
cp .env.example .env.local
# Edit .env.local with your database URL and secrets

# Run database migrations
pnpm run db:push

# Start development server
pnpm run dev
```

### Access the Application

- **Frontend**: http://localhost:3000
- **API**: http://localhost:3000/api/trpc
- **Database**: Configure in `.env.local`

---

## 📦 Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 18, TypeScript, Vite, TailwindCSS |
| **Backend** | Node.js, Express, tRPC, TypeScript |
| **Database** | MySQL 8.0, Drizzle ORM |
| **Authentication** | Session-based, PBKDF2 hashing |
| **State Management** | React Query (tRPC), Context API |
| **Styling** | TailwindCSS, custom Degens Den theme |
| **Build Tools** | Vite, esbuild |
| **Package Manager** | pnpm |

---

## 📁 Project Structure

```
CloutScape/
├── client/                    # React frontend
│   ├── src/
│   │   ├── pages/            # Game and feature pages
│   │   ├── components/       # Reusable UI components
│   │   ├── styles/           # CSS (including degens-den-theme.css)
│   │   ├── _core/            # Core utilities and hooks
│   │   └── App.tsx           # Main router
│   └── public/               # Static assets
├── server/                    # Node.js backend
│   ├── routers.ts            # tRPC router definitions
│   ├── liveRouter.ts         # Live chat & rain system
│   ├── liveFeatures.ts       # Chat/rain implementation
│   ├── db.ts                 # Database functions
│   ├── auth.ts               # Authentication logic
│   ├── wallet.ts             # Wallet operations
│   ├── gameLogic.ts          # Game calculations
│   └── _core/                # Core server utilities
├── drizzle/                  # Database schema & migrations
│   └── schema.ts             # Drizzle ORM schema
├── docs/                     # Documentation
├── setup-environment.sh       # Automated setup script
├── package.json              # Dependencies
├── tsconfig.json             # TypeScript config
├── vite.config.ts            # Vite config
└── README.md                 # This file
```

---

## 🎮 Game Details

### Slots 3D
- 5-reel slot machine with OSRS-themed symbols
- Multiple payline configurations (1-5 paylines)
- Up to 500x multiplier on winning combinations
- Turbo mode for faster spins

### Keno
- Pick 2-10 numbers from 1-80
- Real-time number drawing
- Turbo mode for instant results
- Payout multiplier based on matches

### Crash
- Real-time multiplier that increases from 1.0x
- Predict when the multiplier will crash
- Cash out before crash for winnings
- Variable payouts based on timing

### Blackjack
- Proper card deck logic with shuffling
- Hit, Stand, and Double Down actions
- Dealer follows standard rules (hit on 16, stand on 17)
- 2x payout on win, push on tie

### Roulette
- 37-number European roulette wheel
- Red/Black, Even/Odd, High/Low betting
- Dozen and Column bets
- 36x payout on single number

### Dice
- Roll 1-100 dice
- Over/Under prediction (1.98x payout)
- Exact number prediction (100x payout)
- Instant results

### Poker
- Full poker hand rankings
- Betting rounds
- Community cards
- Variable payouts based on hand strength

---

## 💬 Live Chat System

### Features
- Real-time messaging with profanity filtering
- User mentions with @username
- Message history (last 50 messages)
- Admin moderation (delete messages, mute users)
- Persistent storage in database

### Access
- Route: `/live-chat`
- Requires authentication
- Auto-refresh every 3 seconds

---

## 🌧️ Rain System

### How It Works
1. **Admin initiates** rain event with total amount and participant count
2. **Amount per player** calculated automatically
3. **Active players** randomly selected to receive rewards
4. **Rewards distributed** to player wallets
5. **Event tracked** in rain history

### Access
- Route: `/rain-system`
- Admin panel for event creation
- User rewards tracking

---

## 👑 VIP Program

### Tier Structure

| Tier | Min Wager | Cashback | Multiplier | Benefits |
|------|-----------|----------|-----------|----------|
| Bronze | $0 | 0.5% | 1.0x | Base access |
| Silver | $5,000 | 1.0% | 1.05x | Increased rewards |
| Gold | $25,000 | 1.5% | 1.1x | Priority support |
| Platinum | $100,000 | 2.0% | 1.15x | Exclusive bonuses |
| Diamond | $500,000 | 3.0% | 1.25x | VIP treatment |

### Access
- Route: `/vip-progress`
- Track tier progression
- View current benefits
- See tier requirements

---

## 📊 User Statistics

### Tracked Metrics
- Total games played
- Total wagered amount
- Total won amount
- Total lost amount
- Net profit/loss
- Win rate percentage
- Return on investment (ROI)
- Favorite game
- Total playtime

### Access
- Route: `/user-stats`
- Real-time updates
- Historical tracking

---

## 🔧 Configuration

### Environment Variables

```bash
# Database
DATABASE_URL=mysql://user:password@localhost:3306/cloutscape

# Security
SESSION_SECRET=<random-32-char-string>
JWT_SECRET=<random-32-char-string>

# Application
NODE_ENV=development
PORT=3000
VITE_API_URL=http://localhost:3000

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
LOG_FILE=./logs/app.log
```

---

## 🛠️ Development

### Available Commands

```bash
# Install dependencies
pnpm install

# Start development server
pnpm run dev

# Build for production
pnpm run build

# Run production build
pnpm run preview

# Database migrations
pnpm run db:push
pnpm run db:generate

# Type checking
pnpm run type-check

# Linting
pnpm run lint

# Format code
pnpm run format
```

---

## 📚 API Documentation

### Authentication Endpoints

```typescript
// Register new user
POST /api/trpc/auth.register
{ username, email, password, confirmPassword }

// Login
POST /api/trpc/auth.login
{ username, password }

// Get current user
GET /api/trpc/auth.me

// Logout
POST /api/trpc/auth.logout

// Forgot password
POST /api/trpc/auth.forgotPassword
{ email }

// Reset password
POST /api/trpc/auth.resetPassword
{ token, newPassword, confirmPassword }
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

// Tip player
POST /api/trpc/wallet.tip
{ toUsername, amount }

// Transaction history
GET /api/trpc/wallet.getTransactionHistory
{ limit? }
```

### Game Endpoints

```typescript
// Play Keno
POST /api/trpc/games.playKeno
{ selectedNumbers, betAmount, turboMode? }

// Play Slots
POST /api/trpc/games.playSlots
{ betAmount, paylines }

// Play Crash
POST /api/trpc/games.playCrash
{ betAmount, prediction }

// Play Blackjack
POST /api/trpc/games.playBlackjack
{ betAmount, playerHand, dealerHand, result }

// Play Roulette
POST /api/trpc/games.playRoulette
{ betAmount, prediction, targetNumber }

// Play Dice
POST /api/trpc/games.playDice
{ betAmount, prediction, targetNumber }

// Play Poker
POST /api/trpc/games.playPoker
{ betAmount, hand }
```

### Live System Endpoints

```typescript
// Send chat message
POST /api/trpc/live.chat.sendMessage
{ message, mentions? }

// Get chat history
GET /api/trpc/live.chat.getHistory
{ limit? }

// Start rain event (admin)
POST /api/trpc/live.rain.startEvent
{ totalAmount, participantCount }

// Get rain history
GET /api/trpc/live.rain.getHistory
{ limit? }

// Get user rain rewards
GET /api/trpc/live.rain.getUserRewards
```

---

## 🔒 Security Best Practices

1. **Always use HTTPS** in production
2. **Keep dependencies updated**: `pnpm update`
3. **Rotate secrets regularly**: Update SESSION_SECRET and JWT_SECRET
4. **Enable rate limiting**: Configured by default
5. **Monitor logs**: Check `./logs/app.log` regularly
6. **Database backups**: Implement regular MySQL backups
7. **Input validation**: All inputs validated server-side
8. **CORS configuration**: Restrict to trusted origins

---

## 🐛 Troubleshooting

### Database Connection Issues
```bash
# Test MySQL connection
mysql -h localhost -u root -p cloutscape

# Check DATABASE_URL format
cat .env.local | grep DATABASE_URL
```

### Port Already in Use
```bash
# Change port in .env.local
PORT=3001

# Or kill process using port 3000
lsof -ti:3000 | xargs kill -9
```

### Build Failures
```bash
# Clear cache and reinstall
rm -rf node_modules pnpm-lock.yaml
pnpm install
pnpm run build
```

### Database Migration Issues
```bash
# Push schema to database
pnpm run db:push

# Generate migration files
pnpm run db:generate
```

---

## 📞 Support & Contact

For issues, feature requests, or contributions:

- **GitHub Issues**: https://github.com/No6love9/CloutScape/issues
- **Email**: support@cloutscape.org
- **Documentation**: See `/docs` directory

---

## 📄 License

All rights reserved © CloutScape Development Team 2026

This project is proprietary and confidential. Unauthorized copying, modification, or distribution is prohibited.

---

## 🎯 Roadmap

- [x] 7 casino games with proper logic
- [x] Live chat system
- [x] Rain reward system
- [x] VIP tier system
- [x] User statistics dashboard
- [x] Blackjack card logic upgrade
- [ ] Leaderboard system implementation
- [ ] Advanced analytics dashboard
- [ ] Mobile app (React Native)
- [ ] Blockchain integration
- [ ] Multi-language support
- [ ] Tournament system
- [ ] Streaming integration

---

## 🙏 Acknowledgments

Built with modern web technologies and best practices for a professional casino platform experience.

**Version**: 2026.1.0 | **Last Updated**: February 2026 | **Status**: Production Ready ✅
