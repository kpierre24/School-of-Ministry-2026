import React from 'react';
import { ScheduleTab as ScheduleLegacyView, ScheduleTabProps } from '../../components/ScheduleTab';

export interface SchedulePageProps extends Partial<ScheduleTabProps> {
  classDays?: ScheduleTabProps['classDays'];
  onTakeAttendanceForDay?: ScheduleTabProps['onTakeAttendanceForDay'];
}

export const SchedulePage: React.FC<SchedulePageProps> = (props) => {
  return (
    <ScheduleLegacyView
      classDays={props.classDays || []}
      onTakeAttendanceForDay={props.onTakeAttendanceForDay || (() => {})}
      {...props}
    />
  );
};

export default SchedulePage;
