/**
 * ============================================================================
 * ASSIGNMENT SERVICE
 * HTEIM School of Ministry
 * ============================================================================
 * Handles coursework, quizzes, essay prompts, student submissions,
 * and instructor grading with rubric scores.
 * Communicates authoritatively with Express API (/api/assignments).
 */

import { apiClient, ApiClientError } from './apiClient';
import { CustomAssignment, AssignmentSubmission } from '../types';
import { isDemoAssignment, isDemoUser } from '../data/guards';

export interface AssignmentsResponse {
  assignments: CustomAssignment[];
  count: number;
}

export interface SubmissionsResponse {
  submissions: AssignmentSubmission[];
  rubricScores: Record<string, any>;
  count: number;
}

export interface SubmitAssignmentPayload {
  assignmentId: string;
  studentName: string;
  submissionDate?: string;
  fileUrl?: string;
  fileName?: string;
  notes?: string;
  answers?: Record<string, any>;
  studentEmail?: string;
  userEmail?: string;
}

export interface GradeSubmissionPayload {
  submissionId?: string;
  assignmentId?: string;
  studentName: string;
  score: number;
  maxPoints?: number;
  feedback?: string;
  rubricScores?: Record<string, number>;
  userEmail?: string;
}

export class AssignmentService {
  /**
   * Retrieves all published course assignments and quizzes.
   */
  public async getAssignments(userEmail?: string): Promise<AssignmentsResponse> {
    const params = userEmail ? { userEmail } : undefined;
    const response = await apiClient.get<AssignmentsResponse>('/assignments', params);
    
    // Strict defense: Ensure no demo coursework leaks to production
    const filtered = (response.assignments || []).filter(a => !isDemoAssignment(a));
    return {
      assignments: filtered,
      count: filtered.length,
    };
  }

  /**
   * Retrieves student coursework submissions and rubric evaluation scores.
   */
  public async getSubmissions(
    studentName?: string,
    userEmail?: string
  ): Promise<SubmissionsResponse> {
    const params: Record<string, any> = {};
    if (studentName) params.studentName = studentName.trim();
    if (userEmail) params.userEmail = userEmail;

    return apiClient.get<SubmissionsResponse>('/assignments/submissions', params);
  }

  /**
   * Submits student assignment solution or quiz answers.
   */
  public async submitAssignment(
    payload: SubmitAssignmentPayload
  ): Promise<{ status: string; submission: AssignmentSubmission }> {
    if (!payload.assignmentId || !payload.assignmentId.trim()) {
      throw new ApiClientError('Assignment ID is required for submission', 400, '/assignments/submit', 'validation');
    }

    const cleanName = payload.studentName?.trim();
    if (!cleanName) {
      throw new ApiClientError('Student name is required for submission', 400, '/assignments/submit', 'validation');
    }

    if (isDemoUser(cleanName)) {
      throw new ApiClientError('Demo persona accounts cannot submit coursework to production ledger', 403, '/assignments/submit', 'unauthorized');
    }

    return apiClient.post<{ status: string; submission: AssignmentSubmission }>('/assignments/submit', {
      submission: {
        id: `SUB-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
        assignmentId: payload.assignmentId.trim(),
        studentName: cleanName,
        submissionDate: payload.submissionDate || new Date().toISOString(),
        fileUrl: payload.fileUrl,
        fileName: payload.fileName,
        notes: payload.notes,
        answers: payload.answers,
        studentEmail: payload.studentEmail,
        status: 'submitted',
      },
      userEmail: payload.userEmail,
    });
  }

  /**
   * Records instructor grade and rubric evaluations for a student submission.
   */
  public async gradeSubmission(
    payload: GradeSubmissionPayload
  ): Promise<{ status: string; score: number }> {
    const cleanName = payload.studentName?.trim();
    if (!cleanName) {
      throw new ApiClientError('Student name is required for grading', 400, '/assignments/grade', 'validation');
    }

    if (typeof payload.score !== 'number' || isNaN(payload.score) || payload.score < 0) {
      throw new ApiClientError('Grade score must be a non-negative number', 400, '/assignments/grade', 'validation');
    }

    const max = payload.maxPoints || 100;
    if (payload.score > max) {
      throw new ApiClientError(`Score cannot exceed maximum points (${max})`, 400, '/assignments/grade', 'validation');
    }

    return apiClient.post<{ status: string; score: number }>('/assignments/grade', {
      submissionId: payload.submissionId,
      assignmentId: payload.assignmentId,
      studentName: cleanName,
      score: payload.score,
      feedback: payload.feedback?.trim() || '',
      rubricScores: payload.rubricScores,
      userEmail: payload.userEmail,
    });
  }
}

export const assignmentService = new AssignmentService();
