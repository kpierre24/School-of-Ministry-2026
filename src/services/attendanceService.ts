/**
 * ============================================================================
 * ATTENDANCE SERVICE
 * HTEIM School of Ministry
 * ============================================================================
 * Handles attendance tracking, session check-ins, batch attendance logging,
 * absence excuses, and the 75% at-risk notification triggers.
 * Communicates authoritatively with Express API (/api/attendance).
 */

import { apiClient, ApiClientError } from './apiClient';
import { AttendanceRecord, ClassDay } from '../types';
import { isDemoUser } from '../data/guards';

export type AttendanceStatus = 'Present' | 'Absent' | 'Excused' | 'Tardy';

export interface AttendanceResponse {
  records: AttendanceRecord[];
  classDays: ClassDay[];
  excusedAbsences: Record<string, Record<string, boolean>>;
  totalRecords: number;
  totalSessions: number;
  policyThreshold: string;
  updatedAt: string;
}

export interface CheckinPayload {
  studentName: string;
  date: string;
  status: AttendanceStatus;
  notes?: string;
  studentEmail?: string;
  userEmail?: string;
}

export interface BatchAttendanceItem {
  studentName: string;
  status: AttendanceStatus;
  notes?: string;
}

export interface BatchAttendancePayload {
  date: string;
  records: BatchAttendanceItem[];
  userEmail?: string;
}

export interface ExcuseAbsencePayload {
  studentName: string;
  date: string;
  reason?: string;
  documentUrl?: string;
  userEmail?: string;
}

export interface AtRiskStudentInfo {
  studentName: string;
  attendanceRate: number;
  totalSessions: number;
  attendedSessions: number;
  isCritical: boolean;
  status: 'At-Risk' | 'Critical';
}

export interface AtRiskReportResponse {
  atRiskStudents: AtRiskStudentInfo[];
  count: number;
  policyThreshold: string;
  criticalThreshold: string;
}

const VALID_STATUSES: AttendanceStatus[] = ['Present', 'Absent', 'Excused', 'Tardy'];

export class AttendanceService {
  /**
   * Retrieves authoritative attendance records and class sessions.
   */
  public async getAttendance(userEmail?: string): Promise<AttendanceResponse> {
    const params = userEmail ? { userEmail } : undefined;
    return apiClient.get<AttendanceResponse>('/attendance', params);
  }

  /**
   * Records a single student check-in.
   */
  public async recordCheckin(payload: CheckinPayload): Promise<{ status: string; record: AttendanceRecord }> {
    const cleanName = payload.studentName?.trim();
    if (!cleanName) {
      throw new ApiClientError('Student name is required for check-in', 400, '/attendance/checkin', 'validation');
    }

    if (!payload.date || !payload.date.trim()) {
      throw new ApiClientError('Date is required for check-in', 400, '/attendance/checkin', 'validation');
    }

    if (!VALID_STATUSES.includes(payload.status)) {
      throw new ApiClientError(
        `Invalid status "${payload.status}". Must be one of: ${VALID_STATUSES.join(', ')}`,
        400,
        '/attendance/checkin',
        'validation'
      );
    }

    if (isDemoUser(cleanName)) {
      throw new ApiClientError('Demo student check-ins cannot be saved to authoritative database', 403, '/attendance/checkin', 'unauthorized');
    }

    return apiClient.post<{ status: string; record: AttendanceRecord }>('/attendance/checkin', {
      studentName: cleanName,
      date: payload.date.trim(),
      status: payload.status,
      notes: payload.notes,
      studentEmail: payload.studentEmail,
      userEmail: payload.userEmail,
    });
  }

  /**
   * Records attendance for an entire class batch on a given date.
   */
  public async recordBatchAttendance(payload: BatchAttendancePayload): Promise<{ status: string; count: number }> {
    if (!payload.date || !payload.date.trim()) {
      throw new ApiClientError('Class session date is required for batch attendance', 400, '/attendance/batch', 'validation');
    }

    if (!Array.isArray(payload.records) || payload.records.length === 0) {
      throw new ApiClientError('Attendance records array cannot be empty', 400, '/attendance/batch', 'validation');
    }

    // Filter out demo records and validate statuses
    const sanitizedRecords = payload.records
      .filter(r => !isDemoUser(r.studentName))
      .map(r => {
        const cleanName = r.studentName?.trim();
        if (!cleanName) {
          throw new ApiClientError('Each attendance record must have a student name', 400, '/attendance/batch', 'validation');
        }
        return {
          studentName: cleanName,
          status: VALID_STATUSES.includes(r.status) ? r.status : 'Absent',
          notes: r.notes || '',
        };
      });

    return apiClient.post<{ status: string; count: number }>('/attendance/batch', {
      date: payload.date.trim(),
      records: sanitizedRecords,
      userEmail: payload.userEmail,
    });
  }

  /**
   * Submits an excused absence with mandatory date and reason/documentation.
   */
  public async recordExcusedAbsence(
    payload: ExcuseAbsencePayload
  ): Promise<{ status: string; studentName: string; date: string }> {
    const cleanName = payload.studentName?.trim();
    if (!cleanName) {
      throw new ApiClientError('Student name is required to excuse absence', 400, '/attendance/excuse', 'validation');
    }

    if (!payload.date || !payload.date.trim()) {
      throw new ApiClientError('Date is required to excuse absence', 400, '/attendance/excuse', 'validation');
    }

    return apiClient.post<{ status: string; studentName: string; date: string }>('/attendance/excuse', {
      studentName: cleanName,
      date: payload.date.trim(),
      reason: payload.reason?.trim() || 'Medical or personal emergency',
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
