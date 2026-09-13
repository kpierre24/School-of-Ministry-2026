import React, { useState } from 'react';
import { Award, User, Shield, GraduationCap, Eye } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { StudentAssessmentWorkspace } from './student/StudentAssessmentWorkspace';
import { TeacherAssessmentWorkspace } from './teacher/TeacherAssessmentWorkspace';
import { AdminAssessmentWorkspace } from './admin/AdminAssessmentWorkspace';
import { AppUser } from '../../lib/userAuth';
import { CustomAssignment, AssignmentSubmission, StudentSummary } from '../../types';

export interface AssessmentsPageProps {
  appUser: AppUser | null;
  students: StudentSummary[];
  assignments: CustomAssignment[];
  submissions: AssignmentSubmission[];
  onCreateAssignment?: () => void;
  onCreateQuiz?: () => void;
  onTakeQuiz?: (quiz: CustomAssignment) => void;
  onGradeSubmission?: (submissionId: string, score: number, feedback: string) => void;
  onSyncGoogleSheets?: () => void;
  className?: string;
}

export const AssessmentsPage: React.FC<AssessmentsPageProps> = ({
  appUser,
  students = [],
  assignments = [],
  submissions = [],
  onCreateAssignment,
  onCreateQuiz,
  onTakeQuiz,
  onGradeSubmission,
  onSyncGoogleSheets,
  className = '',
}) => {
  // Role override for admin testing
  const [roleOverride, setRoleOverride] = useState<'auto' | 'student' | 'teacher' | 'admin'>('auto');

  const resolvedRole = (() => {
    if (roleOverride !== 'auto') return roleOverride;
    if (!appUser) return 'student';
    if (appUser.role === 'admin' || appUser.role === 'super_admin' || appUser.role === 'registrar') {
      return 'admin';
    }
    if (appUser.role === 'teacher' || appUser.role === 'lecturer') {
      return 'teacher';
    }
    return 'student';
  })();

  const studentName = appUser?.studentName || appUser?.name || 'Hannah Abbott';
  const isAdmin = appUser?.role === 'admin' || appUser?.role === 'super_admin';

  return (
    <div className={`space-y-6 pb-24 ${className}`} id="assessments-hub-container">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--color-border)]/60 pb-5 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--color-primary)]/10 px-2.5 py-0.5 text-xs font-bold text-[var(--color-primary)] dark:text-sky-300">
              <GraduationCap className="h-3.5 w-3.5" />
              School of Ministry Academic Portal
            </span>
            <span className="text-xs text-[var(--color-text-muted)]">•</span>
            <span className="text-xs font-semibold text-[var(--color-text-muted)]">
              Class of 2026
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black text-[var(--color-text)] dark:text-slate-100 font-sans">
            Examinations & Assessments
          </h1>
          <p className="text-xs sm:text-sm text-[var(--color-text-muted)] dark:text-slate-400 mt-0.5">
            {resolvedRole === 'student'
              ? 'View coursework assignments, test module mastery via online quizzes, and view official transcripts.'
              : resolvedRole === 'teacher'
              ? 'Manage faculty coursework, review submissions, grade exams, and monitor cohort progress.'
              : 'Institutional assessment oversight, bulk spreadsheet synchronization, and registrar accreditation reports.'}
          </p>
        </div>

        {/* Admin Perspective Preview Switcher */}
        {isAdmin && (
          <div className="flex items-center gap-2 self-start sm:self-auto rounded-xl bg-slate-100 p-1.5 dark:bg-slate-800">
            <Eye className="h-3.5 w-3.5 text-slate-500 ml-1" />
            <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400">Preview:</span>
            {(['auto', 'student', 'teacher', 'admin'] as const).map((r) => (
              <button
                key={r}
                onClick={() => setRoleOverride(r)}
                className={`px-2 py-0.5 text-xs font-bold capitalize rounded-lg transition-all cursor-pointer ${
                  roleOverride === r
                    ? 'bg-white text-[var(--color-primary)] shadow-xs dark:bg-slate-700 dark:text-sky-300'
                    : 'text-slate-500 hover:text-slate-900 dark:text-slate-400'
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Role View Render */}
      {resolvedRole === 'student' && (
        <StudentAssessmentWorkspace
          assignments={assignments}
          submissions={submissions}
          studentName={studentName}
          onTakeQuiz={onTakeQuiz}
        />
      )}

      {resolvedRole === 'teacher' && (
        <TeacherAssessmentWorkspace
          assignments={assignments}
          submissions={submissions}
          students={students}
          onCreateAssignment={onCreateAssignment}
          onCreateQuiz={onCreateQuiz}
          onGradeSubmission={onGradeSubmission}
        />
      )}

      {resolvedRole === 'admin' && (
        <AdminAssessmentWorkspace
          assignments={assignments}
          submissions={submissions}
          students={students}
          onCreateAssignment={onCreateAssignment}
          onCreateQuiz={onCreateQuiz}
          onSyncGoogleSheets={onSyncGoogleSheets}
        />
      )}
    </div>
  );
};
