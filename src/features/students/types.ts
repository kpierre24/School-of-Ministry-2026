import { StudentSummary, AcademicLevel } from '../../types';

export type StudentAttendanceFilter = 'all' | 'satisfactory' | 'at_risk' | 'critical';
export type StudentGradeFilter = 'all' | 'honor_roll' | 'satisfactory' | 'at_risk';
export type StudentSortField = 'name' | 'rate' | 'avgScore' | 'attended';
export type StudentSortDirection = 'asc' | 'desc';

export interface StudentFilterOptions {
  searchQuery: string;
  levelId: string;
  attendanceFilter: StudentAttendanceFilter;
  gradeFilter: StudentGradeFilter;
  cohortId?: string;
  sortBy: StudentSortField;
  sortDirection: StudentSortDirection;
}

export interface StudentFormData {
  id?: string;
  name: string;
  studentNumber?: string;
  email?: string;
  phone?: string;
  levelId: string;
  enrolledModule?: string;
  photoUrl?: string;
  note?: string;
  cohortId?: string;
}

export interface StudentStats {
  total: number;
  satisfactoryCount: number;
  atRiskCount: number;
  criticalCount: number;
  honorRollCount: number;
  averageAttendanceRate: number;
  averageGradeScore: number;
}
