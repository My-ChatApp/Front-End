import { useCallback, useEffect, useRef, useState, KeyboardEvent } from 'react';
import { Paperclip, Send } from 'lucide-react';
import { useAuth } from '@/context';
import { useChat } from '@/context/ChatContext';
import { useUserDisplayName } from '@/hooks/useUserDisplayName';
import {
  getConversationTitle,
  getOtherMemberId,
  MAX_FILES_PER_MESSAGE,
} from '@/utils/chatUtils';

const TYPING_IDLE_MS = 5000;
const TYPING_SEND_DEBOUNCE_MS = 300;

export const MessageInput = () => {
  const { user } = useAuth();
  const {
    selectedConversation,
    pendingPrivateRecipientId,
    sendTextMessage,
    sendFileMessage,
    isSending,
    notifyTyping,
  } = useChat();
  const [text, setText] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);
  const typingTrueSentRef = useRef(false);
  const typingDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const typingIdleRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isPrivateChat = selectedConversation?.type === 'PRIVATE';

  const otherId =
    pendingPrivateRecipientId ||
    (selectedConversation?.type === 'PRIVATE' && user?.id
      ? getOtherMemberId(selectedConversation, user.id)
      : undefined);
  const peerName = useUserDisplayName(otherId);
  const chatLabel = selectedConversation
    ? getConversationTitle(selectedConversation, user?.id || '', peerName)
    : peerName || 'hội thoại';

  const stopTyping = useCallback(() => {
    if (typingDebounceRef.current) clearTimeout(typingDebounceRef.current);
    typingDebounceRef.current = null;
    if (typingIdleRef.current) clearTimeout(typingIdleRef.current);
    typingIdleRef.current = null;
    if (typingTrueSentRef.current) {
      typingTrueSentRef.current = false;
      notifyTyping(false);
    }
  }, [notifyTyping]);

  const scheduleTypingIdle = useCallback(() => {
    if (typingIdleRef.current) clearTimeout(typingIdleRef.current);
    typingIdleRef.current = setTimeout(() => {
      typingIdleRef.current = null;
      stopTyping();
    }, TYPING_IDLE_MS);
  }, [stopTyping]);

  useEffect(() => {
    return () => stopTyping();
  }, [selectedConversation?.id, stopTyping]);

  if (!selectedConversation && !pendingPrivateRecipientId) return null;

  const handleTextChange = (value: string) => {
    setText(value);
    if (!isPrivateChat) return;
    if (!value.trim()) {
      stopTyping();
      return;
    }
    scheduleTypingIdle();
    if (typingTrueSentRef.current) return;
    if (typingDebounceRef.current) clearTimeout(typingDebounceRef.current);
    typingDebounceRef.current = setTimeout(() => {
      typingDebounceRef.current = null;
      typingTrueSentRef.current = true;
      notifyTyping(true);
    }, TYPING_SEND_DEBOUNCE_MS);
  };

  const handleSend = async () => {
    const value = text.trim();
    if (!value || isSending) return;
    stopTyping();
    const ok = await sendTextMessage(value);
    if (ok) setText('');
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      void handleSend();
    }
  };

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    e.target.value = '';
    if (files.length === 0) return;
    stopTyping();
    await sendFileMessage(files);
  };

  return (
    <div className="shrink-0 border-t border-[var(--discord-border)] px-4 py-3">
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
          onChange={(e) => handleTextChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={`Nhắn tin với ${chatLabel}...`}
          disabled={isSending}
          className="discord-input-reset max-h-32 min-h-[24px] flex-1 resize-none py-2 text-[15px]"
        />
        <button
          type="button"
          onClick={() => void handleSend()}
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
