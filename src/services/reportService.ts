/**
 * ============================================================================
 * REPORT SERVICE
 * HTEIM School of Ministry
 * ============================================================================
 * Handles academic transcripts, attendance compliance reports, tuition collection
 * analytics, system audit logs, and verified CSV exports.
 * Communicates authoritatively with Express API endpoints.
 */

import { apiClient, ApiClientError } from './apiClient';

export interface AuditLogEntry {
  id?: string;
  actorUserId: string;
  entityType: string;
  entityId: string;
  action: string;
  timestamp: string;
  newValues?: any;
  ipAddress?: string;
}

export interface AuditLogsResponse {
  logs: AuditLogEntry[];
  count: number;
}

export interface StudentAcademicReport {
  studentName: string;
  academicLevel: string;
  attendanceRate: number;
  totalSessions: number;
  sessionsAttended: number;
  averageGrade: number;
  totalSubmissions: number;
  tuitionStatus: string;
  isHonorRoll: boolean;
  isAtRisk: boolean;
}

export class ReportService {
  /**
   * Retrieves security and operations audit logs from PostgreSQL.
   */
  public async getAuditLogs(limit = 50, entityType?: string): Promise<AuditLogsResponse> {
    const validLimit = Math.max(1, Math.min(limit, 500));
    const params: Record<string, any> = { limit: validLimit };
    if (entityType && entityType.trim()) {
      params.entityType = entityType.trim();
    }

    return apiClient.get<AuditLogsResponse>('/audit-logs', params);
  }

  /**
   * Appends an audit log entry for significant administrative actions.
   */
  public async recordAuditLog(
    action: string,
    entityType: string,
    entityId: string,
    notes?: string,
    userEmail?: string
  ): Promise<{ status: string }> {
    if (!action || !entityType || !entityId) {
      throw new ApiClientError('Action, entityType, and entityId are required for audit log', 400, '/audit-logs', 'validation');
    }

    return apiClient.post<{ status: string }>('/audit-logs', {
      action,
      entityType,
      entityId,
      notes,
      userEmail,
    });
  }

  /**
   * Generates a comprehensive academic and attendance report for a student.
   */
  public async generateStudentReport(
    studentName: string,
    userEmail?: string
  ): Promise<StudentAcademicReport> {
    const cleanName = studentName?.trim();
    if (!cleanName) {
      throw new ApiClientError('Student name is required to generate report', 400, '/students/:name', 'validation');
    }

    const profileData = await apiClient.get<any>(`/students/${encodeURIComponent(cleanName)}`, {
      userEmail,
    });

    const student = profileData.student || {};
    const attendanceRate = student.attendanceRate ?? 100;
    const averageGrade = student.averageGrade ?? 85;

    return {
      studentName: cleanName,
      academicLevel: student.level || 'Level 1 Foundation',
      attendanceRate,
      totalSessions: student.totalSessions || 0,
      sessionsAttended: (student.presentCount || 0) + (student.excusedCount || 0),
      averageGrade,
      totalSubmissions: student.submissionsCount || 0,
      tuitionStatus: (profileData.payments || []).length > 0 ? 'Active / Invoiced' : 'Pending',
      isHonorRoll: averageGrade >= 85, // Rule: >= 85% is Honor Roll per AGENTS.md
      isAtRisk: attendanceRate < 75,   // Rule: < 75% is At-Risk per AGENTS.md
    };
  }

  /**
   * Exports an array of records to a formatted CSV string.
   */
  public formatCsvExport(headers: string[], rows: (string | number | boolean)[][]): string {
    const escapeCell = (val: string | number | boolean | null | undefined): string => {
      const str = String(val ?? '');
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    const headerLine = headers.map(escapeCell).join(',');
    const dataLines = rows.map(row => row.map(escapeCell).join(','));
    return [headerLine, ...dataLines].join('\n');
  }
}

export const reportService = new ReportService();
