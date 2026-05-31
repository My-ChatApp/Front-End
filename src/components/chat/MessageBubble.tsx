import { File, FileText, Film } from 'lucide-react';
import { ChatMessage } from '@/types';
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
  const time = formatMessageTime(message.createdAt);

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
      <div className={`max-w-[min(85%,520px)] rounded-2xl px-3 py-2 ${bubbleClass}`}>
        {!isOwn && senderLabel && (
          <div className="mb-0.5 text-xs font-semibold opacity-80">{senderLabel}</div>
        )}
        <MessageBody message={message} bodyClass={bodyClass} />
        <div className={`mt-1 flex items-center justify-end gap-1.5 ${metaClass}`}>
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
      <a href={url} target="_blank" rel="noopener noreferrer" className="block">
        <img
          src={url}
          alt={label}
          className="max-h-64 max-w-full rounded-lg object-contain"
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
        className="max-h-72 max-w-full rounded-lg bg-black/20"
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
      className={`flex items-center gap-3 rounded-lg border border-white/15 bg-black/10 px-3 py-2.5 transition-colors hover:bg-black/20 ${bodyClass}`}
    >
      <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-[var(--discord-hover)]">
        <Icon className="size-5 opacity-90" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-medium">{label}</span>
        <span className="text-xs opacity-70">Nhấn để tải / mở</span>
      </span>
    </a>
  );
}
