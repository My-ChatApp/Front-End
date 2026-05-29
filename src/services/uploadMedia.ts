import { apiUrl } from '@/config/env';
import { getStoredToken } from './httpClient';

export type MediaUploadPurpose = 'avatar' | 'cover' | 'message';

const FILE_HEAD_SAMPLE_MAX_BYTES = 4096;

export interface PresignedUploadResult {
  uploadUrl: string;
  publicUrl: string;
  key: string;
  contentType: string;
}

interface MediaErrorBody {
  code?: string;
  message?: string;
  maxBytes?: number;
}

function bufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.length; i += 1) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

async function readFileHeadBase64(file: File): Promise<string> {
  const sampleSize = Math.min(FILE_HEAD_SAMPLE_MAX_BYTES, file.size);
  const slice = file.slice(0, sampleSize);
  return bufferToBase64(await slice.arrayBuffer());
}

/**
 * Presigned PUT via media-service → upload trực tiếp lên S3.
 * Gửi mẫu đầu file để Magika xác thực nội dung trước khi cấp URL.
 */
export async function uploadFileViaPresign(
  file: File,
  purpose: MediaUploadPurpose
): Promise<PresignedUploadResult> {
  const token = getStoredToken();
  if (!token) {
    throw new Error('Chưa đăng nhập');
  }

  const rawType = file.type || 'application/octet-stream';
  const contentType = String(rawType).split(';')[0].trim() || 'application/octet-stream';
  const fileHeadBase64 = await readFileHeadBase64(file);

  const res = await fetch(apiUrl('/api/media/presigned-upload'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      purpose,
      fileName: file.name,
      contentType,
      contentLength: file.size,
      fileHeadBase64,
    }),
  });

  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as MediaErrorBody;
    if (err.code === 'UNSUPPORTED_CONTENT_TYPE' || err.code === 'UNSUPPORTED_EXTENSION' || err.code === 'CONTENT_TYPE_MISMATCH') {
      throw new Error('Loại file không được hợp lệ hoặc không khớp đuôi file');
    }
    if (err.code === 'FILE_TOO_LARGE') {
      const maxMb =
        typeof err.maxBytes === 'number' && err.maxBytes > 0
          ? Math.ceil(err.maxBytes / (1024 * 1024))
          : null;
      throw new Error(
        maxMb ? `Dung lượng file vượt giới hạn (tối đa ${maxMb} MB)` : 'Dung lượng file vượt giới hạn'
      );
    }
    if (err.code === 'RATE_LIMIT_EXCEEDED') {
      throw new Error(
        err.message ?? 'Đã thử quá nhiều lần trong 1 phút. Vui lòng đợi rồi thử lại.'
      );
    }
    throw new Error(err.message || `Presign failed (${res.status})`);
  }

  const { uploadUrl, publicUrl, key, contentType: signedContentType } =
    (await res.json()) as PresignedUploadResult;

  const put = await fetch(uploadUrl, {
    method: 'PUT',
    body: file,
    headers: { 'Content-Type': signedContentType },
  });

  if (!put.ok) {
    throw new Error(`S3 upload failed (${put.status})`);
  }

  return { uploadUrl, publicUrl, key, contentType: signedContentType };
}
