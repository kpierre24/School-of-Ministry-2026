-- HTEIM School of Ministry Portal
-- Supabase / PostgreSQL index recommendations
-- Run these in the Supabase SQL Editor or via `supabase db reset`

-- NOTE: Some deployments run these migration files against an empty database where
-- the tables may not yet exist. Creating an index against a missing relation
-- causes `relation "..." does not exist` errors. To make this migration safe to
-- run at any time, each index group is now guarded by a conditional check that
-- verifies the target table exists before attempting to create indexes.

-- ============================================================================
-- CORE ENTITIES
-- ============================================================================

-- Students / Users
-- Query patterns: look up by studentName, filter by moduleTrack / status
DO $$
BEGIN
  IF to_regclass('public.students') IS NOT NULL THEN
    CREATE INDEX IF NOT EXISTS idx_students_name
      ON students (student_name);

    CREATE INDEX IF NOT EXISTS idx_students_module_track
      ON students (module_track);

    CREATE INDEX IF NOT EXISTS idx_students_status
      ON students (status);

    CREATE INDEX IF NOT EXISTS idx_students_module_status
      ON students (module_track, status);
  END IF;
END$$;

-- Attendance
-- Query patterns: filter by student + date range, class day lookups, at-risk reports
DO $$
BEGIN
  IF to_regclass('public.attendance') IS NOT NULL THEN
    CREATE INDEX IF NOT EXISTS idx_attendance_student_name
      ON attendance (student_name);

    CREATE INDEX IF NOT EXISTS idx_attendance_class_day
      ON attendance (class_day_id);

    CREATE INDEX IF NOT EXISTS idx_attendance_student_day
      ON attendance (student_name, class_day_id);

    CREATE INDEX IF NOT EXISTS idx_attendance_created_at
      ON attendance (created_at);
  END IF;
END$$;

-- Payments
-- Query patterns: outstanding balance reports, student payment history, status filters
DO $$
BEGIN
  IF to_regclass('public.payments') IS NOT NULL THEN
    CREATE INDEX IF NOT EXISTS idx_payments_student_name
      ON payments (student_name);

    CREATE INDEX IF NOT EXISTS idx_payments_status
      ON payments (status);

    CREATE INDEX IF NOT EXISTS idx_payments_student_status
      ON payments (student_name, status);

    CREATE INDEX IF NOT EXISTS idx_payments_last_payment_date
      ON payments (last_payment_date);
  END IF;
END$$;

-- Assignments
-- Query patterns: filter by course / module, student submissions, due date ordering
DO $$
BEGIN
  IF to_regclass('public.assignments') IS NOT NULL THEN
    CREATE INDEX IF NOT EXISTS idx_assignments_course_code
      ON assignments (course_code);

    CREATE INDEX IF NOT EXISTS idx_assignments_module_track
      ON assignments (module_track);

    CREATE INDEX IF NOT EXISTS idx_assignments_due_date
      ON assignments (due_date);

    CREATE INDEX IF NOT EXISTS idx_assignments_course_module
      ON assignments (course_code, module_track);
  END IF;
END$$;

-- Submissions
-- Query patterns: pending grading, student submission history, assignment filtering
DO $$
BEGIN
  IF to_regclass('public.submissions') IS NOT NULL THEN
    CREATE INDEX IF NOT EXISTS idx_submissions_student_name
      ON submissions (student_name);

    CREATE INDEX IF NOT EXISTS idx_submissions_assignment_id
      ON submissions (assignment_id);

    CREATE INDEX IF NOT EXISTS idx_submissions_status
      ON submissions (status);

    CREATE INDEX IF NOT EXISTS idx_submissions_assignment_status
      ON submissions (assignment_id, status);

    CREATE INDEX IF NOT EXISTS idx_submissions_student_assignment
      ON submissions (student_name, assignment_id);
  END IF;
END$$;

-- ============================================================================
-- SUPPORTING ENTITIES
-- ============================================================================

-- Class Days
-- Query patterns: ordered session listing, attendance rollup
DO $$
BEGIN
  IF to_regclass('public.class_days') IS NOT NULL THEN
    CREATE INDEX IF NOT EXISTS idx_class_days_created_at
      ON class_days (created_at);
  END IF;
END$$;

-- Notifications
-- Query patterns: unread alerts, per-student notifications, date sorting
DO $$
BEGIN
  IF to_regclass('public.notifications') IS NOT NULL THEN
    CREATE INDEX IF NOT EXISTS idx_notifications_student_name
      ON notifications (student_name);

    CREATE INDEX IF NOT EXISTS idx_notifications_status
      ON notifications (status);

    CREATE INDEX IF NOT EXISTS idx_notifications_created_at
      ON notifications (created_at);

    CREATE INDEX IF NOT EXISTS idx_notifications_student_status
      ON notifications (student_name, status);
  END IF;
END$$;

-- Messages
-- Query patterns: conversation threads, unread count, date ordering
DO $$
BEGIN
  IF to_regclass('public.messages') IS NOT NULL THEN
    CREATE INDEX IF NOT EXISTS idx_messages_student_name
      ON messages (student_name);

    CREATE INDEX IF NOT EXISTS idx_messages_created_at
      ON messages (created_at);

    CREATE INDEX IF NOT EXISTS idx_messages_status
      ON messages (status);
  END IF;
END$$;

-- Audit Logs
-- Query patterns: admin audit trail, actor lookup, date range filters
DO $$
BEGIN
  IF to_regclass('public.audit_logs') IS NOT NULL THEN
    CREATE INDEX IF NOT EXISTS idx_audit_logs_actor
      ON audit_logs (actor);

    CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp
      ON audit_logs (timestamp);

    CREATE INDEX IF NOT EXISTS idx_audit_logs_action_category
      ON audit_logs (action_category);
  END IF;
END$$;

-- ============================================================================
-- FULL-TEXT SEARCH (optional, for student name / course search)
-- ============================================================================
DO $$
BEGIN
  IF to_regclass('public.students') IS NOT NULL THEN
    CREATE INDEX IF NOT EXISTS idx_students_name_gin
      ON students USING gin (to_tsvector('english', student_name));
  END IF;

  IF to_regclass('public.assignments') IS NOT NULL THEN
    CREATE INDEX IF NOT EXISTS idx_assignments_title_gin
      ON assignments USING gin (to_tsvector('english', title || ' ' || COALESCE(description, '')));
  END IF;
END$$;
