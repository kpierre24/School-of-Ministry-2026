import express from "express";
import { createServer as createHttpServer } from "http";
import path from "path";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";

import { githubRouter } from "./src/server/routes/github";
import { aiRouter } from "./src/server/routes/ai";
import { logger } from "./src/lib/logger";
import { securityHeaders, rateLimiter, sanitizeBody } from "./src/server/middleware/security";

dotenv.config();

const app = express();
const httpServer = createHttpServer(app);
const PORT = 3000;

// Apply security response headers globally
app.use(securityHeaders);

// Limit payload size to prevent payload bombing attacks
app.use(express.json({ limit: "10mb" }));

// Sanitize incoming JSON bodies
app.use(sanitizeBody);

// Apply rate limiting specifically to /api endpoints
app.use("/api", rateLimiter(100, 15 * 60 * 1000));

app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok", timestamp: new Date().toISOString() });
});

app.use("/api/github", githubRouter);
app.use("/api/ai", aiRouter);

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true, hmr: { server: httpServer } },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  httpServer.listen(PORT, "0.0.0.0", () => {
    logger.info(`HTEIM School of Ministry server running on http://localhost:${PORT}`);
  });
}

startServer();
