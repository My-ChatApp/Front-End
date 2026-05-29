const trimSlash = (s: string) => s.replace(/\/+$/, '');

export const API_BASE = trimSlash(import.meta.env.VITE_API_BASE_URL ?? '');
export const WS_BASE = trimSlash(import.meta.env.VITE_WS_BASE_URL ?? '');

/** Ghép base production hoặc path tương đối (dev proxy). */
export function apiUrl(path: string): string {
  const p = path.startsWith('/') ? path : `/${path}`;
  return API_BASE ? `${API_BASE}${p}` : p;
}

export function wsUrl(path = '/ws', query = ''): string {
  const p = path.startsWith('/') ? path : `/${path}`;
  const q = query ? (query.startsWith('?') ? query : `?${query}`) : '';
  return WS_BASE ? `${WS_BASE}${p}${q}` : `${p}${q}`;
}
