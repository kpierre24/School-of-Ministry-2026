/**
 * ============================================================================
 * ATTENDANCE ENGINE DATA MODELS & TYPES
 * HTEIM School of Ministry
 * ============================================================================
 */

export type AttendanceStatus = 'Present' | 'Absent' | 'Late' | 'Excused' | 'Medical / Approved Leave';

export const ATTENDANCE_STATUS_LIST: AttendanceStatus[] = [
  'Present',
  'Absent',
  'Late',
  'Excused',
  'Medical / Approved Leave'
];

export type CorrectionRequestStatus = 'pending' | 'approved' | 'rejected';

/**
 * Formal Correction Request submitted by a lecturer or student
 */
export interface AttendanceCorrectionRequest {
  id: string;
  studentName: string;
  studentEmail?: string;
  classDayId: string;
  classDayName?: string;
  currentStatus: AttendanceStatus | string;
  requestedStatus: AttendanceStatus;
  reason: string;
  evidenceUrl?: string;
  notes?: string;
  submittedBy: string; // email or name
  submittedByRole: 'lecturer' | 'student' | 'teacher' | 'admin' | string;
  submittedAt: string; // ISO string
  status: CorrectionRequestStatus;
  reviewedBy?: string; // administrator who approved/rejected
  reviewedAt?: string;
  reviewNotes?: string;
}

/**
 * Immutable Audit History Entry for tracking all attendance modifications
 */
export interface AttendanceAuditEntry {
  id: string;
  timestamp: string; // ISO string
  studentName: string;
  classDayId: string;
  classDayName?: string;
  previousStatus: AttendanceStatus | string;
  newStatus: AttendanceStatus | string;
  actorName: string;
  actorEmail?: string;
  actorRole: string;
  actionType: 
    | 'lecturer_submission' 
    | 'admin_override' 
    | 'correction_approved' 
    | 'correction_rejected' 
    | 'session_locked' 
    | 'session_unlocked' 
    | 'bulk_mark' 
    | 'self_checkin'
    | 'medical_leave_approved';
  reason?: string;
  isOverride?: boolean;
  lockStatusAtChange?: 'locked' | 'unlocked';
}

/**
 * Session Lock Status
 */
export interface SessionLockState {
  classDayId: string;
  isLocked: boolean;
  lockedAt?: string;
  lockedBy?: string;
  lockDeadline?: string; // ISO timestamp when session auto-locks
  allowLecturerSubmission?: boolean;
  notes?: string;
}

/**
 * Standard Attendance Summary Calculation Result
 */
export interface AttendanceMetrics {
  totalSessions: number;
  attendedSessions: number; // Present + Late + Excused + Medical Leave
  presentCount: number;
  absentCount: number;
  lateCount: number;
  excusedCount: number;
  medicalLeaveCount: number;
  attendanceRate: number; // %
  standing: 'high_distinction' | 'satisfactory' | 'at_risk' | 'critical';
  warningMessage?: string;
}

/**
 * Standard scoring weights for calculating attendance percentage:
 * - Present: 1.0 (100%)
 * - Late: 0.8 (80%)
 * - Excused: 1.0 (100% credit per policy)
 * - Medical / Approved Leave: 1.0 (100% credit)
 * - Absent: 0.0 (0%)
 */
export function calculateAttendancePercentage(
  recordsByDay: Record<string, { status?: string; present?: boolean; excused?: boolean }>,
  totalClassDaysCount: number
): { rate: number; attended: number; total: number } {
  if (totalClassDaysCount <= 0) return { rate: 100, attended: 0, total: 0 };

  let weightedAttended = 0;
  let attendedCount = 0;

  for (const dayId of Object.keys(recordsByDay)) {
    const rec = recordsByDay[dayId];
    if (!rec) continue;

    const rawStatus = (rec.status || '').toLowerCase().trim();
    if (rawStatus === 'present' || rawStatus === 'p' || rec.present === true) {
      weightedAttended += 1.0;
      attendedCount += 1;
    } else if (rawStatus === 'late' || rawStatus === 'tardy') {
      weightedAttended += 0.85; // 85% attendance credit for punctuality policy
      attendedCount += 1;
    } else if (
      rawStatus === 'excused' || 
      rawStatus === 'medical / approved leave' || 
      rawStatus === 'medical_leave' || 
      rawStatus === 'approved_leave' ||
      rec.excused === true
    ) {
      weightedAttended += 1.0; // full excused credit
      attendedCount += 1;
    }
  }

  const rate = Math.min(100, Math.max(0, Math.round((weightedAttended / totalClassDaysCount) * 100)));
  return {
    rate,
    attended: attendedCount,
    total: totalClassDaysCount
  };
}
