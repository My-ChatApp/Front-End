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
    <header className="discord-nav-header flex h-12 shrink-0 items-center justify-between px-4">
      <button
        type="button"
        onClick={() => handleNav('chat')}
        className="flex items-center gap-2 rounded-md px-2 py-1 transition-colors hover:bg-[var(--discord-hover)]"
      >
        <MessageCircle className="size-5 text-[var(--discord-accent)]" />
        <span className="text-sm font-bold text-[var(--discord-text)]">MyChatApp</span>
      </button>
      <nav className="flex items-center gap-1">
        {NAV_ITEMS.map(({ view, label, icon: Icon }) => {
          const isActive = activeNavView === view;
          return (
            <button
              key={view}
              type="button"
              onClick={() => handleNav(view)}
              className={`relative flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                isActive
                  ? 'bg-[var(--discord-active)] text-[var(--discord-text)]'
                  : 'text-[var(--discord-text-muted)] hover:bg-[var(--discord-hover)] hover:text-[var(--discord-text)]'
              }`}
            >
              <Icon className="size-4" />
              <span className="hidden sm:inline">{label}</span>
              {view === 'chat' && chatUnreadCount > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex size-4 items-center justify-center rounded-full bg-[var(--discord-danger)] text-[9px] font-bold text-white">
                  {chatUnreadCount > 99 ? '99+' : chatUnreadCount}
                </span>
              )}
              {view === 'notifications' && systemUnreadCount > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex size-4 items-center justify-center rounded-full bg-[var(--discord-danger)] text-[9px] font-bold text-white">
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
