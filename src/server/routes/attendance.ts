import { Router, Request, Response } from "express";
import { getAuthoritativeState, saveAuthoritativeState, logAuditEvent } from "../services/supabaseServer";
import { requireAuth, requirePermission, requireResourceOwnership } from "../middleware/rbac";
import { roleHasPermission } from "../../types/rbac";
import { logger } from "../../lib/logger";
import { AttendanceStatus, ATTENDANCE_STATUS_LIST } from "../../types/attendance";
import { AttendanceRecordSchema, validateBody } from "../middleware/validation";

export const attendanceRouter = Router();

/**
 * Normalizes attendance status string to standard format
 */
function normalizeStatus(status: string | undefined): AttendanceStatus {
  if (!status) return "Present";
  const s = status.toLowerCase().trim();
  if (s === "present" || s === "p" || s === "attended" || s === "1") return "Present";
  if (s === "absent" || s === "a" || s === "0") return "Absent";
  if (s === "late" || s === "tardy" || s === "l") return "Late";
  if (s === "excused" || s === "e") return "Excused";
  if (s.includes("medical") || s.includes("leave") || s === "approved leave") return "Medical / Approved Leave";
  return "Present";
}

/**
 * GET /api/attendance
 * Retrieves authoritative attendance records, class days, session locks, and correction requests.
 * RBAC: Students only receive their own records and their own correction requests.
 */
attendanceRouter.get("/", async (req: Request, res: Response) => {
  try {
    const user = req.user;
    const userEmail = user?.email || (req.query.userEmail as string) || undefined;
    const state = await getAuthoritativeState(userEmail);

    if (!state) {
      return res.status(200).json({ 
        records: [], 
        classDays: [], 
        excusedAbsences: {}, 
        sessionLocks: {}, 
        correctionRequests: [],
        auditHistory: [],
        totalRecords: 0,
        policyThreshold: "75%",
        criticalThreshold: "50%"
      });
    }

    let records = state.records || [];
    const classDays = state.classDays || [];
    const excusedAbsences = state.excusedAbsences || {};
    const sessionLocks = state.sessionLocks || {};
    let correctionRequests = state.attendanceCorrectionRequests || [];
    let auditHistory = state.attendanceAuditLogs || [];

    // RBAC: Restrict student view to own records & own correction requests
    if (user && user.role === "student" && !roleHasPermission(user.role, "attendance:view_all")) {
      const ownName = (user.studentName || user.name || user.email.split("@")[0]).toLowerCase().trim();
      records = records.filter((r: any) => (r.student?.name || r.name || "").toLowerCase().trim() === ownName);
      correctionRequests = correctionRequests.filter(
        (cr: any) => (cr.studentName || "").toLowerCase().trim() === ownName || cr.submittedBy === user.email
      );
      auditHistory = auditHistory.filter(
        (entry: any) => (entry.studentName || "").toLowerCase().trim() === ownName
      );
    }

    return res.status(200).json({
      records,
      classDays,
      excusedAbsences,
      sessionLocks,
      correctionRequests,
      auditHistory: auditHistory.slice(0, 100), // latest 100 entries
      totalRecords: records.length,
      totalSessions: classDays.length,
      policyThreshold: "75%",
      criticalThreshold: "50%",
      updatedAt: state.updatedAt || new Date().toISOString(),
    });
  } catch (err: any) {
    logger.error("GET /api/attendance error:", err);
    return res.status(500).json({ error: "Failed to fetch attendance records" });
  }
});

/**
 * POST /api/attendance/checkin
 * Records student check-in status authoritatively.
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
  validateBody(AttendanceRecordSchema),
  async (req: Request, res: Response) => {
    try {
      const { studentName, date, classDayId, status, notes } = req.body;
      const userEmail = req.user?.email || req.body.userEmail || "teacher";
      const userRole = req.user?.role || "lecturer";

      const sessionIdentifier = classDayId || date;
      const state = (await getAuthoritativeState(userEmail)) || {};
      const records = [...(state.records || [])];
      const sessionLocks = state.sessionLocks || {};
      const normName = studentName.toLowerCase().trim();

      // Check if session is locked
      const isLocked = sessionLocks[sessionIdentifier]?.isLocked === true;
      const isAdmin = userRole === "admin" || userRole === "super_admin";

      if (isLocked && !isAdmin) {
        return res.status(403).json({ 
          error: "This session is locked. Lecturers cannot edit locked historical records. Please submit an attendance correction request." 
        });
      }

      const existingIndex = records.findIndex((r: any) => {
        const matchName = (r.student?.name || r.name || "").toLowerCase().trim() === normName;
        const matchDate = r.classDay === sessionIdentifier || r.date === date || r.sessionDate === date;
        return matchName && matchDate;
      });

      const previousStatus = existingIndex >= 0 ? normalizeStatus(records[existingIndex].status) : "None";
      const checkinStatus = normalizeStatus(status);
      const timestamp = new Date().toISOString();

      const recordPayload = {
        id: existingIndex >= 0 ? records[existingIndex].id : `att_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        name: studentName,
        date: date || sessionIdentifier,
        sessionDate: date || sessionIdentifier,
        classDay: sessionIdentifier,
        status: checkinStatus,
        present: checkinStatus === "Present" || checkinStatus === "Late" || checkinStatus === "Excused" || checkinStatus === "Medical / Approved Leave",
        score: checkinStatus === "Present" ? "100%" : checkinStatus === "Late" ? "85%" : checkinStatus === "Absent" ? "0%" : "100%",
        notes: notes || "",
        student: {
          name: studentName,
          email: req.body.studentEmail || undefined,
          photoUrl: state.studentPhotos?.[normName] || undefined,
        },
        updatedAt: timestamp,
        recordedBy: userEmail,
      };

      if (existingIndex >= 0) {
        records[existingIndex] = { ...records[existingIndex], ...recordPayload };
      } else {
        records.push(recordPayload);
      }

      // Append to audit log
      const auditLogs = [...(state.attendanceAuditLogs || [])];
      const auditEntry = {
        id: `aud_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        timestamp,
        studentName,
        classDayId: sessionIdentifier,
        previousStatus,
        newStatus: checkinStatus,
        actorName: userEmail,
        actorEmail: userEmail,
        actorRole: userRole,
        actionType: isAdmin ? "admin_override" : "lecturer_submission",
        reason: notes || (isAdmin ? "Direct administrative check-in" : "Lecturer session mark"),
        lockStatusAtChange: isLocked ? "locked" : "unlocked"
      };
      auditLogs.unshift(auditEntry);

      const updatedState = {
        ...state,
        records,
        attendanceAuditLogs: auditLogs,
        updatedAt: timestamp,
        updatedBy: userEmail,
      };

      await saveAuthoritativeState(
        updatedState,
        userEmail,
        `Attendance recorded for ${studentName} on ${sessionIdentifier}: ${checkinStatus}`
      );

      await logAuditEvent({
        actorUserId: userEmail,
        entityType: "attendance",
        entityId: `${studentName}_${sessionIdentifier}`,
        action: isAdmin ? "attendance_override" : "update",
        newValues: { studentName, sessionIdentifier, status: checkinStatus, notes },
      });

      return res.status(200).json({
        status: "recorded",
        record: recordPayload,
        auditEntry
      });
    } catch (err: any) {
      logger.error("POST /api/attendance/checkin error:", err);
      return res.status(500).json({ error: "Failed to record check-in" });
    }
  }
);

/**
 * POST /api/attendance/submit-session
 * Lecturer attendance submission for an entire session.
 * Checks lock status, updates all student records, creates audit entries, and optionally locks the session.
 */
attendanceRouter.post(
  "/submit-session",
  requireAuth,
  requirePermission(["attendance:mark_all", "attendance:mark_assigned", "all:access"]),
  async (req: Request, res: Response) => {
    try {
      const { classDayId, date, records: incomingRecords, lockAfterSubmission, lockDeadlineHours = 24 } = req.body;
      const userEmail = req.user?.email || "teacher";
      const userRole = req.user?.role || "lecturer";
      const isAdmin = userRole === "admin" || userRole === "super_admin";

      const sessionId = classDayId || date;
      if (!sessionId || !Array.isArray(incomingRecords)) {
        return res.status(400).json({ error: "classDayId (or date) and records array are required" });
      }

      const state = (await getAuthoritativeState(userEmail)) || {};
      const sessionLocks = { ...(state.sessionLocks || {}) };
      const isLocked = sessionLocks[sessionId]?.isLocked === true;

      if (isLocked && !isAdmin) {
        return res.status(403).json({
          error: "This session has been finalized and locked. Only administrators can alter historical attendance. Submit a correction request instead."
        });
      }

      let existingRecords = [...(state.records || [])];
      const auditLogs = [...(state.attendanceAuditLogs || [])];
      const timestamp = new Date().toISOString();

      // Filter out existing records for this session ID
      existingRecords = existingRecords.filter(
        (r: any) => r.classDay !== sessionId && r.date !== sessionId && r.sessionDate !== sessionId
      );

      const formatted = incomingRecords.map((r: any) => {
        const studentName = r.studentName || r.name || r.student?.name;
        const normStatus = normalizeStatus(r.status);
        
        auditLogs.unshift({
          id: `aud_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          timestamp,
          studentName,
          classDayId: sessionId,
          previousStatus: r.previousStatus || "Unmarked",
          newStatus: normStatus,
          actorName: userEmail,
          actorEmail: userEmail,
          actorRole: userRole,
          actionType: "lecturer_submission",
          reason: r.notes || `Session roll-call submitted by ${userEmail}`,
          lockStatusAtChange: isLocked ? "locked" : "unlocked"
        });

        return {
          id: r.id || `att_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          name: studentName,
          date: date || sessionId,
          sessionDate: date || sessionId,
          classDay: sessionId,
          status: normStatus,
          present: normStatus === "Present" || normStatus === "Late" || normStatus === "Excused" || normStatus === "Medical / Approved Leave",
          score: normStatus === "Present" ? "100%" : normStatus === "Late" ? "85%" : normStatus === "Absent" ? "0%" : "100%",
          notes: r.notes || "",
          student: {
            name: studentName,
            email: r.email || r.studentEmail,
            photoUrl: state.studentPhotos?.[studentName?.toLowerCase()?.trim()] || undefined
          },
          updatedAt: timestamp,
          recordedBy: userEmail
        };
      });

      // Apply automatic or requested session lock
      if (lockAfterSubmission) {
        const deadlineDate = new Date(Date.now() + (lockDeadlineHours * 60 * 60 * 1000)).toISOString();
        sessionLocks[sessionId] = {
          classDayId: sessionId,
          isLocked: true,
          lockedAt: timestamp,
          lockedBy: userEmail,
          lockDeadline: deadlineDate,
          notes: `Locked after submission by ${userEmail}`
        };
      }

      const updatedState = {
        ...state,
        records: [...existingRecords, ...formatted],
        sessionLocks,
        attendanceAuditLogs: auditLogs,
        updatedAt: timestamp,
        updatedBy: userEmail
      };

      await saveAuthoritativeState(
        updatedState,
        userEmail,
        `Lecturer attendance session submitted for ${sessionId} (${formatted.length} candidates)`
      );

      await logAuditEvent({
        actorUserId: userEmail,
        entityType: "attendance",
        entityId: sessionId,
        action: "update",
        newValues: { sessionId, count: formatted.length, locked: !!lockAfterSubmission }
      });

      return res.status(200).json({
        status: "submitted",
        count: formatted.length,
        sessionId,
        isLocked: !!sessionLocks[sessionId]?.isLocked
      });
    } catch (err: any) {
      logger.error("POST /api/attendance/submit-session error:", err);
      return res.status(500).json({ error: "Failed to submit lecturer attendance session" });
    }
  }
);

/**
 * POST /api/attendance/correction-request
 * Allows lecturers or candidates to formally request an attendance correction on locked or historical records.
 */
attendanceRouter.post(
  "/correction-request",
  requireAuth,
  async (req: Request, res: Response) => {
    try {
      const { studentName, classDayId, classDayName, currentStatus, requestedStatus, reason, evidenceUrl } = req.body;
      const userEmail = req.user?.email || "anonymous";
      const userRole = req.user?.role || "student";

      if (!studentName || !classDayId || !requestedStatus || !reason) {
        return res.status(400).json({ error: "studentName, classDayId, requestedStatus, and reason are required" });
      }

      const state = (await getAuthoritativeState(userEmail)) || {};
      const correctionRequests = [...(state.attendanceCorrectionRequests || [])];
      const timestamp = new Date().toISOString();

      const newRequest = {
        id: `cr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        studentName: studentName.trim(),
        classDayId,
        classDayName: classDayName || classDayId,
        currentStatus: normalizeStatus(currentStatus),
        requestedStatus: normalizeStatus(requestedStatus),
        reason: reason.trim(),
        evidenceUrl: evidenceUrl || null,
        submittedBy: userEmail,
        submittedByRole: userRole,
        submittedAt: timestamp,
        status: "pending"
      };

      correctionRequests.unshift(newRequest);

      const updatedState = {
        ...state,
        attendanceCorrectionRequests: correctionRequests,
        updatedAt: timestamp,
        updatedBy: userEmail
      };

      await saveAuthoritativeState(
        updatedState,
        userEmail,
        `Correction request filed for ${studentName} on ${classDayId}`
      );

      return res.status(201).json({
        status: "created",
        request: newRequest
      });
    } catch (err: any) {
      logger.error("POST /api/attendance/correction-request error:", err);
      return res.status(500).json({ error: "Failed to submit attendance correction request" });
    }
  }
);

/**
 * GET /api/attendance/correction-requests
 * Retrieves all correction requests.
 */
attendanceRouter.get(
  "/correction-requests",
  requireAuth,
  async (req: Request, res: Response) => {
    try {
      const user = req.user;
      const userEmail = user?.email;
      const state = await getAuthoritativeState(userEmail);

      let requests = state?.attendanceCorrectionRequests || [];
      if (user && user.role === "student") {
        const ownName = (user.studentName || user.name || user.email.split("@")[0]).toLowerCase().trim();
        requests = requests.filter(
          (r: any) => (r.studentName || "").toLowerCase().trim() === ownName || r.submittedBy === user.email
        );
      }

      return res.status(200).json({
        requests,
        count: requests.length
      });
    } catch (err: any) {
      logger.error("GET /api/attendance/correction-requests error:", err);
      return res.status(500).json({ error: "Failed to fetch correction requests" });
    }
  }
);

/**
 * POST /api/attendance/correction-requests/:id/approve
 * Administrative approval of an attendance correction request.
 * Updates target record, marks request approved, and logs audit trail.
 * RBAC: Only super_admin, admin, registrar
 */
attendanceRouter.post(
  "/correction-requests/:id/approve",
  requireAuth,
  requirePermission(["attendance:override", "all:access"]),
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { reviewNotes } = req.body;
      const userEmail = req.user?.email || "admin";
      const userRole = req.user?.role || "admin";

      const state = (await getAuthoritativeState(userEmail)) || {};
      const correctionRequests = [...(state.attendanceCorrectionRequests || [])];
      const reqIdx = correctionRequests.findIndex((r: any) => r.id === id);

      if (reqIdx < 0) {
        return res.status(404).json({ error: "Correction request not found" });
      }

      const targetReq = correctionRequests[reqIdx];
      const timestamp = new Date().toISOString();

      // Update request status
      targetReq.status = "approved";
      targetReq.reviewedBy = userEmail;
      targetReq.reviewedAt = timestamp;
      targetReq.reviewNotes = reviewNotes || "Approved by administration";
      correctionRequests[reqIdx] = targetReq;

      // Update actual attendance record
      const records = [...(state.records || [])];
      const normName = targetReq.studentName.toLowerCase().trim();
      const recIdx = records.findIndex((r: any) => {
        const matchName = (r.student?.name || r.name || "").toLowerCase().trim() === normName;
        const matchDate = r.classDay === targetReq.classDayId || r.date === targetReq.classDayId || r.sessionDate === targetReq.classDayId;
        return matchName && matchDate;
      });

      const newStatus = targetReq.requestedStatus;
      const recordPayload = {
        id: recIdx >= 0 ? records[recIdx].id : `att_${Date.now()}`,
        name: targetReq.studentName,
        date: targetReq.classDayId,
        sessionDate: targetReq.classDayId,
        classDay: targetReq.classDayId,
        status: newStatus,
        present: newStatus === "Present" || newStatus === "Late" || newStatus === "Excused" || newStatus === "Medical / Approved Leave",
        score: newStatus === "Present" ? "100%" : newStatus === "Late" ? "85%" : newStatus === "Absent" ? "0%" : "100%",
        notes: `[Correction Approved by ${userEmail}]: ${targetReq.reason}`,
        student: {
          name: targetReq.studentName,
          photoUrl: state.studentPhotos?.[normName] || undefined
        },
        updatedAt: timestamp,
        recordedBy: userEmail
      };

      if (recIdx >= 0) {
        records[recIdx] = { ...records[recIdx], ...recordPayload };
      } else {
        records.push(recordPayload);
      }

      // Add to audit trail
      const auditLogs = [...(state.attendanceAuditLogs || [])];
      auditLogs.unshift({
        id: `aud_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        timestamp,
        studentName: targetReq.studentName,
        classDayId: targetReq.classDayId,
        previousStatus: targetReq.currentStatus,
        newStatus,
        actorName: userEmail,
        actorEmail: userEmail,
        actorRole: userRole,
        actionType: "correction_approved",
        reason: targetReq.reason,
        isOverride: true
      });

      const updatedState = {
        ...state,
        records,
        attendanceCorrectionRequests: correctionRequests,
        attendanceAuditLogs: auditLogs,
        updatedAt: timestamp,
        updatedBy: userEmail
      };

      await saveAuthoritativeState(
        updatedState,
        userEmail,
        `Approved attendance correction for ${targetReq.studentName} on ${targetReq.classDayId} -> ${newStatus}`
      );

      return res.status(200).json({
        status: "approved",
        request: targetReq,
        record: recordPayload
      });
    } catch (err: any) {
      logger.error("POST /api/attendance/correction-requests/:id/approve error:", err);
      return res.status(500).json({ error: "Failed to approve correction request" });
    }
  }
);

/**
 * POST /api/attendance/correction-requests/:id/reject
 * Administrative rejection of an attendance correction request.
 */
attendanceRouter.post(
  "/correction-requests/:id/reject",
  requireAuth,
  requirePermission(["attendance:override", "all:access"]),
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { reviewNotes } = req.body;
      const userEmail = req.user?.email || "admin";

      if (!reviewNotes) {
        return res.status(400).json({ error: "reviewNotes is required for rejecting a correction request" });
      }

      const state = (await getAuthoritativeState(userEmail)) || {};
      const correctionRequests = [...(state.attendanceCorrectionRequests || [])];
      const reqIdx = correctionRequests.findIndex((r: any) => r.id === id);

      if (reqIdx < 0) {
        return res.status(404).json({ error: "Correction request not found" });
      }

      const targetReq = correctionRequests[reqIdx];
      const timestamp = new Date().toISOString();

      targetReq.status = "rejected";
      targetReq.reviewedBy = userEmail;
      targetReq.reviewedAt = timestamp;
      targetReq.reviewNotes = reviewNotes;
      correctionRequests[reqIdx] = targetReq;

      const updatedState = {
        ...state,
        attendanceCorrectionRequests: correctionRequests,
        updatedAt: timestamp,
        updatedBy: userEmail
      };

      await saveAuthoritativeState(
        updatedState,
        userEmail,
        `Rejected attendance correction for ${targetReq.studentName} on ${targetReq.classDayId}`
      );

      return res.status(200).json({
        status: "rejected",
        request: targetReq
      });
    } catch (err: any) {
      logger.error("POST /api/attendance/correction-requests/:id/reject error:", err);
      return res.status(500).json({ error: "Failed to reject correction request" });
    }
  }
);

/**
 * POST /api/attendance/lock-session
 * Locks a session to prevent lecturer modifications.
 * RBAC: Only super_admin, admin
 */
attendanceRouter.post(
  "/lock-session",
  requireAuth,
  requirePermission(["attendance:override", "all:access"]),
  async (req: Request, res: Response) => {
    try {
      const { classDayId, lockDeadline, notes } = req.body;
      const userEmail = req.user?.email || "admin";

      if (!classDayId) {
        return res.status(400).json({ error: "classDayId is required" });
      }

      const state = (await getAuthoritativeState(userEmail)) || {};
      const sessionLocks = { ...(state.sessionLocks || {}) };
      const timestamp = new Date().toISOString();

      sessionLocks[classDayId] = {
        classDayId,
        isLocked: true,
        lockedAt: timestamp,
        lockedBy: userEmail,
        lockDeadline: lockDeadline || null,
        notes: notes || "Locked by administrator"
      };

      const auditLogs = [...(state.attendanceAuditLogs || [])];
      auditLogs.unshift({
        id: `aud_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        timestamp,
        studentName: "ALL_CLASS",
        classDayId,
        previousStatus: "unlocked",
        newStatus: "locked",
        actorName: userEmail,
        actorEmail: userEmail,
        actorRole: req.user?.role || "admin",
        actionType: "session_locked",
        reason: notes || "Session finalized and locked by administrator"
      });

      const updatedState = {
        ...state,
        sessionLocks,
        attendanceAuditLogs: auditLogs,
        updatedAt: timestamp,
        updatedBy: userEmail
      };

      await saveAuthoritativeState(updatedState, userEmail, `Locked session ${classDayId}`);

      return res.status(200).json({
        status: "locked",
        sessionLock: sessionLocks[classDayId]
      });
    } catch (err: any) {
      logger.error("POST /api/attendance/lock-session error:", err);
      return res.status(500).json({ error: "Failed to lock attendance session" });
    }
  }
);

/**
 * POST /api/attendance/unlock-session
 * Unlocks a locked session.
 * RBAC: Only super_admin, admin
 */
attendanceRouter.post(
  "/unlock-session",
  requireAuth,
  requirePermission(["attendance:override", "all:access"]),
  async (req: Request, res: Response) => {
    try {
      const { classDayId, reason } = req.body;
      const userEmail = req.user?.email || "admin";

      if (!classDayId) {
        return res.status(400).json({ error: "classDayId is required" });
      }

      const state = (await getAuthoritativeState(userEmail)) || {};
      const sessionLocks = { ...(state.sessionLocks || {}) };
      const timestamp = new Date().toISOString();

      sessionLocks[classDayId] = {
        classDayId,
        isLocked: false,
        lockedAt: undefined,
        lockedBy: undefined,
        notes: reason || "Unlocked for administrative revisions"
      };

      const auditLogs = [...(state.attendanceAuditLogs || [])];
      auditLogs.unshift({
        id: `aud_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        timestamp,
        studentName: "ALL_CLASS",
        classDayId,
        previousStatus: "locked",
        newStatus: "unlocked",
        actorName: userEmail,
        actorEmail: userEmail,
        actorRole: req.user?.role || "admin",
        actionType: "session_unlocked",
        reason: reason || "Session unlocked by administrator"
      });

      const updatedState = {
        ...state,
        sessionLocks,
        attendanceAuditLogs: auditLogs,
        updatedAt: timestamp,
        updatedBy: userEmail
      };

      await saveAuthoritativeState(updatedState, userEmail, `Unlocked session ${classDayId}`);

      return res.status(200).json({
        status: "unlocked",
        classDayId
      });
    } catch (err: any) {
      logger.error("POST /api/attendance/unlock-session error:", err);
      return res.status(500).json({ error: "Failed to unlock attendance session" });
    }
  }
);

/**
 * GET /api/attendance/audit-history
 * Retrieves immutable audit history logs.
 */
attendanceRouter.get(
  "/audit-history",
  requireAuth,
  async (req: Request, res: Response) => {
    try {
      const user = req.user;
      const state = await getAuthoritativeState(user?.email);
      let logs = state?.attendanceAuditLogs || [];

      if (user && user.role === "student") {
        const ownName = (user.studentName || user.name || user.email.split("@")[0]).toLowerCase().trim();
        logs = logs.filter((l: any) => (l.studentName || "").toLowerCase().trim() === ownName);
      }

      return res.status(200).json({
        logs,
        count: logs.length
      });
    } catch (err: any) {
      logger.error("GET /api/attendance/audit-history error:", err);
      return res.status(500).json({ error: "Failed to fetch attendance audit history" });
    }
  }
);

/**
 * POST /api/attendance/excuse
 * Records or requests an excused absence / approved medical leave.
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
      const { studentName, date, classDayId, reason, isMedicalLeave, documentUrl } = req.body;
      const userEmail = req.user?.email || req.body.userEmail || "student";
      const userRole = req.user?.role || "student";

      if (!studentName || (!date && !classDayId)) {
        return res.status(400).json({ error: "studentName and date or classDayId are required" });
      }

      const sessionId = classDayId || date;
      const state = (await getAuthoritativeState(userEmail)) || {};
      const excusedAbsences = { ...(state.excusedAbsences || {}) };
      const records = [...(state.records || [])];
      const norm = studentName.toLowerCase().trim();
      const statusValue: AttendanceStatus = isMedicalLeave ? "Medical / Approved Leave" : "Excused";

      const key = `${studentName}_${sessionId}`;
      excusedAbsences[key] = {
        studentName,
        date: sessionId,
        reason: reason || (isMedicalLeave ? "Medical / Approved Leave" : "Ministry Duty"),
        documentUrl: documentUrl || null,
        status: "approved",
        approvedBy: userEmail,
        approvedAt: new Date().toISOString(),
      };

      const idx = records.findIndex((r: any) => {
        const matchName = (r.student?.name || r.name || "").toLowerCase().trim() === norm;
        const matchDate = r.classDay === sessionId || r.date === sessionId || r.sessionDate === sessionId;
        return matchName && matchDate;
      });

      if (idx >= 0) {
        records[idx] = {
          ...records[idx],
          status: statusValue,
          present: true,
          score: "100%",
          notes: reason || records[idx].notes || (isMedicalLeave ? "Approved Medical Leave" : "Excused absence"),
          documentUrl: documentUrl || records[idx].documentUrl,
          updatedAt: new Date().toISOString(),
        };
      } else {
        records.push({
          id: `att_${Date.now()}`,
          name: studentName,
          date: sessionId,
          sessionDate: sessionId,
          classDay: sessionId,
          status: statusValue,
          present: true,
          score: "100%",
          notes: reason || (isMedicalLeave ? "Approved Medical Leave" : "Excused absence"),
          student: {
            name: studentName,
            photoUrl: state.studentPhotos?.[norm] || undefined
          },
          updatedAt: new Date().toISOString(),
          recordedBy: userEmail
        });
      }

      const auditLogs = [...(state.attendanceAuditLogs || [])];
      auditLogs.unshift({
        id: `aud_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        timestamp: new Date().toISOString(),
        studentName,
        classDayId: sessionId,
        previousStatus: "Absent",
        newStatus: statusValue,
        actorName: userEmail,
        actorEmail: userEmail,
        actorRole: userRole,
        actionType: isMedicalLeave ? "medical_leave_approved" : "admin_override",
        reason: reason || "Excused absence granted"
      });

      const updatedState = {
        ...state,
        excusedAbsences,
        records,
        attendanceAuditLogs: auditLogs,
        updatedAt: new Date().toISOString(),
        updatedBy: userEmail,
      };

      await saveAuthoritativeState(
        updatedState,
        userEmail,
        `Approved ${statusValue} for ${studentName} on ${sessionId}`
      );

      return res.status(200).json({
        status: "excused",
        studentName,
        date: sessionId,
        statusValue,
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
 * Returns at-risk candidates failing the required 75% attendance policy threshold.
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
        return res.status(200).json({ atRiskStudents: [], count: 0, policyThreshold: "75%", criticalThreshold: "50%" });
      }

      const records = state.records || [];
      const classDays = state.classDays || [];
      const totalSessions = classDays.length;

      if (totalSessions === 0) {
        return res.status(200).json({ atRiskStudents: [], count: 0, policyThreshold: "75%", criticalThreshold: "50%" });
      }

      const studentMap = new Map<string, { present: number; late: number; excused: number; total: number }>();
      for (const r of records) {
        const name = r.student?.name?.trim() || r.name?.trim();
        if (!name) continue;
        if (!studentMap.has(name)) {
          studentMap.set(name, { present: 0, late: 0, excused: 0, total: 0 });
        }
        const item = studentMap.get(name)!;
        const s = normalizeStatus(r.status);
        if (s === "Present") {
          item.present++;
        } else if (s === "Late") {
          item.late++;
        } else if (s === "Excused" || s === "Medical / Approved Leave") {
          item.excused++;
        }
        item.total++;
      }

      const atRiskStudents: any[] = [];
      for (const [name, counts] of studentMap.entries()) {
        const effectiveScore = counts.present + (counts.late * 0.85) + counts.excused;
        const rate = Math.min(100, Math.round((effectiveScore / totalSessions) * 100));
        
        if (rate < 75) {
          atRiskStudents.push({
            name,
            attendanceRate: rate,
            sessionsAttended: counts.present + counts.late + counts.excused,
            totalSessions,
            isCritical: rate <= 50,
            standing: rate <= 50 ? "critical" : "at_risk",
            warning: rate <= 50 
              ? `Critical Attendance Alert: ${rate}% attendance is severely below the 75% graduation requirement.`
              : `At-Risk Warning: ${rate}% attendance is below the 75% threshold.`,
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
