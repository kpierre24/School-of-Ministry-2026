import React, { Suspense } from 'react';
import { LazyScheduleTab } from '../components/tabs';
import { ErrorBoundary } from '../components/ErrorBoundary';

export interface SchedulePageProps {
  classDays: any[];
  userRole?: string;
  onDeleteClassDay: (dayId: string) => void;
  onClearClassDayRecords: (dayId: string) => void;
  onTakeAttendanceForDay?: (dayId: string) => void;
  schedules: any[];
  setSchedules: (schedules: any[] | ((prev: any[]) => any[])) => void;
  zoomExceptionNote: string;
  setZoomExceptionNote: (note: string) => void;
  hasZoomException: boolean;
  setHasZoomException: (has: boolean) => void;
}

export const SchedulePage: React.FC<SchedulePageProps> = (props) => {
  return (
    <Suspense fallback={<div className="flex-1 flex items-center justify-center text-xs text-slate-400">Loading...</div>}>
      <ErrorBoundary label="Schedule Tab">
        <LazyScheduleTab {...(props as any)} />
      </ErrorBoundary>
    </Suspense>
  );
};

export default SchedulePage;
