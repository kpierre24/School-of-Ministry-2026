import { CustomAssignment, AssignmentSubmission, AppNotification, TabType } from '../types';

/**
 * Generate automated due date and grading notifications based on current assignments and submissions
 */
export function generateAutomatedNotifications(
  assignments: CustomAssignment[],
  submissions: AssignmentSubmission[],
  existingNotifications: AppNotification[] = [],
  currentRole?: string,
  currentStudentName?: string
): AppNotification[] {
  const todayStr = new Date().toISOString().split('T')[0]; // e.g. 2026-07-25
  const generated: AppNotification[] = [...existingNotifications];

  const hasNotification = (id: string) => generated.some(n => n.id === id);

  // 1. Scan Custom Assignments for Due Date Alerts (Targeted exclusively to STUDENTS)
  assignments.forEach(asg => {
    if (!asg.dueDate) return;

    const daysDiff = Math.ceil(
      (new Date(asg.dueDate).getTime() - new Date(todayStr).getTime()) / (1000 * 3600 * 24)
    );

    // PAST DUE ALERT
    if (daysDiff < 0) {
      const notifId = `NOTIF-PASTDUE-${asg.id}`;
      if (!hasNotification(notifId)) {
        generated.unshift({
          id: notifId,
          title: `⚠️ Past Due: ${asg.title}`,
          message: `The assignment "${asg.title}" was due on ${asg.dueDate}. Please submit your work immediately.`,
          type: 'past_due',
          targetRole: 'student',
          assignmentId: asg.id,
          createdAt: new Date().toISOString().replace('T', ' ').slice(0, 16),
          read: false,
          priority: 'high',
          actionTab: 'exams'
        });
      }
    } 
    // DUE TODAY ALERT
    else if (daysDiff === 0) {
      const notifId = `NOTIF-DUETODAY-${asg.id}`;
      if (!hasNotification(notifId)) {
        generated.unshift({
          id: notifId,
          title: `⏰ Due Today: ${asg.title}`,
          message: `"${asg.title}" is due today (${asg.dueDate})! Ensure your document response is uploaded before end of day.`,
          type: 'due_date',
          targetRole: 'student',
          assignmentId: asg.id,
          createdAt: new Date().toISOString().replace('T', ' ').slice(0, 16),
          read: false,
          priority: 'high',
          actionTab: 'exams'
        });
      }
    }
    // UPCOMING DUE DATE ALERT (Within 5 days)
    else if (daysDiff > 0 && daysDiff <= 5) {
      const notifId = `NOTIF-DUEUPCOMING-${asg.id}`;
      if (!hasNotification(notifId)) {
        generated.unshift({
          id: notifId,
          title: `📅 Upcoming Due Date: ${asg.title}`,
          message: `"${asg.title}" is due in ${daysDiff} day(s) on ${asg.dueDate}.`,
          type: 'due_date',
          targetRole: 'student',
          assignmentId: asg.id,
          createdAt: new Date().toISOString().replace('T', ' ').slice(0, 16),
          read: false,
          priority: 'normal',
          actionTab: 'exams'
        });
      }
    }
  });

  // 2. Scan Submissions for Grading & Feedback Notifications (Targeted to STUDENTS) and Submission Alerts (Targeted to ADMIN/TEACHER)
  submissions.forEach(sub => {
    const asg = assignments.find(a => a.id === sub.assignmentId);
    const asgTitle = asg?.title || 'Coursework Assignment';

    // GRADED / CORRECTION RETURNED -> Goes to the specific student
    if (sub.status === 'Graded' || sub.status === 'Correction Returned') {
      const notifId = `NOTIF-GRADED-${sub.id}-${sub.updatedAt}`;
      if (!hasNotification(notifId)) {
        generated.unshift({
          id: notifId,
          title: `🎓 Assignment Graded: ${asgTitle}`,
          message: `${sub.studentName}'s submission received a score of ${sub.score || 0}/${asg?.maxPoints || 100}.${sub.teacherFeedback ? ` Feedback: "${sub.teacherFeedback}"` : ''}${sub.teacherCorrectedFileName ? ' Corrected document attached.' : ''}`,
          type: 'graded',
          targetRole: 'student',
          studentName: sub.studentName,
          assignmentId: sub.assignmentId,
          createdAt: sub.updatedAt || new Date().toISOString().replace('T', ' ').slice(0, 16),
          read: false,
          priority: 'high',
          actionTab: 'exams'
        });
      }
    }

    // SUBMISSION LOGGED -> Goes to Administrators and Teachers for grading
    if (sub.status === 'Submitted') {
      const notifId = `NOTIF-SUBMISSION-${sub.id}`;
      if (!hasNotification(notifId)) {
        generated.unshift({
          id: notifId,
          title: `📄 New Submission: ${sub.studentName}`,
          message: `${sub.studentName} uploaded "${sub.studentFileName || 'Assignment Document'}" for "${asgTitle}". Pending instructor review & grading.`,
          type: 'submission',
          targetRole: 'admin',
          studentName: sub.studentName,
          assignmentId: sub.assignmentId,
          createdAt: sub.submittedAt || new Date().toISOString().replace('T', ' ').slice(0, 16),
          read: false,
          priority: 'normal',
          actionTab: 'exams'
        });
      }
    }
  });

  return generated;
}

/**
 * Filter notifications relevant for current user role and student identity with strict RBAC
 */
export function filterNotificationsForUser(
  notifications: AppNotification[],
  role?: string,
  studentName?: string
): AppNotification[] {
  const normalizedRole = (role || 'admin').toLowerCase().trim();
  const normalizedStudentName = (studentName || '').toLowerCase().trim();

  return notifications.filter(n => {
    const target = (n.targetRole || 'all').toLowerCase().trim();

    // 1. RBAC: Administrator or Teacher view
    if (normalizedRole === 'admin' || normalizedRole === 'teacher') {
      // Administrators and Teachers should NEVER receive student homework/quiz due date or student grade notifications
      if (target === 'student') return false;
      if (n.type === 'due_date' || n.type === 'past_due' || n.type === 'graded') {
        return false;
      }
      // Administrators and Teachers receive submissions to review, admin alerts, teacher announcements, and general notices
      return target === 'admin' || target === 'teacher' || target === 'all';
    }

    // 2. RBAC: Student view
    if (normalizedRole === 'student') {
      // Students should NEVER see administrative submission review alerts or faculty-only items
      if (target === 'admin' || target === 'teacher') return false;
      if (n.type === 'submission') return false;

      // If targeted to a specific individual student, strictly enforce identity matching
      if (n.studentName) {
        if (!normalizedStudentName) return false;
        const targetStudent = n.studentName.toLowerCase().trim();
        const matches = (
          targetStudent === normalizedStudentName ||
          targetStudent.includes(normalizedStudentName) ||
          normalizedStudentName.includes(targetStudent)
        );
        return matches;
      }

      // General student notifications (e.g. general quiz published, course-wide due date alerts)
      return target === 'student' || target === 'all';
    }

    // Fallback: general public / guest accounts only see general announcements
    return target === 'all' && n.type !== 'submission' && n.type !== 'due_date' && n.type !== 'past_due' && n.type !== 'graded';
  });
}
