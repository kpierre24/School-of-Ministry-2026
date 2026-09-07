import React from 'react';
import { StudentsTab as StudentsLegacyView } from '../../components/StudentsTab';
import { StudentSummaryData } from './studentSchemas';

export interface StudentsPageProps {
  students: StudentSummaryData[];
  classDays?: { id: string; name: string }[];
  onSelectStudentForTranscript: (student: StudentSummaryData) => void;
  onSelectStudentForCertificate: (student: StudentSummaryData) => void;
  onSelectStudentForEmail: (student: StudentSummaryData) => void;
  onDeleteStudent?: (studentName: string) => void;
  rubricScores?: Record<string, { participation: number; scripture: number; assignment: number }>;
  onUpdateRubric?: (studentName: string, key: 'participation' | 'scripture' | 'assignment', val: number) => void;
  studentNotes: Record<string, string>;
  onUpdateNote: (studentName: string, note: string) => void;
  studentPhotos?: Record<string, string>;
  onUpdateStudentPhoto?: (studentName: string, photoDataUrl: string) => void;
  onRefreshFromSheets?: () => void;
  onOpenBatchEmailModal?: () => void;
  onOpenReportModal?: () => void;
  atRiskThreshold?: number;
  satisfactoryThreshold?: number;
}

export const StudentsPage: React.FC<StudentsPageProps> = (props) => {
  return (
    <StudentsLegacyView
      atRiskThreshold={props.atRiskThreshold ?? 75}
      satisfactoryThreshold={props.satisfactoryThreshold ?? 75}
      {...props}
    />
  );
};

export default StudentsPage;

