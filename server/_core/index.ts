import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import compression from "compression";
import helmet from "helmet";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { registerChatRoutes } from "./chat";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";
import { authLimiter, apiLimiter } from "../rateLimiter";

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => { server.close(() => resolve(true)); });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) return port;
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  const app = express();
  const server = createServer(app);

  // Trust the first proxy (load balancer / ingress) so that
  // express-rate-limit reads the real client IP from X-Forwarded-For.
  // Set to the number of trusted proxy hops in your infrastructure.
  app.set("trust proxy", 1);

  // -------------------------------------------------------------------------
  // Security headers (helmet)
  // Relaxed CSP so the Vite dev client and CDN assets still load.
  // -------------------------------------------------------------------------
  app.use(
    helmet({
      contentSecurityPolicy: false, // managed by Vite / CDN in production
      crossOriginEmbedderPolicy: false,
    })
  );

  // -------------------------------------------------------------------------
  // Gzip / Brotli compression for all responses > 1 KB
  // -------------------------------------------------------------------------
  app.use(compression());

  // -------------------------------------------------------------------------
  // Body parsers
  // -------------------------------------------------------------------------
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  // -------------------------------------------------------------------------
  // Health check — used by load balancers and orchestrators (Kubernetes, ECS)
  // Must respond before any auth or rate-limit middleware.
  // -------------------------------------------------------------------------
  app.get("/api/health", (_req, res) => {
    res.status(200).json({
      status: "ok",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    });
  });

  // -------------------------------------------------------------------------
  // Rate limiting
  // -------------------------------------------------------------------------
  // Auth endpoints (login / register) — strict limit
  app.use("/api/trpc/auth.login", authLimiter);
  app.use("/api/trpc/auth.register", authLimiter);

  // All other API traffic — generous limit
  app.use("/api/trpc", apiLimiter);

  // -------------------------------------------------------------------------
  // Application routes
  // -------------------------------------------------------------------------
  registerOAuthRoutes(app);
  registerChatRoutes(app);

  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );

  // -------------------------------------------------------------------------
  // Static files / Vite dev server
  // -------------------------------------------------------------------------
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // -------------------------------------------------------------------------
  // Start listening
  // -------------------------------------------------------------------------
  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });

  // -------------------------------------------------------------------------
  // Graceful shutdown — drain in-flight requests before exiting.
  // Kubernetes / ECS send SIGTERM before force-killing the pod.
  // -------------------------------------------------------------------------
  const shutdown = (signal: string) => {
    console.log(`[Shutdown] Received ${signal}. Closing HTTP server…`);
    server.close(err => {
      if (err) {
        console.error("[Shutdown] Error closing server:", err);
        process.exit(1);
      }
      console.log("[Shutdown] HTTP server closed. Exiting.");
      process.exit(0);
    });

    // Force exit after 10 s if connections are still open
    setTimeout(() => {
      console.error("[Shutdown] Timeout — forcing exit.");
      process.exit(1);
    }, 10_000).unref();
  };

  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT",  () => shutdown("SIGINT"));
}

startServer().catch(console.error);
