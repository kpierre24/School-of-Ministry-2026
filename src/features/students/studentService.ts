import { StudentSummaryData } from './studentSchemas';
import { normalizeStudentName } from './studentCanonicalization';

export class StudentService {
  /**
   * Sort and filter student directory list
   */
  public filterStudents(
    students: StudentSummaryData[],
    searchQuery: string,
    filterStatus: string,
    sortBy: string
  ): StudentSummaryData[] {
    const cleanSearch = searchQuery.toLowerCase().trim();

    return students.filter(student => {
      const canonicalName = normalizeStudentName(student.name);
      const matchSearch = !cleanSearch || 
        student.name.toLowerCase().includes(cleanSearch) || 
        canonicalName.toLowerCase().includes(cleanSearch);

      let matchFilter = true;
      if (filterStatus === 'at_risk') {
        matchFilter = student.rate < 75;
      } else if (filterStatus === 'satisfactory') {
        matchFilter = student.rate >= 75;
      } else if (filterStatus === 'honor_roll') {
        matchFilter = (student.avgScore ?? 0) >= 85;
      } else if (filterStatus === 'perfect') {
        matchFilter = student.rate === 100;
      }

      return matchSearch && matchFilter;
    }).sort((a, b) => {
      if (sortBy === 'name_asc') return a.name.localeCompare(b.name);
      if (sortBy === 'name_desc') return b.name.localeCompare(a.name);
      if (sortBy === 'rate_desc') return b.rate - a.rate;
      if (sortBy === 'rate_asc') return a.rate - b.rate;
      if (sortBy === 'score_desc') return (b.avgScore || 0) - (a.avgScore || 0);
      return a.name.localeCompare(b.name);
    });
  }

  /**
   * Calculate grade classification badge
   */
  public getStudentClassification(rate: number, avgScore: number | null): {
    badge: string;
    variant: 'success' | 'warning' | 'danger' | 'info';
  } {
    if (rate < 50) return { badge: 'Critical Risk', variant: 'danger' };
    if (rate < 75) return { badge: 'At Risk (<75%)', variant: 'warning' };
    if ((avgScore ?? 0) >= 85) return { badge: 'High Distinction', variant: 'success' };
    return { badge: 'Satisfactory', variant: 'info' };
  }
}

export const studentService = new StudentService();

