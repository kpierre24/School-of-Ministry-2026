import { TabType } from '../types';

export type NotificationCategory =
  | 'assignment_due'
  | 'assignment_graded'
  | 'attendance_warning'
  | 'payment_due'
  | 'payment_received'
  | 'application_status'
  | 'announcement'
  | 'system';

export type NotificationChannel = 'in_app' | 'email' | 'sms' | 'whatsapp';

export type NotificationPriority = 'low' | 'normal' | 'high' | 'urgent';

export interface ChannelPreferenceMap {
  in_app: boolean;
  email: boolean;
  sms: boolean;
  whatsapp: boolean;
}

export type UserNotificationPreferences = Record<NotificationCategory, ChannelPreferenceMap>;

export interface DeliveryLog {
  channel: NotificationChannel;
  status: 'delivered' | 'failed' | 'skipped_disabled' | 'pending';
  timestamp: string;
  details?: string;
}

export interface CentralNotification {
  id: string;
  category: NotificationCategory;
  title: string;
  message: string;
  createdAt: string;
  read: boolean;
  priority?: NotificationPriority;
  targetRole?: 'admin' | 'teacher' | 'student' | 'all';
  studentName?: string;
  studentEmail?: string;
  studentPhone?: string;
  assignmentId?: string;
  actionTab?: TabType;
  actionUrl?: string;
  metadata?: Record<string, any>;
  deliveryLogs?: DeliveryLog[];
  type?: 'due_date' | 'past_due' | 'graded' | 'submission' | 'general' | 'at_risk_attendance' | 'payment_past_due';
  channelSent?: ('portal' | 'email' | 'sms' | 'whatsapp')[];
}

export const CATEGORY_LABELS: Record<NotificationCategory, { label: string; description: string; icon: string }> = {
  assignment_due: {
    label: 'Assignment Due Dates',
    description: 'Upcoming homework, essay, and quiz due date reminders',
    icon: 'Clock'
  },
  assignment_graded: {
    label: 'Grading & Feedback',
    description: 'Alerts when homework or exams are evaluated by faculty',
    icon: 'Award'
  },
  attendance_warning: {
    label: 'Attendance Alerts',
    description: 'Notifications when attendance status changes or drops',
    icon: 'AlertCircle'
  },
  payment_due: {
    label: 'Tuition Payment Due',
    description: 'Upcoming installment and overdue balance reminders',
    icon: 'DollarSign'
  },
  payment_received: {
    label: 'Payment Receipts',
    description: 'Confirmations when tuition payments are processed and verified',
    icon: 'CheckCircle'
  },
  application_status: {
    label: 'Enrollment & Application Status',
    description: 'Status updates regarding student registration and level placement',
    icon: 'UserCheck'
  },
  announcement: {
    label: 'Ministry Broadcasts',
    description: 'School-wide announcements, live broadcast schedules, and alerts',
    icon: 'Radio'
  },
  system: {
    label: 'System & Security',
    description: 'Platform updates, backup confirmations, and security alerts',
    icon: 'Shield'
  }
};

export const DEFAULT_NOTIFICATION_PREFERENCES: UserNotificationPreferences = {
  assignment_due: { in_app: true, email: true, sms: false, whatsapp: true },
  assignment_graded: { in_app: true, email: true, sms: true, whatsapp: true },
  attendance_warning: { in_app: true, email: true, sms: true, whatsapp: true },
  payment_due: { in_app: true, email: true, sms: false, whatsapp: true },
  payment_received: { in_app: true, email: true, sms: true, whatsapp: false },
  application_status: { in_app: true, email: true, sms: false, whatsapp: false },
  announcement: { in_app: true, email: true, sms: false, whatsapp: true },
  system: { in_app: true, email: false, sms: false, whatsapp: false }
};
