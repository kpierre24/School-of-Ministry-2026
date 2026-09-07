import { MasterCourse, CourseOffering, AcademicYear, Term, AcademicStructureData } from '../../types/academicEngine';
import { Course } from '../../types';

export type { MasterCourse, CourseOffering, AcademicYear, Term, AcademicStructureData, Course };

export interface CourseFilterOptions {
  searchQuery: string;
  levelId: string;
  termId: string;
  instructorId?: string;
  onlyActive?: boolean;
}

export const COURSE_LEVEL_BADGES: Record<string, { label: string; color: string }> = {
  m1: { label: 'Module 1: Introduction', color: 'emerald' },
  m2: { label: 'Module 2: Evangelism', color: 'cyan' },
  m3: { label: 'Module 3: Ministerial Ethics', color: 'purple' },
  m4: { label: 'Module 4: Apostolic Ministry', color: 'indigo' },
  m5: { label: 'Module 5: Prophetic Ministry', color: 'amber' },
  m6: { label: 'Module 6: Pastors & Teachers', color: 'rose' },
};
