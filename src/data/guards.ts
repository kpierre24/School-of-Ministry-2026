/**
 * HTEIM School of Ministry — Production Data Isolation & Demo Protection Guards
 *
 * Enforces strict boundaries between demo/simulation assets and production records:
 * 1. Demo records are never inserted into production automatically
 * 2. Demo users cannot authenticate as real users
 * 3. Demo attendance cannot overwrite real attendance or affect official grades
 * 4. Demo payments cannot appear in financial reports or affect balances
 * 5. Demo assignments cannot appear to students
 */

import { CurriculumRecord } from './curriculum';

// Known demo account identifiers and patterns
export const DEMO_EMAIL_PATTERNS = [
  '@demo.',
  'demo@',
  'test@',
  '@example.com',
  'guest@hteim.edu',
  'demo@demo.hteim.edu',
  'teacher@demo.hteim.edu',
  'admin@demo.hteim.edu',
  'student@demo.hteim.edu'
];

export const DEMO_ASSIGNMENT_IDS = [
  'ASG-Q100',
  'ASG-100',
  'ASG-101',
  'ASG-102',
  'ASG-103',
  'asg-1',
  'asg-2',
  'asg-demo',
  'demo-quiz'
];

export const DEMO_STUDENT_NAMES = [
  'Demo Student',
  'Test Student',
  'Guest Student',
  'John Doe (Demo)',
  'Jane Smith (Demo)'
];

/**
 * Returns true if an attendance record is marked as demo or generated from demo static sets.
 */
export function isDemoRecord(record: any): boolean {
  if (!record || typeof record !== 'object') return false;
  if (record.isDemo === true || record._isDemo === true) return true;
  if (record.source === 'demo' || record.source === 'simulation') return true;
  if (typeof record.id === 'string' && record.id.startsWith('demo-')) return true;
  if (typeof record.notes === 'string' && record.notes.toLowerCase().includes('[demo]')) return true;
  return false;
}

/**
 * Returns true if a student identity is a demo/test student.
 */
export function isDemoStudent(studentOrName: any): boolean {
  if (!studentOrName) return false;
  if (typeof studentOrName === 'string') {
    const clean = studentOrName.trim().toLowerCase();
    if (clean.includes('demo')) return true;
    return DEMO_STUDENT_NAMES.some(ds => ds.toLowerCase() === clean);
  }
  if (typeof studentOrName === 'object') {
    if (studentOrName.isDemo === true || studentOrName.isDemoUser === true) return true;
    if (typeof studentOrName.id === 'string' && studentOrName.id.startsWith('demo-')) return true;
    if (studentOrName.name && isDemoStudent(studentOrName.name)) return true;
    if (studentOrName.email && isDemoUser(studentOrName.email)) return true;
  }
  return false;
}

/**
 * Returns true if a user identity or email belongs to a demo/simulation persona.
 */
export function isDemoUser(userOrEmail: any): boolean {
  if (!userOrEmail) return false;
  if (typeof userOrEmail === 'object') {
    if (userOrEmail.isDemoUser === true || userOrEmail.isDemo === true) return true;
    if (typeof userOrEmail.id === 'string' && (userOrEmail.id.startsWith('demo-') || userOrEmail.id.startsWith('dev-'))) return true;
    const email = userOrEmail.email || '';
    return isDemoUser(email);
  }

  if (typeof userOrEmail === 'string') {
    const clean = userOrEmail.toLowerCase().trim();
    if (clean.endsWith('@demo.hteim.edu')) return true;
    return DEMO_EMAIL_PATTERNS.some(pattern => clean.includes(pattern));
  }

  return false;
}

/**
 * Returns true if a payment, transaction, or invoice is a demo/simulation item.
 */
export function isDemoPayment(paymentOrInvoice: any): boolean {
  if (!paymentOrInvoice || typeof paymentOrInvoice !== 'object') return false;
  if (paymentOrInvoice.isDemo === true || paymentOrInvoice._isDemo === true) return true;
  if (paymentOrInvoice.source === 'demo' || paymentOrInvoice.source === 'mock') return true;
  if (typeof paymentOrInvoice.id === 'string' && paymentOrInvoice.id.toLowerCase().startsWith('demo-')) return true;
  if (typeof paymentOrInvoice.studentName === 'string' && paymentOrInvoice.studentName.toLowerCase().includes('demo')) return true;
  if (typeof paymentOrInvoice.email === 'string' && isDemoUser(paymentOrInvoice.email)) return true;
  return false;
}

/**
 * Returns true if an assignment or quiz is designated as demo/sample coursework.
 */
export function isDemoAssignment(assignment: any): boolean {
  if (!assignment || typeof assignment !== 'object') return false;
  if (assignment.isDemo === true || assignment._isDemo === true) return true;
  if (assignment.category === 'demo' || assignment.source === 'demo') return true;
  if (typeof assignment.id === 'string') {
    if (assignment.id.toLowerCase().startsWith('demo-')) return true;
    if (DEMO_ASSIGNMENT_IDS.includes(assignment.id)) return true;
  }
  if (typeof assignment.title === 'string' && assignment.title.toLowerCase().startsWith('[demo]')) return true;
  return false;
}

/**
 * Production Data Filters:
 * Guarantees that demo items are stripped out before calculating official grades, balances, or reports.
 */
export function filterProductionStudents<T>(students: T[]): T[] {
  if (!Array.isArray(students)) return [];
  return students.filter(s => !isDemoStudent(s));
}

export function filterProductionAttendance<T>(records: T[]): T[] {
  if (!Array.isArray(records)) return [];
  return records.filter(r => !isDemoRecord(r));
}

export function filterProductionPayments<T>(payments: T[]): T[] {
  if (!Array.isArray(payments)) return [];
  return payments.filter(p => !isDemoPayment(p));
}

export function filterProductionAssignments<T>(assignments: T[]): T[] {
  if (!Array.isArray(assignments)) return [];
  return assignments.filter(a => !isDemoAssignment(a));
}

/**
 * Sanitizes an application state payload before persisting to production databases.
 * Guarantees that no demo records, demo users, demo payments, or demo assignments leak into production.
 */
export function sanitizeProductionState<T extends Record<string, any>>(state: T): T {
  if (!state || typeof state !== 'object') return state;

  const sanitized: any = { ...state };

  // 1. Sanitize attendance records
  if (Array.isArray(sanitized.records)) {
    sanitized.records = filterProductionAttendance(sanitized.records);
  }

  // 2. Sanitize user credentials
  if (Array.isArray(sanitized.userCredentials)) {
    sanitized.userCredentials = sanitized.userCredentials.filter((u: any) => !isDemoUser(u));
  }

  // 3. Sanitize payments, invoices, transactions
  if (Array.isArray(sanitized.payments)) {
    sanitized.payments = filterProductionPayments(sanitized.payments);
  }
  if (Array.isArray(sanitized.invoices)) {
    sanitized.invoices = filterProductionPayments(sanitized.invoices);
  }
  if (Array.isArray(sanitized.transactions)) {
    sanitized.transactions = filterProductionPayments(sanitized.transactions);
  }
  if (Array.isArray(sanitized.receipts)) {
    sanitized.receipts = filterProductionPayments(sanitized.receipts);
  }

  // 4. Sanitize custom assignments
  if (Array.isArray(sanitized.customAssignments)) {
    sanitized.customAssignments = filterProductionAssignments(sanitized.customAssignments);
  }

  // If the state was in demo mode, do not keep the demo flag in production
  if (sanitized.dataSource === 'demo') {
    sanitized.dataSource = 'production';
  }
  delete sanitized.isDemo;

  return sanitized as T;
}
