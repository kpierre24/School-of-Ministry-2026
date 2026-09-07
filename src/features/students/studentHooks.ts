import { useState, useMemo } from 'react';
import { StudentSummaryData, StudentFilterStatus, StudentSortOption } from './studentSchemas';
import { studentService } from './studentService';

export function useStudentsDirectory(initialStudents: StudentSummaryData[] = []) {
  const [students, setStudents] = useState<StudentSummaryData[]>(initialStudents);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<StudentFilterStatus>('all');
  const [sortBy, setSortBy] = useState<StudentSortOption>('name_asc');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  const filteredStudents = useMemo(() => {
    return studentService.filterStudents(students, searchQuery, filterStatus, sortBy);
  }, [students, searchQuery, filterStatus, sortBy]);

  const metrics = useMemo(() => {
    const total = students.length;
    const atRisk = students.filter(s => s.rate < 75).length;
    const honorRoll = students.filter(s => (s.avgScore ?? 0) >= 85).length;
    const perfect = students.filter(s => s.rate === 100).length;
    const avgAttendance = total > 0 ? students.reduce((acc, s) => acc + s.rate, 0) / total : 0;

    return {
      total,
      atRisk,
      honorRoll,
      perfect,
      avgAttendance
    };
  }, [students]);

  return {
    students,
    setStudents,
    filteredStudents,
    metrics,
    searchQuery,
    setSearchQuery,
    filterStatus,
    setFilterStatus,
    sortBy,
    setSortBy,
    viewMode,
    setViewMode
  };
}
