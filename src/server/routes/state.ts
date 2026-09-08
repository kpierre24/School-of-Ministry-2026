import { Router, Request, Response } from "express";
import { getAuthoritativeState, saveAuthoritativeState } from "../services/supabaseServer";
import { requireAuth, requirePermission } from "../middleware/rbac";
import { logger } from "../../lib/logger";

export const stateRouter = Router();

// Default-deny at the router level: All routes require authentication
stateRouter.use(requireAuth);

/**
 * GET /api/state
 * Retrieves the full authoritative application state from Supabase PostgreSQL.
 */
stateRouter.get("/", async (req: Request, res: Response) => {
  try {
    // Identity is established strictly by req.user; req.query.userEmail is purely informational
    const authenticatedEmail = req.user?.email;
    const targetEmail = (req.query.userEmail as string) || authenticatedEmail || undefined;
    const state = await getAuthoritativeState(targetEmail);

    if (!state) {
      return res.status(200).json({ state: null, source: "postgresql", message: "No stored state found" });
    }

    return res.status(200).json({
      state,
      source: "postgresql",
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    logger.error("GET /api/state error:", err);
    return res.status(500).json({ error: "Failed to load state from PostgreSQL database" });
  }
});

/**
 * POST /api/state
 * Saves the full authoritative application state to Supabase PostgreSQL.
 * RBAC: Requires write permission
 */
stateRouter.post(
  "/",
  requirePermission(["students:write", "attendance:write", "grades:write", "finance:write", "roles:manage", "all:access"]),
  async (req: Request, res: Response) => {
  try {
    const { state, actionDescription } = req.body;
    // Actor identity is derived strictly from req.user; req.body.userEmail cannot establish identity
    const actorEmail = req.user?.email || "system";

    if (!state || typeof state !== "object") {
      return res.status(400).json({ error: "State object is required" });
    }

    const result = await saveAuthoritativeState(state, actorEmail, actionDescription);
    return res.status(200).json({
      success: true,
      updatedAt: result.updatedAt,
      source: "postgresql",
    });
  } catch (err: any) {
    logger.error("POST /api/state error:", err);
    return res.status(500).json({ error: "Failed to persist state to PostgreSQL database" });
  }
});
