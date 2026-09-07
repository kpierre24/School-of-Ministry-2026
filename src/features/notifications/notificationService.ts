import { AppNotification } from '../../types';
import { CentralNotificationService } from '../../services/notification/CentralNotificationService';
import { NotificationFilterOptions } from './notificationSchemas';

export class NotificationService {
  /**
   * Filter app notifications
   */
  public filterNotifications(
    notifications: AppNotification[],
    options: NotificationFilterOptions
  ): AppNotification[] {
    const q = (options.searchQuery || '').toLowerCase().trim();

    return notifications.filter(n => {
      const matchSearch = !q ||
        n.title.toLowerCase().includes(q) ||
        n.message.toLowerCase().includes(q);

      const matchCategory = !options.category || options.category === 'all' || n.category === options.category;
      const matchUnread = !options.unreadOnly || !n.read;

      return matchSearch && matchCategory && matchUnread;
    });
  }

  /**
   * Unread notification counter
   */
  public getUnreadCount(notifications: AppNotification[]): number {
    return notifications.filter(n => !n.read).length;
  }

  /**
   * Trigger automatic backend sync
   */
  public syncNotifications(): void {
    try {
      CentralNotificationService.syncFromBackend();
    } catch (e) {
      console.error('Failed to sync central notifications:', e);
    }
  }
}

export const notificationService = new NotificationService();
