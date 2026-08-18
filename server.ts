import express from "express";
import { createServer as createHttpServer } from "http";
import path from "path";
import dotenv from "dotenv";

import { githubRouter } from "./src/server/routes/github";
import { aiRouter } from "./src/server/routes/ai";
import { driveProxyRouter } from "./src/server/routes/driveProxy";
import { logger } from "./src/lib/logger";
import { securityHeaders, rateLimiter, sanitizeBody } from "./src/server/middleware/security";

dotenv.config();

const app = express();
const httpServer = createHttpServer(app);
const PORT = 3000; // Hardcoded strictly to 3000 as mandated by infrastructure proxy configuration

// Apply security response headers globally
app.use(securityHeaders);

// Limit payload size to prevent payload bombing attacks
app.use(express.json({ limit: "10mb" }));

// Sanitize incoming JSON bodies
app.use(sanitizeBody);

// Health endpoints for Cloud Run and monitoring probes (both root and api)
app.get(["/", "/health", "/api/health", "/_health"], (req, res, next) => {
  // If it's a browser requesting HTML at '/', let it fall through to static SPA serving
  if (req.path === "/" && req.accepts("html")) {
    return next();
  }
  res.status(200).json({
    status: "ok",
    service: "hteim-school-of-ministry",
    timestamp: new Date().toISOString()
  });
});

// Apply rate limiting specifically to /api endpoints (exclude health check)
app.use("/api", rateLimiter(100, 15 * 60 * 1000));

app.use("/api/github", githubRouter);
app.use("/api/ai", aiRouter);
app.use("/api/drive-proxy", driveProxyRouter);

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true, hmr: { server: httpServer } },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(
      express.static(distPath, {
        setHeaders: (res) => {
          res.setHeader("X-Content-Type-Options", "nosniff");
          res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
          res.setHeader("X-XSS-Protection", "1; mode=block");
        },
      })
    );
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  httpServer.listen(PORT, "0.0.0.0", () => {
    logger.info(`HTEIM School of Ministry server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
