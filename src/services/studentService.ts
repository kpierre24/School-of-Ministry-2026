/**
 * ============================================================================
 * STUDENT SERVICE
 * HTEIM School of Ministry
 * ============================================================================
 * Handles student records, roster directory, profiles, and academic standing.
 * Communicates authoritatively with the Express API (/api/students).
 */

import { apiClient, ApiClientError } from './apiClient';
import { StudentSummary, AcademicLevel } from '../types';
import { isDemoUser } from '../data/guards';

export interface StudentListResponse {
  students: StudentSummary[];
  total: number;
  atRiskCount: number;
  threshold: string;
  updatedAt: string;
}

export interface StudentProfileDetails {
  student: StudentSummary;
  attendanceHistory: any[];
  submissions: any[];
  payments: any[];
  rubricScores: Record<string, any>;
}

export interface UpdateStudentPayload {
  level?: AcademicLevel | string;
  note?: string;
  photoUrl?: string;
  userEmail?: string;
}

export class StudentService {
  /**
   * Retrieves authoritative student roster.
   */
  public async getStudents(userEmail?: string): Promise<StudentListResponse> {
    const params = userEmail ? { userEmail } : undefined;
    return apiClient.get<StudentListResponse>('/students', params);
  }

  /**
   * Retrieves full profile and performance history for a single student.
   */
  public async getStudentProfile(studentName: string, userEmail?: string): Promise<StudentProfileDetails> {
    const cleanName = studentName?.trim();
    if (!cleanName) {
      throw new ApiClientError('Student name is required', 400, '/students/:name', 'validation');
    }

    const params = userEmail ? { userEmail } : undefined;
    return apiClient.get<StudentProfileDetails>(`/students/${encodeURIComponent(cleanName)}`, params);
  }

  /**
   * Updates an existing student's academic level, advisor notes, or profile photo.
   */
  public async updateStudent(
    studentName: string,
    data: UpdateStudentPayload
  ): Promise<{ status: string; student: any }> {
    const cleanName = studentName?.trim();
    if (!cleanName) {
      throw new ApiClientError('Student name is required to update student', 400, '/students/:name', 'validation');
    }

    if (isDemoUser(cleanName)) {
      throw new ApiClientError('Demo student records cannot be modified in production database', 403, `/students/${cleanName}`, 'unauthorized');
    }

    return apiClient.put<{ status: string; student: any }>(`/students/${encodeURIComponent(cleanName)}`, {
      ...data,
      name: cleanName,
    });
  }

  /**
   * Withdraws/removes a student record from the authoritative database.
   */
  public async deleteStudent(
    studentName: string,
    reason?: string,
    userEmail?: string
  ): Promise<{ status: string; studentName: string }> {
    const cleanName = studentName?.trim();
    if (!cleanName) {
      throw new ApiClientError('Student name is required to delete student', 400, '/students/:name', 'validation');
    }

    if (isDemoUser(cleanName)) {
      throw new ApiClientError('Demo student records cannot be deleted in production database', 403, `/students/${cleanName}`, 'unauthorized');
    }

    return apiClient.delete<{ status: string; studentName: string }>(`/students/${encodeURIComponent(cleanName)}`, {
      reason,
      userEmail,
    });
  }
}

export const studentService = new StudentService();
