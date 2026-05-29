import { useCallback, useEffect, useMemo, useState } from 'react';
import { X } from 'lucide-react';
import { useAuth } from '@/context';
import { friendService } from '@/services/friendService';
import { userService, AppUser } from '@/services/userService';
import { FriendRequest } from '@/types';
import { ChatAvatar } from './ChatAvatar';
import { useUserProfile } from '@/hooks/useUserProfile';

interface AddGroupMemberModalProps {
  open: boolean;
  existingMemberIds: string[];
  onClose: () => void;
  onAdd: (userId: string) => Promise<boolean>;
}

function FriendPickRow({
  userId,
  label,
  onAdd,
  adding,
}: {
  userId: string;
  label: string;
  onAdd: () => void;
  adding: boolean;
}) {
  const profile = useUserProfile(userId);
  const name = profile.displayName || label;
  return (
    <button
      type="button"
      className="discord-list-item rounded-lg"
      disabled={adding}
      onClick={onAdd}
    >
      <ChatAvatar name={name} avatarUrl={profile.avatarUrl} size="sm" />
      <div className="min-w-0 flex-1 text-left">
        <div className="truncate text-sm text-[var(--discord-text)]">{name}</div>
      </div>
      <span className="text-xs font-semibold text-[var(--discord-accent)]">+ Thêm</span>
    </button>
  );
}

export const AddGroupMemberModal = ({
  open,
  existingMemberIds,
  onClose,
  onAdd,
}: AddGroupMemberModalProps) => {
  const { user } = useAuth();
  const userId = user?.id || '';
  const [friends, setFriends] = useState<FriendRequest[]>([]);
  const [users, setUsers] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [addingId, setAddingId] = useState<string | null>(null);

  const existing = useMemo(() => new Set(existingMemberIds.map(String)), [existingMemberIds]);

  const candidates = useMemo(() => {
    const ids = new Set<string>();
    const out: { userId: string; label: string }[] = [];

    for (const fr of friends) {
      const other =
        String(fr.senderId) === String(userId) ? fr.receiverId : fr.senderId;
      if (!other || existing.has(other) || ids.has(other)) continue;
      ids.add(other);
      const u = users.find((x) => x.id === other);
      out.push({
        userId: other,
        label: u?.username || u?.email || `${other.slice(0, 8)}…`,
      });
    }
    return out;
  }, [friends, users, userId, existing]);

  const load = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const [fr, us] = await Promise.all([
        friendService.listFriends(userId),
        userService.listActive(),
      ]);
      if (fr.success && fr.data) setFriends(fr.data);
      if (us.success && us.data) setUsers(us.data);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (open) void load();
  }, [open, load]);

  if (!open) return null;

  return (
    <div
      className="discord-modal-scrim fixed inset-0 z-[220] flex items-center justify-center p-4"
      role="presentation"
      onClick={(e) => {
        if (e.target === e.currentTarget && !addingId) onClose();
      }}
    >
      <div
        className="discord-modal-card flex max-h-[80vh] w-full max-w-md flex-col p-4"
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex shrink-0 items-center justify-between">
          <h3 className="font-semibold text-[var(--discord-text)]">Thêm thành viên</h3>
          <button
            type="button"
            className="discord-icon-button flex size-8 items-center justify-center rounded-full"
            onClick={onClose}
            disabled={Boolean(addingId)}
          >
            <X className="size-4" />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto">
          {loading ? (
            <p className="text-sm text-[var(--discord-text-faint)]">Đang tải...</p>
          ) : candidates.length === 0 ? (
            <p className="text-sm text-[var(--discord-text-faint)]">
              Không có bạn bè nào để thêm (hoặc đã là thành viên).
            </p>
          ) : (
            <div className="space-y-1">
              {candidates.map((c) => (
                <FriendPickRow
                  key={c.userId}
                  userId={c.userId}
                  label={c.label}
                  adding={addingId === c.userId}
                  onAdd={async () => {
                    setAddingId(c.userId);
                    const ok = await onAdd(c.userId);
                    setAddingId(null);
                    if (ok) onClose();
                  }}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
