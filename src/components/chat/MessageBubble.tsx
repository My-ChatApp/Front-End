import { File, FileText, Film, Pencil, Send, Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import { ChatMessage } from '@/types';
import { useAuth } from '@/context/AuthContext';
import { useChat } from '@/context/ChatContext';
import { MessageReactions } from './MessageReactions';
import { ReactionPickerButton } from './ReactionPickerButton';
import type { ReactionType } from '@/utils/reactions';
import { ConfirmModal } from './ConfirmModal';
import {
  CHATBOT_SENDER_ID,
  formatMessageTime,
  parseFileMessageContent,
  canEditTextMessage,
  canDeleteMessage,
  resolveAllFileMedia,
  type ResolvedFileMedia,
} from '@/utils/chatUtils';

interface MessageBubbleProps {
  message: ChatMessage;
  isOwn: boolean;
  senderLabel?: string;
  highlighted?: boolean;
  showSeenReceipt?: boolean;
}

export const MessageBubble = ({
  message,
  isOwn,
  senderLabel,
  highlighted = false,
  showSeenReceipt = false,
}: MessageBubbleProps) => {
  const { user } = useAuth();
  const { dismissBotMessage, sendBotDraft, deleteMessage, toggleMessageReaction, startEditMessage } =
    useChat();
  const time = formatMessageTime(message.createdAt);
  const isBotMessage = message.senderId === CHATBOT_SENDER_ID;
  const isDeleted = Boolean(message.deleted);
  const canReact = !isBotMessage && !isDeleted && Boolean(user?.id);
  const canEdit = isOwn && canEditTextMessage(message, user?.id);
  const canDelete = isOwn && canDeleteMessage(message, user?.id);
  const [confirmMode, setConfirmMode] = useState<null | 'sendBot' | 'deleteMessage'>(null);
  const confirmText = useMemo(() => (message.content || '').trim(), [message.content]);

  const bubbleClass = isOwn ? 'message-bubble-sent' : 'message-bubble-received';
  const metaClass = isOwn ? 'message-meta-sent' : 'message-meta-received';
  const bodyClass = isOwn ? 'message-body-sent' : 'message-body-received';

  return (
    <div
      className={`message-row group flex px-4 py-0.5 ${isOwn ? 'justify-end' : 'justify-start'} ${
        highlighted ? 'message-search-highlight' : ''
      }`}
      data-message-id={message.messageId}
    >
      <div className={`relative max-w-[min(85%,560px)] rounded-[1.35rem] px-4 py-3 shadow-sm ring-1 ring-black/5 ${bubbleClass}`}>
        {(canReact || canEdit || canDelete) && (
          <div
            className={`absolute -top-2 flex gap-1 opacity-0 transition group-hover:opacity-100 focus-within:opacity-100 ${
              isOwn ? '-left-2 -translate-x-full' : '-right-2 translate-x-full'
            }`}
          >
            {canReact && user?.id && (
              <ReactionPickerButton
                isOwn={isOwn}
                onPick={(type: ReactionType) => toggleMessageReaction(message.messageId, type)}
              />
            )}
            {canEdit && (
              <button
                type="button"
                onClick={() => startEditMessage(message.messageId)}
                className="flex size-8 items-center justify-center rounded-full border border-[var(--discord-border)] bg-[var(--discord-panel-strong)] text-[var(--discord-text-muted)] shadow-sm hover:bg-[var(--discord-hover)] hover:text-[var(--discord-accent)]"
                title="Chỉnh sửa"
                aria-label="Chỉnh sửa tin nhắn"
              >
                <Pencil className="size-3.5" />
              </button>
            )}
            {canDelete && (
              <button
                type="button"
                onClick={() => setConfirmMode('deleteMessage')}
                className="flex size-8 items-center justify-center rounded-full border border-[var(--discord-border)] bg-[var(--discord-panel-strong)] text-[var(--discord-text-muted)] shadow-sm hover:bg-[var(--discord-hover)] hover:text-red-400"
                title="Xóa tin nhắn"
                aria-label="Xóa tin nhắn"
              >
                <Trash2 className="size-3.5" />
              </button>
            )}
          </div>
        )}
        {isBotMessage ? (
          <div className="mb-1 flex items-center justify-between gap-2">
            <div className="text-xs font-semibold text-[var(--discord-accent)]">ChatBot (chỉ bạn thấy)</div>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => {
                  if (!confirmText) return;
                  setConfirmMode('sendBot');
                }}
                className="flex items-center gap-1 rounded-full border border-[var(--discord-border)] bg-[var(--discord-panel-strong)] px-2 py-1 text-xs font-semibold text-[var(--discord-accent)] shadow-sm hover:bg-[var(--discord-hover)]"
                title="Gửi vào hội thoại"
                aria-label="Gửi vào hội thoại"
              >
                <Send className="size-3.5" />
                Gửi
              </button>
              <button
                type="button"
                onClick={() => navigator.clipboard?.writeText(message.content || '')}
                className="text-xs font-semibold text-[var(--discord-accent)] underline decoration-[color-mix(in_srgb,var(--discord-accent)_40%,white)] underline-offset-2"
              >
                Sao chép
              </button>
              <button
                type="button"
                onClick={() => dismissBotMessage(message.messageId)}
                className="flex size-7 items-center justify-center rounded-full text-[var(--discord-text-muted)] transition hover:bg-[var(--discord-hover)] hover:text-[var(--discord-accent)]"
                title="Xóa tin nhắn bot"
                aria-label="Xóa tin nhắn bot"
              >
                <Trash2 className="size-4" />
              </button>
            </div>
          </div>
        ) : (
          !isOwn && senderLabel && (
            <div className="mb-1 text-xs font-semibold text-[var(--discord-text-muted)]">{senderLabel}</div>
          )
        )}
        <MessageBody message={message} bodyClass={bodyClass} />
        <div className={`mt-2 flex items-center justify-end gap-1.5 ${metaClass}`}>
          {message.edited && (
            <span className="text-[10px] font-medium italic opacity-80">đã chỉnh sửa</span>
          )}
          {showSeenReceipt && (
            <span className="text-[10px] font-medium opacity-90">Đã xem</span>
          )}
          <span>{time}</span>
        </div>
        {canReact && user?.id && (
          <MessageReactions
            message={message}
            currentUserId={user.id}
            isOwn={isOwn}
            onReact={toggleMessageReaction}
          />
        )}
      </div>

      <ConfirmModal
        open={confirmMode === 'sendBot'}
        title="Gửi tin nhắn"
        description="Bạn có chắc muốn gửi nội dung này vào hội thoại hiện tại?"
        confirmLabel="Gửi"
        onClose={() => setConfirmMode(null)}
        onConfirm={() => {
          const text = confirmText;
          if (!text) {
            setConfirmMode(null);
            return;
          }
          void (async () => {
            const ok = await sendBotDraft(text);
            if (ok) dismissBotMessage(message.messageId);
            setConfirmMode(null);
          })();
        }}
      />

      <ConfirmModal
        open={confirmMode === 'deleteMessage'}
        title="Xóa tin nhắn"
        description="Xóa tin nhắn này? Mọi thành viên sẽ thấy tin đã bị xóa."
        confirmLabel="Xóa"
        danger
        onClose={() => setConfirmMode(null)}
        onConfirm={() => {
          void (async () => {
            await deleteMessage(message.messageId);
            setConfirmMode(null);
          })();
        }}
      />
    </div>
  );
};

function MessageBody({ message, bodyClass }: { message: ChatMessage; bodyClass: string }) {
  if (message.deleted) {
    return (
      <p className={`text-[15px] italic leading-relaxed opacity-60 ${bodyClass}`}>
        Tin nhắn đã bị xóa
      </p>
    );
  }

  const content = message.content || '';
  const isFileMessage =
    message.type === 'FILE' || Boolean(parseFileMessageContent(content));

  if (isFileMessage) {
    const mediaItems = resolveAllFileMedia(content, message.attachments);
    if (mediaItems.length > 0) {
      return (
        <div className="flex flex-col gap-2">
          {mediaItems.map((media, index) => (
            <FileMessageContent
              key={`${media.url}-${index}`}
              media={media}
              bodyClass={bodyClass}
            />
          ))}
        </div>
      );
    }
    return (
      <p className={`text-[15px] leading-relaxed opacity-80 ${bodyClass}`}>
        [Tệp đính kèm]
      </p>
    );
  }

  return (
    <p className={`whitespace-pre-wrap break-words text-[15px] leading-relaxed ${bodyClass}`}>
      {content}
    </p>
  );
}

function FileMessageContent({
  media,
  bodyClass,
}: {
  media: ResolvedFileMedia;
  bodyClass: string;
}) {
  const { kind, url, fileName } = media;
  const label = fileName || 'Tệp đính kèm';

  if (kind === 'image') {
    return (
      <a href={url} target="_blank" rel="noopener noreferrer" className="block overflow-hidden rounded-2xl">
        <img
          src={url}
          alt={label}
          className="max-h-64 max-w-full object-contain"
          loading="lazy"
        />
      </a>
    );
  }

  if (kind === 'video') {
    return (
      <video
        src={url}
        controls
        playsInline
        preload="metadata"
        className="max-h-72 max-w-full rounded-2xl bg-black/5"
      >
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className={`text-sm underline ${bodyClass}`}
        >
          Mở video
        </a>
      </video>
    );
  }

  if (kind === 'audio') {
    return (
      <div className="flex min-w-[220px] flex-col gap-1">
        <audio src={url} controls preload="metadata" className="w-full max-w-full" />
        <span className={`truncate text-xs opacity-80 ${bodyClass}`}>{label}</span>
      </div>
    );
  }

  const Icon = kind === 'document' ? FileText : kind === 'file' ? File : Film;
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      download={fileName}
      className={`flex items-center gap-3 rounded-2xl border border-[var(--discord-border)] bg-[var(--discord-panel-strong)] px-3 py-2.5 transition-colors hover:bg-[var(--discord-panel)] ${bodyClass}`}
    >
      <span className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-[var(--discord-active)] text-[var(--discord-accent)]">
        <Icon className="size-5 opacity-90" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-semibold text-[var(--discord-text)]">{label}</span>
        <span className="text-xs text-[var(--discord-text-muted)]">Nhấn để tải / mở</span>
      </span>
    </a>
  );
}
