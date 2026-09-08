import { Router, Request, Response } from "express";
import { getAuthoritativeState, getDatabaseUsers, updateUserRoleInDatabase } from "../services/supabaseServer";
import { UserRole, ROLE_DEFINITIONS, normalizeUserRole } from "../../types/rbac";
import { requireAuth, requirePermission } from "../middleware/rbac";
import { logger } from "../../lib/logger";
import { isDemoUser } from "../../data/guards";

export const authRouter = Router();

/**
 * POST /api/auth/session
 * Verifies or initializes a session for the current user and returns authoritative roles/permissions.
 */
authRouter.post("/session", async (req: Request, res: Response) => {
  try {
    // Identity must come strictly from authoritative req.user (established via Firebase ID Token)
    if (!req.user) {
      return res.status(401).json({
        error: "Authentication required",
        code: "UNAUTHENTICATED",
        message: "A valid Firebase ID token is required to establish identity."
      });
    }

    const user = req.user;
    const roleDef = ROLE_DEFINITIONS[user.role] || ROLE_DEFINITIONS.student;

    return res.status(200).json({
      status: "authenticated",
      user: {
        uid: user.uid,
        userId: user.userId,
        id: user.userId,
        email: user.email,
        name: user.name,
        role: user.role,
        studentId: user.studentId,
        studentName: user.studentName,
        assignedCourses: user.assignedCourses,
        permissions: user.permissions,
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
 * GET /api/auth/me
 * Returns the currently authenticated user from req.user
 */
authRouter.get("/me", (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).json({
      error: "Authentication required",
      code: "UNAUTHENTICATED",
      message: "No active authenticated session."
    });
  }

  const roleDef = ROLE_DEFINITIONS[req.user.role] || ROLE_DEFINITIONS.student;
  return res.status(200).json({
    status: "authenticated",
    user: {
      uid: req.user.uid,
      userId: req.user.userId,
      id: req.user.userId,
      email: req.user.email,
      name: req.user.name,
      role: req.user.role,
      studentId: req.user.studentId,
      studentName: req.user.studentName,
      assignedCourses: req.user.assignedCourses,
      permissions: req.user.permissions,
      accessibleTabs: roleDef.accessibleTabs,
      roleDefinition: {
        id: roleDef.id,
        title: roleDef.title,
        badge: roleDef.badge,
        description: roleDef.description,
        color: roleDef.color,
        badgeBg: roleDef.badgeBg
      }
    }
  });
});

/**
 * GET /api/auth/roles
 * Lists all defined roles and their granular access scopes.
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

/**
 * GET /api/auth/users
 * Returns list of registered users in the database.
 * RBAC: Requires users:manage
 */
authRouter.get(
  "/users",
  requireAuth,
  requirePermission(["users:manage", "all:access"]),
  async (_req: Request, res: Response) => {
    try {
      const users = await getDatabaseUsers();
      return res.status(200).json({
        users,
        count: users.length,
      });
    } catch (err: any) {
      logger.error("GET /api/auth/users error:", err);
      return res.status(500).json({ error: "Failed to fetch users" });
    }
  }
);

/**
 * PATCH /api/auth/users/:userId/role
 * Updates a user's role in the database.
 * RBAC: Requires roles:manage
 */
authRouter.patch(
  "/users/:userId/role",
  requireAuth,
  requirePermission(["roles:manage", "all:access"]),
  async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;
      const { role } = req.body;
      const actorEmail = req.user?.email || "admin";

      if (!role || typeof role !== "string") {
        return res.status(400).json({ error: "role is required" });
      }

      const normalized = normalizeUserRole(role);
      const result = await updateUserRoleInDatabase(userId, normalized, actorEmail);

      if (!result.success) {
        return res.status(400).json({ error: result.error || "Failed to update role" });
      }

      return res.status(200).json({
        status: "updated",
        user: result.user,
      });
    } catch (err: any) {
      logger.error("PATCH /api/auth/users/:userId/role error:", err);
      return res.status(500).json({ error: "Failed to update user role" });
    }
  }
);
