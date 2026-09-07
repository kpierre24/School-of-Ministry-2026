import { Router, Request, Response } from "express";
import { getAuditLogs, logAuditEvent } from "../services/supabaseServer";
import { requireAuth, requirePermission } from "../middleware/rbac";
import { logger } from "../../lib/logger";

export const auditLogsRouter = Router();

/**
 * GET /api/audit-logs
 * Retrieves audit history log entries from PostgreSQL.
 * RBAC: Super Admin, Admin (audit_logs:view)
 */
auditLogsRouter.get(
  "/",
  requireAuth,
  requirePermission(["audit_logs:view", "all:access"]),
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
 * Appends an audit log entry.
 * RBAC: Authenticated user / system service
 */
auditLogsRouter.post(
  "/",
  requireAuth,
  async (req: Request, res: Response) => {
    try {
      const { action, entityType, entityId, notes } = req.body;
      const userEmail = req.user?.email || req.body.userEmail || "system";

      if (!action || !entityType || !entityId) {
        return res.status(400).json({ error: "action, entityType, and entityId are required" });
      }

      const ok = await logAuditEvent({
        actorUserId: userEmail,
        entityType,
        entityId,
        action: action || "update",
        newValues: { notes, timestamp: new Date().toISOString() },
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

