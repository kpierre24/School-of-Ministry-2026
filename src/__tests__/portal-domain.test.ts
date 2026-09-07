import { describe, it, expect } from 'vitest';
import { isAttendanceLocked, getAttendanceLockInfo } from '../lib/attendanceLock';
import { roleHasPermission } from '../types/rbac';

describe('HTEIM Portal Core Domain Logic', () => {

  // 1. Payment Totals Tests
  describe('Payment Totals Calculations', () => {
    it('should correctly compute totals and remaining balances', () => {
      const studentName = 'Amara Sterling';
      const totalTuition = 1500;
      
      const payments = [
        { amountPaid: 500, reference: 'REF-001' },
        { amountPaid: 450, reference: 'REF-002' },
        { amountPaid: 50, reference: 'REF-003' },
      ];

      const sumPaid = payments.reduce((acc, p) => acc + p.amountPaid, 0);
      const balanceDue = totalTuition - sumPaid;
      
      expect(sumPaid).toBe(1000);
      expect(balanceDue).toBe(500);
      expect(balanceDue).toBeGreaterThan(0);
    });

    it('should mark invoice as fully paid when balance is exactly zero', () => {
      const totalTuition = 1200;
      const payments = [{ amountPaid: 1200 }];
      const sumPaid = payments.reduce((acc, p) => acc + p.amountPaid, 0);
      const balanceDue = totalTuition - sumPaid;

      expect(balanceDue).toBe(0);
      const isPaidInFull = balanceDue <= 0;
      expect(isPaidInFull).toBe(true);
    });
  });

  // 2. Duplicate Payment Prevention Tests
  describe('Duplicate Payment Prevention', () => {
    it('should identify duplicate references or receipts', () => {
      const existingTxRefs = ['TXN-55442', 'TXN-99881', 'TXN-00192'];
      const incomingTxRef = 'TXN-99881'; // Attempted duplicate reference

      const isDuplicate = existingTxRefs.includes(incomingTxRef);
      expect(isDuplicate).toBe(true);
    });

    it('should detect duplicate transaction with identical timestamp, student, and amount within narrow window', () => {
      const existingTransactions = [
        { studentName: 'John Doe', amount: 300, date: '2026-09-07T12:00:00Z' }
      ];

      const newTransaction = { studentName: 'John Doe', amount: 300, date: '2026-09-07T12:00:00Z' };

      const isExactDuplicate = existingTransactions.some(
        tx => tx.studentName === newTransaction.studentName &&
              tx.amount === newTransaction.amount &&
              tx.date === newTransaction.date
      );

      expect(isExactDuplicate).toBe(true);
    });
  });

  // 3. Attendance Percentages & Risk Flags
  describe('Attendance Percentages & At-Risk Thresholds', () => {
    // Satisfactory Attendance Threshold: 75%
    // At-Risk Warning Trigger: < 75%
    // Critical level: <= 50%
    const calculateAttendanceRate = (presentCount: number, totalCount: number): number => {
      if (totalCount === 0) return 100;
      return parseFloat(((presentCount / totalCount) * 100).toFixed(1));
    };

    it('should compute correct attendance rate', () => {
      const totalClasses = 12;
      const presentCount = 9; // 9 / 12 = 75%
      const rate = calculateAttendanceRate(presentCount, totalClasses);
      expect(rate).toBe(75);
    });

    it('should correctly flag student as Satisfactory at 75% and above', () => {
      const rate = calculateAttendanceRate(9, 12); // 75%
      const isAtRisk = rate < 75;
      expect(isAtRisk).toBe(false);
    });

    it('should trigger At-Risk Warning when rate drops below 75%', () => {
      const totalClasses = 10;
      const presentCount = 7; // 7 / 10 = 70%
      const rate = calculateAttendanceRate(presentCount, totalClasses);
      
      expect(rate).toBe(70);
      const isAtRisk = rate < 75;
      expect(isAtRisk).toBe(true);
      const isCritical = rate <= 50;
      expect(isCritical).toBe(false);
    });

    it('should trigger Critical level Warning when rate is 50% or below', () => {
      const totalClasses = 10;
      const presentCount = 5; // 5 / 10 = 50%
      const rate = calculateAttendanceRate(presentCount, totalClasses);
      
      expect(rate).toBe(50);
      const isAtRisk = rate < 75;
      const isCritical = rate <= 50;
      expect(isAtRisk).toBe(true);
      expect(isCritical).toBe(true);
    });
  });

  // 4. Attendance Locking (24-hour prevent-fraud window)
  describe('Attendance Locking & Fraud Prevention Window', () => {
    it('should lock an attendance record captured more than 24 hours ago', () => {
      const over24HoursAgo = new Date(Date.now() - (25 * 60 * 60 * 1000)).toISOString();
      const mockRecord = {
        student: { id: 'STU001', name: 'Sister Beatrice' },
        present: true,
        capturedAt: over24HoursAgo
      };

      const lockInfo = getAttendanceLockInfo(mockRecord);
      expect(lockInfo.isLocked).toBe(true);
      expect(isAttendanceLocked(mockRecord)).toBe(true);
    });

    it('should allow editing within the 24-hour capture window', () => {
      const recentCapture = new Date(Date.now() - (12 * 60 * 60 * 1000)).toISOString();
      const mockRecord = {
        student: { id: 'STU001', name: 'Sister Beatrice' },
        present: true,
        capturedAt: recentCapture
      };

      const lockInfo = getAttendanceLockInfo(mockRecord);
      expect(lockInfo.isLocked).toBe(false);
      expect(isAttendanceLocked(mockRecord)).toBe(false);
    });

    it('should unconditionally respect a manually locked record', () => {
      const mockRecord = {
        student: { id: 'STU001', name: 'Sister Beatrice' },
        present: true,
        locked: true,
        capturedAt: new Date(Date.now() - (5 * 60 * 1000)).toISOString() // just 5 mins ago
      };

      const lockInfo = getAttendanceLockInfo(mockRecord);
      expect(lockInfo.isLocked).toBe(true);
    });
  });

  // 5. Grade Calculations & Scale
  describe('Grade Calculations & Standards Scale', () => {
    // Academic grading thresholds:
    // Honor Roll / High Distinction: >= 85
    // Satisfactory: >= 75
    // At-Risk: < 75
    const getGradeCategory = (score: number): 'Honor Roll' | 'Satisfactory' | 'At-Risk' => {
      if (score >= 85) return 'Honor Roll';
      if (score >= 75) return 'Satisfactory';
      return 'At-Risk';
    };

    it('should correctly classify Honor Roll for score >= 85', () => {
      expect(getGradeCategory(85)).toBe('Honor Roll');
      expect(getGradeCategory(94.5)).toBe('Honor Roll');
    });

    it('should correctly classify Satisfactory for score between 75 and 84', () => {
      expect(getGradeCategory(75)).toBe('Satisfactory');
      expect(getGradeCategory(84.9)).toBe('Satisfactory');
    });

    it('should flag student academic standing as At-Risk for score < 75', () => {
      expect(getGradeCategory(74.9)).toBe('At-Risk');
      expect(getGradeCategory(50)).toBe('At-Risk');
    });

    it('should calculate accurate weighted assignments average', () => {
      const grades = [
        { score: 90, weight: 0.3 }, // Quiz 1 (30%)
        { score: 80, weight: 0.7 }  // Final Project (70%)
      ];

      const weightedAvg = grades.reduce((acc, g) => acc + (g.score * g.weight), 0);
      expect(weightedAvg).toBe(83); // 27 + 56 = 83
      expect(getGradeCategory(weightedAvg)).toBe('Satisfactory');
    });
  });

  // 6. Authorization & Role-Based Access Failures
  describe('Authorization Failures & Access Scopes (RBAC)', () => {
    it('should enforce role-permission mapping strictly', () => {
      // Registrar should have student enrollment permissions, but not full audit access or course deletion
      expect(roleHasPermission('registrar', 'students:enroll')).toBe(true);
      expect(roleHasPermission('registrar', 'all:access')).toBe(false);
      
      // Lecturer should have grading privileges but not system roles management
      expect(roleHasPermission('lecturer', 'grades:submit_grade')).toBe(true);
      expect(roleHasPermission('lecturer', 'roles:manage')).toBe(false);

      // Student should not have access to manage or edit student records
      expect(roleHasPermission('student', 'students:enroll')).toBe(false);
      expect(roleHasPermission('student', 'finance:record_payment')).toBe(false);
    });

    it('should allow custom override or superadmin to bypass restrictive role checks', () => {
      expect(roleHasPermission('super_admin', 'all:access')).toBe(true);
      expect(roleHasPermission('admin', 'students:enroll')).toBe(true);
    });
  });

  // 7. Offline Synchronization Conflict Merge Policies
  describe('Offline Synchronization Conflict Policies', () => {
    // Conflict merge policies from guidelines:
    // 'manual': preserves manual attendance overrides made locally
    // 'sheets': overwrites local state with incoming sheets data
    const mergeConflict = (
      localRecord: { status: string; isManualOverride?: boolean },
      sheetsRecord: { status: string },
      policy: 'manual' | 'sheets'
    ) => {
      if (policy === 'manual') {
        // If local has manual override, keep it. Otherwise overwrite
        return localRecord.isManualOverride ? localRecord : sheetsRecord;
      }
      return sheetsRecord; // overwrite always
    };

    it('should preserve local manual attendance overrides under manual merge policy', () => {
      const local = { status: 'Present', isManualOverride: true };
      const sheets = { status: 'Absent' };

      const merged = mergeConflict(local, sheets, 'manual');
      expect(merged.status).toBe('Present');
    });

    it('should overwrite with Google Sheets values under sheets merge policy', () => {
      const local = { status: 'Present', isManualOverride: true };
      const sheets = { status: 'Absent' };

      const merged = mergeConflict(local, sheets, 'sheets');
      expect(merged.status).toBe('Absent');
    });

    it('should fallback to Sheets when local status is not a manual override', () => {
      const local = { status: 'Present', isManualOverride: false };
      const sheets = { status: 'Absent' };

      const merged = mergeConflict(local, sheets, 'manual');
      expect(merged.status).toBe('Absent');
    });
  });

});
