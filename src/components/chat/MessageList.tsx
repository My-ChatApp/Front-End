import { useCallback, useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import { useAuth } from '@/context';
import { useChat } from '@/context/ChatContext';
import {
  getPeerMember,
  isLatestOwnMessageSeen,
} from '@/utils/chatUtils';
import { MessageBubble } from './MessageBubble';
import { MessageSkeleton } from './skeletons/MessageSkeleton';

const NEAR_BOTTOM_PX = 80;
const SCROLL_UP_THRESHOLD_PX = 120;

const isNearBottom = (el: HTMLDivElement) =>
  el.scrollHeight - el.scrollTop - el.clientHeight < NEAR_BOTTOM_PX;

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
    detailMembers,
  } = useChat();
  const isDraftPrivate = Boolean(pendingPrivateRecipientId && !selectedConversation);
  const isPrivateChat = selectedConversation?.type === 'PRIVATE';
  const scrollRef = useRef<HTMLDivElement>(null);
  const topSentinelRef = useRef<HTMLDivElement>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const pendingScrollRestoreRef = useRef<{ height: number; top: number } | null>(null);
  const initialScrollPendingRef = useRef(true);
  const userScrolledUpRef = useRef(false);

  const lastOwnMessageId = useMemo(() => {
    if (!user?.id) return null;
    for (let i = messages.length - 1; i >= 0; i--) {
      if (String(messages[i].senderId) === String(user.id)) {
        return messages[i].messageId;
      }
    }
    return null;
  }, [messages, user?.id]);

  const showSeenOnLastOwn = useMemo(() => {
    if (!isPrivateChat || !user?.id) return false;
    const members =
      detailMembers.length > 0 ? detailMembers : selectedConversation?.members;
    const peer = getPeerMember(members, user.id);
    return isLatestOwnMessageSeen(
      messages,
      user.id,
      peer?.lastReadMessageId,
      peer?.lastReadAt
    );
  }, [isPrivateChat, user?.id, messages, detailMembers, selectedConversation?.members]);

  const handleLoadOlder = useCallback(async () => {
    const el = scrollRef.current;
    if (!el || isLoadingOlder || !hasMoreOlder || !userScrolledUpRef.current) return;

    pendingScrollRestoreRef.current = {
      height: el.scrollHeight,
      top: el.scrollTop,
    };
    await loadOlderMessages();
  }, [isLoadingOlder, hasMoreOlder, loadOlderMessages]);

  const onScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    if (el.scrollTop <= SCROLL_UP_THRESHOLD_PX) {
      userScrolledUpRef.current = true;
    }
  }, []);

  useEffect(() => {
    initialScrollPendingRef.current = true;
    userScrolledUpRef.current = false;
  }, [selectedConversation?.id]);

  useLayoutEffect(() => {
    const pending = pendingScrollRestoreRef.current;
    const el = scrollRef.current;
    if (!pending || !el) return;

    const delta = el.scrollHeight - pending.height;
    el.scrollTop = pending.top + delta;
    pendingScrollRestoreRef.current = null;
  }, [messages]);

  useEffect(() => {
    const root = scrollRef.current;
    const sentinel = topSentinelRef.current;
    if (!root || !sentinel || !hasMoreOlder) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) void handleLoadOlder();
      },
      { root, rootMargin: '120px 0px 0px 0px', threshold: 0 }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMoreOlder, isLoadingOlder, handleLoadOlder, selectedConversation?.id]);

  useEffect(() => {
    if (pendingScrollMessageId || isLoadingOlder) return;

    const el = scrollRef.current;
    if (!el) return;

    if (initialScrollPendingRef.current && !isLoadingMessages) {
      initialScrollPendingRef.current = false;
      endRef.current?.scrollIntoView({ behavior: 'auto' });
      return;
    }

    if (isNearBottom(el)) {
      endRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isLoadingMessages, pendingScrollMessageId, isLoadingOlder]);

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
    <div ref={scrollRef} onScroll={onScroll} className="flex-1 overflow-y-auto py-4">
      <div ref={topSentinelRef} className="h-px shrink-0" aria-hidden />
      {isLoadingOlder && (
        <div className="mb-3 px-2">
          <MessageSkeleton count={2} />
        </div>
      )}
      {messages.map((msg) => (
        <MessageBubble
          key={msg.messageId}
          message={msg}
          isOwn={msg.senderId === user?.id}
          highlighted={highlightMessageId === msg.messageId}
          showSeenReceipt={
            showSeenOnLastOwn &&
            msg.senderId === user?.id &&
            msg.messageId === lastOwnMessageId
          }
        />
      ))}
      <div ref={endRef} />
    </div>
  );
};
