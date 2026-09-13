import React, { Suspense } from 'react';
import { LazyNotesTab } from '../components/tabs';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { DashboardSkeleton } from '../components/DashboardSkeleton';

export interface NotesPageProps {
  currentStudentName?: string;
  userRole?: string;
  availableClassDays?: any[];
  onNavigateTab?: (tab: string) => void;
}

export const NotesPage: React.FC<NotesPageProps> = (props) => {
  return (
    <Suspense fallback={<DashboardSkeleton label="Loading Bible Study Notes & Multi-version Scriptures..." />}>
      <ErrorBoundary label="Student Notes & AMP Bible Tab">
        <LazyNotesTab
          currentStudentName={props.currentStudentName || 'Student'}
          userRole={props.userRole}
          availableClassDays={props.availableClassDays || []}
          onNavigateTab={props.onNavigateTab}
        />
      </ErrorBoundary>
    </Suspense>
  );
};

export default NotesPage;
