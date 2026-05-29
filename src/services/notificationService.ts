import { ApiResponse, NotificationItem } from '@/types';
import { apiUrl } from '@/config/env';
import { createHttpClient } from './httpClient';

const notificationClient = createHttpClient(apiUrl('/api/notifications'));

const mapNotification = (item: NotificationItem): NotificationItem => ({
  ...item,
  isRead: item.isRead ?? item.read ?? false,
});

export const notificationService = {
  getByUser: async (userId: string): Promise<ApiResponse<NotificationItem[]>> => {
    const response = await notificationClient.get<ApiResponse<NotificationItem[]>>(`/user/${userId}`);
    return {
      ...response.data,
      data: (response.data.data || []).map(mapNotification),
    };
  },

  getUnreadCount: async (userId: string): Promise<ApiResponse<number>> => {
    const response = await notificationClient.get<ApiResponse<number>>(`/user/${userId}/unread-count`);
    return response.data;
  },

  markRead: async (notificationId: string): Promise<ApiResponse<null>> => {
    const response = await notificationClient.put<ApiResponse<null>>(`/${notificationId}/read`);
    return response.data;
  },

  markAllRead: async (userId: string): Promise<ApiResponse<number>> => {
    const response = await notificationClient.put<ApiResponse<number>>(`/user/${userId}/read-all`);
    return response.data;
  },
};
