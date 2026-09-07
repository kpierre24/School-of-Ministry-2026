/**
 * ============================================================================
 * ENROLLMENT SERVICE
 * HTEIM School of Ministry
 * ============================================================================
 * Handles admissions, new student registrations, academic track assignments,
 * and cohort enrollments. Communicates authoritatively with the Express API.
 */

import { apiClient, ApiClientError } from './apiClient';
import { AcademicLevel } from '../types';
import { isDemoUser } from '../data/guards';

export interface EnrollStudentPayload {
  name: string;
  level?: AcademicLevel | string;
  email?: string;
  photoUrl?: string;
  cohortId?: string;
  moduleTrack?: string;
  userEmail?: string;
}

export interface EnrollmentResult {
  status: string;
  student: {
    name: string;
    level: string;
    email?: string;
    photoUrl?: string | null;
    enrolledAt: string;
  };
}

export interface BatchEnrollPayload {
  students: EnrollStudentPayload[];
  userEmail?: string;
}

export class EnrollmentService {
  /**
   * Enrolls a new student into the School of Ministry.
   */
  public async enrollStudent(payload: EnrollStudentPayload): Promise<EnrollmentResult> {
    const cleanName = payload.name?.trim();
    if (!cleanName) {
      throw new ApiClientError('Student full name is required for enrollment', 400, '/students', 'validation');
    }

    if (cleanName.length < 2) {
      throw new ApiClientError('Student name must be at least 2 characters', 400, '/students', 'validation');
    }

    if (isDemoUser(cleanName)) {
      throw new ApiClientError('Demo student names cannot be enrolled in production database', 403, '/students', 'unauthorized');
    }

    if (payload.email) {
      const cleanEmail = payload.email.trim().toLowerCase();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
        throw new ApiClientError('Invalid email format provided for enrollment', 400, '/students', 'validation');
      }
      if (isDemoUser(cleanEmail)) {
        throw new ApiClientError('Demo email accounts cannot be registered in live roster', 403, '/students', 'unauthorized');
      }
    }

    return apiClient.post<EnrollmentResult>('/students', {
      name: cleanName,
      level: payload.level || 'Level 1 Foundation',
      email: payload.email?.trim()?.toLowerCase(),
      photoUrl: payload.photoUrl,
      cohortId: payload.cohortId,
      moduleTrack: payload.moduleTrack,
      userEmail: payload.userEmail,
    });
  }

  /**
   * Batch enrolls multiple students in sequence with full validation.
   */
  public async batchEnroll(payload: BatchEnrollPayload): Promise<{
    enrolled: EnrollmentResult[];
    failed: { name: string; error: string }[];
  }> {
    if (!Array.isArray(payload.students) || payload.students.length === 0) {
      throw new ApiClientError('Student list cannot be empty for batch enrollment', 400, '/students', 'validation');
    }

    const enrolled: EnrollmentResult[] = [];
    const failed: { name: string; error: string }[] = [];

    for (const student of payload.students) {
      try {
        const res = await this.enrollStudent({
          ...student,
          userEmail: payload.userEmail,
        });
        enrolled.push(res);
      } catch (err: any) {
        failed.push({
          name: student.name || 'Unknown',
          error: err.message || 'Enrollment failed',
        });
      }
    }

    return { enrolled, failed };
  }
}

export const enrollmentService = new EnrollmentService();
