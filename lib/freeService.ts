import { api } from './api';
import { API_ENDPOINTS } from './config';

// ─── Free/public endpoints ───────────────────────────────────────────────────
// Consumed by the marketing home page before any session exists — same
// pattern as getPublicActiveTheme (api.ts): no auth header is sent since
// there's no token yet, and every endpoint here returns its raw shape
// directly, no {result} envelope.

interface FreePage<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  pageNumber: number;
  pageSize: number;
  last: boolean;
}

export interface PublicInfrastructure {
  id: number;
  created: string;
  updated: string;
  name: string;
  icon: string;
  description: string;
  active: boolean;
}

/** Public list of school facilities/infrastructure highlights for the home page. */
export const getPublicInfrastructure = async (): Promise<PublicInfrastructure[]> => {
  const response = await api.get<FreePage<PublicInfrastructure>>(API_ENDPOINTS.FREE.INFRASTRUCTURE);
  return response.data?.content ?? [];
};

export interface NoticeBoard {
  boardName: string;
  description: string;
}

export interface PublicAnnouncement {
  id: number;
  created: string;
  updated: string;
  announcementName: string;
  description: string;
  startDate: string;
  endDate: string;
  noticeBoards: NoticeBoard[];
  active: boolean;
}

/** Currently-active announcements/notices for the home page. Returns a flat array — no envelope, no pagination. */
export const getActiveAnnouncements = async (): Promise<PublicAnnouncement[]> => {
  const response = await api.get<PublicAnnouncement[]>(API_ENDPOINTS.FREE.ANNOUNCEMENTS_ACTIVE);
  return Array.isArray(response.data) ? response.data : [];
};

export interface PublicAboutUs {
  id: number;
  created: string;
  updated: string;
  imageLink: string;
  description: string;
  active: boolean;
}

/** Public "About Us" content for the home page. */
export const getPublicAboutUs = async (): Promise<PublicAboutUs[]> => {
  const response = await api.get<FreePage<PublicAboutUs>>(API_ENDPOINTS.FREE.ABOUT_US);
  return response.data?.content ?? [];
};
