export interface JwtPayload {
  sub?: string;
  userId?: string;
  username?: string;
  exp?: number;
  iat?: number;
}

export const decodeJwtPayload = (token: string): JwtPayload => {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      return {};
    }
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const json = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => `%${`00${c.charCodeAt(0).toString(16)}`.slice(-2)}`)
        .join('')
    );
    return JSON.parse(json) as JwtPayload;
  } catch {
    return {};
  }
};

export const getUserIdFromToken = (token: string): string => {
  const payload = decodeJwtPayload(token);
  return payload.userId || '';
};
