import { AppNotification } from '../../types';
import { 
  CentralNotification, 
  NotificationCategory, 
  NotificationPriority, 
  NotificationEventType,
  CATEGORY_LABELS,
  NOTIFICATION_DEFINITIONS 
} from '../../types/notifications';

export type { AppNotification, CentralNotification, NotificationCategory, NotificationPriority, NotificationEventType };
export { CATEGORY_LABELS, NOTIFICATION_DEFINITIONS };

export interface NotificationFilterOptions {
  category?: NotificationCategory | 'all';
  unreadOnly?: boolean;
  searchQuery?: string;
}
