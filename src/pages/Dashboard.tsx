import { ChangeEvent, FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import {
  chatService,
  chatSocket,
  friendService,
  notificationService,
  profileService,
  uploadFileViaPresign,
} from '@/services';
import { useAuth } from '@/context';
import { ChatMessage, Conversation, NotificationItem, UserProfile } from '@/types';
import { isUuid, parseUuidList } from '@/utils/uuid';
import {
  Bell,
  CheckCircle2,
  LayoutDashboard,
  MessageCircle,
  Plug,
  Send,
  UserPlus,
  UserRoundCog,
} from 'lucide-react';

const getMemberUserId = (member: {
  userId?: string;
  id?: { userId?: string };
}): string => member?.userId || member?.id?.userId || '';

const dashboardShellClass = 'app-page-shell min-h-screen text-slate-900 font-sans selection:bg-green-200';
const dashboardHeroClass = 'relative overflow-hidden app-hero-banner py-8 px-4';
const dashboardCardClass = 'app-card-strong rounded-3xl p-6';
const dashboardTitleClass = 'text-xl font-bold text-slate-900 flex items-center gap-3';
const dashboardInputClass = 'app-input w-full px-4 py-2.5 rounded-2xl outline-none transition-all';
const dashboardPrimaryButtonClass = 'app-button-primary px-5 py-2.5';
const dashboardDarkButtonClass = 'app-button-dark px-5 py-2.5';
const dashboardSoftButtonClass = 'px-5 py-2.5 rounded-2xl border border-slate-200 font-semibold hover:bg-slate-50 transition-all';

export const Dashboard = () => {
  const { user } = useAuth();
  const currentUserId = user?.id || '';

  const [chatForm, setChatForm] = useState({
    title: 'Nhom chat',
    type: 'PRIVATE' as 'PRIVATE' | 'GROUP',
    memberIds: '',
  });
  const [friendForm, setFriendForm] = useState({ senderId: '', receiverId: '' });
  const [acceptForm, setAcceptForm] = useState({ requestId: '', receiverId: '' });
  const [notificationUserId, setNotificationUserId] = useState('');
  const [markReadId, setMarkReadId] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [lastPresignResult, setLastPresignResult] = useState<{
    publicUrl: string;
    key: string;
  } | null>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const [activeConversationId, setActiveConversationId] = useState('');
  const [messageInput, setMessageInput] = useState('');
  const [messageType, setMessageType] = useState<'TEXT' | 'FILE'>('TEXT');
  const [wsConnected, setWsConnected] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [chatHello, setChatHello] = useState('');
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [createdConversation, setCreatedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [unreadCount, setUnreadCount] = useState<number | null>(null);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [statusMessage, setStatusMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (currentUserId) {
      setFriendForm((prev) => ({ ...prev, senderId: prev.senderId || currentUserId }));
      setNotificationUserId((prev) => prev || currentUserId);
      setChatForm((prev) => ({
        ...prev,
        memberIds: prev.memberIds || currentUserId,
      }));
    }
  }, [currentUserId]);

  useEffect(() => {
    if (!currentUserId) {
      setProfile(null);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const res = await profileService.getById(currentUserId);
        if (cancelled) return;
        const data = res.data;
        setProfile(data);
        if (data?.displayName) {
          setDisplayName(data.displayName);
        }
        if (data?.avatarUrl) {
          setAvatarPreview(data.avatarUrl);
        }
      } catch {
        if (!cancelled) setProfile(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [currentUserId]);

  useEffect(() => {
    return () => {
      if (avatarPreview?.startsWith('blob:')) {
        URL.revokeObjectURL(avatarPreview);
      }
    };
  }, [avatarPreview]);

  useEffect(() => {
    if (!activeConversationId || !wsConnected) {
      return undefined;
    }

    const unsubscribe = chatSocket.subscribeConversation(activeConversationId, (incoming) => {
      const message = 'messageId' in incoming ? incoming : incoming.message;
      if (!message) {
        return;
      }

      setMessages((prev) => {
        if (prev.some((m) => m.messageId === message.messageId)) {
          return prev;
        }
        return [...prev, message].sort(
          (a, b) => (a.createdAt || '').localeCompare(b.createdAt || '')
        );
      });
    });

    return unsubscribe;
  }, [activeConversationId, wsConnected]);

  const notificationRows = useMemo(
    () =>
      notifications
        .slice()
        .sort((a, b) => (a.createdAt || '').localeCompare(b.createdAt || ''))
        .reverse(),
    [notifications]
  );

  const withSubmit = async (action: () => Promise<void>) => {
    setErrorMessage('');
    setStatusMessage('');
    setIsSubmitting(true);

    try {
      await action();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } }; message?: string };
      setErrorMessage(err?.response?.data?.message || err?.message || 'Yêu cầu thất bại');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateConversation = async (e: FormEvent) => {
    e.preventDefault();
    await withSubmit(async () => {
      const memberIds = parseUuidList(chatForm.memberIds);
      if (memberIds.length < 2) {
        throw new Error('Cần ít nhất 2 UUID thành viên (PRIVATE: 2 user, GROUP: >= 2)');
      }
      if (!memberIds.every(isUuid)) {
        throw new Error('Member IDs phải là UUID (PostgreSQL)');
      }

      const response = await chatService.createConversation({
        title: chatForm.title,
        type: chatForm.type,
        memberIds,
      });

      setCreatedConversation(response.data);
      setActiveConversationId(response.data.id);
      setStatusMessage(response.message || 'Tạo conversation thành công');
      if (currentUserId) {
        await loadConversations(currentUserId);
      }
    });
  };

  const loadConversations = async (userId: string) => {
    const response = await chatService.listConversationsByUser(userId);
    setConversations(response.data || []);
  };

  const handleLoadConversations = async () => {
    if (!currentUserId) {
      setErrorMessage('Chưa có userId trong JWT — đăng nhập lại');
      return;
    }
    await withSubmit(async () => {
      await loadConversations(currentUserId);
      setStatusMessage('Đã tải danh sách phòng chat');
    });
  };

  const handleLoadMessages = async () => {
    if (!activeConversationId) {
      setErrorMessage('Chọn hoặc nhập Conversation ID');
      return;
    }
    if (!currentUserId) {
      setErrorMessage('Chưa có userId trong JWT — đăng nhập lại');
      return;
    }
    await withSubmit(async () => {
      const response = await chatService.getMessages(activeConversationId, currentUserId);
      setMessages(response.data?.messages || []);
      setStatusMessage('Đã tải lịch sử tin (DynamoDB)');
    });
  };

  const handleConnectWs = () => {
    setErrorMessage('');
    chatSocket.connect(
      () => {
        setWsConnected(true);
        setStatusMessage('WebSocket STOMP đã kết nối');
      },
      (err) => {
        setWsConnected(false);
        setErrorMessage(err);
      }
    );
  };

  const handleSendMessage = async (e: FormEvent) => {
    e.preventDefault();
    if (!currentUserId || !activeConversationId) {
      setErrorMessage('Cần userId (JWT) và conversationId');
      return;
    }
    if (!wsConnected) {
      setErrorMessage('Kết nối WebSocket trước khi gửi tin');
      return;
    }

    try {
      chatSocket.sendMessage(
        chatService.buildSendPayload(
          activeConversationId,
          currentUserId,
          messageInput,
          messageType
        )
      );
      setMessageInput('');
      setStatusMessage('Đã gửi tin qua WebSocket');
    } catch (error: unknown) {
      const err = error as { message?: string };
      setErrorMessage(err.message || 'Gửi tin thất bại');
    }
  };

  const handleChatHello = async () => {
    await withSubmit(async () => {
      const response = await chatService.getHello();
      setChatHello(response);
      setStatusMessage('Chat service phản hồi OK');
    });
  };

  const handleSendFriendRequest = async (e: FormEvent) => {
    e.preventDefault();
    if (!isUuid(friendForm.senderId) || !isUuid(friendForm.receiverId)) {
      setErrorMessage('senderId và receiverId phải là UUID');
      return;
    }
    await withSubmit(async () => {
      const response = await friendService.sendRequest(friendForm);
      setStatusMessage(response.message || 'Gửi lời mời kết bạn thành công');
    });
  };

  const handleAcceptRequest = async (e: FormEvent) => {
    e.preventDefault();
    if (!isUuid(acceptForm.requestId) || !isUuid(acceptForm.receiverId)) {
      setErrorMessage('requestId và receiverId phải là UUID');
      return;
    }
    await withSubmit(async () => {
      const response = await friendService.acceptRequest(
        acceptForm.requestId,
        acceptForm.receiverId
      );
      setStatusMessage(response.message || 'Chấp nhận lời mời thành công');
    });
  };

  const handleLoadNotifications = async (e: FormEvent) => {
    e.preventDefault();
    if (!isUuid(notificationUserId)) {
      setErrorMessage('User ID phải là UUID');
      return;
    }
    await withSubmit(async () => {
      const [listResponse, countResponse] = await Promise.all([
        notificationService.getByUser(notificationUserId),
        notificationService.getUnreadCount(notificationUserId),
      ]);

      setNotifications(listResponse.data || []);
      setUnreadCount(countResponse.data ?? 0);
      setStatusMessage('Tải notification thành công');
    });
  };

  const handleMarkRead = async (e: FormEvent) => {
    e.preventDefault();
    if (!isUuid(markReadId)) {
      setErrorMessage('Notification ID phải là UUID');
      return;
    }
    await withSubmit(async () => {
      const response = await notificationService.markRead(markReadId);
      setStatusMessage(response.message || 'Đã đánh dấu đã đọc');
    });
  };

  const handleAvatarFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setErrorMessage('Chỉ chấp nhận file ảnh (image/*)');
      return;
    }
    setAvatarFile(file);
    setLastPresignResult(null);
    if (avatarPreview?.startsWith('blob:')) {
      URL.revokeObjectURL(avatarPreview);
    }
    setAvatarPreview(URL.createObjectURL(file));
  };

  const applyProfileResponse = (response: { message?: string; data?: UserProfile }) => {
    if (response.data) {
      setProfile(response.data);
      if (response.data.avatarUrl) {
        if (avatarPreview?.startsWith('blob:')) {
          URL.revokeObjectURL(avatarPreview);
        }
        setAvatarPreview(response.data.avatarUrl);
      }
      if (response.data.displayName) {
        setDisplayName(response.data.displayName);
      }
    }
    setAvatarFile(null);
    if (avatarInputRef.current) {
      avatarInputRef.current.value = '';
    }
    setStatusMessage(response.message || 'Cập nhật profile thành công');
  };

  const handleUpdateProfile = async (e: FormEvent) => {
    e.preventDefault();
    await withSubmit(async () => {
      const response = await profileService.updateProfile({
        displayName: displayName.trim() || undefined,
      });
      applyProfileResponse(response);
    });
  };

  const handleUploadAvatarPresign = async () => {
    if (!avatarFile) {
      setErrorMessage('Chọn ảnh avatar trước');
      return;
    }
    await withSubmit(async () => {
      const uploaded = await uploadFileViaPresign(avatarFile, 'avatar');
      setLastPresignResult({ publicUrl: uploaded.publicUrl, key: uploaded.key });
      const response = await profileService.updateProfile({
        displayName: displayName.trim() || undefined,
        avatarUrl: uploaded.publicUrl,
        avatarS3Key: uploaded.key,
      });
      applyProfileResponse(response);
    });
  };

  const handleUploadAvatarMultipart = async () => {
    if (!avatarFile) {
      setErrorMessage('Chọn ảnh avatar trước');
      return;
    }
    await withSubmit(async () => {
      const response = await profileService.updateAvatarViaMultipart(avatarFile, {
        displayName: displayName.trim() || undefined,
      });
      applyProfileResponse(response);
      setLastPresignResult(null);
    });
  };

  const handlePresignOnly = async () => {
    if (!avatarFile) {
      setErrorMessage('Chọn file để test presign');
      return;
    }
    await withSubmit(async () => {
      const result = await uploadFileViaPresign(avatarFile, 'avatar');
      setLastPresignResult({ publicUrl: result.publicUrl, key: result.key });
      setStatusMessage(
        'Presign + PUT S3 thành công (chưa lưu DB — bấm «Presign & lưu profile» để ghi avatar_url)'
      );
    });
  };

  return (
    <div className={dashboardShellClass}>
      {/* ── Decorative background blobs ── */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-225 h-125 opacity-30 pointer-events-none -z-10">
        <div className="absolute inset-0 bg-linear-to-br from-green-300 to-teal-300 blur-[120px] rounded-full mix-blend-multiply"></div>
      </div>

      {/* ── Gradient Banner ── */}
      <div className={dashboardHeroClass}>
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-2xl"></div>
        <div className="absolute -bottom-10 -left-10 w-56 h-56 bg-white/10 rounded-full blur-3xl"></div>
        <div className="max-w-7xl mx-auto relative z-10">
          <h1 className="text-3xl md:text-4xl font-extrabold text-white flex items-center gap-3 tracking-tight">
            <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <LayoutDashboard className="text-white" size={28} />
            </div>
            Microservice Dashboard
          </h1>
          <p className="text-green-100 mt-2 text-sm md:text-base">
            Quản lý Chat, Friend, Notification & Profile — tất cả trong một giao diện.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
        {/* ── Header Card ── */}
        <header className={dashboardCardClass}>
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex-1">
              <p className="text-slate-600">
                Đăng nhập:{' '}
                <span className="font-semibold text-slate-900">{user?.email || 'N/A'}</span>
              </p>
              <p className="text-slate-500 mt-1 text-sm">
                User ID (UUID):{' '}
                <code className="px-2.5 py-1 rounded-xl bg-slate-100/80 text-slate-800 font-mono text-xs break-all border border-slate-200/60">
                  {currentUserId || '— đăng nhập để lấy từ JWT'}
                </code>
              </p>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={handleChatHello}
              disabled={isSubmitting}
              className={dashboardDarkButtonClass}
            >
              Kiểm tra chat service
            </button>
            <button
              type="button"
              onClick={handleConnectWs}
              className={`px-5 py-2.5 rounded-2xl text-sm font-semibold flex items-center gap-2 transition-all active:scale-[0.98] ${
                wsConnected
                  ? 'bg-green-100/50 border border-green-200 text-green-700 backdrop-blur-md'
                  : 'app-button-primary'
              }`}
            >
              {wsConnected ? (
                <>
                  <span className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                  </span>
                  WS đã kết nối
                </>
              ) : (
                <>
                  <Plug size={16} />
                  Kết nối WebSocket
                </>
              )}
            </button>
            {chatHello && (
              <span className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-green-50/80 border border-green-200 text-green-700 text-sm font-medium backdrop-blur-sm">
                <CheckCircle2 size={16} />
                {chatHello}
              </span>
            )}
          </div>

          {statusMessage && (
            <div className="mt-4 flex items-center gap-2 px-4 py-3 rounded-2xl bg-green-50/80 border border-green-200 text-green-700 text-sm font-medium backdrop-blur-sm">
              <CheckCircle2 size={16} className="shrink-0" />
              {statusMessage}
            </div>
          )}
          {errorMessage && (
            <div className="mt-3 flex items-center gap-2 px-4 py-3 rounded-2xl bg-red-50/80 border border-red-200 text-red-700 text-sm font-medium backdrop-blur-sm">
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              {errorMessage}
            </div>
          )}
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* ════════════════════════════════════════════════════════════════
              CHAT SECTION
             ════════════════════════════════════════════════════════════════ */}
          <section className={`${dashboardCardClass} lg:col-span-2`}>
            <h2 className={dashboardTitleClass}>
              <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center text-green-600">
                <MessageCircle size={20} />
              </div>
              Chat — PostgreSQL (phòng) + DynamoDB (tin nhắn)
            </h2>

            <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left column: create & list */}
              <div className="space-y-4">
                <form className="space-y-3" onSubmit={handleCreateConversation}>
                  <input
                    className={dashboardInputClass}
                    placeholder="Title (GROUP bắt buộc)"
                    value={chatForm.title}
                    onChange={(e) => setChatForm((prev) => ({ ...prev, title: e.target.value }))}
                  />
                  <select
                    aria-label="Conversation type"
                    className={dashboardInputClass}
                    value={chatForm.type}
                    onChange={(e) =>
                      setChatForm((prev) => ({ ...prev, type: e.target.value as 'PRIVATE' | 'GROUP' }))
                    }
                  >
                    <option value="PRIVATE">PRIVATE</option>
                    <option value="GROUP">GROUP</option>
                  </select>
                  <input
                    className={`${dashboardInputClass} font-mono text-sm`}
                    placeholder="Member UUIDs (cách nhau bởi dấu phẩy)"
                    value={chatForm.memberIds}
                    onChange={(e) => setChatForm((prev) => ({ ...prev, memberIds: e.target.value }))}
                    required
                  />
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className={dashboardPrimaryButtonClass}
                  >
                    Tạo conversation
                  </button>
                </form>

                <button
                  type="button"
                  onClick={handleLoadConversations}
                  disabled={isSubmitting || !currentUserId}
                  className={dashboardSoftButtonClass + ' w-full'}
                >
                  Tải phòng của tôi
                </button>

                <div className="max-h-48 overflow-auto space-y-2">
                  {conversations.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setActiveConversationId(c.id)}
                      className={`w-full text-left p-3 rounded-2xl border text-sm hover:shadow-sm hover:-translate-y-0.5 transition-all duration-200 ${
                        activeConversationId === c.id
                          ? 'border-green-400 bg-linear-to-r from-green-50 to-teal-50 shadow-sm'
                          : 'border-slate-200/60 bg-white/60 hover:bg-white'
                      }`}
                    >
                      <p className="font-semibold text-slate-800">{c.title || c.type}</p>
                      <p className="text-xs text-slate-400 truncate font-mono">{c.id}</p>
                      {c.lastMessagePreview && (
                        <p className="text-xs text-slate-500 mt-1 truncate">{c.lastMessagePreview}</p>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Right column: messages */}
              <div className="lg:col-span-2 space-y-3">
                <div className="flex flex-wrap gap-2">
                  <input
                    className={`${dashboardInputClass} flex-1 min-w-50 font-mono text-sm`}
                    placeholder="Conversation UUID"
                    value={activeConversationId}
                    onChange={(e) => setActiveConversationId(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={handleLoadMessages}
                    disabled={isSubmitting}
                    className={dashboardDarkButtonClass + ' text-sm'}
                  >
                    Tải lịch sử
                  </button>
                </div>

                {/* Chat messages area */}
                <div className="h-72 overflow-y-auto rounded-2xl border border-slate-200/60 bg-white/65 backdrop-blur-sm p-4 space-y-3">
                  {messages.length === 0 && (
                    <div className="h-full flex items-center justify-center">
                      <p className="text-sm text-slate-400">Chưa có tin nhắn — tải lịch sử hoặc gửi tin mới.</p>
                    </div>
                  )}
                  {messages.map((msg) => (
                    <div
                      key={msg.messageId}
                      className={`flex ${msg.senderId === currentUserId ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                            className={`max-w-[75%] px-4 py-2.5 text-sm ${
                          msg.senderId === currentUserId
                                ? 'app-hero-banner text-white rounded-2xl rounded-tr-none shadow-md'
                            : 'bg-white border border-slate-100 text-slate-800 rounded-2xl rounded-tl-none shadow-sm'
                        }`}
                      >
                        <p className={`text-xs mb-1 ${msg.senderId === currentUserId ? 'text-green-100' : 'text-slate-400'}`}>
                          {msg.type} · {msg.createdAt ? new Date(msg.createdAt).toLocaleString() : ''}
                        </p>
                        <p>{msg.content || (msg.type === 'FILE' ? '[File]' : '')}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Send message form */}
                <form className="flex flex-wrap gap-2 items-center" onSubmit={handleSendMessage}>
                  <select
                    aria-label="Message type"
                    className={`${dashboardInputClass} text-sm`}
                    value={messageType}
                    onChange={(e) => setMessageType(e.target.value as 'TEXT' | 'FILE')}
                  >
                    <option value="TEXT">TEXT</option>
                    <option value="FILE">FILE</option>
                  </select>
                  <input
                    className="flex-1 min-w-45 px-4 py-2.5 rounded-full bg-white border border-slate-200 shadow-sm outline-none focus:ring-4 focus:ring-green-500/10 focus:border-green-500 transition-all"
                    placeholder="Nhập tin nhắn..."
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                  />
                  <button
                    type="submit"
                    disabled={!wsConnected}
                    aria-label="Gửi tin nhắn"
                    className="w-11 h-11 rounded-full app-button-primary disabled:opacity-50"
                  >
                    <Send size={18} className="ml-0.5" />
                  </button>
                </form>
              </div>
            </div>

            {createdConversation && (
              <div className="mt-5 p-4 rounded-2xl bg-green-50/80 border border-green-200 backdrop-blur-sm text-sm space-y-1">
                <p>
                  <strong className="text-green-800">ID:</strong>{' '}
                  <code className="font-mono text-xs">{createdConversation.id}</code>
                </p>
                <p>
                  <strong className="text-green-800">Type:</strong> {createdConversation.type}
                </p>
                <p>
                  <strong className="text-green-800">Members:</strong>{' '}
                  {createdConversation.members
                    ?.map((m) => getMemberUserId(m))
                    .filter(Boolean)
                    .join(', ') || '—'}
                </p>
              </div>
            )}
          </section>

          {/* ════════════════════════════════════════════════════════════════
              FRIEND SERVICE SECTION
             ════════════════════════════════════════════════════════════════ */}
          <section className={dashboardCardClass}>
            <h2 className={dashboardTitleClass}>
              <div className="w-10 h-10 rounded-xl bg-teal-100 flex items-center justify-center text-teal-600">
                <UserPlus size={20} />
              </div>
              Friend Service
            </h2>

            <form className="mt-5 space-y-3" onSubmit={handleSendFriendRequest}>
              <input
                className={`${dashboardInputClass} font-mono text-sm`}
                placeholder="Sender UUID"
                value={friendForm.senderId}
                onChange={(e) => setFriendForm((prev) => ({ ...prev, senderId: e.target.value }))}
                required
              />
              <input
                className={`${dashboardInputClass} font-mono text-sm`}
                placeholder="Receiver UUID"
                value={friendForm.receiverId}
                onChange={(e) => setFriendForm((prev) => ({ ...prev, receiverId: e.target.value }))}
                required
              />
              <button
                type="submit"
                disabled={isSubmitting}
                className={dashboardPrimaryButtonClass}
              >
                Gửi lời mời kết bạn
              </button>
            </form>

            <form className="mt-6 space-y-3" onSubmit={handleAcceptRequest}>
              <input
                className="w-full px-4 py-2.5 rounded-2xl bg-white border border-slate-200 shadow-sm outline-none focus:ring-4 focus:ring-green-500/10 focus:border-green-500 transition-all font-mono text-sm"
                placeholder="Request UUID"
                value={acceptForm.requestId}
                onChange={(e) => setAcceptForm((prev) => ({ ...prev, requestId: e.target.value }))}
                required
              />
              <input
                className="w-full px-4 py-2.5 rounded-2xl bg-white border border-slate-200 shadow-sm outline-none focus:ring-4 focus:ring-green-500/10 focus:border-green-500 transition-all font-mono text-sm"
                placeholder="Receiver UUID"
                value={acceptForm.receiverId}
                onChange={(e) => setAcceptForm((prev) => ({ ...prev, receiverId: e.target.value }))}
                required
              />
              <button
                type="submit"
                disabled={isSubmitting}
                className={dashboardDarkButtonClass}
              >
                Chấp nhận lời mời
              </button>
            </form>
          </section>

          {/* ════════════════════════════════════════════════════════════════
              NOTIFICATION SERVICE SECTION
             ════════════════════════════════════════════════════════════════ */}
          <section className={dashboardCardClass}>
            <h2 className={dashboardTitleClass}>
              <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center text-orange-600">
                <Bell size={20} />
              </div>
              Notification Service
            </h2>

            <form className="mt-5 space-y-3" onSubmit={handleLoadNotifications}>
              <input
                className={`${dashboardInputClass} font-mono text-sm`}
                placeholder="User UUID"
                value={notificationUserId}
                onChange={(e) => setNotificationUserId(e.target.value)}
                required
              />
              <button
                type="submit"
                disabled={isSubmitting}
                className={dashboardPrimaryButtonClass}
              >
                Tải notification
              </button>
            </form>

            <form className="mt-5 flex gap-2" onSubmit={handleMarkRead}>
              <input
                className={`${dashboardInputClass} flex-1 font-mono text-sm`}
                placeholder="Notification UUID"
                value={markReadId}
                onChange={(e) => setMarkReadId(e.target.value)}
                required
              />
              <button
                type="submit"
                disabled={isSubmitting}
                className={dashboardDarkButtonClass}
              >
                Mark read
              </button>
            </form>

            {unreadCount !== null && (
              <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-orange-50 border border-orange-200 text-orange-700 text-sm font-semibold">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-orange-500"></span>
                </span>
                Unread: {unreadCount}
              </div>
            )}

            <div className="mt-4 space-y-2 max-h-64 overflow-auto">
              {notificationRows.map((item) => (
                <div
                  key={item.id}
                  className="p-4 rounded-2xl border border-slate-200/60 bg-white/60 backdrop-blur-sm text-sm hover:shadow-sm hover:-translate-y-0.5 transition-all duration-200"
                >
                  <p className="font-semibold text-slate-900">{item.title}</p>
                  <p className="text-slate-600 mt-1">{item.body}</p>
                  <div className="mt-2 flex items-center gap-2">
                    <span className="text-xs text-slate-400">{item.type}</span>
                    <span className="text-xs text-slate-300">·</span>
                    <span
                      className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                        item.isRead
                          ? 'bg-green-50 text-green-600 border border-green-200'
                          : 'bg-amber-50 text-amber-600 border border-amber-200'
                      }`}
                    >
                      {item.isRead ? 'Đã đọc' : 'Chưa đọc'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* ════════════════════════════════════════════════════════════════
              USER PROFILE SECTION
             ════════════════════════════════════════════════════════════════ */}
          <section className={`${dashboardCardClass} lg:col-span-2`}>
            <h2 className={dashboardTitleClass}>
              <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center text-indigo-600">
                <UserRoundCog size={20} />
              </div>
              User Profile (app.users)
            </h2>

            <div className="mt-5 flex flex-wrap items-start gap-5">
              {/* Avatar with gradient ring */}
              <div className="shrink-0">
                <div className="w-24 h-24 rounded-full bg-linear-to-tr from-green-400 to-teal-400 p-0.75 shadow-lg shadow-green-500/20">
                  {avatarPreview ? (
                    <img
                      src={avatarPreview}
                      alt="Avatar"
                      className="w-full h-full rounded-full object-cover border-[3px] border-white"
                    />
                  ) : (
                    <div className="w-full h-full rounded-full bg-white border-[3px] border-white flex items-center justify-center text-xs text-slate-400">
                      Chưa có ảnh
                    </div>
                  )}
                </div>
              </div>
              <div className="flex-1 min-w-50 space-y-2">
                <input
                  ref={avatarInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  onChange={handleAvatarFileChange}
                  aria-label="Tải ảnh avatar"
                  title="Tải ảnh avatar"
                  className="block w-full text-sm text-slate-600 file:mr-3 file:py-2 file:px-4 file:rounded-2xl file:border-0 file:bg-linear-to-r file:from-green-600 file:to-teal-600 file:text-white file:font-medium file:cursor-pointer file:shadow-sm file:hover:shadow-md file:transition-all"
                />
                <p className="text-xs text-slate-400">
                  Avatar: S3 + CloudFront. Presign qua media-service (:8085) hoặc multipart qua
                  user-service.
                </p>
              </div>
            </div>

            <form className="mt-5 space-y-3" onSubmit={handleUpdateProfile}>
              <input
                className={dashboardInputClass}
                placeholder="Display name"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
              />
              <button
                type="submit"
                disabled={isSubmitting}
                className={dashboardDarkButtonClass + ' w-full'}
              >
                Chỉ cập nhật tên
              </button>
            </form>

            <div className="mt-4 flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                disabled={isSubmitting || !avatarFile}
                onClick={handleUploadAvatarPresign}
                className={`${dashboardPrimaryButtonClass} flex-1 disabled:opacity-50`}
              >
                Presign &amp; lưu profile
              </button>
              <button
                type="button"
                disabled={isSubmitting || !avatarFile}
                onClick={handleUploadAvatarMultipart}
                className={`${dashboardPrimaryButtonClass} flex-1 disabled:opacity-50`}
              >
                Multipart → S3
              </button>
            </div>

            <button
              type="button"
              disabled={isSubmitting || !avatarFile}
              onClick={handlePresignOnly}
              className="mt-3 w-full px-5 py-2.5 rounded-2xl border border-green-200 text-green-700 font-semibold hover:bg-green-50 transition-all disabled:opacity-50"
            >
              Chỉ test presign (không lưu DB)
            </button>

            {lastPresignResult && (
              <div className="mt-4 p-4 rounded-2xl bg-green-50/80 border border-green-200 backdrop-blur-sm text-xs text-slate-700 space-y-1 break-all">
                <p>
                  <span className="font-semibold text-green-700">publicUrl:</span>{' '}
                  {lastPresignResult.publicUrl}
                </p>
                <p>
                  <span className="font-semibold text-green-700">s3Key:</span>{' '}
                  {lastPresignResult.key}
                </p>
              </div>
            )}

            {profile?.avatarUrl && (
              <p className="mt-3 text-xs text-slate-400 break-all px-1">
                DB avatar_url: <code className="font-mono">{profile.avatarUrl}</code>
              </p>
            )}

            <div className="mt-6 p-4 rounded-2xl bg-green-50/80 border border-green-200 backdrop-blur-sm text-sm text-green-800 flex items-start gap-2">
              <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-green-600" />
              <span>
                Profile lưu trên PostgreSQL <code className="mx-1 px-1.5 py-0.5 rounded-lg bg-green-100 text-green-900 text-xs">app.users</code> — cần JWT. Gateway{' '}
                <code className="mx-1 px-1.5 py-0.5 rounded-lg bg-green-100 text-green-900 text-xs">/api/media/presigned-upload</code> +{' '}
                <code className="mx-1 px-1.5 py-0.5 rounded-lg bg-green-100 text-green-900 text-xs">/api/profiles/update-profile</code>.
              </span>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};
