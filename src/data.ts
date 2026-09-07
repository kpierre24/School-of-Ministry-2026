/**
 * HTEIM School of Ministry Master Curriculum & Attendance Records
 * 
 * ARCHITECTURAL NOTICE:
 * Production definitions (Curriculum Schedule, Enrolled Student Roster)
 * and Demo/Simulation datasets (Attendance records, Sample mock data)
 * are now strictly separated into modular submodules under `src/data/`:
 * 
 * - `src/data/curriculum.ts`: Institutional class days and master cohort roster
 * - `src/data/guards.ts`: Production boundary guards and sanitizers
 * - `src/data/demo/demoData.ts`: Isolated demo datasets for sandbox preview only
 */

export type { CurriculumRecord, ClassDayItem } from './data/curriculum';
export { CURRICULUM_CLASS_DAYS, MASTER_ENROLLED_STUDENTS } from './data/curriculum';

export {
  isDemoRecord,
  isDemoUser,
  isDemoPayment,
  isDemoAssignment,
  sanitizeProductionState,
  DEMO_EMAIL_PATTERNS,
  DEMO_ASSIGNMENT_IDS
} from './data/guards';

/**
 * @deprecated Use `DEMO_ATTENDANCE_RECORDS` from `src/data/demo/demoData` for preview sandbox only.
 * Demo records MUST NEVER be automatically inserted into production databases.
 */
export {
  DEMO_ATTENDANCE_RECORDS,
  RAW_CURRICULUM_RECORDS,
  RAW_CSV_DATA,
  getDemoAttendance
} from './data/demo/demoData';
