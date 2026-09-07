/**
 * ============================================================================
 * ACADEMIC ENGINE DATA MODELS & TYPES
 * HTEIM School of Ministry
 * ============================================================================
 * Hierarchical structure:
 * Academic Year
 *    └── Semester / Term
 *         └── Course (Master catalog definition)
 *              └── Course Offering (Scheduled delivery instance)
 *                   ├── Lecturer
 *                   ├── Enrolled Students
 *                   ├── Attendance
 *                   ├── Assignments
 *                   ├── Exams
 *                   └── Grades
 */

import type { AcademicYearStatus, TermStatus } from './database';

export type OfferingStatus = 'upcoming' | 'active' | 'grading' | 'concluded';
export type StudentOfferingStatus = 'enrolled' | 'auditing' | 'completed' | 'at_risk' | 'withdrawn';
export type AcademicStanding = 'high_distinction' | 'satisfactory' | 'at_risk';

/**
 * 1. ACADEMIC YEAR
 * Represents an academic calendar year (e.g., 2025-2026).
 */
export interface AcademicYear {
  id: string;
  code: string; // e.g. "AY-2025-2026"
  name: string; // e.g. "2025–2026 Academic Year"
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  status: AcademicYearStatus;
  theme?: string; // Spiritual or institutional theme
  description?: string;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * 2. SEMESTER / TERM
 * Scheduled academic period within an Academic Year.
 */
export interface Term {
  id: string;
  academicYearId: string; // FK -> AcademicYear.id
  code: string; // e.g. "2026-SEM-1"
  name: string; // e.g. "2026 Semester 1 (Spring/Winter)"
  sequenceOrder: number; // 1, 2, 3
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  status: TermStatus;
  weeksCount: number;
  description?: string;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * 3. COURSE (MASTER CURRICULUM CATALOG DEFINITION)
 * The reusable curricular blueprint. Independent of any specific semester.
 * Allows the same course (e.g., "Biblical Hermeneutics") to be offered every year
 * without duplicating or rewriting the master definition.
 */
export interface MasterCourse {
  id: string;
  code: string; // e.g. "SOM-101", "SOM-MOD-1"
  title: string; // e.g. "Biblical Hermeneutics & Exegesis"
  coreModuleNumber: 1 | 2 | 3 | 4 | 5 | 6 | 'Elective';
  credits: number; // e.g. 5.0
  department: 'Biblical Studies' | 'Practical Ministry' | 'Leadership & Governance' | 'Theology & Ethics' | 'General';
  level: 'Foundation' | 'Diploma' | 'Degree' | 'Executive';
  description: string;
  learningOutcomes: string[];
  prerequisites: string[];
  syllabusOutline: {
    week: number;
    topic: string;
    description: string;
    scriptureReferences?: string[];
  }[];
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * 4. COURSE OFFERING (SCHEDULED DELIVERY INSTANCE)
 * A concrete, scheduled offering of a Course in a specific Academic Year & Term.
 * Contains:
 *  - Lecturer
 *  - Enrolled Students
 *  - Attendance
 *  - Assignments
 *  - Exams
 *  - Grades
 */
export interface CourseOfferingLecturer {
  id?: string;
  name: string;
  title: string;
  email: string;
  avatarUrl?: string;
  bio?: string;
  officeHours?: string;
}

export interface OfferingStudentEnrollment {
  studentId: string;
  studentName: string;
  studentNumber: string;
  email?: string;
  avatarUrl?: string;
  cohortLevel: string;
  enrolledAt: string;
  status: StudentOfferingStatus;
  attendanceRate: number; // % (Satisfactory >= 75%, At-risk < 75%)
  assignmentsScore: number; // %
  examsScore: number; // %
  finalGrade: number; // weighted %
  letterGrade: 'A' | 'B' | 'C' | 'D' | 'F';
  standing: AcademicStanding; // high_distinction (>= 85%), satisfactory (>= 75%), at_risk (< 75%)
  notes?: string;
}

export interface OfferingAttendanceRecord {
  studentName: string;
  status: 'Present' | 'Absent' | 'Excused' | 'Tardy';
  checkInTime?: string;
  notes?: string;
}

export interface OfferingAttendanceSession {
  id: string;
  sessionNumber: number;
  date: string; // YYYY-MM-DD
  topic: string;
  location?: string;
  records: OfferingAttendanceRecord[];
  presentCount: number;
  absentCount: number;
  excusedCount: number;
  attendanceRate: number; // %
}

export interface OfferingAssignment {
  id: string;
  title: string;
  description: string;
  type: 'essay' | 'exegesis' | 'reflection' | 'practicum' | 'quiz' | 'reading';
  maxPoints: number; // e.g. 100
  weight: number; // % weight of final grade (e.g. 20%)
  dueDate: string;
  submissionsCount: number;
  gradedCount: number;
  avgScore: number; // %
  rubricCriteria?: { name: string; maxPoints: number; description: string }[];
}

export interface OfferingExam {
  id: string;
  title: string;
  description: string;
  examType: 'quiz' | 'midterm' | 'final' | 'comprehensive';
  totalPoints: number;
  weight: number; // % weight of final grade (e.g. 30%)
  examDate: string;
  durationMinutes: number;
  status: 'scheduled' | 'active' | 'graded';
  avgScore: number; // %
  passingScore: number; // %
}

export interface OfferingGradeRecord {
  studentName: string;
  studentNumber: string;
  assignmentGrades: Record<string, number>; // assignmentId -> points
  examGrades: Record<string, number>; // examId -> points
  attendancePercentage: number;
  weightedScore: number; // 0-100%
  letterGrade: 'A' | 'B' | 'C' | 'D' | 'F';
  standing: AcademicStanding;
  isPublished: boolean;
  facultyFeedback?: string;
}

export interface CourseOffering {
  id: string;
  courseId: string; // FK -> MasterCourse.id
  courseCode: string; // e.g. "SOM-101"
  courseTitle: string; // e.g. "Biblical Hermeneutics & Exegesis"
  academicYearId: string; // FK -> AcademicYear.id
  academicYearName: string; // e.g. "2025–2026 Academic Year"
  termId: string; // FK -> Term.id
  termName: string; // e.g. "2026 Semester 1"
  section: string; // e.g. "Section 01", "Main Sanctuary & Online"
  scheduleDays: string; // e.g. "Tuesdays & Thursdays (7:00 PM - 9:00 PM EST)"
  location: string; // e.g. "Main Sanctuary & Zoom Live Stream"
  zoomLink?: string;
  capacity: number;
  status: OfferingStatus;
  credits: number;
  
  // The 6 Operational Facets of Course Offering:
  lecturer: CourseOfferingLecturer;
  enrolledStudents: OfferingStudentEnrollment[];
  attendance: OfferingAttendanceSession[];
  assignments: OfferingAssignment[];
  exams: OfferingExam[];
  grades: OfferingGradeRecord[];

  createdAt?: string;
  updatedAt?: string;
}

/**
 * Complete Hierarchical Academic Structure
 */
export interface AcademicStructureData {
  academicYears: AcademicYear[];
  terms: Term[];
  masterCourses: MasterCourse[];
  courseOfferings: CourseOffering[];
  activeAcademicYearId: string;
  activeTermId: string;
  policyThresholds: {
    atRiskAttendance: number; // 75%
    criticalAttendance: number; // 50%
    highDistinctionGrade: number; // 85%
    satisfactoryGrade: number; // 75%
  };
}
