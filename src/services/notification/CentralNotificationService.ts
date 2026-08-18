import {
  CentralNotification,
  NotificationCategory,
  UserNotificationPreferences,
  DEFAULT_NOTIFICATION_PREFERENCES,
  DeliveryLog
} from '../../types/notifications';
import {
  NotificationAdapter,
  InAppNotificationAdapter,
  EmailNotificationAdapter,
  SMSNotificationAdapter,
  WhatsAppNotificationAdapter
} from './NotificationAdapter';

type Listener = () => void;

class CentralNotificationServiceClass {
  private notifications: CentralNotification[] = [];
  private preferences: UserNotificationPreferences = DEFAULT_NOTIFICATION_PREFERENCES;
  private adapters: NotificationAdapter[] = [];
  private listeners: Listener[] = [];

  constructor() {
    // Register Channel Adapters
    this.adapters = [
      new InAppNotificationAdapter(),
      new EmailNotificationAdapter(),
      new SMSNotificationAdapter(),
      new WhatsAppNotificationAdapter()
    ];

    // Load initial state & preferences from localStorage if available
    this.loadState();
  }

  private loadState() {
    try {
      const storedPrefs = localStorage.getItem('hteim_notification_preferences');
      if (storedPrefs) {
        this.preferences = { ...DEFAULT_NOTIFICATION_PREFERENCES, ...JSON.parse(storedPrefs) };
      }

      const storedNotifs = localStorage.getItem('hteim_app_notifications');
      if (storedNotifs) {
        this.notifications = JSON.parse(storedNotifs);
      }
    } catch {
      // Fallback to defaults if parsing fails
    }
  }

  private saveState() {
    try {
      localStorage.setItem('hteim_notification_preferences', JSON.stringify(this.preferences));
      localStorage.setItem('hteim_app_notifications', JSON.stringify(this.notifications));
    } catch {
      // Ignore storage errors
    }
    this.notifyListeners();
  }

  public subscribe(listener: Listener): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notifyListeners() {
    this.listeners.forEach(l => l());
  }

  /**
   * Get all active notifications
   */
  public getNotifications(): CentralNotification[] {
    return this.notifications;
  }

  /**
   * Bulk sync notifications array from external sources (e.g., Supabase / automated scan)
   */
  public setNotifications(notifs: CentralNotification[]) {
    this.notifications = notifs;
    this.saveState();
  }

  /**
   * Get total unread count for current user
   */
  public getUnreadCount(role?: string, studentName?: string): number {
    return this.getFilteredNotifications(role, studentName).filter(n => !n.read).length;
  }

  /**
   * Filter notifications relevant to current user with strict RBAC rules
   */
  public getFilteredNotifications(role?: string, studentName?: string): CentralNotification[] {
    const normRole = (role || 'admin').toLowerCase().trim();
    const normName = (studentName || '').toLowerCase().trim();

    return this.notifications.filter(n => {
      const target = (n.targetRole || 'all').toLowerCase().trim();

      if (normRole === 'admin' || normRole === 'teacher') {
        if (target === 'student') return false;
        if (n.category === 'assignment_due' || n.category === 'assignment_graded') return false;
        return target === 'admin' || target === 'teacher' || target === 'all';
      }

      if (normRole === 'student') {
        if (target === 'admin' || target === 'teacher') return false;
        if (n.studentName) {
          if (!normName) return false;
          const targetSt = n.studentName.toLowerCase().trim();
          return targetSt === normName || targetSt.includes(normName) || normName.includes(targetSt);
        }
        return target === 'student' || target === 'all';
      }

      return target === 'all';
    });
  }

  /**
   * Mark a single notification as read
   */
  public markAsRead(id: string) {
    this.notifications = this.notifications.map(n =>
      n.id === id ? { ...n, read: true } : n
    );
    this.saveState();
  }

  /**
   * Mark all notifications as read for current user
   */
  public markAllAsRead(role?: string, studentName?: string) {
    const filteredIds = new Set(this.getFilteredNotifications(role, studentName).map(n => n.id));
    this.notifications = this.notifications.map(n =>
      filteredIds.has(n.id) ? { ...n, read: true } : n
    );
    this.saveState();
  }

  /**
   * Clear all notifications
   */
  public clearAll() {
    this.notifications = [];
    this.saveState();
  }

  /**
   * Get user notification preferences
   */
  public getPreferences(): UserNotificationPreferences {
    return this.preferences;
  }

  /**
   * Update notification preferences
   */
  public updatePreferences(newPrefs: UserNotificationPreferences) {
    this.preferences = newPrefs;
    this.saveState();
  }

  /**
   * CENTRAL DISPATCHER: Trigger a new notification across enabled channels
   */
  public async notify(payload: {
    category: NotificationCategory;
    title: string;
    message: string;
    targetRole?: 'admin' | 'teacher' | 'student' | 'all';
    studentName?: string;
    studentEmail?: string;
    studentPhone?: string;
    assignmentId?: string;
    actionTab?: any;
    priority?: 'low' | 'normal' | 'high' | 'urgent';
    metadata?: Record<string, any>;
  }): Promise<CentralNotification> {
    const id = `NOTIF-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const createdAt = new Date().toISOString().replace('T', ' ').slice(0, 16);

    let mappedType: 'due_date' | 'past_due' | 'graded' | 'submission' | 'general' | 'at_risk_attendance' | 'payment_past_due' = 'general';
    if (payload.category === 'assignment_due') mappedType = 'due_date';
    else if (payload.category === 'assignment_graded') mappedType = 'graded';
    else if (payload.category === 'attendance_warning') mappedType = 'at_risk_attendance';
    else if (payload.category === 'payment_due') mappedType = 'payment_past_due';

    const notification: CentralNotification = {
      id,
      category: payload.category,
      type: mappedType,
      title: payload.title,
      message: payload.message,
      createdAt,
      read: false,
      priority: payload.priority || 'normal',
      targetRole: payload.targetRole || 'all',
      studentName: payload.studentName,
      studentEmail: payload.studentEmail,
      studentPhone: payload.studentPhone,
      assignmentId: payload.assignmentId,
      actionTab: payload.actionTab,
      metadata: payload.metadata,
      deliveryLogs: []
    };

    // Process delivery across registered adapters
    const deliveryLogs: DeliveryLog[] = [];
    for (const adapter of this.adapters) {
      try {
        const log = await adapter.send(notification, this.preferences);
        deliveryLogs.push(log);
      } catch (err: any) {
        deliveryLogs.push({
          channel: adapter.channel,
          status: 'failed',
          timestamp: new Date().toISOString(),
          details: err?.message || 'Delivery error'
        });
      }
    }

    notification.deliveryLogs = deliveryLogs;

    // Check if in-app delivery was allowed
    const inAppLog = deliveryLogs.find(l => l.channel === 'in_app');
    if (inAppLog && inAppLog.status === 'delivered') {
      this.notifications.unshift(notification);
      this.saveState();
    }

    return notification;
  }
}

export const CentralNotificationService = new CentralNotificationServiceClass();
