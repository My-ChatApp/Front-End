import { ChangeEvent, useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { ChatAvatar } from './ChatAvatar';
import { uploadFileViaPresign } from '@/services/uploadMedia';

interface ConversationAvatarModalProps {
  open: boolean;
  groupTitle: string;
  currentAvatarUrl?: string | null;
  onClose: () => void;
  onSave: (avatarUrl: string) => Promise<boolean>;
}

export const ConversationAvatarModal = ({
  open,
  groupTitle,
  currentAvatarUrl,
  onClose,
  onSave,
}: ConversationAvatarModalProps) => {
  const [previewUrl, setPreviewUrl] = useState(currentAvatarUrl || '');
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) setPreviewUrl(currentAvatarUrl || '');
  }, [open, currentAvatarUrl]);

  if (!open) return null;

  const handleFile = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const { publicUrl } = await uploadFileViaPresign(file, 'avatar');
      setPreviewUrl(publicUrl);
    } catch {
      // error surfaced by parent context if save fails
    } finally {
      setUploading(false);
    }
  };

  return (
    <div
      className="discord-modal-scrim fixed inset-0 z-[220] flex items-center justify-center p-4"
      role="presentation"
      onClick={(e) => {
        if (e.target === e.currentTarget && !saving && !uploading) onClose();
      }}
    >
      <div
        className="discord-modal-card w-full max-w-md p-4"
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-semibold text-[var(--discord-text)]">Thay đổi ảnh đại diện</h3>
          <button
            type="button"
            className="discord-icon-button flex size-8 items-center justify-center rounded-full"
            onClick={onClose}
            disabled={saving || uploading}
          >
            <X className="size-4" />
          </button>
        </div>
        <div className="mb-3 flex items-center gap-3">
          <ChatAvatar name={groupTitle} avatarUrl={previewUrl} size="lg" isGroup />
          <p className="text-xs text-[var(--discord-text-faint)]">
            Ảnh sẽ được upload qua presigned URL.
          </p>
        </div>
        <input
          type="file"
          accept="image/*"
          className="w-full text-sm text-[var(--discord-text-muted)]"
          disabled={uploading || saving}
          onChange={handleFile}
        />
        <div className="mt-4 flex justify-end gap-2">
          <button
            type="button"
            className="me-action-btn me-action-btn--secondary px-4 py-2"
            onClick={onClose}
            disabled={saving || uploading}
          >
            Hủy
          </button>
          <button
            type="button"
            className="me-action-btn me-action-btn--primary px-4 py-2"
            disabled={saving || uploading || !previewUrl.trim()}
            onClick={async () => {
              setSaving(true);
              const ok = await onSave(previewUrl.trim());
              setSaving(false);
              if (ok) onClose();
            }}
          >
            {uploading ? 'Đang tải ảnh...' : saving ? 'Đang lưu...' : 'Lưu'}
          </button>
        </div>
      </div>
    </div>
  );
};
