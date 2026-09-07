import { Router, Request, Response } from "express";
import { getAuthoritativeState, saveAuthoritativeState, logAuditEvent } from "../services/supabaseServer";
import { requireAuth, requirePermission } from "../middleware/rbac";
import { logger } from "../../lib/logger";

export const academicsRouter = Router();

/**
 * GET /api/academics/courses
 * Retrieves courses and curriculum tracks.
 */
academicsRouter.get("/courses", async (req: Request, res: Response) => {
  try {
    const userEmail = req.user?.email || (req.query.userEmail as string) || undefined;
    const state = await getAuthoritativeState(userEmail);

    const courses = state?.courses || [];
    return res.status(200).json({
      courses,
      count: courses.length,
      updatedAt: state?.updatedAt || new Date().toISOString(),
    });
  } catch (err: any) {
    logger.error("GET /api/academics/courses error:", err);
    return res.status(500).json({ error: "Failed to fetch courses" });
  }
});

/**
 * POST /api/academics/courses
 * Creates or updates a course in authoritative state.
 * RBAC: Only super_admin, admin, registrar
 */
academicsRouter.post(
  "/courses",
  requireAuth,
  requirePermission(["academics:manage_courses", "all:access"]),
  async (req: Request, res: Response) => {
    try {
      const { course } = req.body;
      const userEmail = req.user?.email || req.body.userEmail || "admin";

      if (!course || !course.code || !course.title) {
        return res.status(400).json({ error: "Course code and title are required" });
      }

      const state = (await getAuthoritativeState(userEmail)) || {};
      const courses = [...(state.courses || [])];

      const idx = courses.findIndex(
        (c: any) => (c.code || "").toLowerCase() === course.code.toLowerCase() || c.id === course.id
      );

      if (idx >= 0) {
        courses[idx] = { ...courses[idx], ...course, updatedAt: new Date().toISOString() };
      } else {
        courses.push({
          id: course.id || `CRS-${Date.now()}`,
          ...course,
          createdAt: new Date().toISOString(),
        });
      }

      const updatedState = {
        ...state,
        courses,
        updatedAt: new Date().toISOString(),
        updatedBy: userEmail,
      };

      await saveAuthoritativeState(updatedState, userEmail, `Updated course: ${course.code}`);

      await logAuditEvent({
        actorUserId: userEmail,
        entityType: "course",
        entityId: course.code,
        action: idx >= 0 ? "update" : "create",
        newValues: course,
      });

      return res.status(200).json({ status: "saved", course });
    } catch (err: any) {
      logger.error("POST /api/academics/courses error:", err);
      return res.status(500).json({ error: "Failed to save course" });
    }
  }
);

/**
 * GET /api/academics/schedules
 * Retrieves term schedules.
 */
academicsRouter.get("/schedules", async (req: Request, res: Response) => {
  try {
    const userEmail = req.user?.email || (req.query.userEmail as string) || undefined;
    const state = await getAuthoritativeState(userEmail);

    const schedules = state?.schedules || [];
    return res.status(200).json({
      schedules,
      count: schedules.length,
    });
  } catch (err: any) {
    logger.error("GET /api/academics/schedules error:", err);
    return res.status(500).json({ error: "Failed to fetch schedules" });
  }
});
