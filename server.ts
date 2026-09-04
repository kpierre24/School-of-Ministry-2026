import express from "express";
import http from "http";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

import { githubRouter } from "./src/server/routes/github";
import { aiRouter } from "./src/server/routes/ai";
import { driveProxyRouter } from "./src/server/routes/driveProxy";
import { logger } from "./src/lib/logger";
import { securityHeaders, rateLimiter, sanitizeBody } from "./src/server/middleware/security";

dotenv.config();

const currentFilename = typeof __filename !== "undefined"
  ? __filename
  : fileURLToPath(import.meta.url);
const currentDirname = typeof __dirname !== "undefined"
  ? __dirname
  : path.dirname(currentFilename);

async function startServer() {
  const app = express();
  const isDev =
    process.env.NODE_ENV !== "production" &&
    !currentFilename.endsWith(".cjs") &&
    !currentDirname.includes("dist");

  // Port 3000 is strictly required for the container reverse proxy.
  const PRIMARY_PORT = 3000;
  // Cloud Run or external environments may pass PORT (e.g. 8080).
  const envPort = process.env.PORT ? parseInt(process.env.PORT, 10) : null;
  const secondaryPort = envPort && !isNaN(envPort) && envPort !== PRIMARY_PORT ? envPort : null;

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
  app.use(express.json({ limit: "10mb" }));

  // Sanitize incoming JSON bodies
  app.use(sanitizeBody);

  // Apply rate limiting specifically to /api endpoints
  app.use("/api", rateLimiter(100, 15 * 60 * 1000));

  // Mount API routers
  app.use("/api/github", githubRouter);
  app.use("/api/ai", aiRouter);
  app.use("/api/drive-proxy", driveProxyRouter);

  // Vite middleware for development vs static asset serving in production
  if (isDev) {
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
      : currentDirname;

    app.use(
      express.static(distPath, {
        setHeaders: (res) => {
          res.setHeader("X-Content-Type-Options", "nosniff");
          res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
          res.setHeader("X-XSS-Protection", "1; mode=block");
        },
      })
    );

    app.get("*", (_req, res) => {
      const indexPath = path.join(distPath, "index.html");
      if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
      } else {
        res.status(200).send("<html><head><title>HTEIM School of Ministry</title></head><body>HTEIM Portal Service Running</body></html>");
      }
    });
  }

  const activeServers: http.Server[] = [];

  // Start primary server on port 3000 (required for AI Studio reverse proxy routing)
  const primaryServer = app.listen(PRIMARY_PORT, "0.0.0.0", () => {
    logger.info(`HTEIM School of Ministry primary server running on http://0.0.0.0:${PRIMARY_PORT}`);
  });
  activeServers.push(primaryServer);

  primaryServer.on("error", (err: NodeJS.ErrnoException) => {
    if (err.code === "EADDRINUSE") {
      logger.error(`Port ${PRIMARY_PORT} is already in use. Exiting process cleanly to allow dev supervisor restart.`);
      process.exit(1);
    } else {
      logger.error(`Primary server on port ${PRIMARY_PORT} encountered an error:`, err);
    }
  });

  // If Cloud Run or an external container specifies a different PORT (e.g. 8080),
  // attempt to also listen on that port for direct container ingress if not already bound by a reverse proxy.
  if (secondaryPort) {
    try {
      const secondaryServer = app.listen(secondaryPort, "0.0.0.0", () => {
        logger.info(`HTEIM School of Ministry secondary ingress active on http://0.0.0.0:${secondaryPort}`);
      });
      activeServers.push(secondaryServer);

      secondaryServer.on("error", (err: NodeJS.ErrnoException) => {
        if (err.code === "EADDRINUSE") {
          logger.info(`Port ${secondaryPort} is handled by the platform reverse proxy; internal routing active on port ${PRIMARY_PORT}.`);
        } else {
          logger.warn(`Secondary ingress on port ${secondaryPort} encountered error:`, err.message);
        }
      });
    } catch (err: any) {
      logger.info(`Secondary port ${secondaryPort} listener skipped:`, err?.message || err);
    }
  }

  const shutdown = () => {
    logger.info("Server shutting down gracefully...");
    let remaining = activeServers.length;
    if (remaining === 0) {
      process.exit(0);
    }
    for (const s of activeServers) {
      s.close(() => {
        remaining--;
        if (remaining <= 0) {
          logger.info("All server listeners closed gracefully.");
          process.exit(0);
        }
      });
    }
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

startServer();

