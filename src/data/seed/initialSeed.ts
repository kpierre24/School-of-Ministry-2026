// HTEIM School of Ministry — Authoritative Seed Data Engine
// Generates clean initial records for fresh production database bootstrapping.

import { CURRICULUM_CLASS_DAYS, MASTER_ENROLLED_STUDENTS } from '../constants/curriculumConstants';
import { StudentProfile, AttendanceRecord, ClassDay } from '../../types';

/**
 * Generates initial production student profiles for the official cohort.
 */
export function getInitialSeedStudents(): StudentProfile[] {
  return MASTER_ENROLLED_STUDENTS.map((name, idx) => ({
    id: `STD-2026-${100 + idx}`,
    name,
    enrolledModule: 'Apostolic & Pastoral Ministry',
    enrolmentDate: '2025-09-01',
    status: 'active'
  }));
}

/**
 * Generates initial class days from official institutional calendar definitions.
 */
export function getInitialSeedClassDays(): ClassDay[] {
  return CURRICULUM_CLASS_DAYS.map(day => ({
    id: day.id,
    name: day.name,
    academicYear: 2026
  }));
}

/**
 * Generates empty/initial attendance matrix for production tracking.
 */
export function getInitialSeedAttendanceRecords(): AttendanceRecord[] {
  return [];
}
