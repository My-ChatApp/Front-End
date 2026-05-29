import { useEffect, useState } from 'react';
import { X } from 'lucide-react';

interface ConversationRenameModalProps {
  open: boolean;
  initialTitle: string;
  onClose: () => void;
  onSave: (title: string) => Promise<boolean>;
}

export const ConversationRenameModal = ({
  open,
  initialTitle,
  onClose,
  onSave,
}: ConversationRenameModalProps) => {
  const [title, setTitle] = useState(initialTitle);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) setTitle(initialTitle);
  }, [open, initialTitle]);

  if (!open) return null;

  return (
    <div
      className="discord-modal-scrim fixed inset-0 z-[220] flex items-center justify-center p-4"
      role="presentation"
      onClick={(e) => {
        if (e.target === e.currentTarget && !saving) onClose();
      }}
    >
      <div
        className="discord-modal-card w-full max-w-md p-4"
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-semibold text-[var(--discord-text)]">Đổi tên đoạn chat</h3>
          <button
            type="button"
            className="discord-icon-button flex size-8 items-center justify-center rounded-full"
            onClick={onClose}
            disabled={saving}
          >
            <X className="size-4" />
          </button>
        </div>
        <input
          className="discord-input-reset w-full rounded-lg border border-[var(--discord-border)] bg-black/15 px-3 py-2 text-sm"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          disabled={saving}
          placeholder="Tên nhóm"
          maxLength={120}
        />
        <div className="mt-4 flex justify-end gap-2">
          <button
            type="button"
            className="me-action-btn me-action-btn--secondary px-4 py-2"
            onClick={onClose}
            disabled={saving}
          >
            Hủy
          </button>
          <button
            type="button"
            className="me-action-btn me-action-btn--primary px-4 py-2"
            disabled={saving || !title.trim()}
            onClick={async () => {
              setSaving(true);
              const ok = await onSave(title.trim());
              setSaving(false);
              if (ok) onClose();
            }}
          >
            {saving ? 'Đang lưu...' : 'Lưu'}
          </button>
        </div>
      </div>
    </div>
  );
};
