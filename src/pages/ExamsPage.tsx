import React, { Suspense } from 'react';
import { LazyExamsTab } from '../components/tabs';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { DashboardSkeleton } from '../components/DashboardSkeleton';

export interface ExamsPageProps {
  [key: string]: any;
}

export const ExamsPage: React.FC<ExamsPageProps> = (props) => {
  return (
    <Suspense fallback={<DashboardSkeleton label="Loading Quizzes & Gradebook Matrix..." />}>
      <ErrorBoundary label="Exams & Grading Workspace">
        <LazyExamsTab {...(props as any)} />
      </ErrorBoundary>
    </Suspense>
  );
};

export default ExamsPage;
