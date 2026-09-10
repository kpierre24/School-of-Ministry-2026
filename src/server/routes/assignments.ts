import { Router, Request, Response } from "express";
import { assignmentsService } from "../services/domain";
import { requireAuth, requirePermission, requireResourceOwnership } from "../middleware/rbac";
import { logger } from "../../lib/logger";

export const assignmentsRouter = Router();

// Default-deny at the router level: All routes require authentication
assignmentsRouter.use(requireAuth);

/**
 * GET /api/assignments
 * Retrieves assignments from relational assignments table.
 * RBAC: Requires assignments:read
 */
assignmentsRouter.get(
  "/",
  requirePermission(["assignments:read", "all:access"]),
  async (req: Request, res: Response) => {
    try {
      const user = req.user!;
      const result = await assignmentsService.getAssignments(user);

      return res.status(200).json({
        assignments: result.assignments,
        count: result.count,
      });
    } catch (err: any) {
      logger.error("GET /api/assignments error:", err);
      return res.status(500).json({ error: "Failed to fetch assignments" });
    }
  }
);

/**
 * GET /api/assignments/submissions
 * Retrieves student submissions and rubric grades from relational tables.
 * RBAC: Requires assignments:read or grades:read. Students only retrieve their own submissions.
 */
assignmentsRouter.get(
  "/submissions",
  requirePermission(["assignments:read", "grades:read", "all:access"]),
  async (req: Request, res: Response) => {
    try {
      const user = req.user!;
      const studentId = (req.query.studentId as string) || undefined;
      const studentName = (req.query.studentName as string) || undefined;
      const assignmentId = (req.query.assignmentId as string) || undefined;

      const result = await assignmentsService.getSubmissions({ studentId, studentName, assignmentId }, user);

      return res.status(200).json({
        submissions: result.submissions,
        rubricScores: result.rubricScores,
        count: result.count,
      });
    } catch (err: any) {
      logger.error("GET /api/assignments/submissions error:", err);
      return res.status(500).json({ error: "Failed to fetch submissions" });
    }
  }
);

/**
 * POST /api/assignments/:id/submissions
 * 9.1: Submits work for an assignment with studentId derived strictly from req.user context.
 * 9.2: Validates assignment existence, course membership, enrollment, publication status, and submission window.
 * 9.3: Strips grade fields and forces status='submitted' to prevent grade manipulation.
 */
assignmentsRouter.post(
  "/:id/submissions",
  requireAuth,
  requirePermission(["assignments:submit", "all:access"]),
  async (req: Request, res: Response) => {
    try {
      const assignmentId = req.params.id;
      const user = req.user!;
      const payload = req.body || {};

      if (!assignmentId) {
        return res.status(400).json({ error: "assignmentId parameter is required" });
      }

      const result = await assignmentsService.submitAssignmentForUser(
        assignmentId,
        payload,
        user
      );

      return res.status(201).json(result);
    } catch (err: any) {
      logger.error(`POST /api/assignments/${req.params.id}/submissions error:`, err);
      const statusCode = err.message?.includes("not found") ? 404 : 400;
      return res.status(statusCode).json({ error: err.message || "Failed to submit assignment" });
    }
  }
);

/**
 * POST /api/assignments/submit
 * Legacy submit endpoint enforcing identical server-derived student identity and sanitization rules.
 */
assignmentsRouter.post(
  "/submit",
  requireAuth,
  requirePermission(["assignments:submit", "all:access"]),
  async (req: Request, res: Response) => {
    try {
      const user = req.user!;
      const submission = req.body?.submission || req.body || {};
      const assignmentId = submission.assignmentId || req.body?.assignmentId;

      if (!assignmentId) {
        return res.status(400).json({ error: "assignmentId is required" });
      }

      const result = await assignmentsService.submitAssignmentForUser(
        assignmentId,
        submission,
        user
      );

      return res.status(201).json(result);
    } catch (err: any) {
      logger.error("POST /api/assignments/submit error:", err);
      const statusCode = err.message?.includes("not found") ? 404 : 400;
      return res.status(statusCode).json({ error: err.message || "Failed to submit assignment" });
    }
  }
);

/**
 * POST /api/assignments/grade
 * 9.4: Records teacher grading verifying lecturer -> course -> assignment -> submission chain.
 * 9.5: Validates score bounds (0 <= score <= maxScore).
 * Phase 10: Enforces grade locking rules.
 */
assignmentsRouter.post(
  "/grade",
  requireAuth,
  requirePermission(["assignments:grade", "grades:write", "all:access"]),
  requireResourceOwnership({
    getTarget: (req) => ({
      courseCode: req.body.courseCode, // Assumes frontend sends courseCode for verification
    }),
    allowedRoles: ["super_admin", "admin", "registrar"],
  }),
  async (req: Request, res: Response) => {
    try {
      const { submissionId, assignmentId, studentId, score, feedback, rubricScores, overrideReason, courseCode } = req.body;
      const actorUser = req.user!;

      // 9.4 Staff check
      const staffRoles = ["super_admin", "admin", "registrar", "lecturer", "teacher"];
      if (!staffRoles.includes(actorUser.role)) {
        return res.status(403).json({ error: "Access denied: Only faculty and lecturers can record grades" });
      }

      if (!submissionId) {
        return res.status(400).json({ error: "submissionId is required" });
      }

      const result = await assignmentsService.gradeSubmission(
        { submissionId, assignmentId, studentId, score: Number(score), feedback, rubricScores, overrideReason },
        actorUser
      );

      return res.status(200).json(result);
    } catch (err: any) {
      logger.error("POST /api/assignments/grade error:", err);
      const isLockedErr = err.message?.includes("LOCKED");
      const statusCode = isLockedErr ? 403 : err.message?.includes("not found") ? 404 : 400;
      return res.status(statusCode).json({ error: err.message || "Failed to record grade" });
    }
  }
);

/**
 * POST /api/assignments/grade/transition
 * Phase 10: Transitions a grade through its controlled lifecycle:
 * SUBMITTED -> GRADED -> MODERATION -> RELEASED -> LOCKED
 */
assignmentsRouter.post(
  "/grade/transition",
  requireAuth,
  requirePermission(["assignments:grade", "grades:write", "all:access"]),
  async (req: Request, res: Response) => {
    try {
      const { submissionId, targetStatus, reason } = req.body;
      const actorUser = req.user!;

      if (!submissionId || !targetStatus) {
        return res.status(400).json({ error: "submissionId and targetStatus are required" });
      }

      const result = await assignmentsService.transitionGradeLifecycle(
        { submissionId, targetStatus, reason },
        actorUser
      );

      return res.status(200).json(result);
    } catch (err: any) {
      logger.error("POST /api/assignments/grade/transition error:", err);
      const isDenied = err.message?.includes("Access denied");
      const statusCode = isDenied ? 403 : err.message?.includes("not found") ? 404 : 400;
      return res.status(statusCode).json({ error: err.message || "Failed to transition grade lifecycle" });
    }
  }
);

/**
 * POST /api/assignments/grade/override
 * Phase 10: Elevated administrative override for locked grades (Registrar/Admin only).
 */
assignmentsRouter.post(
  "/grade/override",
  requireAuth,
  requirePermission(["grades:write", "all:access"]),
  async (req: Request, res: Response) => {
    try {
      const { submissionId, score, feedback, reason } = req.body;
      const actorUser = req.user!;

      const elevatedRoles = ["super_admin", "admin", "registrar"];
      if (!elevatedRoles.includes(actorUser.role)) {
        return res.status(403).json({ error: "Access denied: Only Registrar or Admin can approve grade overrides for locked records." });
      }

      if (!submissionId || score === undefined || !reason) {
        return res.status(400).json({ error: "submissionId, score, and explicit reason are required for an administrative override." });
      }

      const result = await assignmentsService.overrideLockedGrade(
        { submissionId, score: Number(score), feedback, reason },
        actorUser
      );

      return res.status(200).json(result);
    } catch (err: any) {
      logger.error("POST /api/assignments/grade/override error:", err);
      const statusCode = err.message?.includes("Access denied") ? 403 : 400;
      return res.status(statusCode).json({ error: err.message || "Failed to perform administrative grade override" });
    }
  }
);
