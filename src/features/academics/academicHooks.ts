import { useState, useMemo, useCallback } from 'react';
import { MasterCourse, CourseOffering } from './academicSchemas';
import { academicService } from './academicService';

export function useAcademicsState(
  initialMasterCourses: MasterCourse[] = [],
  initialOfferings: CourseOffering[] = []
) {
  const [masterCourses, setMasterCourses] = useState<MasterCourse[]>(initialMasterCourses);
  const [offerings, setOfferings] = useState<CourseOffering[]>(initialOfferings);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLevel, setSelectedLevel] = useState('all');
  const [selectedTerm, setSelectedTerm] = useState('all');

  const filteredMasterCourses = useMemo(() => {
    return academicService.filterMasterCourses(masterCourses, searchQuery, selectedLevel);
  }, [masterCourses, searchQuery, selectedLevel]);

  const filteredOfferings = useMemo(() => {
    return academicService.filterOfferings(offerings, {
      searchQuery,
      levelId: selectedLevel,
      termId: selectedTerm,
    });
  }, [offerings, searchQuery, selectedLevel, selectedTerm]);

  return {
    masterCourses,
    setMasterCourses,
    offerings,
    setOfferings,
    searchQuery,
    setSearchQuery,
    selectedLevel,
    setSelectedLevel,
    selectedTerm,
    setSelectedTerm,
    filteredMasterCourses,
    filteredOfferings,
  };
}
