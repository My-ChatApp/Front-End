import { useCallback, useEffect, useMemo, useState } from 'react';
import { Bell } from 'lucide-react';
import { useAuth } from '@/context';
import { useChat } from '@/context/ChatContext';
import { notificationService } from '@/services/notificationService';
import { NotificationItem } from '@/types';
import { formatMessageTime, isSystemNotification } from '@/utils/chatUtils';

export const NotificationsPanel = () => {
  const { user } = useAuth();
  const { setActiveNavView } = useChat();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(false);

  const loadNotifications = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      await notificationService.markAllRead(user.id);
      const res = await notificationService.getByUser(user.id);
      if (res.success && res.data) {
        setNotifications(
          res.data
            .filter(isSystemNotification)
            .map((n) => ({ ...n, isRead: true, read: true }))
        );
      }
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    void loadNotifications();
  }, [loadNotifications]);

  const sorted = useMemo(
    () =>
      [...notifications].sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || '')),
    [notifications]
  );

  const handleClick = (item: NotificationItem) => {
    if (item.type === 'FRIEND_REQUEST' || item.type === 'FRIEND_ACCEPTED') {
      setActiveNavView('friends');
    }
  };

  return (
    <div className="flex h-full min-h-0 flex-col discord-chat-area">
      <header className="discord-topbar flex h-12 shrink-0 items-center gap-2 px-4">
        <Bell className="size-5 text-[var(--discord-text-muted)]" />
        <h1 className="text-sm font-semibold">Thông báo hệ thống</h1>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto p-3">
        {loading && (
          <p className="text-center text-sm text-[var(--discord-text-muted)]">Đang tải...</p>
        )}

        {!loading && sorted.length === 0 && (
          <p className="text-center text-sm text-[var(--discord-text-muted)]">
            Không có thông báo hệ thống
          </p>
        )}

        {!loading && sorted.length > 0 && (
          <ul className="space-y-2">
            {sorted.map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => void handleClick(item)}
                  className={`w-full rounded-lg p-3 text-left transition-colors hover:bg-[var(--discord-hover)] ${
                    item.isRead
                      ? 'bg-[var(--discord-panel)]'
                      : 'bg-[var(--discord-active)]'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-sm font-medium text-[var(--discord-text)]">
                      {item.title}
                    </span>
                    {item.createdAt && (
                      <span className="shrink-0 text-[10px] text-[var(--discord-text-faint)]">
                        {formatMessageTime(item.createdAt)}
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-xs text-[var(--discord-text-muted)]">{item.body}</p>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};
