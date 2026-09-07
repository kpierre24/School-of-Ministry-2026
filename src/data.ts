/**
 * HTEIM School of Ministry Master Data Architecture
 * 
 * ARCHITECTURAL NOTICE:
 * Production data structures, constants, seed generators, and demo fixtures
 * are strictly separated under `src/data/`:
 * 
 * - `src/data/constants/`: Institutional class days, master roster, course catalogs
 * - `src/data/seed/`: Clean initial seed records for fresh deployments
 * - `src/data/fixtures/`: Isolated demo/test fixtures for preview sandbox only
 * - `src/data/guards.ts`: Production isolation guards and data sanitizers
 */

export type { CurriculumRecord, ClassDayItem } from './data/constants/curriculumConstants';
export { CURRICULUM_CLASS_DAYS, MASTER_ENROLLED_STUDENTS } from './data/constants/curriculumConstants';

export {
  isDemoRecord,
  isDemoStudent,
  isDemoUser,
  isDemoPayment,
  isDemoAssignment,
  filterProductionStudents,
  filterProductionAttendance,
  filterProductionPayments,
  filterProductionAssignments,
  sanitizeProductionState,
  DEMO_EMAIL_PATTERNS,
  DEMO_ASSIGNMENT_IDS,
  DEMO_STUDENT_NAMES
} from './data/guards';

export {
  getInitialSeedStudents,
  getInitialSeedClassDays,
  getInitialSeedAttendanceRecords
} from './data/seed/initialSeed';

/**
 * @deprecated Use `DEMO_ATTENDANCE_RECORDS` or `RAW_CURRICULUM_RECORDS` from `src/data/fixtures` for preview sandbox only.
 * Demo records MUST NEVER be automatically inserted into production databases.
 */
export {
  DEMO_ATTENDANCE_RECORDS,
  RAW_CURRICULUM_RECORDS,
  RAW_CSV_DATA,
  getDemoAttendance
} from './data/fixtures/demoFixtures';
