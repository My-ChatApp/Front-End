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
  const [mobileView, setMobileView] = useState<MobileView>('list');
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 768px)');
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);

  useEffect(() => {
    if (isMobile && selectedConversation) {
      setMobileView('chat');
    }
  }, [isMobile, selectedConversation?.id]);

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
    <div className="chat-app fixed inset-0 flex flex-col overflow-hidden">
      {error && (
        <div className="absolute top-14 right-2 left-2 z-[200] flex items-center justify-between gap-2 rounded-lg bg-[var(--discord-danger)] px-3 py-2 text-sm text-white">
          <span className="truncate">{error}</span>
          <button type="button" onClick={clearError} className="shrink-0 underline">
            Đóng
          </button>
        </div>
      )}

      <ChatNavHeader onNavChange={handleNavChange} />
      <CreateGroupModal />

      <div className="flex h-full min-h-0 flex-1">
        {isMobile ? (
          <>
            {showMobileSidebar && (
              <div className="flex h-full w-full flex-col discord-sidebar">
                <ChatSidebar />
              </div>
            )}
            {showMobileChat && (
              <div className="flex h-full w-full min-w-0 flex-col">
                <MobileChatHeader onBack={() => setMobileView('list')} />
                <ChatPanel />
              </div>
            )}
            {showMobileNavPanel && (
              <div className="flex h-full w-full min-w-0 flex-col">
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
  );
};

function MobileChatHeader({ onBack }: { onBack: () => void }) {
  return (
    <div className="flex h-10 shrink-0 items-center border-b border-white/10 px-2 md:hidden">
      <button
        type="button"
        onClick={onBack}
        className="discord-icon-button flex size-9 items-center justify-center"
      >
        <ArrowLeft className="size-5" />
      </button>
      <span className="text-sm text-[var(--discord-text-muted)]">Quay lại</span>
    </div>
  );
}

function MobileNavBackHeader({ onBack }: { onBack: () => void }) {
  return (
    <div className="flex h-10 shrink-0 items-center border-b border-white/10 px-2 md:hidden">
      <button
        type="button"
        onClick={onBack}
        className="discord-icon-button flex size-9 items-center justify-center"
      >
        <ArrowLeft className="size-5" />
      </button>
      <span className="text-sm text-[var(--discord-text-muted)]">Quay lại tin nhắn</span>
    </div>
  );
}
