import { Request, Response, NextFunction } from "express";
import { getAuthoritativeState, getServerSupabase } from "../services/supabaseServer";
import { verifyIdToken } from "../services/firebaseAuth";
import { UserRole, Permission, AuthenticatedUser, ROLE_DEFINITIONS, normalizeUserRole, roleHasPermission } from "../../types/rbac";
import { logger } from "../../lib/logger";
import { isDemoUser } from "../../data/guards";

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
 * Maps application UserRole to PostgreSQL users table check constraint:
 * ('admin' | 'teacher' | 'student' | 'staff')
 */
export function toDbUserRole(role: UserRole): "admin" | "teacher" | "student" | "staff" {
  if (role === "super_admin" || role === "admin") return "admin";
  if (role === "lecturer" || role === "teacher") return "teacher";
  if (role === "registrar" || role === "finance_officer" || role === "librarian" || role === "staff") return "staff";
  return "student";
}

/**
 * Authoritative Authentication Pipeline:
 * 
 * Firebase ID Token
 *         ↓
 *  verifyIdToken()
 *         ↓
 *   Firebase UID
 *         ↓
 * database users table
 *         ↓
 *      req.user
 * 
 * Insecure identity sources (req.query.userEmail, req.body.userEmail,
 * x-user-role, x-user-email) are strictly prohibited from establishing identity.
 * They are informational at most.
 */
export async function resolveUserFromRequest(req: Request): Promise<AuthenticatedUser | null> {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }

  const token = authHeader.substring(7).trim();
  if (!token) {
    return null;
  }

  // 1. Firebase ID Token -> verifyIdToken()
  let decoded;
  try {
    decoded = await verifyIdToken(token);
  } catch (err: any) {
    logger.warn(`Authoritative token verification rejected request to ${req.path}: ${err.message || err}`);
    return null;
  }

  if (!decoded || !decoded.uid) {
    return null;
  }

  const firebaseUid = decoded.uid;
  const cleanEmail = (decoded.email || "").toLowerCase().trim();

  // Guard: Demo accounts are simulation-only and cannot authenticate as real users
  if (cleanEmail && isDemoUser(cleanEmail)) {
    logger.warn(`Rejected real user authentication attempt for demo account: ${cleanEmail}`);
    return null;
  }

  // 2. Firebase UID -> database users table
  const supabase = getServerSupabase();
  let dbUser: any = null;

  if (cleanEmail) {
    try {
      const { data, error } = await supabase
        .from("users")
        .select("id, email, role, is_active")
        .eq("email", cleanEmail)
        .maybeSingle();

      if (!error && data) {
        dbUser = data;
      }
    } catch (dbErr: any) {
      logger.error("Error querying database users table:", dbErr);
    }
  }

  // Guard: Suspended or inactive accounts are rejected
  if (dbUser && dbUser.is_active === false) {
    logger.warn(`Authentication rejected for deactivated account: ${cleanEmail}`);
    return null;
  }

  // Authoritative State for supplemental profile attributes
  const state = cleanEmail ? await getAuthoritativeState(cleanEmail) : null;

  // Determine initial role mapping
  let assignedRole: UserRole = "student";
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
  } else if (cleanEmail.includes("lecturer") || cleanEmail.includes("teacher") || cleanEmail.endsWith("@hteim.edu")) {
    assignedRole = "lecturer";
  }

  // If user does not exist in database users table, provision an authoritative row
  if (!dbUser && cleanEmail) {
    try {
      const dbRole = toDbUserRole(assignedRole);
      const { data: createdUser, error: insertErr } = await supabase
        .from("users")
        .insert({
          email: cleanEmail,
          role: dbRole,
          is_active: true,
        })
        .select("id, email, role, is_active")
        .maybeSingle();

      if (!insertErr && createdUser) {
        dbUser = createdUser;
        logger.info(`Provisioned new database users record for ${cleanEmail} (role: ${dbRole})`);
      }
    } catch (insertErr) {
      logger.warn("Could not insert user into database users table (continuing with default):", insertErr);
    }
  }

  // Resolve role from database users table
  if (dbUser?.role && !DEFAULT_SUPER_ADMINS.includes(cleanEmail) && !DEFAULT_ADMINS.includes(cleanEmail) && !DEFAULT_FINANCE.includes(cleanEmail) && !DEFAULT_REGISTRARS.includes(cleanEmail) && !DEFAULT_LIBRARIANS.includes(cleanEmail)) {
    assignedRole = normalizeUserRole(dbUser.role);
  }

  // Check state database credentials for granular role overrides
  if (state?.userCredentials && Array.isArray(state.userCredentials)) {
    const match = state.userCredentials.find((u: any) => u.email?.toLowerCase().trim() === cleanEmail);
    if (match?.role) {
      assignedRole = normalizeUserRole(match.role);
    }
  }

  // Look up studentId from database students table
  let studentId: string | undefined = undefined;
  let studentName: string | undefined = decoded.name;
  let assignedCourses: string[] = [];

  const userId = dbUser?.id || firebaseUid;

  if (dbUser?.id) {
    try {
      const { data: studentRecord } = await supabase
        .from("students")
        .select("id, student_number")
        .eq("user_id", dbUser.id)
        .maybeSingle();

      if (studentRecord?.student_number) {
        studentId = studentRecord.student_number;
      }
    } catch (studentErr) {
      logger.warn("Error querying database students table:", studentErr);
    }
  }

  // Check state userCredentials for student attributes
  if (state?.userCredentials && Array.isArray(state.userCredentials)) {
    const match = state.userCredentials.find((u: any) => u.email?.toLowerCase().trim() === cleanEmail);
    if (match) {
      if (match.studentName && !studentName) studentName = match.studentName;
      if (match.studentId && !studentId) studentId = match.studentId;
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

  // Check invoices / payments for student ID / name match
  if ((!studentId || !studentName) && state?.invoices && Array.isArray(state.invoices)) {
    const inv = state.invoices.find((i: any) => (i.email || "").toLowerCase().trim() === cleanEmail);
    if (inv) {
      if (!studentId && inv.studentId) studentId = inv.studentId;
      if (!studentName && inv.studentName) studentName = inv.studentName;
    }
  }

  const roleDef = ROLE_DEFINITIONS[assignedRole] || ROLE_DEFINITIONS.student;
  const permissions: Permission[] = roleDef ? roleDef.permissions : [];

  // 3. req.user: authoritative user object containing uid, userId, email, role, studentId
  return {
    uid: firebaseUid,
    userId: userId,
    id: userId,
    email: cleanEmail,
    name: studentName || cleanEmail.split("@")[0],
    role: assignedRole,
    studentId,
    studentName,
    assignedCourses,
    permissions,
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
