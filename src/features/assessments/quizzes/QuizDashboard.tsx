import React, { useState } from 'react';
import { 
  BarChart2, 
  Plus, 
  Search, 
  Edit3, 
  Trash2, 
  Share2, 
  FileText, 
  Download, 
  Eye, 
  Users, 
  TrendingUp, 
  LayoutGrid, 
  List, 
  Check, 
  FileSpreadsheet,
  ShieldAlert
} from 'lucide-react';
import { UserRole } from '../../../lib/userAuth';
import { QuizAssignment, QuizSubmission } from '../../../types';
import { QuizCreator } from './QuizCreator';
import { QuizTaker } from './QuizTaker';
import { QuizAnalytics } from './QuizAnalytics';
import { QuizSubmissionReview } from './QuizSubmissionReview';
import { useQuizManagement } from './useQuizManagement';
import { exportQuizSubmissionsCsv, scrubQuizForClient } from '../../../data/quizTemplates';
import { ImportQuizModal } from '../../../components/ImportQuizModal';
import { ExportQuizModal } from '../../../components/ExportQuizModal';

export interface QuizDashboardProps {
  userRole: UserRole;
  quizzes?: QuizAssignment[];
  submissions?: QuizSubmission[];
  onSaveQuiz?: (quiz: QuizAssignment) => void;
  onDeleteQuiz?: (quizId: string) => void;
  onDuplicateQuiz?: (quiz: QuizAssignment) => void;
  onTakeQuiz?: (quiz: QuizAssignment) => void;
  onSwitchRoleToTeacher?: () => void;
}

export const QuizDashboard: React.FC<QuizDashboardProps> = ({
  userRole,
  quizzes: propsQuizzes,
  submissions: propsSubmissions,
  onSaveQuiz: propsOnSaveQuiz,
  onDeleteQuiz: propsOnDeleteQuiz,
  onDuplicateQuiz: propsOnDuplicateQuiz,
  onTakeQuiz: propsOnTakeQuiz,
  onSwitchRoleToTeacher
}) => {
  const quizManager = useQuizManagement();
  
  const quizzes = propsQuizzes || quizManager.quizzes;
  const submissions = propsSubmissions || quizManager.submissions;

  // Active View Tabs
  const [activeTab, setActiveTab] = useState<'all_quizzes' | 'analytics' | 'individual'>('all_quizzes');

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCourseFilter, setSelectedCourseFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [copiedToast, setCopiedToast] = useState<string | null>(null);

  // Selected Quiz for Analytics / Review
  const [selectedAnalyticsQuizId, setSelectedAnalyticsQuizId] = useState<string>(quizzes[0]?.id || '');
  const [selectedSubmissionForReview, setSelectedSubmissionForReview] = useState<QuizSubmission | null>(null);

  // Modals
  const [showCreatorModal, setShowCreatorModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [quizToEdit, setQuizToEdit] = useState<QuizAssignment | null>(null);
  const [quizToExport, setQuizToExport] = useState<QuizAssignment | null>(null);
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

  const courseCodes = Array.from(new Set(quizzes.map(q => q.courseCode || 'MIN-101')));

  const handleCopyLink = (shareCode: string) => {
    const url = `${window.location.origin}${window.location.pathname}?quiz=${shareCode}`;
    navigator.clipboard.writeText(url);
    setCopiedToast(`Copied direct shareable quiz link! Anyone with this link can answer outside the app.`);
    setTimeout(() => setCopiedToast(null), 3500);
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

  const handleSaveQuiz = (quiz: QuizAssignment) => {
    if (propsOnSaveQuiz) propsOnSaveQuiz(quiz);
    else quizManager.saveQuiz(quiz);
    setShowCreatorModal(false);
    setQuizToEdit(null);
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

      {/* Header Bar */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-200 dark:border-slate-700 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-xl bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 flex items-center justify-center font-black">
              <BarChart2 className="w-4 h-4" />
            </span>
            <h2 className="text-lg font-black text-slate-900 dark:text-white">
              Quiz Management & Analytics
            </h2>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Create, auto-grade, analyze student responses, and publish interactive ministerial assessments.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setShowImportModal(true)}
            className="px-4 py-2.5 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-xl transition-all cursor-pointer flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            <span>Import Quiz</span>
          </button>
          
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

      {/* Navigation Tabs */}
      <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1.5 rounded-xl border border-slate-200 dark:border-slate-700 w-fit">
        <button
          onClick={() => setActiveTab('all_quizzes')}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
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
          className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'analytics'
              ? 'bg-white dark:bg-slate-700 text-purple-900 dark:text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          <TrendingUp className="w-3.5 h-3.5" />
          <span>Item Analytics ({submissions.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('individual')}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'individual'
              ? 'bg-white dark:bg-slate-700 text-purple-900 dark:text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>Submissions Log</span>
        </button>
      </div>

      {/* TAB 1: ALL QUIZZES */}
      {activeTab === 'all_quizzes' && (
        <div className="space-y-4">
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
                  className={`p-1.5 rounded-md cursor-pointer ${viewMode === 'grid' ? 'bg-white dark:bg-slate-700 shadow-xs text-purple-600' : 'text-slate-400'}`}
                  title="Grid View"
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setViewMode('table')}
                  className={`p-1.5 rounded-md cursor-pointer ${viewMode === 'table' ? 'bg-white dark:bg-slate-700 shadow-xs text-purple-600' : 'text-slate-400'}`}
                  title="Table View"
                >
                  <List className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredQuizzes.map(quiz => {
                const subCount = submissions.filter(s => s.quizId === quiz.id || (s as any).assignmentId === quiz.id).length;
                const status = quiz.status || (quiz.isPublished ? 'published' : 'draft');
                
                // Detailed sub stats for GRADING
                const awaitingReviewCount = submissions.filter(s => (s.quizId === quiz.id || (s as any).assignmentId === quiz.id) && !s.teacherFeedback).length;
                const autoGradedCount = Math.max(0, subCount - awaitingReviewCount);

                return (
                  <div
                    key={quiz.id}
                    className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-200 dark:border-slate-700 shadow-xs hover:border-purple-300 dark:hover:border-purple-600 transition-all flex flex-col justify-between space-y-4"
                  >
                    <div className="space-y-2.5">
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
                        {quiz.description || 'Ministerial assessment quiz.'}
                      </p>

                      {/* Status Badging Segment */}
                      <div className="py-2 px-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-700/50 space-y-1">
                        {status === 'published' || status === 'in_progress' ? (
                          <div className="flex flex-col">
                            <span className="text-[10px] font-extrabold text-emerald-600 flex items-center gap-1">
                              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                              🟢 OPEN & LIVE
                            </span>
                            <span className="text-[10px] text-slate-400 mt-0.5">
                              Available until {quiz.dueDate || 'September 24, 2026'} · 11:59 PM
                            </span>
                          </div>
                        ) : status === 'scheduled' ? (
                          <div className="flex flex-col">
                            <span className="text-[10px] font-extrabold text-amber-600 flex items-center gap-1">
                              <span className="w-2 h-2 rounded-full bg-amber-500" />
                              🟡 SCHEDULED
                            </span>
                            <span className="text-[10px] text-slate-400 mt-0.5">
                              Opens {quiz.settings?.availableFromDate || 'September 24'} · {quiz.settings?.availableFromTime || '7:00 PM'}
                            </span>
                          </div>
                        ) : status === 'graded' ? (
                          <div className="flex flex-col">
                            <span className="text-[10px] font-extrabold text-indigo-600 flex items-center gap-1">
                              <span className="w-2 h-2 rounded-full bg-indigo-500" />
                              🔵 GRADING / COMPLETE
                            </span>
                            <span className="text-[10px] text-slate-400 mt-0.5">
                              {subCount} submissions · {autoGradedCount} auto graded · {awaitingReviewCount} review
                            </span>
                          </div>
                        ) : status === 'closed' ? (
                          <div className="flex flex-col">
                            <span className="text-[10px] font-extrabold text-rose-600 flex items-center gap-1">
                              <span className="w-2 h-2 rounded-full bg-rose-500" />
                              🔴 CLOSED
                            </span>
                            <span className="text-[10px] text-slate-400 mt-0.5">
                              Locks on {quiz.settings?.closeDate || quiz.dueDate || 'Closed'}
                            </span>
                          </div>
                        ) : (
                          <div className="flex flex-col">
                            <span className="text-[10px] font-extrabold text-slate-500 flex items-center gap-1">
                              <span className="w-2 h-2 rounded-full bg-slate-400" />
                              📋 DRAFT MODE
                            </span>
                            <span className="text-[10px] text-slate-400 mt-0.5">
                              Invisible to candidates. Edit parameter to publish.
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="pt-2 flex items-center justify-between text-xs font-mono font-bold text-slate-600 dark:text-slate-400 border-t border-slate-100 dark:border-slate-700/60">
                        <span>{quiz.questions?.length || quiz.settings?.poolConfig?.questionCountToPresent || 0} Questions</span>
                        <span className="text-purple-600 dark:text-purple-400 font-sans">
                          {subCount} Submissions
                        </span>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => {
                            setSelectedAnalyticsQuizId(quiz.id);
                            setActiveTab('analytics');
                          }}
                          className="p-1.5 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:text-purple-600 rounded-lg cursor-pointer"
                          title="View Analytics"
                        >
                          <BarChart2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleCopyLink(quiz.shareCode)}
                          className="p-1.5 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:text-purple-600 rounded-lg cursor-pointer"
                          title="Copy Link"
                        >
                          <Share2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setQuizToExport(quiz)}
                          className="p-1.5 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:text-emerald-600 rounded-lg cursor-pointer"
                          title="Export Quiz"
                        >
                          <FileText className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleExportCsv(quiz)}
                          className="p-1.5 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:text-purple-600 rounded-lg cursor-pointer"
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
                          className="px-2.5 py-1.5 bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 hover:bg-purple-100 text-xs font-bold rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                        >
                          <Edit3 className="w-3 h-3" />
                          <span>Edit</span>
                        </button>

                        <button
                          onClick={() => {
                            if (propsOnTakeQuiz) propsOnTakeQuiz(quiz);
                            else setPreviewQuiz(quiz);
                          }}
                          className="px-2.5 py-1.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
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
                          <td className="p-3 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => {
                                  setQuizToEdit(quiz);
                                  setShowCreatorModal(true);
                                }}
                                className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-purple-600 cursor-pointer"
                                title="Edit"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => setQuizToExport(quiz)}
                                className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-slate-600 cursor-pointer"
                                title="Export Quiz"
                              >
                                <FileText className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleExportCsv(quiz)}
                                className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-slate-600 cursor-pointer"
                                title="Export Submissions CSV"
                              >
                                <Download className="w-3.5 h-3.5" />
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

      {/* TAB 2: ANALYTICS */}
      {activeTab === 'analytics' && (
        <QuizAnalytics
          quizzes={quizzes}
          submissions={submissions}
          selectedQuizId={selectedAnalyticsQuizId}
          onSelectQuiz={setSelectedAnalyticsQuizId}
        />
      )}

      {/* TAB 3: INDIVIDUAL SUBMISSIONS */}
      {activeTab === 'individual' && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 font-extrabold uppercase">
                <tr>
                  <th className="p-3">Student Name</th>
                  <th className="p-3">Quiz</th>
                  <th className="p-3">Submitted At</th>
                  <th className="p-3">Score</th>
                  <th className="p-3">Percentage</th>
                  <th className="p-3 text-right">Review</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700 text-slate-800 dark:text-slate-200 font-medium">
                {submissions.map(sub => (
                  <tr key={sub.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/50">
                    <td className="p-3 font-bold text-slate-900 dark:text-white">{sub.studentName}</td>
                    <td className="p-3 text-slate-500">{sub.quizTitle || sub.quizId}</td>
                    <td className="p-3 font-mono text-[11px] text-slate-400">{sub.submittedAt}</td>
                    <td className="p-3 font-mono font-bold">{sub.score}/{sub.totalPossible}</td>
                    <td className="p-3 font-mono font-black">{sub.percentage}%</td>
                    <td className="p-3 text-right">
                      <button
                        onClick={() => setSelectedSubmissionForReview(sub)}
                        className="px-2.5 py-1 bg-purple-50 dark:bg-purple-950 text-purple-700 dark:text-purple-300 hover:bg-purple-100 font-bold rounded-lg text-xs cursor-pointer"
                      >
                        Review
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODALS */}
      {showImportModal && (
        <ImportQuizModal
          isOpen={showImportModal}
          onClose={() => setShowImportModal(false)}
          onImport={handleSaveQuiz}
        />
      )}

      {quizToExport && (
        <ExportQuizModal
          isOpen={!!quizToExport}
          onClose={() => setQuizToExport(null)}
          quiz={quizToExport}
        />
      )}

      {showCreatorModal && (
        <QuizCreator
          isOpen={showCreatorModal}
          onClose={() => {
            setShowCreatorModal(false);
            setQuizToEdit(null);
          }}
          quizToEdit={quizToEdit}
          onSaveQuiz={handleSaveQuiz}
        />
      )}

      {previewQuiz && (
        <QuizTaker
          quiz={scrubQuizForClient(previewQuiz)}
          studentName="Faculty Preview User"
          onClose={() => setPreviewQuiz(null)}
          onSubmitQuiz={() => setPreviewQuiz(null)}
        />
      )}

      {selectedSubmissionForReview && (
        <QuizSubmissionReview
          submission={selectedSubmissionForReview}
          questions={quizzes.find(q => q.id === selectedSubmissionForReview.quizId)?.questions}
          onClose={() => setSelectedSubmissionForReview(null)}
          onSaveFeedback={(subId, feedback, score, updatedSub) => {
            quizManager.updateTeacherFeedback(subId, feedback, score, updatedSub);
            setSelectedSubmissionForReview(null);
          }}
        />
      )}

    </div>
  );
};
