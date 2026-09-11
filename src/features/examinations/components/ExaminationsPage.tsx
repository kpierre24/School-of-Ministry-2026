import React, { useState, useEffect } from 'react';
import { 
  FileSpreadsheet, 
  Search, 
  Award, 
  Download, 
  CheckCircle2, 
  BookOpen, 
  Plus, 
  Sparkles, 
  Clock, 
  Calendar,
  Layers,
  BrainCircuit,
  GraduationCap,
  ShieldCheck,
  RefreshCw,
  Sliders,
  Check,
  LayoutGrid
} from 'lucide-react';
import { ExaminationsPageProps, SubTabType } from '../types';
import { CustomAssignment, AssignmentSubmission, QuizAssignment, QuizSubmission } from '../../../types';
import { logActivity } from '../../../lib/auditLogger';
import { generateUUID } from '../../../lib/idGenerator';
import { usePortalRouter } from '../../../lib/usePortalRouter';

import { ExamList } from './ExamList';
import { ExamForm } from './ExamForm';
import { ExamResults } from './ExamResults';
import { ExamDetails } from './ExamDetails';
import { QuizCreatorModal } from '../../../components/QuizCreatorModal';
import { QuizTakerView } from '../../../components/QuizTakerView';
import { AdminQuizzesDashboard } from '../../../components/AdminQuizzesDashboard';
import { InteractiveFlashcards } from '../../../components/InteractiveFlashcards';

export const ExaminationsPage: React.FC<ExaminationsPageProps> = ({
  students,
  allQuizSheets,
  rubricScores,
  onUpdateRubric,
  userRole = 'admin',
  currentStudentName,
  onNotificationCreated,
  customAssignments,
  setCustomAssignments,
  submissions,
  setSubmissions,
  googleUser,
  googleToken,
  isLoggingIn,
  onGoogleLogin,
  onGoogleLogout,
  sheetUrl,
  setSheetUrl,
  onLoadSheets,
  isLoadingSheets,
  lastSyncedTime,
  recentSheets = [],
  onRemoveRecentSheet
}) => {
  const isStudent = userRole === 'student';
  const isTeacherOrAdmin = userRole === 'admin' || userRole === 'teacher';

  const [subTab, setSubTab] = useState<SubTabType>('assignments');
  const [activeView, setActiveView] = useState<'assignments' | 'grades'>('assignments');
  const [showFlashcards, setShowFlashcards] = useState(false);

  // Modals state
  const [showExamForm, setShowExamForm] = useState(false);
  const [selectedExamForEdit, setSelectedExamForEdit] = useState<CustomAssignment | null>(null);
  const [selectedExamForDetails, setSelectedExamForDetails] = useState<CustomAssignment | null>(null);
  const [selectedSubmissionForDetails, setSelectedSubmissionForDetails] = useState<AssignmentSubmission | null>(null);

  // Quiz modals
  const [showQuizCreatorModal, setShowQuizCreatorModal] = useState(false);
  const [editingQuizData, setEditingQuizData] = useState<QuizAssignment | null>(null);
  const [activeQuizTaker, setActiveQuizTaker] = useState<QuizAssignment | null>(null);

  const { route, navigate } = usePortalRouter('exams');

  // Listen for direct quiz deep-link
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const quizParam = urlParams.get('quiz') || urlParams.get('quizId');
    const hash = window.location.hash;
    let codeFromHash = '';
    if (hash.includes('#quiz/')) {
      codeFromHash = hash.split('#quiz/')[1];
    }
    const targetCode = quizParam || codeFromHash;
    if (targetCode && customAssignments.length > 0) {
      const matched = customAssignments.find(
        (a) => a.type === 'quiz' && a.quizData && (a.quizData.shareCode === targetCode || a.quizData.id === targetCode || a.id === targetCode)
      );
      if (matched && matched.quizData) {
        setActiveQuizTaker(matched.quizData);
        setSubTab('quizzes');
      }
    }
  }, [customAssignments]);

  const handleSaveAssignment = (asg: CustomAssignment) => {
    const index = customAssignments.findIndex((a) => a.id === asg.id);
    if (index >= 0) {
      const updated = [...customAssignments];
      updated[index] = asg;
      setCustomAssignments(updated);
    } else {
      setCustomAssignments([asg, ...customAssignments]);

      if (onNotificationCreated) {
        onNotificationCreated({
          id: generateUUID(),
          title: `📝 New Assignment: ${asg.title}`,
          message: `A new coursework assignment for ${asg.courseCode} has been posted. Due: ${asg.dueDate}.`,
          type: 'due_date',
          targetRole: 'student',
          createdAt: new Date().toISOString().replace('T', ' ').slice(0, 16),
          read: false,
          priority: 'high',
          actionTab: 'exams'
        });
      }
    }

    logActivity({
      actor: userRole === 'admin' ? 'Administrator' : 'Instructor',
      role: userRole === 'admin' ? 'admin' : 'teacher',
      actionCategory: 'Assignment Action',
      actionTitle: index >= 0 ? 'Assignment Updated' : 'Assignment Created',
      details: `Saved assignment "${asg.title}" (${asg.courseCode}, ${asg.maxPoints} pts)`
    });

    setShowExamForm(false);
    setSelectedExamForEdit(null);
  };

  const handleDeleteAssignment = (id: string) => {
    setCustomAssignments((prev) => prev.filter((a) => a.id !== id));
    logActivity({
      actor: userRole === 'admin' ? 'Administrator' : 'Instructor',
      role: userRole === 'admin' ? 'admin' : 'teacher',
      actionCategory: 'Assignment Action',
      actionTitle: 'Assignment Deleted',
      details: `Deleted assignment ID: ${id}`
    });
  };

  const handleGradeSubmission = (submissionId: string, score: number, feedback: string) => {
    const nowStr = new Date().toISOString().replace('T', ' ').slice(0, 16);
    setSubmissions((prev) =>
      prev.map((s) =>
        s.id === submissionId
          ? {
              ...s,
              score,
              teacherFeedback: feedback,
              status: 'Graded',
              updatedAt: nowStr
            }
          : s
      )
    );

    logActivity({
      actor: userRole === 'admin' ? 'Administrator' : 'Instructor',
      role: userRole === 'admin' ? 'admin' : 'teacher',
      actionCategory: 'Grade Adjustment',
      actionTitle: 'Submission Graded',
      details: `Awarded ${score} points with feedback.`
    });

    setSelectedExamForDetails(null);
    setSelectedSubmissionForDetails(null);
  };

  const handleSaveQuiz = (quizData: QuizAssignment) => {
    const existingIndex = customAssignments.findIndex(
      (a) => a.id === quizData.id || a.quizData?.id === quizData.id
    );

    const asgObj: CustomAssignment = {
      id: quizData.id,
      title: quizData.title,
      courseCode: quizData.courseCode,
      moduleTrack: quizData.moduleTrack,
      description: quizData.description || 'Interactive Google Forms style class day quiz.',
      dueDate: quizData.dueDate || '2026-08-30',
      maxPoints: quizData.totalPoints || 100,
      createdAt: quizData.createdAt,
      type: 'quiz',
      quizData
    };

    if (existingIndex >= 0) {
      const updated = [...customAssignments];
      updated[existingIndex] = asgObj;
      setCustomAssignments(updated);
    } else {
      setCustomAssignments([asgObj, ...customAssignments]);

      if (onNotificationCreated) {
        onNotificationCreated({
          id: generateUUID(),
          title: `📝 New Active Quiz: ${quizData.title}`,
          message: `A new class day quiz "${quizData.title}" (${quizData.totalPoints} pts) is active!`,
          type: 'due_date',
          targetRole: 'student',
          createdAt: new Date().toISOString().replace('T', ' ').slice(0, 16),
          read: false,
          priority: 'high',
          actionTab: 'exams'
        });
      }
    }

    setShowQuizCreatorModal(false);
    setEditingQuizData(null);
  };

  const handleQuizSubmissionComplete = (submission: QuizSubmission) => {
    const nowStr = new Date().toISOString().replace('T', ' ').slice(0, 16);
    const matchingAsg = customAssignments.find((a) => a.quizData?.id === submission.quizId || a.id === submission.quizId);

    const newAssignmentSub: AssignmentSubmission = {
      id: `SUB-${submission.id}`,
      assignmentId: matchingAsg?.id || submission.quizId,
      studentName: submission.studentName,
      submittedAt: submission.submittedAt || nowStr,
      score: submission.score,
      studentFileName: `Quiz_AutoGraded_${submission.quizId}.json`,
      studentNotes: `Completed Google Forms Class Day Quiz (${submission.percentage}% score). Correct tally: ${submission.score}/${submission.totalPossible} pts.`,
      status: 'Graded',
      teacherFeedback: `Automated quiz tally: ${submission.score}/${submission.totalPossible} points (${submission.percentage}%).`,
      updatedAt: nowStr
    };

    setSubmissions((prev) => {
      const filtered = prev.filter(
        (s) => !(s.assignmentId === newAssignmentSub.assignmentId && (s?.studentName || '').toLowerCase().trim() === (submission?.studentName || '').toLowerCase().trim())
      );
      return [newAssignmentSub, ...filtered];
    });

    setActiveQuizTaker(null);
  };

  return (
    <div className="space-y-6 p-6 pb-24 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-3">
            <BookOpen className="w-7 h-7 text-blue-600" />
            Examinations & Academic Assessment
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            Coursework grading, scripture recitation rubrics, and interactive quiz management
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowFlashcards(!showFlashcards)}
            className={`flex items-center gap-2 px-3 py-2 text-sm font-semibold rounded-lg transition-colors border ${
              showFlashcards 
                ? 'bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800' 
                : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-800 hover:bg-slate-50'
            }`}
          >
            <Sparkles className="w-4 h-4 text-purple-500" />
            <span>Study Flashcards</span>
          </button>

          {isTeacherOrAdmin && (
            <button
              onClick={() => {
                setEditingQuizData(null);
                setShowQuizCreatorModal(true);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold shadow-xs transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Create Quiz</span>
            </button>
          )}
        </div>
      </div>

      {/* Sub Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
        <button
          onClick={() => { setSubTab('assignments'); setActiveView('assignments'); }}
          className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
            subTab === 'assignments' && activeView === 'assignments'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          Assignments & Coursework
        </button>

        <button
          onClick={() => { setSubTab('assignments'); setActiveView('grades'); }}
          className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
            subTab === 'assignments' && activeView === 'grades'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          Grade Matrix & Rubrics
        </button>

        {isTeacherOrAdmin && (
          <button
            onClick={() => setSubTab('admin_dashboard')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
              subTab === 'admin_dashboard'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Quizzes Dashboard
          </button>
        )}
      </div>

      {/* Interactive Flashcards */}
      {showFlashcards && (
        <div className="bg-purple-50/50 dark:bg-purple-950/20 p-6 rounded-2xl border border-purple-100 dark:border-purple-900/40">
          <InteractiveFlashcards onClose={() => setShowFlashcards(false)} />
        </div>
      )}

      {/* Main Content Area */}
      {subTab === 'assignments' && activeView === 'assignments' && (
        <ExamList
          assignments={customAssignments}
          submissions={submissions}
          userRole={userRole}
          currentStudentName={currentStudentName}
          onNewAssignment={() => {
            setSelectedExamForEdit(null);
            setShowExamForm(true);
          }}
          onEditAssignment={(asg) => {
            setSelectedExamForEdit(asg);
            setShowExamForm(true);
          }}
          onDeleteAssignment={handleDeleteAssignment}
          onSelectAssignment={(asg) => {
            setSelectedExamForDetails(asg);
            const sub = submissions.find(
              (s) => s.assignmentId === asg.id && 
              (!currentStudentName || (s.studentName || '').toLowerCase().trim() === currentStudentName.toLowerCase().trim())
            );
            setSelectedSubmissionForDetails(sub || null);
          }}
          onSubmitWork={(asg) => {
            setSelectedExamForDetails(asg);
            setSelectedSubmissionForDetails(null);
          }}
          onStartQuiz={(asg) => {
            if (asg.quizData) {
              setActiveQuizTaker(asg.quizData);
            }
          }}
          onViewSubmissions={(asg) => {
            setSelectedExamForDetails(asg);
            const sub = submissions.find((s) => s.assignmentId === asg.id);
            setSelectedSubmissionForDetails(sub || null);
          }}
        />
      )}

      {subTab === 'assignments' && activeView === 'grades' && (
        <ExamResults
          students={students}
          rubricScores={rubricScores}
          onUpdateRubric={onUpdateRubric}
          userRole={userRole}
          currentStudentName={currentStudentName}
        />
      )}

      {subTab === 'admin_dashboard' && isTeacherOrAdmin && (
        <AdminQuizzesDashboard
          userRole={userRole}
          quizzes={customAssignments.filter((a) => a.type === 'quiz' && a.quizData).map((a) => a.quizData as QuizAssignment)}
          onSaveQuiz={handleSaveQuiz}
          onDeleteQuiz={(quizId) => {
            setCustomAssignments((prev) => prev.filter((a) => a.id !== quizId && a.quizData?.id !== quizId));
          }}
          onTakeQuiz={(quiz) => {
            setActiveQuizTaker(quiz);
          }}
        />
      )}

      {/* Assignment Create/Edit Modal */}
      {showExamForm && (
        <ExamForm
          assignment={selectedExamForEdit}
          onSave={handleSaveAssignment}
          onCancel={() => {
            setShowExamForm(false);
            setSelectedExamForEdit(null);
          }}
        />
      )}

      {/* Assignment Details & Grading Modal */}
      {selectedExamForDetails && (
        <ExamDetails
          assignment={selectedExamForDetails}
          submission={selectedSubmissionForDetails}
          userRole={userRole}
          currentStudentName={currentStudentName}
          onGradeSubmission={handleGradeSubmission}
          onClose={() => {
            setSelectedExamForDetails(null);
            setSelectedSubmissionForDetails(null);
          }}
        />
      )}

      {/* Quiz Creator Modal */}
      {showQuizCreatorModal && (
        <QuizCreatorModal
          isOpen={showQuizCreatorModal}
          initialData={editingQuizData}
          onClose={() => {
            setShowQuizCreatorModal(false);
            setEditingQuizData(null);
          }}
          onSaveQuiz={handleSaveQuiz}
        />
      )}

      {/* Quiz Taker View */}
      {activeQuizTaker && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm overflow-y-auto p-4 flex justify-center items-center">
          <div className="w-full max-w-3xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl overflow-hidden">
            <QuizTakerView
              quiz={activeQuizTaker}
              currentStudentName={currentStudentName || 'Student Candidate'}
              onComplete={handleQuizSubmissionComplete}
              onClose={() => setActiveQuizTaker(null)}
            />
          </div>
        </div>
      )}
    </div>
  );
};
