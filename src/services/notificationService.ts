/**
 * ============================================================================
 * NOTIFICATION SERVICE
 * HTEIM School of Ministry
 * ============================================================================
 * Manages central notification dispatching, in-app alerts, read receipts,
 * and multichannel user delivery preferences.
 * Communicates authoritatively with Express API (/api/notifications).
 */

import { apiClient, ApiClientError } from './apiClient';
import {
  CentralNotification,
  NotificationCategory,
  NotificationPriority,
  UserNotificationPreferences,
} from '../types/notifications';

export interface NotificationQueryParams {
  role?: string;
  studentName?: string;
  category?: NotificationCategory;
  eventType?: string;
  unreadOnly?: boolean;
  limit?: number;
}

export interface NotificationsListResponse {
  success: boolean;
  notifications: CentralNotification[];
  stats: {
    total: number;
    unread: number;
    urgent: number;
  };
}

export interface CreateNotificationPayload {
  title: string;
  message: string;
  category: NotificationCategory;
  priority?: NotificationPriority;
  targetRole?: 'all' | 'admin' | 'teacher' | 'student';
  studentName?: string;
  actionTab?: string;
}

export class NotificationService {
  /**
   * Retrieves notifications matching filter criteria.
   */
  public async getNotifications(params?: NotificationQueryParams): Promise<NotificationsListResponse> {
    const queryParams: Record<string, any> = {};
    if (params?.role) queryParams.role = params.role;
    if (params?.studentName) queryParams.studentName = params.studentName;
    if (params?.category) queryParams.category = params.category;
    if (params?.eventType) queryParams.eventType = params.eventType;
    if (params?.unreadOnly) queryParams.unreadOnly = 'true';
    if (params?.limit) queryParams.limit = params.limit;

    return apiClient.get<NotificationsListResponse>('/notifications', queryParams);
  }

  /**
   * Dispatches a new notification to target role or specific student.
   */
  public async createNotification(
    payload: CreateNotificationPayload
  ): Promise<{ success: boolean; notification: CentralNotification }> {
    if (!payload.title || !payload.title.trim()) {
      throw new ApiClientError('Notification title is required', 400, '/notifications', 'validation');
    }

    if (!payload.message || !payload.message.trim()) {
      throw new ApiClientError('Notification message is required', 400, '/notifications', 'validation');
    }

    return apiClient.post<{ success: boolean; notification: CentralNotification }>('/notifications', {
      ...payload,
      title: payload.title.trim(),
      message: payload.message.trim(),
      category: payload.category || 'system',
      priority: payload.priority || 'normal',
      targetRole: payload.targetRole || 'all',
    });
  }

  /**
   * Marks an individual notification as read.
   */
  public async markAsRead(notificationId: string): Promise<{ success: boolean; notification: CentralNotification }> {
    if (!notificationId) {
      throw new ApiClientError('Notification ID is required', 400, '/notifications/:id/read', 'validation');
    }

    return apiClient.put<{ success: boolean; notification: CentralNotification }>(
      `/notifications/${encodeURIComponent(notificationId)}/read`
    );
  }

  /**
   * Marks all notifications as read for a given role or student.
   */
  public async markAllAsRead(
    role = 'all',
    studentName?: string
  ): Promise<{ success: boolean; message: string }> {
    return apiClient.put<{ success: boolean; message: string }>('/notifications/read-all', {
      role,
      studentName,
    });
  }

  /**
   * Deletes a notification by ID.
   */
  public async deleteNotification(notificationId: string): Promise<{ success: boolean; message: string }> {
    if (!notificationId) {
      throw new ApiClientError('Notification ID is required', 400, '/notifications/:id', 'validation');
    }

    return apiClient.delete<{ success: boolean; message: string }>(
      `/notifications/${encodeURIComponent(notificationId)}`
    );
  }

  /**
   * Retrieves notification channel preferences.
   */
  public async getPreferences(): Promise<{ success: boolean; preferences: UserNotificationPreferences; channels: any }> {
    return apiClient.get<{ success: boolean; preferences: UserNotificationPreferences; channels: any }>(
      '/notifications/preferences'
    );
  }

  /**
   * Saves updated notification preferences.
   */
  public async savePreferences(
    preferences: UserNotificationPreferences
  ): Promise<{ success: boolean; preferences: UserNotificationPreferences }> {
    return apiClient.put<{ success: boolean; preferences: UserNotificationPreferences }>(
      '/notifications/preferences',
      { preferences }
    );
  }

  /**
   * Dispatches a test notification for verification.
   */
  public async dispatchTestNotification(
    eventType: string,
    targetStudentName?: string
  ): Promise<{ success: boolean; notification: CentralNotification; message: string }> {
    return apiClient.post<{ success: boolean; notification: CentralNotification; message: string }>(
      '/notifications/test-dispatch',
      { eventType, targetStudentName }
    );
  }
}

export const notificationService = new NotificationService();
