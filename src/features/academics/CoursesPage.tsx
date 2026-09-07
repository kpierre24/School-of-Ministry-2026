import React from 'react';
import { CoursesTab as CoursesLegacyView, CoursesTabProps } from '../../components/CoursesTab';

export interface CoursesPageProps extends CoursesTabProps {}

export const CoursesPage: React.FC<CoursesPageProps> = (props) => {
  return <CoursesLegacyView {...props} />;
};

export default CoursesPage;
