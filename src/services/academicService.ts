/**
 * ============================================================================
 * ACADEMIC SERVICE
 * HTEIM School of Ministry
 * ============================================================================
 * Manages curriculum structure, course catalog, course offerings, terms,
 * and academic years. Communicates authoritatively with Express API (/api/academics).
 */

import { apiClient, ApiClientError } from './apiClient';
import { Course } from '../types';

export interface CoursesResponse {
  courses: Course[];
  count: number;
  updatedAt: string;
}

export interface AcademicStructureResponse {
  academicYears: any[];
  terms: any[];
  masterCourses: any[];
  courseOfferings: any[];
  activeTermId?: string;
}

export interface SaveCoursePayload {
  code: string;
  title: string;
  description?: string;
  moduleTrack?: string;
  credits?: number;
  instructor?: string;
  syllabusUrl?: string;
  id?: string;
}

export interface SaveOfferingPayload {
  id?: string;
  courseId: string;
  termId: string;
  instructorName?: string;
  meetingSchedule?: string;
  room?: string;
  maxEnrollment?: number;
}

export class AcademicService {
  /**
   * Retrieves the authoritative course catalog.
   */
  public async getCourses(userEmail?: string): Promise<CoursesResponse> {
    const params = userEmail ? { userEmail } : undefined;
    return apiClient.get<CoursesResponse>('/academics/courses', params);
  }

  /**
   * Retrieves comprehensive academic structure including terms, academic years,
   * master courses, and active course offerings.
   */
  public async getAcademicStructure(userEmail?: string): Promise<AcademicStructureResponse> {
    const params = userEmail ? { userEmail } : undefined;
    return apiClient.get<AcademicStructureResponse>('/academics/structure', params);
  }

  /**
   * Creates or updates a course in the curriculum catalog.
   */
  public async saveCourse(
    course: SaveCoursePayload,
    userEmail?: string
  ): Promise<{ status: string; course: Course }> {
    if (!course.code || !course.code.trim()) {
      throw new ApiClientError('Course code is required (e.g., MIN-101)', 400, '/academics/courses', 'validation');
    }

    if (!course.title || !course.title.trim()) {
      throw new ApiClientError('Course title is required', 400, '/academics/courses', 'validation');
    }

    if (course.credits !== undefined && (typeof course.credits !== 'number' || course.credits < 0)) {
      throw new ApiClientError('Course credits must be a positive number', 400, '/academics/courses', 'validation');
    }

    return apiClient.post<{ status: string; course: Course }>('/academics/courses', {
      course: {
        ...course,
        code: course.code.trim().toUpperCase(),
        title: course.title.trim(),
      },
      userEmail,
    });
  }

  /**
   * Creates or updates a specific term course offering.
   */
  public async saveCourseOffering(
    offering: SaveOfferingPayload,
    userEmail?: string
  ): Promise<{ status: string; offering: any }> {
    if (!offering.courseId) {
      throw new ApiClientError('Course ID is required for offering', 400, '/academics/offerings', 'validation');
    }

    if (!offering.termId) {
      throw new ApiClientError('Academic Term ID is required for offering', 400, '/academics/offerings', 'validation');
    }

    return apiClient.post<{ status: string; offering: any }>('/academics/offerings', {
      offering,
      userEmail,
    });
  }
}

export const academicService = new AcademicService();
