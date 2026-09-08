import { Router, Request, Response } from "express";
import { requireAuth, requirePermission } from "../middleware/rbac";
import { getAuthorizedStateForUser, saveAuthoritativeStateForUser } from "../services/supabaseServer";
import { logger } from "../../lib/logger";

export const meRouter = Router();

// Default-deny at the router level: All routes require authentication
meRouter.use(requireAuth);

/**
 * GET /api/me/state
 * Determines authenticated userId strictly from req.user and loads that user's authorized state.
 * The client never passes or selects whose private state it is retrieving.
 */
meRouter.get("/state", async (req: Request, res: Response) => {
  try {
    const user = req.user!;
    const state = await getAuthorizedStateForUser(user);

    if (!state) {
      return res.status(200).json({
        state: null,
        source: "postgresql",
        userId: user.userId,
        message: "No stored state found"
      });
    }

    return res.status(200).json({
      state,
      source: "postgresql",
      userId: user.userId,
      role: user.role,
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    logger.error("GET /api/me/state error:", err);
    return res.status(500).json({ error: "Failed to load authorized state from PostgreSQL database" });
  }
});

/**
 * POST /api/me/state
 * Saves state authoritatively for the authenticated user based on req.user.userId.
 */
meRouter.post(
  "/state",
  requirePermission([
    "students:write",
    "attendance:write",
    "grades:write",
    "finance:write",
    "assignments:submit",
    "roles:manage",
    "all:access"
  ]),
  async (req: Request, res: Response) => {
    try {
      const user = req.user!;
      const { state, actionDescription } = req.body;

      if (!state || typeof state !== "object") {
        return res.status(400).json({ error: "State object is required" });
      }

      const result = await saveAuthoritativeStateForUser(user, state, actionDescription);
      return res.status(200).json({
        success: true,
        updatedAt: result.updatedAt,
        userId: user.userId,
        source: "postgresql",
      });
    } catch (err: any) {
      logger.error("POST /api/me/state error:", err);
      return res.status(500).json({ error: "Failed to save state to PostgreSQL database" });
    }
  }
);
