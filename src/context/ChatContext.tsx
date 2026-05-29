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
import { chatService } from '@/services/chatService';
import { chatSocket } from '@/services/chatSocket';
import { uploadFileViaPresign } from '@/services/uploadMedia';
import { setCachedUserPresence } from '@/hooks/useUserProfile';
import {
  getConversationUnreadCount,
  MAX_FILES_PER_MESSAGE,
  mergeConversationFromInbox,
} from '@/utils/chatUtils';
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
}

const ChatContext = createContext<ChatContextValue | undefined>(undefined);

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
  const [socketConnected, setSocketConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [isRefreshingDetail, setIsRefreshingDetail] = useState(false);
  const [isLoadingDetailFiles, setIsLoadingDetailFiles] = useState(false);
  const [detailMembers, setDetailMembers] = useState<ConversationMember[]>([]);
  const [detailAttachmentMessages, setDetailAttachmentMessages] = useState<ChatMessage[]>([]);
  const [highlightMessageId, setHighlightMessageId] = useState<string | null>(null);
  const [pendingScrollMessageId, setPendingScrollMessageId] = useState<string | null>(null);

  const unsubscribeRef = useRef<(() => void) | null>(null);
  const detailFilesAbortRef = useRef(0);
  const inboxUnsubscribeRef = useRef<(() => void) | null>(null);
  const presenceUnsubscribeRef = useRef<(() => void) | null>(null);
  const selectedIdRef = useRef<string | null>(null);

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
      setError(e instanceof Error ? e.message : 'Không tải được hội thoại');
    } finally {
      setIsLoadingConversations(false);
    }
  }, [userId]);

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

  const bumpConversationPreview = useCallback(
    (msg: ChatMessage, serverConv?: Conversation) => {
      const isActive = msg.conversationId === selectedIdRef.current;
      const isOwn = String(msg.senderId) === String(userId);

      setConversations((prev) => {
        const convId = String(msg.conversationId);
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

        const rest = idx >= 0 ? prev.filter((_, i) => i !== idx) : prev;
        return [updated, ...rest];
      });
    },
    [userId]
  );

  const upsertConversationInList = useCallback((conv: Conversation) => {
    const normalized = normalizeConversation(conv);
    setConversations((prev) => {
      const idx = prev.findIndex((c) => c.id === normalized.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = { ...next[idx], ...normalized };
        return next;
      }
      return [normalized, ...prev];
    });
  }, []);

  const applyConversationUpdateFromInbox = useCallback(
    (conv: Conversation) => {
      const normalized = normalizeConversation(conv);
      upsertConversationInList(normalized);
      setSelectedConversation((prev) =>
        prev?.id === normalized.id ? { ...prev, ...normalized } : prev
      );
      if (normalized.members?.length) {
        setDetailMembers(normalized.members);
      }
    },
    [upsertConversationInList]
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

  const handleRealtimePayload = useCallback(
    (payload: ChatMessage | ChatRealtimeEnvelope) => {
      if ('messageId' in payload && typeof payload.messageId === 'string') {
        appendMessageIfActive(payload as ChatMessage);
        return;
      }
      const envelope = payload as ChatRealtimeEnvelope;
      if (!envelope.message) return;
      if (envelope.eventType === 'MESSAGE_UPDATED') {
        patchMessageIfActive(envelope.message);
      } else {
        appendMessageIfActive(envelope.message);
      }
    },
    [appendMessageIfActive, patchMessageIfActive]
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
        const res = await chatService.getMessages(conversationId, userId, 10, before);
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

    chatSocket.setErrorHandler((err) => setError(err));

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
          setError(err);
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
        setError(e instanceof Error ? e.message : 'Không tải được tin nhắn');
      } finally {
        setIsLoadingMessages(false);
      }

      void (async () => {
        try {
          if (!chatSocket.isConnected()) {
            await chatSocket.connect();
            setSocketConnected(true);
          }
          subscribeToConversation(conv.id);
        } catch (e) {
          setError(e instanceof Error ? e.message : 'WebSocket chưa kết nối');
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
    [subscribeToConversation, fetchMessagesPage, userId]
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
        setHasMoreOlder(page.hasMore);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Không tải được tin cũ hơn');
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
          setError(e instanceof Error ? e.message : 'Không tạo được hội thoại');
          return false;
        }
      }
      if (!conv) return false;

      setIsSending(true);
      try {
        if (!chatSocket.isConnected()) {
          await chatSocket.connect();
          setSocketConnected(true);
          subscribeToConversation(conv.id);
        }
        const payload = chatService.buildSendPayload(conv.id, userId, trimmed, 'TEXT');
        chatSocket.sendMessage(payload);
        setPendingPrivateRecipientId(null);
        return true;
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Gửi tin nhắn thất bại');
        return false;
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
          setError(e instanceof Error ? e.message : 'Không tạo được hội thoại');
          return;
        }
      }
      if (!conv) return;

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
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Gửi file thất bại');
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
        setError(e instanceof Error ? e.message : 'Tạo nhóm thất bại');
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
        setError(e instanceof Error ? e.message : 'Không tải được chi tiết hội thoại');
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
        setError(e instanceof Error ? e.message : 'Cập nhật thất bại');
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
      setError(e instanceof Error ? e.message : 'Không thể rời nhóm');
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
      setError(e instanceof Error ? e.message : 'Không thể giải tán nhóm');
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
        setError(e instanceof Error ? e.message : 'Không thêm được thành viên');
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
        setError(e instanceof Error ? e.message : 'Không xóa được thành viên');
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
        setError(e instanceof Error ? e.message : 'Tìm kiếm thất bại');
        return [];
      }
    },
    [userId]
  );

  const clearMessageSearchHighlight = useCallback(() => {
    setHighlightMessageId(null);
    setPendingScrollMessageId(null);
  }, []);

  const jumpToMessage = useCallback(
    async (messageId: string) => {
      const convId = selectedIdRef.current;
      if (!convId || !userId) return;

      setHighlightMessageId(messageId);

      const hasMessage = (list: ChatMessage[]) => list.some((m) => m.messageId === messageId);

      if (hasMessage(messages)) {
        setPendingScrollMessageId(messageId);
        return;
      }

      let accumulated = [...messages];
      let before = accumulated[0]?.messageId;
      let more = hasMoreOlder;

      for (let attempt = 0; attempt < 50 && more; attempt++) {
        const page = await fetchMessagesPage(convId, before);
        if (!page) break;
        accumulated = mergeUnique(page.messages, accumulated);
        if (hasMessage(accumulated)) {
          setMessages(accumulated);
          setHasMoreOlder(page.hasMore);
          setPendingScrollMessageId(messageId);
          return;
        }
        more = page.hasMore;
        if (!page.messages.length) break;
        before = page.messages[0].messageId;
      }

      setMessages(accumulated);
      setPendingScrollMessageId(messageId);
    },
    [userId, messages, hasMoreOlder, fetchMessagesPage]
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
      setError(e instanceof Error ? e.message : 'Không tải được file đính kèm');
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
    if (!pendingScrollMessageId) return;
    const timeout = setTimeout(() => {
      const el = document.querySelector(
        `[data-message-id="${pendingScrollMessageId}"]`
      );
      el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setPendingScrollMessageId(null);
    }, 80);
    return () => clearTimeout(timeout);
  }, [messages, pendingScrollMessageId]);

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
        setError(e instanceof Error ? e.message : 'Không mở được hội thoại');
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
