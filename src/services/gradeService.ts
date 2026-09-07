// HTEIM School of Ministry — Grade & Academic Evaluation Service
import { AssignmentSubmission, CustomAssignment } from '../types';

export interface StudentGradeSummary {
  studentName: string;
  totalSubmissions: number;
  averageScore: number;
  letterGrade: string;
  academicStatus: 'High Distinction' | 'Satisfactory' | 'At-Risk';
  gradedAssignmentsCount: number;
}

/**
 * Calculates academic status based on HTEIM grading thresholds:
 * - High Distinction: >= 85%
 * - Satisfactory: >= 75%
 * - At-Risk: < 75%
 */
export function getAcademicStatusFromScore(score: number): 'High Distinction' | 'Satisfactory' | 'At-Risk' {
  if (score >= 85) return 'High Distinction';
  if (score >= 75) return 'Satisfactory';
  return 'At-Risk';
}

/**
 * Converts a percentage score to a standard letter grade
 */
export function getLetterGradeFromScore(score: number): string {
  if (score >= 93) return 'A';
  if (score >= 90) return 'A-';
  if (score >= 87) return 'B+';
  if (score >= 83) return 'B';
  if (score >= 80) return 'B-';
  if (score >= 77) return 'C+';
  if (score >= 73) return 'C';
  if (score >= 70) return 'C-';
  if (score >= 60) return 'D';
  return 'F';
}

/**
 * Computes grade summary for a student across all submissions
 */
export function calculateStudentGradeSummary(
  studentName: string,
  submissions: AssignmentSubmission[],
  assignments: CustomAssignment[]
): StudentGradeSummary {
  const norm = (studentName || '').toLowerCase().trim();
  const studentSubmissions = submissions.filter(
    s => (s.studentName || '').toLowerCase().trim() === norm && s.score !== undefined && s.score !== null
  );

  if (studentSubmissions.length === 0) {
    return {
      studentName,
      totalSubmissions: 0,
      averageScore: 0,
      letterGrade: 'N/A',
      academicStatus: 'Satisfactory',
      gradedAssignmentsCount: 0
    };
  }

  const totalScore = studentSubmissions.reduce((acc, s) => acc + (s.score || 0), 0);
  const averageScore = Math.round((totalScore / studentSubmissions.length) * 10) / 10;
  const letterGrade = getLetterGradeFromScore(averageScore);
  const academicStatus = getAcademicStatusFromScore(averageScore);

  return {
    studentName,
    totalSubmissions: studentSubmissions.length,
    averageScore,
    letterGrade,
    academicStatus,
    gradedAssignmentsCount: studentSubmissions.length
  };
}

export const gradeService = {
  getAcademicStatusFromScore,
  getLetterGradeFromScore,
  calculateStudentGradeSummary
};

export default gradeService;
