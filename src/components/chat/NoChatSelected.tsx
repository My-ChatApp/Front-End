import { MessageCircle } from 'lucide-react';

export const NoChatSelected = () => {
  return (
    <div className="flex w-full flex-1 items-center justify-center overflow-y-auto discord-chat-area p-6 md:p-10">
      <div className="w-full max-w-xl px-4 py-6 text-left md:px-8 md:py-10">
        <div className="mb-5 flex size-16 items-center justify-center rounded-2xl bg-[var(--discord-accent)] shadow-lg ring-2 ring-white/10">
          <MessageCircle className="size-9 text-white" />
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-white md:text-4xl">MyChatApp</h1>
        <p className="mt-3 text-[15px] leading-relaxed text-[var(--discord-text-muted)]">
          Chọn một cuộc trò chuyện từ thanh bên hoặc mở{' '}
          <span className="font-medium text-[var(--discord-text)]">Bạn bè</span> để bắt đầu nhắn
          tin.
        </p>
        <p className="mt-4 text-sm text-[var(--discord-text-faint)]">
          Gọi video sẽ được bổ sung trong phiên bản sau.
        </p>
      </div>
    </div>
  );
};
