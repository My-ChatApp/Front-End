import { ApiResponse, Conversation, CreateConversationRequest } from '@/types';
import { createHttpClient } from './httpClient';

const conversationClient = createHttpClient('/api/conversations');
const chatClient = createHttpClient('/api/chat');

export const chatService = {
  createConversation: async (payload: CreateConversationRequest): Promise<ApiResponse<Conversation>> => {
    const response = await conversationClient.post<ApiResponse<Conversation>>('', payload);
    return response.data;
  },

  getHello: async (): Promise<string> => {
    const response = await chatClient.get<string>('/hello');
    return response.data;
  },
};
