import React from 'react';
import { Check, X, ShieldAlert, AlertTriangle, GraduationCap } from 'lucide-react';
import { DataTable, Column } from '../../../components/tables/DataTable';
import { EmptyState, Badge } from '../../../components/ui';
import { StudentSummary, ACADEMIC_LEVELS } from '../../../types';
import { AttendanceStatus } from '../types';
import { getStudentAttendanceStatus } from '../services/attendanceService';

export interface AttendanceTableProps {
  students: StudentSummary[];
  classDayId: string;
  onToggleAttendance: (studentName: string, classDayId: string, status: AttendanceStatus) => void;
  excusedAbsences?: Record<string, Record<string, boolean>>;
  isLocked?: boolean;
  className?: string;
}

export function AttendanceTable({
  students,
  classDayId,
  onToggleAttendance,
  excusedAbsences = {},
  isLocked = false,
  className = '',
}: AttendanceTableProps) {
  const columns: Column<StudentSummary>[] = [
    {
      key: 'name',
      header: 'Student Name',
      render: (student) => (
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--md-primary-container)] font-bold text-xs text-[var(--md-on-primary-container)]">
            {student.photoUrl ? (
              <img src={student.photoUrl} alt={student.name} className="h-full w-full rounded-xl object-cover" />
            ) : (
              student.name.charAt(0).toUpperCase()
            )}
          </div>
          <div>
            <div className="font-bold text-xs text-[var(--md-on-surface)]">{student.name}</div>
            <div className="text-[10px] text-[var(--md-on-surface-variant)]">{student.studentNumber || 'Student ID'}</div>
          </div>
        </div>
      ),
    },
    {
      key: 'levelId',
      header: 'Level',
      render: (student) => {
        const level = ACADEMIC_LEVELS.find((l) => l.id === student.levelId) || ACADEMIC_LEVELS[0];
        return (
          <span className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-bold border ${level.color}`}>
            <GraduationCap className="h-3 w-3" />
            {level.badge}
          </span>
        );
      },
    },
    {
      key: 'overallRate',
      header: 'Overall Rate',
      render: (student) => {
        const rate = student.rate ?? 100;
        const isAtRisk = rate < 75;
        return (
          <div className="flex items-center gap-1 font-bold text-xs">
            <span className={isAtRisk ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'}>
              {rate}%
            </span>
            {isAtRisk && <AlertTriangle className="h-3.5 w-3.5 text-amber-500" aria-label="At Risk" />}
          </div>
        );
      },
    },
    {
      key: 'status',
      header: 'Session Attendance',
      className: 'text-right',
      render: (student) => {
        const status = getStudentAttendanceStatus(student, classDayId, excusedAbsences);

        if (isLocked) {
          return (
            <div className="flex justify-end">
              <Badge variant={status === 'present' ? 'success' : status === 'excused' ? 'warning' : 'danger'}>
                {status.toUpperCase()}
              </Badge>
            </div>
          );
        }

        return (
          <div className="flex items-center justify-end gap-1">
            <button
              type="button"
              onClick={() => onToggleAttendance(student.name, classDayId, 'present')}
              className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-[10px] font-bold transition ${
                status === 'present'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-[var(--md-surface-container-high)] text-[var(--md-on-surface-variant)] hover:bg-emerald-100 dark:hover:bg-emerald-950'
              }`}
            >
              <Check className="h-3 w-3" /> Present
            </button>

            <button
              type="button"
              onClick={() => onToggleAttendance(student.name, classDayId, 'absent')}
              className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-[10px] font-bold transition ${
                status === 'absent'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'bg-[var(--md-surface-container-high)] text-[var(--md-on-surface-variant)] hover:bg-rose-100 dark:hover:bg-rose-950'
              }`}
            >
              <X className="h-3 w-3" /> Absent
            </button>

            <button
              type="button"
              onClick={() => onToggleAttendance(student.name, classDayId, 'excused')}
              className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-[10px] font-bold transition ${
                status === 'excused'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'bg-[var(--md-surface-container-high)] text-[var(--md-on-surface-variant)] hover:bg-amber-100 dark:hover:bg-amber-950'
              }`}
            >
              <ShieldAlert className="h-3 w-3" /> Excused
            </button>
          </div>
        );
      },
    },
  ];

  return (
    <DataTable
      columns={columns}
      data={students}
      keyExtractor={(s) => s.id || s.name}
      emptyState={
        <EmptyState
          title="No students found"
          description="Try adjusting your search query or filters."
          className="py-12"
        />
      }
      className={className}
    />
  );
}
