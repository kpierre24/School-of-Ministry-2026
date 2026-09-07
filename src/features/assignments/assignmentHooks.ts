import { useState, useMemo } from 'react';
import { CustomAssignment, AssignmentSubmission } from '../../types';
import { assignmentService } from './assignmentService';

export function useAssignments(
  initialAssignments: CustomAssignment[] = [],
  initialSubmissions: AssignmentSubmission[] = []
) {
  const [assignments, setAssignments] = useState<CustomAssignment[]>(initialAssignments);
  const [submissions, setSubmissions] = useState<AssignmentSubmission[]>(initialSubmissions);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCourse, setSelectedCourse] = useState('all');

  const filteredAssignments = useMemo(() => {
    return assignmentService.filterAssignments(assignments, searchQuery, selectedCourse);
  }, [assignments, searchQuery, selectedCourse]);

  return {
    assignments,
    setAssignments,
    submissions,
    setSubmissions,
    searchQuery,
    setSearchQuery,
    selectedCourse,
    setSelectedCourse,
    filteredAssignments,
  };
}
