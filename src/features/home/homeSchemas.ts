import { StudentSummary, PaymentRecord, ClassDay } from '../../types';
import { AppUser } from '../../lib/userAuth';

export type { AppUser, StudentSummary, PaymentRecord, ClassDay };

export interface DashboardMetricSummary {
  totalStudents: number;
  averageAttendanceRate: number;
  atRiskAttendanceCount: number;
  totalTuitionCollected: number;
  totalTuitionBilled: number;
  totalClassesHeld: number;
}

export interface QuickNavAction {
  id: string;
  title: string;
  description: string;
  targetTab: string;
  iconName: string;
}
