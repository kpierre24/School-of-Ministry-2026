import React, { useState } from 'react';
import { FileText, HelpCircle, Award, ArrowLeft } from 'lucide-react';
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
    { id: 'assignments', label: 'Assignments', icon: <FileText className="h-4 w-4" /> },
    { id: 'quizzes', label: 'Quizzes', icon: <HelpCircle className="h-4 w-4" /> },
    { id: 'grades', label: 'Grades', icon: <Award className="h-4 w-4" /> },
  ];

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Tab Navigation: Assignments | Quizzes | Grades */}
      <Tabs
        tabs={tabItems}
        activeTab={selectedTab}
        onChange={(val) => setSelectedTab(val as any)}
        variant="pills"
        className="w-full max-w-md"
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
