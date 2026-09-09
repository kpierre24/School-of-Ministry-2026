import { Router, Request, Response } from "express";
import { getAuditLogs, logAuditEvent } from "../services/supabaseServer";
import { requireAuth, requirePermission } from "../middleware/rbac";
import { logger } from "../../lib/logger";

export const auditLogsRouter = Router();

// Default-deny at the router level: All routes require authentication
auditLogsRouter.use(requireAuth);

/**
 * GET /api/audit-logs
 * Retrieves audit history log entries from PostgreSQL.
 * RBAC: Requires audit:read
 */
auditLogsRouter.get(
  "/",
  requirePermission(["audit:read", "all:access"]),
  async (req: Request, res: Response) => {
    try {
      const limit = parseInt((req.query.limit as string) || "50", 10);
      const entityType = (req.query.entityType as string) || undefined;

      const logs = await getAuditLogs(limit, entityType);
      return res.status(200).json({
        logs,
        count: logs.length,
      });
    } catch (err: any) {
      logger.error("GET /api/audit-logs error:", err);
      return res.status(500).json({ error: "Failed to fetch audit logs" });
    }
  }
);

/**
 * POST /api/audit-logs
 * Appends a manual audit log entry.
 * RBAC: Requires audit:read or all:access
 */
auditLogsRouter.post(
  "/",
  requireAuth,
  requirePermission(["audit:read", "all:access"]),
  async (req: Request, res: Response) => {
    try {
      const { action, entityType, entityId, notes, reason, oldValues, newValues } = req.body;
      const actorUserId = req.user!.userId;
      const actorRole = req.user!.role;
      if (!action || !entityType || !entityId) {
        return res.status(400).json({ error: "action, entityType, and entityId are required" });
      }

      const ok = await logAuditEvent({
        actorUserId,
        actorRole,
        entityType,
        entityId,
        action: action || "update",
        oldValues: oldValues || null,
        newValues: newValues || { notes, timestamp: new Date().toISOString() },
        reason: reason || notes || null,
        requestId: (req.headers["x-request-id"] as string) || undefined,
        ipAddress: (req.headers["x-forwarded-for"] as string) || req.socket.remoteAddress,
        userAgent: req.headers["user-agent"],
      });

      return res.status(201).json({ status: ok ? "logged" : "failed" });
    } catch (err: any) {
      logger.error("POST /api/audit-logs error:", err);
      return res.status(500).json({ error: "Failed to create audit log entry" });
    }
  }
);
