import { CustomAssignment, AssignmentSubmission, QuizAssignment, QuizSubmission } from '../../types';

export type { CustomAssignment, AssignmentSubmission, QuizAssignment, QuizSubmission };

export interface SubmissionGradePayload {
  submissionId: string;
  grade: number;
  feedback?: string;
  gradedBy: string;
}

export interface AssignmentFilterOptions {
  searchQuery: string;
  status: 'all' | 'pending' | 'submitted' | 'graded';
  courseCode?: string;
  studentName?: string;
}

export const GRADING_SCALE_THRESHOLDS = {
  EXCELLENT: 90,
  SATISFACTORY: 75,
  NEEDS_REVISION: 60,
};
