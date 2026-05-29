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
