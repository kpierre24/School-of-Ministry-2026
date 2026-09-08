import { Router, Request, Response } from "express";
import { getAuthoritativeState, saveAuthoritativeState, logAuditEvent } from "../services/supabaseServer";
import { requireAuth, requirePermission, requireResourceOwnership } from "../middleware/rbac";
import { roleHasPermission } from "../../types/rbac";
import { logger } from "../../lib/logger";

export const attendanceRouter = Router();

/**
 * GET /api/attendance
 * Retrieves authoritative attendance records.
 * RBAC: Students only receive their own records unless they have attendance:view_all.
 */
attendanceRouter.get("/", async (req: Request, res: Response) => {
  try {
    const user = req.user;
    const userEmail = user?.email || (req.query.userEmail as string) || undefined;
    const state = await getAuthoritativeState(userEmail);

    if (!state) {
      return res.status(200).json({ records: [], classDays: [], excusedAbsences: {}, totalRecords: 0 });
    }

    let records = state.records || [];
    const classDays = state.classDays || [];
    const excusedAbsences = state.excusedAbsences || {};

    // RBAC: Restrict student view to own attendance
    if (user && user.role === "student" && !roleHasPermission(user.role, "attendance:view_all")) {
      const ownName = (user.studentName || user.name || user.email.split("@")[0]).toLowerCase().trim();
      records = records.filter((r: any) => (r.student?.name || "").toLowerCase().trim() === ownName);
    }

    return res.status(200).json({
      records,
      classDays,
      excusedAbsences,
      totalRecords: records.length,
      totalSessions: classDays.length,
      policyThreshold: "75%",
      updatedAt: state.updatedAt || new Date().toISOString(),
    });
  } catch (err: any) {
    logger.error("GET /api/attendance error:", err);
    return res.status(500).json({ error: "Failed to fetch attendance records" });
  }
});

/**
 * POST /api/attendance/checkin
 * Records student check-in status (Present, Absent, Excused, Tardy) authoritatively.
 * RBAC: Students can self check-in; instructors/admins can mark any student.
 */
attendanceRouter.post(
  "/checkin",
  requireAuth,
  requireResourceOwnership({
    getTarget: (req) => ({
      targetStudentName: req.body.studentName,
      targetEmail: req.body.studentEmail,
    }),
    allowedRoles: ["super_admin", "admin", "registrar", "lecturer"],
  }),
  async (req: Request, res: Response) => {
    try {
      const { studentName, date, status, notes } = req.body;
      const actorEmail = req.user?.email || "teacher";

      if (!studentName || !date) {
        return res.status(400).json({ error: "studentName and date are required" });
      }

      const state = (await getAuthoritativeState(actorEmail)) || {};
      const records = [...(state.records || [])];
      const normName = studentName.toLowerCase().trim();

      // Check if record exists
      const existingIndex = records.findIndex((r: any) => {
        const matchName = (r.student?.name || "").toLowerCase().trim() === normName;
        const matchDate = r.date === date || r.sessionDate === date;
        return matchName && matchDate;
      });

      const checkinStatus = status || "Present";
      const timestamp = new Date().toISOString();

      const recordPayload = {
        id: existingIndex >= 0 ? records[existingIndex].id : `att_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        date,
        sessionDate: date,
        status: checkinStatus,
        notes: notes || "",
        student: {
          name: studentName,
          email: req.body.studentEmail || undefined,
          photoUrl: state.studentPhotos?.[normName] || undefined,
        },
        updatedAt: timestamp,
        recordedBy: actorEmail,
      };

      if (existingIndex >= 0) {
        records[existingIndex] = { ...records[existingIndex], ...recordPayload };
      } else {
        records.push(recordPayload);
      }

      const updatedState = {
        ...state,
        records,
        updatedAt: timestamp,
        updatedBy: actorEmail,
      };

      await saveAuthoritativeState(
        updatedState,
        actorEmail,
        `Attendance recorded for ${studentName} on ${date}: ${checkinStatus}`
      );

      await logAuditEvent({
        actorUserId: actorEmail,
        entityType: "attendance",
        entityId: `${studentName}_${date}`,
        action: "attendance_override",
        newValues: { studentName, date, status: checkinStatus, notes },
      });

      return res.status(200).json({
        status: "recorded",
        record: recordPayload,
      });
    } catch (err: any) {
      logger.error("POST /api/attendance/checkin error:", err);
      return res.status(500).json({ error: "Failed to record check-in" });
    }
  }
);

/**
 * POST /api/attendance/batch
 * Batch saves attendance records for an entire class day.
 * RBAC: Only super_admin, admin, lecturer
 */
attendanceRouter.post(
  "/batch",
  requireAuth,
  requirePermission(["attendance:mark_all", "attendance:mark_assigned", "all:access"]),
  async (req: Request, res: Response) => {
    try {
      const { date, records: incomingRecords } = req.body;
      const actorEmail = req.user?.email || "teacher";

      if (!date || !Array.isArray(incomingRecords)) {
        return res.status(400).json({ error: "date and records array are required" });
      }

      const state = (await getAuthoritativeState(actorEmail)) || {};
      let existingRecords = [...(state.records || [])];

      // Remove old records for this exact date to replace with batch
      existingRecords = existingRecords.filter((r: any) => r.date !== date && r.sessionDate !== date);

      // Append new batch records
      const timestamp = new Date().toISOString();
      const formatted = incomingRecords.map((r: any) => ({
        id: r.id || `att_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        date,
        sessionDate: date,
        status: r.status || "Present",
        notes: r.notes || "",
        student: r.student || { name: r.studentName },
        updatedAt: timestamp,
        recordedBy: actorEmail,
      }));

      const updatedState = {
        ...state,
        records: [...existingRecords, ...formatted],
        updatedAt: timestamp,
        updatedBy: actorEmail,
      };

      await saveAuthoritativeState(
        updatedState,
        actorEmail,
        `Batch attendance saved for ${date} (${formatted.length} records)`
      );

      await logAuditEvent({
        actorUserId: actorEmail,
        entityType: "attendance",
        entityId: date,
        action: "update",
        newValues: { date, count: formatted.length },
      });

      return res.status(200).json({
        status: "saved",
        count: formatted.length,
        date,
      });
    } catch (err: any) {
      logger.error("POST /api/attendance/batch error:", err);
      return res.status(500).json({ error: "Failed to batch save attendance" });
    }
  }
);

/**
 * POST /api/attendance/override
 * Overrides a student's attendance record.
 * RBAC: Only super_admin, admin, lecturer
 */
attendanceRouter.post(
  "/override",
  requireAuth,
  requirePermission(["attendance:override", "attendance:mark_all", "all:access"]),
  async (req: Request, res: Response) => {
    try {
      const { studentName, date, status, reason } = req.body;
      const actorEmail = req.user?.email || "admin";

      if (!studentName || !date || !status) {
        return res.status(400).json({ error: "studentName, date, and status are required" });
      }

      const state = (await getAuthoritativeState(actorEmail)) || {};
      const records = [...(state.records || [])];
      const norm = studentName.toLowerCase().trim();

      const idx = records.findIndex((r: any) => {
        const matchName = (r.student?.name || "").toLowerCase().trim() === norm;
        const matchDate = r.date === date || r.sessionDate === date;
        return matchName && matchDate;
      });

      const oldStatus = idx >= 0 ? records[idx].status : "None";
      const recordPayload = {
        id: idx >= 0 ? records[idx].id : `att_${Date.now()}`,
        date,
        sessionDate: date,
        status,
        notes: reason ? `[Override by ${actorEmail}]: ${reason}` : (idx >= 0 ? records[idx].notes : ""),
        student: {
          name: studentName,
          photoUrl: state.studentPhotos?.[norm] || undefined,
        },
        updatedAt: new Date().toISOString(),
        recordedBy: actorEmail,
        override: {
          previousStatus: oldStatus,
          reason: reason || "Administrative override",
          by: actorEmail,
          at: new Date().toISOString(),
        },
      };

      if (idx >= 0) {
        records[idx] = recordPayload;
      } else {
        records.push(recordPayload);
      }

      const updatedState = {
        ...state,
        records,
        updatedAt: new Date().toISOString(),
        updatedBy: actorEmail,
      };

      await saveAuthoritativeState(
        updatedState,
        actorEmail,
        `Attendance override: ${studentName} on ${date} -> ${status}`
      );

      await logAuditEvent({
        actorUserId: actorEmail,
        entityType: "attendance",
        entityId: `${studentName}_${date}`,
        action: "attendance_override",
        oldValues: { status: oldStatus },
        newValues: { status, reason },
      });

      return res.status(200).json({
        status: "overridden",
        record: recordPayload,
      });
    } catch (err: any) {
      logger.error("POST /api/attendance/override error:", err);
      return res.status(500).json({ error: "Failed to override attendance" });
    }
  }
);

/**
 * POST /api/attendance/excuse
 * Records or requests an excused absence.
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
      const { studentName, date, reason, documentUrl } = req.body;
      const actorEmail = req.user?.email || "student";

      if (!studentName || !date) {
        return res.status(400).json({ error: "studentName and date are required" });
      }

      const state = (await getAuthoritativeState(actorEmail)) || {};
      const excusedAbsences = { ...(state.excusedAbsences || {}) };
      const records = [...(state.records || [])];
      const norm = studentName.toLowerCase().trim();

      const key = `${studentName}_${date}`;
      excusedAbsences[key] = {
        studentName,
        date,
        reason: reason || "Medical / Ministry Duty",
        documentUrl: documentUrl || null,
        status: "approved",
        approvedBy: actorEmail,
        approvedAt: new Date().toISOString(),
      };

      const idx = records.findIndex((r: any) => {
        const matchName = (r.student?.name || "").toLowerCase().trim() === norm;
        const matchDate = r.date === date || r.sessionDate === date;
        return matchName && matchDate;
      });

      if (idx >= 0) {
        records[idx] = {
          ...records[idx],
          status: "Excused",
          notes: reason || records[idx].notes || "Excused absence",
          documentUrl: documentUrl || records[idx].documentUrl,
          updatedAt: new Date().toISOString(),
        };
      }

      const updatedState = {
        ...state,
        excusedAbsences,
        records,
        updatedAt: new Date().toISOString(),
        updatedBy: actorEmail,
      };

      await saveAuthoritativeState(
        updatedState,
        actorEmail,
        `Excused absence for ${studentName} on ${date}`
      );

      return res.status(200).json({
        status: "excused",
        studentName,
        date,
        reason,
      });
    } catch (err: any) {
      logger.error("POST /api/attendance/excuse error:", err);
      return res.status(500).json({ error: "Failed to record excused absence" });
    }
  }
);

/**
 * GET /api/attendance/at-risk
 * Returns at-risk students failing the required 75% attendance policy threshold.
 * RBAC: Only authorized staff (super_admin, admin, registrar, lecturer)
 */
attendanceRouter.get(
  "/at-risk",
  requireAuth,
  requirePermission(["attendance:view_all", "reports:view_all", "all:access"]),
  async (req: Request, res: Response) => {
    try {
      const userEmail = req.user?.email || (req.query.userEmail as string) || undefined;
      const state = await getAuthoritativeState(userEmail);

      if (!state) {
        return res.status(200).json({ atRiskStudents: [], count: 0 });
      }

      const records = state.records || [];
      const classDays = state.classDays || [];
      const totalSessions = classDays.length;

      if (totalSessions === 0) {
        return res.status(200).json({ atRiskStudents: [], count: 0, threshold: "75%" });
      }

      // Group records by student
      const studentMap = new Map<string, { present: number; excused: number }>();
      for (const r of records) {
        const name = r.student?.name?.trim();
        if (!name) continue;
        if (!studentMap.has(name)) {
          studentMap.set(name, { present: 0, excused: 0 });
        }
        const item = studentMap.get(name)!;
        const s = (r.status || "").toLowerCase();
        if (s === "present" || s === "p" || s === "1" || s === "attended") {
          item.present++;
        } else if (s === "excused" || s === "e") {
          item.excused++;
        }
      }

      const atRiskStudents: any[] = [];
      for (const [name, counts] of studentMap.entries()) {
        const rate = Math.round(((counts.present + counts.excused) / totalSessions) * 100);
        if (rate < 75) {
          atRiskStudents.push({
            name,
            attendanceRate: rate,
            sessionsAttended: counts.present + counts.excused,
            totalSessions,
            isCritical: rate <= 50,
            level: state.studentLevels?.[name] || "Level 1 Foundation",
            photoUrl: state.studentPhotos?.[name.toLowerCase().trim()] || null,
          });
        }
      }

      atRiskStudents.sort((a, b) => a.attendanceRate - b.attendanceRate);

      return res.status(200).json({
        atRiskStudents,
        count: atRiskStudents.length,
        policyThreshold: "75%",
        criticalThreshold: "50%",
      });
    } catch (err: any) {
      logger.error("GET /api/attendance/at-risk error:", err);
      return res.status(500).json({ error: "Failed to evaluate at-risk attendance" });
    }
  }
);
