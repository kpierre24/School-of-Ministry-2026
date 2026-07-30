export type AuditLogCategory = 
  | 'Grade Adjustment'
  | 'Attendance Override'
  | 'Payment Entry'
  | 'Student Record'
  | 'Assignment Action'
  | 'System Settings'
  | 'Backup & Data';

export type AuditLogEntry = {
  id: string;
  timestamp: string;
  actor: string;
  role: 'admin' | 'teacher' | 'student' | 'system';
  actionCategory: AuditLogCategory;
  actionTitle: string;
  details: string;
  targetStudent?: string;
  ipOrDevice?: string;
};

const STORAGE_KEY = 'hteim_audit_logs';

const INITIAL_AUDIT_LOGS: AuditLogEntry[] = [
  {
    id: 'log-101',
    timestamp: '2026-07-28 08:05:12',
    actor: 'Administrator',
    role: 'admin',
    actionCategory: 'Payment Entry',
    actionTitle: 'Tuition Payment Logged',
    details: 'Recorded $500.00 tuition payment for Afeshia Burke via Credit Card. Balance updated to $200.00.',
    targetStudent: 'Afeshia Burke',
    ipOrDevice: 'Web Admin Session (192.168.1.10)'
  },
  {
    id: 'log-102',
    timestamp: '2026-07-28 07:42:19',
    actor: 'Instructor Dr. Smith',
    role: 'teacher',
    actionCategory: 'Grade Adjustment',
    actionTitle: 'Essay Correction Submitted',
    details: 'Graded "Evangelism Assignment" for Alicia Noray Bowles. Score: 89/100. Feedback attached.',
    targetStudent: 'Alicia Noray Bowles',
    ipOrDevice: 'Web Teacher Session'
  },
  {
    id: 'log-103',
    timestamp: '2026-07-27 16:15:00',
    actor: 'Administrator',
    role: 'admin',
    actionCategory: 'Attendance Override',
    actionTitle: 'Attendance Record Updated',
    details: 'Overrode attendance status for Day 12 (Lesson 8) for Kezia John from Absent to Present (Excused Ministry Trip).',
    targetStudent: 'Kezia John',
    ipOrDevice: 'Web Admin Session'
  },
  {
    id: 'log-104',
    timestamp: '2026-07-26 14:30:45',
    actor: 'System Auto-Sync',
    role: 'system',
    actionCategory: 'System Settings',
    actionTitle: 'Google Sheets Metadata Sync',
    details: 'Successfully synced 18 attendance worksheets from HTEIM Google Sheets master register.',
    ipOrDevice: 'Automated Worker'
  },
  {
    id: 'log-105',
    timestamp: '2026-07-25 11:20:00',
    actor: 'Administrator',
    role: 'admin',
    actionCategory: 'Assignment Action',
    actionTitle: 'New Written Assignment Published',
    details: 'Created written assignment "Apostolic Leadership & Local Church Governance". Max points: 100. Due: 2026-08-15.',
    ipOrDevice: 'Web Admin Session'
  },
  {
    id: 'log-106',
    timestamp: '2026-07-24 09:10:30',
    actor: 'Administrator',
    role: 'admin',
    actionCategory: 'Payment Entry',
    actionTitle: 'Tuition Payment Logged',
    details: 'Recorded $700.00 tuition payment for Kiera Baptiste via Bank Wire Transfer. Status: Paid In Full.',
    targetStudent: 'Kiera Baptiste',
    ipOrDevice: 'Web Admin Session'
  }
];

export function getAuditLogs(): AuditLogEntry[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Failed to parse audit logs from storage:', e);
  }

  // Initialize with sample records if empty
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_AUDIT_LOGS));
  } catch (e) {
    // Ignore storage write errors
  }
  return INITIAL_AUDIT_LOGS;
}

export function logActivity(entry: Omit<AuditLogEntry, 'id' | 'timestamp'> & { timestamp?: string }): AuditLogEntry {
  const logs = getAuditLogs();
  
  const now = new Date();
  const formattedTime = entry.timestamp || `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;

  const newLog: AuditLogEntry = {
    id: `log-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    timestamp: formattedTime,
    actor: entry.actor || 'Administrator',
    role: entry.role || 'admin',
    actionCategory: entry.actionCategory,
    actionTitle: entry.actionTitle,
    details: entry.details,
    targetStudent: entry.targetStudent,
    ipOrDevice: entry.ipOrDevice || 'Web Portal Session'
  };

  const updatedLogs = [newLog, ...logs];

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedLogs));
    // Dispatch window event so listening components update automatically
    window.dispatchEvent(new CustomEvent('hteim_audit_log_updated', { detail: newLog }));
  } catch (e) {
    console.error('Failed to save audit log:', e);
  }

  return newLog;
}

export function clearAuditLogs(): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([]));
    window.dispatchEvent(new CustomEvent('hteim_audit_log_updated'));
  } catch (e) {
    console.error('Failed to clear audit logs:', e);
  }
}

export function pruneAuditLogs(maxCount: number = 30): void {
  try {
    const logs = getAuditLogs();
    if (logs.length > maxCount) {
      const pruned = logs.slice(0, maxCount);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(pruned));
      window.dispatchEvent(new CustomEvent('hteim_audit_log_updated'));
    }
  } catch (e) {
    console.error('Failed to prune audit logs:', e);
  }
}
