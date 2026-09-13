import React, { Suspense, useState } from 'react';
import { AssessmentsPage } from '../features/assessments';
import { LazyExamsTab } from '../components/tabs';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { DashboardSkeleton } from '../components/DashboardSkeleton';
import { INITIAL_ASSIGNMENTS, INITIAL_SUBMISSIONS } from '../components/ExamsTab';
import { Button } from '../components/ui/Button';
import { Table, Sparkles } from 'lucide-react';

export interface ExamsPageProps {
  [key: string]: any;
}

export const ExamsPage: React.FC<ExamsPageProps> = (props) => {
  const [viewMode, setViewMode] = useState<'modern' | 'legacy'>('modern');

  const appUser = props.appUser || (props.userRole ? {
    id: 'user_active',
    name: props.currentStudentName || 'Hannah Abbott',
    email: 'student@hteim.org',
    role: props.userRole,
    studentName: props.currentStudentName || 'Hannah Abbott',
  } : null);

  const assignments = props.customAssignments && props.customAssignments.length > 0
    ? props.customAssignments
    : INITIAL_ASSIGNMENTS;

  const submissions = props.submissions && props.submissions.length > 0
    ? props.submissions
    : INITIAL_SUBMISSIONS;

  const students = props.students || [];

  const handleGradeSubmission = (submissionId: string, score: number, feedback: string) => {
    if (props.setSubmissions) {
      props.setSubmissions((prev: any[]) =>
        prev.map((sub) =>
          sub.id === submissionId
            ? {
                ...sub,
                score,
                teacherFeedback: feedback,
                status: 'Graded',
                updatedAt: new Date().toISOString(),
              }
            : sub
        )
      );
    }
  };

  const handleSyncSheets = () => {
    if (props.onLoadSheets) {
      props.onLoadSheets();
    }
  };

  const isFacultyOrAdmin = appUser?.role === 'teacher' || appUser?.role === 'admin' || appUser?.role === 'super_admin';

  return (
    <Suspense fallback={<DashboardSkeleton label="Loading Examinations & Assessment Hub..." />}>
      <ErrorBoundary label="Exams & Grading Workspace">
        {viewMode === 'modern' ? (
          <div>
            {isFacultyOrAdmin && (
              <div className="flex justify-end mb-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setViewMode('legacy')}
                  leftIcon={<Table className="h-3.5 w-3.5" />}
                  className="text-xs text-[var(--color-text-muted)]"
                >
                  Switch to Matrix Spreadsheet View
                </Button>
              </div>
            )}
            <AssessmentsPage
              appUser={appUser}
              students={students}
              assignments={assignments}
              submissions={submissions}
              onGradeSubmission={handleGradeSubmission}
              onSyncGoogleSheets={handleSyncSheets}
            />
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-xl bg-sky-50 border border-sky-200 dark:bg-sky-950/30 dark:border-sky-800">
              <span className="text-xs font-semibold text-sky-900 dark:text-sky-200">
                Viewing Legacy Spreadsheet & Moderation Matrix
              </span>
              <Button
                variant="primary"
                size="sm"
                onClick={() => setViewMode('modern')}
                leftIcon={<Sparkles className="h-3.5 w-3.5" />}
              >
                Return to Modern Hub
              </Button>
            </div>
            <LazyExamsTab {...(props as any)} />
          </div>
        )}
      </ErrorBoundary>
    </Suspense>
  );
};

export default ExamsPage;
