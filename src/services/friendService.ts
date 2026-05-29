import { ApiResponse, FriendRequest, SendFriendRequestRequest } from '@/types';
import { apiUrl } from '@/config/env';
import { createHttpClient } from './httpClient';

const friendClient = createHttpClient(apiUrl('/api/friends'));

export const friendService = {
  sendRequest: async (payload: SendFriendRequestRequest): Promise<ApiResponse<FriendRequest>> => {
    const response = await friendClient.post<ApiResponse<FriendRequest>>('/request', payload);
    return response.data;
  },

  acceptRequest: async (requestId: string, receiverId: string): Promise<ApiResponse<FriendRequest>> => {
    const response = await friendClient.put<ApiResponse<FriendRequest>>(
      `/request/${requestId}/accept`,
      undefined,
      { params: { receiverId } }
    );
    return response.data;
  },

  rejectRequest: async (requestId: string, receiverId: string): Promise<ApiResponse<FriendRequest>> => {
    const response = await friendClient.put<ApiResponse<FriendRequest>>(
      `/requests/${requestId}/reject`,
      undefined,
      { params: { receiverId } }
    );
    return response.data;
  },

  listIncoming: async (userId: string): Promise<ApiResponse<FriendRequest[]>> => {
    const response = await friendClient.get<ApiResponse<FriendRequest[]>>(
      `/requests/incoming/${userId}`
    );
    return response.data;
  },

  listOutgoing: async (userId: string): Promise<ApiResponse<FriendRequest[]>> => {
    const response = await friendClient.get<ApiResponse<FriendRequest[]>>(
      `/requests/outgoing/${userId}`
    );
    return response.data;
  },

  listFriends: async (userId: string): Promise<ApiResponse<FriendRequest[]>> => {
    const response = await friendClient.get<ApiResponse<FriendRequest[]>>('', {
      params: { userId },
    });
    return response.data;
  },

  cancelOutgoing: async (requestId: string, senderId: string): Promise<ApiResponse<void>> => {
    const response = await friendClient.delete<ApiResponse<void>>(`/requests/${requestId}`, {
      params: { senderId },
    });
    return response.data;
  },

  removeFriend: async (friendUserId: string, userId: string): Promise<ApiResponse<void>> => {
    const response = await friendClient.delete<ApiResponse<void>>(`/${friendUserId}`, {
      params: { userId },
    });
    return response.data;
  },
};
