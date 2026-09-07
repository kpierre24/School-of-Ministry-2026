import React from 'react';
import { PaymentTab as PaymentLegacyView } from '../../components/PaymentTab';
import { PaymentRecord } from '../../types';

export interface PaymentsPageProps {
  students?: { name: string; email?: string }[];
  currentUserRole?: 'student' | 'teacher' | 'admin' | 'guest';
  currentUserName?: string;
  paymentRecords?: PaymentRecord[];
  onOpenOnlinePayment?: () => void;
  onOpenSettings?: () => void;
}

export const PaymentsPage: React.FC<PaymentsPageProps> = (props) => {
  return (
    <div className="w-full">
      <PaymentLegacyView
        availableStudents={props.students || []}
        isAdmin={props.currentUserRole === 'admin' || props.currentUserRole === 'teacher'}
        userRole={props.currentUserRole}
        currentStudentName={props.currentUserName}
        payments={props.paymentRecords || []}
      />
    </div>
  );
};

export default PaymentsPage;

