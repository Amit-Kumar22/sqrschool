import { api } from './api';
import { API_ENDPOINTS } from './config';
import type { SchoolClass } from './classService';

// ─── Class Section service ──────────────────────────────────────────────────
// Dedicated service for the class-section-controller endpoints, scoped per
// class (classId is required on both list and save). Every endpoint here
// returns/accepts the raw entity — no {result} envelope.

export interface Section {
  id: number;
  sectionName: string;
}

export interface SectionPayload {
  sectionName: string;
  classId: number;
}

// Unlike the other list endpoints, this isn't a Page<T> — it's the parent
// class plus its flat list of sections, confirmed against the API docs.
export interface SectionListResponse {
  schoolClass: SchoolClass;
  sections: Section[];
}

export interface SectionListParams {
  /** Required by the backend — sections are always scoped to one class. */
  classId: number;
  page?: number;
  size?: number;
}

export const getSections = async ({ classId, page = 0, size = 200 }: SectionListParams): Promise<SectionListResponse> => {
  const response = await api.get<SectionListResponse>(API_ENDPOINTS.CLASS_SECTION.LIST, {
    params: { classId, page, size },
  });
  return response.data;
};

export const getSection = async (id: number): Promise<Section> => {
  const response = await api.get<Section>(API_ENDPOINTS.CLASS_SECTION.GET(id));
  return response.data;
};

export const createSection = async (data: SectionPayload): Promise<Section> => {
  const response = await api.post<Section>(API_ENDPOINTS.CLASS_SECTION.SAVE, data);
  return response.data;
};

export const updateSection = async (id: number, data: SectionPayload): Promise<Section> => {
  const response = await api.post<Section>(API_ENDPOINTS.CLASS_SECTION.UPDATE(id), data);
  return response.data;
};

export const deleteSection = async (id: number): Promise<void> => {
  await api.delete(API_ENDPOINTS.CLASS_SECTION.DELETE(id));
};
