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
      const studentName = (req.query.studentName as string) || undefined;
      const assignmentId = (req.query.assignmentId as string) || undefined;

      const result = await assignmentsService.getSubmissions({ studentName, assignmentId }, user);

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
 * POST /api/assignments/submit
 * Records a student assignment or quiz submission directly in PostgreSQL submissions table.
 * RBAC: Requires assignments:submit.
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
      const actorUserId = req.user?.email || "student";

      if (!submission || !submission.studentName || !submission.assignmentId) {
        return res.status(400).json({ error: "studentName and assignmentId are required" });
      }

      const result = await assignmentsService.submitAssignment(submission, actorUserId);
      return res.status(201).json(result);
    } catch (err: any) {
      logger.error("POST /api/assignments/submit error:", err);
      return res.status(500).json({ error: "Failed to submit assignment" });
    }
  }
);

/**
 * POST /api/assignments/grade
 * Records teacher grading and feedback directly in relational grades table.
 * RBAC: Requires assignments:grade or grades:write
 */
assignmentsRouter.post(
  "/grade",
  requireAuth,
  requirePermission(["assignments:grade", "grades:write", "all:access"]),
  async (req: Request, res: Response) => {
    try {
      const { submissionId, score, feedback, rubricScores, studentName } = req.body;
      const actorUserId = req.user?.email || "teacher";

      if (!submissionId && !studentName) {
        return res.status(400).json({ error: "submissionId or studentName is required" });
      }

      const result = await assignmentsService.gradeSubmission(
        { submissionId, studentName, score: Number(score), feedback, rubricScores },
        actorUserId
      );

      return res.status(200).json(result);
    } catch (err: any) {
      logger.error("POST /api/assignments/grade error:", err);
      return res.status(500).json({ error: "Failed to record grade" });
    }
  }
);
