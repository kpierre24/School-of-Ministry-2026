import React, { useState } from 'react';
import { 
  ShieldAlert, 
  ShieldCheck, 
  Plus, 
  Search, 
  Edit3, 
  Trash2, 
  Copy, 
  Share2, 
  FileText, 
  Award, 
  Clock, 
  Sparkles, 
  CheckCircle2, 
  FileSpreadsheet, 
  ChevronRight, 
  LayoutGrid, 
  List, 
  Bookmark, 
  AlertTriangle, 
  Download, 
  Eye, 
  RefreshCw,
  X,
  HelpCircle,
  BarChart2,
  Calendar,
  Users,
  Check,
  TrendingUp,
  Sliders,
  Send,
  Filter,
  CheckSquare,
  MessageSquare
} from 'lucide-react';
import { UserRole } from '../lib/userAuth';
import { QuizAssignment, QuizSubmission } from '../types';
import { QuizCreatorModal } from './QuizCreatorModal';
import { QuizTakerView } from './QuizTakerView';
import { logActivity } from '../lib/auditLogger';
import { exportQuizSubmissionsCsv, DEFAULT_QUIZ_TEMPLATES } from '../data/quizTemplates';

export interface AdminQuizzesDashboardProps {
  userRole: UserRole;
  quizzes: QuizAssignment[];
  submissions?: QuizSubmission[];
  onSaveQuiz: (quiz: QuizAssignment) => void;
  onDeleteQuiz: (quizId: string) => void;
  onDuplicateQuiz?: (quiz: QuizAssignment) => void;
  onTakeQuiz?: (quiz: QuizAssignment) => void;
  onSwitchRoleToTeacher?: () => void;
}

export const AdminQuizzesDashboard: React.FC<AdminQuizzesDashboardProps> = ({
  userRole,
  quizzes,
  submissions = [],
  onSaveQuiz,
  onDeleteQuiz,
  onDuplicateQuiz,
  onTakeQuiz,
  onSwitchRoleToTeacher
}) => {
  // Top Level Navigation in Admin Quizzes
  const [activeTab, setActiveTab] = useState<'all_quizzes' | 'analytics' | 'individual'>('all_quizzes');

  // Filters & State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCourseFilter, setSelectedCourseFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [copiedToast, setCopiedToast] = useState<string | null>(null);

  // Selected Quiz for Analytics / Grading
  const [selectedAnalyticsQuizId, setSelectedAnalyticsQuizId] = useState<string>(quizzes[0]?.id || '');
  const [selectedSubmissionForReview, setSelectedSubmissionForReview] = useState<QuizSubmission | null>(null);

  // Modals inside Dashboard
  const [showCreatorModal, setShowCreatorModal] = useState(false);
  const [quizToEdit, setQuizToEdit] = useState<QuizAssignment | null>(null);
  const [quizToDelete, setQuizToDelete] = useState<QuizAssignment | null>(null);
  const [previewQuiz, setPreviewQuiz] = useState<QuizAssignment | null>(null);

  const isTeacherOrAdmin = userRole === 'admin' || userRole === 'teacher';

  if (!isTeacherOrAdmin) {
    return (
      <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-2xl p-6 text-center space-y-3">
        <ShieldAlert className="w-10 h-10 text-amber-600 mx-auto" />
        <h3 className="text-base font-black text-amber-900 dark:text-amber-100">Faculty Privileges Required</h3>
        <p className="text-xs text-amber-700 dark:text-amber-300 max-w-md mx-auto">
          The Quiz Administration & Analytics Dashboard is reserved for HTEIM faculty and course directors.
        </p>
        {onSwitchRoleToTeacher && (
          <button
            onClick={onSwitchRoleToTeacher}
            className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl transition-colors cursor-pointer"
          >
            Switch to Teacher Mode
          </button>
        )}
      </div>
    );
  }

  // Filter quizzes
  const filteredQuizzes = quizzes.filter(q => {
    const matchesSearch = (q.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (q.courseCode || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (q.description || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCourse = selectedCourseFilter === 'all' || q.courseCode === selectedCourseFilter;
    return matchesSearch && matchesCourse;
  });

  // Unique course codes for filter
  const courseCodes = Array.from(new Set(quizzes.map(q => q.courseCode || 'MIN-101')));

  // Selected quiz for analytics calculation
  const activeAnalyticsQuiz = quizzes.find(q => q.id === selectedAnalyticsQuizId) || quizzes[0];
  const activeQuizSubmissions = activeAnalyticsQuiz 
    ? submissions.filter(s => s.quizId === activeAnalyticsQuiz.id || (s as any).assignmentId === activeAnalyticsQuiz.id)
    : [];

  // Compute analytics metrics
  const totalResponses = activeQuizSubmissions.length;
  const avgScore = totalResponses > 0 
    ? Math.round(activeQuizSubmissions.reduce((sum, s) => sum + s.percentage, 0) / totalResponses)
    : 0;
  const highestScore = totalResponses > 0 
    ? Math.max(...activeQuizSubmissions.map(s => s.percentage))
    : 0;
  const lowestScore = totalResponses > 0 
    ? Math.min(...activeQuizSubmissions.map(s => s.percentage))
    : 0;
  const passRate = totalResponses > 0
    ? Math.round((activeQuizSubmissions.filter(s => s.percentage >= (activeAnalyticsQuiz?.settings?.passingScorePercentage || 75)).length / totalResponses) * 100)
    : 0;

  // Frequently missed questions analysis
  const missedQuestionsAnalysis = (activeAnalyticsQuiz?.questions || []).map((q, idx) => {
    if (totalResponses === 0) return { q, index: idx + 1, correctCount: 0, totalCount: 0, percentCorrect: 0 };
    let correctCount = 0;
    activeQuizSubmissions.forEach(sub => {
      const resp = sub.responses?.find(r => r.questionId === q.id);
      if (resp?.isCorrect) correctCount++;
    });
    const percentCorrect = Math.round((correctCount / totalResponses) * 100);
    return { q, index: idx + 1, correctCount, totalCount: totalResponses, percentCorrect };
  });

  const frequentlyMissed = missedQuestionsAnalysis.filter(m => m.totalCount > 0 && m.percentCorrect < 65);

  const handleCopyLink = (shareCode: string) => {
    const url = `${window.location.origin}${window.location.pathname}#quiz/${shareCode}`;
    navigator.clipboard.writeText(url);
    setCopiedToast(`Copied direct quiz link! (${shareCode})`);
    setTimeout(() => setCopiedToast(null), 3000);
  };

  const handleExportCsv = (quiz: QuizAssignment) => {
    const subs = submissions.filter(s => s.quizId === quiz.id || (s as any).assignmentId === quiz.id);
    const csvContent = exportQuizSubmissionsCsv(quiz, subs);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `HTEIM_Quiz_${quiz.courseCode || 'Course'}_${quiz.title.replace(/\s+/g, '_')}_Submissions.csv`;
    link.click();
  };

  return (
    <div className="space-y-6">
      
      {/* Toast Notification */}
      {copiedToast && (
        <div role="status" className="fixed top-6 right-6 z-60 bg-emerald-700 text-white px-4 py-2.5 rounded-xl shadow-xl font-bold text-xs flex items-center gap-2 animate-fadeIn">
          <Check className="w-4 h-4" />
          <span>{copiedToast}</span>
        </div>
      )}

      {/* Top Banner & Control Deck */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-200 dark:border-slate-700 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-xl bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 flex items-center justify-center font-black">
              <BarChart2 className="w-4 h-4" />
            </span>
            <h2 className="text-lg font-black text-slate-900 dark:text-white">
              Google Quizzes & Assessment Management Center
            </h2>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Create, auto-grade, analyze student responses, and publish interactive theological exams.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={() => {
              setQuizToEdit(null);
              setShowCreatorModal(true);
            }}
            className="px-4 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold text-xs rounded-xl shadow-md shadow-purple-600/20 flex items-center gap-2 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Quiz</span>
          </button>
        </div>
      </div>

      {/* Google Forms Inspired Navigation Tabs */}
      <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1.5 rounded-xl border border-slate-200 dark:border-slate-700 w-fit">
        <button
          onClick={() => setActiveTab('all_quizzes')}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'all_quizzes'
              ? 'bg-white dark:bg-slate-700 text-purple-900 dark:text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>All Quizzes ({quizzes.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('analytics')}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'analytics'
              ? 'bg-white dark:bg-slate-700 text-purple-900 dark:text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          <TrendingUp className="w-3.5 h-3.5" />
          <span>Responses & Item Analysis ({submissions.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('individual')}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'individual'
              ? 'bg-white dark:bg-slate-700 text-purple-900 dark:text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>Individual Student Submissions</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: ALL QUIZZES DIRECTORY */}
      {/* ========================================================================= */}
      {activeTab === 'all_quizzes' && (
        <div className="space-y-4">
          
          {/* Filter Bar */}
          <div className="bg-white dark:bg-slate-800 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search quizzes by title or course..."
                className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-xs font-medium focus:ring-2 focus:ring-purple-500 outline-none"
              />
            </div>

            <div className="flex items-center gap-2">
              <select
                value={selectedCourseFilter}
                onChange={(e) => setSelectedCourseFilter(e.target.value)}
                className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-xs font-bold text-slate-800 dark:text-slate-200"
              >
                <option value="all">All Course Codes</option>
                {courseCodes.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>

              <div className="flex items-center border border-slate-200 dark:border-slate-700 rounded-lg p-0.5 bg-slate-100 dark:bg-slate-900">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-1.5 rounded-md ${viewMode === 'grid' ? 'bg-white dark:bg-slate-700 shadow-xs text-purple-600' : 'text-slate-400'}`}
                  title="Grid View"
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setViewMode('table')}
                  className={`p-1.5 rounded-md ${viewMode === 'table' ? 'bg-white dark:bg-slate-700 shadow-xs text-purple-600' : 'text-slate-400'}`}
                  title="Table View"
                >
                  <List className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* Quizzes Grid View */}
          {viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredQuizzes.map(quiz => {
                const subCount = submissions.filter(s => s.quizId === quiz.id || (s as any).assignmentId === quiz.id).length;

                return (
                  <div
                    key={quiz.id}
                    className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-200 dark:border-slate-700 shadow-xs hover:border-purple-300 dark:hover:border-purple-600 transition-all flex flex-col justify-between space-y-4"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[10px] font-black uppercase tracking-wider bg-purple-100 dark:bg-purple-950/80 text-purple-800 dark:text-purple-200 px-2 py-0.5 rounded-full border border-purple-200 dark:border-purple-800">
                          {quiz.courseCode || 'MIN-101'}
                        </span>
                        <span className="text-xs font-mono font-bold text-amber-600 dark:text-amber-400">
                          {quiz.totalPoints || 100} pts
                        </span>
                      </div>

                      <h3 className="text-sm font-black text-slate-900 dark:text-white line-clamp-2">
                        {quiz.title}
                      </h3>

                      <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                        {quiz.description || 'Google Forms styled ministerial assessment quiz.'}
                      </p>

                      <div className="pt-2 flex items-center justify-between text-xs font-mono font-bold text-slate-600 dark:text-slate-400 border-t border-slate-100 dark:border-slate-700/60">
                        <span>{quiz.questions?.length || 0} Questions</span>
                        <span className="text-purple-600 dark:text-purple-400 font-sans">
                          {subCount} Submissions
                        </span>
                      </div>
                    </div>

                    {/* Action Deck */}
                    <div className="pt-3 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => {
                            setSelectedAnalyticsQuizId(quiz.id);
                            setActiveTab('analytics');
                          }}
                          className="p-1.5 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:text-purple-600 rounded-lg"
                          title="View Responses & Analytics"
                        >
                          <BarChart2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleCopyLink(quiz.shareCode)}
                          className="p-1.5 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:text-purple-600 rounded-lg"
                          title="Copy Share Link"
                        >
                          <Share2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleExportCsv(quiz)}
                          className="p-1.5 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:text-purple-600 rounded-lg"
                          title="Export Submissions CSV"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => {
                            setQuizToEdit(quiz);
                            setShowCreatorModal(true);
                          }}
                          className="px-2.5 py-1.5 bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 hover:bg-purple-100 text-xs font-bold rounded-lg transition-colors flex items-center gap-1"
                        >
                          <Edit3 className="w-3 h-3" />
                          <span>Edit</span>
                        </button>

                        <button
                          onClick={() => {
                            if (onTakeQuiz) onTakeQuiz(quiz);
                            else setPreviewQuiz(quiz);
                          }}
                          className="px-2.5 py-1.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1"
                        >
                          <Eye className="w-3 h-3" />
                          <span>Preview</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 font-extrabold uppercase">
                    <tr>
                      <th className="p-3">Course</th>
                      <th className="p-3">Quiz Title</th>
                      <th className="p-3">Questions</th>
                      <th className="p-3">Points</th>
                      <th className="p-3">Submissions</th>
                      <th className="p-3">Due Date</th>
                      <th className="p-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-700 text-slate-800 dark:text-slate-200 font-medium">
                    {filteredQuizzes.map(quiz => {
                      const subCount = submissions.filter(s => s.quizId === quiz.id || (s as any).assignmentId === quiz.id).length;
                      return (
                        <tr key={quiz.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/50">
                          <td className="p-3 font-mono font-bold text-purple-600">{quiz.courseCode || 'MIN-101'}</td>
                          <td className="p-3 font-bold text-slate-900 dark:text-white">{quiz.title}</td>
                          <td className="p-3 font-mono">{quiz.questions?.length || 0}</td>
                          <td className="p-3 font-mono font-bold text-amber-600">{quiz.totalPoints || 100}</td>
                          <td className="p-3 font-mono">{subCount}</td>
                          <td className="p-3 text-slate-500">{quiz.dueDate || 'N/A'}</td>
                          <td className="p-3 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => {
                                  setQuizToEdit(quiz);
                                  setShowCreatorModal(true);
                                }}
                                className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-purple-600"
                                title="Edit"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleExportCsv(quiz)}
                                className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-slate-600"
                                title="Export CSV"
                              >
                                <Download className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => {
                                  if (onTakeQuiz) onTakeQuiz(quiz);
                                  else setPreviewQuiz(quiz);
                                }}
                                className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-slate-600"
                                title="Preview / Test Take"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: GOOGLE FORMS STYLE SUMMARY ANALYTICS & ITEM ANALYSIS */}
      {/* ========================================================================= */}
      {activeTab === 'analytics' && activeAnalyticsQuiz && (
        <div className="space-y-6">
          
          {/* Quiz Selector Dropdown */}
          <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <span className="text-xs font-black uppercase tracking-wider text-slate-500 shrink-0">
                Select Quiz:
              </span>
              <select
                value={selectedAnalyticsQuizId}
                onChange={(e) => setSelectedAnalyticsQuizId(e.target.value)}
                className="w-full sm:w-80 px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-xs font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500 outline-none"
              >
                {quizzes.map(q => (
                  <option key={q.id} value={q.id}>{q.courseCode}: {q.title}</option>
                ))}
              </select>
            </div>

            <button
              onClick={() => handleExportCsv(activeAnalyticsQuiz)}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl flex items-center gap-2 transition-colors"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Export Analytics (CSV)</span>
            </button>
          </div>

          {/* Core Metrics Scoreboard (Google Forms Summary Metrics) */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xs">
              <span className="text-[10px] font-extrabold uppercase text-slate-500">Total Responses</span>
              <div className="text-2xl font-black text-slate-900 dark:text-white font-mono mt-1">{totalResponses}</div>
              <span className="text-[10px] text-slate-400">Submissions received</span>
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

          {/* Frequently Missed Questions Highlight (Google Forms Quizzes feature) */}
          {frequentlyMissed.length > 0 && (
            <div className="bg-amber-50 dark:bg-amber-950/40 p-4 rounded-2xl border border-amber-300 dark:border-amber-800/80 space-y-3">
              <div className="flex items-center gap-2 text-amber-900 dark:text-amber-100">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                <h4 className="text-xs font-black uppercase tracking-wider">
                  Frequently Missed Questions ({frequentlyMissed.length} items with &lt; 65% accuracy)
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

          {/* Item-by-Item Breakdown */}
          <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-4 shadow-xs">
            <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
              <BarChart2 className="w-4 h-4 text-purple-600" />
              <span>Question-by-Question Response Distribution</span>
            </h3>

            <div className="space-y-4">
              {missedQuestionsAnalysis.map(item => (
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
                      className={`h-full rounded-full ${item.percentCorrect >= 75 ? 'bg-emerald-500' : item.percentCorrect >= 50 ? 'bg-amber-500' : 'bg-rose-500'}`}
                      style={{ width: `${item.percentCorrect}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: INDIVIDUAL STUDENT SUBMISSIONS */}
      {/* ========================================================================= */}
      {activeTab === 'individual' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-xs">
            <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Student Submissions Log ({submissions.length} Total Submissions)
              </h3>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 font-extrabold uppercase">
                  <tr>
                    <th className="p-3">Student Name</th>
                    <th className="p-3">Quiz</th>
                    <th className="p-3">Submitted At</th>
                    <th className="p-3">Score</th>
                    <th className="p-3">Percentage</th>
                    <th className="p-3">Status</th>
                    <th className="p-3 text-right">View Sheet</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700 text-slate-800 dark:text-slate-200 font-medium">
                  {submissions.map(sub => {
                    const isPassed = sub.percentage >= 75;
                    return (
                      <tr key={sub.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/50">
                        <td className="p-3 font-bold text-slate-900 dark:text-white">{sub.studentName}</td>
                        <td className="p-3 text-slate-500">{sub.quizTitle || sub.quizId}</td>
                        <td className="p-3 font-mono text-[11px] text-slate-400">{sub.submittedAt}</td>
                        <td className="p-3 font-mono font-bold">{sub.score}/{sub.totalPossible}</td>
                        <td className="p-3 font-mono font-black">{sub.percentage}%</td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                            isPassed ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                          }`}>
                            {isPassed ? 'Satisfactory' : 'At-Risk (<75%)'}
                          </span>
                        </td>
                        <td className="p-3 text-right">
                          <button
                            onClick={() => setSelectedSubmissionForReview(sub)}
                            className="px-2.5 py-1 bg-purple-50 dark:bg-purple-950 text-purple-700 dark:text-purple-300 hover:bg-purple-100 font-bold rounded-lg text-xs"
                          >
                            Review
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                  {submissions.length === 0 && (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-slate-400">
                        No student quiz submissions recorded yet. Submissions will populate here automatically.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* MODALS */}

      {/* Quiz Creator / Editor Modal */}
      {showCreatorModal && (
        <QuizCreatorModal
          isOpen={showCreatorModal}
          onClose={() => {
            setShowCreatorModal(false);
            setQuizToEdit(null);
          }}
          quizToEdit={quizToEdit}
          onSaveQuiz={(q) => {
            onSaveQuiz(q);
            setShowCreatorModal(false);
            setQuizToEdit(null);
          }}
          onDuplicateQuiz={onDuplicateQuiz}
        />
      )}

      {/* Quiz Taker / Preview Modal */}
      {previewQuiz && (
        <QuizTakerView
          quiz={previewQuiz}
          studentName="Faculty Preview User"
          onClose={() => setPreviewQuiz(null)}
          onSubmitQuiz={(sub) => {
            setPreviewQuiz(null);
          }}
        />
      )}

      {/* Individual Student Submission Review Sheet Modal */}
      {selectedSubmissionForReview && (
        <div className="fixed inset-0 z-60 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden shadow-2xl">
            <div className="p-4 bg-purple-900 text-white flex items-center justify-between">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-purple-300">Student Submission Review</span>
                <h3 className="text-base font-black">{selectedSubmissionForReview.studentName}</h3>
              </div>
              <button onClick={() => setSelectedSubmissionForReview(null)} className="p-1 text-white hover:opacity-80">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-4">
              <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
                <span className="text-xs font-bold text-slate-500">Total Score:</span>
                <span className="text-lg font-black font-mono text-purple-600">
                  {selectedSubmissionForReview.score} / {selectedSubmissionForReview.totalPossible} ({selectedSubmissionForReview.percentage}%)
                </span>
              </div>

              <div className="space-y-3">
                {selectedSubmissionForReview.responses.map((resp, i) => (
                  <div key={resp.questionId} className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-800 dark:text-slate-200">Question #{i + 1}</span>
                      <span className={`font-mono font-bold ${resp.isCorrect ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {resp.pointsEarned} pts {resp.isCorrect ? '(Correct)' : '(Incorrect)'}
                      </span>
                    </div>
                    {resp.textAnswer && <p className="font-mono text-slate-600 dark:text-slate-400">"{resp.textAnswer}"</p>}
                    {resp.selectedOptionId && <p className="font-mono text-slate-600 dark:text-slate-400">Option: {resp.selectedOptionId}</p>}
                  </div>
                ))}
              </div>
            </div>

            <div className="p-4 bg-slate-100 dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 flex justify-end">
              <button
                onClick={() => setSelectedSubmissionForReview(null)}
                className="px-4 py-2 bg-purple-600 text-white font-bold text-xs rounded-xl"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
