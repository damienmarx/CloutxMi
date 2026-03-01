# CloutxMi Platform Architecture

## Overview

CloutxMi is a modular, scalable gambling platform built with a microservices architecture. The platform is designed to support seamless integration of new games, payment gateways, and features through a robust plugin system.

## Core Architecture

### Technology Stack

- **Frontend:** React 19, TypeScript, Tailwind CSS, Vite
- **Backend:** Node.js, Express, tRPC, TypeScript
- **Database:** MySQL with Drizzle ORM
- **Real-time Communication:** Socket.io
- **CDN & Security:** Cloudflare with load balancing and DDoS protection
- **Authentication:** JWT, OAuth, MFA support

### Directory Structure

```
cloutxmi/
├── client/                 # React frontend application
│   ├── components/         # Reusable React components
│   ├── hooks/              # Custom React hooks
│   ├── pages/              # Page components
│   └── ...
├── server/                 # Backend services
│   ├── _core/              # Core platform services
│   │   ├── auth.ts         # Authentication logic
│   │   ├── logger.ts       # Logging utilities
│   │   ├── trpc.ts         # tRPC configuration
│   │   ├── cloudflareErrorHandler.ts # Cloudflare error handling
│   │   └── ...
│   ├── routers/            # API route definitions
│   ├── pluginManager.ts    # Plugin lifecycle management
│   ├── db.ts               # Database connection
│   └── ...
├── plugins/                # Plugin directory
│   ├── game_blackjack/     # Blackjack game plugin
│   ├── game_roulette/      # Roulette game plugin
│   ├── payment_stripe/     # Stripe payment gateway
│   └── ...
├── shared/                 # Shared types and utilities
├── docs/                   # Documentation
└── ...
```

## Plugin System

### Plugin Architecture

The plugin system allows developers to extend the platform with new games, payment methods, and features without modifying the core codebase. Each plugin is self-contained and follows a standardized interface.

### Plugin Interface

```typescript
interface PluginInterface {
  id: string;                                    // Unique plugin identifier
  name: string;                                  // Human-readable name
  version: string;                               // Semantic version
  description: string;                           // Plugin description
  author: string;                                // Plugin author
  initialize: () => Promise<void>;               // Initialization logic
  shutdown: () => Promise<void>;                 // Cleanup logic
  getRouter: () => any;                          // Returns tRPC router
  getComponents: () => Record<string, React.ComponentType>; // React components
  healthCheck?: () => Promise<boolean>;          // Optional health check
}
```

### Plugin Lifecycle

1. **Registration:** Plugin is registered with the PluginManager
2. **Initialization:** Plugin's `initialize()` method is called
3. **Integration:** Plugin's router and components are integrated into the platform
4. **Operation:** Plugin operates normally, with periodic health checks
5. **Shutdown:** Plugin's `shutdown()` method is called during platform shutdown

### Error Handling in Plugins

All plugins must implement comprehensive error handling:

- **Input Validation:** Validate all user inputs using Zod schemas
- **Try-Catch Blocks:** Wrap all async operations in try-catch
- **Error Logging:** Log all errors with appropriate severity levels
- **User Feedback:** Return meaningful error messages to the client
- **Fallback Logic:** Implement fallback mechanisms for external service failures

## Cloudflare Integration

### Load Balancing

The platform uses Cloudflare's load balancing to distribute traffic across multiple origin servers:

- **Primary Origin:** US East (us-east-1)
- **Secondary Origin:** EU West (eu-west-1)
- **Tertiary Origin:** Asia Pacific (ap-southeast-1)

### Failover Strategy

Cloudflare continuously monitors the health of origin servers and automatically routes traffic to healthy servers. If a primary origin fails, traffic is automatically redirected to secondary and tertiary origins.

### Error Handling

The `cloudflareErrorHandler` utility provides:

- **Retry Logic:** Automatic retries with exponential backoff
- **Circuit Breaker:** Prevents cascading failures
- **Fallback Origins:** Attempts alternate origins on failure
- **Fallback Data:** Uses cached or default data when all origins fail

## API Design

### tRPC Router Structure

The platform uses tRPC for type-safe API communication. Routers are organized by feature:

```typescript
// Example: Game router
export const gameRouter = router({
  startGame: publicProcedure
    .input(z.object({ gameId: z.string(), betAmount: z.number() }))
    .mutation(async ({ input }) => {
      // Game logic
    }),

  getGameState: publicProcedure
    .input(z.object({ gameId: z.string() }))
    .query(async ({ input }) => {
      // Return game state
    }),
});
```

## Security

### Authentication

- **JWT Tokens:** Secure token-based authentication
- **OAuth:** Social login support (Discord, Google, etc.)
- **MFA:** Multi-factor authentication for account security
- **Rate Limiting:** Prevent brute force attacks

### Data Protection

- **Encryption:** Sensitive data encrypted at rest and in transit
- **HTTPS:** All communication over HTTPS
- **CORS:** Proper CORS configuration
- **SQL Injection Prevention:** Parameterized queries via Drizzle ORM

### Compliance

- **KYC/AML:** Know Your Customer and Anti-Money Laundering checks
- **Responsible Gambling:** Tools for players to set limits
- **Data Privacy:** GDPR and privacy law compliance
- **Audit Logging:** All significant actions logged for compliance

## Performance Optimization

### Caching

- **CDN Caching:** Static assets cached globally via Cloudflare
- **Database Caching:** Redis for session and frequently accessed data
- **API Response Caching:** Intelligent caching of API responses

### Database Optimization

- **Indexing:** Proper indexes on frequently queried columns
- **Query Optimization:** Efficient SQL queries via Drizzle ORM
- **Connection Pooling:** MySQL connection pooling for performance

### Frontend Optimization

- **Code Splitting:** Lazy loading of components and routes
- **Image Optimization:** Responsive images with proper sizing
- **Bundle Optimization:** Tree-shaking and minification

## Monitoring and Observability

### Logging

- **Structured Logging:** JSON-formatted logs for easy parsing
- **Log Levels:** DEBUG, INFO, WARN, ERROR, CRITICAL
- **Log Aggregation:** Centralized log collection and analysis

### Metrics

- **Performance Metrics:** Response times, throughput, error rates
- **Business Metrics:** User activity, revenue, player retention
- **Infrastructure Metrics:** CPU, memory, disk usage

### Alerting

- **Threshold-based Alerts:** Alert when metrics exceed thresholds
- **Anomaly Detection:** Detect unusual patterns in metrics
- **Escalation:** Multi-level escalation for critical issues

## Deployment

### Development Environment

```bash
npm run dev
```

### Production Build

```bash
npm run build
npm run start
```

### Docker Deployment

```dockerfile
FROM node:22
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

## Gambling Lingo Integration

The platform uses consistent gambling terminology throughout the codebase and UI:

| Term | Usage |
|------|-------|
| **Bet** | Amount wagered on a game |
| **Bankroll** | Total available funds |
| **Buy-in** | Initial amount to join |
| **Chip** | Virtual currency unit |
| **House Edge** | Platform's mathematical advantage |
| **Payout** | Winnings returned to player |
| **RTP** | Return to Player percentage |
| **Volatility** | Win frequency and magnitude |

## Future Enhancements

- **Live Dealer Games:** Real-time games with live dealers
- **Mobile App:** Native iOS/Android applications
- **Cryptocurrency Support:** Bitcoin and other crypto payments
- **AI Recommendations:** Personalized game recommendations
- **Social Features:** Tournaments, leaderboards, social play
- **Advanced Analytics:** Player behavior analysis and insights
