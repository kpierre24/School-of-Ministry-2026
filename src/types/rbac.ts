/**
 * Role-Based Access Control (RBAC) Data Contracts & Permissions
 * HTEIM School of Ministry
 */

export type UserRole =
  | 'super_admin'     // Everything
  | 'admin'           // Students, enrollment, attendance, payments, reports
  | 'registrar'       // Enrollment, student records, academic documents
  | 'lecturer'        // Assigned courses, attendance, assignments, grades
  | 'student'         // Own courses, attendance, grades, assignments, payments
  | 'finance_officer' // Payments, balances, receipts, financial reports
  | 'librarian'       // Library resources and borrowing
  | 'viewer'          // Read-only access to selected information
  // Legacy aliases for backward compatibility:
  | 'teacher'
  | 'staff';

export interface RoleDefinition {
  id: UserRole;
  title: string;
  badge: string;
  color: string;
  badgeBg: string;
  description: string;
  accessibleTabs: string[];
  permissions: Permission[];
}

export type Permission =
  | 'all:access'
  // Students & Enrollment
  | 'students:view_all'
  | 'students:view_own'
  | 'students:enroll'
  | 'students:edit_records'
  | 'students:academic_docs'
  // Attendance
  | 'attendance:view_all'
  | 'attendance:view_own'
  | 'attendance:mark_assigned'
  | 'attendance:mark_all'
  | 'attendance:override'
  // Academics & Grades
  | 'grades:view_all'
  | 'grades:view_assigned'
  | 'grades:view_own'
  | 'grades:submit_grade'
  | 'academics:manage_courses'
  | 'academics:view_courses'
  // Assignments & Exams
  | 'assignments:manage'
  | 'assignments:submit_own'
  | 'assignments:grade_assigned'
  // Finance & Payments
  | 'finance:view_all'
  | 'finance:view_own'
  | 'finance:record_payment'
  | 'finance:adjustments'
  | 'finance:reconcile'
  | 'finance:reports'
  // Library
  | 'library:manage'
  | 'library:borrow'
  | 'library:view'
  // Reports & Logs
  | 'reports:view_all'
  | 'audit_logs:view'
  // Roles & Security
  | 'roles:manage';

export interface AuthenticatedUser {
  uid: string;           // Firebase UID
  userId: string;        // Database users table ID
  id: string;            // Aliased to userId for backward compatibility
  email: string;
  name: string;
  role: UserRole;
  studentId?: string;
  studentName?: string;
  assignedCourses?: string[];
  permissions: Permission[];
}

export const ROLE_DEFINITIONS: Record<string, RoleDefinition> = {
  super_admin: {
    id: 'super_admin',
    title: 'Super Admin',
    badge: 'Super Admin',
    color: 'text-purple-700 dark:text-purple-300 border-purple-300 dark:border-purple-800',
    badgeBg: 'bg-purple-100 dark:bg-purple-950/60',
    description: 'Unrestricted master access to all system entities, database settings, audit logs, and security roles.',
    accessibleTabs: ['home', 'attendance', 'students', 'courses', 'exams', 'schedule', 'library', 'payments', 'messages', 'reports', 'notes'],
    permissions: ['all:access']
  },
  admin: {
    id: 'admin',
    title: 'Administrator',
    badge: 'Administrator',
    color: 'text-rose-700 dark:text-rose-300 border-rose-300 dark:border-rose-800',
    badgeBg: 'bg-rose-100 dark:bg-rose-950/60',
    description: 'Full management of students, admissions, attendance tracking, payments, financial reports, and notifications.',
    accessibleTabs: ['home', 'attendance', 'students', 'courses', 'exams', 'schedule', 'library', 'payments', 'messages', 'reports', 'notes'],
    permissions: [
      'students:view_all',
      'students:enroll',
      'students:edit_records',
      'students:academic_docs',
      'attendance:view_all',
      'attendance:mark_all',
      'attendance:override',
      'grades:view_all',
      'academics:manage_courses',
      'academics:view_courses',
      'assignments:manage',
      'finance:view_all',
      'finance:record_payment',
      'finance:adjustments',
      'finance:reconcile',
      'finance:reports',
      'library:manage',
      'library:borrow',
      'library:view',
      'reports:view_all',
      'audit_logs:view'
    ]
  },
  registrar: {
    id: 'registrar',
    title: 'Registrar',
    badge: 'Registrar',
    color: 'text-blue-700 dark:text-blue-300 border-blue-300 dark:border-blue-800',
    badgeBg: 'bg-blue-100 dark:bg-blue-950/60',
    description: 'Admissions, student enrollment, academic transcripts, official documents, and institutional reports.',
    accessibleTabs: ['home', 'students', 'courses', 'schedule', 'reports', 'notes'],
    permissions: [
      'students:view_all',
      'students:enroll',
      'students:edit_records',
      'students:academic_docs',
      'academics:view_courses',
      'academics:manage_courses',
      'reports:view_all',
      'library:view'
    ]
  },
  lecturer: {
    id: 'lecturer',
    title: 'Lecturer / Faculty',
    badge: 'Lecturer',
    color: 'text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-800',
    badgeBg: 'bg-amber-100 dark:bg-amber-950/60',
    description: 'Assigned course teachings, class session attendance grading, homework evaluation, and quizzes.',
    accessibleTabs: ['home', 'attendance', 'courses', 'exams', 'schedule', 'library', 'notes'],
    permissions: [
      'students:view_all',
      'attendance:view_all',
      'attendance:mark_assigned',
      'grades:view_assigned',
      'grades:submit_grade',
      'academics:view_courses',
      'assignments:manage',
      'assignments:grade_assigned',
      'library:view',
      'library:borrow'
    ]
  },
  student: {
    id: 'student',
    title: 'Student',
    badge: 'Student',
    color: 'text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800',
    badgeBg: 'bg-emerald-100 dark:bg-emerald-950/60',
    description: 'Self-service portal for enrolled course modules, personal attendance, assignment submissions, grades, and tuition receipts.',
    accessibleTabs: ['home', 'attendance', 'courses', 'exams', 'schedule', 'library', 'payments', 'notes'],
    permissions: [
      'students:view_own',
      'attendance:view_own',
      'grades:view_own',
      'assignments:submit_own',
      'finance:view_own',
      'academics:view_courses',
      'library:view',
      'library:borrow'
    ]
  },
  finance_officer: {
    id: 'finance_officer',
    title: 'Finance Officer',
    badge: 'Finance Officer',
    color: 'text-teal-700 dark:text-teal-300 border-teal-300 dark:border-teal-800',
    badgeBg: 'bg-teal-100 dark:bg-teal-950/60',
    description: 'Tuition collection, bank transfer reconciliation, receipts, adjustments, scholarships, and revenue ledger analytics.',
    accessibleTabs: ['home', 'payments', 'reports', 'students', 'notes'],
    permissions: [
      'finance:view_all',
      'finance:record_payment',
      'finance:adjustments',
      'finance:reconcile',
      'finance:reports',
      'students:view_all',
      'reports:view_all',
      'library:view'
    ]
  },
  librarian: {
    id: 'librarian',
    title: 'Librarian',
    badge: 'Librarian',
    color: 'text-indigo-700 dark:text-indigo-300 border-indigo-300 dark:border-indigo-800',
    badgeBg: 'bg-indigo-100 dark:bg-indigo-950/60',
    description: 'Curriculum library resources, digital PDF syllabi, pastoral handouts, and borrowing circulation.',
    accessibleTabs: ['home', 'library', 'schedule', 'courses', 'notes'],
    permissions: [
      'library:manage',
      'library:borrow',
      'library:view',
      'academics:view_courses'
    ]
  },
  viewer: {
    id: 'viewer',
    title: 'Viewer (Read-Only)',
    badge: 'Viewer',
    color: 'text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-800',
    badgeBg: 'bg-slate-100 dark:bg-slate-800',
    description: 'Read-only viewing of ministry announcements, public catalog, general schedules, and selected resources.',
    accessibleTabs: ['home', 'courses', 'schedule', 'library'],
    permissions: [
      'academics:view_courses',
      'library:view'
    ]
  },
  // Legacy aliases:
  teacher: {
    id: 'lecturer',
    title: 'Lecturer / Faculty',
    badge: 'Lecturer',
    color: 'text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-800',
    badgeBg: 'bg-amber-100 dark:bg-amber-950/60',
    description: 'Assigned course teachings, class session attendance grading, homework evaluation, and quizzes.',
    accessibleTabs: ['home', 'attendance', 'courses', 'exams', 'schedule', 'library', 'notes'],
    permissions: [
      'students:view_all',
      'attendance:view_all',
      'attendance:mark_assigned',
      'grades:view_assigned',
      'grades:submit_grade',
      'academics:view_courses',
      'assignments:manage',
      'assignments:grade_assigned',
      'library:view',
      'library:borrow'
    ]
  },
  staff: {
    id: 'admin',
    title: 'Administrator',
    badge: 'Administrator',
    color: 'text-rose-700 dark:text-rose-300 border-rose-300 dark:border-rose-800',
    badgeBg: 'bg-rose-100 dark:bg-rose-950/60',
    description: 'Full management of students, admissions, attendance tracking, payments, financial reports, and notifications.',
    accessibleTabs: ['home', 'attendance', 'students', 'courses', 'exams', 'schedule', 'library', 'payments', 'messages', 'reports', 'notes'],
    permissions: [
      'students:view_all',
      'students:enroll',
      'students:edit_records',
      'attendance:view_all',
      'attendance:mark_all',
      'grades:view_all',
      'academics:manage_courses',
      'academics:view_courses',
      'assignments:manage',
      'finance:view_all',
      'finance:record_payment',
      'library:manage',
      'library:view',
      'reports:view_all'
    ]
  }
};

/**
 * Normalizes legacy role string into canonical UserRole
 */
export function normalizeUserRole(role: string | undefined | null): UserRole {
  if (!role) return 'student';
  const clean = role.toLowerCase().trim();
  if (clean === 'super_admin' || clean === 'superadmin') return 'super_admin';
  if (clean === 'admin' || clean === 'administrator' || clean === 'staff') return 'admin';
  if (clean === 'registrar') return 'registrar';
  if (clean === 'lecturer' || clean === 'teacher' || clean === 'faculty') return 'lecturer';
  if (clean === 'student') return 'student';
  if (clean === 'finance_officer' || clean === 'finance' || clean === 'accountant') return 'finance_officer';
  if (clean === 'librarian') return 'librarian';
  if (clean === 'viewer' || clean === 'guest' || clean === 'readonly') return 'viewer';
  return 'student';
}

/**
 * Checks if a given role has a specific permission
 */
export function roleHasPermission(role: UserRole | string, permission: Permission): boolean {
  const normRole = normalizeUserRole(role);
  if (normRole === 'super_admin') return true;
  const def = ROLE_DEFINITIONS[normRole];
  if (!def) return false;
  if (def.permissions.includes('all:access')) return true;
  return def.permissions.includes(permission);
}
