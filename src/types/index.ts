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

export interface CreateConversationRequest {
  title: string;
  type: ConversationType;
  memberIds: string[];
}

export interface ConversationMember {
  userId: string;
  role: MemberRole;
  nickname?: string;
}

export interface Conversation {
  id: string;
  type: ConversationType;
  title: string;
  avatarUrl?: string;
  createdBy?: string;
  createdAt?: string;
  members?: ConversationMember[];
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
  createdAt?: string;
  updatedAt?: string;
}

export interface NotificationItem {
  id: string;
  userId: string;
  type: string;
  title: string;
  body: string;
  referenceId?: string;
  read: boolean;
  isRead?: boolean;
  createdAt?: string;
}
