import { useEffect, useRef } from 'react';
import { useAuth } from '@/context';
import { useChat } from '@/context/ChatContext';
import { MessageBubble } from './MessageBubble';
import { MessageSkeleton } from './skeletons/MessageSkeleton';

export const MessageList = () => {
  const { user } = useAuth();
  const {
    messages,
    isLoadingMessages,
    hasMoreOlder,
    isLoadingOlder,
    loadOlderMessages,
    pendingPrivateRecipientId,
    selectedConversation,
    highlightMessageId,
    pendingScrollMessageId,
  } = useChat();
  const isDraftPrivate = Boolean(pendingPrivateRecipientId && !selectedConversation);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (pendingScrollMessageId) return;
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoadingMessages, pendingScrollMessageId]);

  if (isLoadingMessages) {
    return (
      <div className="flex-1 overflow-y-auto px-2 py-4">
        <MessageSkeleton count={6} />
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-2 text-[var(--discord-text-muted)]">
        <p className="text-sm">
          {isDraftPrivate
            ? 'Chưa có tin nhắn — gửi tin đầu tiên để bắt đầu'
            : 'Chưa có tin nhắn. Hãy gửi lời chào!'}
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto py-4">
      {hasMoreOlder && (
        <div className="mb-3 flex justify-center px-2">
          <button
            type="button"
            disabled={isLoadingOlder}
            onClick={() => void loadOlderMessages()}
            className="rounded-md bg-[var(--discord-bg-tertiary)] px-3 py-1.5 text-xs text-[var(--discord-text-muted)] hover:bg-[var(--discord-bg-modifier-hover)] disabled:opacity-50"
          >
            {isLoadingOlder ? 'Đang tải...' : 'Tải tin cũ hơn'}
          </button>
        </div>
      )}
      {messages.map((msg) => (
        <MessageBubble
          key={msg.messageId}
          message={msg}
          isOwn={msg.senderId === user?.id}
          highlighted={highlightMessageId === msg.messageId}
        />
      ))}
      <div ref={endRef} />
    </div>
  );
};
