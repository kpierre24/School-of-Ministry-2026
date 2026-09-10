import { Router, Request, Response } from "express";
import { stateHydrationService } from "../services/domain";
import { saveAuthoritativeStateForUser, StateConcurrencyError } from "../services/supabaseServer";
import { requireAuth, requirePermission } from "../middleware/rbac";
import { logger } from "../../lib/logger";

export const stateRouter = Router();

// Default-deny at the router level: All routes require authentication
stateRouter.use(requireAuth);

/**
 * GET /api/state
 * Retrieves the authorized application state for the authenticated user (derived strictly from req.user.userId)
 * dynamically composed from relational domain tables.
 */
stateRouter.get("/", async (req: Request, res: Response) => {
  try {
    const user = req.user!;
    const state = await stateHydrationService.getComposedStateForUser(user);

    if (!state) {
      return res.status(200).json({
        state: null,
        version: 0,
        source: "relational_postgresql",
        userId: user.userId,
        message: "No state found"
      });
    }

    const version = Number(state.version) || 1;

    return res.status(200).json({
      state,
      version,
      source: "relational_postgresql",
      userId: user.userId,
      role: user.role,
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    logger.error("GET /api/state error:", err);
    return res.status(500).json({ error: "Failed to load state from relational database" });
  }
});

/**
 * POST /api/state
 * Saves state authoritatively for the authenticated user (derived strictly from req.user.userId).
 * Enforces optimistic concurrency (version checking). If database version has changed, returns 409 Conflict.
 * RBAC: Requires write permission
 */
stateRouter.post(
  "/",
  requirePermission([
    "all:access"
  ]),
  async (req: Request, res: Response) => {
    try {
      const user = req.user!;
      const { state, expectedVersion: bodyVersion, actionDescription } = req.body;

      if (!state || typeof state !== "object") {
        return res.status(400).json({ error: "State object is required" });
      }

      // Extract expectedVersion from body or headers (If-Match / x-expected-version) or state payload
      let expectedVersion: number | null | undefined = undefined;
      if (typeof bodyVersion === "number") {
        expectedVersion = bodyVersion;
      } else if (req.headers["if-match"]) {
        const raw = String(req.headers["if-match"]).replace(/["\s]/g, "");
        const parsed = parseInt(raw, 10);
        if (!isNaN(parsed)) expectedVersion = parsed;
      } else if (req.headers["x-expected-version"]) {
        const parsed = parseInt(String(req.headers["x-expected-version"]), 10);
        if (!isNaN(parsed)) expectedVersion = parsed;
      } else if (typeof state?.version === "number") {
        expectedVersion = state.version;
      }

      const result = await saveAuthoritativeStateForUser(user, state, actionDescription, expectedVersion);
      return res.status(200).json({
        success: true,
        version: result.version,
        updatedAt: result.updatedAt,
        userId: user.userId,
        source: "relational_postgresql",
      });
    } catch (err: any) {
      if (err instanceof StateConcurrencyError || err?.code === "CONCURRENCY_CONFLICT" || err?.status === 409) {
        logger.warn(`[StateRouter] Concurrency conflict (409) for user ${req.user?.userId}:`, {
          expectedVersion: err.expectedVersion,
          currentVersion: err.currentVersion,
        });
        return res.status(409).json({
          error: "State concurrency conflict. The application state was modified by another user or session.",
          code: "CONCURRENCY_CONFLICT",
          expectedVersion: err.expectedVersion,
          currentVersion: err.currentVersion,
          currentUpdatedAt: err.currentUpdatedAt,
        });
      }

      logger.error("POST /api/state error:", err);
      return res.status(500).json({ error: "Failed to persist state to database" });
    }
  }
);
