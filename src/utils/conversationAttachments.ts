import type { ChatMessage } from '@/types';
import {
  getFileNameFromUrl,
  parseFileMessageContent,
  resolveFileMediaKind,
} from '@/utils/chatUtils';

export type ConversationMediaKind = 'image' | 'video';

export interface ConversationAttachmentItem {
  id: string;
  url: string;
  fileName: string;
  kind: ConversationMediaKind | 'file';
  createdAt?: string;
}

function sortByNewest(a: ConversationAttachmentItem, b: ConversationAttachmentItem): number {
  const ta = a.createdAt ? new Date(a.createdAt).getTime() : 0;
  const tb = b.createdAt ? new Date(b.createdAt).getTime() : 0;
  return tb - ta;
}

export function collectConversationAttachments(messages: ChatMessage[]): {
  mediaItems: ConversationAttachmentItem[];
  fileItems: ConversationAttachmentItem[];
} {
  const seen = new Set<string>();
  const mediaItems: ConversationAttachmentItem[] = [];
  const fileItems: ConversationAttachmentItem[] = [];

  const push = (
    messageId: string,
    url: string,
    kind: ConversationAttachmentItem['kind'],
    fileName?: string,
    createdAt?: string
  ) => {
    const trimmed = url?.trim();
    if (!trimmed || seen.has(trimmed)) return;
    seen.add(trimmed);

    const item: ConversationAttachmentItem = {
      id: `${messageId}_${trimmed}`,
      url: trimmed,
      fileName: fileName?.trim() || getFileNameFromUrl(trimmed),
      kind,
      createdAt,
    };

    if (kind === 'image' || kind === 'video') {
      mediaItems.push(item);
    } else {
      fileItems.push(item);
    }
  };

  for (const msg of messages) {
    if (msg.deleted) continue;

    for (const att of msg.attachments ?? []) {
      const url = att.url?.trim();
      if (!url) continue;
      const ft = att.fileType?.toLowerCase();
      if (ft === 'image') push(msg.messageId, url, 'image', att.fileName, msg.createdAt);
      else if (ft === 'video') push(msg.messageId, url, 'video', att.fileName, msg.createdAt);
      else push(msg.messageId, url, 'file', att.fileName, msg.createdAt);
    }

    const content = msg.content?.trim() || '';
    const parsed = parseFileMessageContent(content);
    if (msg.type === 'FILE' || parsed) {
      const media = resolveFileMediaKind(content, msg.attachments);
      if (media) {
        const kind: ConversationAttachmentItem['kind'] =
          media.kind === 'image'
            ? 'image'
            : media.kind === 'video'
              ? 'video'
              : 'file';
        push(msg.messageId, media.url, kind, media.fileName, msg.createdAt);
      }
    }
  }

  mediaItems.sort(sortByNewest);
  fileItems.sort(sortByNewest);

  return { mediaItems, fileItems };
}
