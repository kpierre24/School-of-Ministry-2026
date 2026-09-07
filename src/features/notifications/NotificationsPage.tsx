import React from 'react';
import { NotificationCenter } from '../../components/NotificationCenter';
import { AppNotification } from '../../types';

export interface NotificationsPageProps {
  notifications: AppNotification[];
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
  onClearNotifications: () => void;
  onSelectNotification: (notification: AppNotification) => void;
  onTriggerScan?: () => void;
  currentRole?: string;
  currentStudentName?: string;
}

export const NotificationsPage: React.FC<NotificationsPageProps> = (props) => {
  return (
    <div className="w-full max-w-4xl mx-auto p-4">
      <NotificationCenter {...props} />
    </div>
  );
};

export default NotificationsPage;
