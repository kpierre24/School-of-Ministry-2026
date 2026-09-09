import { Router, Request, Response } from "express";
import { attendanceService, validateAttendanceStatus } from "../services/domain";
import { requireAuth, requirePermission, requireResourceOwnership } from "../middleware/rbac";
import { logger } from "../../lib/logger";

export const attendanceRouter = Router();

// Default-deny at the router level: All routes require authentication
attendanceRouter.use(requireAuth);

/**
 * GET /api/attendance
 * Retrieves authoritative attendance records from relational tables.
 * RBAC: Requires attendance:read. Students only receive their own records.
 */
attendanceRouter.get(
  "/",
  requirePermission(["attendance:read", "all:access"]),
  async (req: Request, res: Response) => {
    try {
      const user = req.user!;
      const data = await attendanceService.getAttendance(user);

      return res.status(200).json({
        records: data.records,
        sessions: data.sessions,
        classDays: data.classDays,
        excusedAbsences: data.excusedAbsences,
        totalRecords: data.totalRecords,
        totalSessions: data.totalSessions,
        policyThreshold: data.policyThreshold,
        updatedAt: new Date().toISOString(),
      });
    } catch (err: any) {
      logger.error("GET /api/attendance error:", err);
      return res.status(500).json({ error: "Failed to fetch attendance records" });
    }
  }
);

/**
 * POST /api/attendance/checkin
 * Records student check-in status (PRESENT, ABSENT, LATE, EXCUSED) directly in PostgreSQL attendance table.
 * Strictly validates status enum; rejects arbitrary strings.
 * RBAC: Requires attendance:write.
 */
attendanceRouter.post(
  "/checkin",
  requireAuth,
  requirePermission(["attendance:write", "all:access"]),
  requireResourceOwnership({
    getTarget: (req) => ({
      targetStudentName: req.body.studentName,
      targetEmail: req.body.studentEmail,
    }),
    allowedRoles: ["super_admin", "admin", "registrar", "lecturer"],
  }),
  async (req: Request, res: Response) => {
    try {
      const { studentName, studentId, date, status, notes, studentEmail, sessionId, manualOverride } = req.body;
      const actorUserId = req.user?.email || "teacher";

      if ((!studentName && !studentId) || !date) {
        return res.status(400).json({ error: "studentId or studentName, and date are required" });
      }

      // Enforce strict enum validation; reject arbitrary strings
      try {
        validateAttendanceStatus(status);
      } catch (valErr: any) {
        return res.status(400).json({ error: valErr.message });
      }

      const result = await attendanceService.recordCheckin(
        { studentName, studentId, date, status, notes, studentEmail, sessionId, manualOverride },
        actorUserId
      );

      return res.status(200).json(result);
    } catch (err: any) {
      logger.error("POST /api/attendance/checkin error:", err);
      return res.status(500).json({ error: err?.message || "Failed to record check-in" });
    }
  }
);

/**
 * POST /api/attendance/batch
 * Batch saves attendance records using non-destructive UPSERT inside a transaction.
 * Strictly validates status enum (PRESENT, ABSENT, LATE, EXCUSED) across all records.
 * Arbitrary strings are forbidden.
 * RBAC: Requires attendance:write
 */
attendanceRouter.post(
  "/batch",
  requireAuth,
  requirePermission(["attendance:write", "all:access"]),
  async (req: Request, res: Response) => {
    try {
      const { date, records: incomingRecords, sessionId, sessionTitle } = req.body;
      const actorUserId = req.user?.email || "teacher";

      if (!date || !Array.isArray(incomingRecords)) {
        return res.status(400).json({ error: "date and records array are required" });
      }

      // Enforce strict enum validation across all records; reject arbitrary strings immediately
      for (let i = 0; i < incomingRecords.length; i++) {
        const r = incomingRecords[i];
        try {
          validateAttendanceStatus(r.status);
        } catch (valErr: any) {
          return res.status(400).json({
            error: `Record #${i + 1} (${r.studentName || r.studentId || 'unknown'}): ${valErr.message}`,
          });
        }
      }

      const result = await attendanceService.recordBatchAttendance(
        { date, records: incomingRecords, sessionId, sessionTitle },
        actorUserId
      );

      return res.status(200).json(result);
    } catch (err: any) {
      logger.error("POST /api/attendance/batch error:", err);
      return res.status(500).json({ error: err?.message || "Failed to batch save attendance" });
    }
  }
);

/**
 * POST /api/attendance/override
 * Overrides a student's attendance record with audit trail in relational table.
 * Strictly validates status enum (PRESENT, ABSENT, LATE, EXCUSED).
 * RBAC: Requires attendance:approve
 */
attendanceRouter.post(
  "/override",
  requireAuth,
  requirePermission(["attendance:approve", "all:access"]),
  async (req: Request, res: Response) => {
    try {
      const { studentName, studentId, date, status, reason, sessionId } = req.body;
      const actorUserId = req.user?.email || "admin";

      if (!studentName || !date || !status) {
        return res.status(400).json({ error: "studentName, date, and status are required" });
      }

      // Enforce strict enum validation; reject arbitrary strings
      try {
        validateAttendanceStatus(status);
      } catch (valErr: any) {
        return res.status(400).json({ error: valErr.message });
      }

      const result = await attendanceService.recordCheckin(
        {
          studentName,
          studentId,
          date,
          sessionId,
          status,
          notes: reason ? `[Override by ${actorUserId}]: ${reason}` : "Administrative override",
          manualOverride: true,
        },
        actorUserId
      );

      return res.status(200).json({
        status: "overridden",
        record: result.record,
      });
    } catch (err: any) {
      logger.error("POST /api/attendance/override error:", err);
      return res.status(500).json({ error: err?.message || "Failed to override attendance" });
    }
  }
);

/**
 * POST /api/attendance/excuse
 * Records or requests an excused absence in relational tables.
 */
attendanceRouter.post(
  "/excuse",
  requireAuth,
  requireResourceOwnership({
    getTarget: (req) => ({
      targetStudentName: req.body.studentName,
    }),
    allowedRoles: ["super_admin", "admin", "registrar", "lecturer"],
  }),
  async (req: Request, res: Response) => {
    try {
      const { studentName, studentId, date, reason, documentUrl } = req.body;
      const actorUserId = req.user?.email || "student";

      if ((!studentName && !studentId) || !date) {
        return res.status(400).json({ error: "studentId or studentName, and date are required" });
      }

      const result = await attendanceService.recordExcuse(
        { studentName, studentId, date, reason, documentUrl },
        actorUserId
      );

      return res.status(200).json(result);
    } catch (err: any) {
      logger.error("POST /api/attendance/excuse error:", err);
      return res.status(500).json({ error: "Failed to record excused absence" });
    }
  }
);

/**
 * GET /api/attendance/at-risk
 * Returns at-risk students failing the required 75% attendance policy threshold.
 * RBAC: Requires attendance:read
 */
attendanceRouter.get(
  "/at-risk",
  requirePermission(["attendance:read", "all:access"]),
  async (req: Request, res: Response) => {
    try {
      const user = req.user!;
      const result = await attendanceService.getAtRiskStudents(user);

      return res.status(200).json(result);
    } catch (err: any) {
      logger.error("GET /api/attendance/at-risk error:", err);
      return res.status(500).json({ error: "Failed to evaluate at-risk attendance" });
    }
  }
);
