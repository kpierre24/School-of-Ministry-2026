-- ============================================================================
-- NOTIFICATION SYSTEM ARCHITECTURE MIGRATION
-- HTEIM School of Ministry
-- ============================================================================
-- Provides durable multi-role notification records, delivery channel tracking
-- (In-App active, Email ready, Push ready, WhatsApp staged), and preference controls.
-- ============================================================================

-- 1. Notifications Table
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_role TEXT NOT NULL DEFAULT 'all' CHECK (recipient_role IN ('admin', 'teacher', 'student', 'all')),
  recipient_user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  recipient_student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
  recipient_email TEXT,
  category TEXT NOT NULL CHECK (category IN ('academic', 'attendance', 'financial', 'announcement', 'library', 'enrollment', 'system', 'assignment_due', 'assignment_graded', 'attendance_warning', 'payment_due', 'payment_received', 'application_status')),
  event_type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  priority TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  read BOOLEAN NOT NULL DEFAULT false,
  read_at TIMESTAMPTZ,
  action_tab TEXT,
  action_url TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_role ON public.notifications (recipient_role);
CREATE INDEX IF NOT EXISTS idx_notifications_recipient_user ON public.notifications (recipient_user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_recipient_student ON public.notifications (recipient_student_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON public.notifications (read);
CREATE INDEX IF NOT EXISTS idx_notifications_category ON public.notifications (category);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications (created_at DESC);

-- 2. Notification Delivery Logs (In-App, Email, Push, WhatsApp)
CREATE TABLE IF NOT EXISTS public.notification_delivery_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  notification_id UUID NOT NULL REFERENCES public.notifications(id) ON DELETE CASCADE,
  channel TEXT NOT NULL CHECK (channel IN ('in_app', 'email', 'push', 'whatsapp', 'sms')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('delivered', 'sent', 'queued', 'failed', 'skipped', 'pending')),
  recipient_target TEXT,
  response_payload JSONB DEFAULT '{}'::jsonb,
  error_message TEXT,
  delivered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_delivery_logs_notification ON public.notification_delivery_logs (notification_id);
CREATE INDEX IF NOT EXISTS idx_delivery_logs_channel ON public.notification_delivery_logs (channel);
CREATE INDEX IF NOT EXISTS idx_delivery_logs_status ON public.notification_delivery_logs (status);

-- 3. Notification Preferences Table
CREATE TABLE IF NOT EXISTS public.notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'student',
  preferences JSONB NOT NULL DEFAULT '{}'::jsonb,
  channels_enabled JSONB NOT NULL DEFAULT '{"in_app": true, "email": true, "push": true, "whatsapp": false}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_user_notification_pref UNIQUE (user_id)
);

CREATE INDEX IF NOT EXISTS idx_notification_pref_user ON public.notification_preferences (user_id);

-- 4. Initial Seed Notifications (Demonstrating Both Student and Administrator Events)
INSERT INTO public.notifications (
  recipient_role, category, event_type, title, message, priority, read, action_tab
) VALUES
  -- Student notifications
  ('student', 'academic', 'new_assignment', 'New Exegesis Paper Assigned: SOM-101', 'Pastor John Selkridge has posted a new Hermeneutical Exegesis assignment due next Tuesday.', 'normal', false, 'courses'),
  ('student', 'academic', 'assignment_deadline', 'Deadline Approaching: Evangelism Practicum Log', 'Your 2-page personal soul-winning practicum report is due in 48 hours for SOM-102.', 'high', false, 'courses'),
  ('student', 'academic', 'grade_published', 'Grade Published: Pastoral Ethics Exam', 'Your evaluation for Ministerial Ethics Module 3 has been graded: 92% (A - High Distinction).', 'normal', false, 'courses'),
  ('student', 'attendance', 'attendance_warning', 'Institutional Attendance Warning (< 75%)', 'Your attendance rate in Module 2 Evangelism is currently 66.7%, below the mandatory 75% threshold. Please review your session records.', 'urgent', false, 'attendance'),
  ('student', 'financial', 'payment_reminder', 'Tuition Installment Notice: 2026 Semester 1', 'Your second semester tuition installment is due on the 15th. Check your payment statement to view receipts and balances.', 'high', false, 'payments'),
  ('student', 'announcement', 'new_announcement', 'Apostolic Convocation & Live Broadcast', 'Special Ministry Convocation this Friday at 7:00 PM EST with Apostle Dr. Kendell Pierre. Broadcast live on zoom.', 'normal', false, 'home'),
  ('student', 'enrollment', 'registration_confirmation', 'Course Registration Confirmed', 'You are officially enrolled in SOM-101 Biblical Hermeneutics for 2026 Semester 1.', 'normal', true, 'courses'),
  ('student', 'library', 'library_resource_added', 'New Ministerial Resource Uploaded', 'The "Hermeneutics & Exegesis Handout 2026" PDF syllabus has been added to the institutional digital library.', 'low', true, 'library'),

  -- Administrator notifications
  ('admin', 'enrollment', 'new_enrollment', 'New Student Application Submitted', 'Pastor David Warner submitted an application for the Level 1 Foundation Cohort.', 'normal', false, 'students'),
  ('admin', 'financial', 'payment_received', 'Tuition Payment Received: $250.00', 'Student Abigail Selkridge submitted payment for 2026 Semester 1 tuition via Bank Transfer.', 'normal', false, 'payments'),
  ('admin', 'financial', 'outstanding_balance', 'Overdue Balance Notice: 3 Students', 'Three students have outstanding tuition balances totaling $750.00 that are past due for Semester 1.', 'high', false, 'payments'),
  ('admin', 'attendance', 'attendance_issue', 'At-Risk Attendance Flagged: Minister Christy Ruben', 'Minister Christy Ruben attendance rate dropped to 66.7% in SOM-102 (At-Risk trigger < 75%).', 'urgent', false, 'attendance'),
  ('admin', 'academic', 'assignment_submitted', 'Assignment Submissions Ready for Grading', '4 students have submitted their Module 1 Exegesis papers in SOM-101.', 'normal', false, 'courses'),
  ('admin', 'academic', 'lecturer_pending_grades', 'Pending Grades Alert: SOM-104', 'Lecturer grades for Apostolic Governance Quiz #1 are pending evaluation beyond the 5-day SLA.', 'high', false, 'courses');
