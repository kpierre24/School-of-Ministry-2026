import { Router, Request, Response } from "express";
import { getAuthoritativeState, saveAuthoritativeState } from "../services/supabaseServer";
import { logger } from "../../lib/logger";

export const stateRouter = Router();

/**
 * GET /api/state
 * Retrieves the full authoritative application state from Supabase PostgreSQL.
 */
stateRouter.get("/", async (req: Request, res: Response) => {
  try {
    const userEmail = (req.query.userEmail as string) || undefined;
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
 */
stateRouter.post("/", async (req: Request, res: Response) => {
  try {
    const { state, userEmail, actionDescription } = req.body;

    if (!state || typeof state !== "object") {
      return res.status(400).json({ error: "State object is required" });
    }

    const result = await saveAuthoritativeState(state, userEmail, actionDescription);
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
