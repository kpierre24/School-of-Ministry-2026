import { Router, Request, Response } from "express";
import { getAuthoritativeState, saveAuthoritativeState, logAuditEvent } from "../services/supabaseServer";
import { requireAuth, requirePermission } from "../middleware/rbac";
import { logger } from "../../lib/logger";

export const stateRouter = Router();

/**
 * GET /api/state
 * Retrieves the authoritative application state from Supabase PostgreSQL.
 * Open to authenticated or sync clients.
 */
stateRouter.get("/", async (req: Request, res: Response) => {
  try {
    const userEmail = req.user?.email || (req.query.userEmail as string) || undefined;
    const state = await getAuthoritativeState(userEmail);

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
 * RBAC: Super Admin, Admin, Registrar, Lecturer (state update privileges)
 */
stateRouter.post(
  "/",
  requireAuth,
  requirePermission(["academics:manage_courses", "roles:manage", "students:edit_records", "all:access"]),
  async (req: Request, res: Response) => {
    try {
      const { state, actionDescription } = req.body;
      const userEmail = req.user?.email || req.body.userEmail || "admin";

      if (!state || typeof state !== "object") {
        return res.status(400).json({ error: "State object is required" });
      }

      const result = await saveAuthoritativeState(state, userEmail, actionDescription);

      await logAuditEvent({
        actorUserId: userEmail,
        entityType: "system_state",
        entityId: "authoritative_sync",
        action: "update",
        newValues: { actionDescription, updatedAt: result.updatedAt },
      });

      return res.status(200).json({
        success: true,
        updatedAt: result.updatedAt,
        source: "postgresql",
      });
    } catch (err: any) {
      logger.error("POST /api/state error:", err);
      return res.status(500).json({ error: "Failed to persist state to PostgreSQL database" });
    }
  }
);

