# Plugin Development Guide for CloutxMi

This guide provides comprehensive instructions for developing and integrating new plugins into the CloutxMi gambling platform. Plugins are self-contained modules that extend the platform's functionality, whether by adding new games, payment gateways, or other features.

## 1. Plugin Architecture

Each plugin follows a standardized structure to ensure seamless integration with the core platform. A plugin consists of two primary components: the server-side logic and the client-side components.

### Directory Structure

```
/plugins/plugin_name/
├── server/
│   ├── index.ts              # Main server entry point
│   ├── router.ts             # tRPC router definition
│   ├── types.ts              # TypeScript type definitions
│   └── ...                   # Other server modules
├── client/
│   ├── index.tsx             # Main client entry point
│   ├── components/           # React components
│   ├── hooks/                # Custom React hooks
│   └── ...                   # Other client modules
├── shared/
│   ├── types.ts              # Shared types between client and server
│   └── constants.ts          # Shared constants
├── package.json              # Plugin-specific dependencies
└── README.md                 # Plugin documentation
```

## 2. Plugin Interface

All plugins must implement the following interface to be recognized and managed by the platform's plugin manager:

```typescript
export interface PluginInterface {
  id: string;                  // Unique identifier for the plugin
  name: string;                // Human-readable name
  version: string;             // Semantic versioning
  description: string;         // Brief description
  author: string;              // Plugin author
  initialize: () => Promise<void>;  // Initialization logic
  shutdown: () => Promise<void>;    // Cleanup logic
  getRouter: () => any;        // Returns tRPC router
  getComponents: () => Record<string, React.ComponentType>;  // Returns React components
}
```

## 3. Server-Side Development

### Creating a tRPC Router

The server-side logic is exposed via a tRPC router. Here's a template for creating a new router:

```typescript
// /plugins/plugin_name/server/router.ts
import { router, publicProcedure } from '@/server/_core/trpc';
import { z } from 'zod';

export const pluginRouter = router({
  getStatus: publicProcedure
    .query(async () => {
      return { status: 'active' };
    }),

  performAction: publicProcedure
    .input(z.object({ userId: z.string(), amount: z.number() }))
    .mutation(async ({ input }) => {
      // Implement your logic here
      return { success: true };
    }),
});
```

### Error Handling

All server-side operations must include comprehensive error handling:

```typescript
try {
  // Perform operation
} catch (error) {
  if (error instanceof ValidationError) {
    throw new TRPCError({
      code: 'BAD_REQUEST',
      message: 'Invalid input provided',
    });
  }
  throw new TRPCError({
    code: 'INTERNAL_SERVER_ERROR',
    message: 'An unexpected error occurred',
  });
}
```

## 4. Client-Side Development

### Creating React Components

Client-side components should follow React best practices and use the platform's design system:

```typescript
// /plugins/plugin_name/client/components/GameBoard.tsx
import React from 'react';
import { trpc } from '@/client/trpc';

export const GameBoard: React.FC = () => {
  const { data, isLoading, error } = trpc.plugin.getStatus.useQuery();

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      <h1>Game Board</h1>
      <p>Status: {data?.status}</p>
    </div>
  );
};
```

### Using Custom Hooks

Create custom hooks to encapsulate plugin-specific logic:

```typescript
// /plugins/plugin_name/client/hooks/useGameState.ts
import { useState, useCallback } from 'react';
import { trpc } from '@/client/trpc';

export const useGameState = () => {
  const [gameState, setGameState] = useState(null);
  const performAction = trpc.plugin.performAction.useMutation();

  const handleAction = useCallback(async (userId: string, amount: number) => {
    const result = await performAction.mutateAsync({ userId, amount });
    setGameState(result);
  }, [performAction]);

  return { gameState, handleAction, isLoading: performAction.isPending };
};
```

## 5. Integration with Core Platform

### Registering the Plugin

Plugins are registered through the plugin manager. Add your plugin to the registry:

```typescript
// /server/pluginManager.ts
import { pluginName } from '@/plugins/plugin_name/server/index';

export const registerPlugin = async (plugin: PluginInterface) => {
  await plugin.initialize();
  // Register router with main tRPC router
  // Register components with client
};
```

### Accessing Core Services

Plugins can access core platform services through dependency injection:

```typescript
// /plugins/plugin_name/server/index.ts
import { db } from '@/server/db';
import { auth } from '@/server/auth';

export const initializePlugin = async () => {
  // Access database
  const users = await db.query.users.findMany();

  // Access authentication
  const user = await auth.getCurrentUser();
};
```

## 6. Gambling Lingo Integration

Incorporate gambling terminology consistently throughout your plugin to enhance the user experience:

| Term | Definition |
|------|-----------|
| **Bet** | The amount of money wagered on a game |
| **Bankroll** | The total amount of money available for gambling |
| **Buy-in** | The initial amount required to join a game |
| **Chip** | Virtual currency used in games |
| **House Edge** | The mathematical advantage the platform has over players |
| **Payout** | The amount of money returned to the player after a win |
| **RTP (Return to Player)** | The percentage of wagered money returned to players over time |
| **Volatility** | The frequency and magnitude of wins in a game |

## 7. Cloudflare Integration and Fallbacks

### Implementing Fallback Logic

Plugins should implement fallback mechanisms for external service failures:

```typescript
async function fetchWithFallback(url: string, fallbackData: any) {
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error(`Failed to fetch from ${url}, using fallback:`, error);
    return fallbackData;
  }
}
```

### Cloudflare Worker Integration

For performance and reliability, plugins can leverage Cloudflare Workers:

```typescript
// Example: Using Cloudflare KV for caching
export const getCachedData = async (key: string) => {
  const cached = await CACHE.get(key);
  if (cached) return JSON.parse(cached);

  const data = await fetchData();
  await CACHE.put(key, JSON.stringify(data), { expirationTtl: 3600 });
  return data;
};
```

## 8. Testing and Validation

All plugins must include unit tests and integration tests:

```typescript
// /plugins/plugin_name/server/__tests__/router.test.ts
import { describe, it, expect } from 'vitest';
import { pluginRouter } from '../router';

describe('Plugin Router', () => {
  it('should return status', async () => {
    const result = await pluginRouter.createCaller({}).getStatus();
    expect(result.status).toBe('active');
  });
});
```

## 9. Performance Considerations

Plugins should be optimized for performance:

- **Lazy Loading:** Load plugin components only when needed
- **Caching:** Implement caching strategies for frequently accessed data
- **Rate Limiting:** Respect rate limits on external APIs
- **Database Indexing:** Ensure database queries are optimized with proper indexes

## 10. Security Best Practices

All plugins must adhere to security best practices:

- **Input Validation:** Always validate and sanitize user inputs
- **Authentication:** Verify user authentication before performing sensitive operations
- **Authorization:** Check user permissions before granting access to features
- **Encryption:** Encrypt sensitive data both in transit and at rest
- **Audit Logging:** Log all significant actions for compliance and debugging

## 11. Publishing and Distribution

To publish your plugin:

1. Ensure all tests pass and code is well-documented
2. Bump the version number in `package.json`
3. Create a pull request with your plugin code
4. Upon approval, the plugin will be merged and made available to the platform

## 12. Support and Troubleshooting

For support or to report issues with plugin development, please refer to the main CloutxMi documentation or contact the development team.
