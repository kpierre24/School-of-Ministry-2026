import { useState, useMemo, useCallback } from 'react';
import { StudentSummary } from '../../../types';
import { StudentFilterOptions, StudentStats } from '../types';
import { filterStudents, computeStudentStats } from '../services/studentsService';

export interface UseStudentsProps {
  initialStudents?: StudentSummary[];
  initialLevelId?: string;
}

export function useStudents({
  initialStudents = [],
  initialLevelId = 'all',
}: UseStudentsProps = {}) {
  const [students, setStudents] = useState<StudentSummary[]>(initialStudents);
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);

  const [filters, setFilters] = useState<StudentFilterOptions>({
    searchQuery: '',
    levelId: initialLevelId,
    attendanceFilter: 'all',
    gradeFilter: 'all',
    cohortId: 'all',
    sortBy: 'name',
    sortDirection: 'asc',
  });

  const filteredStudents = useMemo(() => {
    return filterStudents(students, filters);
  }, [students, filters]);

  const stats: StudentStats = useMemo(() => {
    return computeStudentStats(students);
  }, [students]);

  const selectedStudent = useMemo(() => {
    if (!selectedStudentId) return null;
    return students.find((s) => s.id === selectedStudentId || s.name === selectedStudentId) || null;
  }, [students, selectedStudentId]);

  const updateSearchQuery = useCallback((query: string) => {
    setFilters((prev) => ({ ...prev, searchQuery: query }));
  }, []);

  const updateLevelFilter = useCallback((levelId: string) => {
    setFilters((prev) => ({ ...prev, levelId }));
  }, []);

  const updateAttendanceFilter = useCallback((attendanceFilter: any) => {
    setFilters((prev) => ({ ...prev, attendanceFilter }));
  }, []);

  const updateGradeFilter = useCallback((gradeFilter: any) => {
    setFilters((prev) => ({ ...prev, gradeFilter }));
  }, []);

  const setSorting = useCallback((field: any) => {
    setFilters((prev) => ({
      ...prev,
      sortBy: field,
      sortDirection: prev.sortBy === field && prev.sortDirection === 'asc' ? 'desc' : 'asc',
    }));
  }, []);

  const resetFilters = useCallback(() => {
    setFilters({
      searchQuery: '',
      levelId: 'all',
      attendanceFilter: 'all',
      gradeFilter: 'all',
      cohortId: 'all',
      sortBy: 'name',
      sortDirection: 'asc',
    });
  }, []);

  return {
    students,
    setStudents,
    filteredStudents,
    stats,
    selectedStudent,
    setSelectedStudentId,
    filters,
    setFilters,
    updateSearchQuery,
    updateLevelFilter,
    updateAttendanceFilter,
    updateGradeFilter,
    setSorting,
    resetFilters,
  };
}
