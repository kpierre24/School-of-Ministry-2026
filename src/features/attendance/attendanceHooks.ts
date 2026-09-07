import { useState, useEffect, useCallback, useMemo } from 'react';
import { attendanceService } from '../../services/attendanceService';
import { AttendanceStatus, AttendanceCorrectionRequest, AttendanceAuditEntry } from '../../types/attendance';
import { ClassDay } from '../../types';

export function useAttendanceState(initialStudents: any[] = [], initialClassDays: ClassDay[] = []) {
  const [students, setStudents] = useState<any[]>(initialStudents);
  const [classDays, setClassDays] = useState<ClassDay[]>(initialClassDays);
  const [lockedSessions, setLockedSessions] = useState<Record<string, any>>({});
  const [correctionRequests, setCorrectionRequests] = useState<AttendanceCorrectionRequest[]>([]);
  const [auditLogs, setAuditLogs] = useState<AttendanceAuditEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [attRes, reqRes, auditRes] = await Promise.all([
        attendanceService.getAttendance(),
        attendanceService.getCorrectionRequests(),
        attendanceService.getAuditHistory()
      ]);
      setLockedSessions(attRes.sessionLocks || {});
      setCorrectionRequests(reqRes.requests || []);
      setAuditLogs(auditRes.logs || []);
    } catch (e) {
      console.error('Failed to load attendance metadata', e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const atRiskStudents = useMemo(() => {
    return students.filter(s => {
      const rate = typeof s.attendanceRate === 'number' ? s.attendanceRate : (typeof s.rate === 'number' ? s.rate : 0);
      return rate < 75;
    });
  }, [students]);

  return {
    students,
    setStudents,
    classDays,
    setClassDays,
    lockedSessions,
    correctionRequests,
    auditLogs,
    atRiskStudents,
    isLoading,
    refreshAttendanceMetadata: loadData
  };
}

