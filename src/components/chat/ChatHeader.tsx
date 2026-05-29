import { Hash, Settings2 } from 'lucide-react';
import { useAuth } from '@/context';
import { useChat } from '@/context/ChatContext';
import { useUserProfile } from '@/hooks/useUserProfile';
import { getConversationTitle, getOtherMemberId } from '@/utils/chatUtils';
import { ChatAvatar } from './ChatAvatar';

interface ChatHeaderProps {
  detailOpen?: boolean;
  onToggleDetail?: () => void;
}

export const ChatHeader = ({ detailOpen = false, onToggleDetail }: ChatHeaderProps) => {
  const { user } = useAuth();
  const { selectedConversation, pendingPrivateRecipientId, socketConnected } = useChat();

  const isGroup = selectedConversation?.type === 'GROUP';
  const otherId =
    pendingPrivateRecipientId ||
    (selectedConversation?.type === 'PRIVATE' && user?.id
      ? getOtherMemberId(selectedConversation, user.id)
      : undefined);

  const peerProfile = useUserProfile(otherId);

  if (!selectedConversation && !pendingPrivateRecipientId) return null;

  const title = selectedConversation
    ? getConversationTitle(selectedConversation, user?.id || '', peerProfile.displayName)
    : getConversationTitle(
        { type: 'PRIVATE', members: [] },
        user?.id || '',
        peerProfile.displayName
      );

  const headerAvatarUrl = isGroup
    ? selectedConversation?.avatarUrl
    : peerProfile.avatarUrl;

  const statusLabel = !isGroup
    ? peerProfile.online
      ? 'Trực tuyến'
      : 'Ngoại tuyến'
    : socketConnected
      ? 'Đã kết nối realtime'
      : 'Đang kết nối...';

  return (
    <header className="discord-topbar flex h-12 shrink-0 items-center gap-3 px-4 shadow-sm">
      <ChatAvatar
        name={title}
        avatarUrl={headerAvatarUrl}
        size="md"
        isGroup={isGroup}
        showOnlineBadge={!isGroup}
        online={peerProfile.online}
        ringClassName="border-[var(--discord-panel)]"
      />
      <div className="min-w-0 flex-1">
        <h1 className="flex items-center gap-1.5 truncate text-sm font-semibold text-[var(--discord-text)]">
          {isGroup && <Hash className="size-3.5 shrink-0 text-[var(--discord-text-muted)]" />}
          {title}
        </h1>
        <p
          className={`text-[11px] ${
            !isGroup && peerProfile.online
              ? 'font-medium text-[var(--discord-success)]'
              : 'text-[var(--discord-text-faint)]'
          }`}
        >
          {statusLabel}
        </p>
      </div>
      {onToggleDetail ? (
        <button
          type="button"
          onClick={onToggleDetail}
          className={`discord-icon-button flex size-8 items-center justify-center rounded-md ${
            detailOpen
              ? 'bg-[var(--discord-active)] text-[var(--discord-text)]'
              : 'text-[var(--discord-text-muted)]'
          }`}
          aria-label="Chi tiết hội thoại"
          title="Chi tiết hội thoại"
        >
          <Settings2 className="size-4" />
        </button>
      ) : null}
    </header>
  );
};
