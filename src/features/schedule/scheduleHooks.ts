import { useState, useMemo } from 'react';
import { ScheduleItem } from '../../types';
import { scheduleService } from './scheduleService';

export function useScheduleState(initialSchedules: ScheduleItem[] = []) {
  const [schedules, setSchedules] = useState<ScheduleItem[]>(initialSchedules);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedModule, setSelectedModule] = useState('all');
  const [viewMode, setViewMode] = useState<'grid' | 'calendar' | 'list'>('grid');

  const filteredSchedules = useMemo(() => {
    return scheduleService.filterSchedule(schedules, {
      searchQuery,
      moduleId: selectedModule,
    });
  }, [schedules, searchQuery, selectedModule]);

  return {
    schedules,
    setSchedules,
    searchQuery,
    setSearchQuery,
    selectedModule,
    setSelectedModule,
    viewMode,
    setViewMode,
    filteredSchedules,
  };
}
