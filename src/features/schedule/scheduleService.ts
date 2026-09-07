import { ScheduleItem } from '../../types';
import { ScheduleFilterOptions, CORE_MODULES } from './scheduleSchemas';

export class ScheduleService {
  /**
   * Filter schedule sessions by keyword or module
   */
  public filterSchedule(
    schedules: ScheduleItem[],
    options: ScheduleFilterOptions
  ): ScheduleItem[] {
    const q = options.searchQuery.toLowerCase().trim();

    return schedules.filter(item => {
      const matchSearch = !q || 
        item.title.toLowerCase().includes(q) || 
        (item.moduleName && item.moduleName.toLowerCase().includes(q)) || 
        (item.instructor && item.instructor.toLowerCase().includes(q)) ||
        (item.room && item.room.toLowerCase().includes(q));

      const matchModule = options.moduleId === 'all' || item.courseCode === options.moduleId;

      return matchSearch && matchModule;
    });
  }

  /**
   * Resolve core module metadata
   */
  public getModuleMeta(moduleCode?: string) {
    return CORE_MODULES.find(m => m.code === moduleCode || m.id === moduleCode) || CORE_MODULES[0];
  }
}

export const scheduleService = new ScheduleService();
