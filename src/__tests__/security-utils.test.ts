import { describe, it, expect, vi, beforeEach } from 'vitest';
import { sanitizeFileName, sanitizeHtml, sanitizeInput, validateEmail, checkPasswordStrength } from '../lib/securityHelper';
import { getStudentPaymentDetails } from '../lib/paymentUtils';
import { generateStudentUsername, authenticateUser, ensureUserCredentials, resetUserPassword, UserCredential, UserRole } from '../lib/userAuth';

describe('securityHelper', () => {
  describe('sanitizeFileName', () => {
    it('should strip path traversal patterns', () => {
      expect(sanitizeFileName('../etc/passwd')).toBe('passwd');
    });

    it('should replace special characters with underscores', () => {
      const result = sanitizeFileName('my file (1).pdf');
      expect(result).toMatch(/^[a-zA-Z0-9_.-]+$/);
    });

    it('should return a timestamped fallback for empty input', () => {
      const result = sanitizeFileName('');
      expect(result).toMatch(/^(file|upload)_\d+$/);
    });
  });

  describe('sanitizeHtml', () => {
    it('should escape HTML special characters', () => {
      expect(sanitizeHtml('<script>alert(1)</script>')).not.toContain('<script>');
      expect(sanitizeHtml('a & b')).toBe('a &amp; b');
    });

    it('should return empty string for null input', () => {
      expect(sanitizeHtml(null)).toBe('');
    });
  });

  describe('sanitizeInput', () => {
    it('should strip script tags', () => {
      const result = sanitizeInput('<script>alert(1)</script>hello');
      expect(result).not.toContain('<script>');
      expect(result).toContain('hello');
    });

    it('should strip javascript: protocols', () => {
      const result = sanitizeInput('javascript:alert(1)');
      expect(result).not.toContain('javascript:');
    });
  });

  describe('validateEmail', () => {
    it('should accept valid emails', () => {
      expect(validateEmail('user@example.com')).toBe(true);
    });

    it('should reject invalid emails', () => {
      expect(validateEmail('not-an-email')).toBe(false);
      expect(validateEmail('')).toBe(false);
    });
  });

  describe('checkPasswordStrength', () => {
    it('should flag short passwords as weak', () => {
      const result = checkPasswordStrength('abc');
      expect(result.isSecure).toBe(false);
      expect(result.score).toBeLessThan(3);
    });

    it('should accept strong passwords', () => {
      const result = checkPasswordStrength('StrongPass1!');
      expect(result.isSecure).toBe(true);
    });
  });
});

describe('paymentUtils', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('should return zeroed summary for missing student', () => {
    const result = getStudentPaymentDetails('');
    expect(result.hasOutstanding).toBe(false);
    expect(result.totalTuition).toBe(0);
  });

  it('should compute balance from localStorage payments', () => {
    const payments = [
      { id: '1', studentName: 'Test Student', totalTuition: 1000, amountPaid: 400, status: 'Partial' }
    ];
    localStorage.setItem('hteim_student_payments', JSON.stringify(payments));

    const result = getStudentPaymentDetails('Test Student');
    expect(result.totalTuition).toBe(1000);
    expect(result.amountPaid).toBe(400);
    expect(result.balanceDue).toBe(600);
    expect(result.hasOutstanding).toBe(true);
  });

  it('should mark paid-in-full when balance is zero', () => {
    const payments = [
      { id: '1', studentName: 'Test Student', totalTuition: 1000, amountPaid: 1000, status: 'Paid In Full' }
    ];
    localStorage.setItem('hteim_student_payments', JSON.stringify(payments));

    const result = getStudentPaymentDetails('Test Student');
    expect(result.hasOutstanding).toBe(false);
    expect(result.balanceDue).toBe(0);
  });
});

describe('userAuth', () => {
  describe('generateStudentUsername', () => {
    it('should generate FirstInitial + LastName format', () => {
      expect(generateStudentUsername('Alex Burke')).toBe('ABurke');
    });

    it('should handle single-word names', () => {
      expect(generateStudentUsername('Afeshia')).toBe('Afeshia');
    });

    it('should sanitize non-alphanumeric characters from last name', () => {
      expect(generateStudentUsername('John O\'Connor')).toBe('JOconnor');
    });
  });

  describe('authenticateUser', () => {
    const credentials: UserCredential[] = [
      { id: 'u-1', email: 'kpierre24@gmail.com', username: 'admin', name: 'Kendell Pierre', role: 'admin', passwordHash: 'password1', mustChangePassword: true, status: 'active', createdAt: '2026-01-01' },
      { id: 'u-2', email: 'aburke@student.hteim.edu', username: 'ABurke', name: 'Alex Burke', role: 'student', passwordHash: 'password1', mustChangePassword: true, status: 'active', createdAt: '2026-01-01' },
    ];

    it('should authenticate with correct email and password', () => {
      const result = authenticateUser('kpierre24@gmail.com', 'password1', credentials);
      expect(result.success).toBe(true);
      expect(result.user?.role).toBe('admin');
      expect(result.user?.name).toBe('Kendell Pierre');
    });

    it('should reject incorrect password', () => {
      const result = authenticateUser('kpierre24@gmail.com', 'wrongpassword', credentials);
      expect(result.success).toBe(false);
    });

    it('should be case-insensitive for email', () => {
      const result = authenticateUser('KPIERRE24@GMAIL.COM', 'password1', credentials);
      expect(result.success).toBe(true);
    });
  });

  describe('ensureUserCredentials', () => {
    it('should add default admin (Kendell Pierre / kpierre24@gmail.com) if missing', () => {
      const { updatedCredentials, changed } = ensureUserCredentials([], []);
      expect(changed).toBe(true);
      expect(updatedCredentials.some(c => c.email === 'kpierre24@gmail.com' && c.role === 'admin')).toBe(true);
    });

    it('should add faculty teachers if missing', () => {
      const { updatedCredentials, changed } = ensureUserCredentials([], []);
      expect(changed).toBe(true);
      expect(updatedCredentials.some(c => c.role === 'teacher')).toBe(true);
    });

    it('should generate student credentials from names with default password1', () => {
      const { updatedCredentials, changed } = ensureUserCredentials([], ['Alex Burke', 'Jordan Smith']);
      expect(changed).toBe(true);
      const studentEmails = updatedCredentials.filter(c => c.role === 'student').map(c => c.email);
      expect(studentEmails).toContain('aburke@student.hteim.edu');
      expect(studentEmails).toContain('jsmith@student.hteim.edu');
    });
  });

  describe('resetUserPassword', () => {
    it('should reset password to default password1 and require change', () => {
      const credentials: UserCredential[] = [
        { id: 'u-1', email: 'aburke@student.hteim.edu', username: 'ABurke', name: 'Alex Burke', role: 'student', passwordHash: 'customSecret123', mustChangePassword: false, status: 'active', createdAt: '2026-01-01' }
      ];
      const updated = resetUserPassword(credentials, 'aburke@student.hteim.edu');
      expect(updated[0].passwordHash).toBe('password1');
      expect(updated[0].mustChangePassword).toBe(true);
    });
  });
});
