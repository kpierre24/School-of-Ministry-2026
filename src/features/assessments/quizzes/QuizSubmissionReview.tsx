import React, { useState } from 'react';
import { X, CheckCircle2, AlertCircle, Save, MessageSquare } from 'lucide-react';
import { QuizSubmission } from '../../../types';

export interface QuizSubmissionReviewProps {
  submission: QuizSubmission;
  onClose: () => void;
  onSaveFeedback?: (submissionId: string, feedback: string, manualScoreOverride?: number) => void;
}

export const QuizSubmissionReview: React.FC<QuizSubmissionReviewProps> = ({
  submission,
  onClose,
  onSaveFeedback
}) => {
  const [feedbackText, setFeedbackText] = useState(submission.teacherFeedback || '');
  const [scoreOverride, setScoreOverride] = useState<number>(submission.score);
  const [isSaved, setIsSaved] = useState(false);

  const handleSave = () => {
    if (onSaveFeedback) {
      onSaveFeedback(submission.id, feedbackText, scoreOverride);
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-60 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden shadow-2xl">
        
        {/* Header */}
        <div className="p-4 bg-purple-900 text-white flex items-center justify-between">
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-purple-300">
              Student Submission & Grading Review
            </span>
            <h3 className="text-base font-black">{submission.studentName}</h3>
            <p className="text-xs text-purple-200">{submission.quizTitle || submission.quizId}</p>
          </div>
          <button 
            onClick={onClose} 
            className="p-1 text-white hover:opacity-80 transition-opacity cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto space-y-4">
          
          {/* Metrics Card */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700 gap-3">
            <div>
              <span className="text-xs font-bold text-slate-500">Submitted At:</span>
              <p className="text-xs font-mono font-bold text-slate-800 dark:text-slate-200">{submission.submittedAt}</p>
            </div>

            <div className="flex items-center gap-3">
              <div className="text-right">
                <span className="text-[10px] font-extrabold uppercase text-slate-400">Calculated Score</span>
                <div className="text-lg font-black font-mono text-purple-600 dark:text-purple-400">
                  {submission.score} / {submission.totalPossible} ({submission.percentage}%)
                </div>
              </div>
            </div>
          </div>

          {/* Teacher Feedback & Manual Score Override */}
          <div className="p-4 bg-purple-50/50 dark:bg-purple-950/30 rounded-xl border border-purple-200 dark:border-purple-800/60 space-y-3">
            <h4 className="text-xs font-black uppercase text-purple-900 dark:text-purple-200 flex items-center gap-1.5">
              <MessageSquare className="w-4 h-4 text-purple-600" />
              <span>Instructor Evaluation & Grade Adjustment</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-extrabold uppercase text-slate-500 mb-1">
                  Adjusted Score (Max {submission.totalPossible})
                </label>
                <input
                  type="number"
                  max={submission.totalPossible}
                  min={0}
                  value={scoreOverride}
                  onChange={(e) => setScoreOverride(Number(e.target.value))}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-xs font-mono font-bold"
                />
              </div>

              <div>
                <label className="block text-[10px] font-extrabold uppercase text-slate-500 mb-1">
                  Teacher Feedback Notes
                </label>
                <input
                  type="text"
                  value={feedbackText}
                  onChange={(e) => setFeedbackText(e.target.value)}
                  placeholder="Provide encouragement or essay grading notes..."
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-xs font-medium"
                />
              </div>
            </div>

            {onSaveFeedback && (
              <div className="flex items-center justify-end gap-2 pt-1">
                {isSaved && <span className="text-xs font-bold text-emerald-600">Grade updated!</span>}
                <button
                  onClick={handleSave}
                  className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Save Evaluation</span>
                </button>
              </div>
            )}
          </div>

          {/* Question Responses Breakdown */}
          <div className="space-y-3">
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-500">Itemized Responses</h4>
            {submission.responses.map((resp, i) => (
              <div 
                key={resp.questionId || i} 
                className={`p-3.5 rounded-xl border text-xs space-y-1.5 ${
                  resp.isCorrect 
                    ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/60' 
                    : 'bg-rose-50/50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-800/60'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800 dark:text-slate-200">Question #{i + 1}</span>
                  <span className={`font-mono font-bold ${resp.isCorrect ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-700 dark:text-rose-400'}`}>
                    {resp.pointsEarned} pts {resp.isCorrect ? '(Correct)' : '(Incorrect)'}
                  </span>
                </div>

                {resp.textAnswer && (
                  <p className="font-mono bg-white dark:bg-slate-900 p-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200">
                    "{resp.textAnswer}"
                  </p>
                )}

                {resp.selectedOptionId && (
                  <p className="font-mono text-slate-600 dark:text-slate-400">
                    Selected Option: <span className="font-bold">{resp.selectedOptionId}</span>
                  </p>
                )}
              </div>
            ))}
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-100 dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl transition-colors cursor-pointer"
          >
            Close Sheet
          </button>
        </div>

      </div>
    </div>
  );
};
