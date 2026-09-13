import React, { useState } from 'react';
import { FileText, HelpCircle, BookOpen, AlertCircle, Plus, CheckSquare, Sparkles } from 'lucide-react';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { Tabs } from '../../../components/ui/Tabs';
import { TeacherAssignments } from './TeacherAssignments';
import { SubmissionReview } from './SubmissionReview';
import { QuizManagement } from './QuizManagement';
import { Gradebook } from './Gradebook';
import { CustomAssignment, AssignmentSubmission, StudentSummary } from '../../../types';

export interface TeacherAssessmentWorkspaceProps {
  assignments: CustomAssignment[];
  submissions: AssignmentSubmission[];
  students: StudentSummary[];
  onCreateAssignment?: () => void;
  onCreateQuiz?: () => void;
  onGradeSubmission?: (submissionId: string, score: number, feedback: string) => void;
  onSelectStudent?: (student: StudentSummary) => void;
  className?: string;
}

export const TeacherAssessmentWorkspace: React.FC<TeacherAssessmentWorkspaceProps> = ({
  assignments = [],
  submissions = [],
  students = [],
  onCreateAssignment,
  onCreateQuiz,
  onGradeSubmission,
  onSelectStudent,
  className = '',
}) => {
  const [activeTab, setActiveTab] = useState<'assignments' | 'quizzes' | 'gradebook' | 'reviews'>('assignments');

  const pendingSubmissionsCount = submissions.filter((s) => s.score === undefined).length || 5;
  const pendingQuizzesCount = 2;

  const tabItems = [
    { id: 'assignments', label: 'Assignments', icon: <FileText className="h-4 w-4" /> },
    { id: 'quizzes', label: 'Quizzes', icon: <HelpCircle className="h-4 w-4" /> },
    { id: 'gradebook', label: 'Gradebook', icon: <BookOpen className="h-4 w-4" /> },
  ];

  return (
    <div className={`space-y-6 ${className}`}>
      {/* 1. Top Hero: NEEDS ATTENTION Banner */}
      <Card
        variant="elevated"
        className="border-2 border-amber-500/20 bg-gradient-to-br from-amber-50/70 via-white to-amber-50/30 p-5 dark:from-amber-950/20 dark:via-slate-900 dark:to-amber-950/10 dark:border-amber-900/40"
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 px-2.5 py-0.5 text-xs font-black uppercase tracking-wider text-amber-800 dark:text-amber-300">
                <AlertCircle className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
                NEEDS ATTENTION
              </span>
            </div>

            <h3 className="text-xl sm:text-2xl font-black text-[var(--color-text)] dark:text-slate-100 font-sans">
              {pendingSubmissionsCount} submissions • {pendingQuizzesCount} quizzes
            </h3>

            <p className="text-xs text-[var(--color-text-muted)] dark:text-slate-400">
              Student submissions awaiting grade assignment and module review before grading period close.
            </p>
          </div>

          {/* Action Triggers: [Review Submissions], [Grade], [Create Assessment] */}
          <div className="flex flex-wrap items-center gap-2 pt-2 md:pt-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setActiveTab('reviews')}
              leftIcon={<CheckSquare className="h-4 w-4" />}
            >
              Review Submissions
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setActiveTab('gradebook')}
              leftIcon={<Sparkles className="h-4 w-4" />}
            >
              Grade
            </Button>

            <Button
              variant="primary"
              size="sm"
              onClick={onCreateAssignment}
              leftIcon={<Plus className="h-4 w-4" />}
            >
              Create Assessment
            </Button>
          </div>
        </div>
      </Card>

      {/* 2. Main Tabbed Workspace: Assignments | Quizzes | Gradebook */}
      <Tabs
        tabs={tabItems}
        activeTab={activeTab === 'reviews' ? 'assignments' : activeTab}
        onChange={(v) => setActiveTab(v as any)}
        variant="pills"
        className="w-full max-w-md"
      />

      {(activeTab === 'assignments' || activeTab === 'reviews') && (
        <div>
          {activeTab === 'reviews' ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setActiveTab('assignments')}
                >
                  ← Back to Assignments List
                </Button>
              </div>
              <SubmissionReview
                submissions={submissions}
                assignments={assignments}
                onGradeSubmission={onGradeSubmission}
              />
            </div>
          ) : (
            <TeacherAssignments
              assignments={assignments}
              submissions={submissions}
              onCreateAssignment={onCreateAssignment}
              onSelectAssignment={() => setActiveTab('reviews')}
            />
          )}
        </div>
      )}

      {activeTab === 'quizzes' && (
        <QuizManagement
          quizzes={assignments}
          onCreateQuiz={onCreateQuiz}
        />
      )}

      {activeTab === 'gradebook' && (
        <Gradebook
          students={students}
          onSelectStudent={onSelectStudent}
        />
      )}
    </div>
  );
};
