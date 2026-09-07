import { ScheduleItem } from '../../types';

export type { ScheduleItem };

export interface CoreModuleMeta {
  id: string;
  code: string;
  name: string;
  shortName: string;
  color: string;
}

export const CORE_MODULES: CoreModuleMeta[] = [
  { id: 'm1', code: 'SOM-MOD-1', name: 'Module 1: Introduction', shortName: 'Introduction', color: 'emerald' },
  { id: 'm2', code: 'SOM-MOD-2', name: 'Module 2: Evangelism', shortName: 'Evangelism', color: 'cyan' },
  { id: 'm3', code: 'SOM-MOD-3', name: 'Module 3: Ministerial Ethics', shortName: 'Ministerial Ethics', color: 'purple' },
  { id: 'm4', code: 'SOM-MOD-4', name: 'Module 4: Apostolic Ministry', shortName: 'Apostolic Ministry', color: 'indigo' },
  { id: 'm5', code: 'SOM-MOD-5', name: 'Module 5: Prophetic Ministry', shortName: 'Prophetic Ministry', color: 'amber' },
  { id: 'm6', code: 'SOM-MOD-6', name: 'Module 6: School of the Pastors and Teachers', shortName: 'Pastors & Teachers', color: 'rose' },
];

export interface ScheduleFilterOptions {
  searchQuery: string;
  moduleId: string;
  startDate?: string;
  endDate?: string;
}
