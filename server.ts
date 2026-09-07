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
import { notificationsRouter } from "./src/server/routes/notifications";
import { logger } from "./src/lib/logger";
import { securityHeaders, rateLimiter, sanitizeBody } from "./src/server/middleware/security";
import { authenticate } from "./src/server/middleware/rbac";

dotenv.config();

const currentFilename = typeof __filename !== "undefined" ? __filename : process.cwd();
const currentDirname = typeof __dirname !== "undefined" ? __dirname : path.dirname(currentFilename);

async function startServer() {
  const app = express();
  
  // Configure Express proxy trust to safely process X-Forwarded-For headers
  // when deployed behind trusted load balancers/reverse proxies (e.g., Google Cloud Run GFE)
  app.set("trust proxy", 1);

  const isDev =
    process.env.NODE_ENV !== "production" &&
    !currentFilename.endsWith(".cjs") &&
    !currentDirname.includes("dist");

  // Cloud Run or container environment assigns PORT (e.g. 8080 or 3000).
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

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

  // Role-Based Access Control authentication context (resolved first so user IDs are available to limiters)
  app.use("/api", authenticate);

  // Apply granular namespaced rate limiting to sensitive and high-traffic endpoints
  app.use("/api/auth", rateLimiter(15, 15 * 60 * 1000, "auth"));
  app.use("/api/payments", rateLimiter(45, 15 * 60 * 1000, "payments"));
  app.use("/api/ai", rateLimiter(35, 15 * 60 * 1000, "ai"));
  app.use("/api/state", rateLimiter(15, 15 * 60 * 1000, "state"));
  app.use("/api/attendance", rateLimiter(150, 15 * 60 * 1000, "attendance"));
  app.use("/api/students", rateLimiter(200, 15 * 60 * 1000, "students"));

  // Apply general fallback rate limiting specifically to other /api endpoints
  app.use("/api", rateLimiter(1000, 15 * 60 * 1000, "general"));

  // Mount API routers
  app.use("/api/auth", authRouter);
  app.use("/api/students", studentsRouter);
  app.use("/api/academics", academicsRouter);
  app.use("/api/attendance", attendanceRouter);
  app.use("/api/payments", paymentsRouter);
  app.use("/api/library", libraryRouter);
  app.use("/api/assignments", assignmentsRouter);
  app.use("/api/audit-logs", auditLogsRouter);
  app.use("/api/state", stateRouter);
  app.use("/api/notifications", notificationsRouter);
  app.use("/api/github", githubRouter);
  app.use("/api/ai", aiRouter);
  app.use("/api/drive-proxy", driveProxyRouter);
  app.use("/api/bible", bibleRouter);

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
  const HOST = process.env.HOST || "0.0.0.0";
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

