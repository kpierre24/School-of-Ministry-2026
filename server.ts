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
      : fs.existsSync(path.join(currentDirname, "index.html"))
      ? currentDirname
      : path.join(process.cwd(), "dist");

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
        res.status(200).send("<!DOCTYPE html><html><head><title>HTEIM School of Ministry</title></head><body><div id='root'>HTEIM Portal Service Running</div></body></html>");
      }
    });
  }

  // Start single unified server on PORT (bound to 0.0.0.0 for container ingress)
  const server = app.listen(PORT, "0.0.0.0", () => {
    logger.info(`HTEIM School of Ministry server running:`);
    logger.info(`  > Local:   http://localhost:${PORT}`);
    logger.info(`  > Network: http://0.0.0.0:${PORT}`);
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

