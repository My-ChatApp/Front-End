import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { useAuth } from '@/context';
import { useChat } from '@/context/ChatContext';
import { userService, AppUser } from '@/services/userService';

export const CreateGroupModal = () => {
  const { user } = useAuth();
  const { showCreateGroup, setShowCreateGroup, createGroup } = useChat();
  const [title, setTitle] = useState('');
  const [users, setUsers] = useState<AppUser[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!showCreateGroup) return;
    userService.listActive().then((res) => {
      if (res.success && res.data) {
        setUsers(res.data.filter((u) => u.id !== user?.id));
      }
    });
  }, [showCreateGroup, user?.id]);

  if (!showCreateGroup) return null;

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selected.size === 0) return;
    setSubmitting(true);
    try {
      await createGroup(title, Array.from(selected));
      setShowCreateGroup(false);
      setTitle('');
      setSelected(new Set());
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="discord-modal-scrim fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="discord-modal-card w-full max-w-md p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-[var(--discord-text)]">Tạo nhóm</h2>
          <button
            type="button"
            onClick={() => setShowCreateGroup(false)}
            className="discord-icon-button flex size-8 items-center justify-center"
          >
            <X className="size-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="discord-section-title mb-1 block">Tên nhóm</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Nhập tên nhóm..."
              className="w-full rounded-md border border-[var(--discord-border)] bg-[var(--discord-panel-strong)] px-3 py-2 text-sm text-[var(--discord-text)] outline-none focus:border-[var(--discord-accent)]"
            />
          </div>

          <div>
            <label className="discord-section-title mb-2 block">Thành viên</label>
            <div className="max-h-48 overflow-y-auto space-y-1">
              {users.map((u) => (
                <label
                  key={u.id}
                  className="discord-list-item cursor-pointer gap-3"
                >
                  <input
                    type="checkbox"
                    checked={selected.has(u.id)}
                    onChange={() => toggle(u.id)}
                    className="size-4 accent-[var(--discord-accent)]"
                  />
                  <span className="text-sm">{u.username || u.email}</span>
                </label>
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting || selected.size === 0}
            className="w-full rounded-md bg-[var(--discord-accent)] py-2.5 text-sm font-semibold text-white disabled:opacity-50"
          >
            {submitting ? 'Đang tạo...' : 'Tạo nhóm'}
          </button>
        </form>
      </div>
    </div>
  );
};
