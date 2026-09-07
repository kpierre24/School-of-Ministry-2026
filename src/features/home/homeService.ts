import { StudentSummary, PaymentRecord, ClassDay } from '../../types';
import { DashboardMetricSummary } from './homeSchemas';

export class HomeService {
  /**
   * Aggregate portal metrics across students, payments, and class days
   */
  public computeDashboardMetrics(
    students: StudentSummary[] = [],
    payments: PaymentRecord[] = [],
    classDays: ClassDay[] = []
  ): DashboardMetricSummary {
    const totalStudents = students.length;

    let totalAttendancePercentageSum = 0;
    let atRiskCount = 0;

    students.forEach(student => {
      const rate = typeof student.rate === 'number' ? student.rate : 100;
      totalAttendancePercentageSum += rate;
      if (rate < 75) {
        atRiskCount++;
      }
    });

    const averageAttendanceRate = totalStudents > 0 
      ? Math.round(totalAttendancePercentageSum / totalStudents) 
      : 100;

    const totalTuitionCollected = payments
      .reduce((acc, p) => acc + (p.amountPaid || 0), 0);

    const totalTuitionBilled = payments
      .reduce((acc, p) => acc + (p.totalTuition || 0), 0);

    return {
      totalStudents,
      averageAttendanceRate,
      atRiskAttendanceCount: atRiskCount,
      totalTuitionCollected,
      totalTuitionBilled,
      totalClassesHeld: classDays.length,
    };
  }
}

export const homeService = new HomeService();
