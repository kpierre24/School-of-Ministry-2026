import { AttendanceStatus, ATTENDANCE_STATUS_LIST } from '../../types/attendance';
import { ClassDay } from '../../types';

export { ATTENDANCE_STATUS_LIST };
export type { AttendanceStatus };

export interface AttendancePolicyThresholds {
  satisfactory: number; // 75%
  atRiskWarning: number; // < 75%
  critical: number; // <= 50%
}

export const ATTENDANCE_POLICY: AttendancePolicyThresholds = {
  satisfactory: 75,
  atRiskWarning: 74.99,
  critical: 50,
};

export interface SessionLockStatus {
  isLocked: boolean;
  lockedAt?: string;
  lockedBy?: string;
  deadlineHours?: number;
}

