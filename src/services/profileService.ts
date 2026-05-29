import { ApiResponse, UserProfile } from '@/types';
import { apiUrl } from '@/config/env';
import { createHttpClient } from './httpClient';
import { uploadFileViaPresign } from './uploadMedia';

const profileClient = createHttpClient(apiUrl('/api/profiles'));

export interface UpdateProfilePayload {
  displayName?: string;
  phone?: string;
  dateOfBirth?: string;
  gender?: string;
  avatarFile?: File | null;
  avatarUrl?: string;
  avatarS3Key?: string;
}

export interface UpdateProfileOptions {
  displayName?: string;
  phone?: string;
  dateOfBirth?: string;
  gender?: string;
}

function appendProfileFields(requestBody: Record<string, string>, payload: UpdateProfilePayload) {
  if (payload.displayName != null && payload.displayName !== '') {
    requestBody.displayName = payload.displayName;
  }
  if (payload.phone !== undefined) {
    requestBody.phone = payload.phone;
  }
  if (payload.dateOfBirth !== undefined) {
    requestBody.dateOfBirth = payload.dateOfBirth;
  }
  if (payload.gender !== undefined) {
    requestBody.gender = payload.gender;
  }
  if (payload.avatarUrl) {
    requestBody.avatarUrl = payload.avatarUrl;
  }
  if (payload.avatarS3Key) {
    requestBody.avatarS3Key = payload.avatarS3Key;
  }
}

function buildProfileFormData(payload: UpdateProfilePayload): FormData {
  const formData = new FormData();
  const requestBody: Record<string, string> = {};
  appendProfileFields(requestBody, payload);

  if (Object.keys(requestBody).length > 0) {
    formData.append(
      'request',
      new Blob([JSON.stringify(requestBody)], { type: 'application/json' })
    );
  }

  if (payload.avatarFile) {
    formData.append('avatar', payload.avatarFile);
  }

  return formData;
}

function payloadFromOptions(options?: UpdateProfileOptions): Partial<UpdateProfilePayload> {
  if (!options) return {};
  return {
    displayName: options.displayName,
    phone: options.phone,
    dateOfBirth: options.dateOfBirth,
    gender: options.gender,
  };
}

export const profileService = {
  getById: async (userId: string): Promise<ApiResponse<UserProfile>> => {
    const response = await profileClient.get<ApiResponse<UserProfile>>(`/${userId}`);
    return response.data;
  },

  updateProfile: async (payload: UpdateProfilePayload): Promise<ApiResponse<UserProfile>> => {
    const formData = buildProfileFormData(payload);
    const response = await profileClient.patch<ApiResponse<UserProfile>>(
      '/update-profile',
      formData
    );
    return response.data;
  },

  /** Presign (media-service) → lưu avatarUrl + s3Key qua user-service */
  updateAvatarViaPresign: async (
    file: File,
    options?: UpdateProfileOptions
  ): Promise<ApiResponse<UserProfile>> => {
    const { publicUrl, key } = await uploadFileViaPresign(file, 'avatar');
    return profileService.updateProfile({
      ...payloadFromOptions(options),
      avatarUrl: publicUrl,
      avatarS3Key: key,
    });
  },

  /** Multipart trực tiếp lên user-service → S3 */
  updateAvatarViaMultipart: async (
    file: File,
    options?: UpdateProfileOptions
  ): Promise<ApiResponse<UserProfile>> => {
    return profileService.updateProfile({
      ...payloadFromOptions(options),
      avatarFile: file,
    });
  },
};
