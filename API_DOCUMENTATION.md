# CloutScape API Documentation

This document provides comprehensive documentation for all CloutScape API endpoints, including authentication, games, wallet operations, and user management.

## Base URL

```
https://api.cloutscape.org
```

## Authentication

All protected endpoints require a valid JWT token in the `Authorization` header:

```
Authorization: Bearer <jwt_token>
```

## Response Format

All API responses follow a standard format:

```json
{
  "success": true,
  "data": {},
  "error": null,
  "timestamp": "2024-02-21T10:30:00Z"
}
```

## Rate Limiting

API endpoints are rate-limited to prevent abuse:

| Endpoint | Limit | Window |
|----------|-------|--------|
| Login | 5 attempts | 15 minutes |
| Register | 3 registrations | 1 hour |
| Play Game | 10 games | 1 second |
| Deposit | 20 deposits | 1 hour |
| Withdrawal | 10 withdrawals | 1 hour |
| General API | 100 requests | 1 minute |

Rate limit information is included in response headers:
- `X-RateLimit-Limit`: Maximum requests allowed
- `X-RateLimit-Remaining`: Requests remaining
- `X-RateLimit-Reset`: Time when limit resets

## Authentication Endpoints

### Register

Create a new user account.

**Endpoint:** `POST /api/trpc/auth.register`

**Request:**
```json
{
  "username": "john_doe",
  "email": "john@example.com",
  "password": "SecurePassword123"
}
```

**Response:**
```json
{
  "success": true,
  "user": {
    "id": 1,
    "username": "john_doe",
    "email": "john@example.com",
    "role": "user"
  }
}
```

**Validation Rules:**
- Username: 3-64 characters, alphanumeric with underscores and hyphens
- Email: Valid email format
- Password: Minimum 8 characters, must include uppercase, lowercase, and number

### Login

Authenticate and receive a JWT token.

**Endpoint:** `POST /api/trpc/auth.login`

**Request:**
```json
{
  "username": "john_doe",
  "password": "SecurePassword123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "user": {
    "id": 1,
    "username": "john_doe",
    "email": "john@example.com",
    "role": "user"
  }
}
```

### Forgot Password

Request a password reset token.

**Endpoint:** `POST /api/trpc/auth.forgotPassword`

**Request:**
```json
{
  "email": "john@example.com"
}
```

**Response:**
```json
{
  "success": true,
  "message": "If an account with this email exists, a password reset link has been sent"
}
```

### Reset Password

Reset password using a valid token.

**Endpoint:** `POST /api/trpc/auth.resetPassword`

**Request:**
```json
{
  "token": "reset_token_here",
  "newPassword": "NewPassword123",
  "confirmPassword": "NewPassword123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Password reset successfully"
}
```

### Validate Reset Token

Validate a password reset token.

**Endpoint:** `GET /api/trpc/auth.validateResetToken`

**Query Parameters:**
- `token`: The reset token to validate

**Response:**
```json
{
  "valid": true,
  "error": null
}
```

## Email Verification Endpoints

### Send Verification Email

Send an email verification token to the user.

**Endpoint:** `POST /api/trpc/emailVerification.sendVerificationEmail`

**Authentication:** Required

**Response:**
```json
{
  "success": true,
  "message": "Verification email sent",
  "expiresIn": 86400
}
```

### Verify Email

Verify email using a token.

**Endpoint:** `POST /api/trpc/emailVerification.verifyEmail`

**Request:**
```json
{
  "token": "verification_token_here"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Email verified successfully"
}
```

### Check Verification Status

Check if user's email is verified.

**Endpoint:** `GET /api/trpc/emailVerification.isVerified`

**Authentication:** Required

**Response:**
```json
{
  "success": true,
  "verified": true
}
```

## Game Endpoints

### Play Keno

Play a game of Keno.

**Endpoint:** `POST /api/trpc/game.playKeno`

**Authentication:** Required

**Request:**
```json
{
  "selectedNumbers": [1, 5, 10, 15, 20, 25, 30, 35, 40, 45],
  "betAmount": 10
}
```

**Response:**
```json
{
  "success": true,
  "game": {
    "gameId": "game_123",
    "drawnNumbers": [1, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50],
    "matchedNumbers": [1, 5, 10, 15, 20, 25, 30, 35, 40, 45],
    "betAmount": 10,
    "winAmount": 100,
    "won": true,
    "timestamp": "2024-02-21T10:30:00Z"
  }
}
```

### Play Slots

Play a game of Slots.

**Endpoint:** `POST /api/trpc/game.playSlots`

**Authentication:** Required

**Request:**
```json
{
  "betAmount": 10
}
```

**Response:**
```json
{
  "success": true,
  "game": {
    "gameId": "game_456",
    "reels": ["cherry", "cherry", "cherry"],
    "betAmount": 10,
    "winAmount": 50,
    "won": true,
    "timestamp": "2024-02-21T10:30:00Z"
  }
}
```

### Degens♧Den Spin

Play Degens♧Den Slots game.

**Endpoint:** `POST /api/trpc/degensDen.spin`

**Authentication:** Required

**Request:**
```json
{
  "betAmount": 10,
  "paylines": 10
}
```

**Response:**
```json
{
  "success": true,
  "spin": {
    "spinId": "spin_789",
    "reels": {
      "reel1": ["axe", "hammer", "rune", "skull"],
      "reel2": ["gem", "dragon", "wild", "bonus"],
      "reel3": ["axe", "axe", "axe", "axe"],
      "reel4": ["hammer", "hammer", "hammer", "hammer"],
      "reel5": ["rune", "rune", "rune", "rune"]
    },
    "matchedLines": [
      {
        "lineNumber": 0,
        "symbols": ["axe", "axe", "axe", "axe", "axe"],
        "multiplier": 50,
        "win": true
      }
    ],
    "totalWin": 500,
    "totalMultiplier": 50,
    "bonusTriggered": false,
    "freeSpinsAwarded": 0,
    "timestamp": "2024-02-21T10:30:00Z"
  }
}
```

## Wallet Endpoints

### Get Wallet

Get user's wallet information.

**Endpoint:** `GET /api/trpc/wallet.getWallet`

**Authentication:** Required

**Response:**
```json
{
  "success": true,
  "wallet": {
    "id": "wallet_123",
    "userId": 1,
    "balance": 1000.50,
    "totalDeposited": 5000,
    "totalWithdrawn": 3999.50,
    "createdAt": "2024-01-01T00:00:00Z"
  }
}
```

### Deposit Funds

Deposit funds into wallet.

**Endpoint:** `POST /api/trpc/wallet.deposit`

**Authentication:** Required

**Request:**
```json
{
  "amount": 100,
  "paymentMethod": "credit_card"
}
```

**Response:**
```json
{
  "success": true,
  "transaction": {
    "id": "txn_123",
    "type": "deposit",
    "amount": 100,
    "status": "completed",
    "timestamp": "2024-02-21T10:30:00Z"
  }
}
```

### Withdraw Funds

Withdraw funds from wallet.

**Endpoint:** `POST /api/trpc/wallet.withdraw`

**Authentication:** Required

**Request:**
```json
{
  "amount": 50,
  "walletAddress": "0x742d35Cc6634C0532925a3b844Bc9e7595f42bE"
}
```

**Response:**
```json
{
  "success": true,
  "transaction": {
    "id": "txn_124",
    "type": "withdrawal",
    "amount": 50,
    "status": "pending",
    "timestamp": "2024-02-21T10:30:00Z"
  }
}
```

### Get Transaction History

Get user's transaction history.

**Endpoint:** `GET /api/trpc/wallet.getTransactionHistory`

**Authentication:** Required

**Query Parameters:**
- `limit`: Number of transactions to retrieve (default: 50, max: 100)
- `offset`: Number of transactions to skip (default: 0)

**Response:**
```json
{
  "success": true,
  "transactions": [
    {
      "id": "txn_124",
      "type": "withdrawal",
      "amount": 50,
      "status": "completed",
      "timestamp": "2024-02-21T10:30:00Z"
    }
  ]
}
```

## User Stats Endpoints

### Get User Stats

Get comprehensive user statistics.

**Endpoint:** `GET /api/trpc/userStats.getUserStats`

**Authentication:** Required

**Response:**
```json
{
  "success": true,
  "stats": {
    "userId": 1,
    "username": "john_doe",
    "totalWagered": 10000,
    "totalWon": 12000,
    "totalLost": 8000,
    "netProfit": 4000,
    "roi": 40,
    "winRate": 55,
    "gamesPlayed": 100,
    "averageBet": 100,
    "largestWin": 5000,
    "largestLoss": 1000,
    "joinedDate": "2024-01-01T00:00:00Z",
    "lastActiveDate": "2024-02-21T10:30:00Z"
  }
}
```

### Get Game Stats

Get game-specific statistics.

**Endpoint:** `GET /api/trpc/userStats.getGameStats`

**Authentication:** Required

**Response:**
```json
{
  "success": true,
  "gameStats": [
    {
      "gameType": "slots",
      "totalBets": 50,
      "totalWagered": 5000,
      "totalWon": 6000,
      "totalLost": 4000,
      "gamesPlayed": 50,
      "winRate": 60,
      "averageBet": 100,
      "largestWin": 3000,
      "roi": 20
    }
  ]
}
```

### Get Achievements

Get user's achievements.

**Endpoint:** `GET /api/trpc/userStats.getAchievements`

**Authentication:** Required

**Response:**
```json
{
  "success": true,
  "achievements": {
    "userId": 1,
    "achievements": [
      {
        "id": "first_bet",
        "name": "First Bet",
        "description": "Place your first bet",
        "icon": "🎰",
        "category": "milestone",
        "unlockedAt": "2024-01-01T00:00:00Z"
      }
    ],
    "totalAchievements": 5,
    "completionPercentage": 45
  }
}
```

## VIP Progress Endpoints

### Get VIP Progress

Get user's VIP progress information.

**Endpoint:** `GET /api/trpc/vipProgress.getUserProgress`

**Authentication:** Required

**Response:**
```json
{
  "success": true,
  "progress": {
    "currentTier": {
      "tier": "gold",
      "displayName": "Gold Member",
      "icon": "🥇",
      "minWagered": 50000,
      "maxWagered": 99999,
      "cashbackPercentage": 3,
      "bonusMultiplier": 1.5,
      "benefits": ["3% Cashback", "1.5x Bonus Multiplier", "VIP Events"],
      "isCurrentTier": true,
      "isReached": true,
      "progressPercentage": 100
    },
    "nextTier": {
      "tier": "platinum",
      "displayName": "Platinum Member",
      "minWagered": 100000,
      "benefits": ["4% Cashback", "2x Bonus Multiplier"]
    },
    "progressBar": {
      "currentTier": "gold",
      "nextTier": "platinum",
      "currentAmount": 75000,
      "tierMinimum": 50000,
      "tierMaximum": 100000,
      "progressPercentage": 50,
      "amountNeeded": 25000,
      "visualBar": "[██████████░░░░░░░░] 50.0%"
    },
    "estimatedTimeToNextTier": "5 days at current pace"
  }
}
```

## Error Handling

The API returns appropriate HTTP status codes and error messages:

| Status Code | Meaning |
|-------------|---------|
| 200 | Success |
| 400 | Bad Request (validation error) |
| 401 | Unauthorized (missing or invalid token) |
| 403 | Forbidden (insufficient permissions) |
| 404 | Not Found |
| 409 | Conflict (duplicate request) |
| 429 | Too Many Requests (rate limit exceeded) |
| 500 | Internal Server Error |

**Error Response Format:**
```json
{
  "success": false,
  "error": "Error message",
  "code": "ERROR_CODE",
  "details": {}
}
```

## Webhooks

Webhooks are available for real-time notifications of important events:

- `game.completed`: When a game is completed
- `wallet.deposit`: When funds are deposited
- `wallet.withdrawal`: When funds are withdrawn
- `vip.tier_upgraded`: When user reaches a new VIP tier
- `account.locked`: When account is locked due to failed login attempts

## Best Practices

1. **Always validate input** on the client side before sending requests
2. **Implement exponential backoff** for retries on rate limit errors
3. **Cache responses** where appropriate to reduce API calls
4. **Use webhooks** for real-time updates instead of polling
5. **Keep API keys secure** and never expose them in client-side code
6. **Monitor rate limits** using response headers
7. **Implement proper error handling** for all API calls

## Support

For API support and issues, contact: Support@cloutscape.org / Support@cloutscape.online
