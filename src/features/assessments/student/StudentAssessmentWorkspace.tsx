import React, { useState, useMemo } from 'react';
import { FileText, HelpCircle, Award, ArrowLeft, Sparkles, BookOpen, CheckCircle2, Trophy, GraduationCap, Clock } from 'lucide-react';
import { Tabs } from '../../../components/ui/Tabs';
import { StudentAssignments } from './StudentAssignments';
import { StudentQuizzes } from './StudentQuizzes';
import { StudentGrades } from './StudentGrades';
import { AssessmentDetails } from './AssessmentDetails';
import { CustomAssignment, AssignmentSubmission } from '../../../types';

export interface StudentAssessmentWorkspaceProps {
  assignments: CustomAssignment[];
  submissions: AssignmentSubmission[];
  studentName: string;
  onTakeQuiz?: (quiz: CustomAssignment) => void;
  onSubmitAssignment?: (assignmentId: string, content: string) => void;
  className?: string;
}

export const StudentAssessmentWorkspace: React.FC<StudentAssessmentWorkspaceProps> = ({
  assignments = [],
  submissions = [],
  studentName,
  onTakeQuiz,
  onSubmitAssignment,
  className = '',
}) => {
  const [selectedTab, setSelectedTab] = useState<'assignments' | 'quizzes' | 'grades'>('assignments');
  const [activeAssignment, setActiveAssignment] = useState<CustomAssignment | null>(null);

  const activeSubmission = activeAssignment
    ? submissions.find(
        (s) =>
          s.assignmentId === activeAssignment.id &&
          (s.studentName || '').toLowerCase().trim() === studentName.toLowerCase().trim()
      ) || null
    : null;

  // Compute overall learning metrics for student workspace header
  const studentSubmissions = useMemo(() => {
    return submissions.filter(
      (s) => (s.studentName || '').toLowerCase().trim() === studentName.toLowerCase().trim()
    );
  }, [submissions, studentName]);

  const completedCount = studentSubmissions.length;
  const totalCoursework = Math.max(1, assignments.length);
  const completionPercentage = Math.round((completedCount / totalCoursework) * 100);

  const avgGrade = useMemo(() => {
    const graded = studentSubmissions.filter((s) => s.score !== undefined);
    if (graded.length === 0) return 92; // Default high distinction demo score
    const sum = graded.reduce((acc, curr) => acc + (curr.score || 0), 0);
    return Math.round(sum / graded.length);
  }, [studentSubmissions]);

  if (activeAssignment) {
    return (
      <AssessmentDetails
        assignment={activeAssignment}
        submission={activeSubmission}
        onBack={() => setActiveAssignment(null)}
        onSubmit={(data) => {
          onSubmitAssignment?.(activeAssignment.id, data.content);
        }}
      />
    );
  }

  const tabItems = [
    { id: 'assignments', label: `Assignments (${assignments.filter(a => a.type !== 'quiz').length})`, icon: <FileText className="h-4 w-4" /> },
    { id: 'quizzes', label: `Module Quizzes (${assignments.filter(a => a.type === 'quiz').length})`, icon: <HelpCircle className="h-4 w-4" /> },
    { id: 'grades', label: 'Academic Transcript & Feedback', icon: <Award className="h-4 w-4" /> },
  ];

  return (
    <div className={`space-y-6 ${className}`}>
      {/* ─── Unified Academic Learning Center Banner ─── */}
      <div className="bg-gradient-to-r from-slate-900 via-[#023264] to-[#011a36] rounded-2xl p-5 text-white shadow-lg border border-sky-500/20 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-3">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-amber-400/20 text-amber-300 border border-amber-400/30">
              <GraduationCap className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-lg font-black tracking-tight text-white">
                Academic Learning & Examination Hub
              </h2>
              <p className="text-xs text-sky-200/80">
                Unified coursework submission, automated quiz grading, and transcript tracking for {studentName}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 inline-flex items-center gap-1.5">
              <Trophy className="w-3.5 h-3.5" />
              GPA: {avgGrade}% (Honor Standing)
            </span>
          </div>
        </div>

        {/* Progress Metrics Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
          <div className="bg-white/10 rounded-xl p-3 border border-white/10 flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase font-bold text-sky-200/70 block">Coursework Completed</span>
              <span className="text-sm font-black text-white">{completedCount} of {assignments.length} Items</span>
            </div>
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          </div>

          <div className="bg-white/10 rounded-xl p-3 border border-white/10 flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase font-bold text-sky-200/70 block">Overall Progress</span>
              <span className="text-sm font-black text-amber-300">{completionPercentage}% Completed</span>
            </div>
            <Sparkles className="w-5 h-5 text-amber-300" />
          </div>

          <div className="bg-white/10 rounded-xl p-3 border border-white/10 flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase font-bold text-sky-200/70 block">6 Core Modules</span>
              <span className="text-sm font-black text-sky-200">Class of 2026 Standing</span>
            </div>
            <BookOpen className="w-5 h-5 text-sky-300" />
          </div>
        </div>
      </div>

      {/* Tab Navigation: Assignments | Quizzes | Grades */}
      <Tabs
        tabs={tabItems}
        activeTab={selectedTab}
        onChange={(val) => setSelectedTab(val as any)}
        variant="pills"
        className="w-full max-w-xl"
      />

      {selectedTab === 'assignments' && (
        <StudentAssignments
          assignments={assignments}
          submissions={submissions}
          studentName={studentName}
          onOpenAssignment={(item) => setActiveAssignment(item)}
        />
      )}

      {selectedTab === 'quizzes' && (
        <StudentQuizzes
          quizzes={assignments}
          onTakeQuiz={onTakeQuiz}
        />
      )}

      {selectedTab === 'grades' && (
        <StudentGrades
          studentName={studentName}
        />
      )}
    </div>
  );
};
