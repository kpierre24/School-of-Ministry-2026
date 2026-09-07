import { CustomAssignment, AssignmentSubmission } from '../../types';
import { AssignmentFilterOptions } from './assignmentSchemas';

export class AssignmentService {
  /**
   * Filter custom assignments by search query or course
   */
  public filterAssignments(
    assignments: CustomAssignment[],
    searchQuery: string,
    courseCode?: string
  ): CustomAssignment[] {
    const q = searchQuery.toLowerCase().trim();
    return assignments.filter(a => {
      const matchSearch = !q || 
        a.title.toLowerCase().includes(q) || 
        (a.description && a.description.toLowerCase().includes(q)) ||
        (a.courseCode && a.courseCode.toLowerCase().includes(q));

      const matchCourse = !courseCode || courseCode === 'all' || a.courseCode === courseCode;
      return matchSearch && matchCourse;
    });
  }

  /**
   * Filter submissions by status or student
   */
  public filterSubmissions(
    submissions: AssignmentSubmission[],
    options: AssignmentFilterOptions
  ): AssignmentSubmission[] {
    const q = options.searchQuery.toLowerCase().trim();

    return submissions.filter(s => {
      const matchStudent = !q || 
        s.studentName.toLowerCase().includes(q) || 
        (s.studentNotes && s.studentNotes.toLowerCase().includes(q));

      let matchStatus = true;
      if (options.status === 'pending') matchStatus = s.status === 'Pending Review' || (s.status === 'Submitted' && typeof s.score !== 'number');
      else if (options.status === 'graded') matchStatus = s.status === 'Graded' || typeof s.score === 'number';

      return matchStudent && matchStatus;
    });
  }

  /**
   * Compute average score for student submissions
   */
  public calculateAverageScore(submissions: AssignmentSubmission[]): number | null {
    const graded = submissions.filter(s => typeof s.score === 'number');
    if (graded.length === 0) return null;
    const total = graded.reduce((acc, s) => acc + (s.score || 0), 0);
    return Math.round(total / graded.length);
  }
}

export const assignmentService = new AssignmentService();
