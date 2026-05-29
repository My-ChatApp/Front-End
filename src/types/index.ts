export interface User {
  id: string;
  email: string;
  username: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  username: string;
  password: string;
  confirmPassword: string;
}

export interface AuthResponse {
  valid: boolean;
  email: string;
}

export interface LoginResponse {
  accessToken: string;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data: T;
}

export interface ErrorResponse {
  timestamp: string;
  status: number;
  error: string;
  message: string;
  path: string;
}

export type ConversationType = 'PRIVATE' | 'GROUP';
export type MemberRole = 'OWNER' | 'MEMBER';
export type FriendRequestStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED';
export type MessageType = 'TEXT' | 'FILE';
export type NotificationType =
  | 'FRIEND_REQUEST'
  | 'FRIEND_ACCEPTED'
  | 'MESSAGE'
  | 'SYSTEM';

export interface CreateConversationRequest {
  title: string;
  type: ConversationType;
  memberIds: string[];
}

export interface ConversationMemberId {
  conversationId?: string;
  userId?: string;
}

export interface ConversationMember {
  id?: ConversationMemberId;
  userId?: string;
  role: MemberRole;
  nickname?: string;
  unreadCount?: number;
}

export interface UpdateConversationRequest {
  title?: string;
  description?: string;
  avatarUrl?: string;
}

export interface AddConversationMemberRequest {
  userId: string;
  role?: MemberRole;
}

export interface MessageSearchResult {
  messageId: string;
  conversationId: string;
  senderId: string;
  type: MessageType;
  content?: string;
  createdAt?: string;
}

export interface Conversation {
  id: string;
  type: ConversationType;
  title?: string | null;
  description?: string | null;
  avatarUrl?: string;
  createdBy?: string;
  lastMessageId?: string;
  lastMessageSenderId?: string;
  lastMessageType?: MessageType;
  lastMessageAt?: string;
  lastMessagePreview?: string;
  unreadCount?: number;
  createdAt?: string;
  updatedAt?: string;
  members?: ConversationMember[];
}

export interface MessageAttachment {
  attachmentId?: string;
  fileType?: 'IMAGE' | 'VIDEO' | 'AUDIO' | 'DOCUMENT' | 'OTHER';
  mimeType?: string;
  url?: string;
  s3Key?: string;
  fileName?: string;
  size?: number;
}

export interface MessageReaction {
  userId: string;
  reactionType: string;
  createdAt?: string;
}

export interface ChatMessage {
  messageId: string;
  conversationId: string;
  senderId: string;
  type: MessageType;
  content?: string;
  replyToMessageId?: string;
  edited?: boolean;
  deleted?: boolean;
  createdAt?: string;
  attachmentCount?: number;
  reactionCount?: number;
  attachments?: MessageAttachment[];
  reactions?: MessageReaction[];
}

export interface MessagesPageResponse {
  messages: ChatMessage[];
  loading: boolean;
  hasMore: boolean;
}

export type ChatRealtimeEventType = 'MESSAGE_CREATED' | 'MESSAGE_UPDATED' | 'MESSAGE_DELETED';

export interface ChatRealtimeEnvelope {
  eventType?: ChatRealtimeEventType;
  message?: ChatMessage;
}

export type ChatInboxEventType =
  | 'CONVERSATION_CREATED'
  | 'CONVERSATION_UPDATED'
  | 'CONVERSATION_DELETED'
  | 'MESSAGE_CREATED';

export interface ChatInboxEvent {
  eventType: ChatInboxEventType;
  conversation?: Conversation;
  message?: ChatMessage;
}

export interface SendMessageRequest {
  conversationId: string;
  senderId: string;
  content?: string;
  type: MessageType | 'IMAGE' | 'VIDEO';
  attachments?: MessageAttachment[];
}

export interface SendFriendRequestRequest {
  senderId: string;
  receiverId: string;
}

export interface FriendRequest {
  id: string;
  senderId: string;
  receiverId: string;
  status: FriendRequestStatus;
  respondedAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

export type UserGender = 'MALE' | 'FEMALE' | 'OTHER';

export interface UserProfile {
  id: string;
  email?: string;
  username?: string;
  displayName?: string;
  avatarUrl?: string;
  phone?: string;
  dateOfBirth?: string;
  gender?: UserGender | string;
  online?: boolean;
  lastSeenAt?: string;
}

export interface NotificationItem {
  id: string;
  userId: string;
  actorId?: string;
  type: NotificationType | string;
  title: string;
  body: string;
  referenceId?: string;
  read?: boolean;
  isRead?: boolean;
  createdAt?: string;
  expireAt?: string;
  data?: Record<string, unknown>;
}
