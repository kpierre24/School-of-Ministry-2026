import React, { Suspense } from 'react';
import { LazyCoursesTab } from '../components/tabs';
import { ErrorBoundary } from '../components/ErrorBoundary';

export interface CoursesPageProps {
  userRole?: string;
  courses: any[];
  setCourses: (courses: any[] | ((prev: any[]) => any[])) => void;
}

export const CoursesPage: React.FC<CoursesPageProps> = (props) => {
  return (
    <Suspense fallback={<div className="flex-1 flex items-center justify-center text-xs text-slate-400">Loading...</div>}>
      <ErrorBoundary label="Courses Tab">
        <LazyCoursesTab {...(props as any)} />
      </ErrorBoundary>
    </Suspense>
  );
};

export default CoursesPage;
