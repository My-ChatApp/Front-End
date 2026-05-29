import { useEffect, useState } from 'react';
import { profileService } from '@/services/profileService';
import { UserProfile } from '@/types';

export type UserProfileSnapshot = {
  displayName: string | null;
  avatarUrl: string | null;
  online: boolean;
};

const profileCache = new Map<string, UserProfileSnapshot>();
const profileListeners = new Map<string, Set<() => void>>();

function notifyProfileListeners(userId: string): void {
  profileListeners.get(userId)?.forEach((listener) => listener());
}

function subscribeProfile(userId: string, listener: () => void): () => void {
  if (!profileListeners.has(userId)) {
    profileListeners.set(userId, new Set());
  }
  profileListeners.get(userId)!.add(listener);
  return () => {
    profileListeners.get(userId)?.delete(listener);
  };
}

function resolveDisplayName(data: {
  displayName?: string;
  username?: string;
  email?: string;
}): string | null {
  return data.displayName?.trim() || data.username?.trim() || data.email?.trim() || null;
}

function snapshotFromApi(data: UserProfile): UserProfileSnapshot {
  return {
    displayName: resolveDisplayName(data),
    avatarUrl: data.avatarUrl?.trim() || null,
    online: Boolean(data.online),
  };
}

function fetchAndCache(userId: string): Promise<UserProfileSnapshot | null> {
  return profileService
    .getById(userId)
    .then((res) => {
      if (!res.success || !res.data) return null;
      const snap = snapshotFromApi(res.data);
      profileCache.set(userId, snap);
      notifyProfileListeners(userId);
      return snap;
    })
    .catch(() => null);
}

/** Cập nhật cache khi nhận presence realtime qua WebSocket */
export function setCachedUserPresence(
  userId: string,
  patch: Partial<Pick<UserProfileSnapshot, 'online' | 'displayName'>>
): void {
  if (!userId) return;
  const existing = profileCache.get(userId) ?? {
    displayName: null,
    avatarUrl: null,
    online: false,
  };
  profileCache.set(userId, { ...existing, ...patch });
  notifyProfileListeners(userId);
}

export function prefetchUserProfile(userId: string): void {
  if (!userId || profileCache.has(userId)) return;
  void fetchAndCache(userId);
}

/** @deprecated Use prefetchUserProfile */
export function prefetchUserDisplayName(userId: string): void {
  prefetchUserProfile(userId);
}

export function setCachedUserDisplayName(userId: string, name: string): void {
  const trimmed = name.trim();
  if (!userId || !trimmed) return;
  const existing = profileCache.get(userId) ?? {
    displayName: null,
    avatarUrl: null,
    online: false,
  };
  profileCache.set(userId, { ...existing, displayName: trimmed });
  notifyProfileListeners(userId);
}

export function invalidateUserProfile(userId: string): void {
  if (userId) profileCache.delete(userId);
}

export function invalidateUserDisplayName(userId: string): void {
  invalidateUserProfile(userId);
}

export function useUserProfile(userId: string | undefined): UserProfileSnapshot & {
  loading: boolean;
} {
  const [snap, setSnap] = useState<UserProfileSnapshot | null>(() =>
    userId ? profileCache.get(userId) ?? null : null
  );
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!userId) {
      setSnap(null);
      setLoading(false);
      return;
    }

    const cached = profileCache.get(userId);
    if (cached) {
      setSnap(cached);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    fetchAndCache(userId).then((next) => {
      if (!cancelled) {
        setSnap(next);
        setLoading(false);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [userId]);

  useEffect(() => {
    if (!userId) return undefined;
    return subscribeProfile(userId, () => {
      setSnap(profileCache.get(userId) ?? null);
    });
  }, [userId]);

  return {
    displayName: snap?.displayName ?? null,
    avatarUrl: snap?.avatarUrl ?? null,
    online: snap?.online ?? false,
    loading,
  };
}
