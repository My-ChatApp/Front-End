/** Avatar SVG served from Vite public folder. */
export const DEFAULT_AVATAR_URL = '/default-avatar.svg';

const BACKEND_DEFAULT_AVATAR_MARKERS = ['static/default-avatar.jpg', 'default-avatar.jpg'] as const;

/** True when the user has not uploaded a custom avatar. */
export function isDefaultAvatar(avatarUrl?: string | null): boolean {
  const trimmed = avatarUrl?.trim();
  if (!trimmed) return true;

  const lower = trimmed.toLowerCase();
  if (BACKEND_DEFAULT_AVATAR_MARKERS.some((marker) => lower.includes(marker))) {
    return true;
  }

  try {
    const path = new URL(trimmed).pathname.toLowerCase();
    return BACKEND_DEFAULT_AVATAR_MARKERS.some((marker) => path.endsWith(marker));
  } catch {
    return lower.includes('default-avatar');
  }
}

/** Returns a displayable avatar URL, falling back to the bundled default image. */
export function resolveAvatarUrl(avatarUrl?: string | null): string {
  if (isDefaultAvatar(avatarUrl)) {
    return DEFAULT_AVATAR_URL;
  }
  return avatarUrl!.trim();
}

export function formatDobDisplay(ymd?: string | null): string {
  if (!ymd || !/^\d{4}-\d{2}-\d{2}$/.test(ymd)) return '—';
  const [y, m, d] = ymd.split('-');
  return `${d}/${m}/${y}`;
}

export function genderLabel(code?: string | null): string {
  const c = String(code || '').toUpperCase();
  if (c === 'MALE') return 'Nam';
  if (c === 'FEMALE') return 'Nữ';
  if (c === 'OTHER') return 'Khác';
  return '—';
}
