# Degens¤Den — The Vault Where Degens Become Legends

> **"The ultimate 2026 luxury crypto casino. Provably fair. Instant payouts. 5-tier VIP."**

[![Build Status](https://img.shields.io/badge/build-passing-brightgreen)]()
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue)]()
[![License](https://img.shields.io/badge/license-MIT-gold)]()

---

## Overview

Degens¤Den is a premium, fully provably fair crypto casino platform. Every game result can be independently verified using HMAC-SHA256. Built with a modern monorepo stack: React + Vite + tRPC + Socket.IO + Drizzle + MySQL.

**Domain**: `cloutscape.org`

---

## Features

### Games (MVP — Production Ready)
| Game | Status | Provably Fair | Max Multiplier |
|------|--------|--------------|----------------|
| **Dice** | ✅ Done | ✅ HMAC-SHA256 | 100x (Exact) |
| **Crash** | ✅ Done | ✅ HMAC-SHA256 | 1000x |
| **Plinko** | ✅ Done | ✅ HMAC-SHA256 | 110x (High risk) |
| Keno | ✅ Backend | ✅ HMAC-SHA256 | 2500x |
| 3D Slots | 🔄 Legacy | Planned | — |
| Blackjack | 🔄 Legacy | Planned | — |
| Roulette | 🔄 Legacy | Planned | — |

### Platform
- **¤ Fairness Lab** — Interactive verifier with animated hash visualizer
- **5-Tier VIP** — Bronze → Silver → Gold → Platinum → Diamond
- **Real-time Chat** — Socket.IO powered live chat + rain system
- **Dual Currency** — USD + OSRS GP with live exchange rates
- **Full Transaction Audit** — Every wallet operation logged
- **Responsible Gaming** — Self-exclusion (DEGEN BOX), age gate, limits
- **2FA / MFA** — TOTP + backup codes
- **Discord Bot** — Optional (configure `DISCORD_BOT_TOKEN` + `DISCORD_GUILD_ID`)

---

## Stack

```
client/     React 19 + Vite 7 + Tailwind 4 + Framer Motion 12
server/     Node.js + tRPC + Socket.IO + Express
drizzle/    Drizzle ORM + MySQL
shared/     Shared types, constants, validation
scripts/    Deployment + Docker + Cloudflare Tunnel
```

---

## Quick Start

### 🚀 One-Command Deployment (Recommended)

```bash
git clone https://github.com/damienmarx/CloutxMi.git
cd CloutxMi
git checkout degens-den-complete
chmod +x quick-deploy.sh
./quick-deploy.sh
```

This automatically installs everything and starts all services!

### Development

```bash
# 1. Install dependencies
pnpm install

# 2. Copy environment config
cp .env.example .env
# Edit .env with your MySQL credentials and Discord bot token

# 3. Run database migrations
pnpm db:push

# 4. Start dev server (frontend + backend)
pnpm dev
```

Frontend: `http://localhost:5173`
Backend API: `http://localhost:3000/api`

### Production (Manual)

```bash
# Automated setup with health checks
sudo bash aio.sh

# Or with Cloudflare Tunnel
./pull-and-deploy.sh
```

### Check Status

```bash
bash check-status.sh
```

---

## Environment Variables

See `.env.example` for full list. Required:

```bash
DATABASE_URL=mysql://user:pass@localhost:3306/cloutscape_db
JWT_SECRET=your-very-long-random-secret-min-32-chars
SESSION_SECRET=your-session-secret

# Optional — Discord Bot
DISCORD_BOT_TOKEN=your-discord-bot-token
DISCORD_GUILD_ID=your-guild-id
```

---

## Provably Fair System

Every game uses **HMAC-SHA256** with:
1. `serverSeed` — generated server-side, committed via SHA-256 hash before bet
2. `clientSeed` — provided by player (or auto-generated)  
3. `nonce` — increments per bet for uniqueness

```
hash = HMAC-SHA256(serverSeed, "{clientSeed}:{nonce}")
result = parseInt(hash[0..8], 16) % gameRange
```

Verify any result in the **¤ Fairness Lab** (`/verifier`).

---

## Design System

See `DESIGN_SYSTEM.md` for full component documentation.

**Colors**: Obsidian black `#080808` + Gold `#FFD700`  
**Fonts**: Space Grotesk (headings) + Satoshi (body) + Inter (UI)  
**Glass Cards**: `backdrop-blur(20px)` + `rgba(14,14,22,0.75)` + gold neon border

---

## Branch

`degens-den-complete` — main development branch for this rebrand

---

## License

MIT © 2026 Degens¤Den
