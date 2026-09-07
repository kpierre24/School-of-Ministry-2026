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

/**
 * GET /api/academics/structure
 * Returns the complete academic structure (years, terms, master courses, course offerings).
 * This is used by the client as the authoritative hierarchical snapshot for the Academic Engine.
 */
academicsRouter.get("/structure", async (req: Request, res: Response) => {
  try {
    const userEmail = req.user?.email || (req.query.userEmail as string) || undefined;
    const state = await getAuthoritativeState(userEmail);

    const payload = {
      academicYears: state?.academicYears || state?.years || [],
      terms: state?.terms || state?.semesters || [],
      masterCourses: state?.masterCourses || state?.courses || [],
      courseOfferings: state?.courseOfferings || state?.offerings || [],
      activeTermId: state?.activeTermId || null,
    };

    return res.status(200).json(payload);
  } catch (err: any) {
    logger.error("GET /api/academics/structure error:", err);
    return res.status(500).json({ error: "Failed to fetch academic structure" });
  }
});

/**
 * POST /api/academics/offerings
 * Create or update a CourseOffering in the authoritative state.
 * RBAC: Only super_admin, admin, registrar, lecturer
 */
academicsRouter.post(
  "/offerings",
  requireAuth,
  requirePermission(["academics:manage_courses", "all:access"]),
  async (req: Request, res: Response) => {
    try {
      const offering = req.body.offering || req.body;
      const userEmail = req.user?.email || req.body.userEmail || "admin";

      if (!offering || !offering.id || !offering.courseId) {
        return res.status(400).json({ error: "Offering id and courseId are required" });
      }

      const state = (await getAuthoritativeState(userEmail)) || {};
      const offerings = [...(state.courseOfferings || state.offerings || [])];

      const idx = offerings.findIndex((o: any) => o.id === offering.id);
      if (idx >= 0) {
        offerings[idx] = { ...offerings[idx], ...offering, updatedAt: new Date().toISOString() };
      } else {
        offerings.unshift({ ...offering, createdAt: new Date().toISOString() });
      }

      const updatedState = {
        ...state,
        courseOfferings: offerings,
        updatedAt: new Date().toISOString(),
        updatedBy: userEmail,
      };

      await saveAuthoritativeState(updatedState, userEmail, `Saved offering: ${offering.id}`);

      await logAuditEvent({
        actorUserId: userEmail,
        entityType: "course_offering",
        entityId: offering.id,
        action: idx >= 0 ? "update" : "create",
        newValues: offering,
      });

      return res.status(200).json({ status: "saved", offering });
    } catch (err: any) {
      logger.error("POST /api/academics/offerings error:", err);
      return res.status(500).json({ error: "Failed to save course offering" });
    }
  }
);
