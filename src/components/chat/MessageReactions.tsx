import { ChatMessage } from '@/types';
import { groupReactions, type ReactionType } from '@/utils/reactions';

interface MessageReactionsProps {
  message: ChatMessage;
  currentUserId: string;
  isOwn: boolean;
  onReact: (messageId: string, reactionType: ReactionType) => void;
  disabled?: boolean;
}

export const MessageReactions = ({
  message,
  currentUserId,
  isOwn,
  onReact,
  disabled = false,
}: MessageReactionsProps) => {
  const groups = groupReactions(message.reactions);
  const myReaction = message.reactions?.find((r) => String(r.userId) === String(currentUserId));

  const handlePick = (type: ReactionType) => {
    onReact(message.messageId, type);
  };

  if (groups.length === 0) {
    return null;
  }

  return (
    <div
      className={`message-reactions mt-1 flex flex-wrap items-center gap-1 ${
        isOwn ? 'justify-end' : 'justify-start'
      }`}
    >
      {groups.map((g) => {
        const active = myReaction?.reactionType === g.type;
        return (
          <button
            key={g.type}
            type="button"
            disabled={disabled}
            onClick={() => handlePick(g.type as ReactionType)}
            className={`message-reaction-chip inline-flex items-center gap-0.5 rounded-full border px-2 py-0.5 text-xs transition ${
              active
                ? 'border-[var(--discord-accent)] bg-[color-mix(in_srgb,var(--discord-accent)_12%,white)]'
                : 'border-[var(--message-reaction-border)] bg-[var(--message-reaction-bg)] hover:bg-[var(--message-reaction-hover)]'
            }`}
            title={active ? 'Bỏ cảm xúc' : 'Thêm cảm xúc'}
          >
            <span>{g.emoji}</span>
            {g.count > 1 && <span className="font-medium text-[var(--discord-text-muted)]">{g.count}</span>}
          </button>
        );
      })}
    </div>
  );
};
