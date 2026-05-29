import { ApiResponse } from '@/types';
import { apiUrl } from '@/config/env';
import { createHttpClient } from './httpClient';

export interface AppUser {
  id: string;
  email?: string;
  username?: string;
  displayName?: string;
}

const userClient = createHttpClient(apiUrl('/api/users'));

export const userService = {
  listActive: async (): Promise<ApiResponse<AppUser[]>> => {
    const response = await userClient.get<ApiResponse<AppUser[]>>('');
    return response.data;
  },

  getById: async (id: string): Promise<ApiResponse<AppUser>> => {
    const response = await userClient.get<ApiResponse<AppUser>>(`/${id}`);
    return response.data;
  },
};
