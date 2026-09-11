import React, { Suspense } from 'react';
import { FinancePage as InstitutionalFinancePage } from '../features/finance/components/FinancePage';
import { LazyPaymentTab } from '../components/tabs';
import { ErrorBoundary } from '../components/ErrorBoundary';

export interface FinancePageProps {
  appUser?: any;
  userRole?: string;
  availableStudents?: Array<{ name: string; email: string }>;
  currentStudentName?: string;
  payments?: any[];
  setPayments?: (payments: any[] | ((prev: any[]) => any[])) => void;
  onDeleteStudent?: (name: string) => void;
  onRestoreStudent?: (name: string) => void;
  [key: string]: any;
}

export const FinancePage: React.FC<FinancePageProps> = (props) => {
  const role = props.userRole || props.appUser?.role;
  const isStudent = role === 'student';

  if (!isStudent) {
    return (
      <ErrorBoundary label="Finance Page">
        <InstitutionalFinancePage />
      </ErrorBoundary>
    );
  }

  return (
    <Suspense fallback={<div className="flex-1 flex items-center justify-center text-xs text-slate-400">Loading...</div>}>
      <ErrorBoundary label="Payments Tab">
        <LazyPaymentTab
          availableStudents={props.availableStudents || []}
          isAdmin={false}
          userRole={role}
          currentStudentName={props.currentStudentName || props.appUser?.studentName || props.appUser?.name}
          payments={props.payments || []}
          setPayments={props.setPayments || (() => {})}
          onDeleteStudent={props.onDeleteStudent || (() => {})}
          onRestoreStudent={props.onRestoreStudent || (() => {})}
        />
      </ErrorBoundary>
    </Suspense>
  );
};

export const PaymentsPage = FinancePage;
export default FinancePage;
