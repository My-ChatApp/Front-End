import { useEffect, useState } from 'react';
import { profileService } from '@/services/profileService';
import { UserProfile } from '@/types';

export type UserProfileSnapshot = {
  /** Resolved label: displayName, else username, else email */
  displayName: string | null;
  fullName: string | null;
  username: string | null;
  email: string | null;
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

function snapshotFromApi(data: UserProfile): UserProfileSnapshot {
  const fullName = data.displayName?.trim() || null;
  const username = data.username?.trim() || null;
  const email = data.email?.trim() || null;
  return {
    fullName,
    username,
    email,
    displayName: fullName || username || email || null,
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
  const existing = profileCache.get(userId) ?? emptySnapshot();
  const next = { ...existing, ...patch };
  if (patch.displayName !== undefined) {
    next.fullName = patch.displayName;
    next.displayName =
      patch.displayName || existing.username || existing.email || null;
  }
  profileCache.set(userId, next);
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
  const existing = profileCache.get(userId) ?? emptySnapshot();
  profileCache.set(userId, {
    ...existing,
    fullName: trimmed,
    displayName: trimmed || existing.username || existing.email || null,
  });
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
    fullName: snap?.fullName ?? null,
    username: snap?.username ?? null,
    email: snap?.email ?? null,
    avatarUrl: snap?.avatarUrl ?? null,
    online: snap?.online ?? false,
    loading,
  };
}

function emptySnapshot(): UserProfileSnapshot {
  return {
    displayName: null,
    fullName: null,
    username: null,
    email: null,
    avatarUrl: null,
    online: false,
  };
}
