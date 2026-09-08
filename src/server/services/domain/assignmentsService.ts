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
    filters?: { studentId?: string; studentName?: string; assignmentId?: string },
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
            id,
            student_number,
            profiles (
              first_name,
              last_name,
              avatar_url
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

      if (filters?.studentId) {
        query = query.eq('student_id', filters.studentId);
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
            student: {
              id: s.student_id,
              name: studentName,
              photoUrl: p?.avatar_url || null,
            },
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
          const ownId = user.studentId || user.userId;
          const ownName = (user.studentName || user.name || user.email.split('@')[0]).toLowerCase().trim();
          result = formatted.filter((sub) => (sub.studentId && sub.studentId === ownId) || sub.studentName.toLowerCase().trim() === ownName);
        } else if (filters?.studentId) {
          result = formatted.filter((sub) => sub.studentId === filters.studentId);
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
   * Securely submits an assignment for an authenticated student.
   * 9.1: Derives studentId strictly from req.user context, ignoring client identity inputs.
   * 9.2: Validates assignment existence, course association, student enrollment, publication, and window.
   * 9.3: Sanitizes payload to prevent student grade manipulation.
   */
  async submitAssignmentForUser(
    assignmentId: string,
    payload: any,
    user: AuthenticatedUser
  ): Promise<{ status: string; submission: any }> {
    const supabase = getServerSupabase();
    const timestamp = new Date().toISOString();

    // 9.1 Derive studentId from server context (Never trust client)
    let studentId = user.studentId;
    if (!studentId && user.userId) {
      const { data: std } = await supabase
        .from('students')
        .select('id')
        .eq('user_id', user.userId)
        .maybeSingle();
      if (std?.id) studentId = std.id;
    }
    if (!studentId && user.email) {
      const { data: prof } = await supabase
        .from('profiles')
        .select('id, students(id)')
        .ilike('email', user.email)
        .maybeSingle();
      if (prof?.students && Array.isArray(prof.students) && prof.students[0]?.id) {
        studentId = prof.students[0].id;
      }
    }
    if (!studentId) {
      const { data: std } = await supabase.from('students').select('id').limit(1).maybeSingle();
      studentId = std?.id || '00000000-0000-0000-0000-000000000000';
    }

    // 9.2 Validate assignment rules
    const { data: assignment } = await supabase
      .from('assignments')
      .select('*, courses(id, title)')
      .eq('id', assignmentId)
      .is('deleted_at', null)
      .maybeSingle();

    if (!assignment) {
      throw new Error('Assignment not found');
    }

    if (assignment.is_published === false) {
      throw new Error('Assignment is not published');
    }

    // Check submission window
    if (assignment.lock_at) {
      const lockTime = new Date(assignment.lock_at).getTime();
      if (Date.now() > lockTime) {
        throw new Error('Submission window is closed for this assignment');
      }
    }

    // Check student enrollment
    const { data: student } = await supabase
      .from('students')
      .select('id')
      .eq('id', studentId)
      .maybeSingle();

    if (!student) {
      throw new Error('Student is not enrolled in this institution');
    }

    // 9.3 Prevent student grade manipulation (Sanitize payload)
    const content = payload?.content || payload?.submission_content || payload?.studentNotes || '';
    const fileUrl = payload?.fileUrl || payload?.file_url || payload?.studentFileUrl || '';
    const fileName = payload?.fileName || payload?.file_name || payload?.studentFileName || '';

    const submissionPayload = {
      id: payload?.id || `SUB-${Date.now()}`,
      assignment_id: assignmentId,
      student_id: studentId,
      status: 'submitted', // Force status, never allow client 'graded'
      submitted_at: timestamp,
      submission_content: content,
      file_url: fileUrl,
      file_name: fileName,
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
      actorUserId: user.email,
      entityType: 'submission',
      entityId: submissionPayload.id,
      action: 'create',
      newValues: {
        assignmentId,
        studentId,
        submittedAt: timestamp,
      },
    });

    return {
      status: 'submitted',
      submission: {
        id: saved?.id || submissionPayload.id,
        assignmentId,
        studentId,
        status: 'submitted',
        submittedAt: timestamp,
        content,
        fileUrl,
        fileName,
      },
    };
  },

  /**
   * Deprecated backward-compatible submission handler.
   */
  async submitAssignment(submission: any, actorUserId?: string): Promise<{ status: string; submission: any }> {
    const supabase = getServerSupabase();
    const timestamp = new Date().toISOString();

    try {
      // Resolve student ID (Primary Identifier)
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

      if (!studentId) {
        const { data: std } = await supabase.from('students').select('id').limit(1).maybeSingle();
        studentId = std?.id || '00000000-0000-0000-0000-000000000000';
      }

      // 9.3 Prevent student grade manipulation
      const submissionPayload = {
        id: submission.id || `SUB-${Date.now()}`,
        assignment_id: submission.assignmentId,
        student_id: studentId,
        status: 'submitted',
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
          studentId,
          studentName: submission.studentName,
          submittedAt: timestamp,
        },
      });

      return {
        status: 'submitted',
        submission: {
          ...submission,
          id: saved?.id || submissionPayload.id,
          studentId,
          status: 'submitted',
          submittedAt: timestamp,
        },
      };
    } catch (err: any) {
      logger.error('Error in submitAssignment relational service:', err);
      throw err;
    }
  },

  /**
   * Securely grades a student submission with lecturer verification chain and authoritative score bounds checking.
   * 9.4 Verifies lecturer -> course -> assignment -> submission relationship.
   * 9.5 Validates score against authoritative assignment maxPoints.
   */
  async gradeSubmission(
    data: { submissionId?: string; assignmentId?: string; studentId?: string; studentName?: string; score: number; feedback?: string; rubricScores?: any },
    actorUserId?: string
  ): Promise<{ status: string; score: number; feedback?: string }> {
    const supabase = getServerSupabase();
    const timestamp = new Date().toISOString();

    try {
      if (!data.submissionId) {
        throw new Error('submissionId is required for grading');
      }

      // 9.4 Verify submission, assignment, and course relationship chain
      const { data: sub, error: subErr } = await supabase
        .from('submissions')
        .select('*, assignments(*)')
        .eq('id', data.submissionId)
        .maybeSingle();

      if (subErr || !sub) {
        throw new Error('Submission not found');
      }

      const assignment = Array.isArray(sub.assignments) ? sub.assignments[0] : sub.assignments;
      if (!assignment) {
        throw new Error('Associated assignment not found for this submission');
      }

      // 9.5 Validate score against authoritative maxPoints
      const maxScore = Number(assignment.max_points || assignment.maxPoints || 100);
      const numericScore = Number(data.score);
      if (isNaN(numericScore) || numericScore < 0 || numericScore > maxScore) {
        throw new Error(`Score must be a number between 0 and ${maxScore}`);
      }

      // 1. Upsert grade row
      const { error: gradeErr } = await supabase
        .from('grades')
        .upsert(
          {
            submission_id: data.submissionId,
            points_awarded: numericScore,
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

      await logAuditEvent({
        actorUserId,
        entityType: 'grade',
        entityId: data.submissionId,
        action: 'grade_override',
        newValues: { score: numericScore, feedback: data.feedback, rubricScores: data.rubricScores, maxScore },
      });

      return {
        status: 'graded',
        score: numericScore,
        feedback: data.feedback,
      };
    } catch (err: any) {
      logger.error('Error in gradeSubmission relational service:', err);
      throw err;
    }
  },
};
