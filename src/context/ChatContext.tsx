import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  ReactNode,
} from 'react';
import {
  ChatInboxEvent,
  ChatMessage,
  ChatRealtimeEnvelope,
  Conversation,
  ConversationMember,
  CreateConversationRequest,
  MessageSearchResult,
  MessagesPageResponse,
  UpdateConversationRequest,
} from '@/types';
import { apiUrl } from '@/config/env';
import { chatService } from '@/services/chatService';
import { chatSocket } from '@/services/chatSocket';
import { getStoredToken } from '@/services/httpClient';
import { uploadFileViaPresign } from '@/services/uploadMedia';
import { setCachedUserPresence } from '@/hooks/useUserProfile';
import {
  getConversationUnreadCount,
  MAX_FILES_PER_MESSAGE,
  CHATBOT_SENDER_ID,
  canEditTextMessage,
  mergeConversationFromInbox,
  toAgentHistoryTurn,
  zeroUnreadForCurrentUser,
} from '@/utils/chatUtils';
import { getUserFacingMessage, sanitizeDisplayMessage } from '@/utils/userMessage';
import type { ReactionType } from '@/utils/reactions';
import { useAuth } from './AuthContext';

export type ChatNavView = 'chat' | 'friends' | 'notifications' | 'me';

interface ChatContextValue {
  conversations: Conversation[];
  selectedConversation: Conversation | null;
  pendingPrivateRecipientId: string | null;
  messages: ChatMessage[];
  activeNavView: ChatNavView;
  isLoadingConversations: boolean;
  isLoadingMessages: boolean;
  isLoadingOlder: boolean;
  hasMoreOlder: boolean;
  loadOlderMessages: () => Promise<void>;
  isSending: boolean;
  socketConnected: boolean;
  error: string | null;
  showCreateGroup: boolean;
  setShowCreateGroup: (v: boolean) => void;
  loadConversations: () => Promise<void>;
  selectConversation: (conv: Conversation | null) => void;
  setActiveNavView: (view: ChatNavView) => void;
  sendTextMessage: (text: string) => Promise<boolean>;
  sendFileMessage: (files: File[]) => Promise<void>;
  createGroup: (title: string, memberIds: string[]) => Promise<Conversation | null>;
  openPrivateChat: (friendUserId: string) => Promise<void>;
  clearError: () => void;
  isRefreshingDetail: boolean;
  isLoadingDetailFiles: boolean;
  detailMembers: ConversationMember[];
  detailAttachmentMessages: ChatMessage[];
  highlightMessageId: string | null;
  pendingScrollMessageId: string | null;
  clearMessageSearchHighlight: () => void;
  acknowledgePendingScroll: () => void;
  refreshConversationDetail: (conversationId?: string) => Promise<void>;
  updateGroupConversation: (patch: UpdateConversationRequest) => Promise<boolean>;
  leaveConversation: () => Promise<boolean>;
  dissolveGroup: () => Promise<boolean>;
  addGroupMember: (targetUserId: string) => Promise<boolean>;
  removeGroupMember: (targetUserId: string) => Promise<boolean>;
  searchConversationMessages: (query: string) => Promise<MessageSearchResult[]>;
  jumpToMessage: (messageId: string) => Promise<void>;
  loadAllAttachmentsForDetail: () => Promise<void>;
  getMyRoleInSelectedConversation: () => 'OWNER' | 'MEMBER' | null;
  isPeerTyping: boolean;
  notifyTyping: (typing: boolean) => void;
  dismissBotMessage: (messageId: string) => void;
  sendBotDraft: (content: string) => Promise<boolean>;
  deleteMessage: (messageId: string) => Promise<void>;
  toggleMessageReaction: (messageId: string, reactionType: ReactionType) => Promise<void>;
  editingMessage: ChatMessage | null;
  startEditMessage: (messageId: string) => void;
  cancelEditMessage: () => void;
  saveEditedMessage: (content: string) => Promise<boolean>;
  /** Increments when the UI should scroll the message list to the latest message. */
  scrollToBottomTick: number;
}

const ChatContext = createContext<ChatContextValue | undefined>(undefined);

const DELETED_MESSAGE_PREVIEW = 'Tin nhắn đã bị xóa';

const sortMessages = (list: ChatMessage[]) =>
  [...list].sort((a, b) => {
    const ta = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const tb = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    return ta - tb;
  });

const mergeUnique = (older: ChatMessage[], current: ChatMessage[]) => {
  const ids = new Set(current.map((m) => m.messageId));
  const prepend = older.filter((m) => !ids.has(m.messageId));
  return sortMessages([...prepend, ...current]);
};

export const ChatProvider = ({ children }: { children: ReactNode }) => {
  const { user, isAuthenticated } = useAuth();
  const userId = user?.id || '';

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [pendingPrivateRecipientId, setPendingPrivateRecipientId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [activeNavView, setActiveNavView] = useState<ChatNavView>('chat');
  const [isLoadingConversations, setIsLoadingConversations] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isLoadingOlder, setIsLoadingOlder] = useState(false);
  const [hasMoreOlder, setHasMoreOlder] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [editingMessage, setEditingMessage] = useState<ChatMessage | null>(null);
  const [socketConnected, setSocketConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [isRefreshingDetail, setIsRefreshingDetail] = useState(false);
  const [isLoadingDetailFiles, setIsLoadingDetailFiles] = useState(false);
  const [detailMembers, setDetailMembers] = useState<ConversationMember[]>([]);
  const [detailAttachmentMessages, setDetailAttachmentMessages] = useState<ChatMessage[]>([]);
  const [highlightMessageId, setHighlightMessageId] = useState<string | null>(null);
  const [pendingScrollMessageId, setPendingScrollMessageId] = useState<string | null>(null);
  const [scrollToBottomTick, setScrollToBottomTick] = useState(0);
  const requestScrollToBottom = useCallback(() => {
    setScrollToBottomTick((t) => t + 1);
  }, []);
  const [isPeerTyping, setIsPeerTyping] = useState(false);

  const unsubscribeRef = useRef<(() => void) | null>(null);
  const detailFilesAbortRef = useRef(0);
  const inboxUnsubscribeRef = useRef<(() => void) | null>(null);
  const presenceUnsubscribeRef = useRef<(() => void) | null>(null);
  const selectedIdRef = useRef<string | null>(null);
  const markReadTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const peerTypingClearRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const scheduleMarkConversationRead = useCallback(
    (conversationId: string) => {
      if (!userId) return;
      if (markReadTimeoutRef.current) clearTimeout(markReadTimeoutRef.current);
      markReadTimeoutRef.current = setTimeout(() => {
        markReadTimeoutRef.current = null;
        void chatService.markConversationRead(conversationId, userId).catch(() => undefined);
      }, 300);
    },
    [userId]
  );

  useEffect(
    () => () => {
      if (markReadTimeoutRef.current) clearTimeout(markReadTimeoutRef.current);
      if (peerTypingClearRef.current) clearTimeout(peerTypingClearRef.current);
    },
    []
  );

  useEffect(() => {
    setIsPeerTyping(false);
    if (peerTypingClearRef.current) {
      clearTimeout(peerTypingClearRef.current);
      peerTypingClearRef.current = null;
    }
  }, [selectedConversation?.id]);

  const normalizeConversation = (conv: Conversation): Conversation => ({
    ...conv,
    id: String(conv.id),
  });

  const clearError = useCallback(() => setError(null), []);

  const loadConversations = useCallback(async () => {
    if (!userId) return;
    setIsLoadingConversations(true);
    try {
      const res = await chatService.listConversationsByUser(userId);
      if (res.success && res.data) {
        setConversations(
          res.data.map((c) => ({
            ...normalizeConversation(c),
            unreadCount: getConversationUnreadCount(c, userId),
          }))
        );
      }
    } catch (e) {
      setError(getUserFacingMessage(e, 'Không tải được hội thoại'));
    } finally {
      setIsLoadingConversations(false);
    }
  }, [userId]);

  const bumpConversationPreview = useCallback(
    (msg: ChatMessage, serverConv?: Conversation) => {
      const convId = String(msg.conversationId);
      const isActive = convId === String(selectedIdRef.current ?? '');
      const isOwn = String(msg.senderId) === String(userId);

      if (isActive && !isOwn) {
        scheduleMarkConversationRead(convId);
      }

      setConversations((prev) => {
        const idx = prev.findIndex((c) => c.id === convId);

        let updated: Conversation;
        if (serverConv) {
          const incoming = normalizeConversation(serverConv);
          const base = idx >= 0 ? prev[idx] : incoming;
          updated = {
            ...mergeConversationFromInbox(base, incoming, userId),
            id: convId,
            type: incoming.type,
          };
        } else if (idx < 0) {
          return prev;
        } else {
          const current = prev[idx];
          const prevUnread = getConversationUnreadCount(current, userId);
          updated = {
            ...current,
            lastMessagePreview:
              msg.type === 'FILE' && !msg.content?.trim()
                ? current.lastMessagePreview
                : msg.content || current.lastMessagePreview || '',
            lastMessageAt: msg.createdAt ?? current.lastMessageAt,
            lastMessageSenderId: msg.senderId,
            lastMessageType: msg.type ?? current.lastMessageType,
            unreadCount: isActive || isOwn ? 0 : prevUnread + 1,
          };
        }

        if (isActive || isOwn) {
          updated = zeroUnreadForCurrentUser(updated, userId);
        }

        const rest = idx >= 0 ? prev.filter((_, i) => i !== idx) : prev;
        return [updated, ...rest];
      });
    },
    [userId, scheduleMarkConversationRead]
  );

  const upsertConversationInList = useCallback(
    (conv: Conversation) => {
      let normalized = normalizeConversation(conv);
      if (selectedIdRef.current && String(normalized.id) === String(selectedIdRef.current)) {
        normalized = zeroUnreadForCurrentUser(normalized, userId);
      }
      setConversations((prev) => {
        const idx = prev.findIndex((c) => c.id === normalized.id);
        if (idx >= 0) {
          const next = [...prev];
          next[idx] = { ...next[idx], ...normalized };
          return next;
        }
        return [normalized, ...prev];
      });
    },
    [userId]
  );

  const applyConversationUpdateFromInbox = useCallback(
    (conv: Conversation) => {
      let normalized = normalizeConversation(conv);
      if (selectedIdRef.current && String(normalized.id) === String(selectedIdRef.current)) {
        normalized = zeroUnreadForCurrentUser(normalized, userId);
      }
      upsertConversationInList(normalized);
      setSelectedConversation((prev) =>
        prev?.id === normalized.id ? { ...prev, ...normalized } : prev
      );
      if (normalized.members?.length) {
        setDetailMembers(normalized.members);
      }
    },
    [upsertConversationInList, userId]
  );

  const removeConversationFromInbox = useCallback((conv: Conversation) => {
    const convId = String(conv.id);
    setConversations((prev) => prev.filter((c) => c.id !== convId));
    if (selectedIdRef.current === convId) {
      selectedIdRef.current = null;
      setSelectedConversation(null);
      setMessages([]);
      setHasMoreOlder(false);
      unsubscribeRef.current?.();
      unsubscribeRef.current = null;
    }
    setDetailMembers([]);
  }, []);

  const appendMessageIfActive = useCallback(
    (msg: ChatMessage) => {
      bumpConversationPreview(msg);
      if (msg.conversationId !== selectedIdRef.current) return;
      setMessages((prev) => {
        if (prev.some((m) => m.messageId === msg.messageId)) return prev;
        return sortMessages([...prev, msg]);
      });
    },
    [bumpConversationPreview]
  );

  const patchMessageIfActive = useCallback((msg: ChatMessage) => {
    if (msg.conversationId !== selectedIdRef.current) return;
    setMessages((prev) => {
      const idx = prev.findIndex((m) => m.messageId === msg.messageId);
      if (idx < 0) return prev;
      const next = [...prev];
      next[idx] = { ...next[idx], ...msg };
      return next;
    });
  }, []);

  const toggleMessageReaction = useCallback(
    async (messageId: string, reactionType: ReactionType) => {
      const convId = selectedIdRef.current;
      if (!convId || !userId) return;

      const prev = messages.find((m) => m.messageId === messageId);
      if (!prev) return;

      const myExisting = prev.reactions?.find((r) => String(r.userId) === String(userId));
      const removing = myExisting?.reactionType === reactionType;
      const optimistic: ChatMessage = {
        ...prev,
        reactions: removing
          ? (prev.reactions ?? []).filter((r) => String(r.userId) !== String(userId))
          : [
              ...(prev.reactions ?? []).filter((r) => String(r.userId) !== String(userId)),
              { userId, reactionType, createdAt: new Date().toISOString() },
            ],
        reactionCount: removing
          ? Math.max(0, (prev.reactionCount ?? (prev.reactions?.length ?? 0)) - 1)
          : myExisting
            ? prev.reactionCount ?? prev.reactions?.length ?? 0
            : (prev.reactionCount ?? prev.reactions?.length ?? 0) + 1,
      };
      patchMessageIfActive(optimistic);

      try {
        const res = await chatService.setMessageReaction(convId, messageId, userId, reactionType);
        if (res.success && res.data) {
          patchMessageIfActive(res.data);
        } else {
          patchMessageIfActive(prev);
          setError(res.message || 'Không thể cập nhật cảm xúc');
        }
      } catch (e) {
        patchMessageIfActive(prev);
        setError(getUserFacingMessage(e, 'Không thể cập nhật cảm xúc'));
      }
    },
    [userId, messages, patchMessageIfActive]
  );

  const dismissBotMessage = useCallback((messageId: string) => {
    setMessages((prev) => prev.filter((msg) => msg.messageId !== messageId));
  }, []);

  const startEditMessage = useCallback(
    (messageId: string) => {
      const msg = messages.find((m) => m.messageId === messageId);
      if (!msg || !canEditTextMessage(msg, userId)) return;
      setEditingMessage(msg);
    },
    [messages, userId]
  );

  const cancelEditMessage = useCallback(() => {
    setEditingMessage(null);
  }, []);

  const saveEditedMessage = useCallback(
    async (content: string): Promise<boolean> => {
      const trimmed = content.trim();
      const target = editingMessage;
      const convId = selectedIdRef.current;
      if (!target || !convId || !userId || !trimmed) return false;
      if (trimmed === (target.content || '').trim()) {
        setEditingMessage(null);
        return true;
      }

      const prev = target;
      const optimistic: ChatMessage = {
        ...prev,
        content: trimmed,
        edited: true,
        editedAt: new Date().toISOString(),
      };
      patchMessageIfActive(optimistic);
      setEditingMessage(null);
      setIsSending(true);

      try {
        const res = await chatService.updateMessage(
          convId,
          target.messageId,
          userId,
          trimmed
        );
        if (res.success && res.data) {
          patchMessageIfActive(res.data);
          return true;
        }
        patchMessageIfActive(prev);
        setError(res.message || 'Không thể chỉnh sửa tin nhắn');
        return false;
      } catch (e) {
        patchMessageIfActive(prev);
        setError(getUserFacingMessage(e, 'Không thể chỉnh sửa tin nhắn'));
        return false;
      } finally {
        setIsSending(false);
      }
    },
    [editingMessage, userId, patchMessageIfActive]
  );

  const applyDeletedMessageEffects = useCallback(
    (msg: ChatMessage) => {
      patchMessageIfActive(msg);
      const convId = String(msg.conversationId);
      setConversations((prev) =>
        prev.map((c) => {
          if (String(c.id) !== convId) return c;
          if (c.lastMessageId && String(c.lastMessageId) !== String(msg.messageId)) return c;
          return {
            ...c,
            lastMessagePreview: DELETED_MESSAGE_PREVIEW,
            lastMessageSenderId: msg.senderId,
          };
        })
      );
      setSelectedConversation((prev) => {
        if (!prev || String(prev.id) !== convId) return prev;
        if (prev.lastMessageId && String(prev.lastMessageId) !== String(msg.messageId)) return prev;
        return {
          ...prev,
          lastMessagePreview: DELETED_MESSAGE_PREVIEW,
          lastMessageSenderId: msg.senderId,
        };
      });
    },
    [patchMessageIfActive]
  );

  const deleteMessage = useCallback(
    async (messageId: string) => {
      const convId = selectedIdRef.current;
      if (!convId || !userId) return;

      const prev = messages.find((m) => m.messageId === messageId);
      if (!prev || prev.deleted) return;

      if (editingMessage?.messageId === messageId) {
        setEditingMessage(null);
      }

      const optimistic: ChatMessage = {
        ...prev,
        deleted: true,
        content: '',
        attachments: [],
        attachmentCount: 0,
        reactions: [],
        reactionCount: 0,
      };
      applyDeletedMessageEffects(optimistic);

      try {
        const res = await chatService.deleteMessage(convId, messageId, userId);
        if (res.success && res.data) {
          applyDeletedMessageEffects(res.data);
        } else {
          patchMessageIfActive(prev);
          setError(res.message || 'Không thể xóa tin nhắn');
        }
      } catch (e) {
        patchMessageIfActive(prev);
        setError(getUserFacingMessage(e, 'Không thể xóa tin nhắn'));
      }
    },
    [userId, messages, editingMessage, applyDeletedMessageEffects, patchMessageIfActive]
  );

  const applyPeerReadReceipt = useCallback(
    (
      conversationId: string,
      readerUserId: string,
      lastReadMessageId?: string,
      lastReadAt?: string
    ) => {
      const patchMembers = (members?: ConversationMember[]) =>
        members?.map((m) => {
          const id = m.userId ?? m.id?.userId;
          if (id != null && String(id) === String(readerUserId)) {
            return { ...m, lastReadMessageId, lastReadAt };
          }
          return m;
        });

      setConversations((prev) =>
        prev.map((c) => {
          if (c.id !== conversationId) return c;
          return { ...c, members: patchMembers(c.members) ?? c.members };
        })
      );
      setDetailMembers((prev) => patchMembers(prev) ?? prev);
      setSelectedConversation((prev) => {
        if (!prev || prev.id !== conversationId) return prev;
        return { ...prev, members: patchMembers(prev.members) ?? prev.members };
      });
    },
    []
  );

  const notifyTyping = useCallback(
    (typing: boolean) => {
      const convId = selectedIdRef.current;
      if (!convId || !userId || selectedConversation?.type !== 'PRIVATE') return;
      if (!chatSocket.isConnected()) return;
      chatSocket.sendTyping({ conversationId: convId, userId, typing });
    },
    [userId, selectedConversation?.type]
  );

  const handleRealtimePayload = useCallback(
    (payload: ChatMessage | ChatRealtimeEnvelope) => {
      const envelope = payload as ChatRealtimeEnvelope;

      if (envelope.eventType === 'TYPING') {
        const convId = envelope.conversationId;
        if (!convId || String(convId) !== String(selectedIdRef.current ?? '')) return;
        if (String(envelope.userId) === String(userId)) return;
        if (envelope.typing) {
          setIsPeerTyping(true);
          if (peerTypingClearRef.current) clearTimeout(peerTypingClearRef.current);
          peerTypingClearRef.current = setTimeout(() => {
            peerTypingClearRef.current = null;
            setIsPeerTyping(false);
          }, 5000);
        } else {
          if (peerTypingClearRef.current) clearTimeout(peerTypingClearRef.current);
          peerTypingClearRef.current = null;
          setIsPeerTyping(false);
        }
        return;
      }

      if (envelope.eventType === 'READ_RECEIPT') {
        if (envelope.conversationId && envelope.userId) {
          applyPeerReadReceipt(
            String(envelope.conversationId),
            envelope.userId,
            envelope.lastReadMessageId,
            envelope.lastReadAt
          );
        }
        return;
      }

      if (
        'messageId' in payload &&
        typeof (payload as ChatMessage).messageId === 'string' &&
        !envelope.eventType
      ) {
        appendMessageIfActive(payload as ChatMessage);
        return;
      }

      if (!envelope.message) return;
      if (envelope.eventType === 'MESSAGE_UPDATED') {
        patchMessageIfActive(envelope.message);
      } else if (envelope.eventType === 'MESSAGE_DELETED') {
        applyDeletedMessageEffects(envelope.message);
      } else {
        appendMessageIfActive(envelope.message);
      }
    },
    [
      userId,
      appendMessageIfActive,
      patchMessageIfActive,
      applyDeletedMessageEffects,
      applyPeerReadReceipt,
    ]
  );

  const handleInboxEvent = useCallback(
    (event: ChatInboxEvent) => {
      if (event.eventType === 'CONVERSATION_CREATED' && event.conversation) {
        upsertConversationInList(event.conversation);
        return;
      }
      if (event.eventType === 'CONVERSATION_UPDATED' && event.conversation) {
        applyConversationUpdateFromInbox(event.conversation);
        return;
      }
      if (event.eventType === 'CONVERSATION_DELETED' && event.conversation) {
        removeConversationFromInbox(event.conversation);
        return;
      }
      if (event.eventType === 'MESSAGE_CREATED' && event.message) {
        const msg = event.message;
        bumpConversationPreview(msg, event.conversation);
        if (msg.conversationId === selectedIdRef.current) {
          setMessages((prev) => {
            if (prev.some((m) => m.messageId === msg.messageId)) return prev;
            return sortMessages([...prev, msg]);
          });
        }
      }
    },
    [
      upsertConversationInList,
      applyConversationUpdateFromInbox,
      removeConversationFromInbox,
      bumpConversationPreview,
    ]
  );

  const fetchMessagesPage = useCallback(
    async (conversationId: string, before?: string): Promise<MessagesPageResponse | null> => {
      if (!userId) {
        throw new Error('Chưa xác định được tài khoản (userId). Hãy đăng nhập lại.');
      }
      const delays = [0, 300, 600];
      let last: MessagesPageResponse | null = null;
      for (let i = 0; i < delays.length; i++) {
        if (delays[i] > 0) {
          await new Promise((r) => setTimeout(r, delays[i]));
        }
        const res = await chatService.getMessages(conversationId, userId, 20, before);
        if (!res.success || !res.data) {
          throw new Error(res.message || 'Không tải được tin nhắn');
        }
        last = res.data;
        if (!last.loading) break;
      }
      return last;
    },
    [userId]
  );

  useEffect(() => {
    if (!isAuthenticated || !userId) {
      chatSocket.setErrorHandler(null);
      chatSocket.disconnect();
      setSocketConnected(false);
      return;
    }

    chatSocket.setErrorHandler((err) =>
      setError(sanitizeDisplayMessage(err, 'Kết nối trò chuyện thất bại'))
    );

    chatSocket
      .connect(
        () => {
          setSocketConnected(true);
          inboxUnsubscribeRef.current?.();
          inboxUnsubscribeRef.current = chatSocket.subscribeInbox(userId, handleInboxEvent);
          presenceUnsubscribeRef.current?.();
          presenceUnsubscribeRef.current = chatSocket.subscribePresence(userId, (event) => {
            setCachedUserPresence(event.userId, {
              online: event.online,
              displayName: event.displayName,
            });
          });
        },
        (err) => {
          setSocketConnected(false);
          setError(sanitizeDisplayMessage(err, 'Không kết nối được máy chủ trò chuyện'));
        }
      )
      .catch(() => setSocketConnected(false));

    return () => {
      chatSocket.setErrorHandler(null);
      unsubscribeRef.current?.();
      unsubscribeRef.current = null;
      inboxUnsubscribeRef.current?.();
      inboxUnsubscribeRef.current = null;
      presenceUnsubscribeRef.current?.();
      presenceUnsubscribeRef.current = null;
      chatSocket.disconnect();
      setSocketConnected(false);
    };
  }, [isAuthenticated, userId, handleInboxEvent]);

  useEffect(() => {
    if (isAuthenticated && userId) {
      loadConversations();
    }
  }, [isAuthenticated, userId, loadConversations]);

  const subscribeToConversation = useCallback(
    (conversationId: string) => {
      unsubscribeRef.current?.();
      unsubscribeRef.current = chatSocket.subscribeConversation(conversationId, handleRealtimePayload);
    },
    [handleRealtimePayload]
  );

  const sendBotDraft = useCallback(
    async (content: string): Promise<boolean> => {
      const trimmed = content.trim();
      const convId = selectedIdRef.current;
      if (!trimmed || !convId || !userId) return false;

      setIsSending(true);
      try {
        if (!chatSocket.isConnected()) {
          await chatSocket.connect();
          setSocketConnected(true);
          subscribeToConversation(convId);
        }
        const payload = chatService.buildSendPayload(convId, userId, trimmed, 'TEXT');
        chatSocket.sendMessage(payload);
        requestScrollToBottom();
        return true;
      } catch (e) {
        setError(getUserFacingMessage(e, 'Gửi tin nhắn thất bại'));
        return false;
      } finally {
        setIsSending(false);
      }
    },
    [userId, subscribeToConversation, requestScrollToBottom]
  );

  const selectConversation = useCallback(
    async (conv: Conversation | null) => {
      setPendingPrivateRecipientId(null);
      setActiveNavView('chat');
      setSelectedConversation(conv);
      selectedIdRef.current = conv?.id ?? null;

      unsubscribeRef.current?.();
      unsubscribeRef.current = null;
      setMessages([]);
      setHasMoreOlder(false);
      setEditingMessage(null);

      if (!conv) return;

      setIsLoadingMessages(true);
      try {
        const page = await fetchMessagesPage(conv.id);
        if (page) {
          const list = Array.isArray(page.messages) ? page.messages : [];
          setMessages(sortMessages(list));
          setHasMoreOlder(Boolean(page.hasMore));
        }
      } catch (e) {
        setError(getUserFacingMessage(e, 'Không tải được tin nhắn'));
      } finally {
        setIsLoadingMessages(false);
        requestScrollToBottom();
      }

      void (async () => {
        try {
          if (!chatSocket.isConnected()) {
            await chatSocket.connect();
            setSocketConnected(true);
          }
          subscribeToConversation(conv.id);
        } catch (e) {
          setError(getUserFacingMessage(e, 'WebSocket chưa kết nối'));
        }
      })();

      if (userId) {
        void chatService.markConversationRead(conv.id, userId).catch(() => undefined);
        setConversations((prev) =>
          prev.map((c) => {
            if (c.id !== conv.id) return c;
            const members = c.members?.map((m) => {
              const memberUserId = m.userId ?? m.id?.userId;
              if (memberUserId && String(memberUserId) === String(userId)) {
                return { ...m, unreadCount: 0 };
              }
              return m;
            });
            return { ...c, unreadCount: 0, members: members ?? c.members };
          })
        );
      }
    },
    [subscribeToConversation, fetchMessagesPage, userId, requestScrollToBottom]
  );

  const ensurePrivateConversation = useCallback(
    async (friendUserId: string): Promise<Conversation> => {
      const found = chatService.findPrivateConversation(conversations, userId, friendUserId);
      if (found) {
        await selectConversation(found);
        return found;
      }
      const conv = await chatService.findOrCreatePrivateConversation(
        userId,
        friendUserId,
        conversations
      );
      await loadConversations();
      await selectConversation(conv);
      return conv;
    },
    [conversations, userId, loadConversations, selectConversation]
  );

  const loadOlderMessages = useCallback(async () => {
    const convId = selectedIdRef.current;
    if (!convId || !userId || messages.length === 0 || isLoadingOlder) return;

    const oldest = messages[0];
    setIsLoadingOlder(true);
    try {
      const page = await fetchMessagesPage(convId, oldest.messageId);
      if (page) {
        setMessages((prev) => mergeUnique(page.messages, prev));
        setHasMoreOlder(page.messages.length === 0 ? false : page.hasMore);
      }
    } catch (e) {
      setError(getUserFacingMessage(e, 'Không tải được tin cũ hơn'));
    } finally {
      setIsLoadingOlder(false);
    }
  }, [userId, messages, isLoadingOlder, fetchMessagesPage]);

  const sendTextMessage = useCallback(
    async (text: string): Promise<boolean> => {
      const trimmed = text.trim();
      if (!trimmed || !userId) return false;

      let conv = selectedConversation;
      if (!conv && pendingPrivateRecipientId) {
        try {
          conv = await ensurePrivateConversation(pendingPrivateRecipientId);
        } catch (e) {
          setError(getUserFacingMessage(e, 'Không tạo được hội thoại'));
          return false;
        }
      }
      if (!conv) return false;

      // If message targets the ChatBot, handle locally by calling agent-service
      const isAgent = /@ChatBot\b/i.test(trimmed);

      setIsSending(true);
      try {
        if (isAgent) {
          const history = messages
            .map((m) => toAgentHistoryTurn(m, userId))
            .filter((turn): turn is NonNullable<typeof turn> => turn !== null);

          try {
            const token = getStoredToken();
            const res = await fetch(apiUrl('/api/agent/chat'), {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                ...(token ? { Authorization: `Bearer ${token}` } : {}),
              },
              body: JSON.stringify({ message: trimmed, history }),
            });
            if (!res.ok) {
              const err = await res.text();
              throw new Error(err || 'Agent service error');
            }
            const body = await res.json();
            const reply = body.reply || '';

            // append local-only bot reply (not sent to server)
            const localMsg: ChatMessage = {
              messageId: `agent-local-${Date.now()}`,
              conversationId: conv.id,
              senderId: CHATBOT_SENDER_ID,
              type: 'TEXT',
              content: reply,
              createdAt: new Date().toISOString(),
            };
            setMessages((prev) => sortMessages([...prev, localMsg]));
            setPendingPrivateRecipientId(null);
            requestScrollToBottom();
            return true;
          } catch (e) {
            setError(getUserFacingMessage(e, 'Gọi ChatBot thất bại'));
            return false;
          }
        }

        // normal send via socket
        if (!chatSocket.isConnected()) {
          await chatSocket.connect();
          setSocketConnected(true);
          subscribeToConversation(conv.id);
        }
        const payload = chatService.buildSendPayload(conv.id, userId, trimmed, 'TEXT');
        chatSocket.sendMessage(payload);
        setPendingPrivateRecipientId(null);
        requestScrollToBottom();
        return true;
      } catch (e) {
        setError(getUserFacingMessage(e, 'Gửi tin nhắn thất bại'));
        return false;
      } finally {
        setIsSending(false);
      }
    },
    [
      selectedConversation,
      pendingPrivateRecipientId,
      userId,
      messages,
      ensurePrivateConversation,
      subscribeToConversation,
      requestScrollToBottom,
    ]
  );

  const sendFileMessage = useCallback(
    async (files: File[]) => {
      if (!userId || files.length === 0) return;
      if (files.length > MAX_FILES_PER_MESSAGE) {
        setError(`Chỉ được gửi tối đa ${MAX_FILES_PER_MESSAGE} file cùng lúc`);
        return;
      }

      let conv = selectedConversation;
      if (!conv && pendingPrivateRecipientId) {
        try {
          conv = await ensurePrivateConversation(pendingPrivateRecipientId);
        } catch (e) {
          setError(getUserFacingMessage(e, 'Không tạo được hội thoại'));
          return;
        }
      }
      if (!conv) return;

      requestScrollToBottom();
      setIsSending(true);
      try {
        const uploads = await Promise.all(
          files.map((file) => uploadFileViaPresign(file, 'message'))
        );
        if (!chatSocket.isConnected()) {
          await chatSocket.connect();
          setSocketConnected(true);
          subscribeToConversation(conv.id);
        }
        const items = uploads.map((upload, index) => ({ upload, file: files[index] }));
        const payload = chatService.buildFileSendPayload(conv.id, userId, items);
        chatSocket.sendMessage(payload);
        setPendingPrivateRecipientId(null);
        requestScrollToBottom();
      } catch (e) {
        setError(getUserFacingMessage(e, 'Gửi file thất bại'));
      } finally {
        setIsSending(false);
      }
    },
    [
      selectedConversation,
      pendingPrivateRecipientId,
      userId,
      ensurePrivateConversation,
      subscribeToConversation,
      requestScrollToBottom,
    ]
  );

  const createGroup = useCallback(
    async (title: string, memberIds: string[]) => {
      if (!userId) return null;
      const ids = Array.from(new Set([userId, ...memberIds]));
      const payload: CreateConversationRequest = {
        title: title.trim() || 'Nhóm mới',
        type: 'GROUP',
        memberIds: ids,
      };
      try {
        const res = await chatService.createConversation(payload);
        if (!res.success || !res.data) {
          throw new Error(res.message || 'Tạo nhóm thất bại');
        }
        await loadConversations();
        await selectConversation(res.data);
        return res.data;
      } catch (e) {
        setError(getUserFacingMessage(e, 'Tạo nhóm thất bại'));
        return null;
      }
    },
    [userId, loadConversations, selectConversation]
  );

  const mergeConversationIntoState = useCallback((conv: Conversation) => {
    const normalized = normalizeConversation(conv);
    setSelectedConversation((prev) => (prev?.id === normalized.id ? { ...prev, ...normalized } : prev));
    setConversations((prev) => {
      const idx = prev.findIndex((c) => c.id === normalized.id);
      if (idx < 0) return prev;
      const next = [...prev];
      next[idx] = { ...next[idx], ...normalized };
      return next;
    });
    if (normalized.members?.length) {
      setDetailMembers(normalized.members);
    }
  }, []);

  const refreshConversationDetail = useCallback(
    async (conversationId?: string) => {
      const convId = conversationId ?? selectedIdRef.current;
      if (!convId || !userId) return;
      setIsRefreshingDetail(true);
      try {
        const [convRes, membersRes] = await Promise.all([
          chatService.getConversationById(convId, userId),
          chatService.listMembers(convId, userId),
        ]);
        if (convRes.success && convRes.data) {
          const merged = {
            ...normalizeConversation(convRes.data),
            members:
              membersRes.success && membersRes.data?.length
                ? membersRes.data
                : convRes.data.members,
          };
          mergeConversationIntoState(merged);
        } else if (membersRes.success && membersRes.data) {
          setDetailMembers(membersRes.data);
        }
      } catch (e) {
        setError(getUserFacingMessage(e, 'Không tải được chi tiết hội thoại'));
      } finally {
        setIsRefreshingDetail(false);
      }
    },
    [userId, mergeConversationIntoState]
  );

  const updateGroupConversation = useCallback(
    async (patch: UpdateConversationRequest): Promise<boolean> => {
      const conv = selectedConversation;
      if (!conv || !userId) return false;
      try {
        const res = await chatService.updateConversation(conv.id, userId, patch);
        if (!res.success || !res.data) {
          throw new Error(res.message || 'Cập nhật thất bại');
        }
        mergeConversationIntoState(res.data);
        await loadConversations();
        return true;
      } catch (e) {
        setError(getUserFacingMessage(e, 'Cập nhật thất bại'));
        return false;
      }
    },
    [selectedConversation, userId, mergeConversationIntoState, loadConversations]
  );

  const leaveConversation = useCallback(async (): Promise<boolean> => {
    const conv = selectedConversation;
    if (!conv || !userId || conv.type !== 'GROUP') return false;
    try {
      const res = await chatService.removeMember(conv.id, userId, userId);
      if (!res.success) throw new Error(res.message || 'Không thể rời nhóm');
      await selectConversation(null);
      await loadConversations();
      setDetailMembers([]);
      return true;
    } catch (e) {
      setError(getUserFacingMessage(e, 'Không thể rời nhóm'));
      return false;
    }
  }, [selectedConversation, userId, selectConversation, loadConversations]);

  const dissolveGroup = useCallback(async (): Promise<boolean> => {
    const conv = selectedConversation;
    if (!conv || !userId) return false;
    try {
      const res = await chatService.deleteConversation(conv.id, userId);
      if (!res.success) throw new Error(res.message || 'Không thể giải tán nhóm');
      await selectConversation(null);
      await loadConversations();
      setDetailMembers([]);
      return true;
    } catch (e) {
      setError(getUserFacingMessage(e, 'Không thể giải tán nhóm'));
      return false;
    }
  }, [selectedConversation, userId, selectConversation, loadConversations]);

  const addGroupMember = useCallback(
    async (targetUserId: string): Promise<boolean> => {
      const conv = selectedConversation;
      if (!conv || !userId) return false;
      try {
        const res = await chatService.addMember(conv.id, userId, { userId: targetUserId });
        if (!res.success) throw new Error(res.message || 'Không thêm được thành viên');
        await refreshConversationDetail(conv.id);
        await loadConversations();
        return true;
      } catch (e) {
        setError(getUserFacingMessage(e, 'Không thêm được thành viên'));
        return false;
      }
    },
    [selectedConversation, userId, refreshConversationDetail, loadConversations]
  );

  const removeGroupMember = useCallback(
    async (targetUserId: string): Promise<boolean> => {
      const conv = selectedConversation;
      if (!conv || !userId) return false;
      try {
        const res = await chatService.removeMember(conv.id, userId, targetUserId);
        if (!res.success) throw new Error(res.message || 'Không xóa được thành viên');
        await refreshConversationDetail(conv.id);
        await loadConversations();
        return true;
      } catch (e) {
        setError(getUserFacingMessage(e, 'Không xóa được thành viên'));
        return false;
      }
    },
    [selectedConversation, userId, refreshConversationDetail, loadConversations]
  );

  const searchConversationMessages = useCallback(
    async (query: string): Promise<MessageSearchResult[]> => {
      const convId = selectedIdRef.current;
      if (!convId || !userId) return [];
      const q = query.trim();
      if (q.length < 2) return [];
      try {
        const res = await chatService.searchMessages(convId, userId, q, 30);
        return res.success && res.data ? res.data : [];
      } catch (e) {
        setError(getUserFacingMessage(e, 'Tìm kiếm thất bại'));
        return [];
      }
    },
    [userId]
  );

  const clearMessageSearchHighlight = useCallback(() => {
    setHighlightMessageId(null);
    setPendingScrollMessageId(null);
  }, []);

  const acknowledgePendingScroll = useCallback(() => {
    setPendingScrollMessageId(null);
  }, []);

  const jumpToMessage = useCallback(
    async (messageId: string) => {
      const convId = selectedIdRef.current;
      if (!convId || !userId) return;

      setHighlightMessageId(messageId);

      if (messages.some((m) => m.messageId === messageId)) {
        setPendingScrollMessageId(messageId);
        return;
      }

      try {
        const res = await chatService.getMessagesAround(convId, userId, messageId, 40);
        if (!res.success || !res.data) {
          throw new Error(res.message || 'Không tải được tin nhắn');
        }
        const list = Array.isArray(res.data.messages) ? res.data.messages : [];
        setMessages(sortMessages(list));
        setHasMoreOlder(Boolean(res.data.hasMore));
        setPendingScrollMessageId(messageId);
      } catch (e) {
        setError(getUserFacingMessage(e, 'Không nhảy được tới tin nhắn'));
      }
    },
    [userId, messages]
  );

  const loadAllAttachmentsForDetail = useCallback(async () => {
    const convId = selectedIdRef.current;
    if (!convId || !userId) return;

    const runId = ++detailFilesAbortRef.current;
    setIsLoadingDetailFiles(true);
    try {
      let accumulated = [...messages];
      let before: string | undefined = accumulated[0]?.messageId;
      let more = hasMoreOlder || accumulated.length === 0;

      if (accumulated.length === 0) {
        const first = await fetchMessagesPage(convId);
        if (detailFilesAbortRef.current !== runId) return;
        if (first) {
          accumulated = sortMessages(first.messages);
          more = first.hasMore;
          before = accumulated[0]?.messageId;
        } else {
          more = false;
        }
      }

      for (let attempt = 0; attempt < 100 && more; attempt++) {
        const page = await fetchMessagesPage(convId, before);
        if (detailFilesAbortRef.current !== runId) return;
        if (!page) break;
        accumulated = mergeUnique(page.messages, accumulated);
        more = page.hasMore;
        if (!page.messages.length) break;
        before = page.messages[0].messageId;
      }

      if (detailFilesAbortRef.current === runId) {
        setDetailAttachmentMessages(accumulated);
      }
    } catch (e) {
      setError(getUserFacingMessage(e, 'Không tải được file đính kèm'));
    } finally {
      if (detailFilesAbortRef.current === runId) {
        setIsLoadingDetailFiles(false);
      }
    }
  }, [userId, messages, hasMoreOlder, fetchMessagesPage]);

  const getMyRoleInSelectedConversation = useCallback((): 'OWNER' | 'MEMBER' | null => {
    if (!userId) return null;
    const members =
      detailMembers.length > 0 ? detailMembers : selectedConversation?.members ?? [];
    const mine = members.find((m) => {
      const id = m.userId ?? m.id?.userId;
      return id != null && String(id) === String(userId);
    });
    return mine?.role ?? null;
  }, [userId, detailMembers, selectedConversation?.members]);

  useEffect(() => {
    if (!highlightMessageId) return;
    const timeout = setTimeout(() => setHighlightMessageId(null), 2500);
    return () => clearTimeout(timeout);
  }, [highlightMessageId]);

  useEffect(() => {
    setDetailAttachmentMessages([]);
    setDetailMembers([]);
    detailFilesAbortRef.current += 1;
  }, [selectedConversation?.id, pendingPrivateRecipientId]);

  const openPrivateChat = useCallback(
    async (friendUserId: string) => {
      if (!userId) return;
      try {
        const found = chatService.findPrivateConversation(conversations, userId, friendUserId);
        setActiveNavView('chat');
        if (found) {
          await selectConversation(found);
          return;
        }
        unsubscribeRef.current?.();
        unsubscribeRef.current = null;
        setSelectedConversation(null);
        selectedIdRef.current = null;
        setMessages([]);
        setHasMoreOlder(false);
        setPendingPrivateRecipientId(friendUserId);
      } catch (e) {
        setError(getUserFacingMessage(e, 'Không mở được hội thoại'));
      }
    },
    [userId, conversations, selectConversation]
  );

  const value: ChatContextValue = {
    conversations,
    selectedConversation,
    pendingPrivateRecipientId,
    messages,
    activeNavView,
    isLoadingConversations,
    isLoadingMessages,
    isLoadingOlder,
    hasMoreOlder,
    loadOlderMessages,
    isSending,
    socketConnected,
    error,
    showCreateGroup,
    setShowCreateGroup,
    loadConversations,
    selectConversation,
    setActiveNavView,
    sendTextMessage,
    sendFileMessage,
    createGroup,
    openPrivateChat,
    clearError,
    isRefreshingDetail,
    isLoadingDetailFiles,
    detailMembers,
    detailAttachmentMessages,
    highlightMessageId,
    pendingScrollMessageId,
    clearMessageSearchHighlight,
    acknowledgePendingScroll,
    refreshConversationDetail,
    updateGroupConversation,
    leaveConversation,
    dissolveGroup,
    addGroupMember,
    removeGroupMember,
    searchConversationMessages,
    jumpToMessage,
    loadAllAttachmentsForDetail,
    getMyRoleInSelectedConversation,
    isPeerTyping,
    notifyTyping,
    dismissBotMessage,
    sendBotDraft,
    deleteMessage,
    toggleMessageReaction,
    editingMessage,
    startEditMessage,
    cancelEditMessage,
    saveEditedMessage,
    scrollToBottomTick,
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
};

export const useChat = () => {
  const ctx = useContext(ChatContext);
  if (!ctx) {
    throw new Error('useChat must be used within ChatProvider');
  }
  return ctx;
};
