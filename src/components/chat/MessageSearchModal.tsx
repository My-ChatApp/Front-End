import { useEffect, useRef, useState } from 'react';
import { Loader2, Search, X } from 'lucide-react';
import { useAuth } from '@/context';
import { useChat } from '@/context/ChatContext';
import { useUserProfile } from '@/hooks/useUserProfile';
import { formatMessageTime } from '@/utils/chatUtils';
import type { MessageSearchResult } from '@/types';

interface MessageSearchModalProps {
  open: boolean;
  onClose: () => void;
  onJumpComplete?: () => void;
}

function ResultRow({
  result,
  onClick,
}: {
  result: MessageSearchResult;
  onClick: () => void;
}) {
  const snippet = result.content?.trim() || '(Không có nội dung)';
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full flex-col gap-0.5 rounded-lg px-2 py-2 text-left transition hover:bg-[var(--discord-hover)]"
    >
      <span className="flex items-center justify-between gap-2">
        <span className="truncate text-sm font-medium text-[var(--discord-text)]">
          <SenderName senderId={result.senderId} />
        </span>
        {result.createdAt ? (
          <span className="shrink-0 text-[11px] text-[var(--discord-text-faint)]">
            {formatMessageTime(result.createdAt)}
          </span>
        ) : null}
      </span>
      <span className="line-clamp-2 text-xs text-[var(--discord-text-muted)]">{snippet}</span>
    </button>
  );
}

function SenderName({ senderId }: { senderId: string }) {
  const { user } = useAuth();
  const profile = useUserProfile(senderId);
  if (user?.id && String(user.id) === String(senderId)) return <>Bạn</>;
  return <>{profile.displayName || `${senderId.slice(0, 8)}…`}</>;
}

export const MessageSearchModal = ({ open, onClose, onJumpComplete }: MessageSearchModalProps) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const searchSeqRef = useRef(0);
  const { searchConversationMessages, jumpToMessage } = useChat();

  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [results, setResults] = useState<MessageSearchResult[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query.trim()), 300);
    return () => clearTimeout(t);
  }, [query]);

  useEffect(() => {
    if (!open) return;
    setQuery('');
    setDebouncedQuery('');
    setResults([]);
    const t = setTimeout(() => inputRef.current?.focus(), 0);
    return () => clearTimeout(t);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onEsc);
    return () => document.removeEventListener('keydown', onEsc);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;
    const q = debouncedQuery;
    if (q.length < 2) {
      setResults([]);
      setLoading(false);
      return;
    }

    const seq = ++searchSeqRef.current;
    setLoading(true);
    void searchConversationMessages(q).then((items) => {
      if (searchSeqRef.current !== seq) return;
      setResults(items);
      setLoading(false);
    });
  }, [debouncedQuery, open, searchConversationMessages]);

  if (!open) return null;

  return (
    <div
      className="discord-modal-scrim fixed inset-0 z-[230] flex items-start justify-center p-4 pt-16"
      role="presentation"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="discord-modal-card flex max-h-[70vh] w-full max-w-lg flex-col overflow-hidden"
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2 border-b border-[var(--discord-border)] p-3">
          <Search className="size-4 shrink-0 text-[var(--discord-text-muted)]" />
          <input
            ref={inputRef}
            className="discord-input-reset min-w-0 flex-1 text-sm"
            placeholder="Tìm trong đoạn chat (tối thiểu 2 ký tự)..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <button
            type="button"
            className="discord-icon-button flex size-8 items-center justify-center rounded-full"
            onClick={onClose}
            aria-label="Đóng"
          >
            <X className="size-4" />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto p-2">
          {debouncedQuery.length > 0 && debouncedQuery.length < 2 ? (
            <p className="px-2 py-3 text-sm text-[var(--discord-text-faint)]">
              Nhập ít nhất 2 ký tự.
            </p>
          ) : loading ? (
            <div className="flex items-center justify-center gap-2 py-8 text-sm text-[var(--discord-text-muted)]">
              <Loader2 className="size-4 animate-spin" />
              Đang tìm...
            </div>
          ) : debouncedQuery.length >= 2 && results.length === 0 ? (
            <p className="px-2 py-3 text-sm text-[var(--discord-text-faint)]">
              Không tìm thấy tin nhắn phù hợp.
            </p>
          ) : (
            results.map((r) => (
              <ResultRow
                key={r.messageId}
                result={r}
                onClick={async () => {
                  onClose();
                  await jumpToMessage(r.messageId);
                  onJumpComplete?.();
                }}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
};
