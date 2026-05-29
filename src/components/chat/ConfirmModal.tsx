import { X } from 'lucide-react';

interface ConfirmModalProps {
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  onConfirm: () => void;
  onClose: () => void;
  loading?: boolean;
  danger?: boolean;
}

export const ConfirmModal = ({
  open,
  title,
  description,
  confirmLabel,
  onConfirm,
  onClose,
  loading = false,
  danger = false,
}: ConfirmModalProps) => {
  if (!open) return null;

  return (
    <div
      className="discord-modal-scrim fixed inset-0 z-[220] flex items-center justify-center p-4"
      role="presentation"
      onClick={(e) => {
        if (e.target === e.currentTarget && !loading) onClose();
      }}
    >
      <div
        className="discord-modal-card w-full max-w-md p-4"
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex items-center justify-between gap-3">
          <h3
            className={`font-semibold ${danger ? 'text-[var(--discord-danger)]' : 'text-[var(--discord-text)]'}`}
          >
            {title}
          </h3>
          <button
            type="button"
            className="discord-icon-button flex size-8 items-center justify-center rounded-full"
            onClick={onClose}
            disabled={loading}
            aria-label="Đóng"
          >
            <X className="size-4" />
          </button>
        </div>
        <p className="text-sm text-[var(--discord-text-muted)]">{description}</p>
        <div className="mt-4 flex justify-end gap-2">
          <button
            type="button"
            className="me-action-btn me-action-btn--secondary px-4 py-2"
            onClick={onClose}
            disabled={loading}
          >
            Hủy
          </button>
          <button
            type="button"
            className={`me-action-btn px-4 py-2 ${danger ? 'me-action-btn--danger' : 'me-action-btn--primary'}`}
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? 'Đang xử lý...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};
