import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import {
  ChevronDown,
  ChevronRight,
  File,
  FileText,
  Film,
  Image as ImageIcon,
  Loader2,
  Play,
  Search,
  X,
} from 'lucide-react';
import { useAuth } from '@/context';
import { ChatThemeScope } from './ChatThemeScope';
import { useChat } from '@/context/ChatContext';
import type { Conversation, ConversationMember } from '@/types';
import { formatMessageTime, getOtherMemberId } from '@/utils/chatUtils';
import { collectConversationAttachments } from '@/utils/conversationAttachments';
import { ChatAvatar } from './ChatAvatar';
import { ConversationDetailMemberRow } from './ConversationDetailMemberRow';
import { ConversationRenameModal } from './ConversationRenameModal';
import { ConversationAvatarModal } from './ConversationAvatarModal';
import { AddGroupMemberModal } from './AddGroupMemberModal';
import { ConfirmModal } from './ConfirmModal';
import { MessageSearchModal } from './MessageSearchModal';

type DetailSection = 'info' | 'members' | 'files' | null;

interface ConversationDetailDrawerProps {
  open: boolean;
  onClose: () => void;
  conversation: Conversation | null;
  pendingPrivateRecipientId: string | null;
  title: string;
}

function getMemberUserId(member: ConversationMember): string | undefined {
  const raw = member.userId ?? member.id?.userId;
  return raw != null && raw !== '' ? String(raw) : undefined;
}

function SectionToggle({
  label,
  expanded,
  onToggle,
}: {
  label: string;
  expanded: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      className="flex w-full items-center justify-between px-3 py-3 text-left transition hover:bg-[var(--discord-hover)]"
      onClick={onToggle}
    >
      <span className="text-sm font-medium text-[var(--discord-text)]">{label}</span>
      {expanded ? (
        <ChevronDown className="size-4 text-[var(--discord-text-muted)]" />
      ) : (
        <ChevronRight className="size-4 text-[var(--discord-text-muted)]" />
      )}
    </button>
  );
}

function ActionButton({
  children,
  onClick,
  disabled,
}: {
  children: ReactNode;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="w-full rounded-lg border-0 bg-[var(--discord-hover)] px-3 py-2 text-left text-sm text-[var(--discord-text)] transition hover:bg-[var(--discord-active)] disabled:cursor-not-allowed disabled:opacity-50"
    >
      {children}
    </button>
  );
}

export const ConversationDetailDrawer = ({
  open,
  onClose,
  conversation,
  pendingPrivateRecipientId,
  title,
}: ConversationDetailDrawerProps) => {
  const { user } = useAuth();
  const {
    messages,
    detailMembers,
    detailAttachmentMessages,
    isRefreshingDetail,
    isLoadingDetailFiles,
    refreshConversationDetail,
    updateGroupConversation,
    leaveConversation,
    dissolveGroup,
    addGroupMember,
    removeGroupMember,
    loadAllAttachmentsForDetail,
    getMyRoleInSelectedConversation,
  } = useChat();

  const isGroup = conversation?.type === 'GROUP';
  const myRole = getMyRoleInSelectedConversation();
  const canEdit = isGroup && myRole === 'OWNER';
  const canManageMembers = canEdit;

  const [expandedSection, setExpandedSection] = useState<DetailSection>(null);
  const [showSearch, setShowSearch] = useState(false);
  const [showRename, setShowRename] = useState(false);
  const [showAvatar, setShowAvatar] = useState(false);
  const [showAddMember, setShowAddMember] = useState(false);
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const [showDissolveConfirm, setShowDissolveConfirm] = useState(false);
  const [removeTargetId, setRemoveTargetId] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (!open || !conversation?.id) return;
    setExpandedSection(isGroup ? 'info' : 'files');
    void refreshConversationDetail(conversation.id);
  }, [open, conversation?.id, isGroup, refreshConversationDetail]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  useEffect(() => {
    document.body.classList.toggle('conversation-detail-open', open);
    return () => document.body.classList.remove('conversation-detail-open');
  }, [open]);

  const fileSource =
    detailAttachmentMessages.length > 0 ? detailAttachmentMessages : messages;
  const { mediaItems, fileItems } = useMemo(
    () => collectConversationAttachments(fileSource),
    [fileSource]
  );

  const members = useMemo(() => {
    const list =
      detailMembers.length > 0 ? detailMembers : conversation?.members ?? [];
    return list
      .map((m) => {
        const userId = getMemberUserId(m);
        if (!userId) return null;
        return { userId, role: m.role };
      })
      .filter((m): m is { userId: string; role: ConversationMember['role'] } => m != null)
      .sort((a, b) => {
        if (a.role === 'OWNER' && b.role !== 'OWNER') return -1;
        if (b.role === 'OWNER' && a.role !== 'OWNER') return 1;
        return a.userId.localeCompare(b.userId);
      });
  }, [detailMembers, conversation?.members]);

  const peerId =
    pendingPrivateRecipientId ||
    (conversation && user?.id ? getOtherMemberId(conversation, user.id) : undefined);

  const createdLabel = conversation?.createdAt
    ? new Date(conversation.createdAt).toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      })
    : null;

  const existingMemberIds = members.map((m) => m.userId);

  const handleExpandFiles = () => {
    const next = expandedSection === 'files' ? null : 'files';
    setExpandedSection(next);
    if (next === 'files' && conversation?.id) {
      void loadAllAttachmentsForDetail();
    }
  };

  if (!open || typeof document === 'undefined') return null;

  const toggle = (section: DetailSection) => {
    if (section === 'files') {
      handleExpandFiles();
      return;
    }
    setExpandedSection((cur) => (cur === section ? null : section));
  };

  return createPortal(
    <ChatThemeScope className="fixed inset-0 z-[200]">
      <div className="conversation-detail-root fixed inset-0 z-[200]" role="presentation">
        <button
          type="button"
          className="discord-modal-scrim absolute inset-0 md:pointer-events-auto"
          aria-label="Đóng chi tiết hội thoại"
          onClick={onClose}
        />

        <aside
          className="conversation-detail-drawer absolute right-0 top-0 flex h-full w-full max-w-md flex-col border-l border-[var(--discord-border)] bg-[var(--discord-sidebar)] shadow-2xl"
          role="dialog"
          aria-modal="true"
          aria-label={isGroup ? 'Tùy chỉnh đoạn chat' : 'Chi tiết đoạn chat'}
          onClick={(e) => e.stopPropagation()}
        >
          <header className="discord-topbar flex shrink-0 items-center justify-between gap-3 px-4 py-3">
            <div className="min-w-0">
              <div className="discord-section-title mb-1">
                {isGroup ? 'Thành viên' : 'Chi tiết'}
              </div>
              <h2 className="truncate text-base font-semibold text-[var(--discord-text)]">
                {isGroup ? 'Tùy chỉnh đoạn chat' : 'Chi tiết đoạn chat'}
              </h2>
            </div>
            <button
              type="button"
              className="discord-icon-button flex size-9 shrink-0 items-center justify-center rounded-full"
              onClick={onClose}
              aria-label="Đóng"
            >
              <X className="size-4" />
            </button>
          </header>

          <div className="flex min-h-0 flex-1 flex-col overflow-y-auto px-4 pb-6">
            {isRefreshingDetail ? (
              <div className="mb-3 flex items-center gap-2 text-xs text-[var(--discord-text-faint)]">
                <Loader2 className="size-3.5 animate-spin" />
                Đang cập nhật...
              </div>
            ) : null}

            <div className="mb-4 flex items-center gap-3 rounded-lg border border-[var(--discord-border)] bg-black/15 p-3">
              <ChatAvatar
                name={title}
                avatarUrl={isGroup ? conversation?.avatarUrl : undefined}
                size="lg"
                isGroup={isGroup}
              />
              <div className="min-w-0 flex-1">
                <div className="truncate text-base font-semibold text-[var(--discord-text)]">
                  {title}
                </div>
                <div className="mt-0.5 text-xs text-[var(--discord-text-faint)]">
                  {isGroup
                    ? `${members.length} thành viên`
                    : 'Tin nhắn trực tiếp'}
                </div>
                {createdLabel ? (
                  <div className="mt-1 text-xs text-[var(--discord-text-faint)]">
                    Tạo ngày {createdLabel}
                  </div>
                ) : null}
              </div>
            </div>

            <ActionButton onClick={() => setShowSearch(true)}>
              <span className="flex items-center gap-2">
                <Search className="size-4 shrink-0" />
                Tìm kiếm tin nhắn
              </span>
            </ActionButton>

            <div className="mt-3 space-y-3">
              {isGroup ? (
                <div className="overflow-hidden rounded-lg border border-[var(--discord-border)] bg-black/10">
                  <SectionToggle
                    label="Tùy chỉnh đoạn chat"
                    expanded={expandedSection === 'info'}
                    onToggle={() => toggle('info')}
                  />
                  {expandedSection === 'info' && (
                    <div className="space-y-2 border-t border-[var(--discord-border)] px-3 pb-3 pt-2">
                      {canEdit ? (
                        <>
                          <ActionButton onClick={() => setShowRename(true)}>
                            Đổi tên đoạn chat
                          </ActionButton>
                          <ActionButton onClick={() => setShowAvatar(true)}>
                            Thay đổi ảnh đại diện
                          </ActionButton>
                        </>
                      ) : (
                        <p className="text-xs text-[var(--discord-text-faint)]">
                          Chỉ chủ nhóm mới có thể chỉnh sửa.
                        </p>
                      )}
                    </div>
                  )}
                </div>
              ) : null}

              {isGroup ? (
                <div className="overflow-hidden rounded-lg border border-[var(--discord-border)] bg-black/10">
                  <SectionToggle
                    label="Thành viên trong đoạn chat"
                    expanded={expandedSection === 'members'}
                    onToggle={() => toggle('members')}
                  />
                  {expandedSection === 'members' && (
                    <div className="border-t border-[var(--discord-border)] px-3 pb-3 pt-2">
                      <div className="mb-2 text-xs text-[var(--discord-text-faint)]">
                        {members.length} thành viên
                      </div>
                      <div className="space-y-1">
                        {members.map((m) => (
                          <ConversationDetailMemberRow
                            key={m.userId}
                            userId={m.userId}
                            role={m.role}
                            canKick={canManageMembers}
                            kicking={actionLoading && removeTargetId === m.userId}
                            onKick={() => setRemoveTargetId(m.userId)}
                          />
                        ))}
                      </div>
                      {canManageMembers ? (
                        <div className="mt-3">
                          <ActionButton onClick={() => setShowAddMember(true)}>
                            + Thêm thành viên
                          </ActionButton>
                        </div>
                      ) : null}
                    </div>
                  )}
                </div>
              ) : conversation || pendingPrivateRecipientId ? (
                <div className="overflow-hidden rounded-lg border border-[var(--discord-border)] bg-black/10 px-3 py-3">
                  <div className="mb-2 text-sm font-medium text-[var(--discord-text)]">
                    Người tham gia
                  </div>
                  {user?.id ? (
                    <ConversationDetailMemberRow userId={user.id} role="MEMBER" />
                  ) : null}
                  {peerId ? (
                    <ConversationDetailMemberRow userId={peerId} role="MEMBER" />
                  ) : null}
                </div>
              ) : null}

              <div className="overflow-hidden rounded-lg border border-[var(--discord-border)] bg-black/10">
                <SectionToggle
                  label="File trong đoạn chat"
                  expanded={expandedSection === 'files'}
                  onToggle={() => toggle('files')}
                />
                {expandedSection === 'files' && (
                  <div className="space-y-4 border-t border-[var(--discord-border)] px-3 pb-3 pt-2">
                    {isLoadingDetailFiles ? (
                      <div className="flex items-center gap-2 text-xs text-[var(--discord-text-faint)]">
                        <Loader2 className="size-3.5 animate-spin" />
                        Đang tải toàn bộ lịch sử file...
                      </div>
                    ) : null}
                    <div>
                      <div className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-[var(--discord-text-faint)]">
                        <ImageIcon className="size-3.5" />
                        Ảnh / Video ({mediaItems.length})
                      </div>
                      {mediaItems.length === 0 ? (
                        <p className="text-xs text-[var(--discord-text-faint)]">
                          Chưa có ảnh hoặc video.
                        </p>
                      ) : (
                        <div className="grid grid-cols-3 gap-1.5">
                          {mediaItems.map((item) => (
                            <a
                              key={item.id}
                              href={item.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="group relative aspect-square overflow-hidden rounded-md border border-[var(--discord-border)] bg-black/20"
                              title={item.fileName}
                            >
                              {item.kind === 'video' ? (
                                <>
                                  <video
                                    src={item.url}
                                    className="size-full object-cover"
                                    muted
                                    preload="metadata"
                                  />
                                  <span className="absolute inset-0 flex items-center justify-center bg-black/35">
                                    <Play className="size-5 text-white" />
                                  </span>
                                </>
                              ) : (
                                <img
                                  src={item.url}
                                  alt={item.fileName}
                                  className="size-full object-cover transition group-hover:opacity-90"
                                  loading="lazy"
                                />
                              )}
                            </a>
                          ))}
                        </div>
                      )}
                    </div>
                    <div>
                      <div className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-[var(--discord-text-faint)]">
                        <File className="size-3.5" />
                        File ({fileItems.length})
                      </div>
                      {fileItems.length === 0 ? (
                        <p className="text-xs text-[var(--discord-text-faint)]">
                          Chưa có file đính kèm.
                        </p>
                      ) : (
                        <div className="space-y-1">
                          {fileItems.map((item) => (
                            <a
                              key={item.id}
                              href={item.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-2 rounded-md px-2 py-2 transition hover:bg-[var(--discord-hover)]"
                              title={item.fileName}
                            >
                              <span className="shrink-0 text-[var(--discord-text-muted)]">
                                {item.fileName.toLowerCase().endsWith('.pdf') ? (
                                  <FileText className="size-4" />
                                ) : /\.(mp4|webm|mov)/i.test(item.fileName) ? (
                                  <Film className="size-4" />
                                ) : (
                                  <File className="size-4" />
                                )}
                              </span>
                              <div className="min-w-0 flex-1">
                                <div className="truncate text-sm text-[var(--discord-text)]">
                                  {item.fileName}
                                </div>
                                {item.createdAt ? (
                                  <div className="text-xs text-[var(--discord-text-faint)]">
                                    {formatMessageTime(item.createdAt)}
                                  </div>
                                ) : null}
                              </div>
                            </a>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {isGroup ? (
                <div className="overflow-hidden rounded-lg border border-[var(--discord-danger)]/25 bg-[var(--discord-danger)]/5">
                  <div className="border-b border-[var(--discord-danger)]/15 px-3 py-2">
                    <div className="text-xs font-semibold uppercase tracking-wide text-[var(--discord-danger)]">
                      Thao tác nguy hiểm
                    </div>
                  </div>
                  <div className="flex flex-col gap-2 p-3">
                    <ActionButton onClick={() => setShowLeaveConfirm(true)}>
                      Thoát khỏi đoạn chat
                    </ActionButton>
                    {canEdit ? (
                      <button
                        type="button"
                        className="me-action-btn me-action-btn--danger w-full justify-start px-3 py-2 text-left text-sm"
                        onClick={() => setShowDissolveConfirm(true)}
                      >
                        Giải tán nhóm
                      </button>
                    ) : null}
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </aside>
      </div>

      <MessageSearchModal
        open={showSearch}
        onClose={() => setShowSearch(false)}
        onJumpComplete={onClose}
      />

      {conversation ? (
        <>
          <ConversationRenameModal
            open={showRename}
            initialTitle={conversation.title || title}
            onClose={() => setShowRename(false)}
            onSave={(t) => updateGroupConversation({ title: t })}
          />
          <ConversationAvatarModal
            open={showAvatar}
            groupTitle={title}
            currentAvatarUrl={conversation.avatarUrl}
            onClose={() => setShowAvatar(false)}
            onSave={(avatarUrl) => updateGroupConversation({ avatarUrl })}
          />
          <AddGroupMemberModal
            open={showAddMember}
            existingMemberIds={existingMemberIds}
            onClose={() => setShowAddMember(false)}
            onAdd={addGroupMember}
          />
        </>
      ) : null}

      <ConfirmModal
        open={showLeaveConfirm}
        title="Thoát khỏi đoạn chat"
        description="Bạn sẽ không còn nhận tin nhắn từ nhóm này."
        confirmLabel="Thoát nhóm"
        loading={actionLoading}
        onClose={() => setShowLeaveConfirm(false)}
        onConfirm={async () => {
          setActionLoading(true);
          const ok = await leaveConversation();
          setActionLoading(false);
          if (ok) {
            setShowLeaveConfirm(false);
            onClose();
          }
        }}
      />

      <ConfirmModal
        open={showDissolveConfirm}
        title="Giải tán nhóm"
        description="Giải tán nhóm sẽ xóa hội thoại cho tất cả thành viên. Hành động này không thể hoàn tác."
        confirmLabel="Giải tán nhóm"
        loading={actionLoading}
        danger
        onClose={() => setShowDissolveConfirm(false)}
        onConfirm={async () => {
          setActionLoading(true);
          const ok = await dissolveGroup();
          setActionLoading(false);
          if (ok) {
            setShowDissolveConfirm(false);
            onClose();
          }
        }}
      />

      <ConfirmModal
        open={Boolean(removeTargetId)}
        title="Xóa khỏi nhóm"
        description="Bạn có chắc muốn xóa thành viên này khỏi nhóm?"
        confirmLabel="Xóa"
        loading={actionLoading}
        danger
        onClose={() => setRemoveTargetId(null)}
        onConfirm={async () => {
          if (!removeTargetId) return;
          setActionLoading(true);
          const ok = await removeGroupMember(removeTargetId);
          setActionLoading(false);
          if (ok) setRemoveTargetId(null);
        }}
      />
    </ChatThemeScope>,
    document.body
  );
};
