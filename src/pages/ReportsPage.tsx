import React from 'react';
import { ReportsTab } from '../components/ReportsTab';
import { ErrorBoundary } from '../components/ErrorBoundary';

export interface ReportsPageProps {
  students: any[];
  attendanceRecords: any[];
  payments: any[];
  courses: any[];
  assignments: any[];
  submissions: any[];
  currentUserRole?: string;
  onRefreshData?: () => Promise<void> | void;
}

export const ReportsPage: React.FC<ReportsPageProps> = (props) => {
  return (
    <ErrorBoundary label="Reports Tab">
      <ReportsTab
        students={props.students}
        attendanceRecords={props.attendanceRecords}
        payments={props.payments}
        courses={props.courses}
        assignments={props.assignments}
        submissions={props.submissions}
        currentUserRole={props.currentUserRole}
        onRefreshData={props.onRefreshData}
      />
    </ErrorBoundary>
  );
};

export default ReportsPage;
