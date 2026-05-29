import { useUserProfile } from './useUserProfile';

export {
  prefetchUserProfile,
  prefetchUserProfile as prefetchUserDisplayName,
  setCachedUserDisplayName,
  setCachedUserPresence,
  invalidateUserProfile,
  invalidateUserProfile as invalidateUserDisplayName,
  useUserProfile,
} from './useUserProfile';

export function useUserDisplayName(userId: string | undefined): string | null {
  return useUserProfile(userId).displayName;
}
