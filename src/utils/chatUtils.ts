import type {
  ConversationMember,
  MessageAttachment,
  MessageType,
  NotificationItem,
  NotificationType,
} from '@/types';

export function formatMessageTime(iso?: string): string {
  if (!iso) return '';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  const now = new Date();
  const isToday =
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear();
  if (isToday) {
    return date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  }
  return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
}

export function getInitials(name?: string | null): string {
  if (!name?.trim()) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export type FileMediaKind = 'image' | 'video' | 'audio' | 'document' | 'file';

export const MAX_FILES_PER_MESSAGE = 5;

export type ResolvedFileMedia = { kind: FileMediaKind; url: string; fileName?: string };

/** Map MIME to backend attachment fileType (IMAGE | VIDEO | …). */
export function mimeTypeToFileType(mime: string): MessageAttachment['fileType'] {
  const lower = mime.toLowerCase().trim().split(';')[0].trim();
  if (lower.startsWith('image/')) return 'IMAGE';
  if (lower.startsWith('video/')) return 'VIDEO';
  if (lower.startsWith('audio/')) return 'AUDIO';
  if (
    lower === 'application/pdf' ||
    lower === 'application/msword' ||
    lower.includes('wordprocessingml') ||
    lower.includes('spreadsheetml') ||
    lower.includes('presentationml') ||
    lower.startsWith('text/')
  ) {
    return 'DOCUMENT';
  }
  return 'OTHER';
}

export interface ParsedFileMessageContent {
  url: string;
  mimeType?: string;
  fileName?: string;
}

const IMAGE_EXT = /\.(jpe?g|png|gif|webp|bmp|svg)(\?|#|$)/i;
const VIDEO_EXT = /\.(mp4|webm|mov|m4v|ogv)(\?|#|$)/i;
const AUDIO_EXT = /\.(mp3|m4a|wav|ogg|aac|flac)(\?|#|$)/i;
const DOC_EXT = /\.(pdf|doc|txt|xls|xlsx|ppt|pptx)(\?|#|$)/i;

function kindFromMime(mime?: string): FileMediaKind | undefined {
  if (!mime) return undefined;
  const m = mime.toLowerCase();
  if (m.startsWith('image/')) return 'image';
  if (m.startsWith('video/')) return 'video';
  if (m.startsWith('audio/')) return 'audio';
  if (m === 'application/pdf' || m.includes('word') || m.includes('document') || m === 'text/plain') {
    return 'document';
  }
  return undefined;
}

function kindFromUrl(url: string): FileMediaKind {
  if (IMAGE_EXT.test(url) || url.includes('image/')) return 'image';
  if (VIDEO_EXT.test(url)) return 'video';
  if (AUDIO_EXT.test(url)) return 'audio';
  if (DOC_EXT.test(url)) return 'document';
  return 'file';
}

/** Legacy helper — prefer resolveFileMediaKind */
export function isImageUrl(url: string): boolean {
  return kindFromUrl(url) === 'image';
}

export function isVideoUrl(url: string): boolean {
  return kindFromUrl(url) === 'video';
}

/** Plain URL or JSON { url, mimeType?, fileName? } from newer clients */
export function parseFileMessageContent(raw: string): ParsedFileMessageContent | null {
  const trimmed = raw?.trim();
  if (!trimmed) return null;

  if (trimmed.startsWith('{')) {
    try {
      const parsed = JSON.parse(trimmed) as {
        url?: string;
        mimeType?: string;
        mime?: string;
        fileName?: string;
        name?: string;
      };
      const url = parsed.url?.trim();
      if (url) {
        return {
          url,
          mimeType: parsed.mimeType || parsed.mime,
          fileName: parsed.fileName || parsed.name,
        };
      }
    } catch {
      // fall through
    }
  }

  if (/^https?:\/\//i.test(trimmed)) {
    return { url: trimmed };
  }

  return null;
}

export function resolveAttachmentMedia(attachment: MessageAttachment): ResolvedFileMedia | null {
  const url = attachment.url?.trim();
  if (!url) return null;

  const mimeType = attachment.mimeType;
  const fileName = attachment.fileName || getFileNameFromUrl(url);

  const fromAttachmentType = attachment.fileType?.toLowerCase();
  let kind: FileMediaKind | undefined;
  if (fromAttachmentType === 'image') kind = 'image';
  else if (fromAttachmentType === 'video') kind = 'video';
  else if (fromAttachmentType === 'audio') kind = 'audio';
  else if (fromAttachmentType === 'document') kind = 'document';

  kind = kind || kindFromMime(mimeType) || kindFromUrl(url);

  return { kind, url, fileName };
}

export function resolveAllFileMedia(
  content: string,
  attachments?: MessageAttachment[]
): ResolvedFileMedia[] {
  if (attachments && attachments.length > 0) {
    return attachments
      .map(resolveAttachmentMedia)
      .filter((media): media is ResolvedFileMedia => media !== null);
  }

  const parsed = parseFileMessageContent(content);
  if (parsed?.url) {
    const mimeType = parsed.mimeType;
    const fileName = parsed.fileName || getFileNameFromUrl(parsed.url);
    const kind = kindFromMime(mimeType) || kindFromUrl(parsed.url);
    return [{ kind, url: parsed.url, fileName }];
  }

  return [];
}

export function resolveFileMediaKind(
  content: string,
  attachments?: MessageAttachment[]
): ResolvedFileMedia | null {
  return resolveAllFileMedia(content, attachments)[0] ?? null;
}

export function getFileNameFromUrl(url: string): string {
  try {
    const path = new URL(url).pathname;
    const segment = path.split('/').filter(Boolean).pop();
    if (segment) return decodeURIComponent(segment);
  } catch {
    const noQuery = url.split('?')[0];
    const segment = noQuery.split('/').filter(Boolean).pop();
    if (segment) return decodeURIComponent(segment);
  }
  return 'Tệp đính kèm';
}

export function getSenderPreviewLabel(
  senderId: string | undefined,
  currentUserId: string,
  displayName: string | null
): string {
  if (!senderId) return 'Ai đó';
  if (String(senderId) === String(currentUserId)) return 'Bạn';
  return displayName?.trim() || 'Ai đó';
}

export function getFileAttachmentPreviewNoun(content: string): string {
  const trimmed = content?.trim() || '';
  if (!trimmed || trimmed === '[File]') return 'tệp đính kèm';
  if (trimmed === 'Hình ảnh') return 'ảnh';
  if (trimmed === 'Video') return 'video';

  const media = resolveFileMediaKind(trimmed);
  if (!media) return 'tệp đính kèm';
  switch (media.kind) {
    case 'image':
      return 'ảnh';
    case 'video':
      return 'video';
    default:
      return 'tệp đính kèm';
  }
}

function isProbablyFileMessage(preview: string | undefined, type?: MessageType): boolean {
  if (type === 'FILE') return true;
  if (type === 'TEXT') return false;
  const trimmed = preview?.trim() || '';
  if (!trimmed) return false;
  if (trimmed === '[File]') return true;
  if (/^\[(Ảnh|Video|Audio|Tài liệu|File)\]/i.test(trimmed)) return true;
  if (['Hình ảnh', 'Video', 'Âm thanh', 'Tài liệu', 'Tệp đính kèm'].includes(trimmed)) return true;
  return Boolean(parseFileMessageContent(trimmed));
}

export function formatConversationLastMessagePreview(
  conv: {
    lastMessagePreview?: string;
    lastMessageType?: MessageType;
    lastMessageSenderId?: string;
    lastMessageAt?: string;
  },
  currentUserId: string,
  senderDisplayName: string | null
): string {
  const hasMessage = Boolean(conv.lastMessageAt || conv.lastMessagePreview?.trim());
  if (!hasMessage) return 'Chưa có tin nhắn';

  const sender = getSenderPreviewLabel(
    conv.lastMessageSenderId,
    currentUserId,
    senderDisplayName
  );
  const preview = conv.lastMessagePreview?.trim() || '';

  if (isProbablyFileMessage(preview, conv.lastMessageType)) {
    return `${sender} đã gửi ${getFileAttachmentPreviewNoun(preview)}`;
  }

  if (!preview) return 'Chưa có tin nhắn';
  return `${sender}: ${preview}`;
}

export function formatFileMessagePreview(content: string, type?: string): string {
  if (type && type !== 'FILE' && type !== 'TEXT') {
    if (type === 'IMAGE') return 'Hình ảnh';
    if (type === 'VIDEO') return 'Video';
  }
  const media = resolveFileMediaKind(content);
  if (!media) return content;
  switch (media.kind) {
    case 'image':
      return 'Hình ảnh';
    case 'video':
      return 'Video';
    case 'audio':
      return 'Âm thanh';
    case 'document':
      return media.fileName || 'Tài liệu';
    default:
      return media.fileName || 'Tệp đính kèm';
  }
}

const GENERIC_PRIVATE_TITLE = 'Tin nhắn trực tiếp';

function normalizeUserId(id?: string | null): string | undefined {
  if (id == null || id === '') return undefined;
  return String(id).trim().toLowerCase();
}

function pickOtherUserId(candidate: unknown, currentUserId: string): string | undefined {
  if (candidate == null || candidate === '') return undefined;
  const value = String(candidate);
  if (normalizeUserId(value) === normalizeUserId(currentUserId)) return undefined;
  return value;
}

export function getOtherMemberId(
  conv: {
    members?: { userId?: string; id?: { userId?: string } }[];
    lastMessageSenderId?: string;
    createdBy?: string;
  },
  currentUserId: string
): string | undefined {
  for (const m of conv.members ?? []) {
    const raw = m.userId ?? m.id?.userId;
    const other = pickOtherUserId(raw, currentUserId);
    if (other) return other;
  }

  const fromSender = pickOtherUserId(conv.lastMessageSenderId, currentUserId);
  if (fromSender) return fromSender;

  const fromCreator = pickOtherUserId(conv.createdBy, currentUserId);
  if (fromCreator) return fromCreator;

  return undefined;
}

export function getConversationTitle(
  conv: { type?: string; title?: string | null; members?: { userId?: string; id?: { userId?: string } }[] },
  currentUserId: string,
  peerDisplayName?: string | null
): string {
  if (conv.type === 'GROUP') {
    return conv.title?.trim() || 'Nhóm';
  }
  if (peerDisplayName?.trim()) {
    return peerDisplayName.trim();
  }
  const stored = conv.title?.trim();
  if (stored && stored !== GENERIC_PRIVATE_TITLE) {
    return stored;
  }
  const otherId = getOtherMemberId(conv, currentUserId);
  if (otherId) {
    return `${otherId.slice(0, 8)}…`;
  }
  return 'Người dùng';
}

const SYSTEM_NOTIFICATION_TYPES: NotificationType[] = [
  'FRIEND_REQUEST',
  'FRIEND_ACCEPTED',
  'SYSTEM',
];

export function isSystemNotification(item: NotificationItem): boolean {
  return SYSTEM_NOTIFICATION_TYPES.includes(item.type as NotificationType);
}

export function getConversationUnreadCount(
  conv: { unreadCount?: number; members?: { userId?: string; id?: { userId?: string }; unreadCount?: number }[] },
  currentUserId: string
): number {
  if (typeof conv.unreadCount === 'number' && conv.unreadCount >= 0) {
    return conv.unreadCount;
  }
  const self = conv.members?.find((m) => {
    const id = m.userId ?? m.id?.userId;
    return id != null && String(id) === String(currentUserId);
  });
  return self?.unreadCount ?? 0;
}

export function sumConversationUnreadCount(
  conversations: { unreadCount?: number; members?: { userId?: string; id?: { userId?: string }; unreadCount?: number }[] }[],
  currentUserId: string
): number {
  return conversations.reduce(
    (sum, conv) => sum + getConversationUnreadCount(conv, currentUserId),
    0
  );
}

function normalizeUserIdForCompare(id?: string | null): string {
  return id == null ? '' : String(id).trim().toLowerCase();
}

export function mergeConversationFromInbox(
  existing: {
    unreadCount?: number;
    members?: ConversationMember[];
    lastMessagePreview?: string;
    lastMessageType?: MessageType;
    lastMessageSenderId?: string;
    lastMessageAt?: string;
  },
  incoming: {
    unreadCount?: number;
    members?: Array<Partial<ConversationMember>>;
    lastMessagePreview?: string;
    lastMessageType?: MessageType | string;
    lastMessageSenderId?: string;
    lastMessageAt?: string;
  },
  currentUserId: string
): {
  unreadCount?: number;
  members?: ConversationMember[];
  lastMessagePreview?: string;
  lastMessageType?: MessageType;
  lastMessageSenderId?: string;
  lastMessageAt?: string;
} {
  const mergedMembers: ConversationMember[] | undefined = incoming.members?.length
    ? incoming.members.map((m) => {
        const userId = m.userId ?? m.id?.userId;
        const prev = existing.members?.find(
          (pm) =>
            normalizeUserIdForCompare(pm.userId ?? pm.id?.userId) ===
            normalizeUserIdForCompare(userId)
        );
        return {
          ...prev,
          ...m,
          role: m.role ?? prev?.role ?? 'MEMBER',
          userId: userId ?? prev?.userId,
        };
      })
    : existing.members;

  return {
    ...existing,
    lastMessagePreview: incoming.lastMessagePreview ?? existing.lastMessagePreview,
    lastMessageAt: incoming.lastMessageAt ?? existing.lastMessageAt,
    lastMessageSenderId: incoming.lastMessageSenderId ?? existing.lastMessageSenderId,
    lastMessageType:
      (incoming.lastMessageType as MessageType | undefined) ?? existing.lastMessageType,
    members: mergedMembers ?? existing.members,
    unreadCount: getConversationUnreadCount(
      { members: mergedMembers ?? existing.members, unreadCount: incoming.unreadCount },
      currentUserId
    ),
  };
}
