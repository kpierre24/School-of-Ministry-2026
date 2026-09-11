import express from "express";
import path from "path";
import fs from "fs";
import os from "os";
import dotenv from "dotenv";

import { createApp } from "./src/server/app";
import { initializeRelationalSchema } from "./src/server/services/domain";
import { isSupabaseConfigured } from "./src/server/services/supabaseServer";
import { logger } from "./src/lib/logger";

dotenv.config();

const currentFilename = typeof __filename !== "undefined" ? __filename : process.cwd();
const currentDirname = typeof __dirname !== "undefined" ? __dirname : path.dirname(currentFilename);

const PORT = 3000;
const HOST = "0.0.0.0";

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

  // Initialize relational PostgreSQL database tables
  initializeRelationalSchema().catch((e) => logger.warn("Relational init warning:", e));

  const app = createApp();
  const isDev =
    process.env.NODE_ENV !== "production" &&
    !currentFilename.endsWith(".cjs") &&
    !currentDirname.includes("dist");

  // Vite middleware for development vs static asset serving in production
  if (isDev) {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
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
          if (filePath.endsWith(".html") || filePath.endsWith("sw.js") || filePath.endsWith("registerSW.js")) {
            res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
          }
        },
      })
    );

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

  // Start single unified server on PORT 3000 (bound to 0.0.0.0)
  const server = app.listen(PORT, HOST, () => {
    logger.info(`HTEIM School of Ministry server running on http://localhost:${PORT}`);
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

