import { useCallback, useEffect, useMemo, useRef, useState, KeyboardEvent } from 'react';
import { AtSign, Bot, Paperclip, Send } from 'lucide-react';
import { useAuth } from '@/context';
import { useChat } from '@/context/ChatContext';
import { useUserDisplayName } from '@/hooks/useUserDisplayName';
import { useUserProfile } from '@/hooks/useUserProfile';
import { ChatAvatar } from './ChatAvatar';
import {
  getConversationTitle,
  getOtherMemberId,
  MAX_FILES_PER_MESSAGE,
} from '@/utils/chatUtils';
import type { ConversationMember } from '@/types';

const TYPING_IDLE_MS = 5000;
const TYPING_SEND_DEBOUNCE_MS = 300;

type MentionSuggestion = {
  id: string;
  kind: 'bot' | 'member';
  label: string;
  searchLabel: string;
  userId?: string;
  subtitle: string;
};

type BotPromptSuggestion = {
  id: string;
  label: string;
  subtitle: string;
};

const getMemberUserId = (member: ConversationMember) =>
  member.userId || member.id?.userId || '';

const getMentionRange = (value: string, caret: number) => {
  const beforeCaret = value.slice(0, caret);
  const match = beforeCaret.match(/(^|[\s(])@([^\s@]*)$/);
  if (!match) return null;
  const query = match[2] || '';
  return {
    query,
    start: caret - query.length - 1,
    end: caret,
  };
};

function MentionOptionRow({
  suggestion,
  onSelect,
}: {
  suggestion: MentionSuggestion;
  onSelect: (displayLabel: string) => void;
}) {
  const profile = useUserProfile(suggestion.userId);
  const title = suggestion.kind === 'bot' ? 'ChatBot' : profile.displayName || suggestion.label;

  return (
    <button
      type="button"
      onClick={() => onSelect(title)}
      className="flex items-center gap-3 rounded-2xl px-3 py-2.5 text-left transition hover:bg-[var(--discord-hover)]"
    >
      {suggestion.kind === 'bot' ? (
        <span className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-green-600 to-teal-600 text-white shadow-sm">
          <Bot className="size-5" />
        </span>
      ) : (
        <ChatAvatar name={title} avatarUrl={profile.avatarUrl} size="sm" online={profile.online} />
      )}
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-semibold text-[var(--discord-text)]">{title}</span>
        <span className="block truncate text-xs text-[var(--discord-text-muted)]">{suggestion.subtitle}</span>
      </span>
      <span className="rounded-full bg-[var(--discord-active)] px-2 py-1 text-[10px] font-semibold text-[var(--discord-accent)]">
        {suggestion.kind === 'bot' ? '@ChatBot' : '@member'}
      </span>
    </button>
  );
}

function BotPromptRow({
  prompt,
  onSelect,
}: {
  prompt: BotPromptSuggestion;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className="flex items-center gap-3 rounded-2xl px-3 py-2.5 text-left transition hover:bg-[var(--discord-hover)]"
    >
      <span className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-[var(--discord-active)] text-[var(--discord-accent)] shadow-sm">
        <Bot className="size-5" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-semibold text-[var(--discord-text)]">{prompt.label}</span>
        <span className="block truncate text-xs text-[var(--discord-text-muted)]">{prompt.subtitle}</span>
      </span>
      <span className="rounded-full bg-[var(--discord-active)] px-2 py-1 text-[10px] font-semibold text-[var(--discord-accent)]">
        Prompt
      </span>
    </button>
  );
}

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
  const [mentionRange, setMentionRange] = useState<{
    query: string;
    start: number;
    end: number;
  } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const typingTrueSentRef = useRef(false);
  const typingDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const typingIdleRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isPrivateChat = selectedConversation?.type === 'PRIVATE';
  const isGroupChat = selectedConversation?.type === 'GROUP';

  const otherId =
    pendingPrivateRecipientId ||
    (selectedConversation?.type === 'PRIVATE' && user?.id
      ? getOtherMemberId(selectedConversation, user.id)
      : undefined);
  const peerName = useUserDisplayName(otherId);
  const chatLabel = selectedConversation
    ? getConversationTitle(selectedConversation, user?.id || '', peerName)
    : peerName || 'hội thoại';

  const botPrompts = useMemo<BotPromptSuggestion[]>(
    () => [
      {
        id: 'bot-summary',
        label: 'Tóm tắt cuộc trò chuyện',
        subtitle: 'Rút gọn nội dung chính trong đoạn chat',
      },
      {
        id: 'bot-joke-short',
        label: 'Kể 1 câu chuyện cười ngắn',
        subtitle: 'Một câu vui nhanh, gọn và nhẹ nhàng',
      },
      {
        id: 'bot-motivation',
        label: 'Câu nói truyền động lực',
        subtitle: 'Một câu ngắn để tiếp thêm năng lượng',
      },
    ],
    []
  );

  const mentionSuggestions = useMemo<MentionSuggestion[]>(() => {
    const suggestions: MentionSuggestion[] = [
      {
        id: 'chatbot',
        kind: 'bot',
        label: '@ChatBot',
        searchLabel: 'chatbot',
        subtitle: 'Trợ lý trả lời nhanh trong cuộc chat',
      },
    ];

    if (isGroupChat) {
      const members = selectedConversation?.members ?? [];
      members.forEach((member) => {
        const memberId = getMemberUserId(member);
        if (!memberId || memberId === user?.id) return;

        const label = member.nickname?.trim() || memberId;
        suggestions.push({
          id: memberId,
          kind: 'member',
          label: `@${label}`,
          searchLabel: label.toLowerCase(),
          userId: memberId,
          subtitle: 'Thành viên trong nhóm',
        });
      });
    }

    return suggestions;
  }, [isGroupChat, selectedConversation?.members, user?.id]);

  const botPromptMode = useMemo(() => {
    if (mentionRange) return false;
    return /(^|[\s(])@ChatBot(?:\s*)$/i.test(text.trimEnd());
  }, [mentionRange, text]);

  const filteredSuggestions = useMemo(() => {
    const q = mentionRange?.query.trim().toLowerCase() || '';
    return mentionSuggestions.filter((item) => {
      if (!q) return true;
      return item.searchLabel.includes(q) || item.label.toLowerCase().includes(q);
    });
  }, [mentionRange?.query, mentionSuggestions]);

  const syncMentionState = useCallback((value: string, caret: number) => {
    const next = getMentionRange(value, caret);
    setMentionRange(next);
  }, []);

  const insertMention = useCallback(
    (suggestion: MentionSuggestion, displayLabel: string) => {
      if (!mentionRange) return;

      const token = suggestion.kind === 'bot' ? '@ChatBot ' : `@${displayLabel} `;
      const nextText = `${text.slice(0, mentionRange.start)}${token}${text.slice(mentionRange.end)}`;
      const caret = mentionRange.start + token.length;

      setText(nextText);
      setMentionRange(null);

      requestAnimationFrame(() => {
        const el = textareaRef.current;
        if (!el) return;
        el.focus();
        el.setSelectionRange(caret, caret);
      });
    },
    [mentionRange, text]
  );

  const insertBotPrompt = useCallback(
    (promptLabel: string) => {
      const botTokenMatch = text.match(/(^|[\s(])@ChatBot(?:\s*)$/i);
      if (!botTokenMatch) return;

      const prefix = botTokenMatch[1] || '';
      const start = botTokenMatch.index ?? 0;
      const nextText = `${text.slice(0, start)}${prefix}@ChatBot ${promptLabel} `;
      const caret = nextText.length;

      setText(nextText);
      setMentionRange(null);

      requestAnimationFrame(() => {
        const el = textareaRef.current;
        if (!el) return;
        el.focus();
        el.setSelectionRange(caret, caret);
      });
    },
    [text]
  );

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
    if (ok) {
      setText('');
      setMentionRange(null);
    }
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
    <div className="shrink-0 border-t border-[var(--discord-border)] bg-[var(--discord-panel)] px-4 py-4 backdrop-blur-md">
      <div className="relative discord-composer flex items-end gap-2 px-3 py-3">
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={isSending}
          className="discord-icon-button flex size-10 shrink-0 items-center justify-center"
          title={`Đính kèm file (tối đa ${MAX_FILES_PER_MESSAGE})`}
        >
          <Paperclip className="size-5" />
        </button>
        <input
          ref={fileRef}
          type="file"
          multiple
          aria-label="Tải file đính kèm"
          title="Tải file đính kèm"
          className="hidden"
          onChange={handleFile}
          accept="image/*,video/*,.pdf,.doc"
        />
        <textarea
          ref={textareaRef}
          rows={1}
          value={text}
          onChange={(e) => {
            const nextValue = e.target.value;
            syncMentionState(nextValue, e.currentTarget.selectionStart ?? nextValue.length);
            handleTextChange(nextValue);
          }}
          onKeyDown={handleKeyDown}
          onClick={(e) => syncMentionState(e.currentTarget.value, e.currentTarget.selectionStart ?? e.currentTarget.value.length)}
          onKeyUp={(e) => syncMentionState(e.currentTarget.value, e.currentTarget.selectionStart ?? e.currentTarget.value.length)}
          placeholder={`Nhắn tin với ${chatLabel}...`}
          disabled={isSending}
          className="discord-input-reset max-h-32 min-h-6 flex-1 resize-none py-2 text-[15px] text-[var(--discord-text)] placeholder:text-[var(--discord-placeholder)]"
        />
        {(botPromptMode || (mentionRange && filteredSuggestions.length > 0)) && (
          <div className="absolute bottom-14 left-3 z-30 w-[min(420px,calc(100%-1.5rem))] rounded-[1.25rem] border border-[var(--discord-border)] bg-[var(--discord-panel-strong)] p-2 shadow-[0_20px_60px_rgba(15,23,42,0.14)] backdrop-blur-xl">
            <div className="flex items-center justify-between px-2 py-1.5">
              <div className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-[var(--discord-accent)]">
                <AtSign className="size-3.5" />
                {botPromptMode ? 'Gợi ý bot' : 'Gợi ý @'}
              </div>
              <span className="text-[11px] text-[var(--discord-text-faint)]">
                {botPromptMode ? 'Chọn để điền prompt' : 'Enter để gửi, click để chèn'}
              </span>
            </div>
            <div className="max-h-64 overflow-y-auto p-1">
              {botPromptMode
                ? botPrompts.map((prompt) => (
                    <BotPromptRow
                      key={prompt.id}
                      prompt={prompt}
                      onSelect={() => insertBotPrompt(prompt.label)}
                    />
                  ))
                : filteredSuggestions.map((suggestion) => (
                    <MentionOptionRow
                      key={suggestion.id}
                      suggestion={suggestion}
                      onSelect={(displayLabel) => insertMention(suggestion, displayLabel)}
                    />
                  ))}
            </div>
          </div>
        )}
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
