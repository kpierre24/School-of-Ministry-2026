import { useState, useMemo, useCallback } from 'react';
import { CustomAssignment } from '../../../types';
import {
  AssignmentFormData,
  AssignmentStatusFilter,
  AssignmentStats,
} from '../types';
import {
  filterAssignments,
  calculateAssignmentStats,
  createAssignmentObject,
} from '../services/assignmentsService';

interface UseAssignmentsProps {
  initialAssignments?: CustomAssignment[];
  userRole?: 'admin' | 'teacher' | 'student' | string;
  studentName?: string;
  onAssignmentsChange?: (assignments: CustomAssignment[]) => void;
}

export function useAssignments({
  initialAssignments = [],
  userRole = 'admin',
  studentName = '',
  onAssignmentsChange,
}: UseAssignmentsProps = {}) {
  const [assignments, setAssignments] = useState<CustomAssignment[]>(initialAssignments);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<AssignmentStatusFilter>('all');
  const [selectedCourse, setSelectedCourse] = useState('all');
  const [selectedAssignmentId, setSelectedAssignmentId] = useState<string | null>(null);

  // Synchronize internal state if initialAssignments prop changes externally
  const handleSetAssignments = useCallback(
    (newAssignments: CustomAssignment[] | ((prev: CustomAssignment[]) => CustomAssignment[])) => {
      setAssignments((prev) => {
        const updated = typeof newAssignments === 'function' ? newAssignments(prev) : newAssignments;
        if (onAssignmentsChange) {
          onAssignmentsChange(updated);
        }
        return updated;
      });
    },
    [onAssignmentsChange]
  );

  const filteredAssignments = useMemo(() => {
    return filterAssignments(assignments, {
      search: searchQuery,
      statusFilter,
      courseCode: selectedCourse,
      userRole,
      studentName,
    });
  }, [assignments, searchQuery, statusFilter, selectedCourse, userRole, studentName]);

  const stats: AssignmentStats = useMemo(() => {
    return calculateAssignmentStats(assignments, []);
  }, [assignments]);

  const selectedAssignment = useMemo(() => {
    if (!selectedAssignmentId) return null;
    return assignments.find((a) => a.id === selectedAssignmentId) || null;
  }, [assignments, selectedAssignmentId]);

  const addAssignment = useCallback(
    (formData: AssignmentFormData): CustomAssignment => {
      const newAsg = createAssignmentObject(formData);
      handleSetAssignments((prev) => [newAsg, ...prev]);
      return newAsg;
    },
    [handleSetAssignments]
  );

  const updateAssignment = useCallback(
    (id: string, updates: Partial<CustomAssignment>) => {
      handleSetAssignments((prev) =>
        prev.map((asg) => (asg.id === id ? { ...asg, ...updates } : asg))
      );
    },
    [handleSetAssignments]
  );

  const deleteAssignment = useCallback(
    (id: string) => {
      handleSetAssignments((prev) => prev.filter((asg) => asg.id !== id));
      if (selectedAssignmentId === id) {
        setSelectedAssignmentId(null);
      }
    },
    [handleSetAssignments, selectedAssignmentId]
  );

  const publishAssignment = useCallback(
    (id: string) => {
      updateAssignment(id, { published: true, isDraft: false });
    },
    [updateAssignment]
  );

  return {
    assignments,
    setAssignments: handleSetAssignments,
    filteredAssignments,
    stats,
    selectedAssignment,
    selectedAssignmentId,
    setSelectedAssignmentId,
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    selectedCourse,
    setSelectedCourse,
    addAssignment,
    updateAssignment,
    deleteAssignment,
    publishAssignment,
  };
}
