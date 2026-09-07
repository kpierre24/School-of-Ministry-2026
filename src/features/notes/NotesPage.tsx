import React from 'react';
import { StudentNotesBibleTab as StudentNotesBibleLegacyView, StudentNotesBibleTabProps } from '../../components/StudentNotesBibleTab';

export interface NotesPageProps extends StudentNotesBibleTabProps {}

export const NotesPage: React.FC<NotesPageProps> = (props) => {
  return <StudentNotesBibleLegacyView {...props} />;
};

export default NotesPage;
