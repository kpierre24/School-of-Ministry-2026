import { Router, Request, Response } from "express";
import { getAuthorizedStateForUser, saveAuthoritativeStateForUser } from "../services/supabaseServer";
import { requireAuth, requirePermission } from "../middleware/rbac";
import { logger } from "../../lib/logger";

export const stateRouter = Router();

// Default-deny at the router level: All routes require authentication
stateRouter.use(requireAuth);

/**
 * GET /api/state
 * Retrieves the authorized application state for the authenticated user (derived strictly from req.user.userId).
 * The userEmail query parameter model is abolished.
 */
stateRouter.get("/", async (req: Request, res: Response) => {
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
    logger.error("GET /api/state error:", err);
    return res.status(500).json({ error: "Failed to load state from PostgreSQL database" });
  }
});

/**
 * POST /api/state
 * Saves state authoritatively for the authenticated user (derived strictly from req.user.userId).
 * RBAC: Requires write permission
 */
stateRouter.post(
  "/",
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
    logger.error("POST /api/state error:", err);
    return res.status(500).json({ error: "Failed to persist state to PostgreSQL database" });
  }
});

