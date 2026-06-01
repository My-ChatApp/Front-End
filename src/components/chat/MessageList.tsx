import { useCallback, useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import { MessageCircle } from 'lucide-react';
import { useAuth } from '@/context';
import { useChat } from '@/context/ChatContext';
import {
  CHATBOT_SENDER_ID,
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
    acknowledgePendingScroll,
    detailMembers,
    scrollToBottomTick,
  } = useChat();
  const isDraftPrivate = Boolean(pendingPrivateRecipientId && !selectedConversation);
  const isPrivateChat = selectedConversation?.type === 'PRIVATE';
  const scrollRef = useRef<HTMLDivElement>(null);
  const topSentinelRef = useRef<HTMLDivElement>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const pendingScrollRestoreRef = useRef<{ height: number; top: number } | null>(null);
  const initialScrollPendingRef = useRef(true);
  const userScrolledUpRef = useRef(false);
  const stickToBottomRef = useRef(true);
  const pendingJumpHandledRef = useRef<string | null>(null);

  const scrollToEnd = useCallback((behavior: ScrollBehavior = 'smooth') => {
    userScrolledUpRef.current = false;
    stickToBottomRef.current = true;
    endRef.current?.scrollIntoView({ behavior });
  }, []);

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
    stickToBottomRef.current = isNearBottom(el);
  }, []);

  useEffect(() => {
    initialScrollPendingRef.current = true;
    userScrolledUpRef.current = false;
    stickToBottomRef.current = true;
  }, [selectedConversation?.id, pendingPrivateRecipientId]);

  const scrollContainerToBottom = useCallback((el: HTMLDivElement) => {
    el.scrollTop = el.scrollHeight;
    userScrolledUpRef.current = false;
    stickToBottomRef.current = true;
  }, []);

  useLayoutEffect(() => {
    if (isLoadingMessages || pendingScrollMessageId) return;
    if (!initialScrollPendingRef.current) return;

    const el = scrollRef.current;
    if (!el) return;

    scrollContainerToBottom(el);
    initialScrollPendingRef.current = false;

    const raf = requestAnimationFrame(() => {
      if (scrollRef.current) scrollContainerToBottom(scrollRef.current);
      requestAnimationFrame(() => {
        if (scrollRef.current) scrollContainerToBottom(scrollRef.current);
      });
    });
    return () => cancelAnimationFrame(raf);
  }, [
    isLoadingMessages,
    messages,
    selectedConversation?.id,
    pendingPrivateRecipientId,
    pendingScrollMessageId,
    scrollContainerToBottom,
  ]);

  useEffect(() => {
    if (!scrollToBottomTick) return;
    scrollToEnd('smooth');
  }, [scrollToBottomTick, scrollToEnd]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el || pendingScrollMessageId || isLoadingOlder) return;

    const ro = new ResizeObserver(() => {
      if (!stickToBottomRef.current) return;
      endRef.current?.scrollIntoView({ behavior: 'auto' });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [pendingScrollMessageId, isLoadingOlder, selectedConversation?.id]);

  useLayoutEffect(() => {
    const pending = pendingScrollRestoreRef.current;
    const el = scrollRef.current;
    if (!pending || !el) return;

    const delta = el.scrollHeight - pending.height;
    el.scrollTop = pending.top + delta;
    pendingScrollRestoreRef.current = null;
  }, [messages]);

  useLayoutEffect(() => {
    if (!pendingScrollMessageId) return;
    const root = scrollRef.current;
    if (!root) return;

    if (pendingJumpHandledRef.current === pendingScrollMessageId) return;

    const target = root.querySelector<HTMLElement>(
      `[data-message-id="${pendingScrollMessageId}"]`
    );
    if (!target) return;

    userScrolledUpRef.current = true;
    initialScrollPendingRef.current = false;
    pendingJumpHandledRef.current = pendingScrollMessageId;
    target.scrollIntoView({ behavior: 'smooth', block: 'center' });

    const t = window.setTimeout(() => {
      // Keep the "jump lock" briefly so bottom auto-scroll doesn't win.
      acknowledgePendingScroll();
      pendingJumpHandledRef.current = null;
    }, 350);
    return () => window.clearTimeout(t);
  }, [messages, pendingScrollMessageId, acknowledgePendingScroll]);

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
      scrollToEnd('auto');
      return;
    }

    const last = messages[messages.length - 1];
    const isOwnLast =
      last && user?.id && String(last.senderId) === String(user.id);

    if (last?.senderId === CHATBOT_SENDER_ID || isOwnLast) {
      scrollToEnd('smooth');
      return;
    }

    if (isNearBottom(el)) {
      scrollToEnd('smooth');
    }
  }, [messages, isLoadingMessages, pendingScrollMessageId, isLoadingOlder, user?.id, scrollToEnd]);

  if (isLoadingMessages) {
    return (
      <div className="flex-1 overflow-y-auto px-3 py-4 md:px-4 md:py-6">
        <MessageSkeleton count={6} />
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center px-6 py-10 text-center text-[var(--discord-text-muted)]">
        <div className="mb-4 flex size-16 items-center justify-center rounded-3xl bg-gradient-to-br from-green-600 to-teal-600 text-white shadow-lg shadow-green-500/20">
          <MessageCircle className="size-7" />
        </div>
        <p className="text-sm font-medium text-[var(--discord-text)]">
          {isDraftPrivate
            ? 'Chưa có tin nhắn — gửi tin đầu tiên để bắt đầu'
            : 'Chưa có tin nhắn. Hãy gửi lời chào!'}
        </p>
        <p className="mt-2 max-w-sm text-xs leading-relaxed text-[var(--discord-text-muted)]">
          Hãy thử nhắc ai đó bằng @ hoặc chia sẻ một file để mở đầu cuộc trò chuyện.
        </p>
      </div>
    );
  }

  return (
    <div ref={scrollRef} onScroll={onScroll} className="flex-1 overflow-y-auto px-1 py-4 md:px-2 md:py-5">
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
