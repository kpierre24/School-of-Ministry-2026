import express from "express";
import path from "path";
import fs from "fs";
import dotenv from "dotenv";

import { githubRouter } from "./src/server/routes/github";
import { aiRouter } from "./src/server/routes/ai";
import { driveProxyRouter } from "./src/server/routes/driveProxy";
import { logger } from "./src/lib/logger";
import { securityHeaders, rateLimiter, sanitizeBody } from "./src/server/middleware/security";

dotenv.config();

async function startServer() {
  const app = express();
  // DO NOT read process.env.PORT. AI Studio infrastructure requires strictly 3000.
  const PORT = 3000;

  // Apply security response headers globally
  app.use(securityHeaders);

  // Health check routes first (unrate-limited for container probes)
  app.get("/api/health", (_req, res) => {
    res.status(200).json({
      status: "ok",
      service: "hteim-school-of-ministry",
      timestamp: new Date().toISOString()
    });
  });

  app.get("/health", (_req, res) => {
    res.status(200).json({
      status: "ok",
      service: "hteim-school-of-ministry",
      timestamp: new Date().toISOString()
    });
  });

  app.get("/_health", (_req, res) => {
    res.status(200).json({
      status: "ok",
      service: "hteim-school-of-ministry",
      timestamp: new Date().toISOString()
    });
  });

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

  // Determine production mode: either explicit NODE_ENV or presence of built dist directory
  const isProduction =
    process.env.NODE_ENV === "production" ||
    fs.existsSync(path.join(process.cwd(), "dist", "index.html")) ||
    fs.existsSync(path.join(__dirname, "index.html"));

  if (!isProduction) {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Production static serving
    const distPath = fs.existsSync(path.join(process.cwd(), "dist", "index.html"))
      ? path.join(process.cwd(), "dist")
      : fs.existsSync(path.join(__dirname, "index.html"))
      ? __dirname
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
        res.status(200).send("<!DOCTYPE html><html><head><title>HTEIM School of Ministry</title></head><body>HTEIM Portal Service Running</body></html>");
      }
    });
  }

  // Global Express Error Handler
  app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    logger.error("Unhandled server error:", err);
    res.status(500).json({
      error: "Internal Server Error",
      message: err?.message || "An unexpected error occurred."
    });
  });

  const server = app.listen(PORT, "0.0.0.0", () => {
    logger.info(`HTEIM School of Ministry server running on http://0.0.0.0:${PORT}`);
  });

  // Graceful shutdown handling
  process.on("SIGTERM", () => {
    logger.info("SIGTERM signal received: closing HTTP server");
    server.close(() => {
      logger.info("HTTP server closed");
    });
  });
}

// Catch uncaught exceptions to prevent silent container crashes
process.on("uncaughtException", (err) => {
  logger.error("Uncaught exception in server process:", err);
});

process.on("unhandledRejection", (reason) => {
  logger.error("Unhandled rejection in server process:", reason);
});

startServer();

