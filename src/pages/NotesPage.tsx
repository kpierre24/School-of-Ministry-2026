import React from 'react';
import StudentNotesBibleTab from '../components/StudentNotesBibleTab';
import { ErrorBoundary } from '../components/ErrorBoundary';

export interface NotesPageProps {
  currentStudentName?: string;
  userRole?: string;
  availableClassDays?: any[];
  onNavigateTab?: (tab: string) => void;
}

export const NotesPage: React.FC<NotesPageProps> = (props) => {
  return (
    <ErrorBoundary label="Student Notes & AMP Bible Tab">
      <StudentNotesBibleTab
        currentStudentName={props.currentStudentName || 'Student'}
        userRole={props.userRole}
        availableClassDays={props.availableClassDays || []}
        onNavigateTab={props.onNavigateTab}
      />
    </ErrorBoundary>
  );
};

export default NotesPage;
