import React from 'react';
import { 
  BarChart2, 
  FileSpreadsheet, 
  AlertTriangle, 
  TrendingUp, 
  Users, 
  Check, 
  Award 
} from 'lucide-react';
import { QuizAssignment, QuizSubmission } from '../../../types';
import { exportQuizSubmissionsCsv } from '../../../data/quizTemplates';

export interface QuizAnalyticsProps {
  quizzes: QuizAssignment[];
  submissions: QuizSubmission[];
  selectedQuizId: string;
  onSelectQuiz: (quizId: string) => void;
}

export const QuizAnalytics: React.FC<QuizAnalyticsProps> = ({
  quizzes,
  submissions,
  selectedQuizId,
  onSelectQuiz
}) => {
  const activeQuiz = quizzes.find(q => q.id === selectedQuizId) || quizzes[0];
  const activeSubmissions = activeQuiz 
    ? submissions.filter(s => s.quizId === activeQuiz.id || (s as any).assignmentId === activeQuiz.id)
    : [];

  const totalResponses = activeSubmissions.length;
  const avgScore = totalResponses > 0 
    ? Math.round(activeSubmissions.reduce((sum, s) => sum + s.percentage, 0) / totalResponses)
    : 0;
  const highestScore = totalResponses > 0 
    ? Math.max(...activeSubmissions.map(s => s.percentage))
    : 0;
  const lowestScore = totalResponses > 0 
    ? Math.min(...activeSubmissions.map(s => s.percentage))
    : 0;
  const passRate = totalResponses > 0
    ? Math.round((activeSubmissions.filter(s => s.percentage >= (activeQuiz?.settings?.passingScorePercentage || 75)).length / totalResponses) * 100)
    : 0;

  // Frequently missed questions analysis
  const itemAnalysis = (activeQuiz?.questions || []).map((q, idx) => {
    if (totalResponses === 0) return { q, index: idx + 1, correctCount: 0, totalCount: 0, percentCorrect: 0 };
    let correctCount = 0;
    activeSubmissions.forEach(sub => {
      const resp = sub.responses?.find(r => r.questionId === q.id);
      if (resp?.isCorrect) correctCount++;
    });
    const percentCorrect = Math.round((correctCount / totalResponses) * 100);
    return { q, index: idx + 1, correctCount, totalCount: totalResponses, percentCorrect };
  });

  const frequentlyMissed = itemAnalysis.filter(m => m.totalCount > 0 && m.percentCorrect < 65);

  const handleExportCsv = () => {
    if (!activeQuiz) return;
    const csvContent = exportQuizSubmissionsCsv(activeQuiz, activeSubmissions);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `HTEIM_Quiz_${activeQuiz.courseCode || 'Course'}_${activeQuiz.title.replace(/\s+/g, '_')}_Analytics.csv`;
    link.click();
  };

  if (!activeQuiz) {
    return (
      <div className="p-8 text-center text-slate-500 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700">
        No quiz selected for analytics.
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      
      {/* Quiz Selector Bar */}
      <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs font-black uppercase tracking-wider text-slate-500 shrink-0">
            Select Quiz:
          </span>
          <select
            value={selectedQuizId}
            onChange={(e) => onSelectQuiz(e.target.value)}
            className="w-full sm:w-80 px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-xs font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500 outline-none"
          >
            {quizzes.map(q => (
              <option key={q.id} value={q.id}>{q.courseCode || 'MIN'}: {q.title}</option>
            ))}
          </select>
        </div>

        <button
          onClick={handleExportCsv}
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl flex items-center gap-2 transition-colors cursor-pointer"
        >
          <FileSpreadsheet className="w-3.5 h-3.5" />
          <span>Export Analytics CSV</span>
        </button>
      </div>

      {/* Cohort Summary Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xs">
          <span className="text-[10px] font-extrabold uppercase text-slate-500">Total Responses</span>
          <div className="text-2xl font-black text-slate-900 dark:text-white font-mono mt-1">{totalResponses}</div>
          <span className="text-[10px] text-slate-400">Submissions</span>
        </div>

        <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xs">
          <span className="text-[10px] font-extrabold uppercase text-slate-500">Average Score</span>
          <div className="text-2xl font-black text-purple-600 dark:text-purple-400 font-mono mt-1">{avgScore}%</div>
          <span className="text-[10px] text-slate-400">Cohort mean</span>
        </div>

        <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xs">
          <span className="text-[10px] font-extrabold uppercase text-slate-500">Pass Rate (&gt;=75%)</span>
          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono mt-1">{passRate}%</div>
          <span className="text-[10px] text-slate-400">Met standard</span>
        </div>

        <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xs">
          <span className="text-[10px] font-extrabold uppercase text-slate-500">Score Range</span>
          <div className="text-xl font-black text-slate-900 dark:text-white font-mono mt-1">{lowestScore}% - {highestScore}%</div>
          <span className="text-[10px] text-slate-400">Min to Max</span>
        </div>
      </div>

      {/* Frequently Missed Questions */}
      {frequentlyMissed.length > 0 && (
        <div className="bg-amber-50 dark:bg-amber-950/40 p-4 rounded-2xl border border-amber-300 dark:border-amber-800/80 space-y-3">
          <div className="flex items-center gap-2 text-amber-900 dark:text-amber-100">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <h4 className="text-xs font-black uppercase tracking-wider">
              Frequently Missed Questions ({frequentlyMissed.length} items &lt; 65% correct)
            </h4>
          </div>

          <div className="space-y-2">
            {frequentlyMissed.map(item => (
              <div key={item.q.id} className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-amber-200 dark:border-amber-800 flex items-center justify-between gap-3 text-xs">
                <div>
                  <span className="font-bold text-amber-700 dark:text-amber-400">Question #{item.index}:</span>{' '}
                  <span className="text-slate-800 dark:text-slate-200">{item.q.questionText}</span>
                </div>
                <span className="px-2 py-0.5 bg-rose-100 dark:bg-rose-900/60 text-rose-800 dark:text-rose-200 font-black font-mono rounded-md shrink-0">
                  {item.percentCorrect}% correct
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Item-by-Item Analysis */}
      <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-4 shadow-xs">
        <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
          <BarChart2 className="w-4 h-4 text-purple-600" />
          <span>Question-by-Question Response Analysis</span>
        </h3>

        <div className="space-y-4">
          {itemAnalysis.map(item => (
            <div key={item.q.id} className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/40 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-black text-purple-700 dark:text-purple-300">
                  Q{item.index}: {item.q.questionText}
                </span>
                <span className="font-mono font-bold text-slate-600 dark:text-slate-400">
                  {item.correctCount}/{item.totalCount} correct ({item.percentCorrect}%)
                </span>
              </div>

              <div className="w-full h-2.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${item.percentCorrect >= 75 ? 'bg-emerald-500' : item.percentCorrect >= 50 ? 'bg-amber-500' : 'bg-rose-500'}`}
                  style={{ width: `${item.percentCorrect}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};
