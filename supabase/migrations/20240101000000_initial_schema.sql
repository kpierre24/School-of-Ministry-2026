-- HTEIM School of Ministry Portal
-- Supabase / PostgreSQL index recommendations
-- Run these in the Supabase SQL Editor or via `supabase db reset`

-- ============================================================================
-- CORE ENTITIES
-- ============================================================================

-- Students / Users
-- Query patterns: look up by studentName, filter by moduleTrack / status
CREATE INDEX IF NOT EXISTS idx_students_name
  ON students (student_name);

CREATE INDEX IF NOT EXISTS idx_students_module_track
  ON students (module_track);

CREATE INDEX IF NOT EXISTS idx_students_status
  ON students (status);

CREATE INDEX IF NOT EXISTS idx_students_module_status
  ON students (module_track, status);

-- Attendance
-- Query patterns: filter by student + date range, class day lookups, at-risk reports
CREATE INDEX IF NOT EXISTS idx_attendance_student_name
  ON attendance (student_name);

CREATE INDEX IF NOT EXISTS idx_attendance_class_day
  ON attendance (class_day_id);

CREATE INDEX IF NOT EXISTS idx_attendance_student_day
  ON attendance (student_name, class_day_id);

CREATE INDEX IF NOT EXISTS idx_attendance_created_at
  ON attendance (created_at);

-- Payments
-- Query patterns: outstanding balance reports, student payment history, status filters
CREATE INDEX IF NOT EXISTS idx_payments_student_name
  ON payments (student_name);

CREATE INDEX IF NOT EXISTS idx_payments_status
  ON payments (status);

CREATE INDEX IF NOT EXISTS idx_payments_student_status
  ON payments (student_name, status);

CREATE INDEX IF NOT EXISTS idx_payments_last_payment_date
  ON payments (last_payment_date);

-- Assignments
-- Query patterns: filter by course / module, student submissions, due date ordering
CREATE INDEX IF NOT EXISTS idx_assignments_course_code
  ON assignments (course_code);

CREATE INDEX IF NOT EXISTS idx_assignments_module_track
  ON assignments (module_track);

CREATE INDEX IF NOT EXISTS idx_assignments_due_date
  ON assignments (due_date);

CREATE INDEX IF NOT EXISTS idx_assignments_course_module
  ON assignments (course_code, module_track);

-- Submissions
-- Query patterns: pending grading, student submission history, assignment filtering
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

-- ============================================================================
-- SUPPORTING ENTITIES
-- ============================================================================

-- Class Days
-- Query patterns: ordered session listing, attendance rollup
CREATE INDEX IF NOT EXISTS idx_class_days_created_at
  ON class_days (created_at);

-- Notifications
-- Query patterns: unread alerts, per-student notifications, date sorting
CREATE INDEX IF NOT EXISTS idx_notifications_student_name
  ON notifications (student_name);

CREATE INDEX IF NOT EXISTS idx_notifications_status
  ON notifications (status);

CREATE INDEX IF NOT EXISTS idx_notifications_created_at
  ON notifications (created_at);

CREATE INDEX IF NOT EXISTS idx_notifications_student_status
  ON notifications (student_name, status);

-- Messages
-- Query patterns: conversation threads, unread count, date ordering
CREATE INDEX IF NOT EXISTS idx_messages_student_name
  ON messages (student_name);

CREATE INDEX IF NOT EXISTS idx_messages_created_at
  ON messages (created_at);

CREATE INDEX IF NOT EXISTS idx_messages_status
  ON messages (status);

-- Audit Logs
-- Query patterns: admin audit trail, actor lookup, date range filters
CREATE INDEX IF NOT EXISTS idx_audit_logs_actor
  ON audit_logs (actor);

CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp
  ON audit_logs (timestamp);

CREATE INDEX IF NOT EXISTS idx_audit_logs_action_category
  ON audit_logs (action_category);

-- ============================================================================
-- FULL-TEXT SEARCH (optional, for student name / course search)
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_students_name_gin
  ON students USING gin (to_tsvector('english', student_name));

CREATE INDEX IF NOT EXISTS idx_assignments_title_gin
  ON assignments USING gin (to_tsvector('english', title || ' ' || COALESCE(description, '')));
