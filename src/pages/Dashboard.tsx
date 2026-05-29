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
    <div className="max-w-7xl mx-auto px-4 py-10 space-y-8">
      <header className="rounded-3xl p-6 bg-white border border-slate-200 shadow-sm">
        <h1 className="text-3xl font-black text-slate-900 flex items-center gap-3">
          <LayoutDashboard className="text-green-600" size={32} />
          Microservice Dashboard
        </h1>
        <p className="text-slate-600 mt-2">
          Đăng nhập: <span className="font-semibold text-slate-900">{user?.email || 'N/A'}</span>
        </p>
        <p className="text-slate-600 mt-1 text-sm">
          User ID (UUID):{' '}
          <code className="px-2 py-0.5 rounded bg-slate-100 text-slate-800 break-all">
            {currentUserId || '— đăng nhập để lấy từ JWT'}
          </code>
        </p>

        <div className="mt-4 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={handleChatHello}
            disabled={isSubmitting}
            className="px-4 py-2 rounded-xl bg-slate-900 text-white text-sm font-semibold hover:bg-slate-800"
          >
            Kiểm tra chat service
          </button>
          <button
            type="button"
            onClick={handleConnectWs}
            className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 flex items-center gap-2"
          >
            <Plug size={16} />
            {wsConnected ? 'WS đã kết nối' : 'Kết nối WebSocket'}
          </button>
          {chatHello && (
            <span className="px-3 py-2 rounded-xl bg-green-100 text-green-700 text-sm font-medium">
              {chatHello}
            </span>
          )}
        </div>

        {statusMessage && <p className="mt-4 text-sm text-green-700 font-medium">{statusMessage}</p>}
        {errorMessage && <p className="mt-2 text-sm text-red-600 font-medium">{errorMessage}</p>}
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <section className="rounded-3xl p-6 bg-white border border-slate-200 shadow-sm lg:col-span-2">
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <MessageCircle className="text-green-600" size={20} />
            Chat — PostgreSQL (phòng) + DynamoDB (tin nhắn)
          </h2>

          <div className="mt-4 grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="space-y-4">
              <form className="space-y-3" onSubmit={handleCreateConversation}>
                <input
                  className="w-full px-4 py-2 rounded-xl border border-slate-300"
                  placeholder="Title (GROUP bắt buộc)"
                  value={chatForm.title}
                  onChange={(e) => setChatForm((prev) => ({ ...prev, title: e.target.value }))}
                />
                <select
                  aria-label="Conversation type"
                  className="w-full px-4 py-2 rounded-xl border border-slate-300"
                  value={chatForm.type}
                  onChange={(e) =>
                    setChatForm((prev) => ({ ...prev, type: e.target.value as 'PRIVATE' | 'GROUP' }))
                  }
                >
                  <option value="PRIVATE">PRIVATE</option>
                  <option value="GROUP">GROUP</option>
                </select>
                <input
                  className="w-full px-4 py-2 rounded-xl border border-slate-300 text-sm"
                  placeholder="Member UUIDs (cách nhau bởi dấu phẩy)"
                  value={chatForm.memberIds}
                  onChange={(e) => setChatForm((prev) => ({ ...prev, memberIds: e.target.value }))}
                  required
                />
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full px-4 py-2 rounded-xl bg-green-600 text-white font-semibold hover:bg-green-700"
                >
                  Tạo conversation
                </button>
              </form>

              <button
                type="button"
                onClick={handleLoadConversations}
                disabled={isSubmitting || !currentUserId}
                className="w-full px-4 py-2 rounded-xl border border-slate-300 font-semibold hover:bg-slate-50"
              >
                Tải phòng của tôi
              </button>

              <div className="max-h-48 overflow-auto space-y-2">
                {conversations.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setActiveConversationId(c.id)}
                    className={`w-full text-left p-3 rounded-xl border text-sm ${
                      activeConversationId === c.id
                        ? 'border-green-500 bg-green-50'
                        : 'border-slate-200 bg-slate-50'
                    }`}
                  >
                    <p className="font-semibold">{c.title || c.type}</p>
                    <p className="text-xs text-slate-500 truncate">{c.id}</p>
                    {c.lastMessagePreview && (
                      <p className="text-xs text-slate-600 mt-1 truncate">{c.lastMessagePreview}</p>
                    )}
                  </button>
                ))}
              </div>
            </div>

            <div className="lg:col-span-2 space-y-3">
              <div className="flex flex-wrap gap-2">
                <input
                  className="flex-1 min-w-[200px] px-4 py-2 rounded-xl border border-slate-300 text-sm"
                  placeholder="Conversation UUID"
                  value={activeConversationId}
                  onChange={(e) => setActiveConversationId(e.target.value)}
                />
                <button
                  type="button"
                  onClick={handleLoadMessages}
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-white text-sm font-semibold"
                >
                  Tải lịch sử
                </button>
              </div>

              <div className="h-64 overflow-y-auto rounded-xl border border-slate-200 bg-slate-50 p-3 space-y-2">
                {messages.length === 0 && (
                  <p className="text-sm text-slate-500">Chưa có tin nhắn — tải lịch sử hoặc gửi tin mới.</p>
                )}
                {messages.map((msg) => (
                  <div
                    key={msg.messageId}
                    className={`p-2 rounded-lg text-sm ${
                      msg.senderId === currentUserId ? 'bg-green-100 ml-8' : 'bg-white mr-8'
                    }`}
                  >
                    <p className="text-xs text-slate-500">
                      {msg.type} · {msg.createdAt ? new Date(msg.createdAt).toLocaleString() : ''}
                    </p>
                    <p className="text-slate-900">{msg.content || (msg.type === 'FILE' ? '[File]' : '')}</p>
                  </div>
                ))}
              </div>

              <form className="flex flex-wrap gap-2" onSubmit={handleSendMessage}>
                <select
                  aria-label="Message type"
                  className="px-3 py-2 rounded-xl border border-slate-300"
                  value={messageType}
                  onChange={(e) => setMessageType(e.target.value as 'TEXT' | 'FILE')}
                >
                  <option value="TEXT">TEXT</option>
                  <option value="FILE">FILE</option>
                </select>
                <input
                  className="flex-1 min-w-[180px] px-4 py-2 rounded-xl border border-slate-300"
                  placeholder="Nội dung tin nhắn"
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                />
                <button
                  type="submit"
                  disabled={!wsConnected}
                  className="px-4 py-2 rounded-xl bg-green-600 text-white font-semibold flex items-center gap-2"
                >
                  <Send size={16} />
                  Gửi
                </button>
              </form>
            </div>
          </div>

          {createdConversation && (
            <div className="mt-4 p-4 rounded-xl bg-slate-50 border border-slate-200 text-sm">
              <p>
                <strong>ID:</strong> {createdConversation.id}
              </p>
              <p>
                <strong>Type:</strong> {createdConversation.type}
              </p>
              <p>
                <strong>Members:</strong>{' '}
                {createdConversation.members
                  ?.map((m) => getMemberUserId(m))
                  .filter(Boolean)
                  .join(', ') || '—'}
              </p>
            </div>
          )}
        </section>

        <section className="rounded-3xl p-6 bg-white border border-slate-200 shadow-sm">
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <UserPlus className="text-green-600" size={20} />
            Friend Service
          </h2>

          <form className="mt-4 space-y-3" onSubmit={handleSendFriendRequest}>
            <input
              className="w-full px-4 py-2 rounded-xl border border-slate-300 font-mono text-sm"
              placeholder="Sender UUID"
              value={friendForm.senderId}
              onChange={(e) => setFriendForm((prev) => ({ ...prev, senderId: e.target.value }))}
              required
            />
            <input
              className="w-full px-4 py-2 rounded-xl border border-slate-300 font-mono text-sm"
              placeholder="Receiver UUID"
              value={friendForm.receiverId}
              onChange={(e) => setFriendForm((prev) => ({ ...prev, receiverId: e.target.value }))}
              required
            />
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 rounded-xl bg-green-600 text-white font-semibold hover:bg-green-700"
            >
              Gửi lời mời kết bạn
            </button>
          </form>

          <form className="mt-6 space-y-3" onSubmit={handleAcceptRequest}>
            <input
              className="w-full px-4 py-2 rounded-xl border border-slate-300 font-mono text-sm"
              placeholder="Request UUID"
              value={acceptForm.requestId}
              onChange={(e) => setAcceptForm((prev) => ({ ...prev, requestId: e.target.value }))}
              required
            />
            <input
              className="w-full px-4 py-2 rounded-xl border border-slate-300 font-mono text-sm"
              placeholder="Receiver UUID"
              value={acceptForm.receiverId}
              onChange={(e) => setAcceptForm((prev) => ({ ...prev, receiverId: e.target.value }))}
              required
            />
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 rounded-xl bg-slate-900 text-white font-semibold hover:bg-slate-800"
            >
              Chấp nhận lời mời
            </button>
          </form>
        </section>

        <section className="rounded-3xl p-6 bg-white border border-slate-200 shadow-sm">
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Bell className="text-green-600" size={20} />
            Notification Service
          </h2>

          <form className="mt-4 space-y-3" onSubmit={handleLoadNotifications}>
            <input
              className="w-full px-4 py-2 rounded-xl border border-slate-300 font-mono text-sm"
              placeholder="User UUID"
              value={notificationUserId}
              onChange={(e) => setNotificationUserId(e.target.value)}
              required
            />
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 rounded-xl bg-green-600 text-white font-semibold hover:bg-green-700"
            >
              Tải notification
            </button>
          </form>

          <form className="mt-4 flex gap-2" onSubmit={handleMarkRead}>
            <input
              className="flex-1 px-4 py-2 rounded-xl border border-slate-300 font-mono text-sm"
              placeholder="Notification UUID"
              value={markReadId}
              onChange={(e) => setMarkReadId(e.target.value)}
              required
            />
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 rounded-xl bg-slate-900 text-white font-semibold hover:bg-slate-800"
            >
              Mark read
            </button>
          </form>

          {unreadCount !== null && (
            <p className="mt-4 text-sm font-semibold text-slate-700">Unread: {unreadCount}</p>
          )}

          <div className="mt-4 space-y-2 max-h-64 overflow-auto">
            {notificationRows.map((item) => (
              <div key={item.id} className="p-3 rounded-xl border border-slate-200 bg-slate-50 text-sm">
                <p className="font-semibold text-slate-900">{item.title}</p>
                <p className="text-slate-600 mt-1">{item.body}</p>
                <p className="mt-2 text-xs text-slate-500">
                  {item.type} · {item.isRead ? 'Đã đọc' : 'Chưa đọc'}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-3xl p-6 bg-white border border-slate-200 shadow-sm">
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <UserRoundCog className="text-green-600" size={20} />
            User Profile (app.users)
          </h2>

          <div className="mt-4 flex flex-wrap items-start gap-4">
            <div className="shrink-0">
              {avatarPreview ? (
                <img
                  src={avatarPreview}
                  alt="Avatar"
                  className="w-20 h-20 rounded-full object-cover border border-slate-200"
                />
              ) : (
                <div className="w-20 h-20 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-xs text-slate-500">
                  Chưa có ảnh
                </div>
              )}
            </div>
            <div className="flex-1 min-w-[200px] space-y-2">
              <input
                ref={avatarInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                onChange={handleAvatarFileChange}
                className="block w-full text-sm text-slate-600 file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:bg-slate-100 file:font-medium"
              />
              <p className="text-xs text-slate-500">
                Avatar: S3 + CloudFront. Presign qua media-service (:8085) hoặc multipart qua
                user-service.
              </p>
            </div>
          </div>

          <form className="mt-4 space-y-3" onSubmit={handleUpdateProfile}>
            <input
              className="w-full px-4 py-2 rounded-xl border border-slate-300"
              placeholder="Display name"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
            />
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full px-4 py-2 rounded-xl bg-slate-700 text-white font-semibold hover:bg-slate-800"
            >
              Chỉ cập nhật tên
            </button>
          </form>

          <div className="mt-4 flex flex-col sm:flex-row gap-2">
            <button
              type="button"
              disabled={isSubmitting || !avatarFile}
              onClick={handleUploadAvatarPresign}
              className="flex-1 px-4 py-2 rounded-xl bg-green-600 text-white font-semibold hover:bg-green-700 disabled:opacity-50"
            >
              Presign &amp; lưu profile
            </button>
            <button
              type="button"
              disabled={isSubmitting || !avatarFile}
              onClick={handleUploadAvatarMultipart}
              className="flex-1 px-4 py-2 rounded-xl bg-emerald-700 text-white font-semibold hover:bg-emerald-800 disabled:opacity-50"
            >
              Multipart → S3
            </button>
          </div>

          <button
            type="button"
            disabled={isSubmitting || !avatarFile}
            onClick={handlePresignOnly}
            className="mt-2 w-full px-4 py-2 rounded-xl border border-indigo-300 text-indigo-700 font-medium hover:bg-indigo-50 disabled:opacity-50"
          >
            Chỉ test presign (không lưu DB)
          </button>

          {lastPresignResult && (
            <div className="mt-3 p-3 rounded-xl bg-indigo-50 border border-indigo-200 text-xs text-slate-700 space-y-1 break-all">
              <p>
                <span className="font-semibold">publicUrl:</span> {lastPresignResult.publicUrl}
              </p>
              <p>
                <span className="font-semibold">s3Key:</span> {lastPresignResult.key}
              </p>
            </div>
          )}

          {profile?.avatarUrl && (
            <p className="mt-2 text-xs text-slate-500 break-all">
              DB avatar_url: {profile.avatarUrl}
            </p>
          )}

          <div className="mt-6 p-4 rounded-xl bg-green-50 border border-green-200 text-sm text-green-800 flex items-start gap-2">
            <CheckCircle2 size={18} className="mt-0.5 shrink-0" />
            Profile lưu trên PostgreSQL <code className="mx-1">app.users</code> — cần JWT. Gateway{' '}
            <code className="mx-1">/api/media/presigned-upload</code> +{' '}
            <code className="mx-1">/api/profiles/update-profile</code>.
          </div>
        </section>
      </div>
    </div>
  );
};
