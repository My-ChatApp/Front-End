import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { Search, UserPlus, Users } from 'lucide-react';
import { useAuth } from '@/context';
import { useChat } from '@/context/ChatContext';
import { friendService } from '@/services/friendService';
import { userService, AppUser } from '@/services/userService';
import { FriendRequest } from '@/types';
import { ChatAvatar } from './ChatAvatar';
import { useUserProfile } from '@/hooks/useUserProfile';
import { ConfirmModal } from './ConfirmModal';

type Tab = 'friends' | 'incoming' | 'outgoing' | 'add';

const TAB_LABELS: Record<Tab, string> = {
  friends: 'Danh sách',
  incoming: 'Lời mời',
  outgoing: 'Đã gửi',
  add: 'Thêm bạn',
};

function formatUserLabel(u: AppUser): string {
  return (
    u.displayName?.trim() ||
    u.username ||
    u.email ||
    `${u.id.slice(0, 8)}…`
  );
}

function userLabel(userId: string, users: AppUser[]): string {
  const u = users.find((x) => x.id === userId);
  if (u) return formatUserLabel(u);
  return `${userId.slice(0, 8)}…`;
}

export const FriendsPanel = () => {
  const { user } = useAuth();
  const { setActiveNavView, openPrivateChat } = useChat();
  const [tab, setTab] = useState<Tab>('friends');
  const [friends, setFriends] = useState<FriendRequest[]>([]);
  const [incoming, setIncoming] = useState<FriendRequest[]>([]);
  const [outgoing, setOutgoing] = useState<FriendRequest[]>([]);
  const [users, setUsers] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionId, setActionId] = useState<string | null>(null);
  const [unfriendTargetId, setUnfriendTargetId] = useState<string | null>(null);
  const [sendError, setSendError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [searchResults, setSearchResults] = useState<AppUser[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const searchSeqRef = useRef(0);

  const userId = user?.id || '';

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(searchQuery.trim()), 300);
    return () => clearTimeout(t);
  }, [searchQuery]);

  useEffect(() => {
    if (tab !== 'add') return;
    const q = debouncedQuery;
    if (q.length < 2) {
      setSearchResults([]);
      setSearchLoading(false);
      return;
    }
    if (!userId) return;

    const seq = ++searchSeqRef.current;
    setSearchLoading(true);
    void userService.search(q, userId).then((res) => {
      if (searchSeqRef.current !== seq) return;
      setSearchResults(res.success && res.data ? res.data : []);
      setSearchLoading(false);
    });
  }, [debouncedQuery, tab, userId]);

  const loadFriends = useCallback(async () => {
    if (!userId) return;
    const res = await friendService.listFriends(userId);
    if (res.success && res.data) setFriends(res.data);
  }, [userId]);

  const loadIncoming = useCallback(async () => {
    if (!userId) return;
    const res = await friendService.listIncoming(userId);
    if (res.success && res.data) setIncoming(res.data);
  }, [userId]);

  const loadOutgoing = useCallback(async () => {
    if (!userId) return;
    const res = await friendService.listOutgoing(userId);
    if (res.success && res.data) setOutgoing(res.data);
  }, [userId]);

  const loadUsers = useCallback(async () => {
    const res = await userService.listActive();
    if (res.success && res.data) {
      setUsers(res.data.filter((u) => u.id !== userId));
    }
  }, [userId]);

  useEffect(() => {
    setLoading(true);
    Promise.all([loadFriends(), loadIncoming(), loadOutgoing(), loadUsers()]).finally(() =>
      setLoading(false)
    );
  }, [loadFriends, loadIncoming, loadOutgoing, loadUsers]);

  const handleAccept = async (req: FriendRequest) => {
    setActionId(req.id);
    try {
      await friendService.acceptRequest(req.id, userId);
      await Promise.all([loadFriends(), loadIncoming()]);
    } finally {
      setActionId(null);
    }
  };

  const handleReject = async (req: FriendRequest) => {
    setActionId(req.id);
    try {
      await friendService.rejectRequest(req.id, userId);
      await loadIncoming();
    } finally {
      setActionId(null);
    }
  };

  const handleCancelOutgoing = async (req: FriendRequest) => {
    setActionId(req.id);
    try {
      await friendService.cancelOutgoing(req.id, userId);
      await loadOutgoing();
    } finally {
      setActionId(null);
    }
  };

  const handleUnfriend = async (friendUserId: string) => {
    setActionId(friendUserId);
    try {
      await friendService.removeFriend(friendUserId, userId);
      await loadFriends();
    } finally {
      setActionId(null);
    }
  };

  const handleSendRequest = async (receiverId: string) => {
    if (actionId) return;
    setSendError(null);
    setActionId(receiverId);
    try {
      const res = await friendService.sendRequest({ senderId: userId, receiverId });
      if (!res.success) {
        setSendError(res.message || 'Gửi lời mời thất bại');
        return;
      }
      await loadOutgoing();
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Gửi lời mời thất bại';
      setSendError(msg);
    } finally {
      setActionId(null);
    }
  };

  const friendUserIds = new Set(
    friends.flatMap((f) => [f.senderId, f.receiverId]).filter((id) => id !== userId)
  );

  const pendingReceiverIds = new Set(outgoing.map((r) => r.receiverId));

  return (
    <div className="flex h-full min-h-0 flex-col discord-chat-area">
      <header className="discord-topbar flex h-12 shrink-0 items-center gap-2 px-4">
        <Users className="size-5 text-[var(--discord-text-muted)]" />
        <h1 className="text-sm font-semibold">Bạn bè</h1>
      </header>

      <div className="flex flex-wrap gap-1 border-b border-[var(--discord-border)] px-3 py-2">
        {(['friends', 'incoming', 'outgoing', 'add'] as Tab[]).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`rounded px-3 py-1 text-xs font-medium ${
              tab === t
                ? 'bg-[var(--discord-active)] text-[var(--discord-text)]'
                : 'text-[var(--discord-text-muted)] hover:bg-[var(--discord-hover)]'
            }`}
          >
            {TAB_LABELS[t]}
          </button>
        ))}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-3">
        {loading && (
          <p className="text-center text-sm text-[var(--discord-text-muted)]">Đang tải...</p>
        )}

        {!loading && tab === 'friends' && (
          <ul className="space-y-1">
            {friendUserIds.size === 0 ? (
              <p className="text-sm text-[var(--discord-text-muted)]">Chưa có bạn bè</p>
            ) : (
              Array.from(friendUserIds).map((fid) => (
                <FriendRow
                  key={fid}
                  userId={fid}
                  users={users}
                  actionId={actionId}
                  onMessage={() => {
                    openPrivateChat(fid);
                    setActiveNavView('chat');
                  }}
                  onUnfriend={() => setUnfriendTargetId(fid)}
                />
              ))
            )}
          </ul>
        )}

        <ConfirmModal
          open={Boolean(unfriendTargetId)}
          title="Hủy kết bạn"
          description="Bạn chắc chắn muốn hủy kết bạn với người này?"
          confirmLabel="Hủy kết bạn"
          danger
          onClose={() => setUnfriendTargetId(null)}
          onConfirm={async () => {
            if (!unfriendTargetId) return;
            await handleUnfriend(unfriendTargetId);
            setUnfriendTargetId(null);
          }}
        />

        {!loading && tab === 'incoming' && (
          <ul className="space-y-2">
            {incoming.length === 0 ? (
              <p className="text-sm text-[var(--discord-text-muted)]">Không có lời mời</p>
            ) : (
              incoming.map((req) => (
                <FriendRequestRow
                  key={req.id}
                  otherUserId={req.senderId}
                  users={users}
                >
                  <button
                    type="button"
                    disabled={actionId === req.id}
                    onClick={() => handleAccept(req)}
                    className="rounded bg-[var(--discord-success)] px-2 py-1 text-xs text-white"
                  >
                    Chấp nhận
                  </button>
                  <button
                    type="button"
                    disabled={actionId === req.id}
                    onClick={() => handleReject(req)}
                    className="rounded bg-[var(--discord-danger)] px-2 py-1 text-xs text-white"
                  >
                    Từ chối
                  </button>
                </FriendRequestRow>
              ))
            )}
          </ul>
        )}

        {!loading && tab === 'outgoing' && (
          <ul className="space-y-2">
            {outgoing.length === 0 ? (
              <p className="text-sm text-[var(--discord-text-muted)]">Chưa gửi lời mời nào</p>
            ) : (
              outgoing.map((req) => (
                <FriendRequestRow
                  key={req.id}
                  otherUserId={req.receiverId}
                  users={users}
                >
                  <button
                    type="button"
                    disabled={actionId === req.id}
                    onClick={() => handleCancelOutgoing(req)}
                    className="rounded bg-[var(--discord-danger)] px-2 py-1 text-xs text-white disabled:opacity-50"
                  >
                    Thu hồi
                  </button>
                </FriendRequestRow>
              ))
            )}
          </ul>
        )}

        {!loading && tab === 'add' && (
          <>
            {sendError && (
              <p className="mb-2 text-xs text-[var(--discord-danger)]">{sendError}</p>
            )}
            <div className="relative mb-3">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-[var(--discord-text-muted)]" />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Email, @username hoặc tên hiển thị"
                className="w-full rounded-md border border-[var(--discord-border)] bg-[var(--discord-input)] py-2 pl-9 pr-3 text-sm text-[var(--discord-text)] placeholder:text-[var(--discord-text-muted)] focus:border-[var(--discord-accent)] focus:outline-none"
              />
            </div>
            {debouncedQuery.length > 0 && debouncedQuery.length < 2 && (
              <p className="mb-2 text-xs text-[var(--discord-text-muted)]">
                Nhập ít nhất 2 ký tự
              </p>
            )}
            {searchLoading && (
              <p className="text-center text-sm text-[var(--discord-text-muted)]">Đang tìm...</p>
            )}
            {!searchLoading && debouncedQuery.length >= 2 && searchResults.length === 0 && (
              <p className="text-sm text-[var(--discord-text-muted)]">Không tìm thấy người dùng</p>
            )}
            {!searchLoading && debouncedQuery.length < 2 && (
              <p className="text-sm text-[var(--discord-text-muted)]">
                Tìm bạn bè bằng email, @username hoặc tên hiển thị
              </p>
            )}
            <ul className="space-y-1">
              {searchResults.map((u) => {
                const isFriend = friendUserIds.has(u.id);
                const isPending = pendingReceiverIds.has(u.id);
                const disabled = isFriend || isPending || actionId === u.id;
                const primary = formatUserLabel(u);
                const avatarName = u.displayName?.trim() || u.username || u.email || '?';

                return (
                  <li key={u.id} className="discord-list-item justify-between">
                    <div className="flex min-w-0 items-center gap-2">
                      <ChatAvatar name={avatarName} size="sm" />
                      <div className="min-w-0">
                        <span className="block truncate text-sm">{primary}</span>
                        {u.username && (
                          <span className="block truncate text-[10px] text-[var(--discord-text-muted)]">
                            @{u.username}
                          </span>
                        )}
                      </div>
                    </div>
                    {isFriend ? (
                      <span className="shrink-0 text-[10px] text-[var(--discord-text-muted)]">
                        Đã là bạn
                      </span>
                    ) : isPending ? (
                      <span className="shrink-0 text-[10px] text-[var(--discord-text-muted)]">
                        Đã gửi
                      </span>
                    ) : (
                      <button
                        type="button"
                        disabled={disabled}
                        onClick={() => handleSendRequest(u.id)}
                        className="discord-icon-button flex size-8 shrink-0 items-center justify-center text-[var(--discord-accent)] disabled:opacity-40"
                        title="Gửi lời mời"
                      >
                        <UserPlus className="size-4" />
                      </button>
                    )}
                  </li>
                );
              })}
            </ul>
          </>
        )}
      </div>
    </div>
  );
};

function FriendRequestRow({
  otherUserId,
  users,
  children,
}: {
  otherUserId: string;
  users: AppUser[];
  children: ReactNode;
}) {
  const cached = users.find((x) => x.id === otherUserId);
  const profile = useUserProfile(otherUserId);

  const fullName =
    cached?.displayName?.trim() || profile.fullName?.trim() || null;
  const username = cached?.username?.trim() || profile.username?.trim() || null;
  const email = cached?.email?.trim() || profile.email?.trim() || null;
  const avatarName = fullName || username || email || userLabel(otherUserId, users);

  return (
    <li className="flex items-center justify-between gap-2 rounded-lg bg-[var(--discord-panel)] p-3">
      <div className="flex min-w-0 flex-1 items-center gap-2">
        <ChatAvatar name={avatarName} avatarUrl={profile.avatarUrl} size="sm" />
        <div className="min-w-0">
          {fullName && (
            <span className="block truncate text-sm font-medium">{fullName}</span>
          )}
          {username && (
            <span className="block truncate text-[10px] text-[var(--discord-text-muted)]">
              @{username}
            </span>
          )}
          {email && (
            <span className="block truncate text-[10px] text-[var(--discord-text-faint)]">
              {email}
            </span>
          )}
          {!fullName && !username && !email && (
            <span className="block truncate text-sm">{avatarName}</span>
          )}
        </div>
      </div>
      <div className="flex shrink-0 gap-1">{children}</div>
    </li>
  );
}

function FriendRow({
  userId,
  users,
  actionId,
  onMessage,
  onUnfriend,
}: {
  userId: string;
  users: AppUser[];
  actionId: string | null;
  onMessage: () => void;
  onUnfriend: () => void;
}) {
  const label = userLabel(userId, users);
  const profile = useUserProfile(userId);

  return (
    <li className="discord-list-item justify-between">
      <div className="flex items-center gap-2">
        <ChatAvatar name={label} avatarUrl={profile.avatarUrl} size="sm" />
        <span className="text-sm">{label}</span>
      </div>
      <div className="flex gap-1">
        <button
          type="button"
          onClick={onMessage}
          className="rounded bg-[var(--discord-accent)] px-2 py-1 text-xs text-white"
        >
          Nhắn tin
        </button>
        <button
          type="button"
          disabled={actionId === userId}
          onClick={onUnfriend}
          className="rounded bg-[var(--discord-danger)] px-2 py-1 text-xs text-white disabled:opacity-50"
        >
          Hủy kết bạn
        </button>
      </div>
    </li>
  );
}
