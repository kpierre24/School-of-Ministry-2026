import React, { Suspense } from 'react';
import { ExaminationsPage } from '../features/examinations';
import { LazyExamsTab } from '../components/tabs';
import { ErrorBoundary } from '../components/ErrorBoundary';

export interface ExamsPageProps {
  students: any[];
  allQuizSheets: any[];
  rubricScores: Record<string, any>;
  onUpdateRubric: (studentName: string, rubric: any, val?: any) => void;
  userRole?: string;
  currentStudentName?: string;
  onNotificationCreated?: (notif: any) => void;
  customAssignments: any[];
  setCustomAssignments: (assignments: any[] | ((prev: any[]) => any[])) => void;
  submissions: any[];
  setSubmissions: (submissions: any[] | ((prev: any[]) => any[])) => void;
  googleUser?: any;
  googleToken?: string | null;
  isLoggingIn?: boolean;
  onGoogleLogin?: () => void;
  onGoogleLogout?: () => void;
  sheetUrl?: string;
  setSheetUrl?: (url: string) => void;
  onLoadSheets?: (url: string) => void;
  isLoadingSheets?: boolean;
  lastSyncedTime?: any;
  recentSheets?: string[];
  onRemoveRecentSheet?: (sheet: string) => void;
}

export const ExamsPage: React.FC<ExamsPageProps> = (props) => {
  return (
    <Suspense fallback={<div className="flex-1 flex items-center justify-center text-xs text-slate-400">Loading Examinations...</div>}>
      <ErrorBoundary label="Examinations Page">
        <ExaminationsPage {...(props as any)} />
      </ErrorBoundary>
    </Suspense>
  );
};


export const GradesPage = ExamsPage;
export default ExamsPage;
