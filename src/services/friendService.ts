import { ApiResponse, FriendRequest, SendFriendRequestRequest } from '@/types';
import { createHttpClient } from './httpClient';

const friendClient = createHttpClient('/api/friends');

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
};
