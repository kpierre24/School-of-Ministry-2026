import { Request, Response, NextFunction } from "express";
import { getAuthoritativeState } from "../services/supabaseServer";
import { UserRole, Permission, AuthenticatedUser, ROLE_DEFINITIONS, normalizeUserRole, roleHasPermission } from "../../types/rbac";
import { logger } from "../../lib/logger";

// Extend Express Request to include authenticated user
declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

/**
 * Known default system roles for bootstrap administrators
 */
const DEFAULT_SUPER_ADMINS = ["kpierre24@gmail.com", "pastor@hteim.org"];
const DEFAULT_ADMINS = ["admin@hteim.edu", "director@hteim.edu"];
const DEFAULT_FINANCE = ["finance@hteim.edu", "bursar@hteim.edu"];
const DEFAULT_REGISTRARS = ["registrar@hteim.edu", "admissions@hteim.edu"];
const DEFAULT_LIBRARIANS = ["librarian@hteim.edu", "library@hteim.edu"];

/**
 * Resolves authoritative user profile from email, state, and headers
 */
export async function resolveUserFromRequest(req: Request): Promise<AuthenticatedUser | null> {
  // 1. Extract credentials from headers or query/body
  const authHeader = req.headers.authorization;
  const headerEmail = (req.headers["x-user-email"] as string) || (req.headers["x-auth-email"] as string);
  const headerRole = (req.headers["x-user-role"] as string);
  const headerStudentId = (req.headers["x-student-id"] as string);
  const headerStudentName = (req.headers["x-student-name"] as string);

  let email = headerEmail;
  if (!email && authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.substring(7).trim();
    // Support base64 JSON token or plain email in Bearer
    if (token.includes("@")) {
      email = token;
    } else {
      try {
        const decoded = JSON.parse(Buffer.from(token, "base64").toString("utf-8"));
        if (decoded.email) email = decoded.email;
      } catch {
        // Not a base64 json token
      }
    }
  }

  if (!email) {
    email = (req.query.userEmail as string) || req.body?.userEmail || req.body?.email;
  }

  if (!email || typeof email !== "string") {
    // If no email provided, check if client provided explicit dev role for preview sandbox
    if (headerRole) {
      const canonicalRole = normalizeUserRole(headerRole);
      const roleDef = ROLE_DEFINITIONS[canonicalRole];
      return {
        id: `dev-${canonicalRole}`,
        email: `${canonicalRole}@hteim.edu`,
        name: roleDef?.title || canonicalRole,
        role: canonicalRole,
        studentId: headerStudentId || undefined,
        studentName: headerStudentName || undefined,
        permissions: roleDef?.permissions || []
      };
    }
    return null;
  }

  const cleanEmail = email.toLowerCase().trim();
  const state = await getAuthoritativeState(cleanEmail);

  // Determine user role
  let assignedRole: UserRole = "student";
  let studentName: string | undefined = headerStudentName;
  let studentId: string | undefined = headerStudentId;
  let assignedCourses: string[] = [];

  if (DEFAULT_SUPER_ADMINS.includes(cleanEmail)) {
    assignedRole = "super_admin";
  } else if (DEFAULT_ADMINS.includes(cleanEmail)) {
    assignedRole = "admin";
  } else if (DEFAULT_FINANCE.includes(cleanEmail)) {
    assignedRole = "finance_officer";
  } else if (DEFAULT_REGISTRARS.includes(cleanEmail)) {
    assignedRole = "registrar";
  } else if (DEFAULT_LIBRARIANS.includes(cleanEmail)) {
    assignedRole = "librarian";
  } else if (cleanEmail.includes("lecturer") || cleanEmail.includes("teacher") || cleanEmail.includes("faculty")) {
    assignedRole = "lecturer";
  } else if (headerRole) {
    assignedRole = normalizeUserRole(headerRole);
  }

  // Check state database for explicit user record
  if (state?.userCredentials && Array.isArray(state.userCredentials)) {
    const match = state.userCredentials.find((u: any) => u.email?.toLowerCase().trim() === cleanEmail);
    if (match) {
      if (match.role) assignedRole = normalizeUserRole(match.role);
      if (match.studentName) studentName = match.studentName;
      if (match.studentId) studentId = match.studentId;
      if (match.assignedCourses) assignedCourses = match.assignedCourses;
    }
  }

  // If studentName is still not found, check student roster in state
  if (!studentName && state?.records && Array.isArray(state.records)) {
    const studentRecord = state.records.find((r: any) => r.student?.email?.toLowerCase().trim() === cleanEmail);
    if (studentRecord?.student?.name) {
      studentName = studentRecord.student.name;
    }
  }

  // Also check invoices / payments for student ID / name match
  if ((!studentId || !studentName) && state?.invoices && Array.isArray(state.invoices)) {
    const inv = state.invoices.find((i: any) => (i.email || "").toLowerCase().trim() === cleanEmail);
    if (inv) {
      if (!studentId && inv.studentId) studentId = inv.studentId;
      if (!studentName && inv.studentName) studentName = inv.studentName;
    }
  }

  const roleDef = ROLE_DEFINITIONS[assignedRole];
  const permissions: Permission[] = roleDef ? roleDef.permissions : [];

  return {
    id: cleanEmail,
    email: cleanEmail,
    name: studentName || cleanEmail.split("@")[0],
    role: assignedRole,
    studentId,
    studentName,
    assignedCourses,
    permissions
  };
}

/**
 * Authentication Middleware: Extracts & attaches user to request
 */
export async function authenticate(req: Request, _res: Response, next: NextFunction) {
  try {
    const user = await resolveUserFromRequest(req);
    if (user) {
      req.user = user;
    }
    next();
  } catch (err) {
    logger.error("Error in authenticate middleware:", err);
    next();
  }
}

/**
 * Require Authentication Middleware (Returns 401 if unauthenticated)
 */
export function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({
      error: "Authentication required",
      code: "UNAUTHENTICATED",
      message: "Please sign in or provide a valid authorization header."
    });
  }
  next();
}

/**
 * Require Specific Permission(s) Middleware (Returns 403 if unauthorized)
 */
export function requirePermission(permission: Permission | Permission[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        error: "Authentication required",
        code: "UNAUTHENTICATED"
      });
    }

    if (req.user.role === "super_admin") {
      return next();
    }

    const perms = Array.isArray(permission) ? permission : [permission];
    const hasPerm = perms.some((p) => roleHasPermission(req.user!.role, p));

    if (!hasPerm) {
      logger.warn(`Permission Denied: User ${req.user.email} with role ${req.user.role} lacks [${perms.join(", ")}]`);
      return res.status(403).json({
        error: "Forbidden: Insufficient role permissions",
        code: "PERMISSION_DENIED",
        requiredPermissions: perms,
        userRole: req.user.role
      });
    }

    next();
  };
}

/**
 * Resource Ownership Verification Middleware
 * 
 * Verifies that the authenticated user either:
 * 1. Has an elevated administrative role (Super Admin, Admin, Registrar, Finance Officer, etc.), OR
 * 2. Is the assigned faculty lecturer for the student/course, OR
 * 3. Owns the resource matching their studentId, studentName, or email.
 */
export interface ResourceOwnershipOptions {
  getTarget: (req: Request) => {
    targetStudentId?: string;
    targetStudentName?: string;
    targetEmail?: string;
    courseCode?: string;
  };
  allowedRoles?: UserRole[];
}

export function requireResourceOwnership(options: ResourceOwnershipOptions) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: "Authentication required", code: "UNAUTHENTICATED" });
    }

    const { role, email, studentId, studentName, assignedCourses } = req.user;

    // 1. Super Admin is always authorized
    if (role === "super_admin") {
      return next();
    }

    // 2. Check explicitly allowed administrative roles (default includes super_admin, admin, registrar)
    const allowedRoles = options.allowedRoles || ["super_admin", "admin", "registrar"];
    if (allowedRoles.includes(role)) {
      return next();
    }

    // 3. Extract target identifiers from request
    const { targetStudentId, targetStudentName, targetEmail, courseCode } = options.getTarget(req);

    // 4. Lecturer check: If user is a lecturer and is assigned to the course
    if (role === "lecturer") {
      if (courseCode && assignedCourses && assignedCourses.includes(courseCode)) {
        return next();
      }
      // If no specific course filter or lecturer has broad academic access
      if (!courseCode) {
        return next();
      }
    }

    // 5. Student Ownership Check: Validate whether the target matches this logged-in student
    const normTargetName = (targetStudentName || "").toLowerCase().trim();
    const normUserStudentName = (studentName || "").toLowerCase().trim();

    const normTargetId = (targetStudentId || "").toLowerCase().trim();
    const normUserStudentId = (studentId || "").toLowerCase().trim();

    const normTargetEmail = (targetEmail || "").toLowerCase().trim();
    const normUserEmail = (email || "").toLowerCase().trim();

    const isMatch =
      (normTargetName && normUserStudentName && normTargetName === normUserStudentName) ||
      (normTargetId && normUserStudentId && normTargetId === normUserStudentId) ||
      (normTargetEmail && normUserEmail && normTargetEmail === normUserEmail) ||
      (normTargetName && normTargetName.includes(normUserEmail.split("@")[0])) ||
      (normTargetId && normTargetId === normUserEmail);

    if (isMatch) {
      return next();
    }

    // Access Denied
    logger.warn(`Resource Ownership Check Failed for ${email} (Role: ${role}) targeting [ID: ${targetStudentId}, Name: ${targetStudentName}, Email: ${targetEmail}]`);
    return res.status(403).json({
      error: "Access Denied: You do not have ownership or authority to view or modify this student's private record.",
      code: "RESOURCE_OWNERSHIP_DENIED",
      details: "Students may only access their own grades, attendance, and financial ledgers."
    });
  };
}
