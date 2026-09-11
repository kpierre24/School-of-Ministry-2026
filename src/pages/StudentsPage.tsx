import React, { Suspense } from 'react';
import { LazyStudentsTab } from '../components/tabs';
import { ErrorBoundary } from '../components/ErrorBoundary';

export interface StudentsPageProps {
  classDays: any[];
  students: any[];
  onDeleteStudent: (name: string) => void;
  onSelectStudentForTranscript: (student: any) => void;
  onSelectStudentForCertificate: (student: any) => void;
  onSelectStudentForEmail: (student: any) => void;
  rubricScores: Record<string, any>;
  onUpdateRubric: (studentName: string, rubric: any) => void;
  studentNotes: Record<string, string>;
  onUpdateNote: (name: string, note: string) => void;
  studentPhotos: Record<string, string>;
  onUpdateStudentPhoto: (name: string, photoUrl: string) => void;
  studentLevels: Record<string, string>;
  onUpdateStudentLevel: (name: string, levelId: string) => void;
  onOpenAttendanceReport: (filter?: string) => void;
  atRiskThreshold: number;
  satisfactoryThreshold: number;
  onToggleAttendance: (studentName: string, dayId: string, currentStatus?: string) => void;
  excusedAbsences: Record<string, boolean>;
  appRole?: string;
  onResetPassword?: (studentName: string) => Promise<boolean>;
}

export const StudentsPage: React.FC<StudentsPageProps> = (props) => {
  return (
    <Suspense fallback={<div className="flex-1 flex items-center justify-center text-xs text-slate-400">Loading...</div>}>
      <ErrorBoundary label="Students Tab">
        <LazyStudentsTab {...props} />
      </ErrorBoundary>
    </Suspense>
  );
};

export default StudentsPage;
