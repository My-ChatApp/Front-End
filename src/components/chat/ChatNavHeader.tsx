import { useCallback, useEffect, useState } from 'react';
import { Bell, MessageCircle, User, Users } from 'lucide-react';
import { useAuth } from '@/context';
import { ChatNavView, useChat } from '@/context/ChatContext';
import { notificationService } from '@/services/notificationService';
import { sumConversationUnreadCount } from '@/utils/chatUtils';

interface ChatNavHeaderProps {
  onNavChange?: (view: ChatNavView) => void;
}

const NAV_ITEMS: { view: ChatNavView; label: string; icon: typeof Users }[] = [
  { view: 'chat', label: 'Chat', icon: MessageCircle },
  { view: 'friends', label: 'Friend', icon: Users },
  { view: 'notifications', label: 'Notification', icon: Bell },
  { view: 'me', label: 'Me', icon: User },
];

export const ChatNavHeader = ({ onNavChange }: ChatNavHeaderProps) => {
  const { user } = useAuth();
  const { activeNavView, setActiveNavView, conversations } = useChat();
  const [systemUnreadCount, setSystemUnreadCount] = useState(0);
  const chatUnreadCount = user?.id ? sumConversationUnreadCount(conversations, user.id) : 0;

  const loadUnreadCount = useCallback(async () => {
    if (!user?.id) return;
    try {
      const res = await notificationService.getUnreadCount(user.id);
      if (res.success && typeof res.data === 'number') {
        setSystemUnreadCount(res.data);
      }
    } catch {
      /* ignore badge errors */
    }
  }, [user?.id]);

  useEffect(() => {
    void loadUnreadCount();
    const interval = setInterval(loadUnreadCount, 60_000);
    return () => clearInterval(interval);
  }, [loadUnreadCount]);

  const handleNav = (view: ChatNavView) => {
    setActiveNavView(view);
    onNavChange?.(view);
    if (view === 'notifications' && user?.id) {
      setSystemUnreadCount(0);
      void notificationService.markAllRead(user.id).catch(() => undefined);
      return;
    }
    void loadUnreadCount();
  };

  useEffect(() => {
    if (activeNavView === 'notifications') {
      setSystemUnreadCount(0);
    }
  }, [activeNavView]);

  return (
    <header className="discord-nav-header flex h-16 shrink-0 items-center justify-between gap-4 px-4 md:px-5">
      <button
        type="button"
        onClick={() => handleNav('chat')}
        className="flex items-center gap-3 rounded-full border border-[var(--discord-border)] bg-[var(--discord-panel)] px-3 py-2 shadow-sm transition hover:-translate-y-0.5 hover:bg-[var(--discord-panel-strong)]"
      >
        <span className="flex size-9 items-center justify-center rounded-full bg-gradient-to-br from-green-600 to-teal-600 text-white shadow-md shadow-green-500/20">
          <MessageCircle className="size-4.5" />
        </span>
        <span className="flex flex-col items-start leading-tight">
          <span className="text-sm font-extrabold tracking-tight text-transparent bg-linear-to-r from-green-600 to-teal-600 bg-clip-text">
            MyChatApp
          </span>
          <span className="text-[11px] text-[var(--discord-text-muted)]">Realtime chat workspace</span>
        </span>
      </button>
      <nav className="flex items-center gap-2">
        {NAV_ITEMS.map(({ view, label, icon: Icon }) => {
          const isActive = activeNavView === view;
          return (
            <button
              key={view}
              type="button"
              onClick={() => handleNav(view)}
              className={`relative flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-all ${
                isActive
                  ? 'bg-[linear-gradient(135deg,rgba(22,163,74,0.16),rgba(15,118,110,0.12))] text-[var(--discord-text)] shadow-sm'
                  : 'text-[var(--discord-text-muted)] hover:bg-[var(--discord-panel-strong)] hover:text-[var(--discord-text)]'
              }`}
            >
              <Icon className="size-4.5" />
              <span className="hidden sm:inline">{label}</span>
              {view === 'chat' && chatUnreadCount > 0 && (
                <span className="absolute -right-1 -top-1 flex size-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white shadow">
                  {chatUnreadCount > 99 ? '99+' : chatUnreadCount}
                </span>
              )}
              {view === 'notifications' && systemUnreadCount > 0 && (
                <span className="absolute -right-1 -top-1 flex size-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white shadow">
                  {systemUnreadCount > 99 ? '99+' : systemUnreadCount}
                </span>
              )}
            </button>
          );
        })}
      </nav>
    </header>
  );
};
