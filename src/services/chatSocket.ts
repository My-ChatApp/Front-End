import { Client, IMessage } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { wsUrl } from '@/config/env';
import {
  ChatInboxEvent,
  ChatMessage,
  ChatRealtimeEnvelope,
  SendMessageRequest,
  TypingEventRequest,
} from '@/types';
import { getStoredToken } from './httpClient';
import { toBackendMessageType } from './chatService';

type MessageHandler = (message: ChatMessage) => void;
type RealtimeHandler = (payload: ChatMessage | ChatRealtimeEnvelope) => void;
type InboxHandler = (event: ChatInboxEvent) => void;

export interface PresenceNotifyEvent {
  userId: string;
  targetUserId?: string;
  displayName?: string;
  online: boolean;
  occurredAt?: string;
}

type PresenceHandler = (event: PresenceNotifyEvent) => void;
type VoidHandler = () => void;
type ErrorHandler = (err: string) => void;

let stompClient: Client | null = null;
let connectPromise: Promise<void> | null = null;
let errorUnsubscribe: (() => void) | null = null;
let onErrorHandler: ErrorHandler | null = null;

function subscribeErrors(client: Client) {
  errorUnsubscribe?.();
  errorUnsubscribe = null;

  if (!client.connected) return;

  const sub = client.subscribe('/user/queue/errors', (message: IMessage) => {
    try {
      const body = JSON.parse(message.body) as { message?: string };
      const err = body.message || 'Gửi tin nhắn thất bại';
      onErrorHandler?.(err);
    } catch {
      onErrorHandler?.('Gửi tin nhắn thất bại');
    }
  });

  errorUnsubscribe = () => sub.unsubscribe();
}

export const chatSocket = {
  setErrorHandler: (handler: ErrorHandler | null): void => {
    onErrorHandler = handler;
  },

  connect: (onConnected?: VoidHandler, onError?: ErrorHandler): Promise<void> => {
    if (stompClient?.connected) {
      subscribeErrors(stompClient);
      onConnected?.();
      return Promise.resolve();
    }

    if (connectPromise) {
      return connectPromise.then(() => {
        if (stompClient?.connected) subscribeErrors(stompClient);
        onConnected?.();
      });
    }

    const token = getStoredToken();
    const sockJsUrl = wsUrl(
      '/ws',
      token ? `access_token=${encodeURIComponent(token)}` : ''
    );

    connectPromise = new Promise<void>((resolve, reject) => {
      stompClient = new Client({
        webSocketFactory: () => new SockJS(sockJsUrl),
        connectHeaders: token ? { Authorization: `Bearer ${token}` } : {},
        reconnectDelay: 5000,
        onConnect: () => {
          subscribeErrors(stompClient!);
          onConnected?.();
          resolve();
        },
        onStompError: (frame) => {
          const msg = frame.headers['message'] || frame.body || 'STOMP error';
          onError?.(msg);
          onErrorHandler?.(msg);
          connectPromise = null;
          reject(new Error(msg));
        },
        onWebSocketError: () => {
          const msg = 'WebSocket connection failed';
          onError?.(msg);
          connectPromise = null;
          reject(new Error(msg));
        },
        onDisconnect: () => {
          connectPromise = null;
          errorUnsubscribe?.();
          errorUnsubscribe = null;
        },
      });

      stompClient.activate();
    });

    return connectPromise;
  },

  disconnect: (): void => {
    errorUnsubscribe?.();
    errorUnsubscribe = null;
    stompClient?.deactivate();
    stompClient = null;
    connectPromise = null;
  },

  subscribePresence: (userId: string, handler: PresenceHandler): (() => void) => {
    if (!stompClient?.connected) {
      return () => undefined;
    }

    const subscription = stompClient.subscribe(`/topic/presence/${userId}`, (message: IMessage) => {
      try {
        const parsed = JSON.parse(message.body) as PresenceNotifyEvent;
        if (parsed?.userId != null && typeof parsed.online === 'boolean') {
          handler(parsed);
        }
      } catch {
        // ignore malformed payloads
      }
    });

    return () => subscription.unsubscribe();
  },

  subscribeInbox: (userId: string, handler: InboxHandler): (() => void) => {
    if (!stompClient?.connected) {
      return () => undefined;
    }

    const subscription = stompClient.subscribe(`/topic/inbox/${userId}`, (message: IMessage) => {
      try {
        const parsed = JSON.parse(message.body) as ChatInboxEvent;
        if (parsed?.eventType) {
          handler(parsed);
        }
      } catch {
        // ignore malformed payloads
      }
    });

    return () => subscription.unsubscribe();
  },

  subscribeConversation: (conversationId: string, handler: RealtimeHandler): (() => void) => {
    if (!stompClient?.connected) {
      return () => undefined;
    }

    const subscription = stompClient.subscribe(
      `/topic/conversation/${conversationId}`,
      (message: IMessage) => {
        try {
          const parsed = JSON.parse(message.body) as ChatMessage | ChatRealtimeEnvelope;
          handler(parsed);
        } catch {
          // ignore malformed payloads
        }
      }
    );

    return () => subscription.unsubscribe();
  },

  sendMessage: (payload: SendMessageRequest): void => {
    if (!stompClient?.connected) {
      throw new Error('WebSocket chưa kết nối');
    }

    stompClient.publish({
      destination: '/app/chat.send',
      body: JSON.stringify({
        ...payload,
        type: toBackendMessageType(payload.type),
      }),
    });
  },

  sendTyping: (payload: TypingEventRequest): void => {
    if (!stompClient?.connected) return;
    stompClient.publish({
      destination: '/app/chat.typing',
      body: JSON.stringify(payload),
    });
  },

  isConnected: (): boolean => Boolean(stompClient?.connected),
};
