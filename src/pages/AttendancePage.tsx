import React, { Suspense } from 'react';
import { AttendanceWorkspace as AttendanceTab } from '../features/attendance/AttendanceWorkspace';
import { ErrorBoundary } from '../components/ErrorBoundary';

export interface AttendancePageProps {
  appUser: any;
  currentStudentPortalData: any;
  classDays: any[];
  rubricScores: Record<string, any>;
  onUpdateStudentPhoto: (name: string, photoUrl: string) => void;
  onRequestTranscript: (student: any) => void;
  onRequestCertificate: (student: any) => void;
  atRiskThreshold: number;
  satisfactoryThreshold: number;
  records: any[];
  uniqueStudents: any[];
  excusedAbsences: Record<string, boolean>;
  studentPhotos: Record<string, string>;
  studentNotes: Record<string, string>;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  dateRangeFilter: { start: string; end: string };
  setDateRangeFilter: (range: { start: string; end: string }) => void;
  levelFilter: string;
  setLevelFilter: (level: string) => void;
  studentLevels: Record<string, string>;
  onToggleAttendance: (studentName: string, dayId: string, currentStatus?: string) => void;
  onSaveManualRecord: (studentName: string, dayId: string, status: string, notes?: string) => void;
  onSaveManualCheckin: (studentName: string, dayId: string) => void;
  onDeleteClassDay: (dayId: string) => void;
  onDeleteRecord: (recordId: string) => void;
  onOpenClassDaysModal: () => void;
  onOpenLiveCheckin: (dayId?: string) => void;
  onOpenReportModal: (filter?: string) => void;
  onOpenMobileDownloadModal: () => void;
  selectedDayId: string | null;
  setSelectedDayId: (dayId: string | null) => void;
  onOpenPresentation: () => void;
  attendanceViewMode: any;
  setAttendanceViewMode: (mode: any) => void;
  onResetStudentPassword?: (studentName: string) => Promise<boolean>;
  [key: string]: any;
}

export const AttendancePage: React.FC<AttendancePageProps> = (props) => {
  return (
    <div className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs flex flex-col w-full">
      <Suspense fallback={<div className="flex-1 flex items-center justify-center text-xs text-slate-400">Loading...</div>}>
        <ErrorBoundary label="Attendance Tab">
          <AttendanceTab {...(props as any)} />
        </ErrorBoundary>
      </Suspense>
    </div>
  );
};

export default AttendancePage;
