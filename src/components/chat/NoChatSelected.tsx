import { MessageCircle } from 'lucide-react';

export const NoChatSelected = () => {
  return (
    <div className="flex w-full flex-1 items-center justify-center overflow-y-auto bg-[radial-gradient(circle_at_top,rgba(16,185,129,0.12),transparent_38%),linear-gradient(180deg,var(--discord-app),var(--discord-panel))] p-6 md:p-10">
      <div className="w-full max-w-xl rounded-[2rem] border border-[var(--discord-border)] bg-[var(--discord-panel)] px-5 py-7 text-left shadow-[0_20px_70px_rgba(15,23,42,0.08)] backdrop-blur-xl md:px-8 md:py-10">
        <div className="mb-5 flex size-16 items-center justify-center rounded-3xl bg-gradient-to-br from-green-600 to-teal-600 shadow-lg shadow-green-500/20">
          <MessageCircle className="size-9 text-white" />
        </div>
        <h1 className="text-3xl font-black tracking-tight text-[var(--discord-text)] md:text-4xl">MyChatApp</h1>
        <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-[var(--discord-text-muted)]">
          Chọn một cuộc trò chuyện từ thanh bên hoặc mở{' '}
          <span className="font-semibold text-[var(--discord-accent)]">Bạn bè</span> để bắt đầu nhắn
          tin.
        </p>
        <div className="mt-5 inline-flex items-center gap-2 rounded-full bg-[var(--discord-active)] px-3 py-1.5 text-sm text-[var(--discord-accent)]">
          <span className="size-2 rounded-full bg-green-500" />
          Giao diện mới, rõ chữ, dễ đọc hơn
        </div>
        <p className="mt-4 text-sm text-[var(--discord-text-faint)]">
          Gọi video sẽ được bổ sung trong phiên bản sau.
        </p>
      </div>
    </div>
  );
};
