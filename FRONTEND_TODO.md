# 🎮 CLOUTSCAPE/DEGENS DEN - COMPLETE FRONTEND IMPLEMENTATION

## ✅ DICE PAGE - COMPLETE

**File**: `/app/client/src/pages/Dice.tsx` ✅

**Features**:
- Bet amount input with 1/2, 2x, $100 quick buttons
- Dual currency support (crypto/GP toggle)
- 4 prediction modes: High (>50), Low (<50), Mid (45-55), Exact (1-100)
- Real-time balance display
- Animated dice roll result
- Win/loss animations
- Multiplier display (1.98x, 9.0x, 100x)
- Provably Fair sidebar integration
- Professional gradient design
- Mobile responsive

## 📋 REMAINING PAGES TO CREATE

### 1. CRASH (`/pages/Crash.tsx`)
```tsx
- Real-time multiplier graph
- Cashout button (live)
- Auto-cashout option
- Crash point display
- Betting controls
- Provably fair sidebar
- Animation: Rising multiplier then crash
```

### 2. KENO (`/pages/Keno.tsx`)
```tsx
- 40-number grid (1-40)
- Click to select 2-10 numbers
- Draw animation (10 numbers)
- Match highlighting
- Payout table display
- Quick pick button
- Clear selection
- Provably fair sidebar
```

### 3. PLINKO (`/pages/Plinko.tsx`)
```tsx
- Animated plinko board (16 levels)
- Ball drop animation
- Risk selector (Low/Medium/High)
- 17 buckets with multipliers
- Ball bounce physics
- Sound effects
- Provably fair sidebar
```

### 4. SLOTS (`/pages/Slots.tsx`)
```tsx
- 5 reels x 3 rows
- Spin animation
- Sound effects (reel spin, win)
- Payline highlighting
- Auto-spin feature
- Max bet button
- Win celebration
- Provably fair sidebar
```

### 5. BLACKJACK (`/pages/Blackjack.tsx`)
```tsx
- Card dealing animation
- Hit/Stand/Double Down/Split
- Dealer AI
- Hand value display
- Insurance option
- Blackjack 3:2 payout
- Multiple hands support
- Provably fair sidebar
```

### 6. ROULETTE (`/pages/Roulette.tsx`)
```tsx
- Animated roulette wheel
- Full betting board
- Inside bets (straight, split, street, corner)
- Outside bets (red/black, odd/even, dozens, columns)
- Chip placement animation
- Wheel spin + ball drop
- Win highlighting
- Provably fair sidebar
```

---

## 🎨 PROFESSIONAL GAME ICONS (NO EMOJIS)

Update `/app/client/src/pages/Home.tsx`:

```tsx
import { Dices, TrendingUp, Grid3x3, Triangle, Rows, Spade, Circle } from 'lucide-react';

const games = [
  { 
    id: "dice", 
    name: "Dice", 
    icon: <Dices className="w-12 h-12" />,
    path: "/dice" 
  },
  { 
    id: "crash", 
    name: "Crash", 
    icon: <TrendingUp className="w-12 h-12" />,
    path: "/crash" 
  },
  { 
    id: "keno", 
    name: "Keno", 
    icon: <Grid3x3 className="w-12 h-12" />,
    path: "/keno" 
  },
  { 
    id: "plinko", 
    name: "Plinko", 
    icon: <Triangle className="w-12 h-12" />,
    path: "/plinko" 
  },
  { 
    id: "slots", 
    name: "Slots", 
    icon: <Rows className="w-12 h-12" />,
    path: "/slots" 
  },
  { 
    id: "blackjack", 
    name: "Blackjack", 
    icon: <Spade className="w-12 h-12" />,
    path: "/blackjack" 
  },
  { 
    id: "roulette", 
    name: "Roulette", 
    icon: <Circle className="w-12 h-12" />,
    path: "/roulette" 
  },
];
```

---

## 🔌 BACKEND INTEGRATION

### tRPC Router (`/server/routers/games.ts`):

```typescript
import { z } from 'zod';
import { router, protectedProcedure } from '../trpc';
import { processBet } from '../gameEngine';

export const gamesRouter = router({
  // Dice
  playDice: protectedProcedure
    .input(z.object({
      betAmount: z.number().min(0.01).max(10000),
      currency: z.enum(['crypto', 'gp']),
      gameData: z.object({
        prediction: z.enum(['high', 'low', 'mid', 'exact']),
        target: z.number().min(1).max(100).optional()
      })
    }))
    .mutation(async ({ ctx, input }) => {
      return await processBet({
        userId: ctx.user.id,
        gameType: 'dice',
        betAmount: input.betAmount,
        currency: input.currency,
        gameData: input.gameData
      });
    }),

  // Crash
  playCrash: protectedProcedure
    .input(z.object({
      betAmount: z.number().min(0.01).max(10000),
      currency: z.enum(['crypto', 'gp']),
      gameData: z.object({
        cashoutAt: z.number().min(1.01).max(100)
      })
    }))
    .mutation(async ({ ctx, input }) => {
      return await processBet({
        userId: ctx.user.id,
        gameType: 'crash',
        betAmount: input.betAmount,
        currency: input.currency,
        gameData: input.gameData
      });
    }),

  // Keno
  playKeno: protectedProcedure
    .input(z.object({
      betAmount: z.number().min(0.01).max(10000),
      currency: z.enum(['crypto', 'gp']),
      gameData: z.object({
        pickedNumbers: z.array(z.number().min(1).max(40)).min(2).max(10)
      })
    }))
    .mutation(async ({ ctx, input }) => {
      return await processBet({
        userId: ctx.user.id,
        gameType: 'keno',
        betAmount: input.betAmount,
        currency: input.currency,
        gameData: input.gameData
      });
    }),

  // Plinko
  playPlinko: protectedProcedure
    .input(z.object({
      betAmount: z.number().min(0.01).max(10000),
      currency: z.enum(['crypto', 'gp']),
      gameData: z.object({
        risk: z.enum(['low', 'medium', 'high'])
      })
    }))
    .mutation(async ({ ctx, input }) => {
      return await processBet({
        userId: ctx.user.id,
        gameType: 'plinko',
        betAmount: input.betAmount,
        currency: input.currency,
        gameData: input.gameData
      });
    }),
});
```

---

## 💰 WALLET ROUTER

```typescript
import { z } from 'zod';
import { router, protectedProcedure } from '../trpc';
import { 
  getWalletBalance, 
  processDeposit, 
  processWithdrawal,
  swapCurrency,
  getDepositInfo
} from '../dualCurrencyWallet';

export const walletRouter = router({
  getBalance: protectedProcedure
    .query(async ({ ctx }) => {
      return await getWalletBalance(ctx.user.id);
    }),

  deposit: protectedProcedure
    .input(z.object({
      amount: z.number(),
      currency: z.enum(['crypto', 'gp']),
      txHash: z.string().optional()
    }))
    .mutation(async ({ ctx, input }) => {
      return await processDeposit(
        ctx.user.id,
        input.amount,
        input.currency,
        input.txHash
      );
    }),

  withdraw: protectedProcedure
    .input(z.object({
      amount: z.number(),
      currency: z.enum(['crypto', 'gp']),
      destination: z.string()
    }))
    .mutation(async ({ ctx, input }) => {
      return await processWithdrawal(
        ctx.user.id,
        input.amount,
        input.currency,
        input.destination
      );
    }),

  swap: protectedProcedure
    .input(z.object({
      fromCurrency: z.enum(['crypto', 'gp']),
      amount: z.number()
    }))
    .mutation(async ({ ctx, input }) => {
      return await swapCurrency(
        ctx.user.id,
        input.fromCurrency,
        input.amount
      );
    }),

  getDepositInfo: protectedProcedure
    .query(() => {
      return getDepositInfo();
    })
});
```

---

## 📦 INSTALL REQUIRED PACKAGES

```bash
cd /app
pnpm add lucide-react use-sound framer-motion recharts
```

---

## 🎵 SOUND EFFECTS

Download free sounds from:
- https://freesound.org/
- https://mixkit.co/free-sound-effects/casino/

Place in `/app/client/public/sounds/`:
- `dice-roll.mp3`
- `win.mp3`
- `lose.mp3`
- `crash-explosion.mp3`
- `slot-spin.mp3`
- `card-flip.mp3`
- `chip-place.mp3`

Usage:
```tsx
import useSound from 'use-sound';

const [playRoll] = useSound('/sounds/dice-roll.mp3');
const [playWin] = useSound('/sounds/win.mp3');
```

---

## 🚀 NEXT STEPS

1. ✅ **Dice page** - COMPLETE
2. ⏳ **Create remaining game pages** (Crash, Keno, Plinko, Slots, Blackjack, Roulette)
3. ⏳ **Add game routers** to tRPC
4. ⏳ **Add professional icons** to Home.tsx
5. ⏳ **Install sound library** and add effects
6. ⏳ **Test all games** end-to-end

---

**STATUS**: Dice page complete, others need implementation following same pattern.

**Degens¤Den / Degens Den Productions**
