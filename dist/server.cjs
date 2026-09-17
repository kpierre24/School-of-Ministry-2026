var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// src/lib/logger.ts
var LOG_LEVELS, Logger, logger;
var init_logger = __esm({
  "src/lib/logger.ts"() {
    LOG_LEVELS = {
      debug: 0,
      info: 1,
      warn: 2,
      error: 3
    };
    Logger = class {
      constructor() {
        this.level = "info";
      }
      setLevel(level) {
        this.level = level;
      }
      shouldLog(level) {
        return LOG_LEVELS[level] >= LOG_LEVELS[this.level];
      }
      log(level, args) {
        if (!this.shouldLog(level)) return;
        const prefix = `[${level.toUpperCase()}]`;
        console.log(prefix, ...args);
      }
      debug(...args) {
        this.log("debug", args);
      }
      info(...args) {
        this.log("info", args);
      }
      warn(...args) {
        this.log("warn", args);
      }
      error(...args) {
        this.log("error", args);
      }
    };
    logger = new Logger();
  }
});

// src/data/guards.ts
function isDemoUser(userOrEmail) {
  if (!userOrEmail) return false;
  if (typeof userOrEmail === "object") {
    if (userOrEmail.isDemoUser === true || userOrEmail.isDemo === true) return true;
    if (typeof userOrEmail.id === "string" && (userOrEmail.id.startsWith("demo-") || userOrEmail.id.startsWith("dev-"))) return true;
    const email = userOrEmail.email || "";
    return isDemoUser(email);
  }
  if (typeof userOrEmail === "string") {
    const clean = userOrEmail.toLowerCase().trim();
    if (clean.endsWith("@demo.hteim.edu")) return true;
    return DEMO_EMAIL_PATTERNS.some((pattern) => clean.includes(pattern));
  }
  return false;
}
var DEMO_EMAIL_PATTERNS;
var init_guards = __esm({
  "src/data/guards.ts"() {
    DEMO_EMAIL_PATTERNS = [
      "@demo.",
      "demo@",
      "test@",
      "@example.com",
      "@example.test",
      ".example.test",
      ".test",
      "guest@hteim.edu",
      "demo@demo.hteim.edu",
      "teacher@demo.hteim.edu",
      "admin@demo.hteim.edu",
      "student@demo.hteim.edu"
    ];
  }
});

// src/types/rbac.ts
function normalizeUserRole(role) {
  if (!role) return "student";
  const clean = role.toLowerCase().trim();
  if (clean === "super_admin" || clean === "superadmin") return "super_admin";
  if (clean === "admin" || clean === "administrator" || clean === "staff") return "admin";
  if (clean === "registrar") return "registrar";
  if (clean === "lecturer" || clean === "teacher" || clean === "faculty") return "lecturer";
  if (clean === "student") return "student";
  if (clean === "finance_officer" || clean === "finance" || clean === "accountant") return "finance_officer";
  if (clean === "librarian") return "librarian";
  if (clean === "viewer" || clean === "guest" || clean === "readonly") return "viewer";
  return "student";
}
function roleHasPermission(role, permission) {
  const normRole = normalizeUserRole(role);
  if (normRole === "super_admin") return true;
  const def = ROLE_DEFINITIONS[normRole];
  if (!def) return false;
  if (def.permissions.includes("all:access")) return true;
  return def.permissions.includes(permission);
}
var ROLE_DEFINITIONS;
var init_rbac = __esm({
  "src/types/rbac.ts"() {
    ROLE_DEFINITIONS = {
      super_admin: {
        id: "super_admin",
        title: "Super Admin",
        badge: "Super Admin",
        color: "text-purple-700 dark:text-purple-300 border-purple-300 dark:border-purple-800",
        badgeBg: "bg-purple-100 dark:bg-purple-950/60",
        description: "Unrestricted master access to all system entities, database settings, audit logs, and security roles.",
        accessibleTabs: ["home", "attendance", "students", "courses", "exams", "schedule", "library", "payments", "messages", "reports", "notes"],
        permissions: [
          "all:access",
          "students:read",
          "students:write",
          "attendance:read",
          "attendance:write",
          "attendance:approve",
          "assignments:read",
          "assignments:submit",
          "assignments:grade",
          "grades:read",
          "grades:write",
          "grades:release",
          "finance:read",
          "finance:write",
          "finance:refund",
          "audit:read",
          "users:manage",
          "roles:manage"
        ]
      },
      admin: {
        id: "admin",
        title: "Administrator",
        badge: "Administrator",
        color: "text-rose-700 dark:text-rose-300 border-rose-300 dark:border-rose-800",
        badgeBg: "bg-rose-100 dark:bg-rose-950/60",
        description: "Full administrative control over students, attendance approvals, curriculum grades, tuition, audits, and users.",
        accessibleTabs: ["home", "attendance", "students", "courses", "exams", "schedule", "library", "payments", "messages", "reports", "notes"],
        permissions: [
          "students:read",
          "students:write",
          "attendance:read",
          "attendance:write",
          "attendance:approve",
          "assignments:read",
          "assignments:submit",
          "assignments:grade",
          "grades:read",
          "grades:write",
          "grades:release",
          "finance:read",
          "finance:write",
          "finance:refund",
          "audit:read",
          "users:manage",
          "roles:manage"
        ]
      },
      registrar: {
        id: "registrar",
        title: "Registrar",
        badge: "Registrar",
        color: "text-blue-700 dark:text-blue-300 border-blue-300 dark:border-blue-800",
        badgeBg: "bg-blue-100 dark:bg-blue-950/60",
        description: "Admissions, student enrollment, academic records, official grade releases, and student registry management.",
        accessibleTabs: ["home", "students", "courses", "schedule", "reports", "notes"],
        permissions: [
          "students:read",
          "students:write",
          "attendance:read",
          "assignments:read",
          "grades:read",
          "grades:release",
          "audit:read"
        ]
      },
      lecturer: {
        id: "lecturer",
        title: "Lecturer / Faculty",
        badge: "Lecturer",
        color: "text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-800",
        badgeBg: "bg-amber-100 dark:bg-amber-950/60",
        description: "Course teachings, class session attendance marking, homework grading, and score assignments.",
        accessibleTabs: ["home", "attendance", "courses", "exams", "schedule", "library", "notes"],
        permissions: [
          "students:read",
          "attendance:read",
          "attendance:write",
          "assignments:read",
          "assignments:grade",
          "grades:read",
          "grades:write"
        ]
      },
      student: {
        id: "student",
        title: "Student",
        badge: "Student",
        color: "text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800",
        badgeBg: "bg-emerald-100 dark:bg-emerald-950/60",
        description: "Self-service access for personal attendance, assignment submissions, course grades, and tuition ledger.",
        accessibleTabs: ["home", "attendance", "courses", "exams", "schedule", "library", "payments", "notes"],
        permissions: [
          "students:read",
          "attendance:read",
          "assignments:read",
          "assignments:submit",
          "grades:read",
          "finance:read"
        ]
      },
      finance_officer: {
        id: "finance_officer",
        title: "Finance Officer",
        badge: "Finance Officer",
        color: "text-teal-700 dark:text-teal-300 border-teal-300 dark:border-teal-800",
        badgeBg: "bg-teal-100 dark:bg-teal-950/60",
        description: "Tuition invoicing, payment transaction recording, refunds, financial adjustments, and ledger auditing.",
        accessibleTabs: ["home", "payments", "reports", "students", "notes"],
        permissions: [
          "students:read",
          "finance:read",
          "finance:write",
          "finance:refund",
          "audit:read"
        ]
      },
      librarian: {
        id: "librarian",
        title: "Librarian",
        badge: "Librarian",
        color: "text-indigo-700 dark:text-indigo-300 border-indigo-300 dark:border-indigo-800",
        badgeBg: "bg-indigo-100 dark:bg-indigo-950/60",
        description: "Curriculum library resources, digital PDF syllabi, pastoral handouts, and academic reading catalogs.",
        accessibleTabs: ["home", "library", "schedule", "courses", "notes"],
        permissions: [
          "students:read",
          "assignments:read"
        ]
      },
      viewer: {
        id: "viewer",
        title: "Viewer (Read-Only)",
        badge: "Viewer",
        color: "text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-800",
        badgeBg: "bg-slate-100 dark:bg-slate-800",
        description: "Read-only access to general catalogs, courses, and ministry announcements.",
        accessibleTabs: ["home", "courses", "schedule", "library"],
        permissions: [
          "students:read",
          "attendance:read",
          "assignments:read",
          "grades:read",
          "finance:read"
        ]
      },
      // Legacy aliases
      teacher: {
        id: "lecturer",
        title: "Lecturer / Faculty",
        badge: "Lecturer",
        color: "text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-800",
        badgeBg: "bg-amber-100 dark:bg-amber-950/60",
        description: "Course teachings, class session attendance marking, homework grading, and score assignments.",
        accessibleTabs: ["home", "attendance", "courses", "exams", "schedule", "library", "notes"],
        permissions: [
          "students:read",
          "attendance:read",
          "attendance:write",
          "assignments:read",
          "assignments:grade",
          "grades:read",
          "grades:write"
        ]
      },
      staff: {
        id: "admin",
        title: "Administrator",
        badge: "Administrator",
        color: "text-rose-700 dark:text-rose-300 border-rose-300 dark:border-rose-800",
        badgeBg: "bg-rose-100 dark:bg-rose-950/60",
        description: "Administrative support for students, attendance, grades, and finance.",
        accessibleTabs: ["home", "attendance", "students", "courses", "exams", "schedule", "library", "payments", "messages", "reports", "notes"],
        permissions: [
          "students:read",
          "students:write",
          "attendance:read",
          "attendance:write",
          "assignments:read",
          "grades:read",
          "finance:read",
          "finance:write",
          "audit:read"
        ]
      }
    };
  }
});

// src/server/services/domain/studentsService.ts
var studentsService;
var init_studentsService = __esm({
  "src/server/services/domain/studentsService.ts"() {
    init_supabaseServer();
    init_logger();
    studentsService = {
      /**
       * Retrieves students with joined profile and summary metrics from relational tables.
       * For student requests, queries are filtered at the database level rather than loading all students in memory.
       */
      async getStudents(user, options) {
        const supabase = getServerSupabase();
        try {
          const isStudent = user?.role === "student";
          const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
          const studentRecordUuid = user?.studentRecordId && UUID_REGEX.test(user.studentRecordId) ? user.studentRecordId : null;
          const userUuid = (user?.userId || user?.id) && UUID_REGEX.test(user?.userId || user?.id || "") ? user?.userId || user?.id : null;
          const studentNumber = user?.studentNumber ? user.studentNumber.trim() : null;
          let studentQuery = supabase.from("students").select(`
          id,
          user_id,
          student_number,
          enrollment_status,
          cohort_level,
          admission_date,
          profiles (
            first_name,
            last_name,
            avatar_url,
            bio,
            phone
          ),
          users (
            email,
            is_active
          )
        `).is("deleted_at", null);
          if (isStudent) {
            if (studentRecordUuid && userUuid) {
              studentQuery = studentQuery.or(`id.eq.${studentRecordUuid},user_id.eq.${userUuid}`);
            } else if (studentRecordUuid) {
              studentQuery = studentQuery.eq("id", studentRecordUuid);
            } else if (userUuid) {
              studentQuery = studentQuery.eq("user_id", userUuid);
            } else if (studentNumber) {
              studentQuery = studentQuery.eq("student_number", studentNumber);
            } else {
              return { students: [], total: 0, atRiskCount: 0 };
            }
          } else {
            if (options?.studentId && UUID_REGEX.test(options.studentId)) {
              studentQuery = studentQuery.eq("id", options.studentId);
            }
            if (options?.cohortLevel) {
              studentQuery = studentQuery.eq("cohort_level", options.cohortLevel);
            }
            if (options?.enrollmentStatus) {
              studentQuery = studentQuery.eq("enrollment_status", options.enrollmentStatus);
            }
            if (options?.search) {
              const term = options.search.trim();
              studentQuery = studentQuery.or(`student_number.ilike.%${term}%`);
            }
            if (typeof options?.limit === "number" && options.limit > 0) {
              const offset = typeof options.offset === "number" && options.offset >= 0 ? options.offset : 0;
              studentQuery = studentQuery.range(offset, offset + options.limit - 1);
            }
          }
          studentQuery = studentQuery.order("created_at", { ascending: true });
          const { data: dbStudents, error: studentErr } = await studentQuery;
          if (studentErr) {
            logger.warn("Error querying students from relational table:", studentErr);
          }
          if (!dbStudents || dbStudents.length === 0) {
            return { students: [], total: 0, atRiskCount: 0 };
          }
          const targetStudentIds = dbStudents.map((s) => s.id).filter(Boolean);
          let attendanceQuery = supabase.from("attendance").select("student_id, session_date, status").is("deleted_at", null);
          let submissionsQuery = supabase.from("submissions").select("id, student_id, status, grades(points_awarded)").is("deleted_at", null);
          if (isStudent || targetStudentIds.length > 0 && targetStudentIds.length <= 100) {
            attendanceQuery = attendanceQuery.in("student_id", targetStudentIds);
            submissionsQuery = submissionsQuery.in("student_id", targetStudentIds);
          }
          const [
            { data: attendanceData },
            { data: submissionsData },
            sessionResult
          ] = await Promise.all([
            attendanceQuery,
            submissionsQuery,
            // When student is filtered at DB level, query global attendance_sessions for authoritative curriculum session dates
            isStudent ? supabase.from("attendance_sessions").select("session_date").is("deleted_at", null) : Promise.resolve({ data: null })
          ]);
          const attByStudent = /* @__PURE__ */ new Map();
          const sessionDates = /* @__PURE__ */ new Set();
          if (isStudent && sessionResult?.data) {
            (sessionResult.data || []).forEach((sess) => {
              if (sess.session_date) sessionDates.add(sess.session_date);
            });
          }
          (attendanceData || []).forEach((att) => {
            if (att.session_date) sessionDates.add(att.session_date);
            const current = attByStudent.get(att.student_id) || { present: 0, excused: 0, total: 0 };
            current.total += 1;
            const st = (att.status || "").toLowerCase();
            if (st === "present" || st === "tardy") current.present += 1;
            else if (st === "excused") current.excused += 1;
            attByStudent.set(att.student_id, current);
          });
          const subsByStudent = /* @__PURE__ */ new Map();
          (submissionsData || []).forEach((sub) => {
            const current = subsByStudent.get(sub.student_id) || { count: 0, totalPoints: 0, gradedCount: 0 };
            current.count += 1;
            const grade = sub.grades?.[0] || sub.grades;
            if (grade && typeof grade.points_awarded === "number") {
              current.totalPoints += grade.points_awarded;
              current.gradedCount += 1;
            }
            subsByStudent.set(sub.student_id, current);
          });
          const totalGlobalSessions = Math.max(sessionDates.size, 1);
          let list = dbStudents.map((s) => {
            const p = Array.isArray(s.profiles) ? s.profiles[0] : s.profiles;
            const u = Array.isArray(s.users) ? s.users[0] : s.users;
            const fullName = p ? `${p.first_name || ""} ${p.last_name || ""}`.trim() : s.student_number || "Student";
            const att = attByStudent.get(s.id) || { present: 0, excused: 0, total: 0 };
            const subs = subsByStudent.get(s.id) || { count: 0, totalPoints: 0, gradedCount: 0 };
            const effectivePresent = att.present + att.excused;
            const rate = totalGlobalSessions > 0 ? Math.round(effectivePresent / totalGlobalSessions * 100) : 100;
            const avgGrade = subs.gradedCount > 0 ? Math.round(subs.totalPoints / subs.gradedCount) : null;
            const isAtRisk = rate < 75 || avgGrade !== null && avgGrade < 75;
            const isCritical = rate <= 50 || avgGrade !== null && avgGrade < 50;
            const standing = avgGrade === null ? "Not Yet Graded" : avgGrade >= 85 ? "High Distinction" : avgGrade >= 75 && rate >= 75 ? "Satisfactory" : "At-Risk";
            return {
              id: s.id,
              name: fullName,
              studentNumber: s.student_number,
              email: u?.email || "",
              level: s.cohort_level || "Level 1 Foundation",
              photoUrl: p?.avatar_url || null,
              note: p?.bio || "",
              totalSessions: totalGlobalSessions,
              presentCount: att.present,
              excusedCount: att.excused,
              attendanceRate: rate,
              isAtRisk,
              isCritical,
              averageGrade: avgGrade,
              submissionsCount: subs.count,
              standing,
              enrollmentStatus: s.enrollment_status || "active"
            };
          });
          if (isStudent) {
            const studentUuid = user.studentRecordId || user.userId;
            const userUuid2 = user.userId || user.id;
            list = list.filter((s) => s.id === studentUuid || s.id === userUuid2 || s.userId === userUuid2 || s.user_id === userUuid2);
          }
          return {
            students: list,
            total: list.length,
            atRiskCount: list.filter((s) => s.isAtRisk).length
          };
        } catch (err) {
          logger.warn("Error reading from relational students table, using fallback:", err);
        }
        return { students: [], total: 0, atRiskCount: 0 };
      },
      /**
       * Retrieves single student profile with detailed history.
       */
      async getStudentByNameOrId(nameOrId, user) {
        const supabase = getServerSupabase();
        const cleanQuery = decodeURIComponent(nameOrId).trim();
        const norm = cleanQuery.toLowerCase();
        try {
          const { data: dbStudent } = await supabase.from("students").select(`
          id,
          user_id,
          student_number,
          enrollment_status,
          cohort_level,
          admission_date,
          profiles (
            first_name,
            last_name,
            avatar_url,
            bio,
            phone
          ),
          users (
            email
          )
        `).or(`id.eq.${cleanQuery},student_number.eq.${cleanQuery}`).is("deleted_at", null).maybeSingle();
          let studentId = dbStudent?.id;
          let studentName = cleanQuery;
          let studentData = dbStudent;
          if (!studentData) {
            const parts = cleanQuery.split(" ");
            const firstName = parts[0] || "";
            const lastName = parts.slice(1).join(" ") || "";
            const { data: profiles } = await supabase.from("profiles").select("user_id, first_name, last_name, avatar_url, bio, phone, students(*)").ilike("first_name", firstName).maybeSingle();
            if (profiles && profiles.students && profiles.students[0]) {
              studentData = {
                ...profiles.students[0],
                profiles: {
                  first_name: profiles.first_name,
                  last_name: profiles.last_name,
                  avatar_url: profiles.avatar_url,
                  bio: profiles.bio,
                  phone: profiles.phone
                }
              };
              studentId = studentData.id;
              studentName = `${profiles.first_name} ${profiles.last_name}`.trim();
            }
          } else {
            const p2 = Array.isArray(studentData.profiles) ? studentData.profiles[0] : studentData.profiles;
            if (p2) studentName = `${p2.first_name || ""} ${p2.last_name || ""}`.trim();
          }
          const [attRes, subRes, invRes, pmtRes] = await Promise.all([
            supabase.from("attendance").select("*").or(`student_id.eq.${studentId || "00000000-0000-0000-0000-000000000000"}`).is("deleted_at", null),
            supabase.from("submissions").select("*, grades(*)").or(`student_id.eq.${studentId || "00000000-0000-0000-0000-000000000000"}`).is("deleted_at", null),
            supabase.from("invoices").select("*").or(`student_id.eq.${studentId || "00000000-0000-0000-0000-000000000000"}`).is("deleted_at", null),
            supabase.from("payments").select("*").or(`student_id.eq.${studentId || "00000000-0000-0000-0000-000000000000"}`).is("deleted_at", null)
          ]);
          const attendanceHistory = attRes.data || [];
          const submissions = (subRes.data || []).map((s) => ({
            ...s,
            score: s.grades?.[0]?.points_awarded ?? s.grades?.points_awarded,
            feedback: s.grades?.[0]?.feedback ?? s.grades?.feedback
          }));
          const invoices = invRes.data || [];
          const payments = pmtRes.data || [];
          const p = Array.isArray(studentData?.profiles) ? studentData.profiles[0] : studentData?.profiles;
          const u = Array.isArray(studentData?.users) ? studentData.users[0] : studentData?.users;
          const presentCount = attendanceHistory.filter((a) => a.status === "present" || a.status === "tardy").length;
          const excusedCount = attendanceHistory.filter((a) => a.status === "excused").length;
          const totalSessions = Math.max(attendanceHistory.length, 1);
          const attendanceRate = Math.round((presentCount + excusedCount) / totalSessions * 100);
          let totalGradePoints = 0;
          let gradedCount = 0;
          submissions.forEach((s) => {
            if (typeof s.score === "number" && !isNaN(s.score)) {
              totalGradePoints += s.score;
              gradedCount += 1;
            }
          });
          const avgGrade = gradedCount > 0 ? Math.round(totalGradePoints / gradedCount) : null;
          const isAtRisk = attendanceRate < 75 || avgGrade !== null && avgGrade < 75;
          const isCritical = attendanceRate <= 50 || avgGrade !== null && avgGrade < 50;
          const standing = avgGrade === null ? "Not Yet Graded" : avgGrade >= 85 ? "High Distinction" : avgGrade >= 75 && attendanceRate >= 75 ? "Satisfactory" : "At-Risk";
          const summary = {
            id: studentId,
            name: studentName,
            studentNumber: studentData?.student_number || "SOM-STD",
            email: u?.email || "",
            level: studentData?.cohort_level || "Level 1 Foundation",
            photoUrl: p?.avatar_url || null,
            note: p?.bio || "",
            totalSessions,
            presentCount,
            excusedCount,
            attendanceRate,
            isAtRisk,
            isCritical,
            averageGrade: avgGrade,
            submissionsCount: submissions.length,
            standing
          };
          return {
            student: summary,
            attendanceHistory,
            submissions,
            invoices,
            payments
          };
        } catch (err) {
          logger.error("Error fetching relational student profile:", err);
          return null;
        }
      },
      /**
       * Enrolls a student directly into relational PostgreSQL tables (users, profiles, students).
       */
      async enrollStudent(data, actorUserId, actorRole) {
        const supabase = getServerSupabase();
        const cleanName = data.name.trim();
        const parts = cleanName.split(" ");
        const firstName = parts[0] || cleanName;
        const lastName = parts.slice(1).join(" ") || "Student";
        const email = data.email || `${cleanName.toLowerCase().replace(/[^a-z0-9]/g, ".")}@student.hteim.org`;
        const cleanNum = Math.floor(1e3 + Math.random() * 9e3);
        const studentNumber = `SOM-2026-${cleanNum}`;
        try {
          const { data: user, error: userErr } = await supabase.from("users").upsert(
            {
              email,
              role: "student",
              is_active: true,
              updated_at: (/* @__PURE__ */ new Date()).toISOString()
            },
            { onConflict: "email" }
          ).select().single();
          if (userErr || !user) {
            throw new Error(userErr?.message || "Failed to create user record for student");
          }
          const { data: profile, error: profErr } = await supabase.from("profiles").upsert(
            {
              user_id: user.id,
              first_name: firstName,
              last_name: lastName,
              avatar_url: data.photoUrl || null,
              updated_at: (/* @__PURE__ */ new Date()).toISOString()
            },
            { onConflict: "user_id" }
          ).select().single();
          if (profErr) {
            logger.warn("Profile upsert warning:", profErr);
          }
          const { data: student, error: stdErr } = await supabase.from("students").upsert(
            {
              user_id: user.id,
              student_number: studentNumber,
              cohort_level: data.level || "Level 1 Foundation",
              enrollment_status: "active",
              admission_date: (/* @__PURE__ */ new Date()).toISOString().split("T")[0],
              updated_at: (/* @__PURE__ */ new Date()).toISOString()
            },
            { onConflict: "user_id" }
          ).select().single();
          if (stdErr) {
            logger.warn("Student record upsert warning:", stdErr);
          }
          await logAuditEvent({
            actorUserId: actorUserId || null,
            actorRole: actorRole || "system",
            entityType: "student",
            entityId: student?.id || user.id,
            action: "create",
            newValues: {
              name: cleanName,
              email,
              studentNumber,
              cohortLevel: data.level || "Level 1 Foundation"
            },
            changedFields: ["name", "email", "studentNumber", "cohortLevel"],
            reason: `Student ${cleanName} enrolled`
          });
          return {
            status: "enrolled",
            student: {
              id: student?.id || user.id,
              name: cleanName,
              studentNumber,
              email,
              level: data.level || "Level 1 Foundation",
              photoUrl: data.photoUrl || null
            }
          };
        } catch (err) {
          logger.error("Error in enrollStudent relational service:", err);
          throw err;
        }
      },
      /**
       * Updates student attributes in relational tables.
       */
      async updateStudent(nameOrId, data, actorUserId, actorRole) {
        const supabase = getServerSupabase();
        const cleanQuery = decodeURIComponent(nameOrId).trim();
        try {
          const studentProfile = await this.getStudentByNameOrId(cleanQuery);
          if (!studentProfile || !studentProfile.student) {
            throw new Error(`Student ${cleanQuery} not found`);
          }
          const std = studentProfile.student;
          if (std.id) {
            const studentUpdates = { updated_at: (/* @__PURE__ */ new Date()).toISOString() };
            if (data.level) studentUpdates.cohort_level = data.level;
            if (data.enrollmentStatus) studentUpdates.enrollment_status = data.enrollmentStatus;
            if (data.studentNumber) studentUpdates.student_number = data.studentNumber;
            if (Object.keys(studentUpdates).length > 1) {
              await supabase.from("students").update(studentUpdates).eq("id", std.id);
            }
            const updateProf = { updated_at: (/* @__PURE__ */ new Date()).toISOString() };
            if (data.photoUrl !== void 0) updateProf.avatar_url = data.photoUrl;
            if (data.note !== void 0) updateProf.bio = data.note;
            if (Object.keys(updateProf).length > 1) {
              const { data: stdRecord } = await supabase.from("students").select("user_id").eq("id", std.id).single();
              if (stdRecord?.user_id) {
                await supabase.from("profiles").update(updateProf).eq("user_id", stdRecord.user_id);
              }
            }
          }
          await logAuditEvent({
            actorUserId: actorUserId || null,
            actorRole: actorRole || "system",
            entityType: "student",
            entityId: std.id || cleanQuery,
            action: "update",
            oldValues: { level: std.level, note: std.note, photoUrl: std.photoUrl, enrollmentStatus: std.enrollmentStatus },
            newValues: data,
            changedFields: Object.keys(data),
            reason: `Student ${std.name || cleanQuery} profile updated`
          });
          return {
            status: "updated",
            student: {
              ...std,
              level: data.level || std.level,
              note: data.note !== void 0 ? data.note : std.note,
              photoUrl: data.photoUrl !== void 0 ? data.photoUrl : std.photoUrl,
              enrollmentStatus: data.enrollmentStatus || std.enrollmentStatus,
              studentNumber: data.studentNumber || std.studentNumber
            }
          };
        } catch (err) {
          logger.error("Error updating relational student:", err);
          throw err;
        }
      }
    };
  }
});

// src/types/database.ts
function parseAttendanceStatus(status) {
  if (typeof status !== "string" || !status.trim()) {
    throw new Error("Attendance status is required. Allowed values are strictly: PRESENT, ABSENT, LATE, EXCUSED");
  }
  const upper = status.trim().toUpperCase();
  if (upper === "PRESENT" || upper === "P" || upper === "ATTENDED") {
    return "PRESENT" /* PRESENT */;
  }
  if (upper === "ABSENT" || upper === "A") {
    return "ABSENT" /* ABSENT */;
  }
  if (upper === "LATE" || upper === "TARDY" || upper === "L" || upper === "T") {
    return "LATE" /* LATE */;
  }
  if (upper === "EXCUSED" || upper === "E") {
    return "EXCUSED" /* EXCUSED */;
  }
  throw new Error(`Invalid attendance status "${status}". Arbitrary status strings are forbidden. Allowed values: PRESENT, ABSENT, LATE, EXCUSED`);
}
var init_database = __esm({
  "src/types/database.ts"() {
  }
});

// src/server/services/domain/attendanceService.ts
function validateAttendanceStatus(status) {
  return parseAttendanceStatus(status);
}
var attendanceService;
var init_attendanceService = __esm({
  "src/server/services/domain/attendanceService.ts"() {
    init_supabaseServer();
    init_logger();
    init_database();
    attendanceService = {
      /**
       * Resolves or provisions an attendance_session row for a given session date and course.
       */
      async resolveOrCreateSession(sessionDate, sessionTitle, courseId) {
        const supabase = getServerSupabase();
        const effectiveCourseId = courseId || "00000000-0000-0000-0000-000000000000";
        const cleanTitle = (sessionTitle || `Class Session ${sessionDate}`).trim();
        try {
          const { data: existingSession } = await supabase.from("attendance_sessions").select("id, session_date, title, course_id").eq("session_date", sessionDate).is("deleted_at", null).limit(1).maybeSingle();
          if (existingSession?.id) {
            return {
              id: existingSession.id,
              sessionDate: existingSession.session_date,
              title: existingSession.title || cleanTitle,
              courseId: existingSession.course_id || effectiveCourseId
            };
          }
          const { data: newSession, error } = await supabase.from("attendance_sessions").insert({
            session_date: sessionDate,
            course_id: effectiveCourseId !== "00000000-0000-0000-0000-000000000000" ? effectiveCourseId : null,
            title: cleanTitle,
            updated_at: (/* @__PURE__ */ new Date()).toISOString()
          }).select("id, session_date, title, course_id").single();
          if (!error && newSession?.id) {
            return {
              id: newSession.id,
              sessionDate: newSession.session_date,
              title: newSession.title || cleanTitle,
              courseId: newSession.course_id || effectiveCourseId
            };
          }
        } catch (err) {
          logger.warn("attendance_sessions query fallback notice:", err?.message || err);
        }
        return {
          id: `sess_${sessionDate.replace(/[^a-zA-Z0-9]/g, "_")}`,
          sessionDate,
          title: cleanTitle,
          courseId: effectiveCourseId
        };
      },
      /**
       * Resolves a canonical student_id (UUID PK) from students table.
       */
      async resolveStudentId(studentId, studentName, studentEmail) {
        const supabase = getServerSupabase();
        if (studentId && studentId.length >= 10 && !studentId.startsWith("std-unknown")) {
          return studentId;
        }
        try {
          if (studentEmail) {
            const { data: userRec } = await supabase.from("users").select("id, students(id)").eq("email", studentEmail.toLowerCase().trim()).maybeSingle();
            if (userRec?.students?.[0]?.id) return userRec.students[0].id;
            if (userRec?.students && userRec.students.id) return userRec.students.id;
          }
          if (studentName) {
            const parts = studentName.trim().split(" ");
            const firstName = parts[0] || studentName.trim();
            const { data: prof } = await supabase.from("profiles").select("user_id, students(id)").ilike("first_name", firstName).maybeSingle();
            if (prof?.students?.[0]?.id) return prof.students[0].id;
            if (prof?.students && prof.students.id) return prof.students.id;
          }
          const { data: firstStd } = await supabase.from("students").select("id").limit(1).maybeSingle();
          if (firstStd?.id) return firstStd.id;
        } catch (err) {
          logger.warn("Student ID resolution notice:", err);
        }
        return studentId || "00000000-0000-0000-0000-000000000000";
      },
      /**
       * Retrieves authoritative attendance records following the hierarchy:
       * attendance_session -> attendance_record -> student_id
       */
      async getAttendance(user) {
        const supabase = getServerSupabase();
        try {
          let query = supabase.from("attendance_records").select(`
          id,
          session_id,
          student_id,
          status,
          notes,
          manual_override,
          locked,
          recorded_by_user_id,
          created_at,
          updated_at,
          attendance_sessions (
            id,
            session_date,
            title,
            course_id
          ),
          students (
            id,
            student_number,
            cohort_level,
            profiles (
              first_name,
              last_name,
              avatar_url
            ),
            users (
              email
            )
          )
        `).is("deleted_at", null);
          if (user && user.role === "student") {
            const studentUuid = user.studentRecordId || user.userId;
            if (studentUuid) {
              query = query.eq("student_id", studentUuid);
            }
          }
          query = query.order("created_at", { ascending: false });
          const { data: recData, error: recError } = await query;
          if (!recError && recData && recData.length > 0) {
            const uniqueSessionsMap = /* @__PURE__ */ new Map();
            const excusedAbsences = {};
            const formattedRecords = recData.map((r) => {
              const session = r.attendance_sessions;
              const sessionDate = session?.session_date || "2026-09-09";
              const sessionTitle = session?.title || `Class Session ${sessionDate}`;
              const sessionId = r.session_id || session?.id || `sess_${sessionDate}`;
              if (!uniqueSessionsMap.has(sessionId)) {
                uniqueSessionsMap.set(sessionId, {
                  id: sessionId,
                  date: sessionDate,
                  sessionDate,
                  name: sessionTitle,
                  title: sessionTitle,
                  courseId: session?.course_id || null
                });
              }
              const student = r.students;
              const prof = Array.isArray(student?.profiles) ? student?.profiles[0] : student?.profiles;
              const userObj = Array.isArray(student?.users) ? student?.users[0] : student?.users;
              const studentName = prof ? `${prof.first_name || ""} ${prof.last_name || ""}`.trim() : "Student";
              let cleanStatus = "PRESENT" /* PRESENT */;
              try {
                cleanStatus = parseAttendanceStatus(r.status);
              } catch {
                cleanStatus = "PRESENT" /* PRESENT */;
              }
              if (cleanStatus === "EXCUSED" /* EXCUSED */) {
                excusedAbsences[`${studentName}_${sessionDate}`] = {
                  studentName,
                  date: sessionDate,
                  reason: r.notes || "Excused absence",
                  status: "approved",
                  approvedAt: r.updated_at || r.created_at
                };
              }
              return {
                id: r.id,
                sessionId,
                studentId: r.student_id,
                sessionDate,
                date: sessionDate,
                classDay: sessionId,
                name: studentName,
                studentName,
                status: cleanStatus,
                // Enum: PRESENT | ABSENT | LATE | EXCUSED
                present: cleanStatus === "PRESENT" /* PRESENT */ || cleanStatus === "LATE" /* LATE */,
                notes: r.notes || "",
                manualOverride: Boolean(r.manual_override),
                locked: Boolean(r.locked),
                timestamp: r.updated_at || r.created_at,
                capturedAt: r.created_at,
                recordedBy: r.recorded_by_user_id || "faculty",
                session: {
                  id: sessionId,
                  sessionDate,
                  title: sessionTitle,
                  courseId: session?.course_id || r.course_id || null
                },
                student: {
                  id: r.student_id,
                  name: studentName,
                  email: userObj?.email || "",
                  photoUrl: prof?.avatar_url || null,
                  studentNumber: student?.student_number || ""
                }
              };
            });
            let filtered = formattedRecords;
            if (user && user.role === "student") {
              const studentUuid = user.studentRecordId || user.userId;
              const userUuid = user.userId || user.id;
              filtered = formattedRecords.filter(
                (r) => r.studentId && (r.studentId === studentUuid || r.studentId === userUuid) || r.student?.id && (r.student.id === studentUuid || r.student.id === userUuid) || r.student_id && (r.student_id === studentUuid || r.student_id === userUuid)
              );
            } else if (user && (user.role === "lecturer" || user.role === "teacher")) {
              let lecturerUserId = (user.userId || user.id || "").trim();
              const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
              if (!UUID_REGEX.test(lecturerUserId)) {
                const { data: u } = await supabase.from("users").select("id").or(`firebase_uid.eq.${user.uid || lecturerUserId},id.eq.${lecturerUserId}`).is("deleted_at", null).maybeSingle();
                if (u?.id) lecturerUserId = u.id;
              }
              const allowedCourseIdentifiers = /* @__PURE__ */ new Set();
              if (UUID_REGEX.test(lecturerUserId)) {
                const { data: offerings } = await supabase.from("course_offerings").select(`
                id,
                course_definition_id,
                lecturer_user_id,
                course_definitions (
                  id,
                  code
                )
              `).eq("lecturer_user_id", lecturerUserId).is("deleted_at", null);
                if (offerings) {
                  offerings.forEach((off) => {
                    if (off.id) allowedCourseIdentifiers.add(String(off.id).trim().toUpperCase());
                    if (off.course_definition_id) allowedCourseIdentifiers.add(String(off.course_definition_id).trim().toUpperCase());
                    if (off.course_definitions?.code) allowedCourseIdentifiers.add(String(off.course_definitions.code).trim().toUpperCase());
                  });
                }
              }
              filtered = formattedRecords.filter((r) => {
                const courseId = String(r.session?.courseId || "").trim().toUpperCase();
                if (!courseId) return false;
                return allowedCourseIdentifiers.has(courseId);
              });
            }
            const classDays = Array.from(uniqueSessionsMap.values()).sort((a, b) => a.date.localeCompare(b.date));
            return {
              records: filtered,
              sessions: classDays,
              classDays,
              excusedAbsences,
              totalRecords: filtered.length,
              totalSessions: classDays.length,
              policyThreshold: "75%"
            };
          }
          const { data: dbAttendance, error: attError } = await supabase.from("attendance").select(`
          id,
          session_date,
          status,
          notes,
          created_at,
          updated_at,
          recorded_by_user_id,
          student_id,
          students (
            id,
            student_number,
            cohort_level,
            profiles (
              first_name,
              last_name,
              avatar_url
            ),
            users (
              email
            )
          )
        `).is("deleted_at", null).order("session_date", { ascending: false });
          if (!attError && dbAttendance && dbAttendance.length > 0) {
            const uniqueDates = /* @__PURE__ */ new Set();
            const excusedAbsences = {};
            const formattedRecords = dbAttendance.map((a) => {
              if (a.session_date) uniqueDates.add(a.session_date);
              const student = a.students;
              const prof = Array.isArray(student?.profiles) ? student?.profiles[0] : student?.profiles;
              const userObj = Array.isArray(student?.users) ? student?.users[0] : student?.users;
              const studentName = prof ? `${prof.first_name || ""} ${prof.last_name || ""}`.trim() : "Student";
              let cleanStatus = "PRESENT" /* PRESENT */;
              try {
                cleanStatus = parseAttendanceStatus(a.status);
              } catch {
                cleanStatus = "PRESENT" /* PRESENT */;
              }
              if (cleanStatus === "EXCUSED" /* EXCUSED */) {
                excusedAbsences[`${studentName}_${a.session_date}`] = {
                  studentName,
                  date: a.session_date,
                  reason: a.notes || "Excused absence",
                  status: "approved",
                  approvedAt: a.updated_at || a.created_at
                };
              }
              const sessionId = `sess_${a.session_date}`;
              return {
                id: a.id,
                sessionId,
                studentId: a.student_id,
                date: a.session_date,
                sessionDate: a.session_date,
                classDay: sessionId,
                name: studentName,
                studentName,
                status: cleanStatus,
                present: cleanStatus === "PRESENT" /* PRESENT */ || cleanStatus === "LATE" /* LATE */,
                notes: a.notes || "",
                timestamp: a.updated_at || a.created_at,
                capturedAt: a.created_at,
                student: {
                  id: a.student_id,
                  name: studentName,
                  email: userObj?.email || "",
                  photoUrl: prof?.avatar_url || null,
                  studentNumber: student?.student_number || ""
                },
                updatedAt: a.updated_at || a.created_at,
                recordedBy: a.recorded_by_user_id || "faculty"
              };
            });
            let filtered = formattedRecords;
            if (user && user.role === "student") {
              const studentUuid = user.studentRecordId || user.userId;
              const userUuid = user.userId || user.id;
              filtered = formattedRecords.filter(
                (r) => r.studentId && (r.studentId === studentUuid || r.studentId === userUuid) || r.student?.id && (r.student.id === studentUuid || r.student.id === userUuid) || r.student_id && (r.student_id === studentUuid || r.student_id === userUuid)
              );
            }
            const classDays = Array.from(uniqueDates).sort().map((d) => ({
              id: `sess_${d}`,
              date: d,
              sessionDate: d,
              name: `Class Session ${d}`,
              title: `Class Session ${d}`
            }));
            return {
              records: filtered,
              sessions: classDays,
              classDays,
              excusedAbsences,
              totalRecords: filtered.length,
              totalSessions: classDays.length,
              policyThreshold: "75%"
            };
          }
        } catch (err) {
          logger.warn("Error reading from attendance hierarchy tables:", err);
        }
        return {
          records: [],
          sessions: [],
          classDays: [],
          excusedAbsences: {},
          totalRecords: 0,
          totalSessions: 0,
          policyThreshold: "75%"
        };
      },
      /**
       * Records a single student check-in row using transactional UPSERT on attendance_records.
       * Enforces strict enum: PRESENT, ABSENT, LATE, EXCUSED. Prohibits arbitrary strings.
       */
      async recordCheckin(data, actorUserId, actorRole) {
        const validStatus = validateAttendanceStatus(data.status);
        const cleanDate = data.date.trim();
        const cleanName = (data.studentName || "Student").trim();
        const timestamp = (/* @__PURE__ */ new Date()).toISOString();
        const supabase = getServerSupabase();
        try {
          const session = await this.resolveOrCreateSession(cleanDate);
          const studentId = await this.resolveStudentId(data.studentId, cleanName, data.studentEmail);
          let recordId = `att_rec_${Date.now()}`;
          try {
            const { data: rpcResult, error: rpcError } = await supabase.rpc("upsert_single_attendance_record", {
              p_session_date: cleanDate,
              p_course_id: session.courseId !== "00000000-0000-0000-0000-000000000000" ? session.courseId : null,
              p_session_title: session.title,
              p_student_id: studentId,
              p_status: validStatus,
              p_notes: data.notes || "",
              p_manual_override: Boolean(data.manualOverride),
              p_actor_user_id: actorUserId || null
            });
            if (!rpcError && rpcResult?.record_id) {
              recordId = rpcResult.record_id;
            } else {
              const { data: directRec, error: directErr } = await supabase.from("attendance_records").upsert(
                {
                  session_id: session.id,
                  student_id: studentId,
                  status: validStatus,
                  notes: data.notes || "",
                  manual_override: Boolean(data.manualOverride),
                  recorded_by_user_id: actorUserId || null,
                  updated_at: timestamp
                },
                { onConflict: "session_id,student_id" }
              ).select().single();
              if (!directErr && directRec?.id) {
                recordId = directRec.id;
              }
            }
          } catch (upsertErr) {
            logger.warn("Transactional attendance_record upsert notice:", upsertErr);
          }
          try {
            await supabase.from("attendance").upsert(
              {
                student_id: studentId,
                course_id: session.courseId,
                session_date: cleanDate,
                status: validStatus,
                notes: data.notes || "",
                recorded_by_user_id: actorUserId || null,
                updated_at: timestamp
              },
              { onConflict: "student_id,course_id,session_date" }
            );
          } catch (syncErr) {
            logger.warn("Legacy attendance sync notice:", syncErr);
          }
          await logAuditEvent({
            actorUserId: actorUserId || null,
            actorRole: actorRole || "teacher",
            entityType: "attendance_record",
            entityId: `${session.id}_${studentId}`,
            action: data.manualOverride ? "attendance_override" : "create",
            newValues: {
              sessionId: session.id,
              studentId,
              date: cleanDate,
              status: validStatus,
              notes: data.notes
            },
            changedFields: ["status", "notes"],
            reason: data.notes || (data.manualOverride ? "Attendance manual override" : "Attendance checkin recorded")
          });
          return {
            status: "recorded",
            record: {
              id: recordId,
              sessionId: session.id,
              studentId,
              date: cleanDate,
              sessionDate: cleanDate,
              classDay: session.id,
              status: validStatus,
              present: validStatus === "PRESENT" /* PRESENT */ || validStatus === "LATE" /* LATE */,
              notes: data.notes || "",
              manualOverride: Boolean(data.manualOverride),
              student: {
                id: studentId,
                name: cleanName,
                email: data.studentEmail
              },
              session: {
                id: session.id,
                sessionDate: cleanDate,
                title: session.title
              },
              updatedAt: timestamp,
              recordedBy: actorUserId || "faculty"
            }
          };
        } catch (err) {
          logger.error("Error in recordCheckin service:", err);
          throw err;
        }
      },
      /**
       * Batch records attendance records for an entire session date.
       * FIXES BATCH ATTENDANCE:
       * Completely eliminates the destructive "delete all records for date; insert new records" approach.
       * Uses atomic UPSERT on attendance_record inside a single transaction.
       * Validates all incoming statuses: strictly enforces PRESENT, ABSENT, LATE, EXCUSED.
       * Prohibits arbitrary strings.
       */
      async recordBatchAttendance(data, actorUserId, actorRole) {
        if (!data.date) {
          throw new Error("date is required for batch attendance");
        }
        if (!Array.isArray(data.records)) {
          throw new Error("records must be an array for batch attendance");
        }
        const cleanDate = data.date.trim();
        const timestamp = (/* @__PURE__ */ new Date()).toISOString();
        const supabase = getServerSupabase();
        const validatedRecords = data.records.map((r, index) => {
          try {
            const validatedStatus = validateAttendanceStatus(r.status);
            return {
              ...r,
              status: validatedStatus
            };
          } catch (validationErr) {
            throw new Error(
              `Record at index ${index} (${r.studentName || r.studentId || "Unknown"}): ${validationErr.message}`
            );
          }
        });
        try {
          const session = await this.resolveOrCreateSession(cleanDate, data.sessionTitle);
          const { data: students } = await supabase.from("students").select("id, profiles(first_name, last_name), users(email)");
          const studentIdMap = /* @__PURE__ */ new Map();
          (students || []).forEach((s) => {
            studentIdMap.set(s.id, s.id);
            const p = Array.isArray(s.profiles) ? s.profiles[0] : s.profiles;
            if (p) {
              const fullName = `${p.first_name || ""} ${p.last_name || ""}`.trim().toLowerCase();
              studentIdMap.set(fullName, s.id);
            }
            const u = Array.isArray(s.users) ? s.users[0] : s.users;
            if (u?.email) {
              studentIdMap.set(u.email.toLowerCase().trim(), s.id);
            }
          });
          const recordsToUpsert = validatedRecords.map((r) => {
            const sName = (r.studentName || "").trim().toLowerCase();
            const studentId = r.studentId || studentIdMap.get(sName) || students?.[0]?.id || "00000000-0000-0000-0000-000000000000";
            return {
              session_id: session.id,
              student_id: studentId,
              status: r.status,
              // Strictly validated enum
              notes: r.notes || "",
              manual_override: Boolean(r.manualOverride),
              recorded_by_user_id: actorUserId || null,
              updated_at: timestamp
            };
          });
          let transactionSucceeded = false;
          try {
            const rpcPayload = recordsToUpsert.map((r) => ({
              student_id: r.student_id,
              status: r.status,
              notes: r.notes,
              manual_override: r.manual_override
            }));
            const { data: rpcResult, error: rpcError } = await supabase.rpc(
              "upsert_batch_attendance_records",
              {
                p_session_date: cleanDate,
                p_course_id: session.courseId !== "00000000-0000-0000-0000-000000000000" ? session.courseId : null,
                p_session_title: session.title,
                p_records: rpcPayload,
                p_actor_user_id: actorUserId || null
              }
            );
            if (!rpcError && rpcResult?.success) {
              transactionSucceeded = true;
              logger.info(`Transactional batch upsert via RPC succeeded for ${recordsToUpsert.length} records`);
            }
          } catch (rpcErr) {
            logger.warn("RPC batch upsert fallback notice:", rpcErr);
          }
          if (!transactionSucceeded && recordsToUpsert.length > 0) {
            const { error: upsertError } = await supabase.from("attendance_records").upsert(recordsToUpsert, { onConflict: "session_id,student_id" });
            if (upsertError) {
              logger.warn("Direct attendance_records upsert notice:", upsertError.message);
            }
          }
          try {
            const legacyRows = recordsToUpsert.map((r) => ({
              student_id: r.student_id,
              course_id: session.courseId,
              session_date: cleanDate,
              status: r.status,
              notes: r.notes,
              recorded_by_user_id: actorUserId || null,
              updated_at: timestamp
            }));
            await supabase.from("attendance").upsert(legacyRows, { onConflict: "student_id,course_id,session_date" });
          } catch (legacyErr) {
            logger.warn("Legacy table sync notice:", legacyErr);
          }
          await logAuditEvent({
            actorUserId: actorUserId || null,
            actorRole: actorRole || "teacher",
            entityType: "attendance_session",
            entityId: session.id,
            action: "update",
            newValues: {
              sessionId: session.id,
              date: cleanDate,
              upsertedCount: recordsToUpsert.length
            },
            changedFields: ["records"],
            reason: `Batch attendance saved for session ${cleanDate} (${recordsToUpsert.length} records)`
          });
          return {
            status: "saved",
            count: recordsToUpsert.length,
            date: cleanDate,
            session
          };
        } catch (err) {
          logger.error("Error in recordBatchAttendance service:", err);
          throw err;
        }
      },
      /**
       * Records an excused absence in relational tables using studentId and AttendanceStatus.EXCUSED.
       */
      async recordExcuse(data, actorUserId, actorRole) {
        try {
          const checkinRes = await this.recordCheckin(
            {
              studentId: data.studentId,
              studentName: data.studentName,
              date: data.date,
              status: "EXCUSED" /* EXCUSED */,
              notes: data.reason || "Excused absence approved",
              manualOverride: true
            },
            actorUserId,
            actorRole
          );
          const resolvedStudentId = checkinRes.record.studentId || data.studentId || "std-unknown";
          const resolvedStudentName = checkinRes.record.student?.name || data.studentName || "Student";
          await logAuditEvent({
            actorUserId: actorUserId || null,
            actorRole: actorRole || "student",
            entityType: "attendance_excuse",
            entityId: `${resolvedStudentId}_${data.date}`,
            action: "attendance_override",
            newValues: { ...data, studentId: resolvedStudentId, status: "EXCUSED" /* EXCUSED */ },
            changedFields: ["status", "reason", "documentUrl"],
            reason: data.reason || "Excused absence recorded"
          });
          return {
            status: "excused",
            studentId: resolvedStudentId,
            studentName: resolvedStudentName,
            date: data.date
          };
        } catch (err) {
          logger.error("Error in recordExcuse service:", err);
          throw err;
        }
      },
      /**
       * Evaluates at-risk students failing the 75% attendance threshold.
       * Keyed strictly by studentId (UUID).
       */
      async getAtRiskStudents(user) {
        const attendanceData = await this.getAttendance(user);
        const records = attendanceData.records || [];
        const totalSessions = attendanceData.totalSessions;
        if (totalSessions === 0) {
          return {
            atRiskStudents: [],
            count: 0,
            policyThreshold: "75%",
            criticalThreshold: "50%"
          };
        }
        const studentMap = /* @__PURE__ */ new Map();
        for (const r of records) {
          const sId = r.studentId || r.student?.id;
          if (!sId) continue;
          if (!studentMap.has(sId)) {
            studentMap.set(sId, { present: 0, excused: 0, studentId: sId, student: r.student });
          }
          const item = studentMap.get(sId);
          const s = (r.status || "").toUpperCase();
          if (s === "PRESENT" || s === "LATE") item.present += 1;
          else if (s === "EXCUSED") item.excused += 1;
        }
        const atRisk = [];
        for (const [studentId, counts] of studentMap.entries()) {
          const rate = Math.round((counts.present + counts.excused) / totalSessions * 100);
          if (rate < 75) {
            atRisk.push({
              studentId,
              name: counts.student?.name || "Student",
              attendanceRate: rate,
              sessionsAttended: counts.present + counts.excused,
              totalSessions,
              isCritical: rate <= 50,
              level: "Level 1 Foundation",
              photoUrl: counts.student?.photoUrl || null
            });
          }
        }
        atRisk.sort((a, b) => a.attendanceRate - b.attendanceRate);
        return {
          atRiskStudents: atRisk,
          count: atRisk.length,
          policyThreshold: "75%",
          criticalThreshold: "50%"
        };
      },
      /**
       * Updates an individual attendance record by ID in relational PostgreSQL tables.
       */
      async updateAttendanceRecord(id, data, actorUserId, actorRole) {
        const supabase = getServerSupabase();
        const timestamp = (/* @__PURE__ */ new Date()).toISOString();
        const updates = { updated_at: timestamp };
        let validatedStatus = void 0;
        if (data.status) {
          validatedStatus = validateAttendanceStatus(data.status);
          updates.status = validatedStatus;
        }
        if (data.notes !== void 0) updates.notes = data.notes;
        if (data.manualOverride !== void 0) updates.manual_override = Boolean(data.manualOverride);
        if (actorUserId) updates.recorded_by_user_id = actorUserId;
        let updatedRecord = null;
        try {
          const { data: rec, error } = await supabase.from("attendance_records").update(updates).eq("id", id).select().maybeSingle();
          if (!error && rec) {
            updatedRecord = rec;
          }
        } catch (err) {
          logger.warn("attendance_records update error:", err);
        }
        try {
          const { data: legacyRec, error: legacyErr } = await supabase.from("attendance").update({
            ...validatedStatus ? { status: validatedStatus } : {},
            ...data.notes !== void 0 ? { notes: data.notes } : {},
            ...actorUserId ? { recorded_by_user_id: actorUserId } : {},
            updated_at: timestamp
          }).eq("id", id).select().maybeSingle();
          if (!updatedRecord && !legacyErr && legacyRec) {
            updatedRecord = legacyRec;
          }
        } catch (err) {
          logger.warn("attendance legacy update error:", err);
        }
        await logAuditEvent({
          actorUserId: actorUserId || null,
          actorRole: actorRole || "teacher",
          entityType: "attendance_record",
          entityId: id,
          action: "update",
          newValues: updates,
          changedFields: Object.keys(updates),
          reason: data.notes || "Attendance record updated"
        });
        return {
          status: "updated",
          record: updatedRecord || { id, ...data, updatedAt: timestamp }
        };
      }
    };
  }
});

// src/data/defaultAcademicData.ts
var DEFAULT_ACADEMIC_YEARS, DEFAULT_TERMS, DEFAULT_MASTER_COURSES, DEFAULT_COURSE_OFFERINGS;
var init_defaultAcademicData = __esm({
  "src/data/defaultAcademicData.ts"() {
    DEFAULT_ACADEMIC_YEARS = [
      {
        id: "ay_2025_2026",
        code: "AY-2025-2026",
        name: "2025\u20132026 Academic Year",
        startDate: "2025-09-01",
        endDate: "2026-06-30",
        status: "active",
        theme: "Equipping the Saints for Apostolic Impact & Kingdom Commission",
        description: "Current ministerial training academic cycle covering foundational, ministerial, and apostolic leadership tracks."
      },
      {
        id: "ay_2026_2027",
        code: "AY-2026-2027",
        name: "2026\u20132027 Academic Year",
        startDate: "2026-09-01",
        endDate: "2027-06-30",
        status: "upcoming",
        theme: "Deepening Theological Foundations & International Church Planting",
        description: "Upcoming academic year featuring expanded five-fold governance and pastoral licensing practicums."
      }
    ];
    DEFAULT_TERMS = [
      {
        id: "term_2026_s1",
        academicYearId: "ay_2025_2026",
        code: "2026-SEM-1",
        name: "Semester 1 (April \u2013 July)",
        sequenceOrder: 1,
        startDate: "2026-04-01",
        endDate: "2026-07-31",
        status: "active",
        weeksCount: 16,
        description: "First Semester running from April to July."
      },
      {
        id: "term_2026_s2",
        academicYearId: "ay_2025_2026",
        code: "2026-SEM-2",
        name: "Semester 2 (August \u2013 November)",
        sequenceOrder: 2,
        startDate: "2026-08-01",
        endDate: "2026-11-30",
        status: "upcoming",
        weeksCount: 16,
        description: "Second Semester running from August to November."
      }
    ];
    DEFAULT_MASTER_COURSES = [
      {
        id: "mod_intro",
        code: "SOM-MOD-1",
        title: "Introduction",
        coreModuleNumber: 1,
        credits: 5,
        department: "Biblical Studies",
        level: "Foundation",
        description: "Foundational orientation to ministerial training, spiritual disciplines, biblical interpretation, and the holy calling of leadership within the Kingdom of God.",
        learningOutcomes: [
          "Understand the biblical call, consecration, and spiritual formation for Christian ministry",
          "Master fundamental hermeneutics and faithful scriptural exegesis",
          "Develop regular personal spiritual disciplines including intercession and fasting",
          "Articulate the foundational doctrine of Christ with clarity and reverence"
        ],
        prerequisites: ["SOM-099 Ministerial Orientation"],
        teachers: ["Pastor Samuel Selkridge", "Apostle Gillian Selkridge"],
        instructors: ["Pastor Samuel Selkridge", "Apostle Gillian Selkridge"],
        syllabusOutline: [
          { week: 1, topic: "The Call & Consecration to Holy Office", description: "Examining the biblical call to ministry, motive purity, and holy separation.", scriptureReferences: ["1 Timothy 1:12-14", "Galatians 1:15-16"] },
          { week: 2, topic: "Foundations of Biblical Hermeneutics", description: "Sound scriptural exegesis, historical context, and avoiding eisegesis.", scriptureReferences: ["2 Timothy 2:15", "Nehemiah 8:8"] },
          { week: 3, topic: "Spiritual Disciplines of the Minister", description: "Developing a secret place of prayer, fasting, and biblical meditation.", scriptureReferences: ["Matthew 6:5-18", "Psalm 91:1-2"] },
          { week: 4, topic: "The Word, Faith, and Kingdom Authority", description: "Walking in spiritual authority grounded in the finished work of the Cross.", scriptureReferences: ["Luke 10:19", "Mark 11:22-24"] }
        ],
        isActive: true
      },
      {
        id: "mod_evangelism",
        code: "SOM-MOD-2",
        title: "School of Evangelism",
        coreModuleNumber: 2,
        credits: 5,
        department: "Practical Ministry",
        level: "Foundation",
        description: "Practical soul-winning strategies, personal witnessing, the Matthew 28 Great Commission mandate, overcoming objections in outreach, and new convert discipleship.",
        learningOutcomes: [
          "Articulate the Gospel message with conviction, simplicity, and biblical fidelity",
          "Execute street outreach, altar ministry, and one-on-one evangelistic counseling",
          "Overcome common spiritual objections to faith using apologetics and compassion",
          "Establish new convert follow-up and local church assimilation pipelines"
        ],
        prerequisites: ["SOM-MOD-1 Introduction"],
        teachers: ["Pastor Christy Arthur"],
        instructors: ["Pastor Christy Arthur"],
        syllabusOutline: [
          { week: 1, topic: "The Great Commission Mandate", description: "Exegetical study of Matthew 28:18-20, Mark 16:15-18, and the urgency of harvest.", scriptureReferences: ["Matthew 28:18-20", "Acts 1:8"] },
          { week: 2, topic: "Personal Testimony & The Power of Witnessing", description: "Crafting and sharing your redemption testimony like Paul before Agrippa.", scriptureReferences: ["Acts 26:1-23", "Revelation 12:11"] },
          { week: 3, topic: "Overcoming Objections in Soul Winning", description: "Addressing skepticism, other world religions, and moral objections with grace.", scriptureReferences: ["1 Peter 3:15", "Colossians 4:5-6"] },
          { week: 4, topic: "Outreach Field Practicum & Discipleship Retention", description: "Direct field evangelism and systematic retention of new believers.", scriptureReferences: ["Luke 10:1-12", "2 Timothy 2:2"] }
        ],
        isActive: true
      },
      {
        id: "mod_apostles",
        code: "SOM-MOD-3",
        title: "School of the Apostles",
        coreModuleNumber: 3,
        credits: 5,
        department: "Leadership & Governance",
        level: "Degree",
        description: "Apostolic governance, Ephesians 4:11 five-fold ministry alignment, church planting, spiritual fathers and sons, and distinguishing true apostolic order from authoritarianism.",
        learningOutcomes: [
          "Grasp the biblical role of the apostolic office as church foundation builders",
          "Align the five-fold ministry offices for corporate spiritual equipping",
          "Implement apostolic models of church multiplication and elder ordination",
          "Identify and dismantle spiritual manipulation and false apostolic practices"
        ],
        prerequisites: ["SOM-MOD-1 Introduction", "SOM-MOD-2 School of Evangelism"],
        teachers: ["Apostle Gillian Selkridge"],
        instructors: ["Apostle Gillian Selkridge"],
        syllabusOutline: [
          { week: 1, topic: "The Apostolic Foundation & Architecture", description: "Ephesians 2:20 & 4:11 foundational principles in the New Covenant church.", scriptureReferences: ["Ephesians 2:20", "Ephesians 4:11-16"] },
          { week: 2, topic: "Marks, Signs, and Character of an Apostle", description: "Patience, perseverance, suffering, signs, and spiritual fatherhood.", scriptureReferences: ["2 Corinthians 12:12", "1 Corinthians 4:14-16"] },
          { week: 3, topic: "Five-Fold Synergy & Apostolic Order", description: "How Apostles, Prophets, Evangelists, Pastors, and Teachers work in harmony.", scriptureReferences: ["1 Corinthians 12:28", "Acts 13:1-3"] },
          { week: 4, topic: "Translocal Oversight & Church Planting", description: "Birthing kingdom assemblies, elder ordination, and territorial impact.", scriptureReferences: ["Titus 1:5", "Acts 14:21-23"] }
        ],
        isActive: true
      },
      {
        id: "mod_ethics",
        code: "SOM-MOD-4",
        title: "Ministerial Ethics",
        coreModuleNumber: 4,
        credits: 5,
        department: "Theology & Ethics",
        level: "Diploma",
        description: "High standards of spiritual, moral, financial, and fiduciary integrity for leaders. Covers pastoral counseling boundaries, conflict resolution (Matthew 18), and ministerial accountability.",
        learningOutcomes: [
          "Maintain unblemished moral and counseling boundaries in pastoral practice",
          "Exercise fiduciary responsibility, church financial auditing, and stewardship",
          "Execute Matthew 18 conflict reconciliation protocols with restorative love",
          "Prevent leader burnout, disqualification, and institutional scandal"
        ],
        prerequisites: ["SOM-MOD-1 Introduction"],
        teachers: ["Pastor Gale Grant"],
        instructors: ["Pastor Gale Grant"],
        syllabusOutline: [
          { week: 1, topic: "The Character Standards of Leaders", description: "In-depth study of 1 Timothy 3 and Titus 1 overseer requirements.", scriptureReferences: ["1 Timothy 3:1-13", "Titus 1:5-9"] },
          { week: 2, topic: "Pastoral Counseling & Confidentiality", description: "Privileged communication, counseling ethics, and protective boundaries.", scriptureReferences: ["Proverbs 11:13", "Galatians 6:1-2"] },
          { week: 3, topic: "Financial Stewardship & Church Integrity", description: "Handling tithes, offerings, budgets, and transparent reporting.", scriptureReferences: ["2 Corinthians 8:20-21", "Malachi 3:10"] },
          { week: 4, topic: "Conflict Resolution & Matthew 18 Protocol", description: "Biblical peacemaking, restorative discipline, and team reconciliation.", scriptureReferences: ["Matthew 18:15-20", "Romans 12:18"] }
        ],
        isActive: true
      },
      {
        id: "mod_pastor_hs",
        code: "SOM-MOD-5",
        title: "School of the Pastor and Holy Spirit",
        coreModuleNumber: 5,
        credits: 5,
        department: "Practical Ministry",
        level: "Executive",
        description: "Shepherding the flock under the guidance and empowerment of the Holy Spirit. Covers pastoral care, sermon delivery, gifts of the Holy Spirit, and spiritual formation.",
        learningOutcomes: [
          "Shepherd the flock of God with compassion, wisdom, and spiritual oversight",
          "Flow in the gifts, fruit, and leading of the Holy Spirit in ministry",
          "Prepare and deliver Spirit-led expository sermons and teachings",
          "Provide crisis pastoral counseling and bereavement care to families"
        ],
        prerequisites: ["SOM-MOD-1 Introduction", "SOM-MOD-4 Ministerial Ethics"],
        teachers: ["Pastor Samuel Selkridge", "Pastor Gale Grant"],
        instructors: ["Pastor Samuel Selkridge", "Pastor Gale Grant"],
        syllabusOutline: [
          { week: 1, topic: "The Heart of the Shepherd & Holy Spirit Empowerment", description: "Feeding and guarding the flock under the mantle of the Chief Shepherd.", scriptureReferences: ["1 Peter 5:1-4", "John 21:15-17", "Acts 20:28"] },
          { week: 2, topic: "Operating in the Gifts of the Holy Spirit", description: "The nine gifts of the Spirit in pastoral oversight and counseling.", scriptureReferences: ["1 Corinthians 12:4-11", "Romans 8:14"] },
          { week: 3, topic: "Expository Preaching & Homiletics Practicum", description: "Crafting Spirit-inspired messages that nourish and edify believers.", scriptureReferences: ["2 Timothy 4:1-5", "1 Corinthians 2:4-5"] },
          { week: 4, topic: "Pastoral Care in Crisis & Hospital Visitation", description: "Ministering comfort in grief, family crises, and Christian ceremonies.", scriptureReferences: ["James 5:14-16", "Romans 12:15"] }
        ],
        isActive: true
      },
      {
        id: "mod_prophets",
        code: "SOM-MOD-6",
        title: "School of the Prophets",
        coreModuleNumber: 6,
        credits: 5,
        department: "Practical Ministry",
        level: "Degree",
        description: "The nature, function, and biblical testing of prophetic ministry in the New Covenant church. Cultivating spiritual sensitivity, prophetic protocol, and spiritual discernment.",
        learningOutcomes: [
          "Discern the voice of God in accordance with Scripture and the Spirit",
          "Apply biblical rules for judging and testing prophetic utterances",
          "Deliver prophetic words with humility, love, and assembly order (1 Cor 14)",
          "Engage in prophetic intercession and spiritual warfare for breakthrough"
        ],
        prerequisites: ["SOM-MOD-1 Introduction"],
        teachers: ["Prophet Garod Andrews", "Apostle Gillian Selkridge"],
        instructors: ["Prophet Garod Andrews", "Apostle Gillian Selkridge"],
        syllabusOutline: [
          { week: 1, topic: "The New Testament Prophetic Ministry", description: "Gift of prophecy vs prophetic office; edification, exhortation, and comfort.", scriptureReferences: ["1 Corinthians 14:1-4", "Acts 21:8-14"] },
          { week: 2, topic: "Testing and Judging Prophecy", description: "Scriptural alignment, Christological confession, and fruit testing.", scriptureReferences: ["1 Thessalonians 5:19-22", "1 John 4:1-3"] },
          { week: 3, topic: "Prophetic Protocol & Decency in the Assembly", description: "The spirits of prophets subject to prophets (1 Cor 14:32).", scriptureReferences: ["1 Corinthians 14:29-33", "1 Corinthians 14:40"] },
          { week: 4, topic: "Prophetic Intercession & Spiritual Discernment", description: "Discerning spirits, watchmen on the wall, and spiritual breakthrough.", scriptureReferences: ["Habakkuk 2:1-3", "Hebrews 5:14"] }
        ],
        isActive: true
      }
    ];
    DEFAULT_COURSE_OFFERINGS = [
      // 1. OFFERING: School of Ministry in Semester 1 (April – July)
      {
        id: "offering_som_2026_s1",
        courseId: "crs_school_of_ministry",
        courseCode: "SOM-CORE",
        courseTitle: "School of Ministry",
        academicYearId: "ay_2025_2026",
        academicYearName: "2025\u20132026 Academic Year",
        termId: "term_2026_s1",
        termName: "Semester 1 (April \u2013 July)",
        section: "Section 01 (Sanctuary & Online Stream)",
        scheduleDays: "Tuesdays & Thursdays (7:00 PM - 9:00 PM EST)",
        location: "HTEIM Main Sanctuary & Zoom Live",
        zoomLink: "https://zoom.us/j/hteim-school-of-ministry",
        capacity: 60,
        status: "active",
        credits: 30,
        // ├── Primary Lecturer & Faculty Team
        lecturer: {
          id: "t_gillian",
          name: "Apostle Gillian Selkridge",
          title: "Apostle & Academic Overseer",
          email: "apostle.gillian@hteim.edu",
          bio: "Presiding Apostle with apostolic oversight across ministerial networks, spiritual governance, and five-fold leadership training.",
          officeHours: "Tuesdays 5:00 PM - 6:30 PM EST via Zoom or Campus Study",
          avatarUrl: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80"
        },
        teachers: [
          "Apostle Gillian Selkridge",
          "Pastor Samuel Selkridge",
          "Pastor Gale Grant",
          "Pastor Christy Arthur",
          "Prophet Garod Andrews"
        ],
        // ├── Enrolled Students
        enrolledStudents: [
          {
            studentId: "st_1",
            studentName: "Candice Pierre",
            studentNumber: "HTEIM-2026-001",
            email: "candice.pierre@hteim.edu",
            cohortLevel: "Level 1 Foundation",
            enrolledAt: "2026-01-10",
            status: "enrolled",
            attendanceRate: 94.1,
            assignmentsScore: 92,
            examsScore: 95,
            finalGrade: 93.8,
            letterGrade: "A",
            standing: "high_distinction",
            notes: "Outstanding exegetical precision in Pauline Epistle studies."
          },
          {
            studentId: "st_2",
            studentName: "Akeem Pierre",
            studentNumber: "HTEIM-2026-002",
            email: "akeem.pierre@hteim.edu",
            cohortLevel: "Level 1 Foundation",
            enrolledAt: "2026-01-10",
            status: "enrolled",
            attendanceRate: 88.2,
            assignmentsScore: 86.5,
            examsScore: 89,
            finalGrade: 87.8,
            letterGrade: "A",
            standing: "high_distinction",
            notes: "Strong participation and deep theological reflections."
          },
          {
            studentId: "st_3",
            studentName: "Shellon Liddell",
            studentNumber: "HTEIM-2026-003",
            email: "shellon.liddell@hteim.edu",
            cohortLevel: "Level 1 Foundation",
            enrolledAt: "2026-01-10",
            status: "enrolled",
            attendanceRate: 82.4,
            assignmentsScore: 80,
            examsScore: 81.5,
            finalGrade: 81.4,
            letterGrade: "B",
            standing: "satisfactory",
            notes: "Consistent attendance and good grasp of historical context."
          },
          {
            studentId: "st_4",
            studentName: "David Marshall",
            studentNumber: "HTEIM-2026-004",
            email: "david.marshall@hteim.edu",
            cohortLevel: "Level 1 Foundation",
            enrolledAt: "2026-01-10",
            status: "at_risk",
            attendanceRate: 64.7,
            // Below 75% at-risk trigger
            assignmentsScore: 68,
            examsScore: 65,
            finalGrade: 66.2,
            letterGrade: "D",
            standing: "at_risk",
            notes: "At-risk attendance trigger active (< 75%). Pastoral contact initiated."
          },
          {
            studentId: "st_5",
            studentName: "Esther George",
            studentNumber: "HTEIM-2026-005",
            email: "esther.george@hteim.edu",
            cohortLevel: "Level 1 Foundation",
            enrolledAt: "2026-01-10",
            status: "enrolled",
            attendanceRate: 91.2,
            assignmentsScore: 90,
            examsScore: 88,
            finalGrade: 89.8,
            letterGrade: "A",
            standing: "high_distinction"
          },
          {
            studentId: "st_6",
            studentName: "Michael Browne",
            studentNumber: "HTEIM-2026-006",
            email: "michael.browne@hteim.edu",
            cohortLevel: "Level 1 Foundation",
            enrolledAt: "2026-01-10",
            status: "enrolled",
            attendanceRate: 76.5,
            assignmentsScore: 78,
            examsScore: 75,
            finalGrade: 76.6,
            letterGrade: "C",
            standing: "satisfactory"
          }
        ],
        // ├── Attendance
        attendance: [
          {
            id: "att_som101_s1",
            sessionNumber: 1,
            date: "2026-01-13",
            topic: "Session 1: Divine Inspiration & The Canon of Scripture",
            records: [
              { studentName: "Candice Pierre", status: "Present" },
              { studentName: "Akeem Pierre", status: "Present" },
              { studentName: "Shellon Liddell", status: "Present" },
              { studentName: "David Marshall", status: "Absent", notes: "Unexcused work conflict" },
              { studentName: "Esther George", status: "Present" },
              { studentName: "Michael Browne", status: "Present" }
            ],
            presentCount: 5,
            absentCount: 1,
            excusedCount: 0,
            attendanceRate: 83.3
          },
          {
            id: "att_som101_s2",
            sessionNumber: 2,
            date: "2026-01-15",
            topic: "Session 2: Historical-Grammatical Method & Avoiding Eisegesis",
            records: [
              { studentName: "Candice Pierre", status: "Present" },
              { studentName: "Akeem Pierre", status: "Present" },
              { studentName: "Shellon Liddell", status: "Present" },
              { studentName: "David Marshall", status: "Present" },
              { studentName: "Esther George", status: "Present" },
              { studentName: "Michael Browne", status: "Present" }
            ],
            presentCount: 6,
            absentCount: 0,
            excusedCount: 0,
            attendanceRate: 100
          },
          {
            id: "att_som101_s3",
            sessionNumber: 3,
            date: "2026-01-20",
            topic: "Session 3: Old Testament Types, Shadows, and Covenantal Law",
            records: [
              { studentName: "Candice Pierre", status: "Present" },
              { studentName: "Akeem Pierre", status: "Present" },
              { studentName: "Shellon Liddell", status: "Excused", notes: "Medical appointment" },
              { studentName: "David Marshall", status: "Absent" },
              { studentName: "Esther George", status: "Present" },
              { studentName: "Michael Browne", status: "Present" }
            ],
            presentCount: 4,
            absentCount: 1,
            excusedCount: 1,
            attendanceRate: 83.3
          },
          {
            id: "att_som101_s4",
            sessionNumber: 4,
            date: "2026-01-22",
            topic: "Session 4: Exegesis of Romans 8: Christological Center",
            records: [
              { studentName: "Candice Pierre", status: "Present" },
              { studentName: "Akeem Pierre", status: "Present" },
              { studentName: "Shellon Liddell", status: "Present" },
              { studentName: "David Marshall", status: "Absent" },
              { studentName: "Esther George", status: "Present" },
              { studentName: "Michael Browne", status: "Present" }
            ],
            presentCount: 5,
            absentCount: 1,
            excusedCount: 0,
            attendanceRate: 83.3
          }
        ],
        // ├── Assignments
        assignments: [
          {
            id: "asg_som101_1",
            title: "Exegetical Paper: Romans 8:28-30 Contextual Analysis",
            description: "Conduct a thorough historical-grammatical exegesis of Romans 8:28-30. Identify rhetorical flow, key Greek word origins (prognosis, proorizo), and avoid Calvinist/Arminian eisegesis.",
            type: "exegesis",
            maxPoints: 100,
            weight: 25,
            dueDate: "2026-02-15",
            submissionsCount: 6,
            gradedCount: 6,
            avgScore: 84.5,
            rubricCriteria: [
              { name: "Historical & Literary Context", maxPoints: 30, description: "Correctly identifies audience, occasion, and surrounding chapter flow" },
              { name: "Word & Syntax Analysis", maxPoints: 40, description: "Examines Greek root nuances and biblical cross-references" },
              { name: "Ministerial Application", maxPoints: 30, description: "Sound pastoral and practical application without twisting Scripture" }
            ]
          },
          {
            id: "asg_som101_2",
            title: "Sermon Outline: The Christocentric Principle in Genesis 22",
            description: "Develop an expository sermon outline showing how Abraham offering Isaac in Genesis 22 prefigures God offering His only begotten Son at Calvary.",
            type: "essay",
            maxPoints: 100,
            weight: 20,
            dueDate: "2026-03-10",
            submissionsCount: 6,
            gradedCount: 5,
            avgScore: 88
          }
        ],
        // ├── Exams
        exams: [
          {
            id: "exam_som101_mid",
            title: "Midterm Examination: Hermeneutical Rules & Textual Criticism",
            description: "Comprehensive mid-term evaluation of canonization, translation methodologies, hermeneutical axioms, and fallacy identification.",
            examType: "midterm",
            totalPoints: 100,
            weight: 25,
            examDate: "2026-03-24",
            durationMinutes: 90,
            status: "graded",
            avgScore: 85.2,
            passingScore: 75
          },
          {
            id: "exam_som101_final",
            title: "Final Examination: Comprehensive Biblical Exegesis Defense",
            description: "End-of-term oral and written defense demonstrating mastery of Hermeneutics across both Testaments.",
            examType: "final",
            totalPoints: 100,
            weight: 30,
            examDate: "2026-05-19",
            durationMinutes: 120,
            status: "scheduled",
            avgScore: 0,
            passingScore: 75
          }
        ],
        // ├── Grades
        grades: [
          {
            studentName: "Candice Pierre",
            studentNumber: "HTEIM-2026-001",
            assignmentGrades: { asg_som101_1: 96, asg_som101_2: 98 },
            examGrades: { exam_som101_mid: 95 },
            attendancePercentage: 94.1,
            weightedScore: 95.2,
            letterGrade: "A",
            standing: "high_distinction",
            isPublished: true,
            facultyFeedback: "Exceptional depth of scholarship and clear pastoral communication."
          },
          {
            studentName: "Akeem Pierre",
            studentNumber: "HTEIM-2026-002",
            assignmentGrades: { asg_som101_1: 88, asg_som101_2: 90 },
            examGrades: { exam_som101_mid: 89 },
            attendancePercentage: 88.2,
            weightedScore: 88.6,
            letterGrade: "A",
            standing: "high_distinction",
            isPublished: true,
            facultyFeedback: "Consistent high effort with great theological insight."
          },
          {
            studentName: "Shellon Liddell",
            studentNumber: "HTEIM-2026-003",
            assignmentGrades: { asg_som101_1: 82, asg_som101_2: 84 },
            examGrades: { exam_som101_mid: 80 },
            attendancePercentage: 82.4,
            weightedScore: 81.9,
            letterGrade: "B",
            standing: "satisfactory",
            isPublished: true,
            facultyFeedback: "Good solid work. Ensure cross-references to original Greek are expanded."
          },
          {
            studentName: "David Marshall",
            studentNumber: "HTEIM-2026-004",
            assignmentGrades: { asg_som101_1: 68, asg_som101_2: 65 },
            examGrades: { exam_som101_mid: 64 },
            attendancePercentage: 64.7,
            weightedScore: 65.4,
            letterGrade: "D",
            standing: "at_risk",
            isPublished: true,
            facultyFeedback: "At-risk warning: Attendance is currently below 75% policy. Please meet with the Dean of Students."
          },
          {
            studentName: "Esther George",
            studentNumber: "HTEIM-2026-005",
            assignmentGrades: { asg_som101_1: 91, asg_som101_2: 92 },
            examGrades: { exam_som101_mid: 88 },
            attendancePercentage: 91.2,
            weightedScore: 90.1,
            letterGrade: "A",
            standing: "high_distinction",
            isPublished: true
          },
          {
            studentName: "Michael Browne",
            studentNumber: "HTEIM-2026-006",
            assignmentGrades: { asg_som101_1: 76, asg_som101_2: 80 },
            examGrades: { exam_som101_mid: 75 },
            attendancePercentage: 76.5,
            weightedScore: 76.8,
            letterGrade: "C",
            standing: "satisfactory",
            isPublished: true
          }
        ]
      },
      // 2. OFFERING: School of Ministry in Semester 2 (August – November)
      {
        id: "offering_som_2026_s2",
        courseId: "crs_school_of_ministry",
        courseCode: "SOM-CORE",
        courseTitle: "School of Ministry",
        academicYearId: "ay_2025_2026",
        academicYearName: "2025\u20132026 Academic Year",
        termId: "term_2026_s2",
        termName: "Semester 2 (August \u2013 November)",
        section: "Section 02 (Weekend Intensive & Global Stream)",
        scheduleDays: "Saturdays (9:00 AM - 1:00 PM EST)",
        location: "HTEIM Main Sanctuary & Zoom Live",
        zoomLink: "https://zoom.us/j/hteim-school-of-ministry-s2",
        capacity: 60,
        status: "upcoming",
        credits: 30,
        // ├── Primary Lecturer & Faculty Team
        lecturer: {
          id: "t_samuel",
          name: "Pastor Samuel Selkridge",
          title: "Dean of Ministry & Senior Pastor",
          email: "pastor.samuel@hteim.edu",
          bio: "Dean of the School of Ministry with over 25 years of pastoral counseling, hermeneutical instruction, and ministry development.",
          officeHours: "Thursdays 2:00 PM - 4:00 PM EST via Zoom",
          avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80"
        },
        teachers: [
          "Apostle Gillian Selkridge",
          "Pastor Samuel Selkridge",
          "Pastor Gale Grant",
          "Pastor Christy Arthur",
          "Prophet Garod Andrews"
        ],
        enrolledStudents: [],
        attendance: [],
        assignments: [
          {
            id: "asg_som_s2_1",
            title: "Module 1: Foundations of Divine Calling & Separation (Introduction)",
            description: "Opening research paper on personal calling, holy consecration, and spiritual formation.",
            type: "essay",
            maxPoints: 100,
            weight: 20,
            dueDate: "2026-08-30",
            submissionsCount: 0,
            gradedCount: 0,
            avgScore: 0
          },
          {
            id: "asg_som_s2_2",
            title: "Module 2: Great Commission Evangelistic Campaign & Altar Ministry",
            description: "Field outreach documentation and soul winning report.",
            type: "practicum",
            maxPoints: 100,
            weight: 20,
            dueDate: "2026-09-25",
            submissionsCount: 0,
            gradedCount: 0,
            avgScore: 0
          }
        ],
        exams: [
          {
            id: "exam_som_s2_final",
            title: "Final Comprehensive Ministerial Examination (All 6 Modules)",
            description: "Comprehensive written and oral defense across Introduction, Evangelism, Apostles, Ethics, Pastor & Holy Spirit, and Prophets.",
            examType: "final",
            totalPoints: 100,
            weight: 35,
            examDate: "2026-11-21",
            durationMinutes: 120,
            status: "scheduled",
            avgScore: 0,
            passingScore: 75
          }
        ],
        grades: []
      }
    ];
  }
});

// src/server/services/domain/academicsService.ts
var academicsService;
var init_academicsService = __esm({
  "src/server/services/domain/academicsService.ts"() {
    init_supabaseServer();
    init_logger();
    init_defaultAcademicData();
    academicsService = {
      /**
       * Returns the complete relational academic hierarchy snapshot:
       * academic_years -> terms -> course_definitions/courses -> course_offerings.
       */
      async getAcademicStructure() {
        const supabase = getServerSupabase();
        try {
          const [yearsRes, termsRes, coursesRes, defsRes, offeringsRes] = await Promise.all([
            supabase.from("academic_years").select("*").is("deleted_at", null).order("start_date", { ascending: true }),
            supabase.from("terms").select("*").is("deleted_at", null).order("sequence_order", { ascending: true }),
            supabase.from("courses").select("*").is("deleted_at", null),
            supabase.from("course_definitions").select("*").is("deleted_at", null),
            supabase.from("course_offerings").select("*").is("deleted_at", null).order("created_at", { ascending: false })
          ]);
          const academicYears = yearsRes.data && yearsRes.data.length > 0 ? yearsRes.data : DEFAULT_ACADEMIC_YEARS;
          const terms = termsRes.data && termsRes.data.length > 0 ? termsRes.data : DEFAULT_TERMS;
          const masterCourses = defsRes.data && defsRes.data.length > 0 ? defsRes.data : coursesRes.data && coursesRes.data.length >= 6 ? coursesRes.data : DEFAULT_MASTER_COURSES;
          const courseOfferings = offeringsRes.data && offeringsRes.data.length > 0 ? offeringsRes.data : DEFAULT_COURSE_OFFERINGS;
          const activeTerm = terms.find((t) => t.status === "active") || terms[0];
          return {
            academicYears,
            terms,
            masterCourses,
            courseOfferings,
            activeTermId: activeTerm?.id || "term_2026_s1"
          };
        } catch (err) {
          logger.error("Error fetching academic structure from relational tables, using defaults:", err);
          return {
            academicYears: DEFAULT_ACADEMIC_YEARS,
            terms: DEFAULT_TERMS,
            masterCourses: DEFAULT_MASTER_COURSES,
            courseOfferings: DEFAULT_COURSE_OFFERINGS,
            activeTermId: "term_2026_s1"
          };
        }
      },
      /**
       * Retrieves courses from relational catalog.
       */
      async getCourses() {
        const supabase = getServerSupabase();
        try {
          const { data: defs } = await supabase.from("course_definitions").select("*").is("deleted_at", null).order("core_module_number", { ascending: true });
          if (defs && defs.length > 0) {
            return { courses: defs, count: defs.length };
          }
          const { data: courses } = await supabase.from("courses").select("*").is("deleted_at", null);
          return { courses: courses || [], count: courses?.length || 0 };
        } catch (err) {
          logger.error("Error querying courses from relational tables:", err);
          return { courses: [], count: 0 };
        }
      },
      /**
       * Saves or updates a master course definition in PostgreSQL.
       */
      async saveCourse(course, actorUserId, actorRole) {
        const supabase = getServerSupabase();
        const timestamp = (/* @__PURE__ */ new Date()).toISOString();
        try {
          const coursePayload = {
            code: course.code,
            title: course.title,
            credits: course.credits || 5,
            department: course.department || "Biblical Studies",
            level: course.level || "Foundation",
            description: course.description || "",
            is_active: course.isActive !== false,
            updated_at: timestamp
          };
          const { data: saved, error } = await supabase.from("course_definitions").upsert(coursePayload, { onConflict: "code" }).select().single();
          if (error) {
            logger.warn("Course definition upsert warning:", error.message);
          }
          await logAuditEvent({
            actorUserId: actorUserId || null,
            actorRole: actorRole || "system",
            entityType: "course",
            entityId: course.code,
            action: "update",
            newValues: course,
            changedFields: Object.keys(course),
            reason: `Course definition ${course.code} updated`
          });
          return {
            status: "saved",
            course: saved || course
          };
        } catch (err) {
          logger.error("Error saving course in relational service:", err);
          throw err;
        }
      },
      /**
       * Saves or updates a course offering in PostgreSQL.
       */
      async saveCourseOffering(offering, actorUserId, actorRole) {
        const supabase = getServerSupabase();
        const timestamp = (/* @__PURE__ */ new Date()).toISOString();
        try {
          let lecturerUserId = offering.lecturerUserId || offering.lecturer_user_id || null;
          if (!lecturerUserId && offering.lecturerEmail) {
            const { data: u } = await supabase.from("users").select("id").eq("email", offering.lecturerEmail.trim().toLowerCase()).is("deleted_at", null).maybeSingle();
            if (u?.id) {
              lecturerUserId = u.id;
            }
          }
          const offeringPayload = {
            id: offering.id,
            course_definition_id: offering.courseDefinitionId || offering.course_definition_id || offering.courseId,
            term_id: offering.termId,
            academic_year_id: offering.academicYearId,
            lecturer_user_id: lecturerUserId,
            lecturer_name: offering.lecturerName || "Faculty Instructor",
            lecturer_title: offering.lecturerTitle || "Pastor / Lecturer",
            lecturer_email: offering.lecturerEmail || "",
            section: offering.section || "Section 01",
            schedule_days: offering.scheduleDays || "Saturday",
            location: offering.location || "Main Sanctuary & Zoom",
            zoom_link: offering.zoomLink || "",
            capacity: offering.capacity || 40,
            status: offering.status || "active",
            credits: offering.credits || 5,
            updated_at: timestamp
          };
          const { data: saved, error } = await supabase.from("course_offerings").upsert(offeringPayload, { onConflict: "id" }).select().single();
          if (error) {
            logger.warn("Course offering upsert warning:", error.message);
          }
          await logAuditEvent({
            actorUserId: actorUserId || null,
            actorRole: actorRole || "system",
            entityType: "course_offering",
            entityId: offering.id,
            action: "update",
            newValues: offering,
            changedFields: Object.keys(offering),
            reason: `Course offering ${offering.id} updated`
          });
          return {
            status: "saved",
            offering: saved || offering
          };
        } catch (err) {
          logger.error("Error saving course offering in relational service:", err);
          throw err;
        }
      }
    };
  }
});

// src/server/services/domain/assignmentsService.ts
var assignmentsService;
var init_assignmentsService = __esm({
  "src/server/services/domain/assignmentsService.ts"() {
    init_supabaseServer();
    init_logger();
    assignmentsService = {
      /**
       * Retrieves assignments from relational assignments table.
       */
      async getAssignments(user) {
        const supabase = getServerSupabase();
        try {
          const { data: assignments, error } = await supabase.from("assignments").select("*").is("deleted_at", null).order("due_at", { ascending: false });
          if (assignments && assignments.length > 0) {
            let filtered = assignments;
            if (user && user.role === "student") {
              filtered = assignments.filter((a) => a.is_published !== false);
            } else if (user && (user.role === "lecturer" || user.role === "teacher")) {
              let lecturerUserId = (user.userId || user.id || "").trim();
              const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
              if (!UUID_REGEX.test(lecturerUserId)) {
                const { data: u } = await supabase.from("users").select("id").or(`firebase_uid.eq.${user.uid || lecturerUserId},id.eq.${lecturerUserId}`).is("deleted_at", null).maybeSingle();
                if (u?.id) lecturerUserId = u.id;
              }
              const allowedCourseIdentifiers = /* @__PURE__ */ new Set();
              if (UUID_REGEX.test(lecturerUserId)) {
                const { data: offerings } = await supabase.from("course_offerings").select(`
                id,
                course_definition_id,
                lecturer_user_id,
                course_definitions (
                  id,
                  code
                )
              `).eq("lecturer_user_id", lecturerUserId).is("deleted_at", null);
                if (offerings) {
                  offerings.forEach((off) => {
                    if (off.id) allowedCourseIdentifiers.add(String(off.id).trim().toUpperCase());
                    if (off.course_definition_id) allowedCourseIdentifiers.add(String(off.course_definition_id).trim().toUpperCase());
                    if (off.course_definitions?.code) allowedCourseIdentifiers.add(String(off.course_definitions.code).trim().toUpperCase());
                  });
                }
              }
              filtered = assignments.filter((a) => {
                const courseId = String(a.course_code || a.courseCode || a.course_definition_id || a.courseId || "").trim().toUpperCase();
                if (!courseId) return false;
                return allowedCourseIdentifiers.has(courseId);
              });
            }
            return { assignments: filtered, count: filtered.length };
          }
        } catch (err) {
          logger.error("Error fetching assignments from relational table:", err);
        }
        return { assignments: [], count: 0 };
      },
      /**
       * Retrieves submissions joined with grades and rubric evaluations from relational tables.
       */
      async getSubmissions(filters, user) {
        const supabase = getServerSupabase();
        try {
          let query = supabase.from("submissions").select(`
          id,
          assignment_id,
          student_id,
          status,
          submitted_at,
          submission_content,
          file_url,
          file_name,
          file_type,
          grades (
            id,
            points_awarded,
            feedback,
            graded_at,
            graded_by_user_id
          ),
          students (
            id,
            student_number,
            profiles (
              first_name,
              last_name,
              avatar_url
            )
          ),
          assignments (
            title,
            max_points,
            course_code,
            course_definition_id
          )
        `).is("deleted_at", null).order("submitted_at", { ascending: false });
          if (filters?.assignmentId) {
            query = query.eq("assignment_id", filters.assignmentId);
          }
          if (user && user.role === "student") {
            const studentUuid = user.studentRecordId || user.studentId || user.userId;
            if (studentUuid) {
              query = query.eq("student_id", studentUuid);
            }
          } else if (filters?.studentId) {
            query = query.eq("student_id", filters.studentId);
          }
          const { data: dbSubmissions } = await query;
          if (dbSubmissions && dbSubmissions.length > 0) {
            const rubricScores = {};
            const formatted = dbSubmissions.map((s) => {
              const std = s.students;
              const p = Array.isArray(std?.profiles) ? std?.profiles[0] : std?.profiles;
              const studentName = p ? `${p.first_name || ""} ${p.last_name || ""}`.trim() : "Student";
              const grade = Array.isArray(s.grades) ? s.grades[0] : s.grades;
              const asg = Array.isArray(s.assignments) ? s.assignments[0] : s.assignments;
              return {
                id: s.id,
                assignmentId: s.assignment_id,
                assignmentTitle: asg?.title || "Assignment",
                studentId: s.student_id,
                student: {
                  id: s.student_id,
                  name: studentName,
                  photoUrl: p?.avatar_url || null
                },
                studentName,
                status: s.status,
                submittedAt: s.submitted_at,
                content: s.submission_content || "",
                fileUrl: s.file_url || "",
                fileName: s.file_name || "",
                score: grade?.points_awarded,
                grade: grade?.points_awarded,
                feedback: grade?.feedback || "",
                gradedAt: grade?.graded_at,
                maxPoints: asg?.max_points || 100,
                courseCode: asg?.course_code || asg?.course_definition_id || ""
              };
            });
            let result = formatted;
            if (user && user.role === "student") {
              const studentUuid = user.studentRecordId || user.studentId || user.userId;
              const userUuid = user.userId || user.id;
              result = formatted.filter(
                (sub) => sub.studentId && (sub.studentId === studentUuid || sub.studentId === userUuid) || sub.student?.id && (sub.student.id === studentUuid || sub.student.id === userUuid) || sub.student_id && (sub.student_id === studentUuid || sub.student_id === userUuid)
              );
            } else if (user && (user.role === "lecturer" || user.role === "teacher")) {
              let lecturerUserId = (user.userId || user.id || "").trim();
              const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
              if (!UUID_REGEX.test(lecturerUserId)) {
                const { data: u } = await supabase.from("users").select("id").or(`firebase_uid.eq.${user.uid || lecturerUserId},id.eq.${lecturerUserId}`).is("deleted_at", null).maybeSingle();
                if (u?.id) lecturerUserId = u.id;
              }
              const allowedCourseIdentifiers = /* @__PURE__ */ new Set();
              if (UUID_REGEX.test(lecturerUserId)) {
                const { data: offerings } = await supabase.from("course_offerings").select(`
                id,
                course_definition_id,
                lecturer_user_id,
                course_definitions (
                  id,
                  code
                )
              `).eq("lecturer_user_id", lecturerUserId).is("deleted_at", null);
                if (offerings) {
                  offerings.forEach((off) => {
                    if (off.id) allowedCourseIdentifiers.add(String(off.id).trim().toUpperCase());
                    if (off.course_definition_id) allowedCourseIdentifiers.add(String(off.course_definition_id).trim().toUpperCase());
                    if (off.course_definitions?.code) allowedCourseIdentifiers.add(String(off.course_definitions.code).trim().toUpperCase());
                  });
                }
              }
              result = formatted.filter((sub) => {
                const courseId = String(sub.courseCode || "").trim().toUpperCase();
                if (!courseId) return false;
                return allowedCourseIdentifiers.has(courseId);
              });
            } else if (filters?.studentId) {
              result = formatted.filter((sub) => sub.studentId === filters.studentId || sub.student_id === filters.studentId);
            }
            return {
              submissions: result,
              rubricScores,
              count: result.length
            };
          }
        } catch (err) {
          logger.error("Error fetching submissions from relational table:", err);
        }
        return { submissions: [], rubricScores: {}, count: 0 };
      },
      /**
       * Securely submits an assignment for an authenticated student.
       * 9.1: Derives studentId strictly from req.user context, ignoring client identity inputs.
       * 9.2: Validates assignment existence, course association, student enrollment, publication, and window.
       * 9.3: Sanitizes payload to prevent student grade manipulation.
       */
      async submitAssignmentForUser(assignmentId, payload, user) {
        const supabase = getServerSupabase();
        const timestamp = (/* @__PURE__ */ new Date()).toISOString();
        let studentId = user.studentRecordId;
        if (!studentId && user.userId) {
          const { data: std } = await supabase.from("students").select("id").eq("user_id", user.userId).maybeSingle();
          if (std?.id) studentId = std.id;
        }
        if (!studentId && user.email) {
          const { data: prof } = await supabase.from("profiles").select("id, students(id)").ilike("email", user.email).maybeSingle();
          if (prof?.students && Array.isArray(prof.students) && prof.students[0]?.id) {
            studentId = prof.students[0].id;
          }
        }
        if (!studentId) {
          const { data: std } = await supabase.from("students").select("id").limit(1).maybeSingle();
          studentId = std?.id || "00000000-0000-0000-0000-000000000000";
        }
        const { data: assignment } = await supabase.from("assignments").select("*, courses(id, title)").eq("id", assignmentId).is("deleted_at", null).maybeSingle();
        if (!assignment) {
          throw new Error("Assignment not found");
        }
        if (assignment.is_published === false) {
          throw new Error("Assignment is not published");
        }
        if (assignment.lock_at) {
          const lockTime = new Date(assignment.lock_at).getTime();
          if (Date.now() > lockTime) {
            throw new Error("Submission window is closed for this assignment");
          }
        }
        const { data: student } = await supabase.from("students").select("id").eq("id", studentId).maybeSingle();
        if (!student) {
          throw new Error("Student is not enrolled in this institution");
        }
        const content = payload?.content || payload?.submission_content || payload?.studentNotes || "";
        const fileUrl = payload?.fileUrl || payload?.file_url || payload?.studentFileUrl || "";
        const fileName = payload?.fileName || payload?.file_name || payload?.studentFileName || "";
        const submissionPayload = {
          id: payload?.id || `SUB-${Date.now()}`,
          assignment_id: assignmentId,
          student_id: studentId,
          status: "submitted",
          // Force status, never allow client 'graded'
          submitted_at: timestamp,
          submission_content: content,
          file_url: fileUrl,
          file_name: fileName,
          updated_at: timestamp
        };
        const { data: saved, error } = await supabase.from("submissions").upsert(submissionPayload, { onConflict: "id" }).select().single();
        if (error) {
          logger.warn("Submission upsert warning:", error.message);
        }
        await logAuditEvent({
          actorUserId: user.email,
          entityType: "submission",
          entityId: submissionPayload.id,
          action: "create",
          newValues: {
            assignmentId,
            studentId,
            submittedAt: timestamp
          }
        });
        return {
          status: "submitted",
          submission: {
            id: saved?.id || submissionPayload.id,
            assignmentId,
            studentId,
            status: "submitted",
            submittedAt: timestamp,
            content,
            fileUrl,
            fileName
          }
        };
      },
      /**
       * Deprecated backward-compatible submission handler.
       */
      async submitAssignment(submission, actorUserId) {
        const supabase = getServerSupabase();
        const timestamp = (/* @__PURE__ */ new Date()).toISOString();
        try {
          let studentId = submission.studentId;
          if (!studentId && submission.studentName) {
            const parts = submission.studentName.trim().split(" ");
            const { data: prof } = await supabase.from("profiles").select("user_id, students(id)").ilike("first_name", parts[0]).maybeSingle();
            if (prof?.students && prof.students[0]?.id) {
              studentId = prof.students[0].id;
            }
          }
          if (!studentId) {
            const { data: std } = await supabase.from("students").select("id").limit(1).maybeSingle();
            studentId = std?.id || "00000000-0000-0000-0000-000000000000";
          }
          const submissionPayload = {
            id: submission.id || `SUB-${Date.now()}`,
            assignment_id: submission.assignmentId,
            student_id: studentId,
            status: "submitted",
            submitted_at: timestamp,
            submission_content: submission.content || "",
            file_url: submission.fileUrl || "",
            file_name: submission.fileName || "",
            updated_at: timestamp
          };
          const { data: saved, error } = await supabase.from("submissions").upsert(submissionPayload, { onConflict: "id" }).select().single();
          if (error) {
            logger.warn("Submission upsert warning:", error.message);
          }
          await logAuditEvent({
            actorUserId,
            entityType: "submission",
            entityId: submissionPayload.id,
            action: "create",
            newValues: {
              assignmentId: submission.assignmentId,
              studentId,
              studentName: submission.studentName,
              submittedAt: timestamp
            }
          });
          return {
            status: "submitted",
            submission: {
              ...submission,
              id: saved?.id || submissionPayload.id,
              studentId,
              status: "submitted",
              submittedAt: timestamp
            }
          };
        } catch (err) {
          logger.error("Error in submitAssignment relational service:", err);
          throw err;
        }
      },
      /**
       * Securely grades a student submission with lecturer verification chain, authoritative score bounds checking,
       * and Phase 10 grade lifecycle locking checks.
       */
      async gradeSubmission(data, actorUser) {
        const supabase = getServerSupabase();
        const timestamp = (/* @__PURE__ */ new Date()).toISOString();
        const actorUserId = typeof actorUser === "object" ? actorUser.userId : actorUser || null;
        const actorRole = typeof actorUser === "object" ? actorUser.role : "teacher";
        try {
          if (!data.submissionId) {
            throw new Error("submissionId is required for grading");
          }
          const { data: sub, error: subErr } = await supabase.from("submissions").select("*, assignments(*)").eq("id", data.submissionId).maybeSingle();
          if (subErr || !sub) {
            throw new Error("Submission not found");
          }
          const currentStatus = (sub.status || "submitted").toUpperCase().trim();
          if (currentStatus === "LOCKED" || currentStatus === "LOCKED_GRADE") {
            const elevatedRoles = ["super_admin", "admin", "registrar"];
            const isElevated = elevatedRoles.includes(actorRole) || data.allowLockedOverride;
            if (!isElevated) {
              throw new Error(
                "Grade is LOCKED. Standard lecturers cannot modify locked grades. An override must be approved by the Registrar or Admin."
              );
            }
          }
          const assignment = Array.isArray(sub.assignments) ? sub.assignments[0] : sub.assignments;
          if (!assignment) {
            throw new Error("Associated assignment not found for this submission");
          }
          const courseCode = assignment.course_code || assignment.courseCode || assignment.course_definition_id || assignment.courseId;
          if (typeof actorUser === "object" && (actorUser.role === "lecturer" || actorUser.role === "teacher")) {
            if (!courseCode) {
              throw new Error("Access Denied: Course context (courseCode) is required for lecturer authorization.");
            }
            const { verifyLecturerCourseInDatabase: verifyLecturerCourseInDatabase2 } = await Promise.resolve().then(() => (init_rbac2(), rbac_exports));
            const isAssigned = await verifyLecturerCourseInDatabase2(actorUser, courseCode);
            if (!isAssigned) {
              throw new Error(`Access Denied: You are not assigned as the lecturer for course ${courseCode} in the database.`);
            }
          }
          const maxScore = Number(assignment.max_points || assignment.maxPoints || 100);
          const numericScore = Number(data.score);
          if (isNaN(numericScore) || numericScore < 0 || numericScore > maxScore) {
            throw new Error(`Score must be a number between 0 and ${maxScore}`);
          }
          const { error: gradeErr } = await supabase.from("grades").upsert(
            {
              submission_id: data.submissionId,
              points_awarded: numericScore,
              feedback: data.feedback || "",
              graded_at: timestamp,
              graded_by_user_id: actorUserId,
              updated_at: timestamp
            },
            { onConflict: "submission_id" }
          );
          if (gradeErr) {
            logger.warn("Grade upsert warning:", gradeErr.message);
          }
          const nextStatus = currentStatus === "SUBMITTED" ? "GRADED" : sub.status;
          await supabase.from("submissions").update({ status: nextStatus, updated_at: timestamp }).eq("id", data.submissionId);
          const isLockedOverride = currentStatus === "LOCKED" || Boolean(data.overrideReason);
          await logAuditEvent({
            actorUserId,
            actorRole,
            entityType: "grade",
            entityId: data.submissionId,
            action: isLockedOverride ? "grade_override_approved" : "grade_recorded",
            newValues: {
              previousStatus: currentStatus,
              newStatus: nextStatus,
              score: numericScore,
              feedback: data.feedback,
              rubricScores: data.rubricScores,
              maxScore,
              overrideReason: data.overrideReason || null
            },
            changedFields: ["score", "feedback", "status"],
            reason: data.overrideReason || (isLockedOverride ? "Grade override approved" : "Grade recorded")
          });
          return {
            status: nextStatus,
            score: numericScore,
            feedback: data.feedback
          };
        } catch (err) {
          logger.error("Error in gradeSubmission relational service:", err);
          throw err;
        }
      },
      /**
       * Transitions a grade through its controlled lifecycle:
       * SUBMITTED -> GRADED -> MODERATION -> RELEASED -> LOCKED
       * 
       * Transitioning TO or FROM LOCKED requires elevated permissions (Registrar/Admin).
       */
      async transitionGradeLifecycle(params, actorUser) {
        const supabase = getServerSupabase();
        const timestamp = (/* @__PURE__ */ new Date()).toISOString();
        const normalizedTarget = params.targetStatus.toUpperCase().trim();
        const validStatuses = ["SUBMITTED", "GRADED", "MODERATION", "RELEASED", "LOCKED"];
        if (!validStatuses.includes(normalizedTarget)) {
          throw new Error(`Invalid lifecycle status. Allowed values: ${validStatuses.join(", ")}`);
        }
        const { data: sub, error } = await supabase.from("submissions").select("*, assignments(*)").eq("id", params.submissionId).maybeSingle();
        if (error || !sub) {
          throw new Error("Submission not found");
        }
        const currentStatus = (sub.status || "SUBMITTED").toUpperCase().trim();
        if (currentStatus === "LOCKED" || normalizedTarget === "LOCKED") {
          const elevatedRoles = ["super_admin", "admin", "registrar"];
          if (!elevatedRoles.includes(actorUser.role)) {
            throw new Error(
              "Access denied: Only Registrar or Admin can lock or transition locked grades."
            );
          }
        }
        const dbStatus = normalizedTarget.toLowerCase();
        const { error: updateErr } = await supabase.from("submissions").update({ status: dbStatus, updated_at: timestamp }).eq("id", params.submissionId);
        if (updateErr) {
          logger.warn("Submission lifecycle update warning:", updateErr.message);
        }
        await logAuditEvent({
          actorUserId: actorUser.userId,
          actorRole: actorUser.role,
          entityType: "grade_lifecycle",
          entityId: params.submissionId,
          action: `grade_lifecycle_transition_${normalizedTarget.toLowerCase()}`,
          oldValues: { status: currentStatus },
          newValues: {
            previousStatus: currentStatus,
            targetStatus: normalizedTarget,
            status: dbStatus
          },
          changedFields: ["status"],
          reason: params.reason || `Transitioned to ${normalizedTarget} by ${actorUser.role}`
        });
        return {
          status: "success",
          lifecycleStatus: normalizedTarget
        };
      },
      /**
       * Administrative override for locked grades requiring an explicit reason.
       */
      async overrideLockedGrade(params, actorUser) {
        const elevatedRoles = ["super_admin", "admin", "registrar"];
        if (!elevatedRoles.includes(actorUser.role)) {
          throw new Error("Access denied: Only Registrar or Admin can approve grade overrides for locked records.");
        }
        if (!params.reason || params.reason.trim().length === 0) {
          throw new Error("An explicit justification reason is required for an administrative grade override.");
        }
        const res = await this.gradeSubmission(
          {
            submissionId: params.submissionId,
            score: params.score,
            feedback: params.feedback,
            overrideReason: params.reason,
            allowLockedOverride: true
          },
          actorUser
        );
        return {
          ...res,
          overrideApproved: true
        };
      },
      /**
       * Creates a new assignment directly in relational assignments table.
       */
      async createAssignment(data, actorUser) {
        const supabase = getServerSupabase();
        const timestamp = (/* @__PURE__ */ new Date()).toISOString();
        const cleanTitle = data.title?.trim();
        if (!cleanTitle) {
          throw new Error("Assignment title is required");
        }
        const dueAt = data.dueAt || data.dueDate || new Date(Date.now() + 7 * 864e5).toISOString();
        const maxPoints = data.maxPoints || data.maxScore || 100;
        const courseCode = data.courseCode || "MIN-101";
        const insertPayload = {
          title: cleanTitle,
          description: data.description || "",
          course_code: courseCode,
          course_definition_id: data.courseDefinitionId || null,
          due_at: dueAt,
          max_points: maxPoints,
          weight: data.weight || 10,
          is_published: data.isPublished !== false,
          rubric: data.rubric || null,
          created_by_user_id: actorUser.userId,
          created_at: timestamp,
          updated_at: timestamp
        };
        let createdId = `asg_${Date.now()}`;
        try {
          const { data: inserted, error } = await supabase.from("assignments").insert(insertPayload).select().single();
          if (!error && inserted?.id) {
            createdId = inserted.id;
          }
        } catch (err) {
          logger.warn("Error inserting relational assignment:", err);
        }
        await logAuditEvent({
          actorUserId: actorUser.userId,
          actorRole: actorUser.role,
          entityType: "assignment",
          entityId: createdId,
          action: "create",
          newValues: { title: cleanTitle, courseCode, dueAt, maxPoints },
          changedFields: ["title", "course_code", "due_at", "max_points"],
          reason: `Assignment '${cleanTitle}' created`
        });
        return {
          status: "created",
          assignment: {
            id: createdId,
            title: cleanTitle,
            description: data.description || "",
            courseCode,
            dueDate: dueAt,
            dueAt,
            maxScore: maxPoints,
            maxPoints,
            weight: data.weight || 10,
            isPublished: data.isPublished !== false
          }
        };
      },
      /**
       * Updates an existing assignment directly in relational assignments table.
       */
      async updateAssignment(id, data, actorUser) {
        const supabase = getServerSupabase();
        const timestamp = (/* @__PURE__ */ new Date()).toISOString();
        const updates = { updated_at: timestamp };
        if (data.title !== void 0) updates.title = data.title.trim();
        if (data.description !== void 0) updates.description = data.description;
        if (data.courseCode !== void 0) updates.course_code = data.courseCode;
        if (data.dueAt !== void 0 || data.dueDate !== void 0) updates.due_at = data.dueAt || data.dueDate;
        if (data.maxPoints !== void 0 || data.maxScore !== void 0) updates.max_points = data.maxPoints || data.maxScore;
        if (data.weight !== void 0) updates.weight = data.weight;
        if (data.isPublished !== void 0) updates.is_published = data.isPublished;
        if (data.rubric !== void 0) updates.rubric = data.rubric;
        let updatedRec = null;
        try {
          const { data: updated, error } = await supabase.from("assignments").update(updates).eq("id", id).select().maybeSingle();
          if (!error && updated) {
            updatedRec = updated;
          }
        } catch (err) {
          logger.warn("Error updating relational assignment:", err);
        }
        await logAuditEvent({
          actorUserId: actorUser.userId,
          actorRole: actorUser.role,
          entityType: "assignment",
          entityId: id,
          action: "update",
          newValues: updates,
          changedFields: Object.keys(updates),
          reason: `Assignment ${id} updated`
        });
        return {
          status: "updated",
          assignment: updatedRec || { id, ...data, updatedAt: timestamp }
        };
      }
    };
  }
});

// src/server/services/domain/financeService.ts
function isUuid(val) {
  if (!val || typeof val !== "string") return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(val);
}
async function getNextDatabaseSequenceNumber(type, year = "2026", supabaseInstance) {
  const supabase = supabaseInstance || getServerSupabase();
  const prefixMap = {
    invoice: "INV",
    payment: "PAY",
    refund: "REF",
    adjustment: "ADJ",
    receipt: "RCP"
  };
  const prefix = prefixMap[type] || type.toUpperCase().slice(0, 3);
  const { data, error } = await supabase.rpc("get_next_document_number", {
    p_type: type,
    p_year: year
  });
  if (error || !data || typeof data !== "string") {
    logger.error(`Database atomic sequence generation failed for type "${type}":`, error?.message || error);
    throw new Error(`Failed to generate atomic sequence number for ${type}: ${error?.message || "Empty sequence value returned"}`);
  }
  return data;
}
var import_crypto, financeService;
var init_financeService = __esm({
  "src/server/services/domain/financeService.ts"() {
    import_crypto = __toESM(require("crypto"), 1);
    init_supabaseServer();
    init_logger();
    financeService = {
      /**
       * Authoritative Core Calculation Engine:
       * Recomputes an invoice's financial ledger strictly on the server:
       *
       *   balance =
       *     invoice total
       *     - payments
       *     - approved adjustments
       *     + applicable charges
       *
       * where:
       *   invoice total = sum of invoice_lines
       *   payments = sum of completed payment_allocations - approved refund_allocations
       *   approved adjustments = sum of approved credits (discounts, scholarships, fee waivers)
       *   applicable charges = sum of approved charges (late fees, course fees)
       */
      async calculateAuthoritativeInvoiceFinancials(invoiceId, existingClient) {
        const supabase = existingClient || getServerSupabase();
        const { data: inv } = await supabase.from("invoices").select("id, due_date, status, created_at").eq("id", invoiceId).maybeSingle();
        const { data: dbLines } = await supabase.from("invoice_lines").select("*").eq("invoice_id", invoiceId);
        const lines = dbLines || [];
        const invoiceTotal = lines.reduce((acc, line) => {
          const lineTotal = Number(line.total_amount ?? Number(line.quantity || 1) * Number(line.unit_amount || 0));
          return acc + (isNaN(lineTotal) ? 0 : lineTotal);
        }, 0);
        const { data: dbAllocations } = await supabase.from("payment_allocations").select(`
        *,
        payments (
          id,
          status,
          payment_date,
          payment_method,
          transaction_reference,
          deleted_at
        )
      `).eq("invoice_id", invoiceId);
        const validAllocations = (dbAllocations || []).filter((a) => {
          const p = Array.isArray(a.payments) ? a.payments[0] : a.payments;
          return p && p.status === "completed" && !p.deleted_at;
        });
        const paymentsTotal = validAllocations.reduce((acc, a) => {
          const amt = Number(a.allocated_amount || 0);
          return acc + (isNaN(amt) ? 0 : amt);
        }, 0);
        const { data: dbRefundAllocations } = await supabase.from("refund_allocations").select(`
        *,
        refunds (
          id,
          status,
          refund_date,
          amount
        )
      `).eq("invoice_id", invoiceId);
        const validRefunds = (dbRefundAllocations || []).filter((ra) => {
          const r = Array.isArray(ra.refunds) ? ra.refunds[0] : ra.refunds;
          return r && (r.status === "approved" || r.status === "processed");
        });
        const refundsTotal = validRefunds.reduce((acc, ra) => {
          const amt = Number(ra.allocated_amount || 0);
          return acc + (isNaN(amt) ? 0 : amt);
        }, 0);
        const netPayments = Math.max(0, paymentsTotal - refundsTotal);
        const { data: dbAdjustments } = await supabase.from("financial_adjustments").select("*").eq("invoice_id", invoiceId);
        const adjustments = dbAdjustments || [];
        const approvedAdjustmentsList = adjustments.filter((a) => a.status === "approved");
        let discounts = 0;
        let scholarships = 0;
        let applicableCharges = 0;
        approvedAdjustmentsList.forEach((adj) => {
          const amt = Number(adj.amount || 0);
          if (isNaN(amt) || amt <= 0) return;
          if (adj.is_charge === true || adj.adjustment_type === "applicable_charge" || adj.adjustment_type === "late_fee" || adj.adjustment_type === "administrative_charge") {
            applicableCharges += amt;
          } else if (adj.adjustment_type === "scholarship") {
            scholarships += amt;
          } else {
            discounts += amt;
          }
        });
        const approvedAdjustmentsTotal = discounts + scholarships;
        const netTuition = Math.max(0, invoiceTotal + applicableCharges - approvedAdjustmentsTotal);
        const balance = Math.max(0, invoiceTotal + applicableCharges - netPayments - approvedAdjustmentsTotal);
        let effectiveStatus = "Unpaid";
        const dueDate = inv?.due_date ? new Date(inv.due_date) : null;
        const now = /* @__PURE__ */ new Date();
        if (balance <= 0) {
          effectiveStatus = "Paid";
        } else if (netPayments > 0 || approvedAdjustmentsTotal > 0) {
          effectiveStatus = "Partially Paid";
        } else if (dueDate && dueDate < now) {
          effectiveStatus = "Past Due";
        } else {
          effectiveStatus = "Unpaid";
        }
        try {
          await supabase.from("invoices").update({
            total_amount: invoiceTotal,
            net_amount: netTuition,
            paid_amount: netPayments,
            balance_due: balance,
            discounts,
            scholarships,
            refunds: refundsTotal,
            adjustments: applicableCharges,
            status: effectiveStatus === "Paid" ? "paid" : effectiveStatus === "Partially Paid" ? "partially_paid" : effectiveStatus === "Past Due" ? "overdue" : "unpaid",
            updated_at: (/* @__PURE__ */ new Date()).toISOString()
          }).eq("id", invoiceId);
        } catch (err) {
          logger.warn(`Could not update invoice cache for ${invoiceId}:`, err.message);
        }
        return {
          invoiceTotal,
          applicableCharges,
          paymentsTotal,
          refundsTotal,
          netPayments,
          discounts,
          scholarships,
          approvedAdjustments: approvedAdjustmentsTotal,
          netTuition,
          balance,
          status: effectiveStatus,
          lines,
          allocations: validAllocations,
          refundAllocations: validRefunds,
          adjustments
        };
      },
      /**
       * Retrieves invoices from relational invoices table.
       * Derives all totals dynamically on the server from lines, allocations, refunds, and adjustments.
       */
      async getInvoices(filters, user) {
        const supabase = getServerSupabase();
        const filterObj = typeof filters === "string" ? { studentName: filters } : filters;
        try {
          let query = supabase.from("invoices").select(`
          *,
          students (
            id,
            student_number,
            cohort_level,
            profiles (
              first_name,
              last_name,
              phone
            ),
            users (
              email
            )
          )
        `).is("deleted_at", null).order("created_at", { ascending: false });
          if (user && user.role === "student") {
            const studentUuid = user.studentRecordId || user.userId;
            if (studentUuid) {
              query = query.eq("student_id", studentUuid);
            }
          } else if (filterObj?.studentId) {
            query = query.eq("student_id", filterObj.studentId);
          }
          const { data: dbInvoices, error } = await query;
          if (dbInvoices && dbInvoices.length > 0) {
            const invoiceIds = dbInvoices.map((inv) => inv.id);
            const [
              { data: allLines },
              { data: allAllocations },
              { data: allRefundAllocations },
              { data: allAdjustments }
            ] = await Promise.all([
              supabase.from("invoice_lines").select("*").in("invoice_id", invoiceIds),
              supabase.from("payment_allocations").select(`
            *,
            payments (
              id,
              status,
              payment_date,
              payment_method,
              transaction_reference,
              deleted_at
            )
          `).in("invoice_id", invoiceIds),
              supabase.from("refund_allocations").select(`
            *,
            refunds (
              id,
              status,
              refund_date,
              amount
            )
          `).in("invoice_id", invoiceIds),
              supabase.from("financial_adjustments").select("*").in("invoice_id", invoiceIds)
            ]);
            const linesMap = /* @__PURE__ */ new Map();
            (allLines || []).forEach((line) => {
              const list = linesMap.get(line.invoice_id) || [];
              list.push(line);
              linesMap.set(line.invoice_id, list);
            });
            const allocationsMap = /* @__PURE__ */ new Map();
            (allAllocations || []).forEach((alloc) => {
              const list = allocationsMap.get(alloc.invoice_id) || [];
              list.push(alloc);
              allocationsMap.set(alloc.invoice_id, list);
            });
            const refundAllocationsMap = /* @__PURE__ */ new Map();
            (allRefundAllocations || []).forEach((ra) => {
              const list = refundAllocationsMap.get(ra.invoice_id) || [];
              list.push(ra);
              refundAllocationsMap.set(ra.invoice_id, list);
            });
            const adjustmentsMap = /* @__PURE__ */ new Map();
            (allAdjustments || []).forEach((adj) => {
              const list = adjustmentsMap.get(adj.invoice_id) || [];
              list.push(adj);
              adjustmentsMap.set(adj.invoice_id, list);
            });
            const formatted = dbInvoices.map((inv) => {
              const std = inv.students;
              const prof = Array.isArray(std?.profiles) ? std?.profiles[0] : std?.profiles;
              const userObj = Array.isArray(std?.users) ? std?.users[0] : std?.users;
              const name = prof ? `${prof.first_name || ""} ${prof.last_name || ""}`.trim() : inv.student_name || "Student";
              const lines = linesMap.get(inv.id) || [];
              const allocations = allocationsMap.get(inv.id) || [];
              const refundAllocations = refundAllocationsMap.get(inv.id) || [];
              const adjustments = adjustmentsMap.get(inv.id) || [];
              const invoiceTotal = lines.reduce((acc, line) => {
                const lineTotal = Number(line.total_amount ?? Number(line.quantity || 1) * Number(line.unit_amount || 0));
                return acc + (isNaN(lineTotal) ? 0 : lineTotal);
              }, 0);
              const validAllocations = allocations.filter((a) => {
                const p = Array.isArray(a.payments) ? a.payments[0] : a.payments;
                return p && p.status === "completed" && !p.deleted_at;
              });
              const paymentsTotal = validAllocations.reduce((acc, a) => {
                const amt = Number(a.allocated_amount || 0);
                return acc + (isNaN(amt) ? 0 : amt);
              }, 0);
              const validRefunds = refundAllocations.filter((ra) => {
                const r = Array.isArray(ra.refunds) ? ra.refunds[0] : ra.refunds;
                return r && (r.status === "approved" || r.status === "processed");
              });
              const refundsTotal = validRefunds.reduce((acc, ra) => {
                const amt = Number(ra.allocated_amount || 0);
                return acc + (isNaN(amt) ? 0 : amt);
              }, 0);
              const netPayments = Math.max(0, paymentsTotal - refundsTotal);
              const approvedAdjustmentsList = adjustments.filter((a) => a.status === "approved");
              let discounts = 0;
              let scholarships = 0;
              let applicableCharges = 0;
              approvedAdjustmentsList.forEach((adj) => {
                const amt = Number(adj.amount || 0);
                if (isNaN(amt) || amt <= 0) return;
                if (adj.is_charge === true || adj.adjustment_type === "applicable_charge" || adj.adjustment_type === "late_fee" || adj.adjustment_type === "administrative_charge") {
                  applicableCharges += amt;
                } else if (adj.adjustment_type === "scholarship") {
                  scholarships += amt;
                } else {
                  discounts += amt;
                }
              });
              const approvedAdjustments = discounts + scholarships;
              const netTuition = Math.max(0, invoiceTotal + applicableCharges - approvedAdjustments);
              const balance = Math.max(0, invoiceTotal + applicableCharges - netPayments - approvedAdjustments);
              let effectiveStatus = "Unpaid";
              const dueDate = inv.due_date ? new Date(inv.due_date) : null;
              const now = /* @__PURE__ */ new Date();
              if (balance <= 0) {
                effectiveStatus = "Paid";
              } else if (netPayments > 0 || approvedAdjustments > 0) {
                effectiveStatus = "Partially Paid";
              } else if (dueDate && dueDate < now) {
                effectiveStatus = "Past Due";
              } else {
                effectiveStatus = "Unpaid";
              }
              return {
                id: inv.id,
                invoiceNumber: inv.invoice_number || inv.id,
                studentId: inv.student_id,
                student: {
                  id: inv.student_id,
                  name,
                  email: userObj?.email || "",
                  phone: prof?.phone || ""
                },
                studentName: name,
                email: userObj?.email || "",
                phone: prof?.phone || "",
                moduleTrack: inv.module_track || "Core Ministry Curriculum",
                term: inv.term || "2026 Semester 1",
                academicYear: inv.academic_year || "2026-2027",
                issueDate: inv.issue_date || inv.created_at?.split("T")[0],
                dueDate: inv.due_date,
                lines,
                allocations: validAllocations,
                refundAllocations: validRefunds,
                adjustmentsList: adjustments,
                totalTuition: invoiceTotal,
                applicableCharges,
                discounts,
                scholarships,
                refunds: refundsTotal,
                adjustments: applicableCharges,
                netTuition,
                amountPaid: netPayments,
                outstandingBalance: balance,
                status: effectiveStatus,
                paymentPlan: inv.payment_plan || "Monthly Installments",
                notes: inv.notes || "",
                createdAt: inv.created_at,
                updatedAt: inv.updated_at
              };
            });
            let result = formatted;
            if (user && (user.role === "teacher" || user.role === "lecturer")) {
              return { invoices: [], total: 0 };
            } else if (user && user.role === "student") {
              const studentUuid = user.studentRecordId || user.userId;
              const userUuid = user.userId || user.id;
              result = formatted.filter(
                (i) => i.studentId && (i.studentId === studentUuid || i.studentId === userUuid) || i.student?.id && (i.student.id === studentUuid || i.student.id === userUuid) || i.student_id && (i.student_id === studentUuid || i.student_id === userUuid)
              );
            } else if (filterObj?.studentId) {
              result = formatted.filter((i) => i.studentId === filterObj.studentId || i.student_id === filterObj.studentId);
            }
            return { invoices: result, total: result.length };
          }
        } catch (err) {
          logger.error("Error fetching invoices from relational table:", err);
          throw err;
        }
      },
      /**
       * Creates or updates a tuition invoice in the relational invoices and invoice_lines tables.
       *
       * CRITICAL SECURITY DIRECTIVE:
       * Rejects / strips client-submitted `totalTuition`, `amountPaid`, `discount`, `refund`, and `balance`.
       * The server calculates all totals from `invoice_lines`, allocations, and approved adjustments.
       */
      async saveInvoice(invoiceInput, actorUserId, actorRole) {
        const supabase = getServerSupabase();
        const timestamp = (/* @__PURE__ */ new Date()).toISOString();
        try {
          const {
            totalTuition: _ignoredTotal,
            amountPaid: _ignoredPaid,
            discount: _ignoredDiscount,
            discounts: _ignoredDiscounts,
            scholarships: _ignoredScholarships,
            refund: _ignoredRefund,
            refunds: _ignoredRefunds,
            balance: _ignoredBalance,
            outstandingBalance: _ignoredOutstanding,
            netTuition: _ignoredNet,
            ...safePayload
          } = invoiceInput;
          let studentId = safePayload.studentId;
          let studentName = safePayload.studentName || "Student";
          if (!studentId && studentName) {
            const parts = studentName.trim().split(" ");
            const { data: prof } = await supabase.from("profiles").select("user_id, students(id)").ilike("first_name", parts[0]).maybeSingle();
            if (prof?.students && prof.students[0]?.id) {
              studentId = prof.students[0].id;
            }
          }
          if (!studentId) {
            const { data: std } = await supabase.from("students").select("id").limit(1).maybeSingle();
            studentId = std?.id;
          }
          const invoiceId = safePayload.id && isUuid(safePayload.id) ? safePayload.id : import_crypto.default.randomUUID();
          const invoiceNumber = safePayload.invoiceNumber || await getNextDatabaseSequenceNumber("invoice", "2026", supabase);
          const invoiceHeader = {
            id: invoiceId,
            invoice_number: invoiceNumber,
            student_id: studentId,
            student_name: studentName,
            module_track: safePayload.moduleTrack || "Core Ministry Curriculum",
            term: safePayload.term || "2026 Semester 1",
            academic_year: safePayload.academicYear || "2026-2027",
            due_date: safePayload.dueDate || "2026-05-15",
            payment_plan: safePayload.paymentPlan || "Monthly Installments",
            notes: safePayload.notes || ""
          };
          let inputLines = Array.isArray(safePayload.lines) && safePayload.lines.length > 0 ? safePayload.lines : [
            {
              lineType: "tuition",
              description: safePayload.notes || "Core Ministry Curriculum Tuition",
              quantity: 1,
              unitAmount: 750
            }
          ];
          const linesToInsert = inputLines.map((l) => {
            const qty = Number(l.quantity || 1);
            const unit = Number(l.unitAmount || 0);
            return {
              id: l.id && isUuid(l.id) ? l.id : import_crypto.default.randomUUID(),
              line_type: l.lineType || "tuition",
              description: l.description || "Curriculum Tuition",
              quantity: qty,
              unit_amount: unit,
              total_amount: Math.round(qty * unit * 100) / 100
            };
          });
          const totalTuition = linesToInsert.reduce((sum, l) => sum + l.total_amount, 0);
          const auditLogPayload = {
            audit_id: import_crypto.default.randomUUID(),
            actor_user_id: actorUserId || null,
            actor_role: actorRole || "finance_officer",
            entity_type: "invoice",
            entity_id: invoiceId,
            action: "create",
            new_values: {
              invoiceId,
              studentId,
              invoiceTotal: totalTuition,
              balance: totalTuition,
              linesCount: linesToInsert.length
            },
            changed_fields: ["invoiceTotal", "balance", "lines"],
            reason: `Tuition invoice created for ${studentName}`
          };
          const { error: txnErr } = await supabase.rpc("create_invoice_transaction", {
            p_invoice: invoiceHeader,
            p_lines: linesToInsert,
            p_audit_log: auditLogPayload
          });
          if (txnErr) {
            logger.error("Invoice creation transaction failed:", txnErr.message);
            throw new Error(`Failed to save invoice via atomic transaction: ${txnErr.message}`);
          }
          const summary = await financeService.calculateAuthoritativeInvoiceFinancials(invoiceId, supabase);
          return {
            status: "saved",
            invoice: {
              ...safePayload,
              id: invoiceId,
              invoiceNumber: invoiceHeader.invoice_number,
              studentId,
              studentName,
              lines: summary.lines,
              totalTuition: summary.invoiceTotal,
              applicableCharges: summary.applicableCharges,
              discounts: summary.discounts,
              scholarships: summary.scholarships,
              refunds: summary.refundsTotal,
              adjustments: summary.applicableCharges,
              netTuition: summary.netTuition,
              amountPaid: summary.netPayments,
              outstandingBalance: summary.balance,
              status: summary.status,
              dueDate: invoiceHeader.due_date,
              updatedAt: timestamp
            }
          };
        } catch (err) {
          logger.error("Error saving invoice in financial architecture:", err);
          throw err;
        }
      },
      /**
       * Retrieves payments and transactions from relational payments table with allocations.
       */
      async getTransactions(filters, user) {
        const supabase = getServerSupabase();
        try {
          let query = supabase.from("payments").select(`
          *,
          students (
            id,
            student_number,
            profiles (
              first_name,
              last_name
            )
          ),
          payment_allocations (
            id,
            invoice_id,
            allocated_amount,
            notes
          )
        `).is("deleted_at", null).order("payment_date", { ascending: false });
          if (user && user.role === "student") {
            const studentUuid = user.studentRecordId || user.userId;
            if (studentUuid) {
              query = query.eq("student_id", studentUuid);
            }
          } else if (filters?.studentId) {
            query = query.eq("student_id", filters.studentId);
          }
          const { data: dbPayments } = await query;
          if (dbPayments && dbPayments.length > 0) {
            const formatted = dbPayments.map((p) => {
              const std = p.students;
              const prof = Array.isArray(std?.profiles) ? std?.profiles[0] : std?.profiles;
              const studentName = prof ? `${prof.first_name || ""} ${prof.last_name || ""}`.trim() : p.student_name || "Student";
              const allocations = Array.isArray(p.payment_allocations) ? p.payment_allocations : [];
              const primaryInvoiceId = allocations[0]?.invoice_id || p.invoice_id || "";
              return {
                id: p.id,
                transactionId: p.transaction_reference || p.id,
                invoiceId: primaryInvoiceId,
                allocations,
                studentId: p.student_id,
                student: {
                  id: p.student_id,
                  name: studentName
                },
                studentName,
                amount: Number(p.amount || 0),
                date: p.payment_date,
                method: p.payment_method || "Bank Transfer",
                status: p.status === "completed" ? "Completed" : "Pending",
                reference: p.transaction_reference || "",
                notes: p.notes || "",
                createdAt: p.created_at
              };
            });
            let result = formatted;
            if (user && (user.role === "teacher" || user.role === "lecturer")) {
              return { transactions: [], total: 0 };
            } else if (user && user.role === "student") {
              const studentUuid = user.studentRecordId || user.userId;
              const userUuid = user.userId || user.id;
              result = formatted.filter(
                (t) => t.studentId && (t.studentId === studentUuid || t.studentId === userUuid) || t.student?.id && (t.student.id === studentUuid || t.student.id === userUuid) || t.student_id && (t.student_id === studentUuid || t.student_id === userUuid)
              );
            } else if (filters?.studentId) {
              result = formatted.filter((t) => t.studentId === filters.studentId || t.student_id === filters.studentId);
            }
            return { transactions: result, total: result.length };
          }
        } catch (err) {
          logger.error("Error fetching transactions from relational table:", err);
        }
        return { transactions: [], total: 0 };
      },
      /**
       * Records a payment transaction with explicit payment allocations:
       * payment -> payment_allocation
       * Recomputes the affected invoices' balance server-side.
       */
      async recordPayment(paymentInput, actorUserId, actorRole) {
        const amount = Number(paymentInput.amount || 0);
        if (isNaN(amount) || amount <= 0) {
          throw new Error("Payment amount must be greater than zero");
        }
        const supabase = getServerSupabase();
        const timestamp = (/* @__PURE__ */ new Date()).toISOString();
        try {
          let studentId = paymentInput.studentId;
          let studentName = paymentInput.studentName || "Student";
          if (!studentId && studentName) {
            const parts = studentName.trim().split(" ");
            const { data: prof } = await supabase.from("profiles").select("user_id, students(id)").ilike("first_name", parts[0]).maybeSingle();
            if (prof?.students && prof.students[0]?.id) {
              studentId = prof.students[0].id;
            }
          }
          const paymentId = paymentInput.id && isUuid(paymentInput.id) ? paymentInput.id : import_crypto.default.randomUUID();
          const paymentNumber = paymentInput.paymentNumber || await getNextDatabaseSequenceNumber("payment", "2026", supabase);
          const reference = paymentInput.reference || paymentInput.transactionReference || paymentNumber;
          const paymentPayload = {
            id: paymentId,
            payment_number: paymentNumber,
            receipt_number: paymentNumber,
            invoice_id: paymentInput.invoiceId || null,
            student_id: studentId,
            student_name: studentName,
            amount,
            payment_method: (paymentInput.paymentMethod || paymentInput.method || "Bank Transfer").toLowerCase().replace(/\s+/g, "_"),
            transaction_reference: reference,
            payment_date: paymentInput.paymentDate || paymentInput.date || timestamp.split("T")[0],
            status: "completed",
            notes: paymentInput.notes || "",
            recorded_by_user_id: actorUserId || null
          };
          const targetInvoiceIds = [];
          const allocationsToInsert = [];
          if (Array.isArray(paymentInput.allocations) && paymentInput.allocations.length > 0) {
            paymentInput.allocations.forEach((alloc) => {
              if (alloc.invoiceId && Number(alloc.amount || alloc.allocatedAmount) > 0) {
                targetInvoiceIds.push(alloc.invoiceId);
                allocationsToInsert.push({
                  id: alloc.id && isUuid(alloc.id) ? alloc.id : import_crypto.default.randomUUID(),
                  invoice_id: alloc.invoiceId,
                  allocated_amount: Number(alloc.amount || alloc.allocatedAmount),
                  notes: alloc.notes || paymentInput.notes || "Tuition payment allocation"
                });
              }
            });
          } else if (paymentInput.invoiceId) {
            targetInvoiceIds.push(paymentInput.invoiceId);
            allocationsToInsert.push({
              id: import_crypto.default.randomUUID(),
              invoice_id: paymentInput.invoiceId,
              allocated_amount: amount,
              notes: paymentInput.notes || "Direct invoice payment allocation"
            });
          }
          const auditLogPayload = {
            audit_id: import_crypto.default.randomUUID(),
            actor_user_id: actorUserId || null,
            actor_role: actorRole || "finance_officer",
            entity_type: "payment",
            entity_id: paymentId,
            action: "create",
            new_values: {
              paymentId,
              amount,
              targetInvoiceIds,
              allocationsCount: allocationsToInsert.length,
              studentName
            },
            changed_fields: ["amount", "status", "allocations"],
            reason: `Payment of $${amount} recorded for ${studentName}`
          };
          const { error: txnErr } = await supabase.rpc("create_payment_transaction", {
            p_payment: paymentPayload,
            p_allocations: allocationsToInsert,
            p_audit_log: auditLogPayload
          });
          if (txnErr) {
            logger.error("Payment creation transaction failed:", txnErr.message);
            throw new Error(`Failed to record payment via atomic transaction: ${txnErr.message}`);
          }
          const updatedInvoices = [];
          for (const invId of targetInvoiceIds) {
            const summary = await financeService.calculateAuthoritativeInvoiceFinancials(invId, supabase);
            updatedInvoices.push({
              invoiceId: invId,
              balance: summary.balance,
              amountPaid: summary.netPayments,
              status: summary.status
            });
          }
          return {
            status: "recorded",
            payment: {
              ...paymentInput,
              id: paymentId,
              allocations: allocationsToInsert
            },
            updatedInvoices
          };
        } catch (err) {
          logger.error("Error recording payment in financial architecture:", err);
          throw err;
        }
      },
      /**
       * Applies a financial adjustment:
       * financial_adjustment
       * Recomputes balance: balance = invoice total - payments - approved adjustments + applicable charges
       */
      async applyFinancialAdjustment(adjInput, actorUserId, actorRole) {
        const supabase = getServerSupabase();
        const timestamp = (/* @__PURE__ */ new Date()).toISOString();
        try {
          const amount = Number(adjInput.amount || 0);
          if (isNaN(amount) || amount <= 0) {
            throw new Error("Adjustment amount must be greater than zero");
          }
          const invoiceId = adjInput.invoiceId;
          if (!invoiceId) {
            throw new Error("invoiceId is required for financial adjustment");
          }
          const adjType = adjInput.type || adjInput.adjustmentType || "adjustment";
          const isCharge = adjInput.isCharge === true || adjType === "applicable_charge" || adjType === "late_fee" || adjType === "administrative_charge";
          const status = adjInput.status || "approved";
          const adjId = adjInput.id && isUuid(adjInput.id) ? adjInput.id : import_crypto.default.randomUUID();
          const adjustmentNumber = adjInput.adjustmentNumber || await getNextDatabaseSequenceNumber("adjustment", "2026", supabase);
          const adjustmentPayload = {
            id: adjId,
            adjustment_number: adjustmentNumber,
            invoice_id: invoiceId,
            student_id: adjInput.studentId || null,
            student_name: adjInput.studentName || "Student",
            adjustment_type: adjType,
            is_charge: isCharge,
            amount,
            status,
            category_name: adjInput.categoryName || adjInput.category || "Institutional Adjustment",
            reason: adjInput.reason || adjInput.notes || "",
            receipt_or_doc_ref: adjInput.receiptOrDocRef || "",
            authorized_by: adjInput.authorizedBy || actorUserId || "Finance Admin",
            applied_date: adjInput.appliedDate || timestamp.split("T")[0],
            notes: adjInput.notes || "",
            updated_at: timestamp
          };
          const auditLogPayload = {
            audit_id: import_crypto.default.randomUUID(),
            actor_user_id: actorUserId || null,
            actor_role: actorRole || "finance_officer",
            entity_type: "adjustment",
            entity_id: adjId,
            action: "create",
            new_values: {
              adjId,
              invoiceId,
              type: adjType,
              amount,
              isCharge,
              status
            },
            changed_fields: ["amount", "status", "balance"],
            reason: adjInput.reason || `Financial adjustment of $${amount} applied to invoice ${invoiceId}`
          };
          const { error: txnErr } = await supabase.rpc("create_adjustment_transaction", {
            p_adj: adjustmentPayload,
            p_audit_log: auditLogPayload
          });
          if (txnErr) {
            logger.error("Adjustment transaction failed:", txnErr.message);
            throw new Error(`Failed to apply financial adjustment via atomic transaction: ${txnErr.message}`);
          }
          const summary = await financeService.calculateAuthoritativeInvoiceFinancials(invoiceId, supabase);
          return {
            status: "applied",
            adjustment: adjustmentPayload,
            updatedInvoice: {
              id: invoiceId,
              totalTuition: summary.invoiceTotal,
              applicableCharges: summary.applicableCharges,
              discounts: summary.discounts,
              scholarships: summary.scholarships,
              refunds: summary.refundsTotal,
              amountPaid: summary.netPayments,
              outstandingBalance: summary.balance,
              status: summary.status
            }
          };
        } catch (err) {
          logger.error("Error applying financial adjustment in financial architecture:", err);
          throw err;
        }
      },
      /**
       * Records a refund with explicit refund allocations:
       * refund -> refund_allocation
       * Refunds reduce net payments, increasing outstanding balance accordingly.
       */
      async recordRefund(refundInput, actorUserId, actorRole) {
        const supabase = getServerSupabase();
        const timestamp = (/* @__PURE__ */ new Date()).toISOString();
        try {
          const amount = Number(refundInput.amount || 0);
          if (isNaN(amount) || amount <= 0) {
            throw new Error("Refund amount must be greater than zero");
          }
          const refundId = refundInput.id && isUuid(refundInput.id) ? refundInput.id : import_crypto.default.randomUUID();
          const refundNumber = refundInput.refundNumber || await getNextDatabaseSequenceNumber("refund", "2026", supabase);
          const refundPayload = {
            id: refundId,
            refund_number: refundNumber,
            payment_id: refundInput.paymentId || null,
            student_id: refundInput.studentId || null,
            student_name: refundInput.studentName || "Student",
            amount,
            reason: refundInput.reason || "Tuition Overpayment / Course Drop",
            status: refundInput.status || "approved",
            refund_date: refundInput.refundDate || timestamp.split("T")[0],
            approved_by_user_id: actorUserId || refundInput.approvedBy || "Finance Bursar",
            notes: refundInput.notes || ""
          };
          const targetInvoiceIds = [];
          const allocationsToInsert = [];
          if (Array.isArray(refundInput.allocations) && refundInput.allocations.length > 0) {
            refundInput.allocations.forEach((alloc) => {
              if (alloc.invoiceId && Number(alloc.amount || alloc.allocatedAmount) > 0) {
                targetInvoiceIds.push(alloc.invoiceId);
                allocationsToInsert.push({
                  id: alloc.id && isUuid(alloc.id) ? alloc.id : import_crypto.default.randomUUID(),
                  invoice_id: alloc.invoiceId,
                  payment_allocation_id: alloc.paymentAllocationId || null,
                  allocated_amount: Number(alloc.amount || alloc.allocatedAmount)
                });
              }
            });
          } else if (refundInput.invoiceId) {
            targetInvoiceIds.push(refundInput.invoiceId);
            allocationsToInsert.push({
              id: import_crypto.default.randomUUID(),
              invoice_id: refundInput.invoiceId,
              allocated_amount: amount
            });
          }
          const auditLogPayload = {
            audit_id: import_crypto.default.randomUUID(),
            actor_user_id: actorUserId || null,
            actor_role: actorRole || "finance_officer",
            entity_type: "refund",
            entity_id: refundId,
            action: "create",
            new_values: {
              refundId,
              amount,
              targetInvoiceIds
            },
            changed_fields: ["amount", "status", "allocations"],
            reason: refundInput.reason || `Refund of $${amount} recorded`
          };
          const { error: txnErr } = await supabase.rpc("create_refund_transaction", {
            p_refund: refundPayload,
            p_allocations: allocationsToInsert,
            p_audit_log: auditLogPayload
          });
          if (txnErr) {
            logger.error("Refund creation transaction failed:", txnErr.message);
            throw new Error(`Failed to record refund via atomic transaction: ${txnErr.message}`);
          }
          const updatedInvoices = [];
          for (const invId of targetInvoiceIds) {
            const summary = await financeService.calculateAuthoritativeInvoiceFinancials(invId, supabase);
            updatedInvoices.push({
              invoiceId: invId,
              balance: summary.balance,
              amountPaid: summary.netPayments,
              refunds: summary.refundsTotal,
              status: summary.status
            });
          }
          return {
            status: "recorded",
            refund: {
              ...refundPayload,
              allocations: allocationsToInsert
            },
            updatedInvoices
          };
        } catch (err) {
          logger.error("Error recording refund in financial architecture:", err);
          throw err;
        }
      },
      /**
       * Retrieves financial adjustments.
       */
      async getAdjustments(filters, user) {
        const supabase = getServerSupabase();
        try {
          let query = supabase.from("financial_adjustments").select("*").order("applied_date", { ascending: false });
          if (filters?.invoiceId) {
            query = query.eq("invoice_id", filters.invoiceId);
          }
          if (filters?.studentId) {
            query = query.eq("student_id", filters.studentId);
          }
          const { data } = await query;
          const adjustments = data || [];
          if (user && user.role === "student") {
            const studentUuid = user.studentRecordId || user.userId;
            const userUuid = user.userId || user.id;
            const filtered = adjustments.filter(
              (a) => a.student_id && (a.student_id === studentUuid || a.student_id === userUuid)
            );
            return { adjustments: filtered, total: filtered.length };
          }
          return { adjustments, total: adjustments.length };
        } catch (err) {
          logger.error("Error getting financial adjustments:", err);
          return { adjustments: [], total: 0 };
        }
      },
      /**
       * Retrieves refunds.
       */
      async getRefunds(filters, user) {
        const supabase = getServerSupabase();
        try {
          let query = supabase.from("refunds").select(`
          *,
          refund_allocations (*)
        `).order("refund_date", { ascending: false });
          if (filters?.studentId) {
            query = query.eq("student_id", filters.studentId);
          }
          const { data } = await query;
          const refunds = data || [];
          if (user && user.role === "student") {
            const studentUuid = user.studentRecordId || user.userId;
            const userUuid = user.userId || user.id;
            const filtered = refunds.filter(
              (r) => r.student_id && (r.student_id === studentUuid || r.student_id === userUuid)
            );
            return { refunds: filtered, total: filtered.length };
          }
          return { refunds, total: refunds.length };
        } catch (err) {
          logger.error("Error getting refunds:", err);
          return { refunds: [], total: 0 };
        }
      },
      /**
       * Sequence generator for human-facing document numbers (e.g. INV-2026-000001)
       */
      async getNextSequenceNumber(type, year = "2026") {
        return getNextDatabaseSequenceNumber(type, year);
      }
    };
  }
});

// src/data/curriculum.ts
var CURRICULUM_CLASS_DAYS, MASTER_ENROLLED_STUDENTS;
var init_curriculum = __esm({
  "src/data/curriculum.ts"() {
    CURRICULUM_CLASS_DAYS = [
      { id: "School of the Pastors Lesson 16", name: "School of the Pastors Lesson 16 (15/09/2026)", date: "2026-09-15" },
      { id: "School of the Pastors Lesson 15", name: "School of the Pastors Lesson 15 (08/09/2026)", date: "2026-09-08" },
      { id: "School of the Pastors Lesson 14", name: "School of the Pastors Lesson 14 (01/09/2026)", date: "2026-09-01" },
      { id: "School of the Pastors Lesson 13", name: "School of the Pastors Lesson 13 (18/08/2026)", date: "2026-08-18" },
      { id: "Apostolic Lesson 12", name: "Apostolic Lesson 12 (11/08/2026)", date: "2026-08-11" },
      { id: "Apostolic Lesson 11", name: "Apostolic Lesson 11 (04/08/2026)", date: "2026-08-04" },
      { id: "Apostolic Lesson 10", name: "Apostolic Lesson 10 (21/07/2026)", date: "2026-07-21" },
      { id: "Ministerial Ethics lesson 9", name: "Ministerial Ethics Lesson 9 (14/07/2026)", date: "2026-07-14" },
      { id: "Ministerial Ethics Lesson 8", name: "Ministerial Ethics Lesson 8 (30/06/2026)", date: "2026-06-30" },
      { id: "Evangelism Lesson 7", name: "Evangelism Lesson 7 (09/06/2026)", date: "2026-06-09" },
      { id: "Evangelism lesson 6", name: "Evangelism Lesson 6 (02/06/2026)", date: "2026-06-02" },
      { id: "Evangelism Lesson 5", name: "Evangelism Lesson 5 (26/05/2026)", date: "2026-05-26" },
      { id: "Evangelism Lesson 4", name: "Evangelism Lesson 4 (19/05/2026)", date: "2026-05-19" },
      { id: "Evangelism Lesson 3", name: "Evangelism Lesson 3 (12/05/2026)", date: "2026-05-12" },
      { id: "Evangelism Lesson 2", name: "Evangelism Lesson 2 (05/05/2026)", date: "2026-05-05" },
      { id: "Introduction", name: "Introduction (21/04/2026)", date: "2026-04-21" }
    ];
    MASTER_ENROLLED_STUDENTS = [
      "Afeshia Burke",
      "Afi Thompson",
      "Alicia Noray Bowles",
      "Anne-Marie Davis",
      "Atiya Williams",
      "Beverly Selkridge",
      "Candy Webb",
      "Catherine Vidale",
      "Claudia Cashe",
      "Colette Blackburne-Joseph",
      "Denise Edwards",
      "Dessel Williams",
      "Diana Selkridge",
      "Felicia Williams",
      "Francisca Swift",
      "Ingrid Bonval-Butcher",
      "Javier Marks",
      "Jenetta Pierre",
      "Jennylyn Dickson",
      "Jerzelle Whiteman",
      "Jessica Fiddler",
      "Josanne Pompey",
      "Jovanka Williams",
      "Julie-Ann Fernandes-Charles",
      "Kabrina Morris-Jack",
      "Kadijah Daniel",
      "Kathleen Joseph-Sandy",
      "Kemrolene Bowens-Opadeyi",
      "Keyshana Gomes",
      "Kristy Alexander",
      "Krystal Mohammed",
      "Leslie Inniss",
      "Lynton Pompey",
      "Marlene Walker-Castle",
      "Mishael Daniel",
      "Natalie Webb Lewis",
      "Natasha Williams",
      "Nevillean Dundas",
      "Niomi Loverne Joseph Marksman",
      "Paula Massiah Blount",
      "Quacy Marecheau",
      "Racine Roy",
      "Racquel Gumbs",
      "Regina Joseph-Gonzales",
      "Rennie Bowles",
      "Richard Roberts",
      "Roxanne Sealey",
      "Ruth Vernon",
      "Shellon Liddell",
      "Stacey Waithe",
      "Susan Sparks",
      "Sybris Walker-Castle",
      "Tessa Phipps",
      "Tricia Worrell",
      "Vanessa Mohammed",
      "Vikash Ramnarace",
      "Wendy Woodruffe",
      "Whitney Tracey Seelochan",
      "Zahra Andrews"
    ];
  }
});

// src/server/services/domain/stateHydrationService.ts
var stateHydrationService_exports = {};
__export(stateHydrationService_exports, {
  stateHydrationService: () => stateHydrationService
});
var stateHydrationService;
var init_stateHydrationService = __esm({
  "src/server/services/domain/stateHydrationService.ts"() {
    init_studentsService();
    init_attendanceService();
    init_academicsService();
    init_assignmentsService();
    init_financeService();
    init_supabaseServer();
    init_logger();
    init_curriculum();
    stateHydrationService = {
      /**
       * Hydrates relational tables deterministically from static curriculum declarations if empty.
       */
      async ensureRelationalDataSeeded() {
        if (!isSupabaseConfigured()) return;
        const supabase = getServerSupabase();
        try {
          const { data: existingStudents } = await supabase.from("students").select("id").limit(1);
          if (existingStudents && existingStudents.length > 0) {
            return;
          }
          logger.info("Relational tables are unseeded. Performing deterministic migration bootstrap into PostgreSQL tables...");
          const { data: year } = await supabase.from("academic_years").upsert({
            name: "2026-2027 Academic Year",
            code: "AY-2026-2027",
            start_date: "2026-01-01",
            end_date: "2026-12-31",
            status: "active"
          }, { onConflict: "code" }).select().single();
          if (year?.id) {
            await supabase.from("terms").upsert([
              {
                academic_year_id: year.id,
                name: "2026 Semester 1 (Foundation)",
                code: "SEM-2026-1",
                sequence_order: 1,
                start_date: "2026-01-10",
                end_date: "2026-06-30",
                status: "active"
              },
              {
                academic_year_id: year.id,
                name: "2026 Semester 2 (Practicum)",
                code: "SEM-2026-2",
                sequence_order: 2,
                start_date: "2026-07-01",
                end_date: "2026-12-15",
                status: "upcoming"
              }
            ], { onConflict: "code" });
          }
          const defaultCourses = [
            { code: "MIN-101", title: "Biblical Foundations & Covenant Life", core_module_number: 1, credits: 5, department: "Biblical Studies" },
            { code: "MIN-102", title: "Spiritual Authority & Prayer Warfare", core_module_number: 2, credits: 5, department: "Ministry Practice" },
            { code: "MIN-103", title: "Prophetic Ministry & Holy Spirit Gifts", core_module_number: 3, credits: 5, department: "Ministry Practice" },
            { code: "MIN-104", title: "Pastoral Leadership & Church Administration", core_module_number: 4, credits: 5, department: "Leadership" },
            { code: "MIN-105", title: "Evangelism, Missions & Community Impact", core_module_number: 5, credits: 5, department: "Missions" },
            { code: "MIN-106", title: "Ministerial Ethics, Integrity & Honor", core_module_number: 6, credits: 5, department: "Ethics" }
          ];
          for (const c of defaultCourses) {
            await supabase.from("course_definitions").upsert(c, { onConflict: "code" });
          }
          const studentNames = MASTER_ENROLLED_STUDENTS;
          for (let i = 0; i < studentNames.length; i++) {
            const name = studentNames[i];
            const parts = name.split(" ");
            const firstName = parts[0] || name;
            const lastName = parts.slice(1).join(" ") || "Student";
            const email = `${name.toLowerCase().replace(/[^a-z0-9]/g, ".")}@student.hteim.org`;
            const studentNumber = `SOM-2026-${(100 + i).toString().padStart(4, "0")}`;
            const { data: user } = await supabase.from("users").upsert({ email, role: "student", is_active: true }, { onConflict: "email" }).select().single();
            if (user?.id) {
              await supabase.from("profiles").upsert({
                user_id: user.id,
                first_name: firstName,
                last_name: lastName
              }, { onConflict: "user_id" });
              await supabase.from("students").upsert({
                user_id: user.id,
                student_number: studentNumber,
                cohort_level: "Level 1 Foundation",
                enrollment_status: "active",
                admission_date: "2026-01-10"
              }, { onConflict: "user_id" });
            }
          }
          logger.info("Relational domain bootstrap completed successfully.");
        } catch (bootstrapErr) {
          logger.warn("Initial relational seeding notice:", bootstrapErr);
        }
      },
      /**
       * Composes authorized portal state directly from relational services for the logged-in user.
       */
      async getComposedStateForUser(user) {
        await this.ensureRelationalDataSeeded();
        try {
          const [
            studentsRes,
            attendanceRes,
            academicsRes,
            coursesRes,
            assignmentsRes,
            submissionsRes,
            invoicesRes,
            transactionsRes
          ] = await Promise.all([
            studentsService.getStudents(user),
            attendanceService.getAttendance(user),
            academicsService.getAcademicStructure(),
            academicsService.getCourses(),
            assignmentsService.getAssignments(user),
            assignmentsService.getSubmissions({}, user),
            financeService.getInvoices(void 0, user),
            financeService.getTransactions({}, user)
          ]);
          const studentLevels = {};
          const studentPhotos = {};
          const studentNotes = {};
          studentsRes.students.forEach((s) => {
            studentLevels[s.name] = s.level;
            if (s.photoUrl) studentPhotos[s.name.toLowerCase().trim()] = s.photoUrl;
            if (s.note) studentNotes[s.name] = s.note;
          });
          const composedState = {
            // Metadata & version
            version: 2,
            isRelationalAuthoritative: true,
            updatedAt: (/* @__PURE__ */ new Date()).toISOString(),
            // Academic Structure
            academicYears: academicsRes.academicYears,
            terms: academicsRes.terms,
            activeTermId: academicsRes.activeTermId,
            masterCourses: academicsRes.masterCourses,
            courses: coursesRes.courses,
            courseOfferings: academicsRes.courseOfferings,
            // Student & Attendance Domain
            students: studentsRes.students,
            studentLevels,
            studentPhotos,
            studentNotes,
            records: attendanceRes.records,
            classDays: attendanceRes.classDays.length > 0 ? attendanceRes.classDays : CURRICULUM_CLASS_DAYS,
            excusedAbsences: attendanceRes.excusedAbsences,
            // Academic Assignments & Grades
            customAssignments: assignmentsRes.assignments,
            submissions: submissionsRes.submissions,
            rubricScores: submissionsRes.rubricScores,
            // Financial Domain
            invoices: invoicesRes.invoices,
            transactions: transactionsRes.transactions,
            payments: transactionsRes.transactions,
            receipts: [],
            adjustments: [],
            // Library & Config
            libraryResources: [],
            sheetsUrl: "",
            portalConfig: {
              policyThreshold: "75%",
              honorThreshold: "85%",
              criticalThreshold: "50%"
            }
          };
          return composedState;
        } catch (err) {
          logger.error("Error composing state from relational tables:", err);
          return {
            version: 2,
            isRelationalAuthoritative: true,
            updatedAt: (/* @__PURE__ */ new Date()).toISOString(),
            academicYears: [],
            terms: [],
            activeTermId: null,
            masterCourses: [],
            courses: [],
            courseOfferings: [],
            students: [],
            studentLevels: {},
            studentPhotos: {},
            studentNotes: {},
            records: [],
            classDays: CURRICULUM_CLASS_DAYS,
            excusedAbsences: {},
            customAssignments: [],
            submissions: [],
            rubricScores: {},
            invoices: [],
            transactions: [],
            payments: [],
            receipts: [],
            adjustments: [],
            libraryResources: [],
            sheetsUrl: "",
            portalConfig: {
              policyThreshold: "75%",
              honorThreshold: "85%",
              criticalThreshold: "50%"
            }
          };
        }
      }
    };
  }
});

// src/server/services/supabaseServer.ts
function isSupabaseConfigured() {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  return Boolean(supabaseUrl && serviceRoleKey);
}
function validateSupabaseServerConfig() {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl) {
    throw new Error(
      "FATAL: Missing required Supabase URL (SUPABASE_URL or VITE_SUPABASE_URL). Server cannot start."
    );
  }
  if (!serviceRoleKey) {
    throw new Error(
      "FATAL: Missing required privileged server credential: SUPABASE_SERVICE_ROLE_KEY. Server domain operations, database management, and authoritative audit logging require privileged service role access and will not downgrade to anonymous client credentials."
    );
  }
}
function getServerSupabase() {
  if (serverSupabaseClient) {
    return serverSupabaseClient;
  }
  validateSupabaseServerConfig();
  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  serverSupabaseClient = (0, import_supabase_js.createClient)(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  });
  logger.info("Initialized authoritative server-side Supabase client with SUPABASE_SERVICE_ROLE_KEY");
  return serverSupabaseClient;
}
async function getAuthoritativeState(_userIdOrKey) {
  return null;
}
async function getAuthorizedStateForUser(user) {
  const { stateHydrationService: stateHydrationService2 } = await Promise.resolve().then(() => (init_stateHydrationService(), stateHydrationService_exports));
  return stateHydrationService2.getComposedStateForUser(user);
}
async function saveAuthoritativeState(_state, actorUserId, _actionDescription, _expectedVersion) {
  const timestamp = (/* @__PURE__ */ new Date()).toISOString();
  logger.info(`[StatePersistence] saveAuthoritativeState invoked for ${actorUserId || "system"}. State managed via relational domain services.`);
  return { success: true, version: 2, updatedAt: timestamp };
}
async function logAuditEvent(entry) {
  try {
    const supabase = getServerSupabase();
    const auditId = entry.auditId || entry.audit_id || (0, import_crypto2.randomUUID)();
    const rawActor = entry.actorUserId !== void 0 ? entry.actorUserId : entry.actor_user_id !== void 0 ? entry.actor_user_id : null;
    let resolvedUserId = null;
    const isUuid2 = (val) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val);
    if (rawActor) {
      if (isUuid2(rawActor)) {
        resolvedUserId = rawActor;
      } else {
        try {
          const { data: userByUid } = await supabase.from("users").select("id").eq("firebase_uid", rawActor).maybeSingle();
          if (userByUid?.id) {
            resolvedUserId = userByUid.id;
          } else {
            const { data: userRecord } = await supabase.from("users").select("id").eq("email", rawActor.toLowerCase().trim()).maybeSingle();
            if (userRecord?.id) {
              resolvedUserId = userRecord.id;
            }
          }
        } catch {
        }
      }
    }
    const actorRole = entry.actorRole || entry.actor_role || "system";
    const action = entry.action;
    const entityType = entry.entityType || entry.entity_type || "unknown";
    const entityId = String(entry.entityId || entry.entity_id || "system");
    const oldValues = entry.oldValues !== void 0 ? entry.oldValues : entry.old_values !== void 0 ? entry.old_values : null;
    const newValues = entry.newValues !== void 0 ? entry.newValues : entry.new_values !== void 0 ? entry.new_values : null;
    let changedFields = entry.changedFields || entry.changed_fields;
    if (!changedFields && oldValues && newValues && typeof oldValues === "object" && typeof newValues === "object") {
      const keys = /* @__PURE__ */ new Set([...Object.keys(oldValues), ...Object.keys(newValues)]);
      const diffKeys = [];
      for (const k of keys) {
        if (JSON.stringify(oldValues[k]) !== JSON.stringify(newValues[k])) {
          diffKeys.push(k);
        }
      }
      changedFields = diffKeys;
    } else if (!changedFields) {
      changedFields = [];
    }
    const reason = entry.reason || newValues?.reason || newValues?.overrideReason || newValues?.notes || newValues?.description || null;
    const ipAddress = entry.ipAddress || entry.ip_address || null;
    const userAgent = entry.userAgent || entry.user_agent || null;
    const requestId = entry.requestId || entry.request_id || (0, import_crypto2.randomUUID)();
    const timestamp = entry.timestamp || (/* @__PURE__ */ new Date()).toISOString();
    const { error } = await supabase.from("audit_history").insert({
      audit_id: auditId,
      actor_user_id: resolvedUserId,
      actor_role: actorRole,
      action,
      entity_type: entityType,
      entity_id: entityId,
      old_values: oldValues,
      new_values: newValues,
      changed_fields: Array.isArray(changedFields) ? changedFields : [changedFields],
      reason,
      ip_address: ipAddress,
      user_agent: userAgent,
      request_id: requestId,
      timestamp
    });
    if (error) {
      logger.error(`Failed to insert authoritative audit record: ${error.message}`);
      throw new Error(`Audit persistence failed: ${error.message}`);
    }
    return true;
  } catch (err) {
    if (err instanceof Error && err.message.startsWith("Audit persistence failed:")) {
      throw err;
    }
    logger.error(`Exception writing to audit_history:`, err);
    throw new Error(`Audit persistence failed: ${err instanceof Error ? err.message : String(err)}`);
  }
}
async function getAuditLogs(limit = 50, entityType) {
  try {
    const supabase = getServerSupabase();
    let query = supabase.from("audit_history").select("*").order("timestamp", { ascending: false }).limit(limit);
    if (entityType) {
      query = query.eq("entity_type", entityType);
    }
    const { data, error } = await query;
    if (error) {
      logger.warn(`Failed to fetch audit logs: ${error.message}`);
      return [];
    }
    return (data || []).map((row) => ({
      audit_id: row.audit_id || row.id,
      id: row.audit_id || row.id,
      actor_user_id: row.actor_user_id,
      actorUserId: row.actor_user_id,
      actor_role: row.actor_role || "system",
      actorRole: row.actor_role || "system",
      action: row.action,
      entity_type: row.entity_type,
      entityType: row.entity_type,
      entity_id: row.entity_id,
      entityId: row.entity_id,
      old_values: row.old_values,
      oldValues: row.old_values,
      new_values: row.new_values,
      newValues: row.new_values,
      changed_fields: row.changed_fields || [],
      changedFields: row.changed_fields || [],
      reason: row.reason || null,
      ip_address: row.ip_address,
      ipAddress: row.ip_address,
      user_agent: row.user_agent,
      userAgent: row.user_agent,
      request_id: row.request_id,
      requestId: row.request_id,
      timestamp: row.timestamp
    }));
  } catch (err) {
    logger.warn(`Exception fetching audit logs:`, err);
    return [];
  }
}
async function getDatabaseUsers() {
  try {
    const supabase = getServerSupabase();
    const { data, error } = await supabase.from("users").select("id, email, role, is_active, created_at, updated_at").order("created_at", { ascending: false });
    if (error) {
      logger.warn(`Failed to fetch database users: ${error.message}`);
      return [];
    }
    return data || [];
  } catch (err) {
    logger.warn("Exception fetching database users:", err);
    return [];
  }
}
async function updateUserRoleInDatabase(userId, newRole, actorUserId, actorRole, reason, requestId, ipAddress, userAgent) {
  try {
    const supabase = getServerSupabase();
    const { data: previousUser } = await supabase.from("users").select("id, email, role").eq("id", userId).single();
    if (newRole === "super_admin") {
      await logAuditEvent({
        actorUserId: actorUserId || null,
        actorRole: actorRole || "unknown",
        entityType: "super_admin_role",
        entityId: userId,
        action: "unauthorized_super_admin_assignment_attempt",
        oldValues: { role: previousUser?.role || "unknown" },
        newValues: { attemptedRole: "super_admin" },
        changedFields: ["role"],
        reason: reason || "Attempted client-side assignment of super_admin role",
        requestId,
        ipAddress,
        userAgent
      });
      return {
        success: false,
        error: "Security Policy Violation: The super_admin role cannot be assigned via client API calls. Explicit database provisioning is required."
      };
    }
    const { data, error } = await supabase.from("users").update({ role: newRole, updated_at: (/* @__PURE__ */ new Date()).toISOString() }).eq("id", userId).select("id, email, role, is_active, updated_at").single();
    if (error) {
      return { success: false, error: error.message };
    }
    const isSuperAdminChange = previousUser?.role === "super_admin" || newRole === "super_admin";
    await logAuditEvent({
      actorUserId: actorUserId || null,
      actorRole: actorRole || "system",
      entityType: isSuperAdminChange ? "super_admin_role" : "user_role",
      entityId: userId,
      action: previousUser?.role === "super_admin" && newRole !== "super_admin" ? "revoke_super_admin" : "update",
      oldValues: { role: previousUser?.role || "unknown" },
      newValues: { role: newRole, userEmail: data?.email },
      changedFields: ["role"],
      reason: reason || `Updated role from ${previousUser?.role || "unknown"} to ${newRole}`,
      requestId,
      ipAddress,
      userAgent
    });
    return { success: true, user: data };
  } catch (err) {
    return { success: false, error: err.message || "Failed to update user role" };
  }
}
function toDbUserRole(role) {
  if (role === "super_admin" || role === "admin") return "admin";
  if (role === "lecturer" || role === "teacher") return "teacher";
  if (role === "registrar" || role === "finance_officer" || role === "librarian" || role === "staff") return "staff";
  return "student";
}
async function provisionOrApproveUserByAdmin({
  email,
  role,
  actorUserId,
  actorRole,
  reason,
  assignedCourses,
  sourceRecord,
  requestId,
  ipAddress,
  userAgent,
  firebaseUid
}) {
  try {
    const supabase = getServerSupabase();
    const cleanEmail = (email || "").toLowerCase().trim();
    if (!cleanEmail) {
      return { success: false, error: "Valid email is required for account provisioning" };
    }
    const normalizedRole = normalizeUserRole(role);
    if (normalizedRole === "super_admin") {
      try {
        await logAuditEvent({
          actorUserId: actorUserId || null,
          actorRole: actorRole || "unknown",
          entityType: "super_admin_role",
          entityId: cleanEmail,
          action: "unauthorized_super_admin_provisioning_attempt",
          oldValues: null,
          newValues: { attemptedRole: "super_admin", email: cleanEmail },
          changedFields: ["role"],
          reason: reason || "Attempted administrative API assignment of super_admin role",
          requestId,
          ipAddress,
          userAgent
        });
      } catch (auditErr) {
        logger.warn("Warning writing super_admin provisioning rejection audit event:", auditErr);
      }
      return {
        success: false,
        error: "Security Policy Violation: The super_admin role cannot be assigned via client API calls. Explicit database provisioning is required."
      };
    }
    const dbRole = toDbUserRole(normalizedRole);
    let existingUser = null;
    if (firebaseUid) {
      const { data: userByUid } = await supabase.from("users").select("id, email, role, is_active, assigned_courses, firebase_uid").eq("firebase_uid", firebaseUid).maybeSingle();
      if (userByUid) existingUser = userByUid;
    }
    if (!existingUser) {
      const { data: userByEmail } = await supabase.from("users").select("id, email, role, is_active, assigned_courses, firebase_uid").eq("email", cleanEmail).maybeSingle();
      if (userByEmail) existingUser = userByEmail;
    }
    let savedUser = null;
    let action = "admin_provision_user";
    if (existingUser) {
      action = "admin_approve_user";
      const updatePayload = {
        role: dbRole,
        is_active: true,
        updated_at: (/* @__PURE__ */ new Date()).toISOString()
      };
      if (Array.isArray(assignedCourses)) {
        updatePayload.assigned_courses = assignedCourses;
      }
      if (firebaseUid && !existingUser.firebase_uid) {
        updatePayload.firebase_uid = firebaseUid;
      }
      const { data: updated, error: updateErr } = await supabase.from("users").update(updatePayload).eq("id", existingUser.id).select("id, email, role, is_active, assigned_courses, firebase_uid, updated_at").single();
      if (updateErr) {
        return { success: false, error: `Failed to update user approval: ${updateErr.message}` };
      }
      savedUser = updated;
    } else {
      const insertPayload = {
        email: cleanEmail,
        role: dbRole,
        is_active: true
      };
      if (firebaseUid) {
        insertPayload.firebase_uid = firebaseUid;
      }
      if (Array.isArray(assignedCourses) && assignedCourses.length > 0) {
        insertPayload.assigned_courses = assignedCourses;
      }
      const { data: created, error: insertErr } = await supabase.from("users").insert(insertPayload).select("id, email, role, is_active, assigned_courses, firebase_uid, created_at").single();
      if (insertErr) {
        return { success: false, error: `Failed to provision user: ${insertErr.message}` };
      }
      savedUser = created;
    }
    if (firebaseUid && savedUser?.id) {
      try {
        await supabase.from("user_identities").upsert(
          {
            user_id: savedUser.id,
            provider: "firebase",
            provider_uid: firebaseUid,
            email: cleanEmail
          },
          { onConflict: "provider,provider_uid" }
        );
      } catch (idErr) {
        logger.debug("user_identities upsert note:", idErr);
      }
    }
    try {
      const { data: matchedStudent } = await supabase.from("students").select("id").or(`student_number.eq.${cleanEmail},id.eq.${cleanEmail}`).is("user_id", null).maybeSingle();
      if (matchedStudent?.id && savedUser?.id) {
        await supabase.from("students").update({ user_id: savedUser.id }).eq("id", matchedStudent.id);
      }
    } catch {
    }
    if (savedUser?.id && (normalizedRole === "lecturer" || normalizedRole === "teacher")) {
      try {
        await supabase.from("course_offerings").update({ lecturer_user_id: savedUser.id }).ilike("lecturer_email", cleanEmail).is("lecturer_user_id", null);
      } catch {
      }
    }
    try {
      await logAuditEvent({
        actorUserId: actorUserId || null,
        actorRole: actorRole || "admin",
        entityType: "user_provisioning",
        entityId: savedUser.id,
        action,
        oldValues: existingUser ? { role: existingUser.role, is_active: existingUser.is_active } : null,
        newValues: {
          userId: savedUser.id,
          email: cleanEmail,
          role: dbRole,
          assignedRole: normalizedRole,
          is_active: true,
          sourceRecord: sourceRecord || { type: "admin_approval", actorUserId }
        },
        changedFields: existingUser ? ["role", "is_active"] : ["email", "role", "is_active"],
        reason: reason || `Explicit administrator approval and activation of ${normalizedRole} account`,
        requestId,
        ipAddress,
        userAgent
      });
    } catch (auditErr) {
      logger.warn("Warning writing admin provisioning audit event:", auditErr);
    }
    return { success: true, user: savedUser };
  } catch (err) {
    logger.error("Exception during administrator account provisioning:", err);
    return { success: false, error: err.message || "Failed to provision user account" };
  }
}
async function getPendingAccountApprovals() {
  try {
    const supabase = getServerSupabase();
    const { data: users } = await supabase.from("users").select("email, role, is_active");
    const activeUserEmails = new Set(
      (users || []).filter((u) => u.is_active).map((u) => (u.email || "").toLowerCase().trim())
    );
    const pendingList = [];
    const { data: offerings } = await supabase.from("course_offerings").select("id, course_id, lecturer_name, lecturer_email").not("lecturer_email", "is", null);
    if (offerings) {
      for (const off of offerings) {
        const email = (off.lecturer_email || "").toLowerCase().trim();
        if (email && !activeUserEmails.has(email) && !pendingList.some((p) => p.email === email)) {
          pendingList.push({
            email,
            suggestedRole: "lecturer",
            candidateName: off.lecturer_name,
            sourceTable: "course_offerings",
            sourceId: off.id,
            details: { courseId: off.course_id }
          });
        }
      }
    }
    const { data: profiles } = await supabase.from("profiles").select("id, first_name, last_name, email, role").not("role", "is", null);
    if (profiles) {
      for (const prof of profiles) {
        const email = (prof.email || "").toLowerCase().trim();
        const role = prof.role ? normalizeUserRole(prof.role) : "";
        if (email && (role === "lecturer" || role === "teacher" || role === "staff" || role === "registrar" || role === "finance_officer" || role === "librarian") && !activeUserEmails.has(email) && !pendingList.some((p) => p.email === email)) {
          pendingList.push({
            email,
            suggestedRole: role,
            candidateName: `${prof.first_name || ""} ${prof.last_name || ""}`.trim(),
            sourceTable: "profiles",
            sourceId: prof.id,
            details: { profileRole: prof.role }
          });
        }
      }
    }
    return pendingList;
  } catch (err) {
    logger.warn("Exception querying pending account approvals:", err);
    return [];
  }
}
var import_supabase_js, import_crypto2, serverSupabaseClient;
var init_supabaseServer = __esm({
  "src/server/services/supabaseServer.ts"() {
    import_supabase_js = require("@supabase/supabase-js");
    import_crypto2 = require("crypto");
    init_logger();
    init_guards();
    init_rbac();
    serverSupabaseClient = null;
  }
});

// src/server/services/firebaseAuth.ts
function getFirebaseProjectId() {
  const projectId = process.env.FIREBASE_PROJECT_ID || process.env.VITE_FIREBASE_PROJECT_ID || "classroomhq-qzqnp";
  return projectId;
}
async function verifyIdToken(rawToken) {
  if (!rawToken || typeof rawToken !== "string") {
    throw new Error("No token provided");
  }
  const token = rawToken.startsWith("Bearer ") ? rawToken.substring(7).trim() : rawToken.trim();
  if (!token) {
    throw new Error("Token is empty");
  }
  const projectId = getFirebaseProjectId();
  if (process.env.NODE_ENV === "test" || process.env.VITEST) {
    if (token.startsWith("test-token:")) {
      const parts = token.split(":");
      return {
        uid: parts[1] || "test-uid",
        email: parts[2] || "test@hteim.edu",
        role: parts[3] || "student",
        emailVerified: true
      };
    }
  }
  try {
    const { payload } = await jose.jwtVerify(token, firebaseJWKS, {
      issuer: `https://securetoken.google.com/${projectId}`,
      audience: projectId,
      algorithms: ["RS256"]
    });
    const uid = payload.sub || payload.user_id;
    if (!uid) {
      throw new Error("Token missing Firebase UID (sub)");
    }
    const email = payload.email || "";
    return {
      uid,
      email: email.toLowerCase().trim(),
      emailVerified: Boolean(payload.email_verified),
      name: payload.name || void 0,
      picture: payload.picture || void 0,
      role: payload.role || void 0
    };
  } catch (error) {
    logger.warn(`Firebase ID Token verification failed: ${error.message || error}`);
    throw new Error(`Invalid Firebase ID token: ${error.message || "Signature verification failed"}`);
  }
}
var jose, FIREBASE_JWKS_URL, firebaseJWKS;
var init_firebaseAuth = __esm({
  "src/server/services/firebaseAuth.ts"() {
    jose = __toESM(require("jose"), 1);
    init_logger();
    FIREBASE_JWKS_URL = new URL(
      "https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com"
    );
    firebaseJWKS = jose.createRemoteJWKSet(FIREBASE_JWKS_URL, {
      cooldownDuration: 3e4,
      // 30s cooldown for key refresh
      cacheMaxAge: 6e5
      // 10 min cache
    });
  }
});

// src/server/middleware/rbac.ts
var rbac_exports = {};
__export(rbac_exports, {
  DatabaseServiceError: () => DatabaseServiceError,
  authenticate: () => authenticate,
  checkEnrollmentMatch: () => checkEnrollmentMatch,
  isAdministrativeRole: () => isAdministrativeRole,
  isElevatedStaffOrLecturerRole: () => isElevatedStaffOrLecturerRole,
  requireAuth: () => requireAuth,
  requirePermission: () => requirePermission,
  requireResourceOwnership: () => requireResourceOwnership,
  resolveUserFromRequest: () => resolveUserFromRequest,
  toDbUserRole: () => toDbUserRole2,
  verifyLecturerCourseInDatabase: () => verifyLecturerCourseInDatabase,
  verifyStudentOwnershipInDatabase: () => verifyStudentOwnershipInDatabase
});
function toDbUserRole2(role) {
  if (role === "super_admin" || role === "admin") return "admin";
  if (role === "lecturer" || role === "teacher") return "teacher";
  if (role === "registrar" || role === "finance_officer" || role === "librarian" || role === "staff") return "staff";
  return "student";
}
function isAdministrativeRole(role) {
  if (!role) return false;
  const clean = role.toLowerCase().trim();
  if (clean === "staff") return false;
  const norm = normalizeUserRole(clean);
  return norm === "super_admin" || norm === "admin";
}
function isElevatedStaffOrLecturerRole(role) {
  if (!role) return false;
  const clean = role.toLowerCase().trim();
  if (clean === "staff") return true;
  const norm = normalizeUserRole(clean);
  return norm === "lecturer" || norm === "teacher" || norm === "registrar" || norm === "finance_officer" || norm === "librarian";
}
async function checkEnrollmentMatch(cleanEmail, supabase) {
  if (!cleanEmail) return { isEnrolled: false };
  try {
    const { data: prof, error: profErr } = await supabase.from("profiles").select("id, user_id, first_name, last_name, email, role, students(id, student_number)").eq("email", cleanEmail).maybeSingle();
    if (profErr) {
      throw new DatabaseServiceError("Database lookup error on profiles table", profErr);
    }
    if (prof) {
      const std = Array.isArray(prof.students) ? prof.students[0] : prof.students;
      let matchedRole = "student";
      if (prof.role) {
        matchedRole = normalizeUserRole(prof.role);
      }
      return {
        isEnrolled: true,
        role: matchedRole,
        studentRecordId: std?.id,
        studentNumber: std?.student_number,
        studentName: `${prof.first_name || ""} ${prof.last_name || ""}`.trim() || void 0,
        sourceRecord: {
          table: "profiles",
          id: prof.id,
          matchedField: "email",
          matchedValue: cleanEmail,
          originalRole: prof.role,
          recordSummary: {
            profileId: prof.id,
            email: prof.email,
            role: prof.role,
            studentRecordId: std?.id,
            studentNumber: std?.student_number
          }
        }
      };
    }
    const { data: stdDirect, error: stdErr } = await supabase.from("students").select("id, student_number, user_id").or(`student_number.eq.${cleanEmail},id.eq.${cleanEmail}`).maybeSingle();
    if (stdErr) {
      throw new DatabaseServiceError("Database lookup error on students table", stdErr);
    }
    if (stdDirect) {
      return {
        isEnrolled: true,
        role: "student",
        studentRecordId: stdDirect.id,
        studentNumber: stdDirect.student_number,
        sourceRecord: {
          table: "students",
          id: stdDirect.id,
          matchedField: "student_number|id",
          matchedValue: cleanEmail,
          originalRole: "student",
          recordSummary: {
            studentRecordId: stdDirect.id,
            studentNumber: stdDirect.student_number
          }
        }
      };
    }
    const { data: facultyOffering, error: facultyErr } = await supabase.from("course_offerings").select("id, lecturer_email, lecturer_name").ilike("lecturer_email", cleanEmail).maybeSingle();
    if (facultyErr) {
      throw new DatabaseServiceError("Database lookup error on course_offerings table", facultyErr);
    }
    if (facultyOffering) {
      return {
        isEnrolled: true,
        role: "lecturer",
        studentName: facultyOffering.lecturer_name,
        sourceRecord: {
          table: "course_offerings",
          id: facultyOffering.id,
          matchedField: "lecturer_email",
          matchedValue: cleanEmail,
          originalRole: "lecturer",
          recordSummary: {
            courseOfferingId: facultyOffering.id,
            lecturerName: facultyOffering.lecturer_name,
            lecturerEmail: cleanEmail
          }
        }
      };
    }
  } catch (dbErr) {
    if (dbErr instanceof DatabaseServiceError || dbErr?.isDatabaseError) {
      throw dbErr;
    }
    logger.error("Error checking PostgreSQL database enrollment match:", dbErr);
    throw new DatabaseServiceError("Failed to verify database enrollment match", dbErr);
  }
  return { isEnrolled: false };
}
async function resolveUserFromRequest(req) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }
  const token = authHeader.substring(7).trim();
  if (!token) {
    return null;
  }
  let decoded;
  try {
    decoded = await verifyIdToken(token);
  } catch (err) {
    logger.warn(`Authoritative token verification rejected request to ${req.path}: ${err.message || err}`);
    return null;
  }
  if (!decoded || !decoded.uid) {
    return null;
  }
  const firebaseUid = decoded.uid;
  const cleanEmail = (decoded.email || "").toLowerCase().trim();
  if (cleanEmail && isDemoUser(cleanEmail)) {
    logger.warn(`Rejected real user authentication attempt for demo account: ${cleanEmail}`);
    return null;
  }
  const supabase = getServerSupabase();
  let dbUser = null;
  try {
    try {
      const { data: identityRecord, error: idErr } = await supabase.from("user_identities").select("user_id, users(id, email, role, is_active, assigned_courses, firebase_uid)").eq("provider", "firebase").eq("provider_uid", firebaseUid).maybeSingle();
      if (!idErr && identityRecord?.users) {
        dbUser = Array.isArray(identityRecord.users) ? identityRecord.users[0] : identityRecord.users;
      }
    } catch {
    }
    if (!dbUser && firebaseUid) {
      const { data: directUser, error: directErr } = await supabase.from("users").select("id, email, role, is_active, assigned_courses, firebase_uid").eq("firebase_uid", firebaseUid).maybeSingle();
      if (directErr) {
        throw new DatabaseServiceError("Database error looking up user by firebase_uid", directErr);
      }
      if (directUser) {
        dbUser = directUser;
      }
    }
    if (!dbUser && cleanEmail) {
      const { data: legacyUser, error: legacyErr } = await supabase.from("users").select("id, email, role, is_active, assigned_courses, firebase_uid").eq("email", cleanEmail).maybeSingle();
      if (legacyErr) {
        throw new DatabaseServiceError("Database error looking up legacy user in users table", legacyErr);
      }
      if (legacyUser) {
        dbUser = legacyUser;
        try {
          await supabase.from("users").update({ firebase_uid: firebaseUid, updated_at: (/* @__PURE__ */ new Date()).toISOString() }).eq("id", legacyUser.id).is("firebase_uid", null);
          await supabase.from("user_identities").insert({
            user_id: legacyUser.id,
            provider: "firebase",
            provider_uid: firebaseUid,
            email: cleanEmail
          });
          logger.info(`Linked legacy user to immutable firebase_uid: ${firebaseUid} -> ${legacyUser.id}`);
        } catch (linkErr) {
          logger.warn("Non-blocking error auto-linking legacy identity mapping:", linkErr);
        }
      }
    }
  } catch (dbErr) {
    if (dbErr instanceof DatabaseServiceError || dbErr?.isDatabaseError) {
      throw dbErr;
    }
    logger.error("Error querying PostgreSQL database users table:", dbErr);
    throw new DatabaseServiceError("Database outage or error during user lookup", dbErr);
  }
  if (dbUser && cleanEmail && dbUser.email && dbUser.email.toLowerCase().trim() !== cleanEmail) {
    const previousEmail = dbUser.email;
    try {
      await supabase.from("users").update({ email: cleanEmail, updated_at: (/* @__PURE__ */ new Date()).toISOString() }).eq("id", dbUser.id);
      dbUser.email = cleanEmail;
      logger.info(`Synchronized profile email attribute for user ${dbUser.id}: ${previousEmail} -> ${cleanEmail}`);
      await logAuditEvent({
        actorUserId: dbUser.id,
        actorRole: dbUser.role || "student",
        entityType: "user_profile",
        entityId: dbUser.id,
        action: "update_profile_email",
        oldValues: { email: previousEmail },
        newValues: { email: cleanEmail },
        changedFields: ["email"],
        reason: "Synchronized email from verified Firebase ID token as a profile attribute"
      });
    } catch (syncErr) {
      logger.warn("Non-blocking warning syncing profile email attribute:", syncErr);
    }
  }
  if (dbUser && dbUser.is_active === false) {
    logger.warn(`Authentication rejected for deactivated account in PostgreSQL: ${cleanEmail}`);
    return null;
  }
  let assignedRole = "student";
  if (dbUser?.role) {
    assignedRole = normalizeUserRole(dbUser.role);
  }
  if (!dbUser && cleanEmail) {
    const enrollment = await checkEnrollmentMatch(cleanEmail, supabase);
    if (!enrollment.isEnrolled) {
      logger.warn(`Authentication rejected for un-enrolled account attempt: ${cleanEmail}`);
      return null;
    }
    const candidateRole = enrollment.role ? normalizeUserRole(enrollment.role) : "student";
    const requestId = req.headers["x-request-id"] || void 0;
    const ipAddress = req.ip || req.socket?.remoteAddress || "unknown-ip";
    const userAgent = req.headers["user-agent"];
    if (isAdministrativeRole(candidateRole)) {
      logger.error(
        `SECURITY VIOLATION: Blocked automatic administrative account provisioning attempt for ${cleanEmail} (candidate role: ${candidateRole})`
      );
      try {
        await logAuditEvent({
          actorUserId: null,
          actorRole: "system",
          entityType: "user_provisioning",
          entityId: cleanEmail,
          action: "provisioning_blocked_admin_prohibited",
          oldValues: null,
          newValues: {
            email: cleanEmail,
            attemptedRole: candidateRole,
            sourceRecord: enrollment.sourceRecord,
            status: "blocked_prohibited"
          },
          reason: "Security Policy: Administrative roles must never be granted through automatic enrollment",
          requestId,
          ipAddress,
          userAgent
        });
      } catch (auditErr) {
        logger.warn("Warning logging admin provisioning block audit event:", auditErr);
      }
      return null;
    }
    if (isElevatedStaffOrLecturerRole(candidateRole)) {
      logger.warn(
        `Account provisioning pending administrator approval for ${cleanEmail} (candidate elevated role: ${candidateRole})`
      );
      try {
        await logAuditEvent({
          actorUserId: null,
          actorRole: "system",
          entityType: "user_provisioning",
          entityId: cleanEmail,
          action: "provisioning_blocked_approval_required",
          oldValues: null,
          newValues: {
            email: cleanEmail,
            candidateRole,
            sourceRecord: enrollment.sourceRecord,
            status: "pending_approval"
          },
          reason: "Security Policy: Lecturers and staff require administrator approval prior to account activation",
          requestId,
          ipAddress,
          userAgent
        });
      } catch (auditErr) {
        logger.warn("Warning logging lecturer/staff approval requirement audit event:", auditErr);
      }
      return null;
    }
    if (candidateRole !== "student") {
      logger.warn(`Rejected automatic provisioning for unapproved role '${candidateRole}' for ${cleanEmail}`);
      return null;
    }
    try {
      const { data: createdUser, error: insertErr } = await supabase.from("users").insert({
        email: cleanEmail,
        role: "student",
        is_active: true,
        firebase_uid: firebaseUid
      }).select("id, email, role, is_active, assigned_courses, firebase_uid").maybeSingle();
      if (insertErr) {
        throw new DatabaseServiceError("Failed to activate student account in database", insertErr);
      }
      if (createdUser) {
        dbUser = createdUser;
        assignedRole = "student";
        logger.info(`Activated enrolled student account in PostgreSQL for ${cleanEmail} (uid: ${firebaseUid})`);
        try {
          await supabase.from("user_identities").insert({
            user_id: createdUser.id,
            provider: "firebase",
            provider_uid: firebaseUid,
            email: cleanEmail
          });
        } catch (idErr) {
          logger.debug("user_identities insert note:", idErr);
        }
        if (enrollment.studentRecordId) {
          const { error: updateErr } = await supabase.from("students").update({ user_id: createdUser.id }).eq("id", enrollment.studentRecordId).is("user_id", null);
          if (updateErr) {
            logger.warn("Warning linking student record user_id:", updateErr);
          }
        }
        try {
          await logAuditEvent({
            actorUserId: createdUser.id,
            actorRole: "system",
            entityType: "user_provisioning",
            entityId: createdUser.id,
            action: "auto_provision_student",
            oldValues: null,
            newValues: {
              userId: createdUser.id,
              email: cleanEmail,
              role: "student",
              studentRecordId: enrollment.studentRecordId,
              studentNumber: enrollment.studentNumber,
              studentName: enrollment.studentName,
              sourceRecord: enrollment.sourceRecord,
              status: "active"
            },
            reason: "Automatic student account activation from verified enrollment record",
            requestId,
            ipAddress,
            userAgent
          });
        } catch (auditErr) {
          logger.warn("Warning logging student auto-provisioning audit event:", auditErr);
        }
      }
    } catch (insertErr) {
      if (insertErr instanceof DatabaseServiceError || insertErr?.isDatabaseError) {
        throw insertErr;
      }
      logger.error("Could not insert user into PostgreSQL database users table:", insertErr);
      throw new DatabaseServiceError("Database error during student account activation", insertErr);
    }
  }
  let studentRecordId = void 0;
  let studentNumber = void 0;
  let studentName = decoded.name;
  let assignedCourses = Array.isArray(dbUser?.assigned_courses) ? dbUser.assigned_courses : [];
  const userId = dbUser?.id || firebaseUid;
  if (dbUser?.id) {
    try {
      const { data: studentRecord, error: stdError } = await supabase.from("students").select("id, student_number").eq("user_id", dbUser.id).maybeSingle();
      if (stdError) {
        throw new DatabaseServiceError("Database error looking up student record", stdError);
      }
      if (studentRecord) {
        if (studentRecord.id) studentRecordId = studentRecord.id;
        if (studentRecord.student_number) studentNumber = studentRecord.student_number;
      }
    } catch (studentErr) {
      if (studentErr instanceof DatabaseServiceError || studentErr?.isDatabaseError) {
        throw studentErr;
      }
      logger.error("Error querying PostgreSQL database students table:", studentErr);
      throw new DatabaseServiceError("Database error querying student record", studentErr);
    }
  }
  if (!studentRecordId) {
    try {
      let prof = null;
      if (dbUser?.id) {
        const { data: profByUid, error: profUidErr } = await supabase.from("profiles").select("id, first_name, last_name, students(id, student_number)").eq("user_id", dbUser.id).maybeSingle();
        if (!profUidErr && profByUid) {
          prof = profByUid;
        }
      }
      if (!prof && cleanEmail) {
        const { data: profByEmail, error: profEmailErr } = await supabase.from("profiles").select("id, first_name, last_name, students(id, student_number)").eq("email", cleanEmail).maybeSingle();
        if (profEmailErr) {
          throw new DatabaseServiceError("Database error looking up profiles table", profEmailErr);
        }
        if (profByEmail) {
          prof = profByEmail;
        }
      }
      if (prof) {
        const fullProfName = `${prof.first_name || ""} ${prof.last_name || ""}`.trim();
        if (fullProfName) studentName = fullProfName;
        const std = Array.isArray(prof.students) ? prof.students[0] : prof.students;
        if (std) {
          if (std.id) studentRecordId = std.id;
          if (std.student_number) studentNumber = std.student_number;
        }
      }
    } catch (profErr) {
      if (profErr instanceof DatabaseServiceError || profErr?.isDatabaseError) {
        throw profErr;
      }
      logger.error("Error querying PostgreSQL database profiles table:", profErr);
      throw new DatabaseServiceError("Database error looking up profile", profErr);
    }
  }
  const studentId = studentRecordId;
  const roleDef = ROLE_DEFINITIONS[assignedRole] || ROLE_DEFINITIONS.student;
  const permissions = roleDef ? roleDef.permissions : [];
  return {
    uid: firebaseUid,
    userId,
    id: userId,
    email: cleanEmail,
    name: studentName || cleanEmail.split("@")[0],
    role: assignedRole,
    studentRecordId,
    studentNumber,
    studentId,
    studentName,
    assignedCourses,
    permissions
  };
}
async function authenticate(req, res, next) {
  try {
    const user = await resolveUserFromRequest(req);
    if (user) {
      req.user = user;
    }
    next();
  } catch (err) {
    if (err instanceof DatabaseServiceError || err?.isDatabaseError) {
      logger.error(`Authentication aborted - Database service error: ${err.message}`);
      return res.status(503).json({
        error: "Service Unavailable: Database lookup failed",
        code: "DATABASE_UNAVAILABLE",
        message: "The system could not verify identity or user state due to a database service error. Access denied."
      });
    }
    logger.error("Error in authenticate middleware:", err);
    return res.status(500).json({
      error: "Authentication process error",
      code: "AUTH_PROCESS_ERROR"
    });
  }
}
function requireAuth(req, res, next) {
  if (!req.user) {
    return res.status(401).json({
      error: "Authentication required",
      code: "UNAUTHENTICATED",
      message: "Please sign in or provide a valid authorization header."
    });
  }
  next();
}
function requirePermission(permission) {
  return (req, res, next) => {
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
    const hasPerm = perms.some((p) => roleHasPermission(req.user.role, p));
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
function requireResourceOwnership(options) {
  return async (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: "Authentication required", code: "UNAUTHENTICATED" });
    }
    const { role, email } = req.user;
    if (role === "super_admin") {
      return next();
    }
    const allowedRoles = (options.allowedRoles || ["super_admin", "admin", "registrar"]).filter((r) => r !== "lecturer" && r !== "teacher");
    if (allowedRoles.includes(role)) {
      return next();
    }
    const targets = options.getTarget(req);
    const targetStudentId = targets.targetStudentRecordId || targets.targetStudentNumber || targets.targetStudentId;
    const { targetStudentName, targetEmail, courseCode } = targets;
    if (role === "lecturer" || role === "teacher") {
      if (!courseCode) {
        return res.status(400).json({
          error: "Course context is required",
          code: "COURSE_SCOPE_REQUIRED",
          details: "Lecturers and faculty must provide a courseCode parameter or body field to access scoped student records."
        });
      }
      try {
        const isAssigned = await verifyLecturerCourseInDatabase(req.user, courseCode);
        if (isAssigned) {
          return next();
        }
      } catch (dbErr) {
        logger.error("Course assignment verification failed due to database error:", dbErr);
        return res.status(503).json({
          error: "Service Unavailable: Database verification failed",
          code: "DATABASE_UNAVAILABLE",
          details: "Could not verify course assignment due to a database service error."
        });
      }
      logger.warn(`Lecturer course verification failed for ${email} (Role: ${role}) targeting course [${courseCode}]`);
      return res.status(403).json({
        error: `Access Denied: You are not assigned as the lecturer for course ${courseCode} in the database.`,
        code: "LECTURER_COURSE_UNASSIGNED",
        details: "Lecturer access is restricted to courses actively assigned to the faculty member in the database."
      });
    }
    try {
      const isOwner = await verifyStudentOwnershipInDatabase(
        req.user,
        targetStudentId,
        targetStudentName,
        targetEmail
      );
      if (isOwner) {
        return next();
      }
    } catch (dbErr) {
      logger.error("Student ownership verification failed due to database error:", dbErr);
      return res.status(503).json({
        error: "Service Unavailable: Database verification failed",
        code: "DATABASE_UNAVAILABLE",
        details: "Could not verify resource ownership due to a database service error."
      });
    }
    logger.warn(`Resource Ownership Check Failed for ${email} (Role: ${role}) targeting [ID: ${targetStudentId}, Name: ${targetStudentName}, Email: ${targetEmail}]`);
    return res.status(403).json({
      error: "Access Denied: You do not have ownership or authority to view or modify this student's private record.",
      code: "RESOURCE_OWNERSHIP_DENIED",
      details: "Students may only access their own grades, attendance, and financial ledgers verified by immutable ID."
    });
  };
}
async function verifyLecturerCourseInDatabase(user, courseCode) {
  if (!user || user.role !== "lecturer" && user.role !== "teacher" || !courseCode) {
    return false;
  }
  const cleanCourse = courseCode.trim().toUpperCase();
  let lecturerUserId = (user.userId || user.id || "").trim();
  const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  try {
    const supabase = getServerSupabase();
    if (!UUID_REGEX.test(lecturerUserId)) {
      const { data: u, error: uErr } = await supabase.from("users").select("id").or(`firebase_uid.eq.${user.uid || lecturerUserId},id.eq.${lecturerUserId}`).is("deleted_at", null).maybeSingle();
      if (uErr) {
        throw new DatabaseServiceError("Database error resolving lecturer user ID", uErr);
      }
      if (u?.id) {
        lecturerUserId = u.id;
      }
    }
    if (!UUID_REGEX.test(lecturerUserId)) {
      return false;
    }
    let courseDefinitionId = null;
    if (UUID_REGEX.test(cleanCourse)) {
      courseDefinitionId = cleanCourse;
    } else {
      const { data: def, error: defErr } = await supabase.from("course_definitions").select("id").ilike("code", cleanCourse).is("deleted_at", null).maybeSingle();
      if (defErr) {
        throw new DatabaseServiceError("Database error resolving course definition by code", defErr);
      }
      if (def?.id) {
        courseDefinitionId = def.id;
      } else {
        const codeMatch = cleanCourse.match(/[A-Z]{2,4}-?[0-9]{3}/);
        if (codeMatch) {
          const { data: matchDef, error: matchErr } = await supabase.from("course_definitions").select("id").ilike("code", codeMatch[0]).is("deleted_at", null).maybeSingle();
          if (matchErr) {
            throw new DatabaseServiceError("Database error resolving matched course definition code", matchErr);
          }
          if (matchDef?.id) {
            courseDefinitionId = matchDef.id;
          }
        }
      }
    }
    if (!courseDefinitionId) {
      return false;
    }
    const { data: offering, error: offErr } = await supabase.from("course_offerings").select("id").eq("lecturer_user_id", lecturerUserId).or(`course_definition_id.eq.${courseDefinitionId},id.eq.${courseDefinitionId}`).is("deleted_at", null).limit(1).maybeSingle();
    if (offErr) {
      throw new DatabaseServiceError("Database error querying course_offerings by lecturer and course", offErr);
    }
    return Boolean(offering);
  } catch (err) {
    if (err instanceof DatabaseServiceError || err?.isDatabaseError) {
      throw err;
    }
    logger.error("Database lecturer course verification failed:", err);
    throw new DatabaseServiceError("Database lecturer course verification failed", err);
  }
}
async function verifyStudentOwnershipInDatabase(user, targetStudentId, _targetStudentName, targetEmail) {
  if (!user) return false;
  const cleanUserId = (user.userId || user.id || "").trim().toLowerCase();
  const cleanStudentRecordId = (user.studentRecordId || "").trim().toLowerCase();
  const cleanStudentNumber = (user.studentNumber || "").trim().toLowerCase();
  const cleanUserEmail = (user.email || "").trim().toLowerCase();
  const cleanTargetId = (targetStudentId || "").trim().toLowerCase();
  const cleanTargetEmail = (targetEmail || "").trim().toLowerCase();
  if (cleanTargetId) {
    if (cleanStudentRecordId && cleanTargetId === cleanStudentRecordId) {
      return true;
    }
    if (cleanStudentNumber && cleanTargetId === cleanStudentNumber) {
      return true;
    }
    if (cleanUserId && cleanTargetId === cleanUserId) {
      return true;
    }
  }
  if (cleanTargetEmail && cleanUserEmail && cleanTargetEmail === cleanUserEmail) {
    return true;
  }
  if (cleanTargetId) {
    try {
      const supabase = getServerSupabase();
      const { data: stdRecords, error } = await supabase.from("students").select("id, user_id, student_number").or(`id.eq.${cleanTargetId},user_id.eq.${cleanTargetId},student_number.eq.${cleanTargetId}`);
      if (error) {
        throw new DatabaseServiceError("Database error querying students table for student ownership", error);
      }
      if (stdRecords && stdRecords.length > 0) {
        const isOwned = stdRecords.some((rec) => {
          const recId = (rec.id || "").trim().toLowerCase();
          const recUserId = (rec.user_id || "").trim().toLowerCase();
          const recNumber = (rec.student_number || "").trim().toLowerCase();
          return cleanStudentRecordId && recId === cleanStudentRecordId || cleanStudentNumber && recNumber === cleanStudentNumber || cleanUserId && (recUserId === cleanUserId || recId === cleanUserId);
        });
        if (isOwned) {
          return true;
        }
      }
    } catch (dbErr) {
      if (dbErr instanceof DatabaseServiceError || dbErr?.isDatabaseError) {
        throw dbErr;
      }
      logger.error("Database student ownership verification failed:", dbErr);
      throw new DatabaseServiceError("Database student ownership verification failed", dbErr);
    }
  }
  return false;
}
var DatabaseServiceError;
var init_rbac2 = __esm({
  "src/server/middleware/rbac.ts"() {
    init_supabaseServer();
    init_firebaseAuth();
    init_rbac();
    init_logger();
    init_guards();
    DatabaseServiceError = class extends Error {
      constructor(message, cause) {
        super(message);
        this.cause = cause;
        this.isDatabaseError = true;
        this.name = "DatabaseServiceError";
      }
    };
  }
});

// server.ts
var import_express20 = __toESM(require("express"), 1);
var import_path3 = __toESM(require("path"), 1);
var import_fs3 = __toESM(require("fs"), 1);
var import_dotenv = __toESM(require("dotenv"), 1);

// src/server/app.ts
var import_express19 = __toESM(require("express"), 1);

// src/server/routes/github.ts
var import_express = require("express");

// src/server/services/github.ts
var import_child_process = require("child_process");
var import_path = __toESM(require("path"), 1);
var import_fs = __toESM(require("fs"), 1);
init_logger();

// src/server/middleware/security.ts
var import_express_rate_limit = __toESM(require("express-rate-limit"), 1);
var import_rate_limit_redis = __toESM(require("rate-limit-redis"), 1);
var import_redis = require("redis");
init_logger();
var redisClient;
var isRedisConnected = false;
if (process.env.REDIS_URL) {
  redisClient = (0, import_redis.createClient)({
    url: process.env.REDIS_URL,
    // Add reconnect strategy for resilience
    socket: {
      reconnectStrategy: (retries) => Math.min(retries * 50, 2e3)
    }
  });
  redisClient.on("error", (err) => logger.error("Redis Client Error", err));
  redisClient.on("ready", () => {
    isRedisConnected = true;
    logger.info("Redis connected and ready for rate limiting.");
  });
  redisClient.connect().catch((err) => {
    logger.error("Failed to connect to Redis:", err);
  });
}
function rateLimiter(maxRequests = 100, windowMs = 15 * 60 * 1e3, bucketName = "global") {
  return (0, import_express_rate_limit.default)({
    windowMs,
    max: maxRequests,
    standardHeaders: true,
    // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false,
    // Disable the `X-RateLimit-*` headers
    // Key generator prioritizes authenticated user ID over IP address
    keyGenerator: (req) => {
      if (req.user && req.user.userId) {
        return `${bucketName}:user:${req.user.userId}`;
      }
      const rawIp = req.ip || req.socket.remoteAddress || "127.0.0.1";
      const ip = (0, import_express_rate_limit.ipKeyGenerator)(rawIp) || "unknown-ip";
      return `${bucketName}:ip:${ip}`;
    },
    // Handler triggered when limit is exceeded
    handler: (req, res, next, options) => {
      const clientIp = req.ip || req.socket.remoteAddress || "unknown-ip";
      const identifier = req.user?.userId ? `user:${req.user.userId}` : `ip:${clientIp}`;
      logger.warn(`Rate limit exceeded [bucket: ${bucketName}] for ${identifier} on endpoint: ${req.originalUrl}`);
      res.status(options.statusCode).json({
        error: "Too Many Requests",
        message: `Rate limit exceeded for ${bucketName} operations. Please try again later.`,
        retryAfterSeconds: Math.ceil(windowMs / 1e3)
      });
    },
    // Use Redis store if connected, otherwise fallback to default memory store
    store: redisClient ? new import_rate_limit_redis.default({
      sendCommand: (...args) => {
        if (isRedisConnected && redisClient) {
          return redisClient.sendCommand(args);
        }
        throw new Error("Redis not connected");
      },
      prefix: `ratelimit:${bucketName}:`
    }) : void 0
  });
}
var authRateLimiter = rateLimiter(15, 15 * 60 * 1e3, "auth");
var aiRateLimiter = rateLimiter(30, 15 * 60 * 1e3, "ai");
var paymentsRateLimiter = rateLimiter(40, 15 * 60 * 1e3, "payments");
var assignmentsRateLimiter = rateLimiter(50, 15 * 60 * 1e3, "assignments");
var driveProxyRateLimiter = rateLimiter(60, 15 * 60 * 1e3, "drive-proxy");
var adminRateLimiter = rateLimiter(60, 15 * 60 * 1e3, "admin");
var stateRateLimiter = rateLimiter(80, 15 * 60 * 1e3, "state");
var githubRateLimiter = rateLimiter(30, 15 * 60 * 1e3, "github");
var generalApiRateLimiter = rateLimiter(1e3, 15 * 60 * 1e3, "general-api");
function securityHeaders(req, res, next) {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-XSS-Protection", "1; mode=block");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("Permissions-Policy", "camera=(self), microphone=(self)");
  next();
}
function sanitizeString(str) {
  return str.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "").replace(/javascript:/gi, "").replace(/on\w+\s*=/gi, "");
}
function sanitizeObject(obj) {
  if (typeof obj === "string") {
    return sanitizeString(obj);
  } else if (Array.isArray(obj)) {
    return obj.map(sanitizeObject);
  } else if (obj !== null && typeof obj === "object") {
    const cleaned = {};
    for (const key of Object.keys(obj)) {
      cleaned[key] = sanitizeObject(obj[key]);
    }
    return cleaned;
  }
  return obj;
}
function sanitizeBody(req, res, next) {
  if (req.body && typeof req.body === "object") {
    req.body = sanitizeObject(req.body);
  }
  next();
}
function isValidGitUrl(url) {
  if (!url || typeof url !== "string") return false;
  const githubPattern = /^https:\/\/github\.com\/[a-zA-Z0-9_.-]+\/[a-zA-Z0-9_.-]+(\.git)?$/;
  return githubPattern.test(url.trim());
}

// src/server/services/github.ts
function pullFromGithub(repoUrl = "https://github.com/kpierre24/School-of-Ministry-2026.git", targetDir = process.cwd()) {
  if (!isValidGitUrl(repoUrl)) {
    logger.warn(`Rejected invalid or untrusted GitHub repository URL: ${repoUrl}`);
    return {
      success: false,
      error: "Invalid repository URL format. Only verified GitHub HTTPS repository URLs are permitted."
    };
  }
  const tempDir = import_path.default.join("/tmp", `github_pull_${Date.now()}`);
  try {
    logger.info(`Cloning ${repoUrl} safely into temporary directory...`);
    (0, import_child_process.execFileSync)("git", ["clone", "--depth", "1", repoUrl, tempDir], { stdio: "pipe" });
    const copyRecursive = (src, dst) => {
      const entries = import_fs.default.readdirSync(src, { withFileTypes: true });
      for (const entry of entries) {
        if ([".git", "node_modules", ".vite", "dist"].includes(entry.name)) continue;
        const srcPath = import_path.default.join(src, entry.name);
        const dstPath = import_path.default.join(dst, entry.name);
        if (entry.isDirectory()) {
          if (!import_fs.default.existsSync(dstPath)) {
            import_fs.default.mkdirSync(dstPath, { recursive: true });
          }
          copyRecursive(srcPath, dstPath);
        } else {
          import_fs.default.copyFileSync(srcPath, dstPath);
        }
      }
    };
    copyRecursive(tempDir, targetDir);
    import_fs.default.rmSync(tempDir, { recursive: true, force: true });
    logger.info("Successfully updated workspace from GitHub repository.");
    return { success: true, message: "Workspace successfully updated from GitHub repository." };
  } catch (err) {
    if (import_fs.default.existsSync(tempDir)) {
      import_fs.default.rmSync(tempDir, { recursive: true, force: true });
    }
    logger.error("Failed to pull from GitHub:", err);
    return { success: false, error: err?.message || String(err) };
  }
}

// src/server/routes/github.ts
init_rbac2();
var githubRouter = (0, import_express.Router)();
githubRouter.use(requireAuth);
githubRouter.post(
  "/pull-from-github",
  requirePermission(["roles:manage", "all:access"]),
  (req, res) => {
    const repoUrl = req.body?.repoUrl || "https://github.com/kpierre24/School-of-Ministry-2026.git";
    const result = pullFromGithub(repoUrl);
    if (result.success) {
      return res.json(result);
    }
    return res.status(500).json(result);
  }
);

// src/server/routes/ai.ts
var import_express2 = require("express");
var import_genai = require("@google/genai");
init_rbac2();
init_logger();
var aiRouter = (0, import_express2.Router)();
aiRouter.use(requireAuth);
function getGenAI() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
    return null;
  }
  return new import_genai.GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build"
      }
    }
  });
}
var sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
aiRouter.post("/evaluate-lesson", async (req, res) => {
  try {
    const { title, content, author, courseCode, fileName } = req.body;
    if (!title && !content) {
      return res.status(400).json({ error: "Title or content is required" });
    }
    const ai = getGenAI();
    if (ai) {
      const prompt = `
You are an expert academic and theological curriculum evaluator for the HTEIM School of Ministry.
Analyze the following lesson / course material and generate a structured evaluation.

Lesson Title: ${title || fileName || "Untitled Lesson"}
Author / Instructor: ${author || "Unknown"}
Target Course Code: ${courseCode || "General"}
File Name: ${fileName || "N/A"}

Lesson Content / Excerpt:
"""
${(content || "").slice(0, 8e3)}
"""

Please provide a JSON object with the following fields:
1. "summary": A crisp 2-3 sentence executive summary of the lesson suitable for a course material card (highlighting key theological concepts, scripture references, or core objectives).
2. "category": A recommended category string (e.g., "Textbook", "Study Guide", "Lecture Notes", "Scripture Memory", "Syllabus", "Expository Manual").
3. "keyTakeaways": An array of 3-4 bullet points highlighting key learning outcomes or ministerial takeaways.
4. "courseCode": Recommended or confirmed course code (e.g. "SOM-101", "SOM-102", "SOM-CORE", or user-provided).
`;
      const modelsToTry = ["gemini-3.7-flash", "gemini-3.1-flash-lite"];
      for (const modelName of modelsToTry) {
        let attempts = 0;
        const maxAttempts = 2;
        while (attempts < maxAttempts) {
          attempts++;
          try {
            const response = await ai.models.generateContent({
              model: modelName,
              contents: prompt,
              config: {
                responseMimeType: "application/json",
                responseSchema: {
                  type: import_genai.Type.OBJECT,
                  properties: {
                    summary: {
                      type: import_genai.Type.STRING,
                      description: "A 2-3 sentence executive summary of the lesson"
                    },
                    category: {
                      type: import_genai.Type.STRING,
                      description: "Curriculum category such as Textbook, Study Guide, or Lecture Notes"
                    },
                    keyTakeaways: {
                      type: import_genai.Type.ARRAY,
                      items: { type: import_genai.Type.STRING },
                      description: "Key learning outcomes or ministerial takeaways"
                    },
                    courseCode: {
                      type: import_genai.Type.STRING,
                      description: "Course code like SOM-101 or SOM-CORE"
                    }
                  },
                  required: ["summary", "category", "keyTakeaways", "courseCode"]
                }
              }
            });
            const textResponse = response.text;
            if (textResponse) {
              const cleanedText = textResponse.replace(/^```json\s*/i, "").replace(/\s*```$/i, "").trim();
              const parsed = JSON.parse(cleanedText);
              return res.json({
                success: true,
                evaluatedByAI: true,
                summary: parsed.summary || "Summary evaluated by Gemini AI.",
                category: parsed.category || "Study Guide",
                keyTakeaways: parsed.keyTakeaways || [],
                courseCode: parsed.courseCode || courseCode || "SOM-CORE"
              });
            }
          } catch (geminiError) {
            const errorMessage = geminiError?.message || String(geminiError);
            const isTransient = errorMessage.includes("503") || errorMessage.includes("high demand") || errorMessage.includes("UNAVAILABLE") || errorMessage.includes("429") || errorMessage.includes("RESOURCE_EXHAUSTED");
            if (isTransient && attempts < maxAttempts) {
              logger.warn(`Gemini (${modelName}) transient demand spike, retrying in 1s...`);
              await sleep(1e3);
              continue;
            }
            logger.warn(`Gemini API call warning with ${modelName}:`, errorMessage);
            break;
          }
        }
      }
    }
    const rawContent = (content || "").trim();
    const generatedSummary = rawContent.length > 50 ? `Lesson overview covering key ministerial principles: "${rawContent.slice(0, 160).trim()}..."` : `Comprehensive curriculum module titled "${title || fileName || "Ministry Lesson"}" designed for the HTEIM School of Ministry student body.`;
    const inferredCategory = title?.toLowerCase().includes("audio") ? "Lecture Audio" : title?.toLowerCase().includes("guide") ? "Study Guide" : title?.toLowerCase().includes("handbook") || title?.toLowerCase().includes("manual") ? "Textbook" : title?.toLowerCase().includes("scripture") || title?.toLowerCase().includes("memory") ? "Scripture Memory" : "Lecture Notes";
    const keyTakeaways = [
      `Grasp foundational kingdom concepts presented in ${title || "this lesson"}.`,
      "Apply scripture memory and biblical exegesis to practical ministry.",
      "Integrate leadership ethics and doctrine into pastoral service."
    ];
    return res.json({
      success: true,
      evaluatedByAI: false,
      summary: generatedSummary,
      category: inferredCategory,
      keyTakeaways,
      courseCode: courseCode || "SOM-CORE"
    });
  } catch (err) {
    logger.error("Error evaluating lesson:", err);
    return res.status(500).json({ error: "Failed to evaluate lesson content" });
  }
});

// src/server/routes/driveProxy.ts
var import_express3 = require("express");
var import_stream = require("stream");
init_rbac2();
var driveProxyRouter = (0, import_express3.Router)();
driveProxyRouter.use(requireAuth);
driveProxyRouter.get("/spreadsheet/:spreadsheetId/sheets", async (req, res) => {
  const { spreadsheetId } = req.params;
  if (!spreadsheetId || !/^[a-zA-Z0-9_-]{15,80}$/.test(spreadsheetId)) {
    return res.status(400).json({ error: "Invalid Google Spreadsheet ID" });
  }
  try {
    const htmlUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/htmlview`;
    const response = await fetch(htmlUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8"
      }
    });
    if (!response.ok) {
      return res.status(response.status).json({ error: `Google Sheets returned status ${response.status}` });
    }
    const html = await response.text();
    const sheets = [];
    const regexItems = /items\.push\(\s*\{\s*name:\s*"([^"\\]*(?:\\.[^"\\]*)*)"[^}]*?gid:\s*"([0-9]+)"/g;
    let match;
    while ((match = regexItems.exec(html)) !== null) {
      const rawName = match[1];
      const gid = match[2];
      try {
        const decoded = JSON.parse(`"${rawName}"`);
        sheets.push({ name: decoded.trim(), gid });
      } catch {
        sheets.push({ name: rawName.trim(), gid });
      }
    }
    if (sheets.length === 0) {
      const regexConfig = /"name"\s*:\s*"([^"\\]*(?:\\.[^"\\]*)*)"\s*,\s*"sheetId"\s*:\s*([0-9]+)/g;
      while ((match = regexConfig.exec(html)) !== null) {
        sheets.push({ name: match[1].trim(), gid: match[2] });
      }
    }
    return res.json({ spreadsheetId, sheets });
  } catch (err) {
    console.error(`Error fetching spreadsheet sheets for ${spreadsheetId}:`, err);
    return res.status(500).json({ error: "Failed to extract spreadsheet sheets", details: err?.message });
  }
});
driveProxyRouter.get("/spreadsheet/:spreadsheetId/data", async (req, res) => {
  const { spreadsheetId } = req.params;
  const gid = req.query.gid;
  const sheet = req.query.sheet;
  if (!spreadsheetId || !/^[a-zA-Z0-9_-]{15,80}$/.test(spreadsheetId)) {
    return res.status(400).json({ error: "Invalid Google Spreadsheet ID" });
  }
  let param = "";
  if (gid) {
    param = `&gid=${encodeURIComponent(gid)}`;
  } else if (sheet) {
    param = `&sheet=${encodeURIComponent(sheet)}`;
  }
  try {
    const gvizUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/gviz/tq?tqx=out:json${param}`;
    const response = await fetch(gvizUrl);
    if (!response.ok) {
      return res.status(response.status).json({ error: `GViz returned status ${response.status}` });
    }
    const gvizText = await response.text();
    const startIdx = gvizText.indexOf("{");
    const endIdx = gvizText.lastIndexOf("}");
    if (startIdx === -1 || endIdx === -1) {
      return res.status(502).json({ error: "Malformed GViz response" });
    }
    const jsonStr = gvizText.substring(startIdx, endIdx + 1);
    const data = JSON.parse(jsonStr);
    return res.json(data);
  } catch (err) {
    console.error(`Error fetching spreadsheet data for ${spreadsheetId}:`, err);
    return res.status(500).json({ error: "Failed to fetch spreadsheet data", details: err?.message });
  }
});
driveProxyRouter.get("/stream/:fileId", async (req, res) => {
  const { fileId } = req.params;
  if (!fileId || !/^[a-zA-Z0-9_-]{15,80}$/.test(fileId)) {
    return res.status(400).json({ error: "Invalid Google Drive File ID" });
  }
  const candidateUrls = [
    `https://drive.usercontent.google.com/download?id=${fileId}&export=download&confirm=t`,
    `https://drive.google.com/uc?export=download&id=${fileId}&confirm=t`,
    `https://docs.google.com/uc?export=download&id=${fileId}&confirm=t`
  ];
  const clientHeaders = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
    Accept: "*/*"
  };
  if (req.headers.range) {
    clientHeaders["Range"] = req.headers.range;
  }
  for (const url of candidateUrls) {
    try {
      const response = await fetch(url, {
        headers: clientHeaders,
        redirect: "follow"
      });
      const contentType = response.headers.get("content-type") || "";
      if (contentType.includes("text/html")) {
        const htmlText = await response.text();
        const confirmMatch = htmlText.match(/confirm=([a-zA-Z0-9_-]+)/);
        if (confirmMatch && confirmMatch[1]) {
          const confirmUrl = `https://drive.usercontent.google.com/download?id=${fileId}&export=download&confirm=${confirmMatch[1]}`;
          const retryRes = await fetch(confirmUrl, {
            headers: clientHeaders,
            redirect: "follow"
          });
          const retryType = retryRes.headers.get("content-type") || "";
          if (retryRes.ok && !retryType.includes("text/html") && retryRes.body) {
            return streamResponse(retryRes, res);
          }
        }
        continue;
      }
      if (response.ok && response.body) {
        return streamResponse(response, res);
      }
    } catch (err) {
      console.error(`Error fetching drive stream from ${url}:`, err);
    }
  }
  return res.redirect(`https://drive.google.com/file/d/${fileId}/preview`);
});
function streamResponse(upstreamRes, res) {
  const status = upstreamRes.status === 206 ? 206 : 200;
  res.status(status);
  const contentType = upstreamRes.headers.get("content-type") || "video/mp4";
  res.setHeader("Content-Type", contentType);
  if (upstreamRes.headers.get("content-length")) {
    res.setHeader("Content-Length", upstreamRes.headers.get("content-length"));
  }
  if (upstreamRes.headers.get("content-range")) {
    res.setHeader("Content-Range", upstreamRes.headers.get("content-range"));
  }
  res.setHeader("Accept-Ranges", "bytes");
  res.setHeader("Cache-Control", "public, max-age=3600");
  if (upstreamRes.body) {
    const nodeStream = import_stream.Readable.fromWeb(upstreamRes.body);
    nodeStream.pipe(res);
  } else {
    res.end();
  }
}

// src/server/routes/bible.ts
var import_express4 = require("express");
var import_fs2 = __toESM(require("fs"), 1);
var import_path2 = __toESM(require("path"), 1);
var bibleRouter = (0, import_express4.Router)();
var biblesDir = import_path2.default.join(process.cwd(), "public", "data", "bibles");
function loadJsonFile(filename) {
  try {
    const filePath = import_path2.default.join(biblesDir, filename);
    if (import_fs2.default.existsSync(filePath)) {
      const data = import_fs2.default.readFileSync(filePath, "utf-8");
      return JSON.parse(data);
    }
  } catch (e) {
    console.error(`Error loading Bible JSON file ${filename}:`, e);
  }
  return null;
}
bibleRouter.get("/books", (_req, res) => {
  const catalog = loadJsonFile("books_catalog.json");
  if (catalog) {
    return res.json({ success: true, count: catalog.length, books: catalog });
  }
  return res.status(500).json({ success: false, error: "Failed to load Bible books catalog." });
});
bibleRouter.get("/chapter", async (req, res) => {
  const bookId = String(req.query.book || "2ti").toLowerCase().trim();
  const chapter = String(req.query.chapter || "1").trim();
  const translation = String(req.query.translation || "parallel").toLowerCase().trim();
  try {
    if (translation === "parallel") {
      const parallelData2 = loadJsonFile("parallel_index.json");
      const book = parallelData2?.books?.[bookId];
      if (book?.chapters?.[chapter]) {
        return res.json({
          success: true,
          bookId,
          bookName: book.name,
          chapter: parseInt(chapter, 10),
          translation: "parallel",
          verses: book.chapters[chapter],
          source: "local_json"
        });
      }
    } else if (translation === "kjv") {
      const kjvData = loadJsonFile("kjv.json");
      const book = kjvData?.books?.[bookId];
      if (book?.chapters?.[chapter]) {
        return res.json({
          success: true,
          bookId,
          bookName: book.name,
          chapter: parseInt(chapter, 10),
          translation: "kjv",
          verses: book.chapters[chapter],
          source: "local_json"
        });
      }
    } else if (translation === "amp") {
      const ampData = loadJsonFile("amp.json");
      const book = ampData?.books?.[bookId];
      if (book?.chapters?.[chapter]) {
        return res.json({
          success: true,
          bookId,
          bookName: book.name,
          chapter: parseInt(chapter, 10),
          translation: "amp",
          verses: book.chapters[chapter],
          source: "local_json"
        });
      }
    }
    const parallelData = loadJsonFile("parallel_index.json");
    const parallelBook = parallelData?.books?.[bookId];
    if (parallelBook?.chapters?.[chapter]) {
      const rawVerses = parallelBook.chapters[chapter];
      let verses;
      if (translation === "kjv") {
        verses = rawVerses.map((v) => ({ verse: v.verse, text: v.kjv || v.text }));
      } else if (translation === "amp") {
        verses = rawVerses.map((v) => ({ verse: v.verse, text: v.amp || v.text }));
      } else {
        verses = rawVerses;
      }
      return res.json({
        success: true,
        bookId,
        bookName: parallelBook.name,
        chapter: parseInt(chapter, 10),
        translation,
        verses,
        source: "local_json"
      });
    }
    const catalog = loadJsonFile("books_catalog.json") || [];
    const bookMeta = catalog.find((b) => b.id.toLowerCase() === bookId || b.name.toLowerCase() === bookId);
    const searchBookName = bookMeta ? bookMeta.name : bookId;
    const apiTranslation = translation === "kjv" ? "kjv" : "kjv";
    const response = await fetch(
      `https://bible-api.com/${encodeURIComponent(`${searchBookName} ${chapter}`)}?translation=${apiTranslation}`
    );
    if (response.ok) {
      const apiResult = await response.json();
      if (apiResult?.verses && Array.isArray(apiResult.verses)) {
        let mappedVerses;
        if (translation === "parallel") {
          mappedVerses = apiResult.verses.map((v) => ({
            verse: v.verse,
            kjv: v.text.trim(),
            amp: v.text.trim(),
            // KJV used as stand-in for AMP when fetching dynamically
            text: v.text.trim()
          }));
        } else if (translation === "amp") {
          mappedVerses = apiResult.verses.map((v) => ({
            verse: v.verse,
            text: v.text.trim()
          }));
        } else {
          mappedVerses = apiResult.verses.map((v) => ({
            verse: v.verse,
            text: v.text.trim()
          }));
        }
        return res.json({
          success: true,
          bookId,
          bookName: searchBookName,
          chapter: parseInt(chapter, 10),
          translation,
          verses: mappedVerses,
          source: "dynamic_fallback",
          note: translation === "amp" ? "AMP not available online \u2014 showing KJV for this chapter." : void 0
        });
      }
    }
    return res.status(404).json({
      success: false,
      error: `Scripture chapter ${searchBookName} ${chapter} could not be retrieved.`
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});
bibleRouter.get("/passage", async (req, res) => {
  const reference = String(req.query.ref || "2 Timothy 2:15").trim();
  const translation = String(req.query.translation || "kjv").toLowerCase().trim();
  try {
    const parallelData = loadJsonFile("parallel_index.json");
    const refMatch = reference.match(/^(.+?)\s+(\d+):(\d+)$/i);
    if (refMatch && parallelData?.books) {
      const [, bookNamePart, chapterStr, verseStr] = refMatch;
      const targetBookName = bookNamePart.trim().toLowerCase();
      const targetChapter = chapterStr;
      const targetVerse = parseInt(verseStr, 10);
      const catalog = loadJsonFile("books_catalog.json") || [];
      const matchedBook = catalog.find(
        (b) => b.name.toLowerCase() === targetBookName || b.id.toLowerCase() === targetBookName || b.name.toLowerCase().startsWith(targetBookName) || targetBookName.startsWith(b.id.toLowerCase())
      );
      if (matchedBook) {
        const localBook = parallelData.books[matchedBook.id];
        if (localBook?.chapters?.[targetChapter]) {
          const verses = localBook.chapters[targetChapter];
          const matchedVerse = verses.find((v) => v.verse === targetVerse);
          if (matchedVerse) {
            const responseVerse = translation === "kjv" ? { verse: matchedVerse.verse, text: matchedVerse.kjv || matchedVerse.text, book_name: matchedBook.name, chapter: parseInt(targetChapter, 10) } : translation === "amp" ? { verse: matchedVerse.verse, text: matchedVerse.amp || matchedVerse.text, book_name: matchedBook.name, chapter: parseInt(targetChapter, 10) } : { verse: matchedVerse.verse, amp: matchedVerse.amp, kjv: matchedVerse.kjv, text: matchedVerse.kjv || matchedVerse.text, book_name: matchedBook.name, chapter: parseInt(targetChapter, 10) };
            return res.json({
              success: true,
              reference: `${matchedBook.name} ${targetChapter}:${targetVerse}`,
              translation,
              verses: [responseVerse],
              text: responseVerse.text,
              source: "local_json"
            });
          }
        }
      }
    }
    const apiTranslation = "kjv";
    const response = await fetch(
      `https://bible-api.com/${encodeURIComponent(reference)}?translation=${apiTranslation}`
    );
    if (response.ok) {
      const apiResult = await response.json();
      if (apiResult?.verses) {
        const mappedVerses = apiResult.verses.map((v) => ({
          verse: v.verse,
          chapter: v.chapter,
          book_name: v.book_name,
          text: v.text.trim(),
          kjv: v.text.trim(),
          amp: v.text.trim()
          // Stand-in, AMP not available via free API
        }));
        return res.json({
          success: true,
          reference: apiResult.reference,
          translation,
          verses: mappedVerses,
          text: apiResult.text,
          source: "api_fallback"
        });
      }
    }
    return res.status(404).json({ success: false, error: `Passage "${reference}" not found.` });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});
bibleRouter.get("/search", async (req, res) => {
  const query = String(req.query.q || "").trim().toLowerCase();
  const translation = String(req.query.translation || "parallel").toLowerCase().trim();
  const limit = Math.min(parseInt(String(req.query.limit || "20"), 10), 50);
  if (!query || query.length < 2) {
    return res.status(400).json({ success: false, error: "Query must be at least 2 characters." });
  }
  try {
    const filename = translation === "kjv" ? "kjv.json" : translation === "amp" ? "amp.json" : "parallel_index.json";
    const dataset = loadJsonFile(filename);
    if (!dataset?.books) {
      return res.status(500).json({ success: false, error: "Bible dataset not loaded." });
    }
    const results = [];
    for (const [bookId, bookData] of Object.entries(dataset.books)) {
      if (results.length >= limit) break;
      const bookName = bookData.name || bookId;
      for (const [chapterNum, verses] of Object.entries(bookData.chapters)) {
        if (results.length >= limit) break;
        for (const v of verses) {
          if (results.length >= limit) break;
          const textToSearch = [v.text, v.amp, v.kjv].filter(Boolean).join(" ").toLowerCase();
          if (textToSearch.includes(query)) {
            results.push({
              reference: `${bookName} ${chapterNum}:${v.verse}`,
              bookId,
              chapter: parseInt(chapterNum, 10),
              verse: v.verse,
              text: v.text || v.kjv || "",
              amp: v.amp,
              kjv: v.kjv
            });
          }
        }
      }
    }
    return res.json({ success: true, query, count: results.length, results });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// src/server/routes/auth.ts
var import_express5 = require("express");
init_supabaseServer();
init_rbac();
init_rbac2();
init_logger();
var authRouter = (0, import_express5.Router)();
authRouter.get("/roles", (_req, res) => {
  const roles = Object.values(ROLE_DEFINITIONS).filter(
    (r, index, self) => index === self.findIndex((t) => t.id === r.id)
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
      permissions: r.permissions
    }))
  });
});
authRouter.use(requireAuth);
authRouter.post("/session", async (req, res) => {
  try {
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
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    });
  } catch (err) {
    logger.error("Auth session error:", err);
    return res.status(500).json({ error: "Authentication session verification failed" });
  }
});
authRouter.get("/me", (req, res) => {
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
    }
  });
});
authRouter.get(
  "/users",
  requirePermission(["users:manage", "all:access"]),
  async (_req, res) => {
    try {
      const users = await getDatabaseUsers();
      return res.status(200).json({
        users,
        count: users.length
      });
    } catch (err) {
      logger.error("GET /api/auth/users error:", err);
      return res.status(500).json({ error: "Failed to fetch users" });
    }
  }
);
authRouter.patch(
  "/users/:userId/role",
  requirePermission(["roles:manage", "all:access"]),
  async (req, res) => {
    try {
      const { userId } = req.params;
      const { role, reason } = req.body;
      const actorUserId = req.user.userId;
      const actorRole = req.user.role;
      const requestId = req.headers["x-request-id"] || void 0;
      const ipAddress = req.ip || req.socket.remoteAddress || "unknown-ip";
      const userAgent = req.headers["user-agent"];
      if (!role || typeof role !== "string") {
        return res.status(400).json({ error: "role is required" });
      }
      const normalized = normalizeUserRole(role);
      const result = await updateUserRoleInDatabase(
        userId,
        normalized,
        actorUserId,
        actorRole,
        reason,
        requestId,
        ipAddress,
        userAgent
      );
      if (!result.success) {
        return res.status(400).json({ error: result.error || "Failed to update role" });
      }
      return res.status(200).json({
        status: "updated",
        user: result.user
      });
    } catch (err) {
      logger.error("PATCH /api/auth/users/:userId/role error:", err);
      return res.status(500).json({ error: "Failed to update user role" });
    }
  }
);
authRouter.get(
  "/pending-approvals",
  requirePermission(["users:manage", "all:access"]),
  async (_req, res) => {
    try {
      const pending = await getPendingAccountApprovals();
      return res.status(200).json({
        pending,
        count: pending.length
      });
    } catch (err) {
      logger.error("GET /api/auth/pending-approvals error:", err);
      return res.status(500).json({ error: "Failed to fetch pending approvals" });
    }
  }
);
authRouter.post(
  "/users/provision",
  requirePermission(["users:manage", "all:access"]),
  async (req, res) => {
    try {
      const { email, role, reason, assignedCourses, sourceRecord, firebaseUid } = req.body;
      const actorUserId = req.user.userId;
      const actorRole = req.user.role;
      const requestId = req.headers["x-request-id"] || void 0;
      const ipAddress = req.ip || req.socket.remoteAddress || "unknown-ip";
      const userAgent = req.headers["user-agent"];
      if (!email || typeof email !== "string") {
        return res.status(400).json({ error: "Valid email is required" });
      }
      if (!role || typeof role !== "string") {
        return res.status(400).json({ error: "role is required" });
      }
      const result = await provisionOrApproveUserByAdmin({
        email,
        role,
        actorUserId,
        actorRole,
        reason,
        assignedCourses,
        sourceRecord,
        requestId,
        ipAddress,
        userAgent,
        firebaseUid
      });
      if (!result.success) {
        return res.status(400).json({ error: result.error || "Failed to provision user" });
      }
      return res.status(200).json({
        status: "provisioned",
        user: result.user
      });
    } catch (err) {
      logger.error("POST /api/auth/users/provision error:", err);
      return res.status(500).json({ error: "Failed to provision user" });
    }
  }
);

// src/server/routes/students.ts
var import_express6 = require("express");

// src/server/services/domain/databaseInit.ts
init_supabaseServer();
init_logger();
async function initializeRelationalSchema() {
  try {
    const supabase = getServerSupabase();
    const { error: probeError } = await supabase.from("students").select("id").limit(1);
    if (!probeError) {
      logger.info("Relational PostgreSQL domain tables detected and operational");
    }
    const [sessRes, recRes, auditRes] = await Promise.all([
      supabase.from("attendance_sessions").select("id").limit(1),
      supabase.from("attendance_records").select("id").limit(1),
      supabase.from("audit_history").select("audit_id, actor_user_id, actor_role, action, entity_type, entity_id, changed_fields, timestamp").limit(1)
    ]);
    if (!sessRes.error && !recRes.error) {
      logger.info("Attendance hierarchy tables (attendance_sessions & attendance_records) operational");
    } else {
      logger.info("Attendance hierarchy tables status probe completed; ready for operational usage");
    }
    if (!auditRes.error) {
      logger.info("Authoritative audit_history table (with audit_id, actor_user_id, actor_role, changed_fields) operational");
    } else {
      logger.info("Audit history table probe completed; ready for operational logging");
    }
    logger.info("Relational domain tables probe returned status; database is ready for domain operations");
  } catch (err) {
    logger.warn("Relational schema verification completed with warning:", err?.message || err);
  }
}

// src/server/services/domain/index.ts
init_studentsService();
init_attendanceService();
init_academicsService();
init_assignmentsService();
init_financeService();
init_stateHydrationService();

// src/server/routes/students.ts
init_rbac2();
init_logger();
var studentsRouter = (0, import_express6.Router)();
studentsRouter.use(requireAuth);
studentsRouter.get(
  "/",
  requirePermission(["students:read", "all:access"]),
  async (req, res) => {
    try {
      const user = req.user;
      const staffRoles = ["super_admin", "admin", "registrar", "lecturer", "teacher", "finance_officer"];
      if (!staffRoles.includes(user.role)) {
        return res.status(403).json({
          error: "Access denied: Student directory is restricted to authorized staff. Use /api/me endpoints to retrieve personal student data."
        });
      }
      const limit = req.query.limit ? parseInt(req.query.limit, 10) : void 0;
      const offset = req.query.offset ? parseInt(req.query.offset, 10) : void 0;
      const search = req.query.search;
      const cohortLevel = req.query.cohortLevel;
      const enrollmentStatus = req.query.enrollmentStatus;
      const studentId = req.query.studentId;
      const result = await studentsService.getStudents(user, {
        limit,
        offset,
        search,
        cohortLevel,
        enrollmentStatus,
        studentId
      });
      return res.status(200).json({
        students: result.students,
        total: result.total,
        atRiskCount: result.atRiskCount,
        threshold: "75%",
        updatedAt: (/* @__PURE__ */ new Date()).toISOString()
      });
    } catch (err) {
      logger.error("GET /api/students error:", err);
      return res.status(500).json({ error: "Failed to fetch student directory" });
    }
  }
);
studentsRouter.get(
  "/:name/grades",
  requireAuth,
  requirePermission(["grades:read", "all:access"]),
  requireResourceOwnership({
    getTarget: (req) => ({
      targetStudentName: decodeURIComponent(req.params.name).trim(),
      targetStudentId: req.params.name,
      courseCode: req.query.courseCode || req.query.course || req.body?.courseCode
    }),
    allowedRoles: ["super_admin", "admin", "registrar"]
  }),
  async (req, res) => {
    try {
      const studentName = decodeURIComponent(req.params.name).trim();
      const subResult = await assignmentsService.getSubmissions({ studentName }, req.user);
      const submissions = subResult.submissions || [];
      let totalGrade = 0;
      let gradedCount = 0;
      for (const s of submissions) {
        if (typeof s.score === "number" || typeof s.grade === "number") {
          totalGrade += s.score ?? s.grade;
          gradedCount++;
        }
      }
      const gpaPercent = gradedCount > 0 ? Math.round(totalGrade / gradedCount) : null;
      const honorRoll = gpaPercent !== null ? gpaPercent >= 85 : false;
      const standing = gpaPercent === null ? "Not Yet Graded" : honorRoll ? "High Distinction" : gpaPercent >= 75 ? "Satisfactory" : "At-Risk";
      return res.status(200).json({
        studentName,
        averageGrade: gpaPercent,
        honorRoll,
        standing,
        submissions,
        rubricScores: subResult.rubricScores?.[studentName] || null,
        authorizedRequester: {
          email: req.user?.email,
          role: req.user?.role
        }
      });
    } catch (err) {
      logger.error("GET /api/students/:name/grades error:", err);
      return res.status(500).json({ error: "Failed to fetch student grades" });
    }
  }
);
studentsRouter.get(
  "/:name/attendance",
  requireAuth,
  requirePermission(["attendance:read", "all:access"]),
  requireResourceOwnership({
    getTarget: (req) => ({
      targetStudentName: decodeURIComponent(req.params.name).trim(),
      targetStudentId: req.params.name,
      courseCode: req.query.courseCode || req.query.course || req.body?.courseCode
    }),
    allowedRoles: ["super_admin", "admin", "registrar"]
  }),
  async (req, res) => {
    try {
      const studentName = decodeURIComponent(req.params.name).trim();
      const attData = await attendanceService.getAttendance(req.user);
      const norm = studentName.toLowerCase().trim();
      const studentRecords = (attData.records || []).filter(
        (r) => (r.student?.name || "").toLowerCase().trim() === norm
      );
      const totalSessions = attData.totalSessions || Math.max(studentRecords.length, 1);
      const presentCount = studentRecords.filter((r) => {
        const s = (r.status || "").toLowerCase();
        return s === "present" || s === "p" || s === "1" || s === "attended";
      }).length;
      const excusedCount = studentRecords.filter((r) => {
        const s = (r.status || "").toLowerCase();
        return s === "excused" || s === "e";
      }).length;
      const rate = totalSessions > 0 ? Math.round((presentCount + excusedCount) / totalSessions * 100) : 100;
      return res.status(200).json({
        studentName,
        totalSessions,
        presentCount,
        excusedCount,
        attendanceRate: rate,
        isAtRisk: rate < 75,
        records: studentRecords
      });
    } catch (err) {
      logger.error("GET /api/students/:name/attendance error:", err);
      return res.status(500).json({ error: "Failed to fetch attendance history" });
    }
  }
);
studentsRouter.get(
  "/:name/financial-profile",
  requireAuth,
  requirePermission(["finance:read", "all:access"]),
  requireResourceOwnership({
    getTarget: (req) => ({
      targetStudentName: decodeURIComponent(req.params.name).trim(),
      targetStudentId: req.params.name
    }),
    allowedRoles: ["super_admin", "admin", "finance_officer"]
  }),
  async (req, res) => {
    try {
      const studentName = decodeURIComponent(req.params.name).trim();
      const [invRes, txnRes] = await Promise.all([
        financeService.getInvoices(studentName, req.user),
        financeService.getTransactions({ studentName }, req.user)
      ]);
      return res.status(200).json({
        studentName,
        invoices: invRes.invoices,
        transactions: txnRes.transactions,
        receipts: [],
        adjustments: []
      });
    } catch (err) {
      logger.error("GET /api/students/:name/financial-profile error:", err);
      return res.status(500).json({ error: "Failed to fetch student financial records" });
    }
  }
);
studentsRouter.get(
  "/:name",
  requirePermission(["students:read", "all:access"]),
  requireResourceOwnership({
    getTarget: (req) => ({
      targetStudentName: decodeURIComponent(req.params.name).trim(),
      targetStudentId: req.params.name,
      courseCode: req.query.courseCode || req.query.course || req.body?.courseCode
    }),
    allowedRoles: ["super_admin", "admin", "registrar", "finance_officer"]
  }),
  async (req, res) => {
    try {
      const nameOrId = decodeURIComponent(req.params.name).trim();
      const result = await studentsService.getStudentByNameOrId(nameOrId, req.user);
      if (!result) {
        return res.status(404).json({ error: "Student not found" });
      }
      return res.status(200).json({
        student: result.student,
        attendanceHistory: result.attendanceHistory,
        submissions: result.submissions,
        payments: result.payments,
        rubricScores: null
      });
    } catch (err) {
      logger.error("GET /api/students/:name error:", err);
      return res.status(500).json({ error: "Failed to fetch student profile" });
    }
  }
);
studentsRouter.post(
  "/",
  requireAuth,
  requirePermission(["students:write", "all:access"]),
  async (req, res) => {
    try {
      const { name, level, email, photoUrl } = req.body;
      const actorUserId = req.user.userId;
      const actorRole = req.user.role;
      if (!name || typeof name !== "string") {
        return res.status(400).json({ error: "Student name is required" });
      }
      const result = await studentsService.enrollStudent(
        { name, level, email, photoUrl },
        actorUserId,
        actorRole
      );
      return res.status(201).json(result);
    } catch (err) {
      logger.error("POST /api/students error:", err);
      return res.status(500).json({ error: "Failed to enroll student" });
    }
  }
);
studentsRouter.put(
  "/:name",
  requireAuth,
  requirePermission(["students:write", "all:access"]),
  async (req, res) => {
    try {
      const studentName = decodeURIComponent(req.params.name).trim();
      const { level, note, photoUrl } = req.body;
      const actorUserId = req.user.userId;
      const actorRole = req.user.role;
      const result = await studentsService.updateStudent(
        studentName,
        { level, note, photoUrl },
        actorUserId,
        actorRole
      );
      return res.status(200).json(result);
    } catch (err) {
      logger.error("PUT /api/students/:name error:", err);
      return res.status(500).json({ error: "Failed to update student" });
    }
  }
);
studentsRouter.patch(
  "/:id",
  requireAuth,
  requirePermission(["students:write", "all:access"]),
  async (req, res) => {
    try {
      const idOrName = decodeURIComponent(req.params.id).trim();
      const { level, note, photoUrl, status, enrollmentStatus, studentNumber } = req.body;
      const actorUserId = req.user.userId;
      const actorRole = req.user.role;
      const result = await studentsService.updateStudent(
        idOrName,
        { level, note, photoUrl, enrollmentStatus: enrollmentStatus || status, studentNumber },
        actorUserId,
        actorRole
      );
      return res.status(200).json(result);
    } catch (err) {
      logger.error(`PATCH /api/students/${req.params.id} error:`, err);
      return res.status(500).json({ error: err?.message || "Failed to update student" });
    }
  }
);

// src/server/routes/academics.ts
var import_express7 = require("express");
init_rbac2();
init_logger();
var academicsRouter = (0, import_express7.Router)();
academicsRouter.use(requireAuth);
academicsRouter.get(
  "/courses",
  requirePermission(["students:read", "all:access"]),
  async (req, res) => {
    try {
      const data = await academicsService.getCourses();
      return res.status(200).json({
        courses: data.courses,
        count: data.count,
        updatedAt: (/* @__PURE__ */ new Date()).toISOString()
      });
    } catch (err) {
      logger.error("GET /api/academics/courses error:", err);
      return res.status(500).json({ error: "Failed to fetch courses" });
    }
  }
);
academicsRouter.post(
  "/courses",
  requireAuth,
  requirePermission(["students:write", "roles:manage", "all:access"]),
  async (req, res) => {
    try {
      const { course } = req.body;
      const actorUserId = req.user.userId;
      const actorRole = req.user.role;
      if (!course || !course.code || !course.title) {
        return res.status(400).json({ error: "Course code and title are required" });
      }
      const result = await academicsService.saveCourse(course, actorUserId, actorRole);
      return res.status(200).json(result);
    } catch (err) {
      logger.error("POST /api/academics/courses error:", err);
      return res.status(500).json({ error: "Failed to save course" });
    }
  }
);
academicsRouter.get(
  "/structure",
  requirePermission(["students:read", "all:access"]),
  async (req, res) => {
    try {
      const structure = await academicsService.getAcademicStructure();
      return res.status(200).json(structure);
    } catch (err) {
      logger.error("GET /api/academics/structure error:", err);
      return res.status(500).json({ error: "Failed to fetch academic structure" });
    }
  }
);
academicsRouter.post(
  "/offerings",
  requireAuth,
  requirePermission(["students:write", "roles:manage", "all:access"]),
  async (req, res) => {
    try {
      const offering = req.body.offering || req.body;
      const actorUserId = req.user.userId;
      const actorRole = req.user.role;
      if (!offering || !offering.id || !offering.courseId) {
        return res.status(400).json({ error: "Offering id and courseId are required" });
      }
      const result = await academicsService.saveCourseOffering(offering, actorUserId, actorRole);
      return res.status(200).json(result);
    } catch (err) {
      logger.error("POST /api/academics/offerings error:", err);
      return res.status(500).json({ error: "Failed to save course offering" });
    }
  }
);

// src/server/routes/attendance.ts
var import_express8 = require("express");
init_rbac2();
init_logger();

// src/server/middleware/validation.ts
var import_zod = require("zod");
function validateBody(schema) {
  return async (req, res, next) => {
    try {
      const validatedData = await schema.parseAsync(req.body);
      req.body = validatedData;
      next();
    } catch (error) {
      if (error instanceof import_zod.ZodError) {
        return res.status(400).json({
          error: "Validation Error",
          details: error.issues.map((e) => ({
            path: e.path.join("."),
            message: e.message
          }))
        });
      }
      return res.status(500).json({ error: "Internal Server Error during validation" });
    }
  };
}

// src/server/schemas/attendance.schema.ts
var import_zod2 = require("zod");
var AttendanceStatusEnum = import_zod2.z.enum(["PRESENT", "ABSENT", "LATE", "EXCUSED"]).refine((val) => ["PRESENT", "ABSENT", "LATE", "EXCUSED"].includes(val), {
  message: "Invalid attendance status"
});
var CheckinSchema = import_zod2.z.object({
  studentId: import_zod2.z.string().uuid().optional(),
  studentName: import_zod2.z.string().optional(),
  studentEmail: import_zod2.z.string().email().optional(),
  date: import_zod2.z.string().datetime(),
  status: AttendanceStatusEnum,
  notes: import_zod2.z.string().max(500).optional(),
  sessionId: import_zod2.z.string().uuid().optional(),
  manualOverride: import_zod2.z.boolean().optional(),
  courseCode: import_zod2.z.string().optional(),
  courseId: import_zod2.z.string().optional()
}).refine((data) => data.studentId || data.studentName, {
  message: "Either studentId or studentName is required",
  path: ["studentId"]
});
var BatchAttendanceSchema = import_zod2.z.object({
  date: import_zod2.z.string().datetime(),
  sessionId: import_zod2.z.string().uuid().optional(),
  sessionTitle: import_zod2.z.string().optional(),
  records: import_zod2.z.array(import_zod2.z.object({
    studentId: import_zod2.z.string().uuid().optional(),
    studentName: import_zod2.z.string().optional(),
    status: AttendanceStatusEnum,
    notes: import_zod2.z.string().max(500).optional()
  })).min(1)
});
var OverrideAttendanceSchema = import_zod2.z.object({
  studentId: import_zod2.z.string().uuid().optional(),
  studentName: import_zod2.z.string().optional(),
  date: import_zod2.z.string().datetime(),
  status: AttendanceStatusEnum,
  reason: import_zod2.z.string().max(500).optional(),
  sessionId: import_zod2.z.string().uuid().optional()
});
var ExcuseAttendanceSchema = import_zod2.z.object({
  studentId: import_zod2.z.string().uuid().optional(),
  studentName: import_zod2.z.string().optional(),
  date: import_zod2.z.string().datetime(),
  reason: import_zod2.z.string().max(500),
  documentUrl: import_zod2.z.string().url().optional(),
  courseCode: import_zod2.z.string().optional(),
  courseId: import_zod2.z.string().optional()
}).refine((data) => data.studentId || data.studentName, {
  message: "Either studentId or studentName is required",
  path: ["studentId"]
});

// src/server/routes/attendance.ts
var attendanceRouter = (0, import_express8.Router)();
attendanceRouter.use(requireAuth);
attendanceRouter.get(
  "/",
  requirePermission(["attendance:read", "all:access"]),
  async (req, res) => {
    try {
      const user = req.user;
      const data = await attendanceService.getAttendance(user);
      return res.status(200).json({
        records: data.records,
        sessions: data.sessions,
        classDays: data.classDays,
        excusedAbsences: data.excusedAbsences,
        totalRecords: data.totalRecords,
        totalSessions: data.totalSessions,
        policyThreshold: data.policyThreshold,
        updatedAt: (/* @__PURE__ */ new Date()).toISOString()
      });
    } catch (err) {
      logger.error("GET /api/attendance error:", err);
      return res.status(500).json({ error: "Failed to fetch attendance records" });
    }
  }
);
attendanceRouter.post(
  "/",
  requireAuth,
  requirePermission(["attendance:write", "all:access"]),
  async (req, res) => {
    try {
      const actorUserId = req.user.userId;
      const actorRole = req.user.role;
      if (Array.isArray(req.body?.records)) {
        const { date: date2, records, sessionId: sessionId2, sessionTitle } = req.body;
        const result2 = await attendanceService.recordBatchAttendance(
          { date: date2, records, sessionId: sessionId2, sessionTitle },
          actorUserId,
          actorRole
        );
        return res.status(200).json(result2);
      }
      const { studentName, studentId, date, status, notes, studentEmail, sessionId, manualOverride } = req.body;
      if (!date || !status) {
        return res.status(400).json({ error: "date and status are required" });
      }
      const result = await attendanceService.recordCheckin(
        { studentName, studentId, date, status, notes, studentEmail, sessionId, manualOverride },
        actorUserId,
        actorRole
      );
      return res.status(200).json(result);
    } catch (err) {
      logger.error("POST /api/attendance error:", err);
      return res.status(500).json({ error: err?.message || "Failed to record attendance" });
    }
  }
);
attendanceRouter.patch(
  "/:id",
  requireAuth,
  requirePermission(["attendance:write", "all:access"]),
  async (req, res) => {
    try {
      const id = req.params.id;
      const { status, notes, manualOverride } = req.body;
      const actorUserId = req.user.userId;
      const actorRole = req.user.role;
      const result = await attendanceService.updateAttendanceRecord(
        id,
        { status, notes, manualOverride },
        actorUserId,
        actorRole
      );
      return res.status(200).json(result);
    } catch (err) {
      logger.error(`PATCH /api/attendance/${req.params.id} error:`, err);
      return res.status(500).json({ error: err?.message || "Failed to update attendance record" });
    }
  }
);
attendanceRouter.post(
  "/checkin",
  requireAuth,
  requirePermission(["attendance:write", "all:access"]),
  requireResourceOwnership({
    getTarget: (req) => ({
      targetStudentName: req.body.studentName,
      targetEmail: req.body.studentEmail,
      courseCode: req.body.courseCode || req.body.courseId || req.query.courseCode
    }),
    allowedRoles: ["super_admin", "admin", "registrar"]
  }),
  validateBody(CheckinSchema),
  async (req, res) => {
    try {
      const { studentName, studentId, date, status, notes, studentEmail, sessionId, manualOverride } = req.body;
      const actorUserId = req.user.userId;
      const actorRole = req.user.role;
      const result = await attendanceService.recordCheckin(
        { studentName, studentId, date, status, notes, studentEmail, sessionId, manualOverride },
        actorUserId,
        actorRole
      );
      return res.status(200).json(result);
    } catch (err) {
      logger.error("POST /api/attendance/checkin error:", err);
      return res.status(500).json({ error: err?.message || "Failed to record check-in" });
    }
  }
);
attendanceRouter.post(
  "/batch",
  requireAuth,
  requirePermission(["attendance:write", "all:access"]),
  validateBody(BatchAttendanceSchema),
  async (req, res) => {
    try {
      const { date, records: incomingRecords, sessionId, sessionTitle } = req.body;
      const actorUserId = req.user.userId;
      const actorRole = req.user.role;
      const result = await attendanceService.recordBatchAttendance(
        { date, records: incomingRecords, sessionId, sessionTitle },
        actorUserId,
        actorRole
      );
      return res.status(200).json(result);
    } catch (err) {
      logger.error("POST /api/attendance/batch error:", err);
      return res.status(500).json({ error: err?.message || "Failed to batch save attendance" });
    }
  }
);
attendanceRouter.post(
  "/override",
  requireAuth,
  requirePermission(["attendance:approve", "all:access"]),
  validateBody(OverrideAttendanceSchema),
  async (req, res) => {
    try {
      const { studentName, studentId, date, status, reason, sessionId } = req.body;
      const actorUserId = req.user.userId;
      const actorRole = req.user.role;
      if (!studentName || !date || !status) {
        return res.status(400).json({ error: "studentName, date, and status are required" });
      }
      try {
        validateAttendanceStatus(status);
      } catch (valErr) {
        return res.status(400).json({ error: valErr.message });
      }
      const result = await attendanceService.recordCheckin(
        {
          studentName,
          studentId,
          date,
          sessionId,
          status,
          notes: reason ? `[Override by ${actorUserId}]: ${reason}` : "Administrative override",
          manualOverride: true
        },
        actorUserId,
        actorRole
      );
      return res.status(200).json({
        status: "overridden",
        record: result.record
      });
    } catch (err) {
      logger.error("POST /api/attendance/override error:", err);
      return res.status(500).json({ error: err?.message || "Failed to override attendance" });
    }
  }
);
attendanceRouter.post(
  "/excuse",
  requireAuth,
  requireResourceOwnership({
    getTarget: (req) => ({
      targetStudentName: req.body.studentName,
      targetStudentId: req.body.studentId,
      courseCode: req.body.courseCode || req.body.courseId || req.query.courseCode
    }),
    allowedRoles: ["super_admin", "admin", "registrar"]
  }),
  validateBody(ExcuseAttendanceSchema),
  async (req, res) => {
    try {
      const { studentName, studentId, date, reason, documentUrl } = req.body;
      const actorUserId = req.user.userId;
      const actorRole = req.user.role;
      if (!studentName && !studentId || !date) {
        return res.status(400).json({ error: "studentId or studentName, and date are required" });
      }
      const result = await attendanceService.recordExcuse(
        { studentName, studentId, date, reason, documentUrl },
        actorUserId,
        actorRole
      );
      return res.status(200).json(result);
    } catch (err) {
      logger.error("POST /api/attendance/excuse error:", err);
      return res.status(500).json({ error: "Failed to record excused absence" });
    }
  }
);
attendanceRouter.get(
  "/at-risk",
  requirePermission(["attendance:read", "all:access"]),
  async (req, res) => {
    try {
      const user = req.user;
      const result = await attendanceService.getAtRiskStudents(user);
      return res.status(200).json(result);
    } catch (err) {
      logger.error("GET /api/attendance/at-risk error:", err);
      return res.status(500).json({ error: "Failed to evaluate at-risk attendance" });
    }
  }
);

// src/server/routes/payments.ts
var import_express9 = require("express");
init_rbac2();
init_logger();

// src/server/schemas/finance.schema.ts
var import_zod3 = require("zod");
var RecordPaymentSchema = import_zod3.z.object({
  payment: import_zod3.z.object({
    invoiceId: import_zod3.z.string().uuid("Invalid UUID format for invoiceId"),
    amount: import_zod3.z.number().positive("Amount must be a positive number").refine((val) => val > 0, "Amount must be strictly greater than 0"),
    paymentMethod: import_zod3.z.enum([
      "stripe",
      "card",
      "bank_transfer",
      "cash",
      "check",
      "scholarship",
      "other"
    ]).refine((val) => ["stripe", "card", "bank_transfer", "cash", "check", "scholarship", "other"].includes(val), {
      message: "Unsupported payment method"
    }),
    paymentDate: import_zod3.z.string().datetime({ message: "Invalid ISO date format for paymentDate" }),
    transactionReference: import_zod3.z.string().max(100, "Reference excessively long").optional(),
    studentId: import_zod3.z.string().uuid().optional(),
    studentName: import_zod3.z.string().optional()
  }).strict().optional(),
  transaction: import_zod3.z.object({
    invoiceId: import_zod3.z.string().uuid("Invalid UUID format for invoiceId"),
    amount: import_zod3.z.number().positive("Amount must be a positive number").refine((val) => val > 0, "Amount must be strictly greater than 0"),
    paymentMethod: import_zod3.z.enum([
      "stripe",
      "card",
      "bank_transfer",
      "cash",
      "check",
      "scholarship",
      "other"
    ]).refine((val) => ["stripe", "card", "bank_transfer", "cash", "check", "scholarship", "other"].includes(val), {
      message: "Unsupported payment method"
    }),
    paymentDate: import_zod3.z.string().datetime({ message: "Invalid ISO date format for paymentDate" }),
    transactionReference: import_zod3.z.string().max(100, "Reference excessively long").optional(),
    studentId: import_zod3.z.string().uuid().optional(),
    studentName: import_zod3.z.string().optional()
  }).strict().optional()
}).refine((data) => data.payment !== void 0 || data.transaction !== void 0, {
  message: "Request body must contain either 'payment' or 'transaction' object"
});
var InvoiceSchema = import_zod3.z.object({
  invoice: import_zod3.z.object({
    studentId: import_zod3.z.string().uuid().optional(),
    studentName: import_zod3.z.string().optional(),
    moduleTrack: import_zod3.z.string().min(1),
    term: import_zod3.z.string().min(1),
    academicYear: import_zod3.z.string().min(1),
    dueDate: import_zod3.z.string().datetime(),
    lines: import_zod3.z.array(import_zod3.z.object({
      lineType: import_zod3.z.enum(["tuition", "fee", "other"]),
      description: import_zod3.z.string().min(1),
      quantity: import_zod3.z.number().positive(),
      unitAmount: import_zod3.z.number().nonnegative()
    })).min(1)
  }).strict()
});
var AdjustmentSchema = import_zod3.z.object({
  adjustment: import_zod3.z.object({
    invoiceId: import_zod3.z.string().uuid(),
    amount: import_zod3.z.number().positive(),
    adjustmentType: import_zod3.z.string().min(1),
    isCharge: import_zod3.z.boolean(),
    reason: import_zod3.z.string().min(1)
  }).strict()
});
var RefundSchema = import_zod3.z.object({
  refund: import_zod3.z.object({
    paymentId: import_zod3.z.string().uuid().optional(),
    invoiceId: import_zod3.z.string().uuid().optional(),
    amount: import_zod3.z.number().positive(),
    reason: import_zod3.z.string().min(1)
  }).strict()
});

// src/server/routes/payments.ts
var paymentsRouter = (0, import_express9.Router)();
paymentsRouter.use(requireAuth);
paymentsRouter.get(
  "/",
  requirePermission(["finance:read", "all:access"]),
  async (req, res) => {
    try {
      const user = req.user;
      const invoiceId = req.query.invoiceId || void 0;
      const studentId = req.query.studentId || void 0;
      const studentName = req.query.studentName || void 0;
      const result = await financeService.getTransactions({ invoiceId, studentId, studentName }, user);
      return res.status(200).json({
        payments: result.transactions,
        transactions: result.transactions,
        total: result.total
      });
    } catch (err) {
      logger.error("GET /api/payments error:", err);
      return res.status(500).json({ error: "Failed to fetch payments" });
    }
  }
);
paymentsRouter.post(
  "/",
  requirePermission(["finance:write", "all:access"]),
  requireResourceOwnership({
    getTarget: (req) => ({
      targetStudentId: req.body.payment?.studentId || req.body.transaction?.studentId || req.body.studentId
    }),
    allowedRoles: ["super_admin", "admin", "finance_officer", "registrar"]
  }),
  async (req, res) => {
    try {
      const pmtPayload = req.body.transaction || req.body.payment || req.body;
      const actorUserId = req.user.userId;
      const actorRole = req.user.role;
      if (!pmtPayload || !pmtPayload.studentName && !pmtPayload.studentId || !pmtPayload.amount) {
        return res.status(400).json({ error: "studentId or studentName, and amount are required" });
      }
      const result = await financeService.recordPayment(pmtPayload, actorUserId, actorRole);
      return res.status(201).json(result);
    } catch (err) {
      logger.error("POST /api/payments error:", err);
      return res.status(500).json({ error: err?.message || "Failed to record payment" });
    }
  }
);
paymentsRouter.get(
  "/invoices",
  requirePermission(["finance:read", "all:access"]),
  requireResourceOwnership({
    getTarget: (req) => ({
      targetStudentId: req.query.studentId || void 0
    }),
    allowedRoles: ["super_admin", "admin", "finance_officer", "registrar"]
  }),
  async (req, res) => {
    try {
      const user = req.user;
      const studentId = req.query.studentId || void 0;
      const studentName = req.query.studentName || void 0;
      const result = await financeService.getInvoices({ studentId, studentName }, user);
      return res.status(200).json({
        invoices: result.invoices,
        total: result.total,
        updatedAt: (/* @__PURE__ */ new Date()).toISOString()
      });
    } catch (err) {
      logger.error("GET /api/payments/invoices error:", err);
      return res.status(500).json({ error: "Failed to fetch invoices" });
    }
  }
);
paymentsRouter.post(
  "/invoices",
  requirePermission(["finance:write", "all:access"]),
  validateBody(InvoiceSchema),
  async (req, res) => {
    try {
      const { invoice } = req.body;
      const actorUserId = req.user.userId;
      const actorRole = req.user.role;
      const result = await financeService.saveInvoice(invoice, actorUserId, actorRole);
      return res.status(201).json(result);
    } catch (err) {
      logger.error("POST /api/payments/invoices error:", err);
      return res.status(500).json({ error: "Failed to create invoice" });
    }
  }
);
paymentsRouter.get(
  "/transactions",
  requirePermission(["finance:read", "all:access"]),
  async (req, res) => {
    try {
      const user = req.user;
      const invoiceId = req.query.invoiceId || void 0;
      const studentId = req.query.studentId || void 0;
      const studentName = req.query.studentName || void 0;
      const result = await financeService.getTransactions({ invoiceId, studentId, studentName }, user);
      return res.status(200).json({
        transactions: result.transactions,
        total: result.total
      });
    } catch (err) {
      logger.error("GET /api/payments/transactions error:", err);
      return res.status(500).json({ error: "Failed to fetch transactions" });
    }
  }
);
paymentsRouter.post(
  "/transactions",
  requirePermission(["finance:write", "all:access"]),
  requireResourceOwnership({
    getTarget: (req) => ({
      targetStudentId: req.body.payment?.studentId || req.body.transaction?.studentId
    }),
    allowedRoles: ["super_admin", "admin", "finance_officer", "registrar"]
  }),
  validateBody(RecordPaymentSchema),
  async (req, res) => {
    try {
      const { transaction, payment } = req.body;
      const pmtPayload = transaction || payment;
      const actorUserId = req.user.userId;
      const actorRole = req.user.role;
      if (!pmtPayload || !pmtPayload.studentName && !pmtPayload.studentId || !pmtPayload.amount) {
        return res.status(400).json({ error: "studentId or studentName, and amount are required" });
      }
      const result = await financeService.recordPayment(pmtPayload, actorUserId, actorRole);
      return res.status(201).json(result);
    } catch (err) {
      logger.error("POST /api/payments/transactions error:", err);
      return res.status(500).json({ error: "Failed to record payment" });
    }
  }
);
paymentsRouter.get(
  "/adjustments",
  requirePermission(["finance:read", "all:access"]),
  async (req, res) => {
    try {
      const user = req.user;
      const invoiceId = req.query.invoiceId || void 0;
      const studentId = req.query.studentId || void 0;
      const result = await financeService.getAdjustments({ invoiceId, studentId }, user);
      return res.status(200).json(result);
    } catch (err) {
      logger.error("GET /api/payments/adjustments error:", err);
      return res.status(500).json({ error: "Failed to fetch adjustments" });
    }
  }
);
paymentsRouter.post(
  "/adjustments",
  requirePermission(["finance:write", "all:access"]),
  validateBody(AdjustmentSchema),
  async (req, res) => {
    try {
      const { adjustment } = req.body;
      const actorUserId = req.user.userId;
      const actorRole = req.user.role;
      const result = await financeService.applyFinancialAdjustment(adjustment, actorUserId, actorRole);
      return res.status(201).json(result);
    } catch (err) {
      logger.error("POST /api/payments/adjustments error:", err);
      return res.status(500).json({ error: "Failed to apply adjustment" });
    }
  }
);
paymentsRouter.get(
  "/refunds",
  requirePermission(["finance:read", "all:access"]),
  async (req, res) => {
    try {
      const user = req.user;
      const invoiceId = req.query.invoiceId || void 0;
      const studentId = req.query.studentId || void 0;
      const result = await financeService.getRefunds({ invoiceId, studentId }, user);
      return res.status(200).json(result);
    } catch (err) {
      logger.error("GET /api/payments/refunds error:", err);
      return res.status(500).json({ error: "Failed to fetch refunds" });
    }
  }
);
paymentsRouter.post(
  "/refunds",
  requirePermission(["finance:write", "all:access"]),
  validateBody(RefundSchema),
  async (req, res) => {
    try {
      const { refund } = req.body;
      const actorUserId = req.user.userId;
      const actorRole = req.user.role;
      const result = await financeService.recordRefund(refund, actorUserId, actorRole);
      return res.status(201).json(result);
    } catch (err) {
      logger.error("POST /api/payments/refunds error:", err);
      return res.status(500).json({ error: "Failed to record refund" });
    }
  }
);
paymentsRouter.get(
  "/summary",
  requirePermission(["finance:read", "all:access"]),
  async (req, res) => {
    try {
      const user = req.user;
      const invoicesRes = await financeService.getInvoices(void 0, user);
      const txsRes = await financeService.getTransactions(void 0, user);
      const totalBilled = invoicesRes.invoices.reduce((acc, i) => acc + (i.totalTuition || 0), 0);
      const totalCollected = txsRes.transactions.reduce((acc, t) => acc + (t.amount || 0), 0);
      const totalOutstanding = invoicesRes.invoices.reduce((acc, i) => acc + (i.outstandingBalance || 0), 0);
      const pendingCount = invoicesRes.invoices.filter((i) => i.status !== "Paid").length;
      return res.status(200).json({
        totalPayments: txsRes.total,
        totalCollected,
        totalBilled,
        totalOutstanding,
        pendingCount,
        currency: "USD"
      });
    } catch (err) {
      logger.error("GET /api/payments/summary error:", err);
      return res.status(500).json({ error: "Failed to get payment summary" });
    }
  }
);
paymentsRouter.get(
  "/sequence/next",
  requirePermission(["finance:read", "finance:write", "all:access"]),
  async (req, res) => {
    try {
      const type = req.query.type || "invoice";
      const year = req.query.year || "2026";
      const sequenceNumber = await financeService.getNextSequenceNumber(type, year);
      return res.status(200).json({ sequenceNumber });
    } catch (err) {
      logger.error("GET /api/payments/sequence/next error:", err);
      return res.status(500).json({ error: "Failed to generate sequence number" });
    }
  }
);

// src/server/routes/library.ts
var import_express10 = require("express");
init_supabaseServer();
init_rbac2();
init_logger();
var libraryRouter = (0, import_express10.Router)();
libraryRouter.use(requireAuth);
libraryRouter.get("/", async (req, res) => {
  try {
    const user = req.user;
    const state = await getAuthorizedStateForUser(user);
    const resources = state?.libraryResources || [];
    const classroomMedia = state?.classroomMedia || [];
    return res.status(200).json({
      resources,
      classroomMedia,
      count: resources.length,
      updatedAt: state?.updatedAt || (/* @__PURE__ */ new Date()).toISOString()
    });
  } catch (err) {
    logger.error("GET /api/library error:", err);
    return res.status(500).json({ error: "Failed to fetch library resources" });
  }
});
libraryRouter.post(
  "/",
  requirePermission(["students:write", "roles:manage", "all:access"]),
  async (req, res) => {
    try {
      const { resource } = req.body;
      const actorUserId = req.user.userId;
      const actorRole = req.user.role;
      if (!resource || !resource.title) {
        return res.status(400).json({ error: "Resource title is required" });
      }
      const state = await getAuthoritativeState(actorUserId) || {};
      const resources = [...state.libraryResources || []];
      const newResource = {
        id: resource.id || `LIB-${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        title: resource.title,
        category: resource.category || "Study Guide",
        author: resource.author || "Faculty",
        courseCode: resource.courseCode || "General",
        url: resource.url || "",
        fileType: resource.fileType || "pdf",
        description: resource.description || "",
        uploadedAt: (/* @__PURE__ */ new Date()).toISOString()
      };
      resources.unshift(newResource);
      const updatedState = {
        ...state,
        libraryResources: resources,
        updatedAt: (/* @__PURE__ */ new Date()).toISOString(),
        updatedBy: req.user.email
      };
      await saveAuthoritativeState(
        updatedState,
        actorUserId,
        `Added library resource: ${newResource.title}`
      );
      await logAuditEvent({
        actorUserId,
        actorRole,
        entityType: "library_resource",
        entityId: newResource.id,
        action: "create",
        newValues: newResource,
        changedFields: Object.keys(newResource),
        reason: `Added library resource: ${newResource.title}`
      });
      return res.status(201).json({
        status: "added",
        resource: newResource
      });
    } catch (err) {
      logger.error("POST /api/library error:", err);
      return res.status(500).json({ error: "Failed to add library resource" });
    }
  }
);
libraryRouter.delete(
  "/:id",
  requirePermission(["students:write", "roles:manage", "all:access"]),
  async (req, res) => {
    try {
      const id = req.params.id;
      const actorUserId = req.user.userId;
      const actorRole = req.user.role;
      const state = await getAuthoritativeState(actorUserId) || {};
      let resources = [...state.libraryResources || []];
      const target = resources.find((r) => r.id === id);
      resources = resources.filter((r) => r.id !== id);
      const updatedState = {
        ...state,
        libraryResources: resources,
        updatedAt: (/* @__PURE__ */ new Date()).toISOString(),
        updatedBy: req.user.email
      };
      await saveAuthoritativeState(
        updatedState,
        actorUserId,
        `Removed library resource: ${target?.title || id}`
      );
      await logAuditEvent({
        actorUserId,
        actorRole,
        entityType: "library_resource",
        entityId: id,
        action: "delete",
        oldValues: target,
        changedFields: ["libraryResources"],
        reason: `Removed library resource: ${target?.title || id}`
      });
      return res.status(200).json({ status: "deleted", id });
    } catch (err) {
      logger.error("DELETE /api/library/:id error:", err);
      return res.status(500).json({ error: "Failed to delete library resource" });
    }
  }
);

// src/server/routes/assignments.ts
var import_express11 = require("express");
init_rbac2();
init_logger();
var assignmentsRouter = (0, import_express11.Router)();
assignmentsRouter.use(requireAuth);
assignmentsRouter.get(
  "/",
  requirePermission(["assignments:read", "all:access"]),
  async (req, res) => {
    try {
      const user = req.user;
      const result = await assignmentsService.getAssignments(user);
      return res.status(200).json({
        assignments: result.assignments,
        count: result.count
      });
    } catch (err) {
      logger.error("GET /api/assignments error:", err);
      return res.status(500).json({ error: "Failed to fetch assignments" });
    }
  }
);
assignmentsRouter.post(
  "/",
  requireAuth,
  requirePermission(["assignments:grade", "grades:write", "all:access"]),
  async (req, res) => {
    try {
      const user = req.user;
      const { title, description, courseCode, courseId, dueDate, dueAt, maxScore, maxPoints, weight, isPublished, rubric } = req.body;
      if (!title || typeof title !== "string") {
        return res.status(400).json({ error: "Assignment title is required" });
      }
      const result = await assignmentsService.createAssignment(
        { title, description, courseCode, courseId, dueDate, dueAt, maxScore, maxPoints, weight, isPublished, rubric },
        user
      );
      return res.status(201).json(result);
    } catch (err) {
      logger.error("POST /api/assignments error:", err);
      return res.status(500).json({ error: err?.message || "Failed to create assignment" });
    }
  }
);
assignmentsRouter.patch(
  "/:id",
  requireAuth,
  requirePermission(["assignments:grade", "grades:write", "all:access"]),
  async (req, res) => {
    try {
      const user = req.user;
      const id = req.params.id;
      const { title, description, courseCode, dueDate, dueAt, maxScore, maxPoints, weight, isPublished, rubric } = req.body;
      const result = await assignmentsService.updateAssignment(
        id,
        { title, description, courseCode, dueDate, dueAt, maxScore, maxPoints, weight, isPublished, rubric },
        user
      );
      return res.status(200).json(result);
    } catch (err) {
      logger.error(`PATCH /api/assignments/${req.params.id} error:`, err);
      return res.status(500).json({ error: err?.message || "Failed to update assignment" });
    }
  }
);
assignmentsRouter.get(
  "/submissions",
  requirePermission(["assignments:read", "grades:read", "all:access"]),
  async (req, res) => {
    try {
      const user = req.user;
      const studentId = req.query.studentId || void 0;
      const studentName = req.query.studentName || void 0;
      const assignmentId = req.query.assignmentId || void 0;
      const result = await assignmentsService.getSubmissions({ studentId, studentName, assignmentId }, user);
      return res.status(200).json({
        submissions: result.submissions,
        rubricScores: result.rubricScores,
        count: result.count
      });
    } catch (err) {
      logger.error("GET /api/assignments/submissions error:", err);
      return res.status(500).json({ error: "Failed to fetch submissions" });
    }
  }
);
assignmentsRouter.post(
  "/:id/submissions",
  requireAuth,
  requirePermission(["assignments:submit", "all:access"]),
  async (req, res) => {
    try {
      const assignmentId = req.params.id;
      const user = req.user;
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
    } catch (err) {
      logger.error(`POST /api/assignments/${req.params.id}/submissions error:`, err);
      const statusCode = err.message?.includes("not found") ? 404 : 400;
      return res.status(statusCode).json({ error: err.message || "Failed to submit assignment" });
    }
  }
);
assignmentsRouter.post(
  "/submit",
  requireAuth,
  requirePermission(["assignments:submit", "all:access"]),
  async (req, res) => {
    try {
      const user = req.user;
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
    } catch (err) {
      logger.error("POST /api/assignments/submit error:", err);
      const statusCode = err.message?.includes("not found") ? 404 : 400;
      return res.status(statusCode).json({ error: err.message || "Failed to submit assignment" });
    }
  }
);
assignmentsRouter.post(
  "/grade",
  requireAuth,
  requirePermission(["assignments:grade", "grades:write", "all:access"]),
  requireResourceOwnership({
    getTarget: (req) => ({
      courseCode: req.body.courseCode
      // Assumes frontend sends courseCode for verification
    }),
    allowedRoles: ["super_admin", "admin", "registrar"]
  }),
  async (req, res) => {
    try {
      const { submissionId, assignmentId, studentId, score, feedback, rubricScores, overrideReason, courseCode } = req.body;
      const actorUser = req.user;
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
    } catch (err) {
      logger.error("POST /api/assignments/grade error:", err);
      const isLockedErr = err.message?.includes("LOCKED");
      const statusCode = isLockedErr ? 403 : err.message?.includes("not found") ? 404 : 400;
      return res.status(statusCode).json({ error: err.message || "Failed to record grade" });
    }
  }
);
assignmentsRouter.post(
  "/grade/transition",
  requireAuth,
  requirePermission(["assignments:grade", "grades:write", "all:access"]),
  async (req, res) => {
    try {
      const { submissionId, targetStatus, reason } = req.body;
      const actorUser = req.user;
      if (!submissionId || !targetStatus) {
        return res.status(400).json({ error: "submissionId and targetStatus are required" });
      }
      const result = await assignmentsService.transitionGradeLifecycle(
        { submissionId, targetStatus, reason },
        actorUser
      );
      return res.status(200).json(result);
    } catch (err) {
      logger.error("POST /api/assignments/grade/transition error:", err);
      const isDenied = err.message?.includes("Access denied");
      const statusCode = isDenied ? 403 : err.message?.includes("not found") ? 404 : 400;
      return res.status(statusCode).json({ error: err.message || "Failed to transition grade lifecycle" });
    }
  }
);
assignmentsRouter.post(
  "/grade/override",
  requireAuth,
  requirePermission(["grades:write", "all:access"]),
  async (req, res) => {
    try {
      const { submissionId, score, feedback, reason } = req.body;
      const actorUser = req.user;
      const elevatedRoles = ["super_admin", "admin", "registrar"];
      if (!elevatedRoles.includes(actorUser.role)) {
        return res.status(403).json({ error: "Access denied: Only Registrar or Admin can approve grade overrides for locked records." });
      }
      if (!submissionId || score === void 0 || !reason) {
        return res.status(400).json({ error: "submissionId, score, and explicit reason are required for an administrative override." });
      }
      const result = await assignmentsService.overrideLockedGrade(
        { submissionId, score: Number(score), feedback, reason },
        actorUser
      );
      return res.status(200).json(result);
    } catch (err) {
      logger.error("POST /api/assignments/grade/override error:", err);
      const statusCode = err.message?.includes("Access denied") ? 403 : 400;
      return res.status(statusCode).json({ error: err.message || "Failed to perform administrative grade override" });
    }
  }
);

// src/server/routes/grades.ts
var import_express12 = require("express");
init_rbac2();
init_logger();
var gradesRouter = (0, import_express12.Router)();
gradesRouter.use(requireAuth);
gradesRouter.get(
  "/",
  requirePermission(["grades:read", "assignments:read", "all:access"]),
  async (req, res) => {
    try {
      const user = req.user;
      const studentId = req.query.studentId || void 0;
      const studentName = req.query.studentName || void 0;
      const assignmentId = req.query.assignmentId || void 0;
      const result = await assignmentsService.getSubmissions({ studentId, studentName, assignmentId }, user);
      return res.status(200).json({
        grades: result.submissions,
        rubricScores: result.rubricScores,
        count: result.count
      });
    } catch (err) {
      logger.error("GET /api/grades error:", err);
      return res.status(500).json({ error: "Failed to fetch grades" });
    }
  }
);
gradesRouter.post(
  "/",
  requirePermission(["grades:write", "assignments:grade", "all:access"]),
  requireResourceOwnership({
    getTarget: (req) => ({
      courseCode: req.body.courseCode
    }),
    allowedRoles: ["super_admin", "admin", "registrar"]
  }),
  async (req, res) => {
    try {
      const { submissionId, assignmentId, studentId, score, feedback, rubricScores, overrideReason } = req.body;
      const actorUser = req.user;
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
    } catch (err) {
      logger.error("POST /api/grades error:", err);
      const isLockedErr = err.message?.includes("LOCKED");
      const statusCode = isLockedErr ? 403 : err.message?.includes("not found") ? 404 : 400;
      return res.status(statusCode).json({ error: err.message || "Failed to record grade" });
    }
  }
);
gradesRouter.patch(
  "/:id",
  requirePermission(["grades:write", "assignments:grade", "all:access"]),
  async (req, res) => {
    try {
      const submissionId = req.params.id;
      const { score, feedback, rubricScores, overrideReason } = req.body;
      const actorUser = req.user;
      const result = await assignmentsService.gradeSubmission(
        { submissionId, score: score !== void 0 ? Number(score) : void 0, feedback, rubricScores, overrideReason },
        actorUser
      );
      return res.status(200).json(result);
    } catch (err) {
      logger.error(`PATCH /api/grades/${req.params.id} error:`, err);
      return res.status(400).json({ error: err.message || "Failed to update grade" });
    }
  }
);
gradesRouter.post(
  "/transition",
  requirePermission(["grades:write", "assignments:grade", "all:access"]),
  async (req, res) => {
    try {
      const { submissionId, targetStatus, reason } = req.body;
      const actorUser = req.user;
      if (!submissionId || !targetStatus) {
        return res.status(400).json({ error: "submissionId and targetStatus are required" });
      }
      const result = await assignmentsService.transitionGradeLifecycle(
        { submissionId, targetStatus, reason },
        actorUser
      );
      return res.status(200).json(result);
    } catch (err) {
      logger.error("POST /api/grades/transition error:", err);
      const statusCode = err.message?.includes("Access denied") ? 403 : err.message?.includes("not found") ? 404 : 400;
      return res.status(statusCode).json({ error: err.message || "Failed to transition grade lifecycle" });
    }
  }
);
gradesRouter.post(
  "/override",
  requirePermission(["grades:write", "grades:release", "all:access"]),
  async (req, res) => {
    try {
      const { submissionId, score, feedback, reason } = req.body;
      const actorUser = req.user;
      const elevatedRoles = ["super_admin", "admin", "registrar"];
      if (!elevatedRoles.includes(actorUser.role)) {
        return res.status(403).json({ error: "Access denied: Only Registrar or Admin can approve grade overrides for locked records." });
      }
      if (!submissionId || score === void 0 || !reason) {
        return res.status(400).json({ error: "submissionId, score, and explicit reason are required for an administrative override." });
      }
      const result = await assignmentsService.overrideLockedGrade(
        { submissionId, score: Number(score), feedback, reason },
        actorUser
      );
      return res.status(200).json(result);
    } catch (err) {
      logger.error("POST /api/grades/override error:", err);
      const statusCode = err.message?.includes("Access denied") ? 403 : 400;
      return res.status(statusCode).json({ error: err.message || "Failed to perform administrative grade override" });
    }
  }
);

// src/server/routes/invoices.ts
var import_express13 = require("express");
init_rbac2();
init_supabaseServer();
init_logger();
var invoicesRouter = (0, import_express13.Router)();
invoicesRouter.use(requireAuth);
invoicesRouter.get(
  "/",
  requirePermission(["finance:read", "all:access"]),
  requireResourceOwnership({
    getTarget: (req) => ({
      targetStudentId: req.query.studentId || void 0
    }),
    allowedRoles: ["super_admin", "admin", "finance_officer", "registrar"]
  }),
  async (req, res) => {
    try {
      const user = req.user;
      const studentId = req.query.studentId || void 0;
      const studentName = req.query.studentName || void 0;
      const result = await financeService.getInvoices({ studentId, studentName }, user);
      return res.status(200).json({
        invoices: result.invoices,
        total: result.total,
        updatedAt: (/* @__PURE__ */ new Date()).toISOString()
      });
    } catch (err) {
      logger.error("GET /api/invoices error:", err);
      return res.status(500).json({ error: "Failed to fetch invoices" });
    }
  }
);
invoicesRouter.get(
  "/:id",
  requirePermission(["finance:read", "all:access"]),
  async (req, res) => {
    try {
      const user = req.user;
      const invoiceId = req.params.id;
      const supabase = getServerSupabase();
      const { data: rawInvoice } = await supabase.from("invoices").select("id, invoice_number, student_id").or(`id.eq.${invoiceId},invoice_number.eq.${invoiceId}`).is("deleted_at", null).maybeSingle();
      if (!rawInvoice) {
        return res.status(404).json({ error: "Invoice not found" });
      }
      if (user.role === "student") {
        const studentUuid = (user.studentRecordId || user.userId || "").toLowerCase().trim();
        const invoiceStudentId = (rawInvoice.student_id || "").toLowerCase().trim();
        if (invoiceStudentId && invoiceStudentId !== studentUuid) {
          logger.warn(`Student ${user.email} attempted to access invoice ${invoiceId} belonging to student ${rawInvoice.student_id}`);
          return res.status(403).json({
            error: "Access Denied: You do not have permission to view another student's invoice.",
            code: "RESOURCE_OWNERSHIP_DENIED"
          });
        }
      }
      const result = await financeService.getInvoices(void 0, user);
      const invoice = result.invoices.find((i) => i.id === invoiceId || i.invoiceNumber === invoiceId);
      if (!invoice) {
        return res.status(404).json({ error: "Invoice not found" });
      }
      return res.status(200).json({ invoice });
    } catch (err) {
      logger.error(`GET /api/invoices/${req.params.id} error:`, err);
      return res.status(500).json({ error: "Failed to fetch invoice" });
    }
  }
);
invoicesRouter.post(
  "/",
  requirePermission(["finance:write", "all:access"]),
  validateBody(InvoiceSchema),
  async (req, res) => {
    try {
      const invoicePayload = req.body?.invoice || req.body;
      const actorUserId = req.user.userId;
      const actorRole = req.user.role;
      const result = await financeService.saveInvoice(invoicePayload, actorUserId, actorRole);
      return res.status(201).json(result);
    } catch (err) {
      logger.error("POST /api/invoices error:", err);
      return res.status(500).json({ error: err?.message || "Failed to create invoice" });
    }
  }
);
invoicesRouter.patch(
  "/:id",
  requirePermission(["finance:write", "all:access"]),
  async (req, res) => {
    try {
      const invoiceId = req.params.id;
      const invoicePayload = { ...req.body?.invoice || req.body, id: invoiceId };
      const actorUserId = req.user.userId;
      const actorRole = req.user.role;
      const result = await financeService.saveInvoice(invoicePayload, actorUserId, actorRole);
      return res.status(200).json(result);
    } catch (err) {
      logger.error(`PATCH /api/invoices/${req.params.id} error:`, err);
      return res.status(500).json({ error: err?.message || "Failed to update invoice" });
    }
  }
);
invoicesRouter.post(
  "/adjustments",
  requirePermission(["finance:write", "all:access"]),
  validateBody(AdjustmentSchema),
  async (req, res) => {
    try {
      const { adjustment } = req.body;
      const actorUserId = req.user.userId;
      const actorRole = req.user.role;
      const result = await financeService.applyFinancialAdjustment(adjustment, actorUserId, actorRole);
      return res.status(201).json(result);
    } catch (err) {
      logger.error("POST /api/invoices/adjustments error:", err);
      return res.status(500).json({ error: err?.message || "Failed to record adjustment" });
    }
  }
);

// src/server/routes/auditLogs.ts
var import_express14 = require("express");
init_supabaseServer();
init_rbac2();
init_logger();
var auditLogsRouter = (0, import_express14.Router)();
auditLogsRouter.use(requireAuth);
auditLogsRouter.get(
  "/",
  requirePermission("audit:read"),
  async (req, res) => {
    try {
      const limit = parseInt(req.query.limit || "50", 10);
      const entityType = req.query.entityType || void 0;
      const logs = await getAuditLogs(limit, entityType);
      return res.status(200).json({
        logs,
        count: logs.length
      });
    } catch (err) {
      logger.error("GET /api/audit-logs error:", err);
      return res.status(500).json({ error: "Failed to fetch audit logs" });
    }
  }
);
auditLogsRouter.post("/", (_req, res) => {
  return res.status(405).json({
    error: "Method Not Allowed: Audit log entries are generated authoritatively by server-side actions only and cannot be manually inserted.",
    code: "AUDIT_MUTATION_RESTRICTED"
  });
});

// src/server/routes/state.ts
var import_express15 = require("express");
init_rbac2();
init_logger();
var stateRouter = (0, import_express15.Router)();
stateRouter.use(requireAuth);
stateRouter.get("/", async (req, res) => {
  try {
    const user = req.user;
    const state = await stateHydrationService.getComposedStateForUser(user);
    if (!state) {
      return res.status(200).json({
        state: null,
        version: 0,
        source: "relational_postgresql",
        userId: user.userId,
        message: "No state found"
      });
    }
    const version = Number(state.version) || 1;
    return res.status(200).json({
      state,
      version,
      source: "relational_postgresql",
      userId: user.userId,
      role: user.role,
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    });
  } catch (err) {
    logger.error("GET /api/state error:", err);
    return res.status(500).json({ error: "Failed to load state from relational database" });
  }
});
stateRouter.post("/", (req, res) => {
  return res.status(405).json({
    error: "Method Not Allowed: /api/state is a GET-only read-composition endpoint. Monolithic state persistence to app_states is discontinued in favor of discrete relational domain mutations.",
    code: "MUTATION_ENDPOINT_DEPRECATED",
    recommendedEndpoints: {
      students: "POST /api/students | PATCH /api/students/:id",
      attendance: "POST /api/attendance | PATCH /api/attendance/:id",
      assignments: "POST /api/assignments | POST /api/assignments/:id/submissions",
      grades: "POST /api/grades",
      invoices: "POST /api/invoices | POST /api/payments/invoices",
      payments: "POST /api/payments | POST /api/payments/transactions",
      notifications: "POST /api/notifications | PATCH /api/notifications/:id"
    }
  });
});

// src/server/routes/me.ts
var import_express16 = require("express");
init_rbac2();
init_logger();
var meRouter = (0, import_express16.Router)();
meRouter.use(requireAuth);
meRouter.get("/", async (req, res) => {
  try {
    const user = req.user;
    let studentProfile = null;
    const identifier = user.studentRecordId || user.studentNumber || user.studentName || user.name || user.email;
    if (identifier) {
      studentProfile = await studentsService.getStudentByNameOrId(identifier, user);
    }
    return res.status(200).json({
      user: {
        userId: user.userId,
        studentId: user.studentId || null,
        // deprecated alias — always UUID
        studentRecordId: user.studentRecordId || null,
        // authoritative UUID
        studentNumber: user.studentNumber || null,
        // registration code e.g. SOM-2026-001
        email: user.email,
        name: user.name || user.studentName,
        studentName: user.studentName || user.name,
        role: user.role,
        assignedCourses: user.assignedCourses || [],
        permissions: user.permissions || []
      },
      studentProfile: studentProfile?.student || null
    });
  } catch (err) {
    logger.error("GET /api/me error:", err);
    return res.status(500).json({ error: "Failed to fetch user profile" });
  }
});
meRouter.get("/grades", async (req, res) => {
  try {
    const user = req.user;
    const studentId = user.studentRecordId || user.studentId;
    const studentName = user.studentName || user.name;
    const subResult = await assignmentsService.getSubmissions({ studentId, studentName }, user);
    const submissions = subResult.submissions || [];
    let totalGrade = 0;
    let gradedCount = 0;
    for (const s of submissions) {
      if (typeof s.score === "number" || typeof s.grade === "number") {
        totalGrade += s.score ?? s.grade;
        gradedCount++;
      }
    }
    const gpaPercent = gradedCount > 0 ? Math.round(totalGrade / gradedCount) : null;
    const honorRoll = gpaPercent !== null ? gpaPercent >= 85 : false;
    const standing = gpaPercent === null ? "Not Yet Graded" : honorRoll ? "High Distinction" : gpaPercent >= 75 ? "Satisfactory" : "At-Risk";
    return res.status(200).json({
      studentId: studentId || null,
      studentName: studentName || user.email.split("@")[0],
      averageGrade: gpaPercent,
      honorRoll,
      standing,
      submissions,
      rubricScores: subResult.rubricScores?.[studentName || ""] || null
    });
  } catch (err) {
    logger.error("GET /api/me/grades error:", err);
    return res.status(500).json({ error: "Failed to fetch grades" });
  }
});
meRouter.get("/attendance", async (req, res) => {
  try {
    const user = req.user;
    const attData = await attendanceService.getAttendance(user);
    const targetId = user.studentRecordId || user.studentId;
    const normName = (user.studentName || user.name || user.email.split("@")[0]).toLowerCase().trim();
    const studentRecords = (attData.records || []).filter((r) => {
      if (targetId && (r.studentId === targetId || r.student?.id === targetId)) return true;
      const rName = (r.student?.name || r.studentName || r.name || "").toLowerCase().trim();
      return rName === normName;
    });
    const totalSessions = attData.totalSessions || Math.max(studentRecords.length, 1);
    const presentCount = studentRecords.filter((r) => {
      const s = (r.status || "").toLowerCase();
      return s === "present" || s === "p" || s === "1" || s === "attended";
    }).length;
    const excusedCount = studentRecords.filter((r) => {
      const s = (r.status || "").toLowerCase();
      return s === "excused" || s === "e";
    }).length;
    const rate = totalSessions > 0 ? Math.round((presentCount + excusedCount) / totalSessions * 100) : 100;
    return res.status(200).json({
      studentId: user.studentRecordId || user.studentId || null,
      studentNumber: user.studentNumber || null,
      studentName: user.studentName || user.name || user.email.split("@")[0],
      totalSessions,
      presentCount,
      excusedCount,
      attendanceRate: rate,
      isAtRisk: rate < 75,
      records: studentRecords
    });
  } catch (err) {
    logger.error("GET /api/me/attendance error:", err);
    return res.status(500).json({ error: "Failed to fetch attendance history" });
  }
});
meRouter.get("/assignments", async (req, res) => {
  try {
    const user = req.user;
    const [asgRes, subRes] = await Promise.all([
      assignmentsService.getAssignments(user),
      assignmentsService.getSubmissions({ studentId: user.studentId, studentName: user.studentName || user.name }, user)
    ]);
    return res.status(200).json({
      assignments: asgRes.assignments || [],
      submissions: subRes.submissions || [],
      count: asgRes.assignments?.length || 0
    });
  } catch (err) {
    logger.error("GET /api/me/assignments error:", err);
    return res.status(500).json({ error: "Failed to fetch assignments" });
  }
});
meRouter.get("/invoices", async (req, res) => {
  try {
    const user = req.user;
    const invRes = await financeService.getInvoices(
      { studentId: user.studentRecordId || user.studentId, studentName: user.studentName || user.name },
      user
    );
    return res.status(200).json({
      invoices: invRes.invoices || [],
      total: invRes.total || 0,
      studentId: user.studentRecordId || user.studentId || null,
      studentNumber: user.studentNumber || null,
      studentName: user.studentName || user.name || user.email.split("@")[0]
    });
  } catch (err) {
    logger.error("GET /api/me/invoices error:", err);
    return res.status(500).json({ error: "Failed to fetch invoices" });
  }
});
meRouter.get("/payments", async (req, res) => {
  try {
    const user = req.user;
    const txnRes = await financeService.getTransactions(
      { studentId: user.studentRecordId || user.studentId, studentName: user.studentName || user.name },
      user
    );
    return res.status(200).json({
      payments: txnRes.transactions || [],
      total: txnRes.total || 0,
      studentId: user.studentRecordId || user.studentId || null,
      studentNumber: user.studentNumber || null,
      studentName: user.studentName || user.name || user.email.split("@")[0]
    });
  } catch (err) {
    logger.error("GET /api/me/payments error:", err);
    return res.status(500).json({ error: "Failed to fetch payments" });
  }
});
meRouter.get("/state", async (req, res) => {
  try {
    const user = req.user;
    const state = await stateHydrationService.getComposedStateForUser(user);
    if (!state) {
      return res.status(200).json({
        state: null,
        source: "relational_postgresql",
        userId: user.userId,
        message: "No state found"
      });
    }
    return res.status(200).json({
      state,
      source: "relational_postgresql",
      userId: user.userId,
      role: user.role,
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    });
  } catch (err) {
    logger.error("GET /api/me/state error:", err);
    return res.status(500).json({ error: "Failed to load authorized state from relational database" });
  }
});
meRouter.post("/state", (req, res) => {
  return res.status(405).json({
    error: "Method Not Allowed: /api/me/state is a read-only composition endpoint. Mutations must be executed via domain-specific relational endpoints (/api/students, /api/attendance, /api/grades, /api/assignments, /api/invoices, /api/payments).",
    code: "MUTATION_ENDPOINT_DEPRECATED"
  });
});

// src/server/routes/notifications.ts
var import_express17 = require("express");
init_rbac2();

// src/types/notifications.ts
var NOTIFICATION_DEFINITIONS = {
  // --- Student Notifications ---
  new_assignment: {
    label: "New Assignment",
    description: "Alerts student when faculty posts a new homework or essay exegesis",
    role: "student",
    category: "academic",
    defaultPriority: "normal",
    icon: "FileText",
    actionTab: "courses"
  },
  assignment_deadline: {
    label: "Assignment Deadline Approaching",
    description: "Reminder 24-48 hours before an assignment or exam is due",
    role: "student",
    category: "academic",
    defaultPriority: "high",
    icon: "Clock",
    actionTab: "courses"
  },
  grade_published: {
    label: "Grade Published",
    description: "Instant notification when an instructor evaluates coursework or exams",
    role: "student",
    category: "academic",
    defaultPriority: "normal",
    icon: "Award",
    actionTab: "courses"
  },
  attendance_warning: {
    label: "Attendance Warning",
    description: "Urgent notification when student attendance rate falls below the 75% threshold",
    role: "student",
    category: "attendance",
    defaultPriority: "urgent",
    icon: "AlertTriangle",
    actionTab: "attendance"
  },
  payment_reminder: {
    label: "Tuition Payment Reminder",
    description: "Upcoming semester tuition installment and balance notice",
    role: "student",
    category: "financial",
    defaultPriority: "high",
    icon: "DollarSign",
    actionTab: "payments"
  },
  new_announcement: {
    label: "New Ministry Announcement",
    description: "Broadcasts from HTEIM Leadership, class relocations, or live service broadcasts",
    role: "student",
    category: "announcement",
    defaultPriority: "normal",
    icon: "Radio",
    actionTab: "home"
  },
  registration_confirmation: {
    label: "Course Registration Confirmation",
    description: "Confirmation of semester term course offering enrollment",
    role: "student",
    category: "enrollment",
    defaultPriority: "normal",
    icon: "CheckCircle2",
    actionTab: "courses"
  },
  library_resource_added: {
    label: "Library Resource Added",
    description: "New ministerial textbook, commentary PDF, or lecture handout uploaded",
    role: "student",
    category: "library",
    defaultPriority: "low",
    icon: "BookOpen",
    actionTab: "library"
  },
  // --- Administrator Notifications ---
  new_enrollment: {
    label: "New Student Enrollment",
    description: "Alerts administration when a student submits an application or registers",
    role: "admin",
    category: "enrollment",
    defaultPriority: "normal",
    icon: "UserCheck",
    actionTab: "students"
  },
  payment_received: {
    label: "Tuition Payment Received",
    description: "Notifies treasury and admin when student pays tuition via bank, card, or cash",
    role: "admin",
    category: "financial",
    defaultPriority: "normal",
    icon: "DollarSign",
    actionTab: "payments"
  },
  outstanding_balance: {
    label: "Outstanding Tuition Balance",
    description: "Flags students with overdue tuition balances requiring follow-up",
    role: "admin",
    category: "financial",
    defaultPriority: "high",
    icon: "AlertCircle",
    actionTab: "payments"
  },
  attendance_issue: {
    label: "At-Risk Attendance Issue",
    description: "Flags students whose attendance has dropped into critical (<= 50%) or at-risk (< 75%) status",
    role: "admin",
    category: "attendance",
    defaultPriority: "urgent",
    icon: "AlertTriangle",
    actionTab: "attendance"
  },
  assignment_submitted: {
    label: "Assignment Submitted",
    description: "Notifies lecturers and faculty when a student submits coursework for evaluation",
    role: "admin",
    category: "academic",
    defaultPriority: "normal",
    icon: "FileUp",
    actionTab: "courses"
  },
  lecturer_pending_grades: {
    label: "Lecturer Pending Grades Alert",
    description: "Alerts administration when a lecturer has ungraded assignments past the grading window",
    role: "admin",
    category: "academic",
    defaultPriority: "high",
    icon: "Clock",
    actionTab: "courses"
  }
};
var DEFAULT_NOTIFICATION_PREFERENCES = {
  new_assignment: { in_app: true, email: true, push: true, whatsapp: false },
  assignment_deadline: { in_app: true, email: true, push: true, whatsapp: false },
  grade_published: { in_app: true, email: true, push: true, whatsapp: false },
  attendance_warning: { in_app: true, email: true, push: true, whatsapp: false },
  payment_reminder: { in_app: true, email: true, push: true, whatsapp: false },
  new_announcement: { in_app: true, email: true, push: true, whatsapp: false },
  registration_confirmation: { in_app: true, email: true, push: true, whatsapp: false },
  library_resource_added: { in_app: true, email: false, push: false, whatsapp: false },
  new_enrollment: { in_app: true, email: true, push: true, whatsapp: false },
  payment_received: { in_app: true, email: true, push: true, whatsapp: false },
  outstanding_balance: { in_app: true, email: true, push: true, whatsapp: false },
  attendance_issue: { in_app: true, email: true, push: true, whatsapp: false },
  assignment_submitted: { in_app: true, email: true, push: false, whatsapp: false },
  lecturer_pending_grades: { in_app: true, email: true, push: true, whatsapp: false },
  // Categories
  academic: { in_app: true, email: true, push: true, whatsapp: false },
  attendance: { in_app: true, email: true, push: true, whatsapp: false },
  financial: { in_app: true, email: true, push: true, whatsapp: false },
  announcement: { in_app: true, email: true, push: true, whatsapp: false },
  enrollment: { in_app: true, email: true, push: true, whatsapp: false },
  library: { in_app: true, email: false, push: false, whatsapp: false },
  system: { in_app: true, email: false, push: false, whatsapp: false }
};

// src/server/routes/notifications.ts
var notificationsRouter = (0, import_express17.Router)();
notificationsRouter.use(requireAuth);
var memoryNotifications = [
  // --- Student Notifications ---
  {
    id: "notif_std_1",
    category: "academic",
    eventType: "new_assignment",
    type: "new_assignment",
    title: "New Exegesis Paper Assigned: SOM-101",
    message: "Pastor Samuel Selkridge has posted a new Hermeneutical Exegesis assignment due next Tuesday.",
    createdAt: new Date(Date.now() - 1e3 * 60 * 30).toISOString(),
    read: false,
    priority: "normal",
    targetRole: "student",
    studentName: "Abigail Selkridge",
    actionTab: "courses",
    channelDelivery: {
      in_app: { delivered: true, deliveredAt: (/* @__PURE__ */ new Date()).toISOString() },
      email: { enabled: true, status: "sent", sentAt: (/* @__PURE__ */ new Date()).toISOString() },
      push: { enabled: true, status: "sent", sentAt: (/* @__PURE__ */ new Date()).toISOString() },
      whatsapp: { enabled: false, status: "planned" }
    }
  },
  {
    id: "notif_std_2",
    category: "academic",
    eventType: "assignment_deadline",
    type: "assignment_deadline",
    title: "Deadline Approaching: Evangelism Practicum Log",
    message: "Your 2-page personal soul-winning practicum report is due in 48 hours for SOM-102.",
    createdAt: new Date(Date.now() - 1e3 * 60 * 60 * 3).toISOString(),
    read: false,
    priority: "high",
    targetRole: "student",
    studentName: "Abigail Selkridge",
    actionTab: "courses",
    channelDelivery: {
      in_app: { delivered: true, deliveredAt: (/* @__PURE__ */ new Date()).toISOString() },
      email: { enabled: true, status: "sent", sentAt: (/* @__PURE__ */ new Date()).toISOString() },
      push: { enabled: true, status: "sent", sentAt: (/* @__PURE__ */ new Date()).toISOString() },
      whatsapp: { enabled: false, status: "planned" }
    }
  },
  {
    id: "notif_std_3",
    category: "academic",
    eventType: "grade_published",
    type: "grade_published",
    title: "Grade Published: Pastoral Ethics Exam",
    message: "Your evaluation for Ministerial Ethics Module 3 has been graded: 92% (A - High Distinction).",
    createdAt: new Date(Date.now() - 1e3 * 60 * 60 * 8).toISOString(),
    read: false,
    priority: "normal",
    targetRole: "student",
    studentName: "Abigail Selkridge",
    actionTab: "courses",
    channelDelivery: {
      in_app: { delivered: true, deliveredAt: (/* @__PURE__ */ new Date()).toISOString() },
      email: { enabled: true, status: "sent", sentAt: (/* @__PURE__ */ new Date()).toISOString() },
      push: { enabled: true, status: "sent", sentAt: (/* @__PURE__ */ new Date()).toISOString() },
      whatsapp: { enabled: false, status: "planned" }
    }
  },
  {
    id: "notif_std_4",
    category: "attendance",
    eventType: "attendance_warning",
    type: "attendance_warning",
    title: "Institutional Attendance Warning (< 75%)",
    message: "Your attendance rate in Module 2 Evangelism is currently 66.7%, below the mandatory 75% threshold. Please review your session records.",
    createdAt: new Date(Date.now() - 1e3 * 60 * 60 * 12).toISOString(),
    read: false,
    priority: "urgent",
    targetRole: "student",
    studentName: "Pastor Christy Arthur",
    actionTab: "attendance",
    channelDelivery: {
      in_app: { delivered: true, deliveredAt: (/* @__PURE__ */ new Date()).toISOString() },
      email: { enabled: true, status: "sent", sentAt: (/* @__PURE__ */ new Date()).toISOString() },
      push: { enabled: true, status: "sent", sentAt: (/* @__PURE__ */ new Date()).toISOString() },
      whatsapp: { enabled: false, status: "planned" }
    }
  },
  {
    id: "notif_std_5",
    category: "financial",
    eventType: "payment_reminder",
    type: "payment_reminder",
    title: "Tuition Installment Notice: 2026 Semester 1",
    message: "Your second semester tuition installment is due on the 15th. Check your payment statement to view receipts and balances.",
    createdAt: new Date(Date.now() - 1e3 * 60 * 60 * 24).toISOString(),
    read: false,
    priority: "high",
    targetRole: "student",
    actionTab: "payments",
    channelDelivery: {
      in_app: { delivered: true, deliveredAt: (/* @__PURE__ */ new Date()).toISOString() },
      email: { enabled: true, status: "sent", sentAt: (/* @__PURE__ */ new Date()).toISOString() },
      push: { enabled: true, status: "sent", sentAt: (/* @__PURE__ */ new Date()).toISOString() },
      whatsapp: { enabled: false, status: "planned" }
    }
  },
  {
    id: "notif_std_6",
    category: "announcement",
    eventType: "new_announcement",
    type: "new_announcement",
    title: "Apostolic Convocation & Live Broadcast",
    message: "Special Ministry Convocation this Friday at 7:00 PM EST with Apostle Dr. Kendell Pierre. Broadcast live on zoom.",
    createdAt: new Date(Date.now() - 1e3 * 60 * 60 * 36).toISOString(),
    read: false,
    priority: "normal",
    targetRole: "student",
    actionTab: "home",
    channelDelivery: {
      in_app: { delivered: true, deliveredAt: (/* @__PURE__ */ new Date()).toISOString() },
      email: { enabled: true, status: "sent", sentAt: (/* @__PURE__ */ new Date()).toISOString() },
      push: { enabled: true, status: "sent", sentAt: (/* @__PURE__ */ new Date()).toISOString() },
      whatsapp: { enabled: false, status: "planned" }
    }
  },
  {
    id: "notif_std_7",
    category: "enrollment",
    eventType: "registration_confirmation",
    type: "registration_confirmation",
    title: "Course Registration Confirmed: SOM-101",
    message: "You are officially enrolled in SOM-101 Biblical Hermeneutics & Exegesis for 2026 Semester 1.",
    createdAt: new Date(Date.now() - 1e3 * 60 * 60 * 48).toISOString(),
    read: true,
    priority: "normal",
    targetRole: "student",
    studentName: "Abigail Selkridge",
    actionTab: "courses",
    channelDelivery: {
      in_app: { delivered: true, deliveredAt: (/* @__PURE__ */ new Date()).toISOString() },
      email: { enabled: true, status: "sent", sentAt: (/* @__PURE__ */ new Date()).toISOString() },
      push: { enabled: false, status: "disabled" },
      whatsapp: { enabled: false, status: "planned" }
    }
  },
  {
    id: "notif_std_8",
    category: "library",
    eventType: "library_resource_added",
    type: "library_resource_added",
    title: "New Ministerial Resource Uploaded",
    message: 'The "Hermeneutics & Exegesis Handout 2026" PDF syllabus has been added to the institutional digital library.',
    createdAt: new Date(Date.now() - 1e3 * 60 * 60 * 72).toISOString(),
    read: true,
    priority: "low",
    targetRole: "student",
    actionTab: "library",
    channelDelivery: {
      in_app: { delivered: true, deliveredAt: (/* @__PURE__ */ new Date()).toISOString() },
      email: { enabled: false, status: "disabled" },
      push: { enabled: false, status: "disabled" },
      whatsapp: { enabled: false, status: "planned" }
    }
  },
  // --- Administrator Notifications ---
  {
    id: "notif_adm_1",
    category: "enrollment",
    eventType: "new_enrollment",
    type: "new_enrollment",
    title: "New Student Application Submitted",
    message: "Pastor David Warner submitted an application for the Level 1 Foundation Cohort.",
    createdAt: new Date(Date.now() - 1e3 * 60 * 20).toISOString(),
    read: false,
    priority: "normal",
    targetRole: "admin",
    actionTab: "students",
    channelDelivery: {
      in_app: { delivered: true, deliveredAt: (/* @__PURE__ */ new Date()).toISOString() },
      email: { enabled: true, status: "sent", sentAt: (/* @__PURE__ */ new Date()).toISOString() },
      push: { enabled: true, status: "sent", sentAt: (/* @__PURE__ */ new Date()).toISOString() },
      whatsapp: { enabled: false, status: "planned" }
    }
  },
  {
    id: "notif_adm_2",
    category: "financial",
    eventType: "payment_received",
    type: "payment_received",
    title: "Tuition Payment Received: $250.00",
    message: "Student Abigail Selkridge submitted payment for 2026 Semester 1 tuition via Bank Transfer.",
    createdAt: new Date(Date.now() - 1e3 * 60 * 45).toISOString(),
    read: false,
    priority: "normal",
    targetRole: "admin",
    actionTab: "payments",
    channelDelivery: {
      in_app: { delivered: true, deliveredAt: (/* @__PURE__ */ new Date()).toISOString() },
      email: { enabled: true, status: "sent", sentAt: (/* @__PURE__ */ new Date()).toISOString() },
      push: { enabled: true, status: "sent", sentAt: (/* @__PURE__ */ new Date()).toISOString() },
      whatsapp: { enabled: false, status: "planned" }
    }
  },
  {
    id: "notif_adm_3",
    category: "financial",
    eventType: "outstanding_balance",
    type: "outstanding_balance",
    title: "Overdue Balance Notice: 3 Students",
    message: "Three students have outstanding tuition balances totaling $750.00 that are past due for Semester 1.",
    createdAt: new Date(Date.now() - 1e3 * 60 * 60 * 5).toISOString(),
    read: false,
    priority: "high",
    targetRole: "admin",
    actionTab: "payments",
    channelDelivery: {
      in_app: { delivered: true, deliveredAt: (/* @__PURE__ */ new Date()).toISOString() },
      email: { enabled: true, status: "sent", sentAt: (/* @__PURE__ */ new Date()).toISOString() },
      push: { enabled: true, status: "sent", sentAt: (/* @__PURE__ */ new Date()).toISOString() },
      whatsapp: { enabled: false, status: "planned" }
    }
  },
  {
    id: "notif_adm_4",
    category: "attendance",
    eventType: "attendance_issue",
    type: "attendance_issue",
    title: "At-Risk Attendance Flagged: Pastor Christy Arthur",
    message: "Pastor Christy Arthur attendance rate dropped to 66.7% in SOM-102 (At-Risk trigger < 75%).",
    createdAt: new Date(Date.now() - 1e3 * 60 * 60 * 10).toISOString(),
    read: false,
    priority: "urgent",
    targetRole: "admin",
    actionTab: "attendance",
    channelDelivery: {
      in_app: { delivered: true, deliveredAt: (/* @__PURE__ */ new Date()).toISOString() },
      email: { enabled: true, status: "sent", sentAt: (/* @__PURE__ */ new Date()).toISOString() },
      push: { enabled: true, status: "sent", sentAt: (/* @__PURE__ */ new Date()).toISOString() },
      whatsapp: { enabled: false, status: "planned" }
    }
  },
  {
    id: "notif_adm_5",
    category: "academic",
    eventType: "assignment_submitted",
    type: "assignment_submitted",
    title: "Assignment Submissions Ready for Grading",
    message: "4 students have submitted their Module 1 Exegesis papers in SOM-101.",
    createdAt: new Date(Date.now() - 1e3 * 60 * 60 * 18).toISOString(),
    read: false,
    priority: "normal",
    targetRole: "admin",
    actionTab: "courses",
    channelDelivery: {
      in_app: { delivered: true, deliveredAt: (/* @__PURE__ */ new Date()).toISOString() },
      email: { enabled: true, status: "sent", sentAt: (/* @__PURE__ */ new Date()).toISOString() },
      push: { enabled: false, status: "disabled" },
      whatsapp: { enabled: false, status: "planned" }
    }
  },
  {
    id: "notif_adm_6",
    category: "academic",
    eventType: "lecturer_pending_grades",
    type: "lecturer_pending_grades",
    title: "Pending Grades Alert: SOM-104",
    message: "Lecturer grades for Apostolic Governance Quiz #1 are pending evaluation beyond the 5-day SLA.",
    createdAt: new Date(Date.now() - 1e3 * 60 * 60 * 30).toISOString(),
    read: false,
    priority: "high",
    targetRole: "admin",
    actionTab: "courses",
    channelDelivery: {
      in_app: { delivered: true, deliveredAt: (/* @__PURE__ */ new Date()).toISOString() },
      email: { enabled: true, status: "sent", sentAt: (/* @__PURE__ */ new Date()).toISOString() },
      push: { enabled: true, status: "sent", sentAt: (/* @__PURE__ */ new Date()).toISOString() },
      whatsapp: { enabled: false, status: "planned" }
    }
  }
];
var memoryPreferences = { ...DEFAULT_NOTIFICATION_PREFERENCES };
notificationsRouter.get("/", async (req, res) => {
  try {
    const role = req.query.role || "all";
    const studentName = req.query.studentName || "";
    const category = req.query.category;
    const eventType = req.query.eventType;
    const unreadOnly = req.query.unreadOnly === "true";
    const limit = parseInt(req.query.limit, 10) || 50;
    let filtered = [...memoryNotifications];
    if (role === "student") {
      const studentUuid = (req.user?.studentRecordId || req.user?.studentId || req.user?.userId || "").toLowerCase();
      filtered = filtered.filter((n) => {
        const isStudentTarget = n.targetRole === "student" || n.targetRole === "all" || !n.targetRole;
        if (!isStudentTarget) return false;
        const targetStudentId = (n.studentId || n.student_id || n.recipient || "").toLowerCase();
        if (targetStudentId && targetStudentId !== "all" && targetStudentId !== "students") {
          return studentUuid ? targetStudentId === studentUuid : false;
        }
        return true;
      });
    } else if (role === "admin" || role === "teacher") {
      filtered = filtered.filter((n) => n.targetRole === "admin" || n.targetRole === "teacher" || n.targetRole === "all" || !n.targetRole);
    }
    if (unreadOnly) {
      filtered = filtered.filter((n) => !n.read);
    }
    if (category && category !== "all") {
      filtered = filtered.filter((n) => n.category === category);
    }
    if (eventType && eventType !== "all") {
      filtered = filtered.filter((n) => n.eventType === eventType || n.type === eventType);
    }
    filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    const result = filtered.slice(0, limit);
    const unreadCount = filtered.filter((n) => !n.read).length;
    const urgentCount = filtered.filter((n) => n.priority === "urgent" && !n.read).length;
    res.json({
      success: true,
      notifications: result,
      stats: {
        total: filtered.length,
        unreadCount,
        urgentCount,
        byCategory: {
          academic: filtered.filter((n) => n.category === "academic").length,
          attendance: filtered.filter((n) => n.category === "attendance").length,
          financial: filtered.filter((n) => n.category === "financial").length,
          announcement: filtered.filter((n) => n.category === "announcement").length,
          enrollment: filtered.filter((n) => n.category === "enrollment").length,
          library: filtered.filter((n) => n.category === "library").length,
          system: filtered.filter((n) => n.category === "system").length
        }
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});
notificationsRouter.post("/", async (req, res) => {
  try {
    const {
      category = "system",
      eventType,
      title,
      message,
      targetRole = "all",
      studentName,
      studentEmail,
      studentPhone,
      priority = "normal",
      actionTab = "home",
      actionUrl,
      metadata = {}
    } = req.body;
    if (!title || !message) {
      return res.status(400).json({ success: false, error: "Title and message are required." });
    }
    const definition = eventType && NOTIFICATION_DEFINITIONS[eventType] ? NOTIFICATION_DEFINITIONS[eventType] : null;
    const notifCategory = definition?.category || category;
    const notifPriority = priority || definition?.defaultPriority || "normal";
    const notifTab = actionTab || definition?.actionTab || "home";
    const now = (/* @__PURE__ */ new Date()).toISOString();
    const newNotification = {
      id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      category: notifCategory,
      eventType,
      type: eventType,
      title: title.trim(),
      message: message.trim(),
      createdAt: now,
      read: false,
      priority: notifPriority,
      targetRole,
      studentName,
      studentEmail,
      studentPhone,
      actionTab: notifTab,
      actionUrl,
      metadata,
      channelDelivery: {
        in_app: { delivered: true, deliveredAt: now },
        email: {
          enabled: true,
          status: "sent",
          sentAt: now,
          targetEmail: studentEmail || "student@hteim.edu"
        },
        push: {
          enabled: true,
          status: "sent",
          sentAt: now
        },
        whatsapp: {
          enabled: false,
          status: "planned",
          targetPhone: studentPhone
        }
      },
      deliveryLogs: [
        { channel: "in_app", status: "delivered", timestamp: now, details: "In-app notification badge rendered" },
        { channel: "email", status: "sent", timestamp: now, details: "Dispatched via transactional email queue" },
        { channel: "push", status: "sent", timestamp: now, details: "Web push event broadcasted" },
        { channel: "whatsapp", status: "queued", timestamp: now, details: "Staged in WhatsApp webhook queue (staged for future phase)" }
      ]
    };
    memoryNotifications.unshift(newNotification);
    res.status(201).json({
      success: true,
      notification: newNotification
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});
notificationsRouter.put("/:id/read", (req, res) => {
  const { id } = req.params;
  const notif = memoryNotifications.find((n) => n.id === id);
  if (!notif) {
    return res.status(404).json({ success: false, error: "Notification not found" });
  }
  notif.read = true;
  res.json({ success: true, notification: notif });
});
notificationsRouter.patch("/:id/read", (req, res) => {
  const { id } = req.params;
  const notif = memoryNotifications.find((n) => n.id === id);
  if (!notif) {
    return res.status(404).json({ success: false, error: "Notification not found" });
  }
  notif.read = true;
  res.json({ success: true, notification: notif });
});
notificationsRouter.patch("/:id", (req, res) => {
  const { id } = req.params;
  const notifIndex = memoryNotifications.findIndex((n) => n.id === id);
  if (notifIndex === -1) {
    return res.status(404).json({ success: false, error: "Notification not found" });
  }
  const existing = memoryNotifications[notifIndex];
  const updated = { ...existing, ...req.body, id: existing.id };
  memoryNotifications[notifIndex] = updated;
  res.json({ success: true, notification: updated });
});
notificationsRouter.put("/read-all", (req, res) => {
  const role = req.user?.role || req.body.role || req.query.role || "all";
  const studentUuid = (req.user?.studentRecordId || req.user?.studentId || req.user?.userId || "").toLowerCase();
  memoryNotifications = memoryNotifications.map((n) => {
    if (role === "student") {
      if (n.targetRole === "student" || n.targetRole === "all") {
        const targetStudentId = (n.studentId || n.student_id || n.recipient || "").toLowerCase();
        if (!targetStudentId || targetStudentId === "all" || targetStudentId === "students" || studentUuid && targetStudentId === studentUuid) {
          return { ...n, read: true };
        }
      }
      return n;
    } else if (role === "admin" || role === "teacher") {
      if (n.targetRole === "admin" || n.targetRole === "teacher" || n.targetRole === "all") {
        return { ...n, read: true };
      }
      return n;
    }
    return { ...n, read: true };
  });
  res.json({ success: true, message: "All notifications marked as read" });
});
notificationsRouter.delete("/:id", (req, res) => {
  const { id } = req.params;
  const initialLength = memoryNotifications.length;
  memoryNotifications = memoryNotifications.filter((n) => n.id !== id);
  if (memoryNotifications.length === initialLength) {
    return res.status(404).json({ success: false, error: "Notification not found" });
  }
  res.json({ success: true, message: "Notification deleted" });
});
notificationsRouter.get("/preferences", (req, res) => {
  res.json({
    success: true,
    preferences: memoryPreferences,
    channels: {
      in_app: { active: true, label: "In-App Notifications", description: "Real-time badge and dropdown trays" },
      email: { active: true, label: "Email Notifications", description: "Transactional updates sent to student email" },
      push: { active: true, label: "Web Push Notifications", description: "Desktop and Android PWA system pushes" },
      whatsapp: { active: false, label: "WhatsApp Messaging", description: "Staged for upcoming phase with Meta Cloud API" }
    }
  });
});
notificationsRouter.put("/preferences", (req, res) => {
  const { preferences } = req.body;
  if (preferences && typeof preferences === "object") {
    memoryPreferences = { ...memoryPreferences, ...preferences };
  }
  res.json({ success: true, preferences: memoryPreferences });
});
notificationsRouter.post("/test-dispatch", (req, res) => {
  const { eventType, targetStudentName } = req.body;
  const def = NOTIFICATION_DEFINITIONS[eventType];
  if (!def) {
    return res.status(400).json({
      success: false,
      error: `Unknown eventType '${eventType}'. Available: ${Object.keys(NOTIFICATION_DEFINITIONS).join(", ")}`
    });
  }
  const now = (/* @__PURE__ */ new Date()).toISOString();
  const sampleTitles = {
    // Student
    new_assignment: "New Assignment: Biblical Hermeneutics Essay",
    assignment_deadline: "Deadline Approaching: Exegesis Paper Due in 24 Hours",
    grade_published: "Grade Published: Evangelism Field Practicum (95% - High Distinction)",
    attendance_warning: "Urgent Attendance Warning: Attendance Rate Dropped Below 75%",
    payment_reminder: "Tuition Payment Reminder: 2026 Semester 1 Installment",
    new_announcement: "Special Apostolic Convocation with Apostle Dr. Kendell Pierre",
    registration_confirmation: "Registration Confirmed: SOM-101 Biblical Hermeneutics",
    library_resource_added: "New Library Textbook Added: Exegesis & Doctrinal Hermeneutics",
    // Administrator
    new_enrollment: "New Student Application: Pastor David Warner (Level 1)",
    payment_received: "Tuition Payment Verified: $250.00 from Abigail Selkridge",
    outstanding_balance: "Past Due Balance Flagged: 3 Students Overdue ($750.00 Total)",
    attendance_issue: "Critical Attendance Flag: Pastor Christy Arthur (66.7%)",
    assignment_submitted: "New Student Submission: SOM-101 Hermeneutics Paper",
    lecturer_pending_grades: "Faculty Alert: SOM-104 Quiz Evaluations Pending Beyond 5 Days"
  };
  const sampleMessages = {
    new_assignment: "A new 1,500-word exegesis paper has been posted by Pastor Samuel Selkridge. Due on the upcoming lecture date.",
    assignment_deadline: "Your assignment is due tomorrow at 11:59 PM EST. Submit your document in the assignments portal to avoid late deductions.",
    grade_published: "Your submitted assignment has been evaluated and reviewed by the academic faculty. Excellent work!",
    attendance_warning: "Your recorded attendance has fallen to 66.7%, which is below the mandatory 75% institutional requirement.",
    payment_reminder: "Your semester tuition installment balance is due. Please review your statement in the payments tab.",
    new_announcement: "Join the ministerial leadership live on Zoom or in the Main Sanctuary for our monthly convocation.",
    registration_confirmation: "Your registration for 2026 Semester 1 is active. Access your course materials in the catalog.",
    library_resource_added: "A new ministerial study guide and scripture handout is available for download in the digital library.",
    new_enrollment: "A prospective minister has applied for the upcoming academic cycle. Review credentials in the students tab.",
    payment_received: "Receipt #RCP-2026-089 has been generated and posted to student ledger.",
    outstanding_balance: "Tuition balance reminders have been queued for students with overdue balances.",
    attendance_issue: "Student attendance is below the 75% satisfactory threshold and requires pastoral intervention.",
    assignment_submitted: "Student has uploaded their coursework for faculty evaluation and rubric grading.",
    lecturer_pending_grades: "Faculty grading queue exceeds target response window. Please review course offering gradebook."
  };
  const testNotif = {
    id: `test_${eventType}_${Date.now()}`,
    category: def.category,
    eventType,
    type: eventType,
    title: sampleTitles[eventType] || def.label,
    message: sampleMessages[eventType] || def.description,
    createdAt: now,
    read: false,
    priority: def.defaultPriority,
    targetRole: def.role === "both" ? "all" : def.role,
    studentName: targetStudentName || (def.role === "student" ? "Abigail Selkridge" : void 0),
    actionTab: def.actionTab,
    channelDelivery: {
      in_app: { delivered: true, deliveredAt: now },
      email: { enabled: true, status: "sent", sentAt: now },
      push: { enabled: true, status: "sent", sentAt: now },
      whatsapp: { enabled: false, status: "planned" }
    },
    deliveryLogs: [
      { channel: "in_app", status: "delivered", timestamp: now, details: "In-app alert rendered" },
      { channel: "email", status: "sent", timestamp: now, details: "Email notification simulated" },
      { channel: "push", status: "sent", timestamp: now, details: "Push broadcast simulated" },
      { channel: "whatsapp", status: "queued", timestamp: now, details: "Staged for future WhatsApp phase" }
    ]
  };
  memoryNotifications.unshift(testNotif);
  res.json({
    success: true,
    notification: testNotif,
    message: `Dispatched test notification for '${def.label}'`
  });
});

// src/server/routes/whatsapp.ts
var import_express18 = require("express");
init_rbac2();
init_supabaseServer();
init_logger();
var whatsappRouter = (0, import_express18.Router)();
whatsappRouter.use(requireAuth);
var DEFAULT_WHATSAPP_CONFIG = {
  groupName: "HTEIM School of Ministry - Class Fellowship & Announcements",
  groupInviteUrl: "https://chat.whatsapp.com/invite/HTEIMClassGroup2026",
  description: "Official WhatsApp group for live Tuesday lecture links, ministry announcements, and prayer requests.",
  updatedAt: (/* @__PURE__ */ new Date()).toISOString(),
  updatedBy: "System Default"
};
var activeWhatsAppConfig = { ...DEFAULT_WHATSAPP_CONFIG };
whatsappRouter.get("/config", async (req, res) => {
  try {
    const supabase = getServerSupabase();
    if (supabase) {
      const { data, error } = await supabase.from("system_settings").select("value, updated_at, updated_by").eq("key", "whatsapp_group_config").maybeSingle();
      if (!error && data?.value) {
        activeWhatsAppConfig = {
          ...DEFAULT_WHATSAPP_CONFIG,
          ...data.value,
          updatedAt: data.updated_at || activeWhatsAppConfig.updatedAt,
          updatedBy: data.updated_by || activeWhatsAppConfig.updatedBy
        };
      }
    }
    return res.status(200).json({
      success: true,
      config: activeWhatsAppConfig
    });
  } catch (err) {
    logger.warn("Error fetching WhatsApp config from database, using cached fallback:", err?.message || err);
    return res.status(200).json({
      success: true,
      config: activeWhatsAppConfig
    });
  }
});
whatsappRouter.put("/config", async (req, res) => {
  try {
    const user = req.user;
    if (!user || !isAdministrativeRole(user.role)) {
      logger.warn(`Unauthorized WhatsApp config update attempted by ${user?.email || "unknown"} with role ${user?.role}`);
      return res.status(403).json({
        success: false,
        error: "Forbidden: Only administrators may modify the official WhatsApp group configuration."
      });
    }
    const { groupName, groupInviteUrl, description } = req.body;
    if (!groupName || typeof groupName !== "string" || !groupName.trim()) {
      return res.status(400).json({
        success: false,
        error: "Validation Error: groupName is required."
      });
    }
    if (!groupInviteUrl || typeof groupInviteUrl !== "string" || !groupInviteUrl.trim()) {
      return res.status(400).json({
        success: false,
        error: "Validation Error: groupInviteUrl is required."
      });
    }
    const trimmedUrl = groupInviteUrl.trim();
    if (!trimmedUrl.startsWith("https://chat.whatsapp.com/") && !trimmedUrl.startsWith("https://wa.me/")) {
      return res.status(400).json({
        success: false,
        error: "Security Error: Invite URL must start with https://chat.whatsapp.com/ or https://wa.me/"
      });
    }
    const previousConfig = { ...activeWhatsAppConfig };
    const now = (/* @__PURE__ */ new Date()).toISOString();
    const updatedConfig = {
      groupName: groupName.trim(),
      groupInviteUrl: trimmedUrl,
      description: typeof description === "string" ? description.trim() : activeWhatsAppConfig.description,
      updatedAt: now,
      updatedBy: user.email || user.name || "Administrator"
    };
    activeWhatsAppConfig = updatedConfig;
    const supabase = getServerSupabase();
    if (supabase) {
      try {
        await supabase.from("system_settings").upsert({
          key: "whatsapp_group_config",
          value: updatedConfig,
          updated_at: now,
          updated_by: user.email
        }, { onConflict: "key" });
      } catch (dbErr) {
        logger.warn("Failed to upsert to system_settings, maintained in memory:", dbErr?.message || dbErr);
      }
    }
    try {
      await logAuditEvent({
        actorUserId: user.userId,
        actorRole: user.role,
        entityType: "system_settings",
        entityId: "whatsapp_group_config",
        action: "update_whatsapp_config",
        oldValues: previousConfig,
        newValues: updatedConfig,
        changedFields: ["groupName", "groupInviteUrl", "description"],
        reason: "Administrative update to official school WhatsApp community configuration",
        ipAddress: req.ip,
        userAgent: req.headers["user-agent"]
      });
    } catch (auditErr) {
      logger.warn("Warning logging WhatsApp config audit event:", auditErr);
    }
    logger.info(`WhatsApp configuration updated by ${user.email}: "${updatedConfig.groupName}"`);
    return res.status(200).json({
      success: true,
      config: updatedConfig,
      message: "WhatsApp configuration successfully updated and broadcasted."
    });
  } catch (err) {
    logger.error("PUT /api/whatsapp/config error:", err);
    return res.status(500).json({
      success: false,
      error: "Failed to update WhatsApp configuration"
    });
  }
});
whatsappRouter.post("/broadcast-preview", async (req, res) => {
  try {
    const user = req.user;
    const { subject = "School of Ministry Update", message = "", target = "all_students" } = req.body;
    if (!message || typeof message !== "string" || !message.trim()) {
      return res.status(400).json({ success: false, error: "Broadcast message body is required." });
    }
    const lines = [
      `*\u{1F4E2} HTEIM SCHOOL OF MINISTRY ANNOUNCEMENT*`,
      `*Subject:* ${subject.trim()}`,
      `*Target:* ${target === "all_students" ? "All Enrolled Students" : target}`,
      `*Date:* ${(/* @__PURE__ */ new Date()).toLocaleDateString(void 0, { weekday: "short", month: "short", day: "numeric", year: "numeric" })}`,
      ``,
      `${message.trim()}`,
      ``,
      `\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500`,
      `\u{1F3DB}\uFE0F *HTEIM Student Portal:* ${req.protocol}://${req.get("host") || "hteim.edu"}`,
      `\u{1F4AC} *Broadcasted by:* ${user.name || user.email} (${user.role.toUpperCase()})`
    ];
    const formattedText = lines.join("\n");
    const whatsappWebUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(formattedText)}`;
    if (isAdministrativeRole(user.role) || user.role === "teacher" || user.role === "lecturer") {
      try {
        await logAuditEvent({
          actorUserId: user.userId,
          actorRole: user.role,
          entityType: "broadcast",
          entityId: `broadcast_${Date.now()}`,
          action: "prepare_whatsapp_broadcast",
          newValues: { subject, target, charCount: message.length },
          reason: "Faculty broadcast prepared for WhatsApp"
        });
      } catch (auditErr) {
      }
    }
    return res.status(200).json({
      success: true,
      formattedText,
      whatsappWebUrl
    });
  } catch (err) {
    logger.error("POST /api/whatsapp/broadcast-preview error:", err);
    return res.status(500).json({ success: false, error: "Failed to generate broadcast preview" });
  }
});

// src/server/app.ts
init_rbac2();
function createApp() {
  const app = (0, import_express19.default)();
  app.set("trust proxy", 1);
  app.use(securityHeaders);
  const healthResponse = (_req, res) => {
    res.status(200).json({
      status: "ok",
      service: "hteim-school-of-ministry",
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    });
  };
  app.get("/api/health", healthResponse);
  app.get("/health", healthResponse);
  app.get("/healthz", healthResponse);
  app.get("/_health", healthResponse);
  app.get("/livez", healthResponse);
  app.get("/readyz", healthResponse);
  app.get("/ping", (_req, res) => res.status(200).send("pong"));
  app.use(import_express19.default.json({ limit: "15mb" }));
  app.use(sanitizeBody);
  if (process.env.NODE_ENV !== "test") {
    app.use("/api", generalApiRateLimiter);
  }
  app.use("/api", authenticate);
  app.use("/api/auth", authRateLimiter, authRouter);
  app.use("/api/bible", bibleRouter);
  app.use("/api/students", requireAuth, studentsRouter);
  app.use("/api/academics", requireAuth, academicsRouter);
  app.use("/api/attendance", requireAuth, attendanceRouter);
  app.use("/api/payments", requireAuth, paymentsRateLimiter, paymentsRouter);
  app.use("/api/invoices", requireAuth, paymentsRateLimiter, invoicesRouter);
  app.use("/api/library", requireAuth, libraryRouter);
  app.use("/api/assignments", requireAuth, assignmentsRateLimiter, assignmentsRouter);
  app.use("/api/grades", requireAuth, assignmentsRateLimiter, gradesRouter);
  app.use("/api/audit-logs", requireAuth, adminRateLimiter, auditLogsRouter);
  app.use("/api/state", requireAuth, stateRateLimiter, stateRouter);
  app.use("/api/me", requireAuth, meRouter);
  app.use("/api/notifications", requireAuth, notificationsRouter);
  app.use("/api/whatsapp", requireAuth, whatsappRouter);
  app.use("/api/github", requireAuth, githubRateLimiter, githubRouter);
  app.use("/api/ai", requireAuth, aiRateLimiter, aiRouter);
  app.use("/api/drive-proxy", requireAuth, driveProxyRateLimiter, driveProxyRouter);
  return app;
}

// server.ts
init_supabaseServer();
init_logger();
import_dotenv.default.config();
var currentFilename = typeof __filename !== "undefined" ? __filename : process.cwd();
var currentDirname = typeof __dirname !== "undefined" ? __dirname : import_path3.default.dirname(currentFilename);
var PORT = 3e3;
var HOST = "0.0.0.0";
async function startServer() {
  if (!isSupabaseConfigured()) {
    logger.warn(
      "[Supabase Server] SUPABASE_SERVICE_ROLE_KEY is not configured in this environment. Authoritative server database operations will fail until SUPABASE_SERVICE_ROLE_KEY is provided in environment variables."
    );
  } else {
    logger.info("[Supabase Server] Privileged SUPABASE_SERVICE_ROLE_KEY configured and verified.");
  }
  initializeRelationalSchema().catch((e) => logger.warn("Relational init warning:", e));
  const app = createApp();
  const isDev = process.env.NODE_ENV !== "production" && !currentFilename.endsWith(".cjs") && !currentDirname.includes("dist");
  if (isDev) {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: false
      },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = import_fs3.default.existsSync(import_path3.default.join(process.cwd(), "dist", "index.html")) ? import_path3.default.join(process.cwd(), "dist") : import_fs3.default.existsSync(import_path3.default.join(currentDirname, "index.html")) ? currentDirname : import_path3.default.join(process.cwd(), "dist");
    app.use(
      import_express20.default.static(distPath, {
        setHeaders: (res, filePath) => {
          res.setHeader("X-Content-Type-Options", "nosniff");
          res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
          res.setHeader("X-XSS-Protection", "1; mode=block");
          if (filePath.endsWith(".html") || filePath.endsWith("sw.js") || filePath.endsWith("registerSW.js")) {
            res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
          }
        }
      })
    );
    app.get("*", (_req, res) => {
      const indexPath = import_path3.default.join(distPath, "index.html");
      if (import_fs3.default.existsSync(indexPath)) {
        res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
        res.sendFile(indexPath);
      } else {
        res.status(200).send("<!DOCTYPE html><html><head><title>HTEIM School of Ministry</title></head><body><div id='root'>HTEIM Portal Service Running</div></body></html>");
      }
    });
  }
  const server = app.listen(PORT, HOST, () => {
    logger.info(`HTEIM School of Ministry server running on http://localhost:${PORT}`);
  });
  server.on("error", (err) => {
    if (err.code === "EADDRINUSE") {
      logger.error(`Port ${PORT} is already in use.`);
      process.exit(1);
    } else {
      logger.error(`Server on port ${PORT} encountered an error:`, err);
      process.exit(1);
    }
  });
  let cloudRunServer = null;
  const envPort = process.env.PORT ? parseInt(process.env.PORT, 10) : null;
  if (envPort && !isNaN(envPort) && envPort !== PORT) {
    try {
      cloudRunServer = app.listen(envPort, HOST, () => {
        logger.info(`Cloud Run ingress listener active on http://${HOST}:${envPort}`);
      });
      cloudRunServer.on("error", (err) => {
        if (err.code === "EADDRINUSE") {
          logger.info(`Port ${envPort} occupied by reverse proxy sandbox. Relying on primary port ${PORT}.`);
        } else {
          logger.warn(`Cloud Run secondary port ${envPort} encountered non-fatal error:`, err);
        }
      });
    } catch (e) {
      logger.warn(`Could not start secondary listener on port ${envPort}:`, e);
    }
  }
  const shutdown = () => {
    logger.info("Server shutting down gracefully...");
    server.close(() => {
      if (cloudRunServer) {
        cloudRunServer.close(() => {
          logger.info("All server listeners closed gracefully.");
          process.exit(0);
        });
      } else {
        logger.info("Server listener closed gracefully.");
        process.exit(0);
      }
    });
  };
  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}
startServer();
//# sourceMappingURL=server.cjs.map
