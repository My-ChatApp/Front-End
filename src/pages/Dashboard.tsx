import { FormEvent, useMemo, useState } from 'react';
import { chatService, friendService, notificationService, profileService } from '@/services';
import { useAuth } from '@/context';
import { Conversation, NotificationItem } from '@/types';
import {
  Bell,
  CheckCircle2,
  LayoutDashboard,
  MessageCircle,
  UserPlus,
  UserRoundCog,
} from 'lucide-react';

export const Dashboard = () => {
  const { user } = useAuth();

  const [chatForm, setChatForm] = useState({
    title: '',
    type: 'PRIVATE' as 'PRIVATE' | 'GROUP',
    memberIds: '',
  });
  const [friendForm, setFriendForm] = useState({ senderId: '', receiverId: '' });
  const [acceptForm, setAcceptForm] = useState({ requestId: '', receiverId: '' });
  const [notificationUserId, setNotificationUserId] = useState('');
  const [markReadId, setMarkReadId] = useState('');
  const [displayName, setDisplayName] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [chatHello, setChatHello] = useState('');
  const [createdConversation, setCreatedConversation] = useState<Conversation | null>(null);
  const [unreadCount, setUnreadCount] = useState<number | null>(null);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [statusMessage, setStatusMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const notificationRows = useMemo(
    () => notifications.slice().sort((a, b) => (a.createdAt || '').localeCompare(b.createdAt || '')).reverse(),
    [notifications]
  );

  const withSubmit = async (action: () => Promise<void>) => {
    setErrorMessage('');
    setStatusMessage('');
    setIsSubmitting(true);

    try {
      await action();
    } catch (error: any) {
      setErrorMessage(error?.response?.data?.message || error?.message || 'Yeu cau that bai');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateConversation = async (e: FormEvent) => {
    e.preventDefault();
    await withSubmit(async () => {
      const memberIds = chatForm.memberIds
        .split(',')
        .map((id) => id.trim())
        .filter(Boolean);

      const response = await chatService.createConversation({
        title: chatForm.title,
        type: chatForm.type,
        memberIds,
      });

      setCreatedConversation(response.data);
      setStatusMessage(response.message || 'Tao conversation thanh cong');
    });
  };

  const handleChatHello = async () => {
    await withSubmit(async () => {
      const response = await chatService.getHello();
      setChatHello(response);
      setStatusMessage('Chat service da phan hoi thanh cong');
    });
  };

  const handleSendFriendRequest = async (e: FormEvent) => {
    e.preventDefault();
    await withSubmit(async () => {
      const response = await friendService.sendRequest(friendForm);
      setStatusMessage(response.message || 'Gui loi moi ket ban thanh cong');
    });
  };

  const handleAcceptRequest = async (e: FormEvent) => {
    e.preventDefault();
    await withSubmit(async () => {
      const response = await friendService.acceptRequest(acceptForm.requestId, acceptForm.receiverId);
      setStatusMessage(response.message || 'Chap nhan loi moi ket ban thanh cong');
    });
  };

  const handleLoadNotifications = async (e: FormEvent) => {
    e.preventDefault();
    await withSubmit(async () => {
      const [listResponse, countResponse] = await Promise.all([
        notificationService.getByUser(notificationUserId),
        notificationService.getUnreadCount(notificationUserId),
      ]);

      setNotifications(listResponse.data || []);
      setUnreadCount(countResponse.data ?? 0);
      setStatusMessage('Tai notification thanh cong');
    });
  };

  const handleMarkRead = async (e: FormEvent) => {
    e.preventDefault();
    await withSubmit(async () => {
      const response = await notificationService.markRead(markReadId);
      setStatusMessage(response.message || 'Da danh dau da doc');
    });
  };

  const handleUpdateProfile = async (e: FormEvent) => {
    e.preventDefault();
    await withSubmit(async () => {
      const response = await profileService.updateProfile(displayName);
      setStatusMessage(response.message || 'Cap nhat profile thanh cong');
    });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-10 space-y-8">
      <header className="rounded-3xl p-6 bg-white border border-slate-200 shadow-sm">
        <h1 className="text-3xl font-black text-slate-900 flex items-center gap-3">
          <LayoutDashboard className="text-green-600" size={32} />
          Microservice Dashboard
        </h1>
        <p className="text-slate-600 mt-2">Dang nhap voi: <span className="font-semibold text-slate-900">{user?.email || 'N/A'}</span></p>

        <div className="mt-4 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={handleChatHello}
            disabled={isSubmitting}
            className="px-4 py-2 rounded-xl bg-slate-900 text-white text-sm font-semibold hover:bg-slate-800"
          >
            Kiem tra chat service
          </button>
          {chatHello && <span className="px-3 py-2 rounded-xl bg-green-100 text-green-700 text-sm font-medium">{chatHello}</span>}
        </div>

        {statusMessage && <p className="mt-4 text-sm text-green-700 font-medium">{statusMessage}</p>}
        {errorMessage && <p className="mt-2 text-sm text-red-600 font-medium">{errorMessage}</p>}
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <section className="rounded-3xl p-6 bg-white border border-slate-200 shadow-sm">
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <MessageCircle className="text-green-600" size={20} />
            Conversation - Chat Service
          </h2>
          <form className="mt-4 space-y-3" onSubmit={handleCreateConversation}>
            <input
              className="w-full px-4 py-2 rounded-xl border border-slate-300"
              placeholder="Title"
              value={chatForm.title}
              onChange={(e) => setChatForm((prev) => ({ ...prev, title: e.target.value }))}
              required
            />
            <select
              aria-label="Conversation type"
              className="w-full px-4 py-2 rounded-xl border border-slate-300"
              value={chatForm.type}
              onChange={(e) => setChatForm((prev) => ({ ...prev, type: e.target.value as 'PRIVATE' | 'GROUP' }))}
            >
              <option value="PRIVATE">PRIVATE</option>
              <option value="GROUP">GROUP</option>
            </select>
            <input
              className="w-full px-4 py-2 rounded-xl border border-slate-300"
              placeholder="Member IDs (comma-separated)"
              value={chatForm.memberIds}
              onChange={(e) => setChatForm((prev) => ({ ...prev, memberIds: e.target.value }))}
              required
            />
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 rounded-xl bg-green-600 text-white font-semibold hover:bg-green-700"
            >
              Tao conversation
            </button>
          </form>

          {createdConversation && (
            <div className="mt-4 p-4 rounded-xl bg-slate-50 border border-slate-200 text-sm">
              <p><strong>ID:</strong> {createdConversation.id}</p>
              <p><strong>Type:</strong> {createdConversation.type}</p>
              <p><strong>Title:</strong> {createdConversation.title}</p>
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
              className="w-full px-4 py-2 rounded-xl border border-slate-300"
              placeholder="Sender ID"
              value={friendForm.senderId}
              onChange={(e) => setFriendForm((prev) => ({ ...prev, senderId: e.target.value }))}
              required
            />
            <input
              className="w-full px-4 py-2 rounded-xl border border-slate-300"
              placeholder="Receiver ID"
              value={friendForm.receiverId}
              onChange={(e) => setFriendForm((prev) => ({ ...prev, receiverId: e.target.value }))}
              required
            />
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 rounded-xl bg-green-600 text-white font-semibold hover:bg-green-700"
            >
              Gui loi moi ket ban
            </button>
          </form>

          <form className="mt-6 space-y-3" onSubmit={handleAcceptRequest}>
            <input
              className="w-full px-4 py-2 rounded-xl border border-slate-300"
              placeholder="Request ID"
              value={acceptForm.requestId}
              onChange={(e) => setAcceptForm((prev) => ({ ...prev, requestId: e.target.value }))}
              required
            />
            <input
              className="w-full px-4 py-2 rounded-xl border border-slate-300"
              placeholder="Receiver ID"
              value={acceptForm.receiverId}
              onChange={(e) => setAcceptForm((prev) => ({ ...prev, receiverId: e.target.value }))}
              required
            />
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 rounded-xl bg-slate-900 text-white font-semibold hover:bg-slate-800"
            >
              Chap nhan loi moi
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
              className="w-full px-4 py-2 rounded-xl border border-slate-300"
              placeholder="User ID"
              value={notificationUserId}
              onChange={(e) => setNotificationUserId(e.target.value)}
              required
            />
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 rounded-xl bg-green-600 text-white font-semibold hover:bg-green-700"
            >
              Tai notification
            </button>
          </form>

          <form className="mt-4 flex gap-2" onSubmit={handleMarkRead}>
            <input
              className="flex-1 px-4 py-2 rounded-xl border border-slate-300"
              placeholder="Notification ID"
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
            <p className="mt-4 text-sm font-semibold text-slate-700">Unread count: {unreadCount}</p>
          )}

          <div className="mt-4 space-y-2 max-h-64 overflow-auto">
            {notificationRows.map((item) => (
              <div key={item.id} className="p-3 rounded-xl border border-slate-200 bg-slate-50 text-sm">
                <p className="font-semibold text-slate-900">{item.title}</p>
                <p className="text-slate-600 mt-1">{item.body}</p>
                <p className="mt-2 text-xs text-slate-500">
                  {item.type} - {item.isRead ?? item.read ? 'Read' : 'Unread'}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-3xl p-6 bg-white border border-slate-200 shadow-sm">
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <UserRoundCog className="text-green-600" size={20} />
            User Profile Service
          </h2>

          <form className="mt-4 space-y-3" onSubmit={handleUpdateProfile}>
            <input
              className="w-full px-4 py-2 rounded-xl border border-slate-300"
              placeholder="Display name"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              required
            />
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 rounded-xl bg-green-600 text-white font-semibold hover:bg-green-700"
            >
              Cap nhat profile
            </button>
          </form>

          <div className="mt-6 p-4 rounded-xl bg-green-50 border border-green-200 text-sm text-green-800 flex items-start gap-2">
            <CheckCircle2 size={18} className="mt-0.5" />
            Endpoint update profile backend hien tai yeu cau JWT + request part, dashboard nay da gui dung format multipart.
          </div>
        </section>
      </div>
    </div>
  );
};


