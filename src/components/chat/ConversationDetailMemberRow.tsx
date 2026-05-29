import { MoreHorizontal } from 'lucide-react';
import { useAuth } from '@/context';
import { useUserProfile } from '@/hooks/useUserProfile';
import type { MemberRole } from '@/types';
import { ChatAvatar } from './ChatAvatar';

interface ConversationDetailMemberRowProps {
  userId: string;
  role: MemberRole;
  canKick?: boolean;
  onKick?: () => void;
  kicking?: boolean;
}

const roleLabel: Record<MemberRole, string> = {
  OWNER: 'Chủ nhóm',
  MEMBER: 'Thành viên',
};

export const ConversationDetailMemberRow = ({
  userId,
  role,
  canKick = false,
  onKick,
  kicking = false,
}: ConversationDetailMemberRowProps) => {
  const { user } = useAuth();
  const isMe = user?.id != null && String(user.id) === String(userId);
  const profile = useUserProfile(userId);
  const displayName = isMe
    ? user?.username?.trim() || user?.email?.trim() || profile.displayName || 'Bạn'
    : profile.displayName || `${userId.slice(0, 8)}…`;

  return (
    <div className="flex items-center gap-2 rounded-lg px-1 py-1">
      <ChatAvatar
        name={displayName}
        avatarUrl={profile.avatarUrl}
        size="md"
        showOnlineBadge
        online={profile.online}
      />
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm text-[var(--discord-text)]">
          {displayName}
          {isMe ? (
            <span className="ml-1 text-[11px] font-normal text-[var(--discord-text-faint)]">
              (bạn)
            </span>
          ) : null}
        </div>
        <div className="text-xs text-[var(--discord-text-faint)]">{roleLabel[role]}</div>
      </div>
      {canKick && role !== 'OWNER' && onKick ? (
        <button
          type="button"
          className="discord-icon-button flex size-8 items-center justify-center rounded-md"
          title="Xóa khỏi nhóm"
          disabled={kicking}
          onClick={onKick}
        >
          <MoreHorizontal className="size-4" />
        </button>
      ) : null}
    </div>
  );
};
