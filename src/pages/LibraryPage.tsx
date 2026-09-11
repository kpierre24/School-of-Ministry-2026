import React, { Suspense } from 'react';
import { LazyLibraryTab } from '../components/tabs';
import { ErrorBoundary } from '../components/ErrorBoundary';

export interface LibraryPageProps {
  userRole?: string;
  resources: any[];
  setResources: (resources: any[] | ((prev: any[]) => any[])) => void;
  classroomMedia: any[];
  setClassroomMedia: (media: any[] | ((prev: any[]) => any[])) => void;
  studentName?: string;
  onOpenNotes?: () => void;
  onOpenInBible?: () => void;
  onOpenDiagnostics?: () => void;
}

export const LibraryPage: React.FC<LibraryPageProps> = (props) => {
  return (
    <Suspense fallback={<div className="flex-1 flex items-center justify-center text-xs text-slate-400">Loading...</div>}>
      <ErrorBoundary label="Library Tab">
        <LazyLibraryTab {...(props as any)} />
      </ErrorBoundary>
    </Suspense>
  );
};

export default LibraryPage;
