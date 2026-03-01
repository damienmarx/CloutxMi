import { sql } from "drizzle-orm";
import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { createAppRouter } from "../routers";
import { createContext } from "./context";
import { PluginManager } from "../pluginManager";
import * as path from 'path';
import { serveStatic, setupVite } from "./vite";
import { initializeSocket, setGlobalIO } from "./socket";
import { 
  globalRateLimiter, 
  securityHeaders, 
  corsOptions, 
  sanitizeInput, 
  forceHttps, 
  securityLogger,
  devAuthMiddleware
} from "../securityMiddleware";

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  const pluginManager = new PluginManager(path.join(__dirname, "../../plugins"));
  await pluginManager.loadPlugins();

  const app = express();
  const server = createServer(app);

  // Initialize Socket.IO for real-time communication
  const io = initializeSocket(server);
  setGlobalIO(io);

  // Configure security middlewares
  app.use(securityHeaders);
  app.use(corsOptions);
  app.use(globalRateLimiter);
  app.use(securityLogger);
  app.use(forceHttps);
  app.use(sanitizeInput);

  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  // Protect sensitive dev/status routes
  app.use("/api/dev", devAuthMiddleware);
  app.use("/api/system", devAuthMiddleware);

  // OAuth callback under /api/oauth/callback
  registerOAuthRoutes(app);

  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: createAppRouter(pluginManager.getPluginRouters()),
      createContext,
    })
  );

  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const preferredPort = parseInt(process.env.PORT || "8080");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
    console.log(`Socket.IO server initialized on http://localhost:${port}`);
    // Optionally, handle graceful shutdown
    process.on("SIGTERM", async () => {
      console.log("SIGTERM signal received: closing HTTP server and shutting down plugins");
      await pluginManager.shutdownPlugins();
      server.close(() => {
        console.log("HTTP server closed");
        process.exit(0);
      });
    });
    process.on("SIGINT", async () => {
      console.log("SIGINT signal received: closing HTTP server and shutting down plugins");
      await pluginManager.shutdownPlugins();
      server.close(() => {
        console.log("HTTP server closed");
        process.exit(0);
      });
    });
  });
}

startServer().catch(console.error);
