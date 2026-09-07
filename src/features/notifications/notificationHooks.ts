import { useState, useMemo, useCallback } from 'react';
import { AppNotification } from '../../types';
import { notificationService } from './notificationService';

export function useNotifications(initialNotifications: AppNotification[] = []) {
  const [notifications, setNotifications] = useState<AppNotification[]>(initialNotifications);
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const markAsRead = useCallback((id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  const filteredNotifications = useMemo(() => {
    return notificationService.filterNotifications(notifications, { unreadOnly, searchQuery });
  }, [notifications, unreadOnly, searchQuery]);

  const unreadCount = useMemo(() => {
    return notificationService.getUnreadCount(notifications);
  }, [notifications]);

  return {
    notifications,
    setNotifications,
    unreadOnly,
    setUnreadOnly,
    searchQuery,
    setSearchQuery,
    markAsRead,
    markAllAsRead,
    clearAll,
    filteredNotifications,
    unreadCount,
  };
}
