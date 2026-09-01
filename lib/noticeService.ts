import { api } from './api';
import { API_ENDPOINTS } from './config';
import type { Role } from './auth';

// ─── Notice Board service ────────────────────────────────────────────────────
// Dedicated service for the notice-board-controller endpoints. Every endpoint
// here returns/accepts the raw entity — no {result} envelope.

export type NoticeAudience = 'ALL' | 'ADMIN' | 'TEACHER' | 'STUDENT' | 'PARENT';

// Only "LOW" is confirmed by the API spec's example body — MEDIUM/HIGH are
// the expected remaining levels for a 3-tier priority scale, same shape as
// DifficultyBadge in components/ui/Badge.tsx.
export type NoticePriority = 'LOW' | 'MEDIUM' | 'HIGH';

// All four values are confirmed by the API spec's "Available values" list.
export type NoticeStatus = 'DRAFT' | 'PUBLISHED' | 'EXPIRED' | 'ARCHIVED';

export interface NoticeAuthor {
  id: number;
  fullName: string;
  email: string;
  phone: string;
  city: string;
  role: Role;
}

export interface Notice {
  id: number;
  title: string;
  content: string;
  audience: NoticeAudience;
  priority: NoticePriority;
  status: NoticeStatus;
  publishDate: string;
  expiryDate: string;
  attachmentUrl: string;
  attachmentName: string;
  remarks: string;
  author: NoticeAuthor;
  createdAt: string;
}

export interface NoticePayload {
  title: string;
  content: string;
  audience: NoticeAudience;
  priority: NoticePriority;
  status: NoticeStatus;
  publishDate: string;
  expiryDate: string;
  attachmentUrl: string;
  attachmentName: string;
  remarks: string;
}

export interface NoticePage {
  content: Notice[];
  totalElements: number;
  totalPages: number;
  pageNumber: number;
  pageSize: number;
  last: boolean;
}

export interface NoticeListParams {
  audience?: NoticeAudience;
  status?: NoticeStatus;
  userId?: number;
  page?: number;
  size?: number;
  sort?: string[];
}

// Fetched with a generous page size since the page sorts/paginates
// client-side over the full result set, same as getHolidays/getFeeStructures.
/** Paginated notice list, optionally filtered by audience/status/author. Returns the raw Page<Notice> shape — no envelope. */
export const getNotices = async ({
  audience,
  status,
  userId,
  page = 0,
  size = 200,
  sort,
}: NoticeListParams = {}): Promise<NoticePage> => {
  const response = await api.get<NoticePage>(API_ENDPOINTS.NOTICE_BOARD.LIST, {
    params: { audience, status, userId, page, size, sort },
  });
  return response.data;
};

export const getNotice = async (id: number): Promise<Notice> => {
  const response = await api.get<Notice>(API_ENDPOINTS.NOTICE_BOARD.GET(id));
  return response.data;
};

export const createNotice = async (data: NoticePayload): Promise<Notice> => {
  const response = await api.post<Notice>(API_ENDPOINTS.NOTICE_BOARD.CREATE, data);
  return response.data;
};

export const updateNotice = async (id: number, data: NoticePayload): Promise<Notice> => {
  const response = await api.put<Notice>(API_ENDPOINTS.NOTICE_BOARD.UPDATE(id), data);
  return response.data;
};

export const deleteNotice = async (id: number): Promise<void> => {
  await api.delete(API_ENDPOINTS.NOTICE_BOARD.DELETE(id));
};
