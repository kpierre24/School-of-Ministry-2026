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
  Calendar
} from 'lucide-react';
import { UserRole } from '../lib/userAuth';
import { QuizAssignment, QuizSubmission } from '../types';
import { QuizCreatorModal } from './QuizCreatorModal';
import { QuizTakerView } from './QuizTakerView';
import { logActivity } from '../lib/auditLogger';

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
  // Filters & State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCourseFilter, setSelectedCourseFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [copiedToast, setCopiedToast] = useState<string | null>(null);

  // Modals inside Dashboard
  const [showCreatorModal, setShowCreatorModal] = useState(false);
  const [quizToEdit, setQuizToEdit] = useState<QuizAssignment | null>(null);
  const [quizToDelete, setQuizToDelete] = useState<QuizAssignment | null>(null);
  const [previewQuiz, setPreviewQuiz] = useState<QuizAssignment | null>(null);
  const [collatingQuiz, setCollatingQuiz] = useState<QuizAssignment | null>(null);

  // Check role restriction
  const isAuthorized = userRole === 'admin' || userRole === 'teacher';

  // Copy share link
  const handleCopyShareLink = (quiz: QuizAssignment) => {
    const link = `${window.location.origin}/#quiz/${quiz.shareCode || quiz.id}`;
    navigator.clipboard.writeText(link).then(() => {
      setCopiedToast(`Copied share link for "${quiz.title}"!`);
      setTimeout(() => setCopiedToast(null), 3000);
    }).catch(() => {
      setCopiedToast(`Share Code: ${quiz.shareCode}`);
      setTimeout(() => setCopiedToast(null), 3000);
    });
  };

  // Duplicate handler
  const handleDuplicate = (quiz: QuizAssignment) => {
    if (onDuplicateQuiz) {
      onDuplicateQuiz(quiz);
      setCopiedToast(`Duplicated "${quiz.title}"`);
      setTimeout(() => setCopiedToast(null), 3000);
    } else {
      const newShareCode = `qz_${Math.random().toString(36).substring(2, 8)}`;
      const newQuiz: QuizAssignment = {
        ...quiz,
        id: `quiz_${Date.now()}`,
        title: `${quiz.title} (Copy)`,
        shareCode: newShareCode,
        createdAt: new Date().toISOString().split('T')[0]
      };
      onSaveQuiz(newQuiz);
      setCopiedToast(`Duplicated "${quiz.title}"`);
      setTimeout(() => setCopiedToast(null), 3000);
    }
  };

  // Confirm delete handler
  const handleConfirmDelete = () => {
    if (!quizToDelete) return;
    const targetTitle = quizToDelete.title;
    const targetId = quizToDelete.id;

    onDeleteQuiz(targetId);

    logActivity({
      actor: userRole === 'admin' ? 'Administrator' : 'Faculty Instructor',
      role: userRole,
      actionCategory: 'Quiz Management',
      actionTitle: 'Quiz Deleted',
      details: `Deleted quiz "${targetTitle}" (ID: ${targetId}).`
    });

    setQuizToDelete(null);
    setCopiedToast(`Deleted quiz "${targetTitle}".`);
    setTimeout(() => setCopiedToast(null), 3000);
  };

  // Filtered Quizzes list
  const courseCodes = Array.from(new Set(quizzes.map(q => q.courseCode || 'MIN-101'))).filter(Boolean);

  const filteredQuizzes = quizzes.filter(quiz => {
    const matchesSearch = 
      quiz.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (quiz.courseCode || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (quiz.moduleTrack || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (quiz.shareCode || '').toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCourse = selectedCourseFilter === 'all' || quiz.courseCode === selectedCourseFilter;

    return matchesSearch && matchesCourse;
  });

  // Export Quizzes JSON
  const handleExportJSON = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(quizzes, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `HTEIM_Admin_Quizzes_Backup_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // UNAUTHORIZED ACCESS RESTRICTION VIEW
  if (!isAuthorized) {
    return (
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 shadow-sm text-center max-w-2xl mx-auto my-8 space-y-6 animate-fadeIn">
        <div className="w-16 h-16 bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 rounded-2xl flex items-center justify-center mx-auto shadow-inner border border-rose-200 dark:border-rose-800">
          <ShieldAlert className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <span className="px-3 py-1 bg-rose-100 dark:bg-rose-950/80 text-rose-800 dark:text-rose-300 border border-rose-300 dark:border-rose-700 text-[11px] font-black uppercase tracking-wider rounded-full inline-block">
            Access Restricted — Admin & Faculty Only
          </span>
          <h2 className="text-xl font-black text-slate-900 dark:text-white">
            Admin Quizzes Dashboard
          </h2>
          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed max-w-lg mx-auto">
            You are currently logged in as a <span className="font-bold text-rose-600 dark:text-rose-400">Student</span>. The Admin Quizzes Dashboard contains sensitive question management, weighted scoring keys, and stored answer keys restricted exclusively to School of Ministry Administrators and Instructors.
          </p>
        </div>

        <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 text-left text-xs space-y-2 text-slate-700 dark:text-slate-300">
          <div className="font-extrabold flex items-center gap-2 text-slate-900 dark:text-white">
            <ShieldCheck className="w-4 h-4 text-emerald-500" /> Administrative Privileges Needed
          </div>
          <p>
            To manage class day quizzes, create new questions, or delete stored quizzes, please switch your portal preview role to <span className="font-bold text-indigo-600 dark:text-indigo-400">Teacher / Instructor</span> or <span className="font-bold text-amber-600 dark:text-amber-400">Administrator</span>.
          </p>
        </div>

        {onSwitchRoleToTeacher && (
          <button
            onClick={onSwitchRoleToTeacher}
            className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-extrabold text-xs rounded-xl shadow-md transition-all active:scale-95 cursor-pointer inline-flex items-center gap-2"
          >
            <Sparkles className="w-4 h-4" /> Switch Role to Teacher / Admin
          </button>
        )}
      </div>
    );
  }

  // AUTHORIZED ADMIN / TEACHER VIEW
  const totalQuestions = quizzes.reduce((sum, q) => sum + (q.questions ? q.questions.length : 0), 0);
  const totalSubmissions = submissions.length;

  return (
    <div className="material-screen space-y-6">
      {/* Toast Banner */}
      {copiedToast && (
        <div className="p-3 bg-amber-400 text-slate-950 font-bold text-xs rounded-2xl shadow-lg border border-amber-500 flex items-center justify-between animate-fadeIn">
          <span className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-slate-900" />
            <span>{copiedToast}</span>
          </span>
          <button onClick={() => setCopiedToast(null)} className="text-slate-900 font-black hover:opacity-80">✕</button>
        </div>
      )}

      {/* DASHBOARD HEADER */}
      <div className="bg-white dark:bg-slate-900 rounded-xl p-6 sm:p-8 border border-slate-200 dark:border-slate-700">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 text-[10px] font-semibold uppercase tracking-wider rounded-lg flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5" /> Admin & Teacher Portal
              </span>
              <span className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 text-[10px] font-semibold rounded-lg font-mono">
                {quizzes.length} Stored Quizzes
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-3">
              Admin Quizzes Dashboard
            </h1>

            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Centralized repository for all School of Ministry class day interactive quizzes, weighted question banks, share codes, and student submission matrices.
            </p>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <button
              onClick={handleExportJSON}
              className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 font-semibold text-xs rounded-lg transition-colors cursor-pointer flex items-center gap-2"
              title="Export All Quizzes to JSON"
            >
              <Download className="w-4 h-4" /> Backup JSON
            </button>

            <button
              onClick={() => {
                setQuizToEdit(null);
                setShowCreatorModal(true);
              }}
              className="px-5 py-2.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-semibold text-xs rounded-lg transition-colors cursor-pointer flex items-center gap-2"
            >
              <Plus className="w-4 h-4" /> Create New Quiz
            </button>
          </div>
        </div>

        {/* METRICS SUMMARY STRIP */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-slate-200 dark:border-slate-700">
          <div className="bg-slate-50 dark:bg-slate-800 p-3.5 rounded-lg border border-slate-200 dark:border-slate-700">
            <div className="text-[10px] font-semibold uppercase text-slate-500 dark:text-slate-400">Total Quizzes</div>
            <div className="text-xl font-bold text-slate-900 dark:text-white font-mono mt-0.5">{quizzes.length}</div>
          </div>

          <div className="bg-slate-50 dark:bg-slate-800 p-3.5 rounded-lg border border-slate-200 dark:border-slate-700">
            <div className="text-[10px] font-semibold uppercase text-slate-500 dark:text-slate-400">Stored Questions</div>
            <div className="text-xl font-bold text-slate-900 dark:text-white font-mono mt-0.5">{totalQuestions}</div>
          </div>

          <div className="bg-slate-50 dark:bg-slate-800 p-3.5 rounded-lg border border-slate-200 dark:border-slate-700">
            <div className="text-[10px] font-semibold uppercase text-slate-500 dark:text-slate-400">Student Responses</div>
            <div className="text-xl font-bold text-emerald-600 dark:text-emerald-400 font-mono mt-0.5">{totalSubmissions}</div>
          </div>

          <div className="bg-slate-50 dark:bg-slate-800 p-3.5 rounded-lg border border-slate-200 dark:border-slate-700">
            <div className="text-[10px] font-semibold uppercase text-slate-500 dark:text-slate-400">Share Codes Active</div>
            <div className="text-xl font-bold text-slate-900 dark:text-white font-mono mt-0.5">{quizzes.filter(q => q.shareCode).length}</div>
          </div>
        </div>
      </div>

      {/* SEARCH, FILTER & VIEW CONTROLS */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Search Field */}
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search quizzes by title, course code, module, or share code..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-900 dark:text-white"
          />
        </div>

        {/* Course Code Filter */}
        <div className="flex items-center gap-2 w-full md:w-auto">
          <select
            value={selectedCourseFilter}
            onChange={(e) => setSelectedCourseFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 outline-none focus:ring-2 focus:ring-indigo-500/20"
          >
            <option value="all">All Courses ({quizzes.length})</option>
            {courseCodes.map(code => (
              <option key={code} value={code}>{code}</option>
            ))}
          </select>

          {/* View Mode Toggle */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-xs' : 'text-slate-500'}`}
              title="Grid View"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg transition-all ${viewMode === 'table' ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-xs' : 'text-slate-500'}`}
              title="Table View"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* QUIZZES LISTING */}
      {filteredQuizzes.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-12 text-center space-y-4">
          <FileText className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto" />
          <div className="space-y-1">
            <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">No Quizzes Found</h3>
            <p className="text-xs text-slate-500">
              {searchQuery ? `No stored quizzes match "${searchQuery}".` : 'No class day quizzes created yet.'}
            </p>
          </div>
          <button
            onClick={() => {
              setQuizToEdit(null);
              setShowCreatorModal(true);
            }}
            className="px-4 py-2 bg-indigo-600 text-white font-bold text-xs rounded-xl hover:bg-indigo-700 transition-colors inline-flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" /> Create First Quiz
          </button>
        </div>
      ) : viewMode === 'grid' ? (
        /* GRID VIEW */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredQuizzes.map((quiz) => {
            const quizSubs = submissions.filter(s => s.quizId === quiz.id);

            return (
              <div 
                key={quiz.id}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-indigo-400 dark:hover:border-indigo-600 rounded-2xl p-6 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between space-y-4 relative group"
              >
                <div className="space-y-3">
                  {/* Top Badges */}
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-2">
                      <span className="px-3 py-1 bg-indigo-50 dark:bg-indigo-950/80 border border-indigo-200 dark:border-indigo-800 text-indigo-900 dark:text-indigo-300 text-xs font-mono font-black rounded-lg">
                        {quiz.courseCode || 'MIN-101'}
                      </span>
                      <span className="px-2.5 py-1 bg-amber-50 dark:bg-amber-950/80 text-amber-900 dark:text-amber-300 border border-amber-200 dark:border-amber-800 text-[10px] font-bold rounded-lg flex items-center gap-1">
                        <Award className="w-3 h-3 text-amber-600 dark:text-amber-400" /> {quiz.totalPoints} Points
                      </span>
                    </div>

                    <span className="text-[10px] font-bold text-slate-500 font-mono bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-md">
                      Share Code: <span className="text-indigo-600 dark:text-indigo-400 font-extrabold">{quiz.shareCode}</span>
                    </span>
                  </div>

                  {/* Title & Description */}
                  <div>
                    <h3 className="text-base font-extrabold text-slate-900 dark:text-white leading-snug">
                      {quiz.title}
                    </h3>
                    {quiz.moduleTrack && (
                      <p className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 mt-0.5">
                        {quiz.moduleTrack}
                      </p>
                    )}
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-2 line-clamp-2 leading-relaxed">
                      {quiz.description || 'Interactive Google Forms style class day quiz module.'}
                    </p>
                  </div>

                  {/* Quiz Details Strip */}
                  <div className="grid grid-cols-3 gap-2 bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-200 dark:border-slate-700 text-center">
                    <div>
                      <div className="text-[10px] font-bold uppercase text-slate-400">Questions</div>
                      <div className="text-xs font-black text-slate-800 dark:text-slate-200 font-mono mt-0.5">
                        {quiz.questions ? quiz.questions.length : 0}
                      </div>
                    </div>

                    <div>
                      <div className="text-[10px] font-bold uppercase text-slate-400">Submissions</div>
                      <div className="text-xs font-black text-emerald-600 dark:text-emerald-400 font-mono mt-0.5">
                        {quizSubs.length}
                      </div>
                    </div>

                    <div>
                      <div className="text-[10px] font-bold uppercase text-slate-400">Due Date</div>
                      <div className="text-xs font-black text-slate-800 dark:text-slate-200 font-mono mt-0.5">
                        {quiz.dueDate || 'No Due Date'}
                      </div>
                    </div>
                  </div>
                </div>

                {/* ACTION BUTTONS (EDIT & DELETE MANDATORY) */}
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
                  {/* Row 1: Primary actions */}
                  <div className="grid grid-cols-2 gap-2">
                    {/* EDIT QUIZ BUTTON */}
                    <button
                      onClick={() => {
                        setQuizToEdit(quiz);
                        setShowCreatorModal(true);
                      }}
                      className="py-2.5 px-3 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-2xs active:scale-95"
                      title="Edit Quiz Questions & Details"
                    >
                      <Edit3 className="w-3.5 h-3.5" /> <span>Edit Quiz</span>
                    </button>

                    {/* PREVIEW / TEST */}
                    <button
                      onClick={() => setPreviewQuiz(quiz)}
                      className="py-2.5 px-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-extrabold text-xs rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 active:scale-95"
                      title="Test Quiz View"
                    >
                      <Eye className="w-3.5 h-3.5 text-indigo-500" /> <span>Test View</span>
                    </button>
                  </div>

                  {/* Row 2: Secondary / Admin utility tools */}
                  <div className="grid grid-cols-5 gap-2">
                    {/* SHARE LINK */}
                    <button
                      onClick={() => handleCopyShareLink(quiz)}
                      className="py-2.5 bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1"
                      title="Copy Share Link"
                    >
                      <Share2 className="w-4 h-4 text-purple-500" />
                    </button>

                    {/* DUPLICATE QUIZ */}
                    <button
                      onClick={() => handleDuplicate(quiz)}
                      className="py-2.5 bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1"
                      title="Duplicate Quiz"
                    >
                      <Copy className="w-4 h-4 text-emerald-500" />
                    </button>

                    {/* VIEW MATRIX */}
                    <button
                      onClick={() => setCollatingQuiz(quiz)}
                      className="py-2.5 bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1"
                      title="View Submissions Matrix"
                    >
                      <FileSpreadsheet className="w-4 h-4 text-amber-500" />
                    </button>

                    {/* TAKE QUIZ */}
                    <button
                      onClick={() => {
                        if (onTakeQuiz) onTakeQuiz(quiz);
                      }}
                      className="py-2.5 bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1"
                      title="Take Quiz as Candidate"
                    >
                      <Sparkles className="w-4 h-4 text-indigo-500" />
                    </button>

                    {/* DELETE QUIZ BUTTON */}
                    <button
                      onClick={() => setQuizToDelete(quiz)}
                      className="py-2.5 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/50 text-rose-600 dark:text-rose-400 font-bold text-xs rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1 border border-rose-100 dark:border-rose-900/60"
                      title="Delete Quiz"
                    >
                      <Trash2 className="w-4 h-4 animate-pulse" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* TABLE VIEW */
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-x-auto shadow-2xs">
          <table className="w-full text-left text-xs min-w-[800px]">
            <thead>
              <tr className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-extrabold text-[10px] uppercase">
                <th className="p-3.5 border-b border-slate-200 dark:border-slate-700">Course & Title</th>
                <th className="p-3.5 border-b border-slate-200 dark:border-slate-700 text-center">Questions</th>
                <th className="p-3.5 border-b border-slate-200 dark:border-slate-700 text-center">Total Points</th>
                <th className="p-3.5 border-b border-slate-200 dark:border-slate-700 text-center">Submissions</th>
                <th className="p-3.5 border-b border-slate-200 dark:border-slate-700 text-center">Share Code</th>
                <th className="p-3.5 border-b border-slate-200 dark:border-slate-700 text-right">Admin Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredQuizzes.map((quiz) => {
                const quizSubs = submissions.filter(s => s.quizId === quiz.id);

                return (
                  <tr key={quiz.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="p-3.5">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 bg-indigo-100 dark:bg-indigo-950 text-indigo-900 dark:text-indigo-300 font-mono font-black text-[10px] rounded">
                          {quiz.courseCode || 'MIN-101'}
                        </span>
                        <div>
                          <div className="font-extrabold text-slate-900 dark:text-white">{quiz.title}</div>
                          <div className="text-[10px] text-slate-500">{quiz.moduleTrack}</div>
                        </div>
                      </div>
                    </td>

                    <td className="p-3.5 text-center font-mono font-bold text-slate-800 dark:text-slate-200">
                      {quiz.questions ? quiz.questions.length : 0}
                    </td>

                    <td className="p-3.5 text-center font-mono font-black text-amber-600 dark:text-amber-400">
                      {quiz.totalPoints} pts
                    </td>

                    <td className="p-3.5 text-center font-mono font-bold text-emerald-600 dark:text-emerald-400">
                      {quizSubs.length}
                    </td>

                    <td className="p-3.5 text-center">
                      <span className="px-2 py-1 bg-slate-100 dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 font-mono font-extrabold text-[10px] rounded">
                        {quiz.shareCode}
                      </span>
                    </td>

                    <td className="p-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => {
                            setQuizToEdit(quiz);
                            setShowCreatorModal(true);
                          }}
                          className="px-2.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[11px] rounded-lg transition-all cursor-pointer flex items-center gap-1"
                          title="Edit Quiz"
                        >
                          <Edit3 className="w-3 h-3" /> Edit
                        </button>

                        <button
                          onClick={() => handleCopyShareLink(quiz)}
                          className="p-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded-lg cursor-pointer"
                          title="Copy Link"
                        >
                          <Share2 className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => setQuizToDelete(quiz)}
                          className="p-1.5 bg-rose-100 dark:bg-rose-950/60 hover:bg-rose-200 text-rose-700 dark:text-rose-400 rounded-lg cursor-pointer"
                          title="Delete Quiz"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 1: CREATE / EDIT QUIZ MODAL */}
      {/* ========================================================= */}
      {showCreatorModal && (
        <QuizCreatorModal
          isOpen={showCreatorModal}
          onClose={() => {
            setShowCreatorModal(false);
            setQuizToEdit(null);
          }}
          quizToEdit={quizToEdit}
          initialData={quizToEdit as any}
          onSaveQuiz={(updatedQuiz) => {
            onSaveQuiz(updatedQuiz);
            setShowCreatorModal(false);
            setQuizToEdit(null);
            setCopiedToast(`Saved quiz "${updatedQuiz.title}".`);
            setTimeout(() => setCopiedToast(null), 3000);
          }}
          onDuplicateQuiz={handleDuplicate}
        />
      )}

      {/* ========================================================= */}
      {/* MODAL 2: CONFIRM DELETE QUIZ MODAL */}
      {/* ========================================================= */}
      {quizToDelete && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-rose-100 dark:bg-rose-950 text-rose-600 dark:text-rose-400 flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white">Delete Quiz Confirmation</h3>
                <p className="text-xs text-slate-500">This action cannot be undone.</p>
              </div>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 text-xs space-y-2">
              <div className="font-extrabold text-slate-900 dark:text-white">{quizToDelete.title}</div>
              <div className="flex items-center justify-between text-slate-500 font-mono">
                <span>Course: {quizToDelete.courseCode || 'MIN-101'}</span>
                <span>Questions: {quizToDelete.questions?.length || 0}</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setQuizToDelete(null)}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs rounded-xl shadow-md transition-all cursor-pointer flex items-center gap-1.5"
              >
                <Trash2 className="w-4 h-4" /> Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 3: PREVIEW / TEST QUIZ */}
      {/* ========================================================= */}
      {previewQuiz && (
        <QuizTakerView
          quiz={previewQuiz}
          currentStudentName="Teacher Practice Preview"
          onClose={() => setPreviewQuiz(null)}
          onSubmitQuiz={(sub) => {
            setPreviewQuiz(null);
            setCopiedToast(`Test completed with score ${sub.score}/${sub.totalPossible} (${sub.percentage}%).`);
            setTimeout(() => setCopiedToast(null), 3000);
          }}
        />
      )}

      {/* ========================================================= */}
      {/* MODAL 4: COLLATION MATRIX & ANALYTICS */}
      {/* ========================================================= */}
      {collatingQuiz && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-5 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-amber-400" />
                <div>
                  <h3 className="text-sm font-extrabold">{collatingQuiz.title} — Analytics & Responses</h3>
                  <p className="text-[11px] text-slate-300">Collated student submission metrics</p>
                </div>
              </div>
              <button 
                onClick={() => setCollatingQuiz(null)}
                className="w-8 h-8 rounded-full bg-slate-800 text-slate-300 hover:text-white flex items-center justify-center cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-6 flex-1 custom-scrollbar">
              {/* Question Breakdown */}
              <div className="space-y-3">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-500">Question Item Analytics</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {collatingQuiz.questions?.map((q, idx) => {
                    const quizSubs = submissions.filter(s => s.quizId === collatingQuiz.id);
                    const correctCount = quizSubs.filter(s => {
                      const resp = s.responses?.find(r => r.questionId === q.id);
                      return resp && resp.selectedOptionId === q.correctOptionId;
                    }).length;
                    const correctPct = quizSubs.length > 0 ? Math.round((correctCount / quizSubs.length) * 100) : 0;

                    return (
                      <div key={q.id} className="p-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-extrabold text-slate-900 dark:text-white">Q{idx + 1}. Weight: {q.weight} pts</span>
                          <span className={`px-2 py-0.5 rounded-full font-mono text-[10px] font-extrabold ${
                            correctPct >= 70 ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                          }`}>
                            {correctPct}% Correct ({correctCount}/{quizSubs.length})
                          </span>
                        </div>
                        <p className="text-xs text-slate-700 dark:text-slate-300 font-medium leading-snug">{q.questionText}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 flex justify-end">
              <button 
                onClick={() => setCollatingQuiz(null)}
                className="px-5 py-2 bg-slate-900 text-white font-bold text-xs rounded-xl cursor-pointer"
              >
                Close Matrix
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
