import React from 'react';
import { ExamsTab as ExamsLegacyView, ExamsTabProps } from '../../components/ExamsTab';

export interface ExamsPageProps extends Partial<ExamsTabProps> {
  students?: ExamsTabProps['students'];
  allQuizSheets?: ExamsTabProps['allQuizSheets'];
  rubricScores?: ExamsTabProps['rubricScores'];
  onUpdateRubric?: ExamsTabProps['onUpdateRubric'];
}

export const ExamsPage: React.FC<ExamsPageProps> = (props) => {
  return (
    <ExamsLegacyView
      students={props.students || []}
      allQuizSheets={props.allQuizSheets || []}
      rubricScores={props.rubricScores || {}}
      onUpdateRubric={props.onUpdateRubric || (() => {})}
      customAssignments={props.customAssignments || []}
      setCustomAssignments={props.setCustomAssignments || (() => {})}
      submissions={props.submissions || []}
      setSubmissions={props.setSubmissions || (() => {})}
      {...props}
    />
  );
};

export default ExamsPage;
