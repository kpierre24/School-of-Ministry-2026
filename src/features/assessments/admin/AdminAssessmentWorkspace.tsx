import React, { useState } from 'react';
import { BookOpen, FileText, Sliders, BarChart3, Plus, RefreshCw } from 'lucide-react';
import { Tabs } from '../../../components/ui/Tabs';
import { Badge } from '../../../components/ui/Badge';
import { Gradebook } from '../teacher/Gradebook';
import { TeacherAssignments } from '../teacher/TeacherAssignments';
import { QuizManagement } from '../teacher/QuizManagement';
import { AssessmentManagement } from './AssessmentManagement';
import { AssessmentReports } from './AssessmentReports';
import { CustomAssignment, AssignmentSubmission, StudentSummary } from '../../../types';

export interface AdminAssessmentWorkspaceProps {
  assignments: CustomAssignment[];
  submissions: AssignmentSubmission[];
  students: StudentSummary[];
  onCreateAssignment?: () => void;
  onCreateQuiz?: () => void;
  onSyncGoogleSheets?: () => void;
  className?: string;
}

export const AdminAssessmentWorkspace: React.FC<AdminAssessmentWorkspaceProps> = ({
  assignments = [],
  submissions = [],
  students = [],
  onCreateAssignment,
  onCreateQuiz,
  onSyncGoogleSheets,
  className = '',
}) => {
  const [selectedTab, setSelectedTab] = useState<
    'gradebook' | 'assignments' | 'quizzes' | 'manage' | 'reports'
  >('gradebook');

  const tabItems = [
    { id: 'gradebook', label: 'Gradebook', icon: <BookOpen className="h-4 w-4" /> },
    { id: 'assignments', label: 'Assignments', icon: <FileText className="h-4 w-4" /> },
    { id: 'quizzes', label: 'Quizzes', icon: <FileText className="h-4 w-4" /> },
    { id: 'manage', label: 'Manage Assessments', icon: <Sliders className="h-4 w-4" /> },
    { id: 'reports', label: 'Reports', icon: <BarChart3 className="h-4 w-4" /> },
  ];

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Tab Navigation with Progressive Disclosure for Manage Assessments */}
      <Tabs
        tabs={tabItems}
        activeTab={selectedTab}
        onChange={(v) => setSelectedTab(v as any)}
        variant="pills"
        className="w-full max-w-2xl"
      />

      {selectedTab === 'gradebook' && (
        <Gradebook students={students} />
      )}

      {selectedTab === 'assignments' && (
        <TeacherAssignments
          assignments={assignments}
          submissions={submissions}
          onCreateAssignment={onCreateAssignment}
        />
      )}

      {selectedTab === 'quizzes' && (
        <QuizManagement
          quizzes={assignments}
          onCreateQuiz={onCreateQuiz}
        />
      )}

      {selectedTab === 'manage' && (
        <AssessmentManagement
          onSyncGoogleSheets={onSyncGoogleSheets}
        />
      )}

      {selectedTab === 'reports' && (
        <AssessmentReports />
      )}
    </div>
  );
};
