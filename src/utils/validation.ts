import { UserGender } from '@/types';

/** Giới hạn khớp với backend (CreateUserRequest, DB schema, media-service). */
export const VALIDATION_LIMITS = {
  usernameMax: 50,
  passwordMin: 6,
  passwordMax: 100,
  displayNameMax: 100,
  phoneMax: 20,
  avatarMaxBytes: 5 * 1024 * 1024,
} as const;

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const USERNAME_REGEX = /^[a-zA-Z0-9_]+$/;
const PHONE_REGEX = /^[\d\s+\-()]*$/;
const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

const AVATAR_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
]);

export type FieldErrors<T extends string> = Partial<Record<T, string>>;

type FormValidation<T extends string> =
  | { valid: true }
  | { valid: false; fields: FieldErrors<T>; message: string };

function required(value: string, label: string): string | null {
  if (!value.trim()) return `${label} không được để trống`;
  return null;
}

export function validateEmail(value: string): string | null {
  const trimmed = value.trim();
  const req = required(trimmed, 'Email');
  if (req) return req;
  if (!EMAIL_REGEX.test(trimmed)) return 'Email không hợp lệ';
  return null;
}

export function validatePassword(value: string): string | null {
  const req = required(value, 'Mật khẩu');
  if (req) return req;
  if (value.length < VALIDATION_LIMITS.passwordMin) {
    return `Mật khẩu phải có ít nhất ${VALIDATION_LIMITS.passwordMin} ký tự`;
  }
  if (value.length > VALIDATION_LIMITS.passwordMax) {
    return `Mật khẩu tối đa ${VALIDATION_LIMITS.passwordMax} ký tự`;
  }
  return null;
}

export function validateLoginPassword(value: string): string | null {
  return required(value, 'Mật khẩu');
}

export function validateUsername(value: string): string | null {
  const trimmed = value.trim();
  const req = required(trimmed, 'Tên người dùng');
  if (req) return req;
  if (trimmed.length > VALIDATION_LIMITS.usernameMax) {
    return `Tên người dùng tối đa ${VALIDATION_LIMITS.usernameMax} ký tự`;
  }
  if (!USERNAME_REGEX.test(trimmed)) {
    return 'Tên người dùng chỉ gồm chữ, số và dấu gạch dưới (_)';
  }
  return null;
}

export function validateConfirmPassword(password: string, confirmPassword: string): string | null {
  if (!confirmPassword) return 'Xác nhận mật khẩu không được để trống';
  if (password !== confirmPassword) return 'Mật khẩu xác nhận không khớp';
  return null;
}

export function validateLoginForm(
  email: string,
  password: string
): FormValidation<'email' | 'password'> {
  const fields: FieldErrors<'email' | 'password'> = {};
  const emailError = validateEmail(email);
  const passwordError = validateLoginPassword(password);
  if (emailError) fields.email = emailError;
  if (passwordError) fields.password = passwordError;

  if (Object.keys(fields).length > 0) {
    return {
      valid: false,
      fields,
      message: emailError || passwordError || 'Vui lòng kiểm tra lại thông tin',
    };
  }
  return { valid: true };
}

export function validateRegisterForm(data: {
  email: string;
  username: string;
  password: string;
  confirmPassword: string;
}): FormValidation<'email' | 'username' | 'password' | 'confirmPassword'> {
  const fields: FieldErrors<'email' | 'username' | 'password' | 'confirmPassword'> = {};
  const emailError = validateEmail(data.email);
  const usernameError = validateUsername(data.username);
  const passwordError = validatePassword(data.password);
  const confirmError = validateConfirmPassword(data.password, data.confirmPassword);

  if (emailError) fields.email = emailError;
  if (usernameError) fields.username = usernameError;
  if (passwordError) fields.password = passwordError;
  if (confirmError) fields.confirmPassword = confirmError;

  if (Object.keys(fields).length > 0) {
    return {
      valid: false,
      fields,
      message:
        emailError ||
        usernameError ||
        passwordError ||
        confirmError ||
        'Vui lòng kiểm tra lại thông tin',
    };
  }
  return { valid: true };
}

export function validateDisplayName(value: string): string | null {
  const trimmed = value.trim();
  const req = required(trimmed, 'Tên hiển thị');
  if (req) return req;
  if (trimmed.length > VALIDATION_LIMITS.displayNameMax) {
    return `Tên hiển thị tối đa ${VALIDATION_LIMITS.displayNameMax} ký tự`;
  }
  return null;
}

export function validatePhone(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (trimmed.length > VALIDATION_LIMITS.phoneMax) {
    return `Số điện thoại tối đa ${VALIDATION_LIMITS.phoneMax} ký tự`;
  }
  if (!PHONE_REGEX.test(trimmed)) {
    return 'Số điện thoại chỉ gồm số và các ký tự + - ( )';
  }
  return null;
}

export function validateDateOfBirth(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (!DATE_REGEX.test(trimmed)) return 'Ngày sinh không hợp lệ (định dạng yyyy-MM-dd)';

  const [y, m, d] = trimmed.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  if (
    date.getFullYear() !== y ||
    date.getMonth() !== m - 1 ||
    date.getDate() !== d
  ) {
    return 'Ngày sinh không hợp lệ';
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (date > today) return 'Ngày sinh không được ở tương lai';
  return null;
}

export function validateGender(value: string): string | null {
  if (!value) return null;
  const upper = value.toUpperCase();
  if (upper !== 'MALE' && upper !== 'FEMALE' && upper !== 'OTHER') {
    return 'Giới tính không hợp lệ';
  }
  return null;
}

export function validateProfileForm(data: {
  displayName: string;
  phone: string;
  dateOfBirth: string;
  gender: UserGender | '';
}): FormValidation<'displayName' | 'phone' | 'dateOfBirth' | 'gender'> {
  const fields: FieldErrors<'displayName' | 'phone' | 'dateOfBirth' | 'gender'> = {};
  const displayNameError = validateDisplayName(data.displayName);
  const phoneError = validatePhone(data.phone);
  const dobError = validateDateOfBirth(data.dateOfBirth);
  const genderError = validateGender(data.gender);

  if (displayNameError) fields.displayName = displayNameError;
  if (phoneError) fields.phone = phoneError;
  if (dobError) fields.dateOfBirth = dobError;
  if (genderError) fields.gender = genderError;

  if (Object.keys(fields).length > 0) {
    return {
      valid: false,
      fields,
      message:
        displayNameError ||
        phoneError ||
        dobError ||
        genderError ||
        'Vui lòng kiểm tra lại thông tin',
    };
  }
  return { valid: true };
}

export function validateAvatarFile(file: File): string | null {
  const mime = (file.type || '').split(';')[0].trim().toLowerCase();
  if (!AVATAR_MIME_TYPES.has(mime)) {
    return 'Chỉ chấp nhận file ảnh (JPEG, PNG, WebP, GIF)';
  }
  if (file.size > VALIDATION_LIMITS.avatarMaxBytes) {
    return 'Ảnh đại diện tối đa 5 MB';
  }
  return null;
}

export function inputErrorClass(hasError: boolean, baseClass: string): string {
  return hasError
    ? `${baseClass} border-red-400 focus:border-red-500 focus:ring-red-500/10`
    : baseClass;
}
