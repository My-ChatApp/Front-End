import { useState } from 'react';
import { SmilePlus } from 'lucide-react';
import { REACTION_OPTIONS, type ReactionType } from '@/utils/reactions';

interface ReactionPickerButtonProps {
  disabled?: boolean;
  isOwn: boolean;
  onPick: (reactionType: ReactionType) => void;
}

export const ReactionPickerButton = ({
  disabled = false,
  isOwn,
  onPick,
}: ReactionPickerButtonProps) => {
  const [pickerOpen, setPickerOpen] = useState(false);

  const handlePick = (type: ReactionType) => {
    setPickerOpen(false);
    onPick(type);
  };

  return (
    <div className="relative">
      <button
        type="button"
        disabled={disabled}
        onClick={() => setPickerOpen((v) => !v)}
        className="flex size-8 items-center justify-center rounded-full border border-[var(--discord-border)] bg-[var(--discord-panel-strong)] text-[var(--discord-text-muted)] shadow-sm hover:bg-[var(--discord-hover)] hover:text-[var(--discord-accent)]"
        title="Thêm cảm xúc"
        aria-label="Thêm cảm xúc"
        aria-expanded={pickerOpen}
      >
        <SmilePlus className="size-3.5" />
      </button>
      {pickerOpen && (
        <>
          <button
            type="button"
            className="fixed inset-0 z-40 cursor-default"
            aria-label="Đóng"
            onClick={() => setPickerOpen(false)}
          />
          <div
            className={`absolute z-50 flex gap-0.5 rounded-2xl border border-[var(--discord-border)] bg-[var(--discord-panel-strong)] p-1 shadow-lg ${
              isOwn ? 'right-0' : 'left-0'
            } top-full mt-1`}
          >
            {REACTION_OPTIONS.map((opt) => (
              <button
                key={opt.type}
                type="button"
                title={opt.label}
                disabled={disabled}
                onClick={() => handlePick(opt.type)}
                className="flex size-9 items-center justify-center rounded-xl text-lg transition hover:bg-[var(--discord-hover)] hover:scale-110"
              >
                {opt.emoji}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
};
