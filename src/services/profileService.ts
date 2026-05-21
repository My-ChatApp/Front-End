import { ApiResponse } from '@/types';
import { createHttpClient } from './httpClient';

const profileClient = createHttpClient('/api/user-profiles');

export const profileService = {
  updateProfile: async (displayName: string): Promise<ApiResponse<null>> => {
    const formData = new FormData();
    formData.append(
      'request',
      new Blob([JSON.stringify({ displayName })], { type: 'application/json' })
    );

    const response = await profileClient.patch<ApiResponse<null>>('/update-profile', formData);

    return response.data;
  },
};
