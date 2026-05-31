import { useRef, useState, KeyboardEvent } from 'react';
import { Paperclip, Send } from 'lucide-react';
import { useAuth } from '@/context';
import { useChat } from '@/context/ChatContext';
import { useUserDisplayName } from '@/hooks/useUserDisplayName';
import {
  getConversationTitle,
  getOtherMemberId,
  MAX_FILES_PER_MESSAGE,
} from '@/utils/chatUtils';

export const MessageInput = () => {
  const { user } = useAuth();
  const {
    selectedConversation,
    pendingPrivateRecipientId,
    sendTextMessage,
    sendFileMessage,
    isSending,
  } = useChat();
  const [text, setText] = useState('');
  const [showPresets, setShowPresets] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const otherId =
    pendingPrivateRecipientId ||
    (selectedConversation?.type === 'PRIVATE' && user?.id
      ? getOtherMemberId(selectedConversation, user.id)
      : undefined);
  const peerName = useUserDisplayName(otherId);
  const chatLabel = selectedConversation
    ? getConversationTitle(selectedConversation, user?.id || '', peerName)
    : peerName || 'hội thoại';

  if (!selectedConversation && !pendingPrivateRecipientId) return null;

  const handleSend = async () => {
    const value = text.trim();
    if (!value || isSending) return;
    const ok = await sendTextMessage(value);
    if (ok) setText('');
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const presets = [
    'Tóm tắt đoạn hội thoại',
    'Soạn trả lời ngắn gọn',
    'Viết lịch sự, chuyên nghiệp',
    'Rút gọn nội dung thành 2 câu',
    'Đổi giọng văn thân thiện',
  ];

  const onSelectPreset = (preset: string) => {
    // replace text after @ChatBot with preset
    const idx = text.search(/@ChatBot\b/i);
    if (idx === -1) {
      setText((t) => `${t} @ChatBot ${preset}`);
    } else {
      const before = text.slice(0, idx);
      setText(`${before}@ChatBot ${preset}`);
    }
    setShowPresets(false);
  };

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    e.target.value = '';
    if (files.length === 0) return;
    await sendFileMessage(files);
  };

  return (
    <div className="shrink-0 border-t border-white/10 px-4 py-3">
      <div className="discord-composer flex items-end gap-2 px-3 py-2">
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={isSending}
          className="discord-icon-button flex size-9 shrink-0 items-center justify-center"
          title={`Đính kèm file (tối đa ${MAX_FILES_PER_MESSAGE})`}
        >
          <Paperclip className="size-5" />
        </button>
        <input
          ref={fileRef}
          type="file"
          multiple
          className="hidden"
          onChange={handleFile}
          accept="image/*,video/*,.pdf,.doc"
        />
        <textarea
          rows={1}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={`Nhắn tin với ${chatLabel}...`}
          disabled={isSending}
          className="discord-input-reset max-h-32 min-h-[24px] flex-1 resize-none py-2 text-[15px]"
        />
        {/* Suggestions when user types @ChatBot */}
        {text.match(/@ChatBot\b/i) && (
          <div className="absolute bottom-14 left-6 z-30 w-[320px] rounded-md border bg-black/60 p-2 text-sm">
            <div className="mb-1 text-xs text-[var(--discord-text-muted)]">Gợi ý cho @ChatBot:</div>
            <div className="flex flex-col gap-1">
              {presets.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => onSelectPreset(p)}
                  className="text-left text-sm underline"
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        )}
        <button
          type="button"
          onClick={handleSend}
          disabled={!text.trim() || isSending}
          className="discord-icon-button flex size-9 shrink-0 items-center justify-center text-[var(--discord-accent)] disabled:opacity-40"
          title="Gửi"
        >
          <Send className="size-5" />
        </button>
      </div>
    </div>
  );
};
