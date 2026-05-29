import { Hash } from 'lucide-react';
import { useEffect, useState } from 'react';
import { getInitials } from '@/utils/chatUtils';
import { DEFAULT_AVATAR_URL, resolveAvatarUrl } from '@/utils/profileUtils';

type ChatAvatarSize = 'sm' | 'md' | 'lg';

const sizeClasses: Record<ChatAvatarSize, { box: string; text: string; dot: string; dotBorder: string }> =
  {
    sm: {
      box: 'size-8 text-xs',
      text: 'text-xs',
      dot: 'size-2.5',
      dotBorder: 'border-2',
    },
    md: {
      box: 'size-9 text-sm',
      text: 'text-sm',
      dot: 'size-3',
      dotBorder: 'border-2',
    },
    lg: {
      box: 'size-10 text-base',
      text: 'text-base',
      dot: 'size-3.5',
      dotBorder: 'border-[3px]',
    },
  };

interface ChatAvatarProps {
  name: string;
  avatarUrl?: string | null;
  size?: ChatAvatarSize;
  showOnlineBadge?: boolean;
  online?: boolean;
  isGroup?: boolean;
  ringClassName?: string;
}

export const ChatAvatar = ({
  name,
  avatarUrl,
  size = 'sm',
  showOnlineBadge = false,
  online = false,
  isGroup = false,
  ringClassName = 'border-[var(--discord-sidebar)]',
}: ChatAvatarProps) => {
  const s = sizeClasses[size];
  const [imageFailed, setImageFailed] = useState(false);
  const resolvedSrc = resolveAvatarUrl(avatarUrl);
  const showImage = !imageFailed;

  useEffect(() => {
    setImageFailed(false);
  }, [avatarUrl]);

  return (
    <div className={`relative shrink-0 ${s.box}`}>
      <div
        className={`flex size-full items-center justify-center overflow-hidden rounded-full bg-[var(--discord-accent)] font-bold text-white ${s.text}`}
      >
        {showImage ? (
          <img
            src={resolvedSrc}
            alt=""
            className="size-full object-cover"
            onError={() => {
              setImageFailed(true);
            }}
          />
        ) : (
          getInitials(name)
        )}
      </div>

      {showOnlineBadge && online && (
        <span
          className={`absolute bottom-0 right-0 ${s.dot} rounded-full ${s.dotBorder} ${ringClassName} bg-[var(--discord-success)]`}
          title="Trực tuyến"
          aria-hidden
        />
      )}

      {isGroup && (
        <span className="absolute -bottom-0.5 -right-0.5 flex size-3.5 items-center justify-center rounded-full bg-[var(--discord-sidebar)] text-[var(--discord-text)]">
          <Hash className="size-2" />
        </span>
      )}
    </div>
  );
};

export { resolveAvatarUrl };
