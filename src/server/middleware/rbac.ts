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
 * Enrollment-based Policy:
 * Verifies whether an email or student number corresponds to an active enrollment
 * or pre-configured credential before activating a database user account.
 */
export async function checkEnrollmentMatch(
  cleanEmail: string,
  supabase: any,
  state: any
): Promise<{
  isEnrolled: boolean;
  role?: UserRole;
  studentRecordId?: string;
  studentNumber?: string;
  studentName?: string;
  assignedCourses?: string[];
}> {
  if (!cleanEmail) return { isEnrolled: false };

  // 1. Check state userCredentials (configured staff, admins, teachers, and pre-registered student credentials)
  if (state?.userCredentials && Array.isArray(state.userCredentials)) {
    const credMatch = state.userCredentials.find(
      (u: any) =>
        (u.email || "").toLowerCase().trim() === cleanEmail ||
        (u.studentId || "").toLowerCase().trim() === cleanEmail ||
        (u.studentNumber || "").toLowerCase().trim() === cleanEmail
    );
    if (credMatch) {
      return {
        isEnrolled: true,
        role: credMatch.role ? normalizeUserRole(credMatch.role) : "student",
        studentRecordId: credMatch.studentRecordId || credMatch.studentId,
        studentNumber: credMatch.studentNumber || credMatch.studentId,
        studentName: credMatch.studentName,
        assignedCourses: credMatch.assignedCourses || [],
      };
    }
  }

  // 2. Check relational database students / profiles tables
  try {
    const { data: prof } = await supabase
      .from("profiles")
      .select("id, user_id, first_name, last_name, email, students(id, student_number)")
      .eq("email", cleanEmail)
      .maybeSingle();

    if (prof) {
      const std = Array.isArray(prof.students) ? prof.students[0] : prof.students;
      return {
        isEnrolled: true,
        role: "student",
        studentRecordId: std?.id,
        studentNumber: std?.student_number,
        studentName: `${prof.first_name || ""} ${prof.last_name || ""}`.trim() || undefined,
      };
    }

    const { data: stdDirect } = await supabase
      .from("students")
      .select("id, student_number, user_id")
      .or(`student_number.eq.${cleanEmail},id.eq.${cleanEmail}`)
      .maybeSingle();

    if (stdDirect) {
      return {
        isEnrolled: true,
        role: "student",
        studentRecordId: stdDirect.id,
        studentNumber: stdDirect.student_number,
      };
    }
  } catch (dbErr) {
    logger.warn("Error checking database enrollment match:", dbErr);
  }

  // 3. Check student records / roster in state
  if (state?.records && Array.isArray(state.records)) {
    const recordMatch = state.records.find(
      (r: any) =>
        (r.student?.email || "").toLowerCase().trim() === cleanEmail ||
        (r.student?.id || "").toLowerCase().trim() === cleanEmail ||
        (r.student?.studentNumber || r.student?.student_number || "").toLowerCase().trim() === cleanEmail
    );
    if (recordMatch) {
      return {
        isEnrolled: true,
        role: "student",
        studentRecordId: recordMatch.student?.id || recordMatch.id,
        studentNumber: recordMatch.student?.studentNumber || recordMatch.student?.student_number,
        studentName: recordMatch.student?.name,
      };
    }
  }

  // 4. Check students list in state
  if (state?.students && Array.isArray(state.students)) {
    const stdMatch = state.students.find(
      (s: any) =>
        (s.email || "").toLowerCase().trim() === cleanEmail ||
        (s.studentNumber || s.student_number || "").toLowerCase().trim() === cleanEmail ||
        (s.id || "").toLowerCase().trim() === cleanEmail
    );
    if (stdMatch) {
      return {
        isEnrolled: true,
        role: "student",
        studentRecordId: stdMatch.id,
        studentNumber: stdMatch.studentNumber || stdMatch.student_number,
        studentName: stdMatch.name,
      };
    }
  }

  // 5. Check invoices / financial ledger records in state
  if (state?.invoices && Array.isArray(state.invoices)) {
    const invMatch = state.invoices.find(
      (i: any) => (i.email || "").toLowerCase().trim() === cleanEmail
    );
    if (invMatch) {
      return {
        isEnrolled: true,
        role: "student",
        studentRecordId: invMatch.studentId,
        studentNumber: invMatch.studentNumber || invMatch.studentId,
        studentName: invMatch.studentName,
      };
    }
  }

  return { isEnrolled: false };
}

/**
 * Authoritative Authentication Pipeline:
 * 
 * Authentication
 *       ↓
 * Who are you? (Firebase ID Token -> verifyIdToken() -> uid, email)
 *       ↓
 * Authorization
 *       ↓
 * What are you allowed to do? (Database users/roles -> user.role -> permissions)
 *       ↓
 * Resource authorization
 *       ↓
 * Which specific record may you access? (requireResourceOwnership())
 * 
 * Insecure identity sources (req.query.userEmail, req.body.userEmail,
 * x-user-role, x-user-email) are strictly prohibited from establishing identity.
 * Roles and privileges are NEVER inferred from email strings ("admin", "teacher", "lecturer").
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

  // 2. Query database for user role and active status
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

  // Authoritative State for supplemental profile attributes (credentials in DB state)
  const state = cleanEmail ? await getAuthoritativeState(cleanEmail) : null;

  // Default role is strictly "student" unless configured in database
  let assignedRole: UserRole = "student";

  // Check state database userCredentials for explicit role assignment
  if (state?.userCredentials && Array.isArray(state.userCredentials)) {
    const match = state.userCredentials.find((u: any) => u.email?.toLowerCase().trim() === cleanEmail);
    if (match?.role) {
      assignedRole = normalizeUserRole(match.role);
    }
  }

  // If role is present in PostgreSQL users table, use it as database source of truth
  if (dbUser?.role) {
    assignedRole = normalizeUserRole(dbUser.role);
  }

  // Enrollment-based Policy:
  // If user does not exist in database users table, match email or student number to enrollment roster.
  // Account is ONLY activated if a valid enrollment or credential match is found.
  if (!dbUser && cleanEmail) {
    const enrollment = await checkEnrollmentMatch(cleanEmail, supabase, state);

    if (!enrollment.isEnrolled) {
      logger.warn(`Authentication rejected for un-enrolled account attempt: ${cleanEmail}`);
      return null;
    }

    if (enrollment.role) {
      assignedRole = enrollment.role;
    }

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
        logger.info(`Activated enrolled user account for ${cleanEmail} (role: ${dbRole})`);

        // If enrollment matched a database student record, link user_id
        if (enrollment.studentRecordId) {
          await supabase
            .from("students")
            .update({ user_id: createdUser.id })
            .eq("id", enrollment.studentRecordId)
            .is("user_id", null);
        }
      }
    } catch (insertErr) {
      logger.warn("Could not insert user into database users table:", insertErr);
    }
  }

  // Look up student record from database students table
  let studentRecordId: string | undefined = undefined;
  let studentNumber: string | undefined = undefined;
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

      if (studentRecord) {
        if (studentRecord.id) studentRecordId = studentRecord.id;
        if (studentRecord.student_number) studentNumber = studentRecord.student_number;
        studentId = studentRecord.id || studentRecord.student_number;
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
      if (match.studentRecordId && !studentRecordId) studentRecordId = match.studentRecordId;
      if (match.studentNumber && !studentNumber) studentNumber = match.studentNumber;
      if (match.studentId && !studentId) studentId = match.studentId;
      if (match.assignedCourses) assignedCourses = match.assignedCourses;
    }
  }

  // Fallbacks to maintain consistency across studentRecordId, studentNumber, and studentId
  if (!studentRecordId && studentId && studentId.includes("-") && studentId.length > 20) {
    studentRecordId = studentId;
  } else if (!studentNumber && studentId) {
    studentNumber = studentId;
  }

  if (!studentId) {
    studentId = studentRecordId || studentNumber;
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

  // 3. req.user: authoritative user object containing uid, userId, studentRecordId (UUID), studentNumber (string), permissions
  return {
    uid: firebaseUid,
    userId: userId,
    id: userId,
    email: cleanEmail,
    name: studentName || cleanEmail.split("@")[0],
    role: assignedRole,
    studentId,
    studentRecordId,
    studentNumber,
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
 * Verifies whether a lecturer is assigned to teach a course by querying the authoritative database.
 * Does NOT trust client-supplied or unverified in-memory claims.
 */
export async function verifyLecturerCourseInDatabase(
  user: AuthenticatedUser,
  courseCode: string
): Promise<boolean> {
  if (!user || user.role !== "lecturer" || !courseCode) {
    return false;
  }

  const cleanCourse = courseCode.trim().toUpperCase();
  const cleanEmail = (user.email || "").trim().toLowerCase();
  const cleanName = (user.studentName || user.name || "").trim().toLowerCase();
  const userId = user.userId || user.id || "";

  try {
    const supabase = getServerSupabase();

    // 1. Check relational `course_offerings` table in PostgreSQL
    try {
      const { data: offerings, error: offErr } = await supabase
        .from("course_offerings")
        .select(`
          id,
          course_definition_id,
          lecturer_email,
          lecturer_name,
          status,
          course_definitions (
            id,
            code
          )
        `)
        .is("deleted_at", null);

      if (!offErr && offerings && offerings.length > 0) {
        const isAssigned = offerings.some((off: any) => {
          const offLecturerEmail = (off.lecturer_email || "").trim().toLowerCase();
          const offLecturerName = (off.lecturer_name || "").trim().toLowerCase();

          const lecturerMatches =
            (cleanEmail && offLecturerEmail === cleanEmail) ||
            (cleanName && offLecturerName === cleanName) ||
            (cleanName && offLecturerEmail.includes(cleanName.replace(/\s+/g, ""))) ||
            (cleanEmail && offLecturerName.includes(cleanEmail.split("@")[0]));

          if (!lecturerMatches) return false;

          const codeFromDef = (off.course_definitions?.code || "").trim().toUpperCase();
          const defId = (off.course_definition_id || "").trim().toUpperCase();
          const offId = (off.id || "").trim().toUpperCase();

          return (
            codeFromDef === cleanCourse ||
            defId === cleanCourse ||
            offId === cleanCourse ||
            cleanCourse.includes(codeFromDef || "___") ||
            (codeFromDef && cleanCourse.startsWith(codeFromDef))
          );
        });

        if (isAssigned) {
          return true;
        }
      }
    } catch (offEx) {
      logger.warn("Error checking course_offerings in verifyLecturerCourseInDatabase:", offEx);
    }

    // 2. Check `users` table for database-persisted assigned_courses array
    try {
      const { data: dbUser, error: userErr } = await supabase
        .from("users")
        .select("id, email, assigned_courses, role")
        .or(`id.eq.${userId},email.eq.${cleanEmail}`)
        .maybeSingle();

      if (!userErr && dbUser?.assigned_courses && Array.isArray(dbUser.assigned_courses)) {
        const hasAssignment = dbUser.assigned_courses.some((c: string) => {
          const upper = String(c).trim().toUpperCase();
          return upper === cleanCourse || cleanCourse.includes(upper);
        });
        if (hasAssignment) {
          return true;
        }
      }
    } catch (userEx) {
      logger.warn("Error checking users table in verifyLecturerCourseInDatabase:", userEx);
    }

    // 3. Check authoritative state stored in database app_states table
    try {
      const { data: stateRow, error: stateErr } = await supabase
        .from("app_states")
        .select("state")
        .eq("id", "shared_default_state")
        .maybeSingle();

      if (!stateErr && stateRow?.state) {
        const state = stateRow.state;

        // Check state.courseOfferings
        if (Array.isArray(state.courseOfferings)) {
          const assignedInState = state.courseOfferings.some((off: any) => {
            const offCourseCode = (off.courseCode || off.courseId || "").trim().toUpperCase();
            const offLecturerEmail = (off.lecturer?.email || off.lecturerEmail || "").trim().toLowerCase();
            const offLecturerName = (off.lecturer?.name || off.lecturerName || "").trim().toLowerCase();

            const isLecturer =
              (cleanEmail && offLecturerEmail === cleanEmail) ||
              (cleanName && offLecturerName === cleanName) ||
              (cleanName && offLecturerEmail.includes(cleanName.replace(/\s+/g, ""))) ||
              (cleanEmail && offLecturerName.includes(cleanEmail.split("@")[0]));

            return isLecturer && (offCourseCode === cleanCourse || cleanCourse.includes(offCourseCode));
          });

          if (assignedInState) {
            return true;
          }
        }

        // Check state.academicStructure
        if (Array.isArray(state.academicStructure?.courseOfferings)) {
          const assignedInAcademic = state.academicStructure.courseOfferings.some((off: any) => {
            const offCourseCode = (off.courseCode || off.courseId || "").trim().toUpperCase();
            const offLecturerEmail = (off.lecturer?.email || off.lecturerEmail || "").trim().toLowerCase();
            const offLecturerName = (off.lecturer?.name || off.lecturerName || "").trim().toLowerCase();

            const isLecturer =
              (cleanEmail && offLecturerEmail === cleanEmail) ||
              (cleanName && offLecturerName === cleanName) ||
              (cleanName && offLecturerEmail.includes(cleanName.replace(/\s+/g, ""))) ||
              (cleanEmail && offLecturerName.includes(cleanEmail.split("@")[0]));

            return isLecturer && (offCourseCode === cleanCourse || cleanCourse.includes(offCourseCode));
          });

          if (assignedInAcademic) {
            return true;
          }
        }
      }
    } catch (stateEx) {
      logger.warn("Error checking app_states in verifyLecturerCourseInDatabase:", stateEx);
    }

    return false;
  } catch (err) {
    logger.error("Database lecturer course verification failed:", err);
    return false;
  }
}

/**
 * Verifies student ownership strictly using immutable internal IDs (student_number, student id, user_id).
 * Never authorizes based on names, display names, email prefixes, or partial strings.
 */
export async function verifyStudentOwnershipInDatabase(
  user: AuthenticatedUser,
  targetStudentId?: string,
  targetStudentName?: string,
  targetEmail?: string
): Promise<boolean> {
  if (!user) return false;

  const cleanUserId = (user.userId || user.id || "").trim().toLowerCase();
  const cleanStudentRecordId = (user.studentRecordId || "").trim().toLowerCase();
  const cleanStudentNumber = (user.studentNumber || "").trim().toLowerCase();
  const cleanUserStudentId = (user.studentId || "").trim().toLowerCase();
  const cleanUserEmail = (user.email || "").trim().toLowerCase();

  const cleanTargetId = (targetStudentId || "").trim().toLowerCase();
  const cleanTargetEmail = (targetEmail || "").trim().toLowerCase();

  // 1. Exact immutable ID matching against target parameters (UUIDs or student number)
  if (cleanTargetId) {
    if (cleanStudentRecordId && cleanTargetId === cleanStudentRecordId) {
      return true;
    }
    if (cleanStudentNumber && cleanTargetId === cleanStudentNumber) {
      return true;
    }
    if (cleanUserStudentId && cleanTargetId === cleanUserStudentId) {
      return true;
    }
    if (cleanUserId && cleanTargetId === cleanUserId) {
      return true;
    }
  }

  // 2. Exact email matching (only full exact email, no prefix or partial string)
  if (cleanTargetEmail && cleanUserEmail && cleanTargetEmail === cleanUserEmail) {
    return true;
  }

  // 3. Database lookup: If target parameter was passed as a name or identifier in URL parameter, look up the database record
  // and check record.id (UUID), record.student_number (registration string), or record.user_id (UUID) strictly against user's immutable IDs.
  const targetIdentifier = targetStudentId || targetStudentName;
  if (!targetIdentifier) {
    return false;
  }

  try {
    const supabase = getServerSupabase();

    // Query students table by student_number, id (UUID), or user_id (UUID) matching targetIdentifier
    const { data: stdRecords, error } = await supabase
      .from("students")
      .select("id, student_number, user_id")
      .or(`student_number.eq.${targetIdentifier},id.eq.${targetIdentifier},user_id.eq.${targetIdentifier}`);

    if (!error && stdRecords && stdRecords.length > 0) {
      const isOwned = stdRecords.some((rec: any) => {
        const recStdNum = (rec.student_number || "").trim().toLowerCase();
        const recId = (rec.id || "").trim().toLowerCase();
        const recUserId = (rec.user_id || "").trim().toLowerCase();

        return (
          (cleanStudentRecordId && recId === cleanStudentRecordId) ||
          (cleanStudentNumber && recStdNum === cleanStudentNumber) ||
          (cleanUserStudentId && (recStdNum === cleanUserStudentId || recId === cleanUserStudentId)) ||
          (cleanUserId && (recUserId === cleanUserId || recId === cleanUserId))
        );
      });

      if (isOwned) {
        return true;
      }
    }

    // Query profiles joined with students if targetIdentifier was passed as display name in URL path
    if (targetStudentName) {
      const normTargetName = targetStudentName.trim().toLowerCase();
      const { data: profRecords, error: profErr } = await supabase
        .from("profiles")
        .select("id, user_id, first_name, last_name, students(id, student_number, user_id)");

      if (!profErr && profRecords && profRecords.length > 0) {
        const matchedProfile = profRecords.find((p: any) => {
          const fullName = `${p.first_name || ""} ${p.last_name || ""}`.trim().toLowerCase();
          return fullName === normTargetName;
        });

        if (matchedProfile) {
          const profUserId = (matchedProfile.user_id || "").trim().toLowerCase();
          const stdList = matchedProfile.students || [];

          if (cleanUserId && profUserId === cleanUserId) {
            return true;
          }

          const stdMatches = stdList.some((rec: any) => {
            const recStdNum = (rec.student_number || "").trim().toLowerCase();
            const recId = (rec.id || "").trim().toLowerCase();
            const recUserId = (rec.user_id || "").trim().toLowerCase();

            return (
              (cleanStudentRecordId && recId === cleanStudentRecordId) ||
              (cleanStudentNumber && recStdNum === cleanStudentNumber) ||
              (cleanUserStudentId && (recStdNum === cleanUserStudentId || recId === cleanUserStudentId)) ||
              (cleanUserId && (recUserId === cleanUserId || recId === cleanUserId))
            );
          });

          if (stdMatches) {
            return true;
          }
        }
      }
    }

    // Fallback: Check state in app_states table
    const { data: stateRow } = await supabase
      .from("app_states")
      .select("state")
      .eq("id", "shared_default_state")
      .maybeSingle();

    if (stateRow?.state) {
      const state = stateRow.state;
      if (Array.isArray(state.userCredentials)) {
        const matchingCred = state.userCredentials.find(
          (c: any) => (c.email || "").trim().toLowerCase() === cleanUserEmail
        );
        if (matchingCred) {
          const credStdId = String(matchingCred.studentId || matchingCred.studentRecordId || "").trim().toLowerCase();
          const credStdNum = String(matchingCred.studentNumber || "").trim().toLowerCase();

          if (cleanTargetId && (cleanTargetId === credStdId || cleanTargetId === credStdNum)) {
            return true;
          }
        }
      }
    }
  } catch (dbErr) {
    logger.warn("Database student ownership verification failed:", dbErr);
  }

  return false;
}

/**
 * Resource Ownership Verification Middleware
 * 
 * Verifies that the authenticated user either:
 * 1. Has an elevated administrative role (Super Admin, Admin, Registrar, Finance Officer, etc.), OR
 * 2. Is the assigned faculty lecturer for the specific course, verified strictly against the database, OR
 * 3. Owns the resource verified strictly by immutable studentId / user_id database record comparison.
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
  return async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: "Authentication required", code: "UNAUTHENTICATED" });
    }

    const { role, email } = req.user;

    // 1. Super Admin is always authorized
    if (role === "super_admin") {
      return next();
    }

    // 2. Check explicitly allowed administrative roles (excluding lecturer!)
    // Note: Lecturers must never bypass via allowedRoles; they must be verified with courseCode against the database.
    const allowedRoles: UserRole[] = (options.allowedRoles || ["super_admin", "admin", "registrar"])
      .filter((r): r is UserRole => r !== "lecturer");

    if (allowedRoles.includes(role)) {
      return next();
    }

    // 3. Extract target identifiers from request
    const { targetStudentId, targetStudentName, targetEmail, courseCode } = options.getTarget(req);

    // 4. Lecturer check: Course scope is strictly required and verified against the database
    if (role === "lecturer") {
      if (!courseCode) {
        return res.status(400).json({
          error: "Course scope is required",
          code: "COURSE_SCOPE_REQUIRED",
          details: "Lecturers must provide a courseCode parameter or body field to access scoped student records."
        });
      }

      // Verify course assignment from database (never trust client claims or unverified state)
      const isAssigned = await verifyLecturerCourseInDatabase(req.user, courseCode);
      if (isAssigned) {
        return next();
      }

      logger.warn(`Lecturer course verification failed for ${email} (Role: lecturer) targeting course [${courseCode}]`);
      return res.status(403).json({
        error: `Access Denied: You are not assigned as the lecturer for course ${courseCode} in the database.`,
        code: "LECTURER_COURSE_UNASSIGNED",
        details: "Lecturer access is restricted to courses actively assigned to the faculty member in the database."
      });
    }

    // 5. Student Ownership Check: Validate strictly using immutable internal IDs against database records.
    // Do NOT authorize based on name, email prefix, display name, or partial strings.
    const isOwner = await verifyStudentOwnershipInDatabase(
      req.user,
      targetStudentId,
      targetStudentName,
      targetEmail
    );

    if (isOwner) {
      return next();
    }

    // Access Denied
    logger.warn(`Resource Ownership Check Failed for ${email} (Role: ${role}) targeting [ID: ${targetStudentId}, Name: ${targetStudentName}, Email: ${targetEmail}]`);
    return res.status(403).json({
      error: "Access Denied: You do not have ownership or authority to view or modify this student's private record.",
      code: "RESOURCE_OWNERSHIP_DENIED",
      details: "Students may only access their own grades, attendance, and financial ledgers verified by immutable ID."
    });
  };
}
