import React from 'react';
import { ReportsTab as ReportsLegacyView, ReportsTabProps } from '../../components/ReportsTab';

export interface ReportsPageProps extends ReportsTabProps {}

export const ReportsPage: React.FC<ReportsPageProps> = (props) => {
  return <ReportsLegacyView {...props} />;
};

export default ReportsPage;
