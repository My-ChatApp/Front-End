type ApiErrorBody = {
  message?: string;
  error?: string;
  success?: boolean;
};

const DEBUG_MESSAGE_PATTERNS = [
  /request failed with status code/i,
  /^network error$/i,
  /axios/i,
  /internal_server_error/i,
  /bad_request/i,
  /unauthorized/i,
  /\.java:\d+/i,
  /\bexception\b/i,
  /\bsql\b/i,
  /\bjdbc\b/i,
  /\bstack\s*trace\b/i,
  /^error:/i,
  /failed with status/i,
  /ecconnrefused/i,
  /timeout of \d+ms/i,
];

const HTTP_STATUS_MESSAGES: Record<number, string> = {
  400: 'Thông tin không hợp lệ. Vui lòng kiểm tra lại.',
  401: 'Phiên đăng nhập không hợp lệ. Vui lòng đăng nhập lại.',
  403: 'Bạn không có quyền thực hiện thao tác này.',
  404: 'Không tìm thấy dữ liệu yêu cầu.',
  409: 'Dữ liệu đã tồn tại hoặc bị trùng.',
  429: 'Quá nhiều yêu cầu. Vui lòng thử lại sau.',
  500: 'Hệ thống đang gặp sự cố. Vui lòng thử lại sau.',
  502: 'Không kết nối được máy chủ. Vui lòng thử lại sau.',
  503: 'Dịch vụ tạm thời không khả dụng. Vui lòng thử lại sau.',
};

/** Chỉ hiển thị message ngắn, tiếng Việt hoặc câu thân thiện từ backend — không lộ lỗi kỹ thuật */
export function isUserFriendlyMessage(message: string): boolean {
  const trimmed = message.trim();
  if (!trimmed || trimmed.length > 220) {
    return false;
  }
  return !DEBUG_MESSAGE_PATTERNS.some((pattern) => pattern.test(trimmed));
}

/** Message đã là câu hiển thị cho user (không qua axios) */
export function sanitizeDisplayMessage(
  message: string | null | undefined,
  fallback: string
): string {
  if (!message) {
    return fallback;
  }
  const trimmed = message.trim();
  return isUserFriendlyMessage(trimmed) ? trimmed : fallback;
}

/** Lấy message từ lỗi API / mạng cho người dùng */
export function getUserFacingMessage(error: unknown, fallback: string): string {
  const err = error as {
    response?: { status?: number; data?: ApiErrorBody };
    message?: string;
  };

  const data = err.response?.data;
  const apiMessage = typeof data?.message === 'string' ? data.message.trim() : '';

  if (apiMessage && isUserFriendlyMessage(apiMessage)) {
    return apiMessage;
  }

  const status = err.response?.status;
  if (status != null && HTTP_STATUS_MESSAGES[status]) {
    return HTTP_STATUS_MESSAGES[status];
  }

  if (error instanceof Error) {
    const errorMessage = error.message.trim();
    if (errorMessage && isUserFriendlyMessage(errorMessage)) {
      return errorMessage;
    }
  }

  const networkMessage =
    typeof err.message === 'string' && !(error instanceof Error)
      ? err.message.trim()
      : '';
  if (networkMessage && isUserFriendlyMessage(networkMessage)) {
    return networkMessage;
  }

  return fallback;
}
