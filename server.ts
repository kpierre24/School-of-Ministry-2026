import express from "express";
import path from "path";
import fs from "fs";
import os from "os";
import dotenv from "dotenv";

import { githubRouter } from "./src/server/routes/github";
import { aiRouter } from "./src/server/routes/ai";
import { driveProxyRouter } from "./src/server/routes/driveProxy";
import { bibleRouter } from "./src/server/routes/bible";
import { authRouter } from "./src/server/routes/auth";
import { studentsRouter } from "./src/server/routes/students";
import { academicsRouter } from "./src/server/routes/academics";
import { attendanceRouter } from "./src/server/routes/attendance";
import { paymentsRouter } from "./src/server/routes/payments";
import { libraryRouter } from "./src/server/routes/library";
import { assignmentsRouter } from "./src/server/routes/assignments";
import { auditLogsRouter } from "./src/server/routes/auditLogs";
import { stateRouter } from "./src/server/routes/state";
import { meRouter } from "./src/server/routes/me";
import { notificationsRouter } from "./src/server/routes/notifications";
import { initializeRelationalSchema, stateHydrationService } from "./src/server/services/domain";
import { validateSupabaseServerConfig, isSupabaseConfigured } from "./src/server/services/supabaseServer";
import { logger } from "./src/lib/logger";
import {
  securityHeaders,
  sanitizeBody,
  generalApiRateLimiter,
  authRateLimiter,
  aiRateLimiter,
  paymentsRateLimiter,
  assignmentsRateLimiter,
  driveProxyRateLimiter,
  adminRateLimiter,
  stateRateLimiter,
  githubRateLimiter,
} from "./src/server/middleware/security";
import { authenticate, requireAuth } from "./src/server/middleware/rbac";

dotenv.config();

const currentFilename = typeof __filename !== "undefined" ? __filename : process.cwd();
const currentDirname = typeof __dirname !== "undefined" ? __dirname : path.dirname(currentFilename);

async function startServer() {
  // Check privileged server credentials on startup
  if (!isSupabaseConfigured()) {
    logger.warn(
      "[Supabase Server] SUPABASE_SERVICE_ROLE_KEY is not configured in this environment. " +
      "Authoritative server database operations will fail until SUPABASE_SERVICE_ROLE_KEY is provided in environment variables."
    );
  } else {
    logger.info("[Supabase Server] Privileged SUPABASE_SERVICE_ROLE_KEY configured and verified.");
  }

  const app = express();
  // Trust the frontend proxy/load balancer (e.g., Cloud Run load balancer or Nginx)
  app.set("trust proxy", 1);
  const isDev =
    process.env.NODE_ENV !== "production" &&
    !currentFilename.endsWith(".cjs") &&
    !currentDirname.includes("dist");

  // Cloud Run or container environment assigns PORT (e.g. 8080 or 3000).
  let PORT = 3000;
  if (process.env.PORT) {
    PORT = parseInt(process.env.PORT, 10);
  } else {
    const portArgIdx = process.argv.indexOf("--port");
    if (portArgIdx !== -1 && process.argv[portArgIdx + 1]) {
      const parsedPort = parseInt(process.argv[portArgIdx + 1], 10);
      if (!isNaN(parsedPort)) PORT = parsedPort;
    }
  }

  const defaultHost = isDev ? "127.0.0.1" : "0.0.0.0";
  let HOST = process.env.HOST || defaultHost;
  const hostArgIdx = process.argv.indexOf("--host");
  if (hostArgIdx !== -1) {
    const nextArg = process.argv[hostArgIdx + 1];
    if (nextArg && !nextArg.startsWith("-")) {
      HOST = nextArg;
    } else {
      HOST = "0.0.0.0";
    }
  }

  // Apply security response headers globally
  app.use(securityHeaders);

  // Health check routes first (unrate-limited for deployment platforms and container probes)
  const healthResponse = (_req: express.Request, res: express.Response) => {
    res.status(200).json({
      status: "ok",
      service: "hteim-school-of-ministry",
      timestamp: new Date().toISOString(),
    });
  };

  app.get("/api/health", healthResponse);
  app.get("/health", healthResponse);
  app.get("/healthz", healthResponse);
  app.get("/_health", healthResponse);
  app.get("/livez", healthResponse);
  app.get("/readyz", healthResponse);
  app.get("/ping", (_req, res) => res.status(200).send("pong"));

  // Limit payload size to prevent payload bombing attacks
  app.use(express.json({ limit: "15mb" }));

  // Sanitize incoming JSON bodies
  app.use(sanitizeBody);

  // Apply general API baseline rate limiting to /api endpoints (1000 requests per 15 min)
  app.use("/api", generalApiRateLimiter);

  // Initialize relational PostgreSQL database tables
  initializeRelationalSchema().catch((e) => logger.warn("Relational init warning:", e));

  // Role-Based Access Control authentication context (attaches req.user if authorization token present)
  app.use("/api", authenticate);

  // Explicit Public API Routers (deliberately mounted without requireAuth)
  app.use("/api/auth", authRateLimiter, authRouter);
  app.use("/api/bible", bibleRouter);

  // Protected Domain API Routers (strictly require verified authentication via explicit requireAuth middleware)
  app.use("/api/students", requireAuth, studentsRouter);
  app.use("/api/academics", requireAuth, academicsRouter);
  app.use("/api/attendance", requireAuth, attendanceRouter);
  app.use("/api/payments", requireAuth, paymentsRateLimiter, paymentsRouter);
  app.use("/api/library", requireAuth, libraryRouter);
  app.use("/api/assignments", requireAuth, assignmentsRateLimiter, assignmentsRouter);
  app.use("/api/audit-logs", requireAuth, adminRateLimiter, auditLogsRouter);
  app.use("/api/state", requireAuth, stateRateLimiter, stateRouter);
  app.use("/api/me", requireAuth, meRouter);
  app.use("/api/notifications", requireAuth, notificationsRouter);
  app.use("/api/github", requireAuth, githubRateLimiter, githubRouter);
  app.use("/api/ai", requireAuth, aiRateLimiter, aiRouter);
  app.use("/api/drive-proxy", requireAuth, driveProxyRateLimiter, driveProxyRouter);

  // Vite middleware for development vs static asset serving in production
  if (isDev) {
    // In dev mode, return 404 for stale production asset bundles instead of index.html
    app.use("/assets", (_req, res) => {
      res.status(404).type("text/plain").send("Not Found");
    });

    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: false,
      },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Production static serving
    const distPath = fs.existsSync(path.join(process.cwd(), "dist", "index.html"))
      ? path.join(process.cwd(), "dist")
      : fs.existsSync(path.join(currentDirname, "index.html"))
      ? currentDirname
      : path.join(process.cwd(), "dist");

    app.use(
      express.static(distPath, {
        setHeaders: (res, filePath) => {
          res.setHeader("X-Content-Type-Options", "nosniff");
          res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
          res.setHeader("X-XSS-Protection", "1; mode=block");
          // Never cache HTML or Service Worker files so updates and cache invalidation are immediate
          if (filePath.endsWith(".html") || filePath.endsWith("sw.js") || filePath.endsWith("registerSW.js")) {
            res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
          }
        },
      })
    );

    // Explicit 404 for missing static assets or files with extensions rather than serving HTML
    app.get(["/assets/*", "*.*"], (_req, res) => {
      res.status(404).type("text/plain").send("Not Found");
    });

    app.get("*", (_req, res) => {
      const indexPath = path.join(distPath, "index.html");
      if (fs.existsSync(indexPath)) {
        res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
        res.sendFile(indexPath);
      } else {
        res.status(200).send("<!DOCTYPE html><html><head><title>HTEIM School of Ministry</title></head><body><div id='root'>HTEIM Portal Service Running</div></body></html>");
      }
    });
  }

  // Function to detect reachable local IPv4 network addresses
  const getNetworkIps = (): string[] => {
    const interfaces = os.networkInterfaces();
    const ips: string[] = [];
    for (const name of Object.keys(interfaces)) {
      for (const net of interfaces[name] || []) {
        // Only return non-internal IPv4 addresses and filter out link-local (169.254.x.x)
        if (net.family === "IPv4" && !net.internal && !net.address.startsWith("169.254.")) {
          ips.push(net.address);
        }
      }
    }
    return ips;
  };

  // Start single unified server on PORT (bound to 0.0.0.0 for container & local network ingress)
  const server = app.listen(PORT, HOST, () => {
    const networkIps = getNetworkIps();
    logger.info(`HTEIM School of Ministry server running:`);
    logger.info(`  > Local:   http://localhost:${PORT}`);
    if (networkIps.length > 0) {
      networkIps.forEach((ip) => {
        logger.info(`  > Network: http://${ip}:${PORT}`);
      });
    } else {
      logger.info(`  > Network: http://0.0.0.0:${PORT}`);
    }
  });

  server.on("error", (err: NodeJS.ErrnoException) => {
    if (err.code === "EADDRINUSE") {
      logger.error(`Port ${PORT} is already in use.`);
      process.exit(1);
    } else {
      logger.error(`Server on port ${PORT} encountered an error:`, err);
      process.exit(1);
    }
  });

  const shutdown = () => {
    logger.info("Server shutting down gracefully...");
    server.close(() => {
      logger.info("Server listener closed gracefully.");
      process.exit(0);
    });
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

startServer();

