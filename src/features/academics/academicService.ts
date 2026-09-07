import { MasterCourse, CourseOffering, CourseFilterOptions } from './academicSchemas';

export class AcademicService {
  /**
   * Filter master courses by search query, level, and prerequisites
   */
  public filterMasterCourses(
    courses: MasterCourse[],
    searchQuery: string,
    levelFilter: string
  ): MasterCourse[] {
    const q = searchQuery.toLowerCase().trim();
    return courses.filter(c => {
      const matchSearch = !q || 
        c.title.toLowerCase().includes(q) || 
        c.code.toLowerCase().includes(q) || 
        (c.description && c.description.toLowerCase().includes(q));
      
      const matchLevel = levelFilter === 'all' || c.level.toLowerCase() === levelFilter.toLowerCase();
      return matchSearch && matchLevel;
    });
  }

  /**
   * Filter active course offerings for the current academic session
   */
  public filterOfferings(
    offerings: CourseOffering[],
    filter: CourseFilterOptions
  ): CourseOffering[] {
    const q = filter.searchQuery.toLowerCase().trim();
    return offerings.filter(o => {
      const matchSearch = !q || 
        o.courseCode.toLowerCase().includes(q) || 
        o.courseTitle.toLowerCase().includes(q) ||
        (o.location && o.location.toLowerCase().includes(q));

      const matchTerm = filter.termId === 'all' || o.termId === filter.termId;
      const matchActive = !filter.onlyActive || o.status === 'active';

      return matchSearch && matchTerm && matchActive;
    });
  }
}

export const academicService = new AcademicService();
