import { useEffect, useState } from 'react';
import { useAuth } from '@/context';
import { useChat } from '@/context/ChatContext';
import { useUserDisplayName } from '@/hooks/useUserDisplayName';
import { getConversationTitle, getOtherMemberId } from '@/utils/chatUtils';
import { ChatHeader } from './ChatHeader';
import { ConversationDetailDrawer } from './ConversationDetailDrawer';
import { MessageList } from './MessageList';
import { MessageInput } from './MessageInput';
import { NoChatSelected } from './NoChatSelected';
import { FriendsPanel } from './FriendsPanel';
import { NotificationsPanel } from './NotificationsPanel';
import { MePanel } from './MePanel';

export const ChatPanel = () => {
  const { user } = useAuth();
  const {
    selectedConversation,
    pendingPrivateRecipientId,
    activeNavView,
  } = useChat();
  const [detailOpen, setDetailOpen] = useState(false);

  const otherId =
    pendingPrivateRecipientId ||
    (selectedConversation?.type === 'PRIVATE' && user?.id
      ? getOtherMemberId(selectedConversation, user.id)
      : undefined);
  const peerName = useUserDisplayName(otherId);
  const detailTitle = selectedConversation
    ? getConversationTitle(selectedConversation, user?.id || '', peerName)
    : getConversationTitle(
        { type: 'PRIVATE', members: [] },
        user?.id || '',
        peerName
      );

  useEffect(() => {
    setDetailOpen(false);
  }, [selectedConversation?.id, pendingPrivateRecipientId]);

  if (activeNavView === 'friends') {
    return <FriendsPanel />;
  }

  if (activeNavView === 'notifications') {
    return <NotificationsPanel />;
  }

  if (activeNavView === 'me') {
    return <MePanel />;
  }

  if (!selectedConversation && !pendingPrivateRecipientId) {
    return <NoChatSelected />;
  }

  return (
    <div className="flex h-full min-h-0 flex-col discord-chat-area">
      <ChatHeader
        detailOpen={detailOpen}
        onToggleDetail={() => setDetailOpen((v) => !v)}
      />
      <MessageList />
      <MessageInput />
      <ConversationDetailDrawer
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        conversation={selectedConversation}
        pendingPrivateRecipientId={pendingPrivateRecipientId}
        title={detailTitle}
      />
    </div>
  );
};
