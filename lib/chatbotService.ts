import { api, type ApiEnvelope } from './api';
import { API_ENDPOINTS } from './config';

// ─── Chatbot service ─────────────────────────────────────────────────────────
// Dedicated service for the chatbot-controller endpoints (keyword/answer
// pairs used to drive the site chatbot). List is a raw Page<T> — no envelope
// — everything else is wrapped in {statusCode, success, message, result}.

export interface ChatbotEntry {
  id: number;
  keyword: string;
  answer: string;
  active: boolean;
}

export type ChatbotEntryPayload = Omit<ChatbotEntry, 'id'>;

export interface ChatbotPage {
  content: ChatbotEntry[];
  totalElements: number;
  totalPages: number;
  pageNumber: number;
  pageSize: number;
  last: boolean;
}

/** Paginated list of every chatbot entry. Returns the raw Page<ChatbotEntry> shape — no envelope. */
export const getChatbotEntries = async (): Promise<ChatbotPage> => {
  const response = await api.get<ChatbotPage>(API_ENDPOINTS.CHATBOT.LIST);
  return response.data;
};

export const getChatbotEntry = async (id: number): Promise<ChatbotEntry> => {
  const response = await api.get<ApiEnvelope<ChatbotEntry>>(API_ENDPOINTS.CHATBOT.GET(id));
  return response.data.result;
};

export const createChatbotEntry = async (data: ChatbotEntryPayload): Promise<ChatbotEntry> => {
  const response = await api.post<ApiEnvelope<ChatbotEntry>>(API_ENDPOINTS.CHATBOT.CREATE, data);
  return response.data.result;
};

export const updateChatbotEntry = async (id: number, data: ChatbotEntryPayload): Promise<ChatbotEntry> => {
  const response = await api.put<ApiEnvelope<ChatbotEntry>>(API_ENDPOINTS.CHATBOT.UPDATE(id), { ...data, id });
  return response.data.result;
};

export const deleteChatbotEntry = async (id: number): Promise<void> => {
  await api.delete(API_ENDPOINTS.CHATBOT.DELETE(id));
};

export const searchChatbotEntries = async (keyword: string): Promise<ChatbotEntry[]> => {
  const response = await api.get<ApiEnvelope<ChatbotEntry[]>>(API_ENDPOINTS.CHATBOT.SEARCH, { params: { keyword } });
  return Array.isArray(response.data.result) ? response.data.result : [];
};
