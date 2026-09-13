import React, { useState } from 'react';
import { CheckCircle2, FileText, User, Clock, ArrowRight, Save, MessageSquare } from 'lucide-react';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { MobileAssessmentCard } from '../shared/MobileAssessmentCard';
import { AssignmentSubmission, CustomAssignment } from '../../../types';

export interface SubmissionReviewProps {
  submissions: AssignmentSubmission[];
  assignments: CustomAssignment[];
  onGradeSubmission?: (submissionId: string, score: number, feedback: string) => void;
  className?: string;
}

export const SubmissionReview: React.FC<SubmissionReviewProps> = ({
  submissions = [],
  assignments = [],
  onGradeSubmission,
  className = '',
}) => {
  const [selectedSubmissionId, setSelectedSubmissionId] = useState<string | null>(null);
  const [scoreInput, setScoreInput] = useState<number>(85);
  const [feedbackInput, setFeedbackInput] = useState<string>('');

  const assignmentLookup = new Map<string, CustomAssignment>();
  assignments.forEach((a) => assignmentLookup.set(a.id, a));

  const pendingSubmissions = submissions.filter((s) => s.score === undefined);
  const reviewedSubmissions = submissions.filter((s) => s.score !== undefined);

  const activeSubmission = submissions.find((s) => s.id === selectedSubmissionId);
  const activeAssignment = activeSubmission ? assignmentLookup.get(activeSubmission.assignmentId) : null;

  const handleSaveGrade = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSubmissionId) return;
    onGradeSubmission?.(selectedSubmissionId, scoreInput, feedbackInput);
    setSelectedSubmissionId(null);
    setFeedbackInput('');
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Active Grading Drawer/Card */}
      {activeSubmission && (
        <Card variant="elevated" className="border-2 border-[var(--color-primary)]/40 p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-[var(--color-border)]/60 pb-3">
            <div>
              <h4 className="text-base font-bold text-[var(--color-text)] dark:text-slate-100">
                Grading: {activeSubmission.studentName}
              </h4>
              <p className="text-xs text-[var(--color-text-muted)]">
                {activeAssignment?.title || 'Coursework Submission'}
              </p>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setSelectedSubmissionId(null)}>
              Cancel
            </Button>
          </div>

          <div className="rounded-xl bg-slate-50 p-3 text-xs text-[var(--color-text)] dark:bg-slate-900/50 leading-relaxed max-h-40 overflow-y-auto">
            {activeSubmission.studentTypedResponse || activeSubmission.studentNotes || 'No text content provided.'}
          </div>

          <form onSubmit={handleSaveGrade} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[var(--color-text-muted)] mb-1">
                  Score (0–100%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={scoreInput}
                  onChange={(e) => setScoreInput(Number(e.target.value))}
                  className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-2.5 text-sm font-bold text-[var(--color-text)] focus:border-[var(--color-primary)] focus:outline-hidden dark:bg-slate-800"
                />
              </div>

              <div className="sm:col-span-3">
                <label className="block text-xs font-bold uppercase tracking-wider text-[var(--color-text-muted)] mb-1">
                  Faculty Feedback
                </label>
                <input
                  type="text"
                  placeholder="Commendations, doctrinal corrections, encouragement..."
                  value={feedbackInput}
                  onChange={(e) => setFeedbackInput(e.target.value)}
                  className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-2.5 text-sm text-[var(--color-text)] focus:border-[var(--color-primary)] focus:outline-hidden dark:bg-slate-800"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button
                variant="primary"
                size="sm"
                type="submit"
                leftIcon={<Save className="h-4 w-4" />}
              >
                Submit Score & Feedback
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Submissions List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-muted)] dark:text-slate-400">
            AWAITING REVIEW ({pendingSubmissions.length})
          </h3>
        </div>

        {/* Mobile View */}
        <div className="grid grid-cols-1 gap-3 sm:hidden">
          {pendingSubmissions.length === 0 ? (
            <Card className="text-center py-6 text-xs text-[var(--color-text-muted)]">
              No submissions currently awaiting grading.
            </Card>
          ) : (
            pendingSubmissions.map((sub) => {
              const assign = assignmentLookup.get(sub.assignmentId);
              return (
                <MobileAssessmentCard
                  key={sub.id}
                  studentName={sub.studentName}
                  courseTitle={assign?.moduleTrack || 'Pastoral Leadership'}
                  assignmentTitle={assign?.title}
                  submittedDate={new Date(sub.submittedAt).toLocaleDateString()}
                  status="pending"
                  actionLabel="Grade"
                  onView={() => {
                    setSelectedSubmissionId(sub.id);
                    setScoreInput(85);
                  }}
                />
              );
            })
          )}
        </div>

        {/* Desktop Table View */}
        <div className="hidden sm:block overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-xs dark:border-slate-800 dark:bg-slate-900/60">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-[var(--color-border)] bg-slate-50 text-xs font-bold uppercase tracking-wider text-[var(--color-text-muted)] dark:bg-slate-800/60 dark:border-slate-800">
              <tr>
                <th className="px-5 py-3.5">Student</th>
                <th className="px-5 py-3.5">Assignment</th>
                <th className="px-5 py-3.5">Submitted</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border)]/60 dark:divide-slate-800/60">
              {pendingSubmissions.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-8 text-center text-xs text-[var(--color-text-muted)]">
                    All submitted coursework has been graded.
                  </td>
                </tr>
              ) : (
                pendingSubmissions.map((sub) => {
                  const assign = assignmentLookup.get(sub.assignmentId);
                  return (
                    <tr
                      key={sub.id}
                      className="hover:bg-slate-50/80 transition-colors dark:hover:bg-slate-800/40"
                    >
                      <td className="px-5 py-4 font-bold text-[var(--color-text)] dark:text-slate-100">
                        {sub.studentName}
                      </td>
                      <td className="px-5 py-4">
                        <p className="font-semibold text-xs text-[var(--color-text)] dark:text-slate-200">
                          {assign?.title || 'Homework Assignment'}
                        </p>
                        <p className="text-[11px] text-[var(--color-text-muted)]">
                          {assign?.moduleTrack || 'General Ministry'}
                        </p>
                      </td>
                      <td className="px-5 py-4 text-xs text-[var(--color-text-muted)]">
                        {new Date(sub.submittedAt).toLocaleDateString()}
                      </td>
                      <td className="px-5 py-4">
                        <Badge variant="warning" size="sm">
                          Pending Review
                        </Badge>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <Button
                          size="sm"
                          variant="primary"
                          onClick={() => {
                            setSelectedSubmissionId(sub.id);
                            setScoreInput(85);
                          }}
                        >
                          Grade
                        </Button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
