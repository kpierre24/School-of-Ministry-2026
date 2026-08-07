import { useCallback } from 'react';
import { AttendanceByDay, mergeAttendanceRecords } from '../lib/attendance';

export type ToggleStatus = 'present' | 'absent' | 'excused';

export function useAttendance() {
  /**
   * toggleAttendance is a small helper that given a student attendanceByDay map
   * and a dayId + status will return a new copy with the updated value.
   */
  const toggleAttendance = useCallback((
    attendanceByDay: AttendanceByDay,
    dayId: string,
    status: ToggleStatus
  ): AttendanceByDay => {
    const next = { ...attendanceByDay };
    if (status === 'present') {
      next[dayId] = { ...(next[dayId] || {}), present: true, timestamp: new Date().toISOString() };
    } else if (status === 'absent') {
      next[dayId] = { ...(next[dayId] || {}), present: false, timestamp: new Date().toISOString() };
    } else if (status === 'excused') {
      next[dayId] = { ...(next[dayId] || {}), present: false, timestamp: new Date().toISOString(), score: 'Excused' };
    }
    return next;
  }, []);

  const mergeRecords = useCallback((local: AttendanceByDay, sheets: AttendanceByDay, policy: 'manual' | 'sheets' | 'prompt' = 'manual') => {
    return mergeAttendanceRecords(local, sheets, policy);
  }, []);

  return { toggleAttendance, mergeRecords };
}

export default useAttendance;
