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

  // Bind to 0.0.0.0 and port 3000 for container ingress routing
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

  let HOST = process.env.HOST || "0.0.0.0";
  const hostArgIdx = process.argv.indexOf("--host");
  if (hostArgIdx !== -1) {
    const nextArg = process.argv[hostArgIdx + 1];
    if (nextArg && !nextArg.startsWith("-")) {
      HOST = nextArg;
    } else {
      HOST = "0.0.0.0";
    }
  }


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

