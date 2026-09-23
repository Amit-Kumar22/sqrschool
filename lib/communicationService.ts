import { api } from './api';
import { API_ENDPOINTS } from './config';

// ─── Conversations ──────────────────────────────────────────────────────────

export type ConversationType = 'DIRECT' | 'GROUP';

export interface ConversationMember {
  userId: number;
  fullName: string;
  email: string;
  role: string;
}

export interface Conversation {
  id: number;
  name: string;
  type: ConversationType;
  createdAt: string;
  updatedAt: string;
  members: ConversationMember[];
}

// Returns the raw array — no {statusCode, message, result} envelope and no
// pagination, confirmed against a real response.
export const getConversations = async (): Promise<Conversation[]> => {
  const response = await api.get<Conversation[]>(API_ENDPOINTS.CONVERSATION.LIST);
  return response.data;
};

export const getConversation = async (conversationId: number): Promise<Conversation> => {
  const response = await api.get<Conversation>(API_ENDPOINTS.CONVERSATION.GET(conversationId));
  return response.data;
};

// The create endpoints' response body wasn't part of the confirmed API spec
// (only the request body was) — assumed to return the created Conversation,
// same shape as GET /v1/conversations/{id}, matching this backend's usual
// "create returns the created entity" convention. Verify against a real call
// once the backend is reachable.
export const createDirectConversation = async (userId: number): Promise<Conversation> => {
  const response = await api.post<Conversation>(API_ENDPOINTS.CONVERSATION.CREATE_DIRECT, { userId });
  return response.data;
};

export interface CreateGroupConversationPayload {
  name: string;
  userIds: number[];
}

export const createGroupConversation = async (
  data: CreateGroupConversationPayload,
): Promise<Conversation> => {
  const response = await api.post<Conversation>(API_ENDPOINTS.CONVERSATION.CREATE_GROUP, data);
  return response.data;
};

// ─── Messages ───────────────────────────────────────────────────────────────

// SENDING is client-only — an optimistic bubble not yet echoed back by the server.
export type MessageStatus = 'SENDING' | 'SENT' | 'DELIVERED' | 'READ' | 'DELETED';

// Same shape from REST (GET .../messages) and the /topic/conversation/{id}
// broadcast. clientMessageId only exists on local optimistic copies.
export interface ChatMessage {
  id: number;
  clientMessageId?: string;
  conversationId: number;
  senderId: number;
  senderName: string;
  content: string;
  status: MessageStatus;
  createdAt: string;
}

// Broadcast on /topic/conversation/{id}/typing.
export interface TypingEvent {
  conversationId: number;
  userId: number;
  userName: string;
  typing: boolean;
}

// Broadcast on /topic/conversation/{id}/read.
export interface ReadReceiptEvent {
  conversationId: number;
  userId: number;
  userName: string;
  lastReadMessageId: number;
  readAt: string;
}

export const getMessages = async (conversationId: number): Promise<ChatMessage[]> => {
  const response = await api.get<ChatMessage[]>(API_ENDPOINTS.CONVERSATION.MESSAGES(conversationId));
  return response.data;
};

export interface SendMessagePayload {
  conversationId: number;
  content: string;
}

// Response body wasn't part of the confirmed spec (only the request shape
// was) — assumed to return the created ChatMessage, same as the other
// create endpoints on this backend. Verify once reachable.
export const sendMessage = async (payload: SendMessagePayload): Promise<ChatMessage> => {
  const response = await api.post<ChatMessage>(API_ENDPOINTS.CONVERSATION.SEND_MESSAGE, payload);
  return response.data;
};

export const markConversationRead = async (conversationId: number): Promise<void> => {
  await api.put(API_ENDPOINTS.CONVERSATION.READ(conversationId));
};
