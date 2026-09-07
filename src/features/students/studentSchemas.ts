export interface StudentSummaryData {
  name: string;
  rate: number;
  attended: number;
  totalDays: number;
  avgScore: number | null;
  note?: string;
  photoUrl?: string;
  levelId?: string;
  attendanceByDay: Record<string, { present: boolean; timestamp?: string; score?: string }>;
}

export type StudentFilterStatus = 'all' | 'satisfactory' | 'at_risk' | 'honor_roll' | 'perfect';
export type StudentSortOption = 'name_asc' | 'name_desc' | 'rate_desc' | 'rate_asc' | 'score_desc';

export const ACADEMIC_THRESHOLDS = {
  HONOR_ROLL_SCORE: 85,
  SATISFACTORY_ATTENDANCE: 75,
  CRITICAL_ATTENDANCE: 50,
};
