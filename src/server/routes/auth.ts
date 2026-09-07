import { Router, Request, Response } from "express";
import { getAuthoritativeState } from "../services/supabaseServer";
import { UserRole, ROLE_DEFINITIONS, normalizeUserRole } from "../../types/rbac";
import { logger } from "../../lib/logger";

export const authRouter = Router();

/**
 * POST /api/auth/session
 * Verifies or initializes a session for the current user and returns authoritative roles/permissions.
 */
authRouter.post("/session", async (req: Request, res: Response) => {
  try {
    const { email, requestedRole, name } = req.body;

    if (!email || typeof email !== "string") {
      return res.status(400).json({ error: "Valid email is required" });
    }

    const cleanEmail = email.toLowerCase().trim();
    const state = await getAuthoritativeState(cleanEmail);

    // Default admin accounts per HTEIM portal rules
    const defaultSuperAdmins = ["kpierre24@gmail.com", "pastor@hteim.org"];
    const defaultAdmins = ["admin@hteim.edu", "director@hteim.edu"];
    const defaultFinance = ["finance@hteim.edu", "bursar@hteim.edu"];
    const defaultRegistrars = ["registrar@hteim.edu", "admissions@hteim.edu"];
    const defaultLibrarians = ["librarian@hteim.edu", "library@hteim.edu"];

    let assignedRole: UserRole = "student";
    let studentName = name || cleanEmail.split("@")[0];
    let studentId: string | undefined = undefined;
    let assignedCourses: string[] = [];

    if (defaultSuperAdmins.includes(cleanEmail)) {
      assignedRole = "super_admin";
    } else if (defaultAdmins.includes(cleanEmail)) {
      assignedRole = "admin";
    } else if (defaultFinance.includes(cleanEmail)) {
      assignedRole = "finance_officer";
    } else if (defaultRegistrars.includes(cleanEmail)) {
      assignedRole = "registrar";
    } else if (defaultLibrarians.includes(cleanEmail)) {
      assignedRole = "librarian";
    } else if (cleanEmail.includes("lecturer") || cleanEmail.includes("teacher") || cleanEmail.endsWith("@hteim.edu")) {
      assignedRole = "lecturer";
    } else if (requestedRole) {
      assignedRole = normalizeUserRole(requestedRole);
    }

    // Check credentials saved in authoritative state
    if (state?.userCredentials && Array.isArray(state.userCredentials)) {
      const match = state.userCredentials.find((u: any) => u.email?.toLowerCase().trim() === cleanEmail);
      if (match) {
        if (match.role) assignedRole = normalizeUserRole(match.role);
        if (match.studentName) studentName = match.studentName;
        if (match.studentId) studentId = match.studentId;
        if (match.assignedCourses) assignedCourses = match.assignedCourses;
      }
    }

    // Check records in state for student mapping
    if (!studentId && state?.records && Array.isArray(state.records)) {
      const rec = state.records.find((r: any) => r.student?.email?.toLowerCase().trim() === cleanEmail);
      if (rec?.student?.id) studentId = rec.student.id;
      if (rec?.student?.name) studentName = rec.student.name;
    }

    const roleDef = ROLE_DEFINITIONS[assignedRole] || ROLE_DEFINITIONS.student;

    return res.status(200).json({
      status: "authenticated",
      user: {
        id: cleanEmail,
        email: cleanEmail,
        name: studentName,
        role: assignedRole,
        studentId,
        studentName,
        assignedCourses,
        permissions: roleDef.permissions,
        accessibleTabs: roleDef.accessibleTabs,
        roleDefinition: {
          id: roleDef.id,
          title: roleDef.title,
          badge: roleDef.badge,
          description: roleDef.description,
          color: roleDef.color,
          badgeBg: roleDef.badgeBg
        }
      },
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    logger.error("Auth session error:", err);
    return res.status(500).json({ error: "Authentication session verification failed" });
  }
});

/**
 * GET /api/auth/roles
 * Lists all 8 defined roles and their granular access scopes.
 */
authRouter.get("/roles", (_req: Request, res: Response) => {
  const roles = Object.values(ROLE_DEFINITIONS).filter((r, index, self) => 
    index === self.findIndex((t) => t.id === r.id)
  );

  return res.status(200).json({
    roles: roles.map((r) => ({
      role: r.id,
      title: r.title,
      badge: r.badge,
      color: r.color,
      badgeBg: r.badgeBg,
      description: r.description,
      accessibleTabs: r.accessibleTabs,
      permissions: r.permissions,
    })),
  });
});
