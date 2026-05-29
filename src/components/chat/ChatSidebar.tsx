import { useEffect, useMemo, useState } from 'react';
import { Plus, Search } from 'lucide-react';
import { useAuth } from '@/context';
import { useChat } from '@/context/ChatContext';
import { useUserDisplayName } from '@/hooks/useUserDisplayName';
import { prefetchUserProfile, useUserProfile } from '@/hooks/useUserProfile';
import { ChatAvatar } from './ChatAvatar';
import { Conversation } from '@/types';
import {
  formatConversationLastMessagePreview,
  formatMessageTime,
  getConversationTitle,
  getConversationUnreadCount,
  getOtherMemberId,
} from '@/utils/chatUtils';
import { SidebarSkeleton } from './skeletons/SidebarSkeleton';

const sortByRecent = (list: Conversation[]) =>
  [...list].sort((a, b) => (b.lastMessageAt || '').localeCompare(a.lastMessageAt || ''));

export const ChatSidebar = () => {
  const { user } = useAuth();
  const {
    conversations,
    selectedConversation,
    isLoadingConversations,
    selectConversation,
    setShowCreateGroup,
  } = useChat();
  const [query, setQuery] = useState('');
  const currentUserId = user?.id || '';

  useEffect(() => {
    conversations.forEach((c) => {
      if (c.lastMessageSenderId) prefetchUserProfile(c.lastMessageSenderId);
      if (c.type === 'PRIVATE') {
        const otherId = getOtherMemberId(c, currentUserId);
        if (otherId) prefetchUserProfile(otherId);
      }
    });
  }, [conversations, currentUserId]);

  const { directMessages, groupChats } = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filterByQuery = (list: Conversation[]) => {
      if (!q) return list;
      return list.filter((c) =>
        getConversationTitle(c, currentUserId).toLowerCase().includes(q)
      );
    };

    return {
      directMessages: sortByRecent(
        filterByQuery(conversations.filter((c) => c.type === 'PRIVATE'))
      ),
      groupChats: sortByRecent(filterByQuery(conversations.filter((c) => c.type === 'GROUP'))),
    };
  }, [conversations, query, currentUserId]);

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="shrink-0 border-b border-white/10 p-3">
        <div className="flex items-center justify-between gap-2">
          <h2 className="truncate text-sm font-bold text-[var(--discord-text)]">Tin nhắn</h2>
          <button
            type="button"
            onClick={() => setShowCreateGroup(true)}
            className="discord-icon-button flex size-8 items-center justify-center text-[var(--discord-success)]"
            title="Tạo nhóm"
          >
            <Plus className="size-4" />
          </button>
        </div>
        <div className="mt-2 flex items-center gap-2 rounded-md bg-[var(--discord-panel)] px-2 py-1.5">
          <Search className="size-4 shrink-0 text-[var(--discord-text-faint)]" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Tìm hội thoại..."
            className="discord-input-reset w-full text-sm"
          />
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-2 py-1">
        {isLoadingConversations ? (
          <SidebarSkeleton count={5} />
        ) : (
          <>
            <ConversationSection
              title="Tin nhắn trực tiếp"
              conversations={directMessages}
              selectedConversation={selectedConversation}
              currentUserId={currentUserId}
              onSelect={selectConversation}
              emptyMessage="Chưa có tin nhắn trực tiếp"
            />
            <ConversationSection
              title="Nhóm"
              conversations={groupChats}
              selectedConversation={selectedConversation}
              currentUserId={currentUserId}
              onSelect={selectConversation}
              emptyMessage="Chưa có nhóm"
              isGroup
            />
          </>
        )}
      </div>
    </div>
  );
};

function ConversationSection({
  title,
  conversations,
  selectedConversation,
  currentUserId,
  onSelect,
  emptyMessage,
  isGroup = false,
}: {
  title: string;
  conversations: Conversation[];
  selectedConversation: Conversation | null;
  currentUserId: string;
  onSelect: (conv: Conversation) => void;
  emptyMessage: string;
  isGroup?: boolean;
}) {
  return (
    <div className="mb-3">
      <div className="discord-section-title px-1 pt-2">{title}</div>
      {conversations.length === 0 ? (
        <p className="px-2 py-2 text-center text-xs text-[var(--discord-text-muted)]">
          {emptyMessage}
        </p>
      ) : (
        conversations.map((conv) => (
          <ConversationItem
            key={conv.id}
            conversation={conv}
            isActive={selectedConversation?.id === conv.id}
            currentUserId={currentUserId}
            isGroup={isGroup}
            onSelect={() => onSelect(conv)}
          />
        ))
      )}
    </div>
  );
}

function ConversationItem({
  conversation,
  isActive,
  currentUserId,
  isGroup,
  onSelect,
}: {
  conversation: Conversation;
  isActive: boolean;
  currentUserId: string;
  isGroup: boolean;
  onSelect: () => void;
}) {
  const otherId =
    conversation.type === 'PRIVATE'
      ? getOtherMemberId(conversation, currentUserId)
      : undefined;
  const peerProfile = useUserProfile(otherId);
  const peerName = peerProfile.displayName;
  const senderName = useUserDisplayName(conversation.lastMessageSenderId);
  const title = getConversationTitle(conversation, currentUserId, peerName);
  const avatarUrl = isGroup ? conversation.avatarUrl : peerProfile.avatarUrl;
  const preview = formatConversationLastMessagePreview(
    conversation,
    currentUserId,
    senderName
  );
  const time = formatMessageTime(conversation.lastMessageAt);
  const unread = getConversationUnreadCount(conversation, currentUserId);
  const hasUnread = unread > 0;

  return (
    <button
      type="button"
      onClick={onSelect}
      className={`discord-list-item mb-0.5 ${isActive ? 'is-active' : ''}`}
    >
      <ChatAvatar
        name={title}
        avatarUrl={avatarUrl}
        size="sm"
        isGroup={isGroup}
        showOnlineBadge={!isGroup}
        online={peerProfile.online}
      />
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-1">
          <span
            className={`truncate text-sm ${
              hasUnread
                ? 'font-semibold text-[var(--discord-text)]'
                : 'font-medium text-[var(--discord-text)]'
            }`}
          >
            {title}
          </span>
          <span className="flex shrink-0 items-center gap-1">
            {hasUnread && (
              <span className="flex min-w-[1.125rem] items-center justify-center rounded-full bg-[var(--discord-danger)] px-1 text-[10px] font-bold text-white">
                {unread > 99 ? '99+' : unread}
              </span>
            )}
            {time && (
              <span className="text-[10px] text-[var(--discord-text-faint)]">{time}</span>
            )}
          </span>
        </div>
        <p
          className={`truncate text-xs ${
            hasUnread
              ? 'font-medium text-[var(--discord-text)]'
              : 'text-[var(--discord-text-muted)]'
          }`}
        >
          {preview}
        </p>
      </div>
    </button>
  );
}
