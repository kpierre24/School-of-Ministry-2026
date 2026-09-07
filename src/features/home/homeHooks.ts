import { useState, useMemo } from 'react';
import { StudentSummary, PaymentRecord, ClassDay } from '../../types';
import { homeService } from './homeService';

export function useHomeDashboardState(
  students: StudentSummary[] = [],
  payments: PaymentRecord[] = [],
  classDays: ClassDay[] = []
) {
  const [showFacultyModal, setShowFacultyModal] = useState(false);
  const [showEnrollmentModal, setShowEnrollmentModal] = useState(false);
  const [selectedDashboardSubTab, setSelectedDashboardSubTab] = useState<'overview' | 'academics' | 'finance' | 'admin'>('overview');

  const metrics = useMemo(() => {
    return homeService.computeDashboardMetrics(students, payments, classDays);
  }, [students, payments, classDays]);

  return {
    metrics,
    showFacultyModal,
    setShowFacultyModal,
    showEnrollmentModal,
    setShowEnrollmentModal,
    selectedDashboardSubTab,
    setSelectedDashboardSubTab,
  };
}
