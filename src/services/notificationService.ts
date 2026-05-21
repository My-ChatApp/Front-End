import { ApiResponse, NotificationItem } from '@/types';
import { createHttpClient } from './httpClient';

const notificationClient = createHttpClient('/api/notifications');

export const notificationService = {
  getByUser: async (userId: string): Promise<ApiResponse<NotificationItem[]>> => {
    const response = await notificationClient.get<ApiResponse<NotificationItem[]>>(`/user/${userId}`);
    return response.data;
  },

  getUnreadCount: async (userId: string): Promise<ApiResponse<number>> => {
    const response = await notificationClient.get<ApiResponse<number>>(`/user/${userId}/unread-count`);
    return response.data;
  },

  markRead: async (notificationId: string): Promise<ApiResponse<null>> => {
    const response = await notificationClient.put<ApiResponse<null>>(`/${notificationId}/read`);
    return response.data;
  },
};
