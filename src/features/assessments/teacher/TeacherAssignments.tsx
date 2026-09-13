import React from 'react';
import { Plus, FileText, Calendar, Users, CheckCircle, Clock, Edit2 } from 'lucide-react';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { CustomAssignment, AssignmentSubmission } from '../../../types';

export interface TeacherAssignmentsProps {
  assignments: CustomAssignment[];
  submissions: AssignmentSubmission[];
  onCreateAssignment?: () => void;
  onSelectAssignment?: (assignment: CustomAssignment) => void;
  className?: string;
}

export const TeacherAssignments: React.FC<TeacherAssignmentsProps> = ({
  assignments = [],
  submissions = [],
  onCreateAssignment,
  onSelectAssignment,
  className = '',
}) => {
  const nonQuizAssignments = assignments.filter((a) => a.type !== 'quiz');

  return (
    <div className={`space-y-6 ${className}`}>
      <div className="flex items-center justify-between gap-4">
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-muted)] dark:text-slate-400">
            COURSEWORK & PAPERS
          </h3>
          <p className="text-xs text-[var(--color-text-muted)]">
            Manage essay prompts, research papers, and homework assignments.
          </p>
        </div>

        {onCreateAssignment && (
          <Button
            size="sm"
            variant="primary"
            onClick={onCreateAssignment}
            leftIcon={<Plus className="h-4 w-4" />}
          >
            Create Assignment
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {nonQuizAssignments.map((assignment) => {
          const subs = submissions.filter((s) => s.assignmentId === assignment.id);
          const gradedSubs = subs.filter((s) => s.score !== undefined);

          return (
            <Card
              key={assignment.id}
              className="flex flex-col justify-between space-y-4 hover:border-[var(--color-primary)]/40 transition-all shadow-xs"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Badge variant="primary" size="sm">
                    {assignment.moduleTrack || 'General Ministry'}
                  </Badge>
                  <span className="flex items-center gap-1 text-xs text-amber-700 dark:text-amber-400 font-semibold">
                    <Clock className="h-3 w-3" />
                    Due {assignment.dueDate || 'Sep 18'}
                  </span>
                </div>

                <h4 className="text-base font-bold text-[var(--color-text)] dark:text-slate-100 font-sans line-clamp-1">
                  {assignment.title}
                </h4>

                <p className="text-xs text-[var(--color-text-muted)] dark:text-slate-400 line-clamp-2">
                  {assignment.description || 'No detailed prompt provided.'}
                </p>

                <div className="grid grid-cols-2 gap-2 rounded-xl bg-slate-50 p-2.5 text-xs dark:bg-slate-800/50">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-[var(--color-text-muted)] block">
                      Submissions
                    </span>
                    <span className="font-bold text-[var(--color-text)] dark:text-slate-200">
                      {subs.length} received
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-[var(--color-text-muted)] block">
                      Graded
                    </span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">
                      {gradedSubs.length} of {subs.length}
                    </span>
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-[var(--color-border)]/60 dark:border-slate-800">
                <Button
                  variant="outline"
                  size="sm"
                  fullWidth
                  onClick={() => onSelectAssignment?.(assignment)}
                >
                  View Submissions
                </Button>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
};
