import { ReportColumn, ReportSummaryMetric } from '../../lib/reportExporter';
import { ReportType } from '../../components/ReportsTab';

export type { ReportColumn, ReportSummaryMetric, ReportType };

export interface ReportFilterOptions {
  reportType: ReportType;
  searchQuery: string;
  startDate?: string;
  endDate?: string;
}

export const REPORT_TYPE_LABELS: Record<ReportType, string> = {
  enrollment: 'Student Enrollment Roster',
  attendance: 'Attendance & Class Participation',
  academic: 'Academic Grade Distribution',
  outstanding_payments: 'Outstanding Tuition Balances',
  payment_history: 'Payment Transaction Ledger',
  assignment_completion: 'Assignment Completion Tracking',
  student_progress: 'Individual Student Progress Summary',
  ministry_requirements: 'Ministry Internship Requirements',
  instructor_workload: 'Faculty Teaching Workload',
  at_risk: 'At-Risk Academic & Attendance Alert Report',
};
