import { Router, Request, Response } from "express";
import { getAuthoritativeState, saveAuthoritativeState, logAuditEvent } from "../services/supabaseServer";
import { requireAuth, requirePermission, requireResourceOwnership } from "../middleware/rbac";
import { roleHasPermission } from "../../types/rbac";
import { logger } from "../../lib/logger";

export const studentsRouter = Router();

/**
 * Helper to calculate student metrics from attendance records and submissions
 */
function calculateStudentSummary(
  studentName: string,
  records: any[],
  classDays: any[],
  studentLevels: Record<string, string>,
  studentNotes: Record<string, string>,
  studentPhotos: Record<string, string>,
  submissions: any[]
) {
  const normName = studentName.toLowerCase().trim();
  const studentRecords = (records || []).filter(
    (r: any) => (r.student?.name || "").toLowerCase().trim() === normName
  );

  const totalSessions = classDays?.length || 0;
  const presentCount = studentRecords.filter((r: any) => {
    const s = (r.status || "").toLowerCase();
    return s === "present" || s === "p" || s === "1" || s === "attended";
  }).length;

  const excusedCount = studentRecords.filter((r: any) => {
    const s = (r.status || "").toLowerCase();
    return s === "excused" || s === "e";
  }).length;

  const effectivePresent = presentCount + excusedCount;
  const attendanceRate = totalSessions > 0
    ? Math.round((effectivePresent / totalSessions) * 100)
    : 100;

  // Satisfactory threshold: >= 75% per AGENTS.md rule
  const isAtRisk = attendanceRate < 75;
  const isCritical = attendanceRate <= 50;

  // Calculate student average grade from submissions
  const studentSubs = (submissions || []).filter(
    (s: any) => (s.studentName || "").toLowerCase().trim() === normName
  );
  let totalGrade = 0;
  let gradedCount = 0;
  for (const sub of studentSubs) {
    if (typeof sub.score === "number" || typeof sub.grade === "number") {
      totalGrade += sub.score ?? sub.grade;
      gradedCount++;
    }
  }
  const averageGrade = gradedCount > 0 ? Math.round(totalGrade / gradedCount) : 85;

  return {
    name: studentName,
    level: studentLevels?.[studentName] || "Level 1 Foundation",
    photoUrl: studentPhotos?.[normName] || null,
    note: studentNotes?.[studentName] || "",
    totalSessions,
    presentCount,
    excusedCount,
    attendanceRate,
    isAtRisk,
    isCritical,
    averageGrade,
    submissionsCount: studentSubs.length,
  };
}

/**
 * GET /api/students
 * Returns authoritative student roster.
 * RBAC Rule: Super Admin, Admin, Registrar, Lecturer, Finance Officer see full directory.
 * Students only receive their own profile record.
 */
studentsRouter.get(
  "/",
  requireAuth,
  async (req: Request, res: Response) => {
  try {
    const user = req.user;
    const userEmail = user?.email || (req.query.userEmail as string) || undefined;
    const state = await getAuthoritativeState(userEmail);

    if (!state) {
      return res.status(200).json({ students: [], total: 0 });
    }

    const records = state.records || [];
    const classDays = state.classDays || [];
    const studentLevels = state.studentLevels || {};
    const studentNotes = state.studentNotes || {};
    const studentPhotos = state.studentPhotos || {};
    const submissions = state.submissions || [];
    const deletedStudentNames = new Set(
      (state.deletedStudentNames || []).map((n: string) => n.toLowerCase().trim())
    );

    // Extract unique student names
    const namesSet = new Set<string>();
    for (const r of records) {
      const name = r.student?.name?.trim();
      if (name && !deletedStudentNames.has(name.toLowerCase())) {
        namesSet.add(name);
      }
    }
    for (const name of Object.keys(studentLevels)) {
      if (name && !deletedStudentNames.has(name.toLowerCase().trim())) {
        namesSet.add(name.trim());
      }
    }

    let studentNames = Array.from(namesSet).sort((a, b) => a.localeCompare(b));

    // RBAC: If requester is a student and lacks students:view_all, restrict list to own profile
    if (user && user.role === "student" && !roleHasPermission(user.role, "students:view_all")) {
      const ownName = user.studentName || user.name || user.email.split("@")[0];
      const match = studentNames.find((n) => n.toLowerCase().trim() === ownName.toLowerCase().trim());
      studentNames = match ? [match] : [];
    }

    const students = studentNames.map((name) =>
      calculateStudentSummary(
        name,
        records,
        classDays,
        studentLevels,
        studentNotes,
        studentPhotos,
        submissions
      )
    );

    return res.status(200).json({
      students,
      total: students.length,
      atRiskCount: students.filter((s) => s.isAtRisk).length,
      threshold: "75%",
      updatedAt: state.updatedAt || new Date().toISOString(),
    });
  } catch (err: any) {
    logger.error("GET /api/students error:", err);
    return res.status(500).json({ error: "Failed to fetch student directory" });
  }
});

/**
 * GET /api/students/:name/grades
 * Explicit Grade & Academic Performance Endpoint
 * 
 * RBAC & Ownership Pipeline:
 * 1. Is the user authenticated?
 * 2. Is the user allowed to view grades? (grades:view_all, grades:view_assigned, grades:view_own)
 * 3. Is the requested student the logged-in student, or an admin / assigned lecturer?
 * 4. Return only authorized data.
 */
studentsRouter.get(
  "/:name/grades",
  requireAuth,
  requirePermission(["grades:view_all", "grades:view_assigned", "grades:view_own"]),
  requireResourceOwnership({
    getTarget: (req) => ({
      targetStudentName: decodeURIComponent(req.params.name).trim(),
      targetStudentId: req.params.name,
    }),
    allowedRoles: ["super_admin", "admin", "registrar", "lecturer"],
  }),
  async (req: Request, res: Response) => {
    try {
      const studentName = decodeURIComponent(req.params.name).trim();
      const state = await getAuthoritativeState(req.user?.email);

      if (!state) {
        return res.status(404).json({ error: "Student academic records not found" });
      }

      const norm = studentName.toLowerCase();
      const submissions = (state.submissions || []).filter(
        (s: any) => (s.studentName || "").toLowerCase().trim() === norm
      );

      const rubricScores = state.rubricScores?.[studentName] || null;

      // Calculate term GPA and module breakdown
      let totalGrade = 0;
      let gradedCount = 0;
      for (const s of submissions) {
        if (typeof s.score === "number" || typeof s.grade === "number") {
          totalGrade += s.score ?? s.grade;
          gradedCount++;
        }
      }
      const gpaPercent = gradedCount > 0 ? Math.round(totalGrade / gradedCount) : 88;
      const honorRoll = gpaPercent >= 85;

      return res.status(200).json({
        studentName,
        averageGrade: gpaPercent,
        honorRoll,
        standing: honorRoll ? "High Distinction" : gpaPercent >= 75 ? "Satisfactory" : "At-Risk",
        submissions,
        rubricScores,
        authorizedRequester: {
          email: req.user?.email,
          role: req.user?.role,
        },
      });
    } catch (err: any) {
      logger.error("GET /api/students/:name/grades error:", err);
      return res.status(500).json({ error: "Failed to fetch student grades" });
    }
  }
);

/**
 * GET /api/students/:name/attendance
 * Explicit Student Attendance Endpoint
 */
studentsRouter.get(
  "/:name/attendance",
  requireAuth,
  requirePermission(["attendance:view_all", "attendance:view_own"]),
  requireResourceOwnership({
    getTarget: (req) => ({
      targetStudentName: decodeURIComponent(req.params.name).trim(),
      targetStudentId: req.params.name,
    }),
    allowedRoles: ["super_admin", "admin", "registrar", "lecturer"],
  }),
  async (req: Request, res: Response) => {
    try {
      const studentName = decodeURIComponent(req.params.name).trim();
      const state = await getAuthoritativeState(req.user?.email);

      if (!state) {
        return res.status(404).json({ error: "Attendance records not found" });
      }

      const norm = studentName.toLowerCase();
      const studentRecords = (state.records || []).filter(
        (r: any) => (r.student?.name || "").toLowerCase().trim() === norm
      );

      const totalSessions = state.classDays?.length || 0;
      const presentCount = studentRecords.filter((r: any) => {
        const s = (r.status || "").toLowerCase();
        return s === "present" || s === "p" || s === "1" || s === "attended";
      }).length;
      const excusedCount = studentRecords.filter((r: any) => {
        const s = (r.status || "").toLowerCase();
        return s === "excused" || s === "e";
      }).length;

      const rate = totalSessions > 0 ? Math.round(((presentCount + excusedCount) / totalSessions) * 100) : 100;

      return res.status(200).json({
        studentName,
        totalSessions,
        presentCount,
        excusedCount,
        attendanceRate: rate,
        isAtRisk: rate < 75,
        records: studentRecords,
      });
    } catch (err: any) {
      logger.error("GET /api/students/:name/attendance error:", err);
      return res.status(500).json({ error: "Failed to fetch attendance history" });
    }
  }
);

/**
 * GET /api/students/:name/financial-profile
 * Explicit Student Financial Ledger Endpoint
 */
studentsRouter.get(
  "/:name/financial-profile",
  requireAuth,
  requirePermission(["finance:view_all", "finance:view_own"]),
  requireResourceOwnership({
    getTarget: (req) => ({
      targetStudentName: decodeURIComponent(req.params.name).trim(),
      targetStudentId: req.params.name,
    }),
    allowedRoles: ["super_admin", "admin", "finance_officer"],
  }),
  async (req: Request, res: Response) => {
    try {
      const studentName = decodeURIComponent(req.params.name).trim();
      const state = await getAuthoritativeState(req.user?.email);

      const norm = studentName.toLowerCase();
      const invoices = (state?.invoices || []).filter(
        (i: any) => (i.studentName || "").toLowerCase().trim() === norm
      );
      const transactions = (state?.transactions || state?.payments || []).filter(
        (t: any) => (t.studentName || "").toLowerCase().trim() === norm
      );
      const receipts = (state?.receipts || []).filter(
        (r: any) => (r.studentName || "").toLowerCase().trim() === norm
      );
      const adjustments = (state?.adjustments || []).filter(
        (a: any) => (a.studentName || "").toLowerCase().trim() === norm
      );

      return res.status(200).json({
        studentName,
        invoices,
        transactions,
        receipts,
        adjustments,
      });
    } catch (err: any) {
      logger.error("GET /api/students/:name/financial-profile error:", err);
      return res.status(500).json({ error: "Failed to fetch student financial records" });
    }
  }
);

/**
 * GET /api/students/:name
 * Returns detailed single student profile.
 * Protected by Resource Ownership Check.
 */
studentsRouter.get(
  "/:name",
  requireAuth,
  requireResourceOwnership({
    getTarget: (req) => ({
      targetStudentName: decodeURIComponent(req.params.name).trim(),
      targetStudentId: req.params.name,
    }),
    allowedRoles: ["super_admin", "admin", "registrar", "lecturer", "finance_officer"],
  }),
  async (req: Request, res: Response) => {
    try {
      const studentName = decodeURIComponent(req.params.name).trim();
      const state = await getAuthoritativeState(req.user?.email);

      if (!state) {
        return res.status(404).json({ error: "Student not found" });
      }

      const norm = studentName.toLowerCase();
      const records = (state.records || []).filter(
        (r: any) => (r.student?.name || "").toLowerCase().trim() === norm
      );
      const submissions = (state.submissions || []).filter(
        (s: any) => (s.studentName || "").toLowerCase().trim() === norm
      );
      const payments = (state.payments || []).filter(
        (p: any) => (p.studentName || "").toLowerCase().trim() === norm
      );

      const summary = calculateStudentSummary(
        studentName,
        state.records || [],
        state.classDays || [],
        state.studentLevels || {},
        state.studentNotes || {},
        state.studentPhotos || {},
        state.submissions || []
      );

      return res.status(200).json({
        student: summary,
        attendanceHistory: records,
        submissions,
        payments,
        rubricScores: state.rubricScores?.[studentName] || null,
      });
    } catch (err: any) {
      logger.error("GET /api/students/:name error:", err);
      return res.status(500).json({ error: "Failed to fetch student profile" });
    }
  }
);

/**
 * POST /api/students
 * Enrolls a new student into authoritative state.
 * RBAC: Only super_admin, admin, registrar
 */
studentsRouter.post(
  "/",
  requireAuth,
  requirePermission(["students:enroll", "all:access"]),
  async (req: Request, res: Response) => {
    try {
      const { name, level, email, photoUrl } = req.body;
      const userEmail = req.user?.email || req.body?.userEmail || "admin";

      if (!name || typeof name !== "string") {
        return res.status(400).json({ error: "Student name is required" });
      }

      const cleanName = name.trim();
      const state = (await getAuthoritativeState(userEmail)) || {};

      const studentLevels = { ...(state.studentLevels || {}) };
      studentLevels[cleanName] = level || "Level 1 Foundation";

      const studentPhotos = { ...(state.studentPhotos || {}) };
      if (photoUrl) {
        studentPhotos[cleanName.toLowerCase().trim()] = photoUrl;
      }

      const deletedStudentNames = (state.deletedStudentNames || []).filter(
        (n: string) => n.toLowerCase().trim() !== cleanName.toLowerCase().trim()
      );

      const updatedState = {
        ...state,
        studentLevels,
        studentPhotos,
        deletedStudentNames,
        updatedAt: new Date().toISOString(),
        updatedBy: userEmail,
      };

      await saveAuthoritativeState(
        updatedState,
        userEmail,
        `Enrolled student: ${cleanName}`
      );

      await logAuditEvent({
        actorUserId: userEmail,
        entityType: "student",
        entityId: cleanName,
        action: "create",
        newValues: { name: cleanName, level, email },
      });

      return res.status(201).json({
        status: "enrolled",
        student: { name: cleanName, level: studentLevels[cleanName], photoUrl },
      });
    } catch (err: any) {
      logger.error("POST /api/students error:", err);
      return res.status(500).json({ error: "Failed to enroll student" });
    }
  }
);

/**
 * PUT /api/students/:name
 * Updates student attributes.
 * RBAC: Only super_admin, admin, registrar
 */
studentsRouter.put(
  "/:name",
  requireAuth,
  requirePermission(["students:edit_records", "all:access"]),
  async (req: Request, res: Response) => {
    try {
      const studentName = decodeURIComponent(req.params.name).trim();
      const { level, note, photoUrl } = req.body;
      const userEmail = req.user?.email || req.body?.userEmail || "admin";
      const state = (await getAuthoritativeState(userEmail)) || {};

      const studentLevels = { ...(state.studentLevels || {}) };
      if (level) studentLevels[studentName] = level;

      const studentNotes = { ...(state.studentNotes || {}) };
      if (note !== undefined) studentNotes[studentName] = note;

      const studentPhotos = { ...(state.studentPhotos || {}) };
      if (photoUrl) studentPhotos[studentName.toLowerCase().trim()] = photoUrl;

      const updatedState = {
        ...state,
        studentLevels,
        studentNotes,
        studentPhotos,
        updatedAt: new Date().toISOString(),
        updatedBy: userEmail,
      };

      await saveAuthoritativeState(
        updatedState,
        userEmail,
        `Updated student: ${studentName}`
      );

      await logAuditEvent({
        actorUserId: userEmail,
        entityType: "student",
        entityId: studentName,
        action: "update",
        newValues: { level, note: note ? "updated" : undefined, photoUrl },
      });

      return res.status(200).json({
        status: "updated",
        student: {
          name: studentName,
          level: studentLevels[studentName],
          note: studentNotes[studentName],
          photoUrl: studentPhotos[studentName.toLowerCase().trim()],
        },
      });
    } catch (err: any) {
      logger.error("PUT /api/students/:name error:", err);
      return res.status(500).json({ error: "Failed to update student" });
    }
  }
);

/**
 * DELETE /api/students/:name
 * Removes or archives a student record.
 * RBAC: Super Admin, Admin, Registrar (students:edit_records)
 */
studentsRouter.delete(
  "/:name",
  requireAuth,
  requirePermission(["students:edit_records", "all:access"]),
  async (req: Request, res: Response) => {
    try {
      const studentName = decodeURIComponent(req.params.name).trim();
      const userEmail = req.user?.email || "admin";
      const state = (await getAuthoritativeState(userEmail)) || {};

      const records = (state.records || []).filter(
        (r: any) => (r.student?.name || "").toLowerCase().trim() !== studentName.toLowerCase()
      );

      const updatedState = {
        ...state,
        records,
        updatedAt: new Date().toISOString(),
        updatedBy: userEmail,
      };

      await saveAuthoritativeState(
        updatedState,
        userEmail,
        `Deleted student record: ${studentName}`
      );

      await logAuditEvent({
        actorUserId: userEmail,
        entityType: "student",
        entityId: studentName,
        action: "delete",
        newValues: { studentName, deletedAt: new Date().toISOString() },
      });

      return res.status(200).json({
        status: "deleted",
        studentName,
      });
    } catch (err: any) {
      logger.error("DELETE /api/students/:name error:", err);
      return res.status(500).json({ error: "Failed to delete student record" });
    }
  }
);

/**
 * POST /api/students/bulk
 * Bulk enrolls or updates student records.
 * RBAC: Super Admin, Admin, Registrar (students:enroll)
 */
studentsRouter.post(
  "/bulk",
  requireAuth,
  requirePermission(["students:enroll", "all:access"]),
  async (req: Request, res: Response) => {
    try {
      const { students: incomingStudents } = req.body;
      const userEmail = req.user?.email || "registrar";

      if (!incomingStudents || !Array.isArray(incomingStudents) || incomingStudents.length === 0) {
        return res.status(400).json({ error: "Non-empty array of students is required" });
      }

      const state = (await getAuthoritativeState(userEmail)) || {};
      const existingRecords = state.records || [];
      const studentLevels = { ...(state.studentLevels || {}) };

      let addedCount = 0;
      let updatedCount = 0;

      for (const item of incomingStudents) {
        const rawName = (item.name || item.studentName || "").trim();
        if (!rawName) continue;

        const existingIdx = existingRecords.findIndex(
          (r: any) => (r.student?.name || "").toLowerCase().trim() === rawName.toLowerCase()
        );

        if (existingIdx >= 0) {
          if (item.level) studentLevels[rawName] = item.level;
          updatedCount++;
        } else {
          const newStudent = {
            id: item.id || `std_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
            name: rawName,
            email: item.email || `${rawName.toLowerCase().replace(/[^a-z0-9]/g, "")}@student.hteim.org`,
          };
          existingRecords.push({
            student: newStudent,
            attendance: {},
          });
          if (item.level) studentLevels[rawName] = item.level;
          addedCount++;
        }
      }

      const updatedState = {
        ...state,
        records: existingRecords,
        studentLevels,
        updatedAt: new Date().toISOString(),
        updatedBy: userEmail,
      };

      await saveAuthoritativeState(
        updatedState,
        userEmail,
        `Bulk processed ${incomingStudents.length} students (${addedCount} added, ${updatedCount} updated)`
      );

      await logAuditEvent({
        actorUserId: userEmail,
        entityType: "student",
        entityId: "bulk_operation",
        action: "create",
        newValues: { total: incomingStudents.length, addedCount, updatedCount },
      });

      return res.status(200).json({
        status: "success",
        processed: incomingStudents.length,
        addedCount,
        updatedCount,
      });
    } catch (err: any) {
      logger.error("POST /api/students/bulk error:", err);
      return res.status(500).json({ error: "Failed to bulk enroll students" });
    }
  }
);

