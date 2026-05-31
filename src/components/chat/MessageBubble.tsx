import { File, FileText, Film, Trash2 } from 'lucide-react';
import { ChatMessage } from '@/types';
import { useChat } from '@/context/ChatContext';
import {
  formatMessageTime,
  parseFileMessageContent,
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
  const { dismissBotMessage } = useChat();
  const time = formatMessageTime(message.createdAt);
  const isBotMessage = message.senderId === '__chatbot__';

  const bubbleClass = isOwn ? 'message-bubble-sent' : 'message-bubble-received';
  const metaClass = isOwn ? 'message-meta-sent' : 'message-meta-received';
  const bodyClass = isOwn ? 'message-body-sent' : 'message-body-received';

  return (
    <div
      className={`message-row flex px-4 py-0.5 ${isOwn ? 'justify-end' : 'justify-start'} ${
        highlighted ? 'message-search-highlight' : ''
      }`}
      data-message-id={message.messageId}
    >
      <div className={`max-w-[min(85%,560px)] rounded-[1.35rem] px-4 py-3 shadow-sm ring-1 ring-black/5 ${bubbleClass}`}>
        {isBotMessage ? (
          <div className="mb-1 flex items-center justify-between gap-2">
            <div className="text-xs font-semibold text-[var(--discord-accent)]">ChatBot (chỉ bạn thấy)</div>
            <div className="flex items-center gap-1.5">
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
          {showSeenReceipt && (
            <span className="text-[10px] font-medium opacity-90">Đã xem</span>
          )}
          <span>{time}</span>
        </div>
      </div>
    </div>
  );
};

function MessageBody({ message, bodyClass }: { message: ChatMessage; bodyClass: string }) {
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
