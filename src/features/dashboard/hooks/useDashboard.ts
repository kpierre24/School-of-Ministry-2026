import { useMemo } from 'react';
import { StudentSummary, ClassDay, CustomAssignment } from '../../../types';
import { computeDashboardMetrics, DashboardMetrics } from '../services/dashboardService';

export interface UseDashboardProps {
  students?: StudentSummary[];
  classDays?: ClassDay[];
  assignments?: CustomAssignment[];
}

export function useDashboard({
  students = [],
  classDays = [],
  assignments = [],
}: UseDashboardProps = {}) {
  const metrics: DashboardMetrics = useMemo(() => {
    return computeDashboardMetrics(students, classDays, assignments);
  }, [students, classDays, assignments]);

  const atRiskStudents = useMemo(() => {
    return students.filter((s) => (s.rate ?? 100) < 75);
  }, [students]);

  const honorRollStudents = useMemo(() => {
    return students.filter((s) => (s.avgScore ?? 0) >= 85);
  }, [students]);

  return {
    metrics,
    atRiskStudents,
    honorRollStudents,
  };
}
