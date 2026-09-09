/**
 * ============================================================================
 * PORTAL API CLIENT (React -> Express API -> Supabase PostgreSQL)
 * ============================================================================
 * Primary client communicating with the centralized Express API layer.
 * Enforces PostgreSQL as the authoritative single source of truth.
 */

import { logger } from '../../lib/logger';
import { SyncedAppState } from '../../lib/firebaseSync';
import { getAuthoritativeFirebaseIdToken } from '../firebaseAdapter';

const API_BASE = '/api';

async function fetchJson<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE}${endpoint}`;

  // Attach authoritative Firebase ID Token in Authorization header if available
  const authHeaders: Record<string, string> = {};
  try {
    const idToken = await getAuthoritativeFirebaseIdToken();
    if (idToken) {
      authHeaders['Authorization'] = `Bearer ${idToken}`;
    }
  } catch {
    // Non-blocking
  }

  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...authHeaders,
      ...options.headers,
    },
  });

  if (!response.ok) {
    let errorMsg = `HTTP Error ${response.status}: ${response.statusText}`;
    try {
      const errorJson = await response.json();
      if (errorJson?.error) {
        errorMsg = errorJson.error;
      }
    } catch {
      // Keep default message
    }
    throw new Error(errorMsg);
  }

  return response.json() as Promise<T>;
}

export const portalApi = {
  // 1. Authentication & Roles
  async getAuthSession(email: string, requestedRole?: string) {
    return fetchJson<{
      status: string;
      user: { email: string; role: 'admin' | 'teacher' | 'student'; permissions: Record<string, boolean> };
    }>('/auth/session', {
      method: 'POST',
      body: JSON.stringify({ email, requestedRole }),
    });
  },

  // 2. Student Management
  async getStudents() {
    return fetchJson<{
      students: any[];
      total: number;
      atRiskCount: number;
      threshold: string;
      updatedAt: string;
    }>('/students');
  },

  async getStudentProfile(name: string) {
    return fetchJson<{
      student: any;
      attendanceHistory: any[];
      submissions: any[];
      payments: any[];
      rubricScores: any;
    }>(`/students/${encodeURIComponent(name)}`);
  },

  async enrollStudent(data: { name: string; level?: string; email?: string; photoUrl?: string }) {
    return fetchJson<{ status: string; student: any }>('/students', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async updateStudent(name: string, data: { level?: string; note?: string; photoUrl?: string }) {
    return fetchJson<{ status: string; student: any }>(`/students/${encodeURIComponent(name)}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  // 3. Attendance Management (Hierarchy: attendance_session -> attendance_record -> student_id)
  async getAttendance() {
    return fetchJson<{
      records: any[];
      sessions: any[];
      classDays: any[];
      excusedAbsences: Record<string, any>;
      totalRecords: number;
      totalSessions: number;
      policyThreshold: string;
    }>('/attendance');
  },

  async recordCheckin(data: {
    studentId?: string;
    studentName?: string;
    sessionId?: string;
    date: string;
    status: 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED' | string;
    notes?: string;
    studentEmail?: string;
    manualOverride?: boolean;
  }) {
    return fetchJson<{ status: string; record: any }>('/attendance/checkin', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async recordBatchAttendance(data: {
    date: string;
    sessionId?: string;
    sessionTitle?: string;
    records: Array<{
      studentId?: string;
      studentName?: string;
      status: 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED' | string;
      notes?: string;
      manualOverride?: boolean;
    }>;
  }) {
    return fetchJson<{ status: string; count: number; date: string; session?: any }>('/attendance/batch', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async recordExcusedAbsence(data: {
    studentId?: string;
    studentName?: string;
    date: string;
    reason?: string;
    documentUrl?: string;
  }) {
    return fetchJson<{ status: string; studentId: string; studentName: string; date: string }>('/attendance/excuse', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async getAtRiskStudents() {
    return fetchJson<{
      atRiskStudents: any[];
      count: number;
      policyThreshold: string;
      criticalThreshold: string;
    }>('/attendance/at-risk');
  },

  // 4. Academic Management
  async getCourses() {
    return fetchJson<{ courses: any[]; count: number }>('/academics/courses');
  },

  // Convenience: load full academic structure (years, terms, masterCourses, courseOfferings)
  async getAcademicStructure() {
    // Expected shape: { academicYears, terms, masterCourses, courseOfferings, activeTermId? }
    return fetchJson<any>('/academics/structure');
  },

  async saveCourse(course: any) {
    return fetchJson<{ status: string; course: any }>('/academics/courses', {
      method: 'POST',
      body: JSON.stringify({ course }),
    });
  },

  // Save or update a course offering (CourseOffering)
  async saveCourseOffering(offering: any) {
    return fetchJson<{ status: string; offering: any }>('/academics/offerings', {
      method: 'POST',
      body: JSON.stringify({ offering }),
    });
  },

  // 5. Payments & Tuition
  async getPayments(studentName?: string) {
    const params = new URLSearchParams();
    if (studentName) params.set('studentName', studentName);
    const query = params.toString() ? `?${params.toString()}` : '';
    return fetchJson<{ payments: any[]; total: number }>(`/payments${query}`);
  },

  async recordPayment(payment: any) {
    return fetchJson<{ status: string; payment: any }>('/payments', {
      method: 'POST',
      body: JSON.stringify({ payment }),
    });
  },

  async getPaymentSummary() {
    return fetchJson<{
      totalPayments: number;
      totalCollected: number;
      pendingCount: number;
      currency: string;
    }>('/payments/summary');
  },

  // 6. Digital Library
  async getLibrary() {
    return fetchJson<{ resources: any[]; classroomMedia: any[]; count: number }>('/library');
  },

  async addLibraryResource(resource: any) {
    return fetchJson<{ status: string; resource: any }>('/library', {
      method: 'POST',
      body: JSON.stringify({ resource }),
    });
  },

  async deleteLibraryResource(id: string) {
    return fetchJson<{ status: string; id: string }>(`/library/${id}`, {
      method: 'DELETE',
    });
  },

  // 7. Assignments & Submissions
  async getAssignments() {
    return fetchJson<{ assignments: any[]; count: number }>('/assignments');
  },

  async getSubmissions(studentName?: string) {
    const params = new URLSearchParams();
    if (studentName) params.set('studentName', studentName);
    const query = params.toString() ? `?${params.toString()}` : '';
    return fetchJson<{ submissions: any[]; rubricScores: any; count: number }>(`/assignments/submissions${query}`);
  },

  async submitAssignment(submission: any) {
    const assignmentId = submission?.assignmentId || submission?.id;
    const endpoint = assignmentId ? `/assignments/${assignmentId}/submissions` : '/assignments/submit';
    return fetchJson<{ status: string; submission: any }>(endpoint, {
      method: 'POST',
      body: JSON.stringify(submission),
    });
  },

  async gradeSubmission(gradeData: {
    submissionId?: string;
    studentName?: string;
    score: number;
    feedback?: string;
    rubricScores?: any;
    overrideReason?: string;
  }) {
    return fetchJson<{ status: string; score: number }>('/assignments/grade', {
      method: 'POST',
      body: JSON.stringify(gradeData),
    });
  },

  async transitionGradeLifecycle(data: {
    submissionId: string;
    targetStatus: 'SUBMITTED' | 'GRADED' | 'MODERATION' | 'RELEASED' | 'LOCKED' | string;
    reason?: string;
  }) {
    return fetchJson<{ status: string; lifecycleStatus: string }>('/assignments/grade/transition', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async overrideLockedGrade(data: {
    submissionId: string;
    score: number;
    feedback?: string;
    reason: string;
  }) {
    return fetchJson<{ status: string; score: number; feedback?: string; overrideApproved: boolean }>(
      '/assignments/grade/override',
      {
        method: 'POST',
        body: JSON.stringify(data),
      }
    );
  },

  // 8. Audit Logs
  async getAuditLogs(limit = 50, entityType?: string) {
    const params = new URLSearchParams({ limit: limit.toString() });
    if (entityType) params.set('entityType', entityType);
    return fetchJson<{ logs: any[]; count: number }>(`/audit-logs?${params.toString()}`);
  },

  // 9. Identity & Personal Data Endpoints (/api/me)
  async getMe() {
    return fetchJson<{ user: any; studentProfile: any }>('/me');
  },

  async getMeGrades() {
    return fetchJson<{
      studentId: string | null;
      studentName: string;
      averageGrade: number;
      honorRoll: boolean;
      standing: string;
      submissions: any[];
      rubricScores: any;
    }>('/me/grades');
  },

  async getMeAttendance() {
    return fetchJson<{
      studentId: string | null;
      studentName: string;
      totalSessions: number;
      presentCount: number;
      excusedCount: number;
      attendanceRate: number;
      isAtRisk: boolean;
      records: any[];
    }>('/me/attendance');
  },

  async getMeAssignments() {
    return fetchJson<{
      assignments: any[];
      submissions: any[];
      count: number;
    }>('/me/assignments');
  },

  async getMeInvoices() {
    return fetchJson<{
      invoices: any[];
      total: number;
      studentId: string | null;
      studentName: string;
    }>('/me/invoices');
  },

  async getMePayments() {
    return fetchJson<{
      payments: any[];
      total: number;
      studentId: string | null;
      studentName: string;
    }>('/me/payments');
  },

  // Authoritative State Pipeline (PostgreSQL) - Derived from server-side req.user
  async getMeState(): Promise<SyncedAppState | null> {
    try {
      const data = await fetchJson<{ state: SyncedAppState | null; source: string; user?: any }>('/me/state');
      return data.state || null;
    } catch (err) {
      logger.warn('Error loading state from Express /api/me/state:', err);
      return null;
    }
  },

  async loadAuthoritativeState(_legacyUserEmail?: string): Promise<SyncedAppState | null> {
    try {
      // Primary: identity-based /api/me/state
      const data = await fetchJson<{ state: SyncedAppState | null; source: string }>('/me/state');
      return data.state || null;
    } catch (err) {
      // Fallback: /api/state
      try {
        const fallback = await fetchJson<{ state: SyncedAppState | null; source: string }>('/state');
        return fallback.state || null;
      } catch (fallbackErr) {
        logger.warn('Error loading state from Express /api/state:', fallbackErr);
        return null;
      }
    }
  },

  async saveAuthoritativeState(
    state: SyncedAppState,
    _legacyUserEmail?: string,
    actionDescription?: string
  ): Promise<boolean> {
    try {
      const res = await fetchJson<{ success: boolean; updatedAt: string }>('/state', {
        method: 'POST',
        body: JSON.stringify({ state, actionDescription }),
      });
      return !!res.success;
    } catch (err) {
      logger.warn('Error saving state to Express /api/state:', err);
      return false;
    }
  },

  // 10. Notification Engine API
  async getNotifications(params?: {
    role?: string;
    studentName?: string;
    category?: string;
    eventType?: string;
    unreadOnly?: boolean;
    limit?: number;
  }) {
    const query = new URLSearchParams();
    if (params?.role) query.set('role', params.role);
    if (params?.studentName) query.set('studentName', params.studentName);
    if (params?.category) query.set('category', params.category);
    if (params?.eventType) query.set('eventType', params.eventType);
    if (params?.unreadOnly) query.set('unreadOnly', 'true');
    if (params?.limit) query.set('limit', params.limit.toString());

    return fetchJson<{ success: boolean; notifications: any[]; stats: any }>(
      `/notifications?${query.toString()}`
    );
  },

  async createNotification(notification: any) {
    return fetchJson<{ success: boolean; notification: any }>('/notifications', {
      method: 'POST',
      body: JSON.stringify(notification),
    });
  },

  async markNotificationAsRead(id: string) {
    return fetchJson<{ success: boolean; notification: any }>(`/notifications/${id}/read`, {
      method: 'PUT',
    });
  },

  async markAllNotificationsAsRead(role = 'all', studentName?: string) {
    return fetchJson<{ success: boolean; message: string }>('/notifications/read-all', {
      method: 'PUT',
      body: JSON.stringify({ role, studentName }),
    });
  },

  async deleteNotification(id: string) {
    return fetchJson<{ success: boolean; message: string }>(`/notifications/${id}`, {
      method: 'DELETE',
    });
  },

  async getNotificationPreferences() {
    return fetchJson<{ success: boolean; preferences: any; channels: any }>('/notifications/preferences');
  },

  async saveNotificationPreferences(preferences: any) {
    return fetchJson<{ success: boolean; preferences: any }>('/notifications/preferences', {
      method: 'PUT',
      body: JSON.stringify({ preferences }),
    });
  },

  async dispatchTestNotification(eventType: string, targetStudentName?: string) {
    return fetchJson<{ success: boolean; notification: any; message: string }>('/notifications/test-dispatch', {
      method: 'POST',
      body: JSON.stringify({ eventType, targetStudentName }),
    });
  },
};

export const portalApiClient = portalApi;
export default portalApi;
