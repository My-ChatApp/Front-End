import {
  AddConversationMemberRequest,
  ApiResponse,
  ChatMessage,
  Conversation,
  ConversationMember,
  CreateConversationRequest,
  MessageAttachment,
  MessageSearchResult,
  MessageType,
  MessagesPageResponse,
  SendMessageRequest,
  UpdateConversationRequest,
} from '@/types';
import { mimeTypeToFileType } from '@/utils/chatUtils';
import { apiUrl } from '@/config/env';
import { createHttpClient } from './httpClient';
import type { PresignedUploadResult } from './uploadMedia';

const conversationClient = createHttpClient(apiUrl('/api/conversations'));
const chatClient = createHttpClient(apiUrl('/api/chat'));

/** Map legacy IMAGE/VIDEO request types to backend FILE */
export const toBackendMessageType = (type: SendMessageRequest['type']): MessageType => {
  if (type === 'TEXT') return 'TEXT';
  return 'FILE';
};

function getMemberIds(conv: Conversation): string[] {
  return (conv.members || [])
    .map((m) => m.userId || m.id?.userId)
    .filter((id): id is string => Boolean(id));
}

export const chatService = {
  createConversation: async (
    payload: CreateConversationRequest
  ): Promise<ApiResponse<Conversation>> => {
    const response = await conversationClient.post<ApiResponse<Conversation>>('', payload);
    return response.data;
  },

  listConversationsByUser: async (userId: string): Promise<ApiResponse<Conversation[]>> => {
    const response = await conversationClient.get<ApiResponse<Conversation[]>>(
      `/user/${userId}`
    );
    return response.data;
  },

  markConversationRead: async (
    conversationId: string,
    userId: string
  ): Promise<ApiResponse<null>> => {
    const response = await conversationClient.post<ApiResponse<null>>(
      `/${conversationId}/read`,
      null,
      { params: { userId } }
    );
    return response.data;
  },

  getMessages: async (
    conversationId: string,
    userId: string,
    limit = 10,
    before?: string
  ): Promise<ApiResponse<MessagesPageResponse>> => {
    const response = await conversationClient.get<ApiResponse<MessagesPageResponse>>(
      `/${conversationId}/messages`,
      { params: { userId, limit, ...(before ? { before } : {}) } }
    );
    return response.data;
  },

  getConversationById: async (
    conversationId: string,
    userId: string
  ): Promise<ApiResponse<Conversation>> => {
    const response = await conversationClient.get<ApiResponse<Conversation>>(
      `/${conversationId}`,
      { params: { userId } }
    );
    return response.data;
  },

  updateConversation: async (
    conversationId: string,
    userId: string,
    payload: UpdateConversationRequest
  ): Promise<ApiResponse<Conversation>> => {
    const response = await conversationClient.put<ApiResponse<Conversation>>(
      `/${conversationId}`,
      payload,
      { params: { userId } }
    );
    return response.data;
  },

  deleteConversation: async (
    conversationId: string,
    userId: string
  ): Promise<ApiResponse<null>> => {
    const response = await conversationClient.delete<ApiResponse<null>>(
      `/${conversationId}`,
      { params: { userId } }
    );
    return response.data;
  },

  listMembers: async (
    conversationId: string,
    userId: string
  ): Promise<ApiResponse<ConversationMember[]>> => {
    const response = await conversationClient.get<ApiResponse<ConversationMember[]>>(
      `/${conversationId}/members`,
      { params: { userId } }
    );
    return response.data;
  },

  addMember: async (
    conversationId: string,
    actorUserId: string,
    payload: AddConversationMemberRequest
  ): Promise<ApiResponse<ConversationMember>> => {
    const response = await conversationClient.post<ApiResponse<ConversationMember>>(
      `/${conversationId}/members`,
      payload,
      { params: { userId: actorUserId } }
    );
    return response.data;
  },

  removeMember: async (
    conversationId: string,
    actorUserId: string,
    targetUserId: string
  ): Promise<ApiResponse<null>> => {
    const response = await conversationClient.delete<ApiResponse<null>>(
      `/${conversationId}/members/${targetUserId}`,
      { params: { userId: actorUserId } }
    );
    return response.data;
  },

  searchMessages: async (
    conversationId: string,
    userId: string,
    q: string,
    limit = 30
  ): Promise<ApiResponse<MessageSearchResult[]>> => {
    const response = await conversationClient.get<ApiResponse<MessageSearchResult[]>>(
      `/${conversationId}/messages/search`,
      { params: { userId, q, limit } }
    );
    return response.data;
  },

  getHello: async (): Promise<string> => {
    const response = await chatClient.get<string>('/hello');
    return response.data;
  },

  buildSendPayload: (
    conversationId: string,
    senderId: string,
    content: string,
    type: SendMessageRequest['type'] = 'TEXT'
  ): SendMessageRequest => ({
    conversationId,
    senderId,
    content,
    type: toBackendMessageType(type),
  }),

  buildFileSendPayload: (
    conversationId: string,
    senderId: string,
    items: Array<{ upload: PresignedUploadResult; file: File }>,
    caption?: string
  ): SendMessageRequest => {
    const attachments: MessageAttachment[] = items.map(({ upload, file }) => {
      const mimeType = upload.contentType || file.type || 'application/octet-stream';
      return {
        attachmentId: crypto.randomUUID(),
        fileType: mimeTypeToFileType(mimeType),
        mimeType,
        url: upload.publicUrl,
        s3Key: upload.key,
        fileName: file.name,
        size: file.size,
      };
    });
    return {
      conversationId,
      senderId,
      type: 'FILE',
      content: caption?.trim() || '',
      attachments,
    };
  },

  findPrivateConversation: (
    conversations: Conversation[],
    userId: string,
    friendUserId: string
  ): Conversation | undefined => {
    return conversations.find((c) => {
      if (c.type !== 'PRIVATE') return false;
      const ids = getMemberIds(c);
      return ids.includes(userId) && ids.includes(friendUserId);
    });
  },

  findOrCreatePrivateConversation: async (
    userId: string,
    friendUserId: string,
    existing: Conversation[]
  ): Promise<Conversation> => {
    const found = chatService.findPrivateConversation(existing, userId, friendUserId);
    if (found) return found;

    const res = await chatService.createConversation({
      title: '',
      type: 'PRIVATE',
      memberIds: [userId, friendUserId],
    });

    if (!res.success || !res.data) {
      throw new Error(res.message || 'Không tạo được hội thoại');
    }
    return res.data;
  },
};
