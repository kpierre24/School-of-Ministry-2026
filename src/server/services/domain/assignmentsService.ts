import { getServerSupabase, logAuditEvent } from '../supabaseServer';
import { logger } from '../../../lib/logger';
import { AuthenticatedUser } from '../../../types/rbac';

export const assignmentsService = {
  /**
   * Retrieves assignments from relational assignments table.
   */
  async getAssignments(user?: AuthenticatedUser): Promise<{ assignments: any[]; count: number }> {
    const supabase = getServerSupabase();

    try {
      const { data: assignments, error } = await supabase
        .from('assignments')
        .select('*')
        .is('deleted_at', null)
        .order('due_at', { ascending: false });

      if (assignments && assignments.length > 0) {
        let filtered = assignments;
        if (user && user.role === 'student') {
          filtered = assignments.filter((a: any) => a.is_published !== false);
        }
        return { assignments: filtered, count: filtered.length };
      }
    } catch (err) {
      logger.error('Error fetching assignments from relational table:', err);
    }

    return { assignments: [], count: 0 };
  },

  /**
   * Retrieves submissions joined with grades and rubric evaluations from relational tables.
   */
  async getSubmissions(
    filters?: { studentName?: string; assignmentId?: string },
    user?: AuthenticatedUser
  ): Promise<{ submissions: any[]; rubricScores: Record<string, any>; count: number }> {
    const supabase = getServerSupabase();

    try {
      let query = supabase
        .from('submissions')
        .select(`
          id,
          assignment_id,
          student_id,
          status,
          submitted_at,
          submission_content,
          file_url,
          file_name,
          file_type,
          grades (
            id,
            points_awarded,
            feedback,
            graded_at,
            graded_by_user_id
          ),
          students (
            student_number,
            profiles (
              first_name,
              last_name
            )
          ),
          assignments (
            title,
            max_points
          )
        `)
        .is('deleted_at', null)
        .order('submitted_at', { ascending: false });

      if (filters?.assignmentId) {
        query = query.eq('assignment_id', filters.assignmentId);
      }

      const { data: dbSubmissions } = await query;

      if (dbSubmissions && dbSubmissions.length > 0) {
        const rubricScores: Record<string, any> = {};

        const formatted = dbSubmissions.map((s: any) => {
          const std = s.students;
          const p = Array.isArray(std?.profiles) ? std?.profiles[0] : std?.profiles;
          const studentName = p ? `${p.first_name || ''} ${p.last_name || ''}`.trim() : 'Student';
          const grade = Array.isArray(s.grades) ? s.grades[0] : s.grades;
          const asg = Array.isArray(s.assignments) ? s.assignments[0] : s.assignments;

          return {
            id: s.id,
            assignmentId: s.assignment_id,
            assignmentTitle: asg?.title || 'Assignment',
            studentId: s.student_id,
            studentName,
            status: s.status,
            submittedAt: s.submitted_at,
            content: s.submission_content || '',
            fileUrl: s.file_url || '',
            fileName: s.file_name || '',
            score: grade?.points_awarded,
            grade: grade?.points_awarded,
            feedback: grade?.feedback || '',
            gradedAt: grade?.graded_at,
            maxPoints: asg?.max_points || 100,
          };
        });

        let result = formatted;
        if (user && user.role === 'student') {
          const ownName = (user.studentName || user.name || user.email.split('@')[0]).toLowerCase().trim();
          result = formatted.filter((sub) => sub.studentName.toLowerCase().trim() === ownName);
        } else if (filters?.studentName) {
          const target = filters.studentName.toLowerCase().trim();
          result = formatted.filter((sub) => sub.studentName.toLowerCase().trim() === target);
        }

        return {
          submissions: result,
          rubricScores,
          count: result.length,
        };
      }
    } catch (err) {
      logger.error('Error fetching submissions from relational table:', err);
    }

    return { submissions: [], rubricScores: {}, count: 0 };
  },

  /**
   * Records a student assignment submission in PostgreSQL submissions table.
   */
  async submitAssignment(submission: any, actorUserId?: string): Promise<{ status: string; submission: any }> {
    const supabase = getServerSupabase();
    const timestamp = new Date().toISOString();

    try {
      // Resolve student ID
      let studentId = submission.studentId;
      if (!studentId && submission.studentName) {
        const parts = submission.studentName.trim().split(' ');
        const { data: prof } = await supabase
          .from('profiles')
          .select('user_id, students(id)')
          .ilike('first_name', parts[0])
          .maybeSingle();
        if (prof?.students && prof.students[0]?.id) {
          studentId = prof.students[0].id;
        }
      }

      const submissionPayload = {
        id: submission.id || `SUB-${Date.now()}`,
        assignment_id: submission.assignmentId,
        student_id: studentId,
        status: submission.score !== undefined ? 'graded' : 'submitted',
        submitted_at: timestamp,
        submission_content: submission.content || '',
        file_url: submission.fileUrl || '',
        file_name: submission.fileName || '',
        updated_at: timestamp,
      };

      const { data: saved, error } = await supabase
        .from('submissions')
        .upsert(submissionPayload, { onConflict: 'id' })
        .select()
        .single();

      if (error) {
        logger.warn('Submission upsert warning:', error.message);
      }

      await logAuditEvent({
        actorUserId,
        entityType: 'submission',
        entityId: submissionPayload.id,
        action: 'create',
        newValues: {
          assignmentId: submission.assignmentId,
          studentName: submission.studentName,
          submittedAt: timestamp,
        },
      });

      return {
        status: 'submitted',
        submission: {
          ...submission,
          id: saved?.id || submissionPayload.id,
          submittedAt: timestamp,
        },
      };
    } catch (err: any) {
      logger.error('Error in submitAssignment relational service:', err);
      throw err;
    }
  },

  /**
   * Records instructor grading and feedback directly in relational grades table.
   */
  async gradeSubmission(
    data: { submissionId?: string; studentName?: string; score: number; feedback?: string; rubricScores?: any },
    actorUserId?: string
  ): Promise<{ status: string; score: number; feedback?: string }> {
    const supabase = getServerSupabase();
    const timestamp = new Date().toISOString();

    try {
      if (data.submissionId) {
        // 1. Upsert grade row
        const { error: gradeErr } = await supabase
          .from('grades')
          .upsert(
            {
              submission_id: data.submissionId,
              points_awarded: data.score,
              feedback: data.feedback || '',
              graded_at: timestamp,
              graded_by_user_id: actorUserId || null,
              updated_at: timestamp,
            },
            { onConflict: 'submission_id' }
          );

        if (gradeErr) {
          logger.warn('Grade upsert warning:', gradeErr.message);
        }

        // 2. Update submission status to graded
        await supabase
          .from('submissions')
          .update({ status: 'graded', updated_at: timestamp })
          .eq('id', data.submissionId);
      }

      await logAuditEvent({
        actorUserId,
        entityType: 'grade',
        entityId: data.submissionId || data.studentName || 'grade',
        action: 'grade_override',
        newValues: { score: data.score, feedback: data.feedback, rubricScores: data.rubricScores },
      });

      return {
        status: 'graded',
        score: data.score,
        feedback: data.feedback,
      };
    } catch (err: any) {
      logger.error('Error in gradeSubmission relational service:', err);
      throw err;
    }
  },
};
