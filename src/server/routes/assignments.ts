import { Router, Request, Response } from "express";
import { getAuthoritativeState, getAuthorizedStateForUser, saveAuthoritativeState, logAuditEvent } from "../services/supabaseServer";
import { requireAuth, requirePermission, requireResourceOwnership } from "../middleware/rbac";
import { roleHasPermission } from "../../types/rbac";
import { logger } from "../../lib/logger";
import { isDemoAssignment } from "../../data/guards";

export const assignmentsRouter = Router();

// Default-deny at the router level: All routes require authentication
assignmentsRouter.use(requireAuth);

/**
 * GET /api/assignments
 * Retrieves assignments and quizzes, strictly excluding demo assignments.
 * RBAC: Requires assignments:read
 */
assignmentsRouter.get(
  "/",
  requirePermission(["assignments:read", "all:access"]),
  async (req: Request, res: Response) => {
    try {
      const user = req.user!;
      const state = await getAuthorizedStateForUser(user);

      let assignments = (state?.customAssignments || []).filter((a: any) => !isDemoAssignment(a));

      // RBAC: If student, only show published non-draft assignments
      if (user && user.role === "student") {
        assignments = assignments.filter((a: any) => !a.isDraft && a.published !== false);
      }

      return res.status(200).json({
        assignments,
        count: assignments.length,
      });
    } catch (err: any) {
      logger.error("GET /api/assignments error:", err);
      return res.status(500).json({ error: "Failed to fetch assignments" });
    }
  }
);

/**
 * GET /api/assignments/submissions
 * Retrieves student submissions and rubric grades.
 * RBAC: Requires assignments:read or grades:read. Students only retrieve their own submissions.
 */
assignmentsRouter.get(
  "/submissions",
  requirePermission(["assignments:read", "grades:read", "all:access"]),
  async (req: Request, res: Response) => {
    try {
      const user = req.user!;
      let studentName = (req.query.studentName as string) || undefined;
      const state = await getAuthorizedStateForUser(user);

      let submissions = state?.submissions || [];
      let rubricScores = state?.rubricScores || {};

      // RBAC: Restrict student view
      if (user && user.role === "student") {
        const ownName = user.studentName || user.name || user.email.split("@")[0];
        studentName = ownName;
      }

      if (studentName) {
        const norm = studentName.toLowerCase().trim();
        submissions = submissions.filter((s: any) => (s.studentName || "").toLowerCase().trim() === norm);
        // Filter rubric scores to only this student
        if (rubricScores[studentName]) {
          rubricScores = { [studentName]: rubricScores[studentName] };
        } else {
          rubricScores = {};
        }
      }

      return res.status(200).json({
        submissions,
        rubricScores,
        count: submissions.length,
      });
    } catch (err: any) {
      logger.error("GET /api/assignments/submissions error:", err);
      return res.status(500).json({ error: "Failed to fetch submissions" });
    }
  }
);

/**
 * POST /api/assignments/submit
 * Records a student assignment or quiz submission.
 * RBAC: Requires assignments:submit. Students can submit for themselves; instructors/admins can submit.
 */
assignmentsRouter.post(
  "/submit",
  requireAuth,
  requirePermission(["assignments:submit", "all:access"]),
  requireResourceOwnership({
    getTarget: (req) => ({
      targetStudentName: req.body?.submission?.studentName,
    }),
    allowedRoles: ["super_admin", "admin", "lecturer"],
  }),
  async (req: Request, res: Response) => {
    try {
      const { submission } = req.body;
      const actorEmail = req.user?.email || "student";

      if (!submission || !submission.studentName || !submission.assignmentId) {
        return res.status(400).json({ error: "studentName and assignmentId are required" });
      }

      const state = (await getAuthoritativeState(actorEmail)) || {};
      const submissions = [...(state.submissions || [])];

      const newSub = {
        id: submission.id || `SUB-${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        assignmentId: submission.assignmentId,
        studentName: submission.studentName.trim(),
        content: submission.content || "",
        fileUrl: submission.fileUrl || "",
        fileName: submission.fileName || "",
        submittedAt: new Date().toISOString(),
        status: submission.score !== undefined ? "graded" : "submitted",
        score: submission.score,
        grade: submission.grade,
        feedback: submission.feedback || "",
      };

      submissions.unshift(newSub);

      const updatedState = {
        ...state,
        submissions,
        updatedAt: new Date().toISOString(),
        updatedBy: actorEmail,
      };

      await saveAuthoritativeState(
        updatedState,
        actorEmail,
        `Submitted assignment ${submission.assignmentId} for ${submission.studentName}`
      );

      return res.status(201).json({ status: "submitted", submission: newSub });
    } catch (err: any) {
      logger.error("POST /api/assignments/submit error:", err);
      return res.status(500).json({ error: "Failed to submit assignment" });
    }
  }
);

/**
 * POST /api/assignments/grade
 * Records teacher grading and feedback.
 * RBAC: Requires assignments:grade or grades:write
 */
assignmentsRouter.post(
  "/grade",
  requireAuth,
  requirePermission(["assignments:grade", "grades:write", "all:access"]),
  async (req: Request, res: Response) => {
    try {
      const { submissionId, score, feedback, rubricScores, studentName } = req.body;
      const actorEmail = req.user?.email || "teacher";

      if (!submissionId && !studentName) {
        return res.status(400).json({ error: "submissionId or studentName is required" });
      }

      const state = (await getAuthoritativeState(actorEmail)) || {};
      const submissions = [...(state.submissions || [])];
      const subIdx = submissions.findIndex((s: any) => s.id === submissionId);

      if (subIdx >= 0) {
        submissions[subIdx] = {
          ...submissions[subIdx],
          score: Number(score),
          grade: Number(score),
          feedback: feedback || submissions[subIdx].feedback,
          status: "graded",
          gradedAt: new Date().toISOString(),
          gradedBy: actorEmail,
        };
      }

      const updatedRubrics = { ...(state.rubricScores || {}) };
      if (studentName && rubricScores) {
        updatedRubrics[studentName] = rubricScores;
      }

      const updatedState = {
        ...state,
        submissions,
        rubricScores: updatedRubrics,
        updatedAt: new Date().toISOString(),
        updatedBy: actorEmail,
      };

      await saveAuthoritativeState(
        updatedState,
        actorEmail,
        `Graded submission ${submissionId || studentName}: ${score} points`
      );

      await logAuditEvent({
        actorUserId: actorEmail,
        entityType: "grade",
        entityId: submissionId || studentName,
        action: "grade_override",
        newValues: { score, feedback, rubricScores },
      });

      return res.status(200).json({ status: "graded", score, feedback });
    } catch (err: any) {
      logger.error("POST /api/assignments/grade error:", err);
      return res.status(500).json({ error: "Failed to record grade" });
    }
  }
);
