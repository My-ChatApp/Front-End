import { useEffect, useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { ChatNavView, useChat } from '@/context/ChatContext';
import {
  ChatLayout,
  ChatNavHeader,
  ChatPanel,
  ChatSidebar,
  CreateGroupModal,
} from '@/components/chat';
import { useThemeStore } from '@/store/useThemeStore';

type MobileView = 'list' | 'chat';

export const Chat = () => {
  const {
    selectedConversation,
    pendingPrivateRecipientId,
    activeNavView,
    clearError,
    error,
    setActiveNavView,
  } = useChat();
  const theme = useThemeStore((s) => s.theme);
  const [mobileView, setMobileView] = useState<MobileView>('list');
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 768px)');
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);

  const selectedConversationId = selectedConversation?.id;

  useEffect(() => {
    if (isMobile && selectedConversationId) {
      setMobileView('chat');
    }
  }, [isMobile, selectedConversationId]);

  const showMobileNavPanel = isMobile && activeNavView !== 'chat';

  const showMobileChat =
    isMobile &&
    activeNavView === 'chat' &&
    mobileView === 'chat' &&
    Boolean(selectedConversation || pendingPrivateRecipientId);

  const showMobileSidebar = isMobile && !showMobileNavPanel && !showMobileChat;

  const handleNavChange = (view: ChatNavView) => {
    if (view === 'chat') {
      setMobileView('list');
    } else if (isMobile) {
      setMobileView('chat');
    }
  };

  return (
    <div data-theme={theme} className="chat-app fixed inset-0 flex flex-col overflow-hidden">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-32 left-1/4 h-80 w-80 rounded-full bg-green-300/20 blur-[120px]" />
        <div className="absolute -bottom-36 right-1/4 h-96 w-96 rounded-full bg-teal-300/20 blur-[120px]" />
      </div>

      {error && (
        <div className="absolute left-4 right-4 top-4 z-[200] flex items-center justify-between gap-3 rounded-2xl border border-red-200 bg-white/92 px-4 py-3 text-sm text-red-700 shadow-xl backdrop-blur-md">
          <span className="truncate">{error}</span>
          <button
            type="button"
            onClick={clearError}
            className="shrink-0 rounded-full bg-red-50 px-3 py-1 text-xs font-semibold text-red-700 transition hover:bg-red-100"
          >
            Đóng
          </button>
        </div>
      )}

      <div className="relative z-10 flex min-h-0 flex-1 flex-col">
        <ChatNavHeader onNavChange={handleNavChange} />
        <CreateGroupModal />

        <div className="flex h-full min-h-0 flex-1">
          {isMobile ? (
            <>
              {showMobileSidebar && (
                <div className="flex h-full w-full flex-col overflow-hidden rounded-t-[1.75rem] bg-white/72 shadow-[0_24px_80px_rgba(15,23,42,0.10)] backdrop-blur-xl">
                  <ChatSidebar />
                </div>
              )}
              {showMobileChat && (
                <div className="flex h-full w-full min-w-0 flex-col overflow-hidden rounded-t-[1.75rem] bg-white/72 shadow-[0_24px_80px_rgba(15,23,42,0.10)] backdrop-blur-xl">
                  <MobileChatHeader onBack={() => setMobileView('list')} />
                  <ChatPanel />
                </div>
              )}
              {showMobileNavPanel && (
                <div className="flex h-full w-full min-w-0 flex-col overflow-hidden rounded-t-[1.75rem] bg-white/72 shadow-[0_24px_80px_rgba(15,23,42,0.10)] backdrop-blur-xl">
                  <MobileNavBackHeader
                    onBack={() => {
                      setActiveNavView('chat');
                      setMobileView('list');
                    }}
                  />
                  <ChatPanel />
                </div>
              )}
            </>
          ) : (
            <ChatLayout sidebar={<ChatSidebar />}>
              <ChatPanel />
            </ChatLayout>
          )}
        </div>
      </div>
    </div>
  );
};

function MobileChatHeader({ onBack }: { onBack: () => void }) {
  return (
    <div className="flex h-12 shrink-0 items-center border-b border-[var(--discord-border)] bg-white/65 px-3 backdrop-blur-md md:hidden">
      <button
        type="button"
        onClick={onBack}
        className="discord-icon-button flex size-9 items-center justify-center"
      >
        <ArrowLeft className="size-5" />
      </button>
      <span className="text-sm font-medium text-slate-600">Quay lại</span>
    </div>
  );
}

function MobileNavBackHeader({ onBack }: { onBack: () => void }) {
  return (
    <div className="flex h-12 shrink-0 items-center border-b border-[var(--discord-border)] bg-white/65 px-3 backdrop-blur-md md:hidden">
      <button
        type="button"
        onClick={onBack}
        className="discord-icon-button flex size-9 items-center justify-center"
      >
        <ArrowLeft className="size-5" />
      </button>
      <span className="text-sm font-medium text-slate-600">Quay lại tin nhắn</span>
    </div>
  );
}
