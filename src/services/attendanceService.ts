/**
 * ============================================================================
 * ATTENDANCE SERVICE
 * HTEIM School of Ministry
 * ============================================================================
 * Handles attendance tracking, session check-ins, lecturer batch submissions,
 * absence excuses, medical leave, correction requests, administrative approvals,
 * session locking, audit trail, and the 75% at-risk notification triggers.
 */

import { apiClient, ApiClientError } from './apiClient';
import { AttendanceRecord, ClassDay } from '../types';
import { 
  AttendanceStatus, 
  AttendanceCorrectionRequest, 
  AttendanceAuditEntry, 
  SessionLockState 
} from '../types/attendance';
import { isDemoUser } from '../data/guards';

export interface AttendanceResponse {
  records: AttendanceRecord[];
  classDays: ClassDay[];
  excusedAbsences: Record<string, Record<string, boolean>>;
  sessionLocks?: Record<string, SessionLockState>;
  correctionRequests?: AttendanceCorrectionRequest[];
  auditHistory?: AttendanceAuditEntry[];
  totalRecords: number;
  totalSessions: number;
  policyThreshold: string;
  criticalThreshold: string;
  updatedAt: string;
}

export interface CheckinPayload {
  studentName: string;
  date?: string;
  classDayId?: string;
  status: AttendanceStatus;
  notes?: string;
  studentEmail?: string;
  userEmail?: string;
}

export interface LecturerSessionSubmissionPayload {
  classDayId: string;
  date?: string;
  records: {
    studentName: string;
    status: AttendanceStatus;
    notes?: string;
    email?: string;
  }[];
  lockAfterSubmission?: boolean;
  lockDeadlineHours?: number;
}

export interface CorrectionRequestPayload {
  studentName: string;
  studentEmail?: string;
  classDayId: string;
  classDayName?: string;
  currentStatus: AttendanceStatus;
  requestedStatus: AttendanceStatus;
  reason: string;
  evidenceUrl?: string;
  submittedBy?: string;
  submittedByRole?: string;
}

export interface ExcuseAbsencePayload {
  studentName: string;
  date?: string;
  classDayId?: string;
  reason?: string;
  isMedicalLeave?: boolean;
  documentUrl?: string;
  userEmail?: string;
}

export interface AtRiskStudentInfo {
  name: string;
  attendanceRate: number;
  sessionsAttended: number;
  totalSessions: number;
  isCritical: boolean;
  standing: 'critical' | 'at_risk';
  warning: string;
  level?: string;
  photoUrl?: string;
}

export interface AtRiskReportResponse {
  atRiskStudents: AtRiskStudentInfo[];
  count: number;
  policyThreshold: string;
  criticalThreshold: string;
}

export class AttendanceService {
  /**
   * Retrieves authoritative attendance records, class sessions, locks, and correction requests.
   */
  public async getAttendance(userEmail?: string): Promise<AttendanceResponse> {
    const params = userEmail ? { userEmail } : undefined;
    return apiClient.get<AttendanceResponse>('/attendance', params);
  }

  /**
   * Records a single student check-in.
   */
  public async recordCheckin(payload: CheckinPayload): Promise<{ status: string; record: AttendanceRecord; auditEntry?: AttendanceAuditEntry }> {
    const cleanName = payload.studentName?.trim();
    if (!cleanName) {
      throw new ApiClientError('Student name is required for check-in', 400, '/attendance/checkin', 'validation');
    }

    if (!payload.date && !payload.classDayId) {
      throw new ApiClientError('Date or Class Day ID is required for check-in', 400, '/attendance/checkin', 'validation');
    }

    if (isDemoUser(cleanName)) {
      throw new ApiClientError('Demo student check-ins cannot be saved to authoritative database', 403, '/attendance/checkin', 'unauthorized');
    }

    return apiClient.post<{ status: string; record: AttendanceRecord; auditEntry?: AttendanceAuditEntry }>('/attendance/checkin', {
      studentName: cleanName,
      date: payload.date || payload.classDayId,
      classDayId: payload.classDayId || payload.date,
      status: payload.status,
      notes: payload.notes,
      studentEmail: payload.studentEmail,
      userEmail: payload.userEmail,
    });
  }

  /**
   * Submits a full class session roll-call by lecturer.
   */
  public async submitSessionAttendance(
    payload: LecturerSessionSubmissionPayload
  ): Promise<{ status: string; count: number; sessionId: string; isLocked: boolean }> {
    if (!payload.classDayId) {
      throw new ApiClientError('Class Day ID is required to submit session attendance', 400, '/attendance/submit-session', 'validation');
    }

    if (!Array.isArray(payload.records) || payload.records.length === 0) {
      throw new ApiClientError('Records array cannot be empty', 400, '/attendance/submit-session', 'validation');
    }

    return apiClient.post<{ status: string; count: number; sessionId: string; isLocked: boolean }>('/attendance/submit-session', {
      classDayId: payload.classDayId,
      date: payload.date || payload.classDayId,
      records: payload.records,
      lockAfterSubmission: !!payload.lockAfterSubmission,
      lockDeadlineHours: payload.lockDeadlineHours || 24
    });
  }

  /**
   * Submits a formal correction request for a locked or historical attendance entry.
   */
  public async submitCorrectionRequest(
    payload: CorrectionRequestPayload
  ): Promise<{ status: string; request: AttendanceCorrectionRequest }> {
    if (!payload.studentName || !payload.classDayId || !payload.requestedStatus || !payload.reason) {
      throw new ApiClientError('All fields including justification reason are required', 400, '/attendance/correction-request', 'validation');
    }

    return apiClient.post<{ status: string; request: AttendanceCorrectionRequest }>('/attendance/correction-request', payload);
  }

  /**
   * Retrieves pending and past correction requests.
   */
  public async getCorrectionRequests(): Promise<{ requests: AttendanceCorrectionRequest[]; count: number }> {
    return apiClient.get<{ requests: AttendanceCorrectionRequest[]; count: number }>('/attendance/correction-requests');
  }

  /**
   * Approves a correction request (Admins only).
   */
  public async approveCorrectionRequest(
    requestId: string,
    reviewNotes?: string
  ): Promise<{ status: string; request: AttendanceCorrectionRequest; record: any }> {
    return apiClient.post<{ status: string; request: AttendanceCorrectionRequest; record: any }>(
      `/attendance/correction-requests/${requestId}/approve`,
      { reviewNotes }
    );
  }

  /**
   * Rejects a correction request (Admins only).
   */
  public async rejectCorrectionRequest(
    requestId: string,
    reviewNotes: string
  ): Promise<{ status: string; request: AttendanceCorrectionRequest }> {
    if (!reviewNotes || !reviewNotes.trim()) {
      throw new ApiClientError('Review notes explaining rejection are required', 400, `/attendance/correction-requests/${requestId}/reject`, 'validation');
    }

    return apiClient.post<{ status: string; request: AttendanceCorrectionRequest }>(
      `/attendance/correction-requests/${requestId}/reject`,
      { reviewNotes }
    );
  }

  /**
   * Locks an attendance session to prevent teacher alteration.
   */
  public async lockSession(
    classDayId: string,
    lockDeadline?: string,
    notes?: string
  ): Promise<{ status: string; sessionLock: SessionLockState }> {
    return apiClient.post<{ status: string; sessionLock: SessionLockState }>('/attendance/lock-session', {
      classDayId,
      lockDeadline,
      notes
    });
  }

  /**
   * Unlocks an attendance session for authorized editing.
   */
  public async unlockSession(
    classDayId: string,
    reason: string
  ): Promise<{ status: string; classDayId: string }> {
    return apiClient.post<{ status: string; classDayId: string }>('/attendance/unlock-session', {
      classDayId,
      reason
    });
  }

  /**
   * Retrieves full attendance audit history.
   */
  public async getAuditHistory(): Promise<{ logs: AttendanceAuditEntry[]; count: number }> {
    return apiClient.get<{ logs: AttendanceAuditEntry[]; count: number }>('/attendance/audit-history');
  }

  /**
   * Submits an excused absence with mandatory date and reason/documentation.
   */
  public async recordExcusedAbsence(
    payload: ExcuseAbsencePayload
  ): Promise<{ status: string; studentName: string; date: string; statusValue: string }> {
    const cleanName = payload.studentName?.trim();
    if (!cleanName) {
      throw new ApiClientError('Student name is required to excuse absence', 400, '/attendance/excuse', 'validation');
    }

    const targetDate = payload.classDayId || payload.date;
    if (!targetDate || !targetDate.trim()) {
      throw new ApiClientError('Date or session ID is required to excuse absence', 400, '/attendance/excuse', 'validation');
    }

    return apiClient.post<{ status: string; studentName: string; date: string; statusValue: string }>('/attendance/excuse', {
      studentName: cleanName,
      date: targetDate.trim(),
      classDayId: targetDate.trim(),
      reason: payload.reason?.trim() || 'Medical or approved ministry absence',
      isMedicalLeave: !!payload.isMedicalLeave,
      documentUrl: payload.documentUrl,
      userEmail: payload.userEmail,
    });
  }

  /**
   * Retrieves list of students below the mandatory 75% HTEIM attendance threshold.
   */
  public async getAtRiskStudents(userEmail?: string): Promise<AtRiskReportResponse> {
    const params = userEmail ? { userEmail } : undefined;
    return apiClient.get<AtRiskReportResponse>('/attendance/at-risk', params);
  }
}

export const attendanceService = new AttendanceService();
