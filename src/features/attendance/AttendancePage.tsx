import React from 'react';
import { AttendanceWorkspace, AttendanceTabProps } from './AttendanceWorkspace';

export interface AttendancePageProps extends AttendanceTabProps {}

export const AttendancePage: React.FC<AttendancePageProps> = (props) => {
  return <AttendanceWorkspace {...props} />;
};

export default AttendancePage;
