import { api } from './api';
import { API_ENDPOINTS } from './config';
import type { TeacherSubjectMapping } from './teacherSubjectService';

// ─── Homework service ────────────────────────────────────────────────────────
// Dedicated service for the home-work-controller endpoints — a teacher's
// homework notes for one of their assigned class sections. Every endpoint
// here returns/accepts the raw entity — no {result} envelope.

export interface HomeworkNotePayload {
  homeworkDate: string;
  questions: string[];
}

export interface HomeworkPayload {
  /** The id of the teacher's subject-section assignment (a TeacherSubjectMapping.id) this homework is for. */
  teacherClassId: number;
  notes: HomeworkNotePayload[];
}

// Only "ACTIVE" is confirmed by the API spec for a note's status.
// Unrecognized values still render fine (neutral badge) rather than erroring.
export type HomeworkNoteStatus = 'ACTIVE' | 'INACTIVE';

export interface HomeworkNote {
  id: number;
  created: string;
  updated: string;
  homeworkDate: string;
  questions: string[];
  status: HomeworkNoteStatus;
  active: boolean;
}

export interface Homework {
  id: number;
  created: string;
  updated: string;
  teacherSubjectSection: TeacherSubjectMapping;
  notes: HomeworkNote[];
  active: boolean;
}

export interface HomeworkPage {
  content: Homework[];
  totalElements: number;
  totalPages: number;
  pageNumber: number;
  pageSize: number;
  last: boolean;
}

export interface HomeworkListParams {
  page?: number;
  size?: number;
  sort?: string[];
}

/** Paginated homework list, scoped server-side to the caller's own assignments. Returns the raw Page shape — no envelope. */
export const getHomeworks = async ({ page = 0, size = 200, sort }: HomeworkListParams = {}): Promise<HomeworkPage> => {
  const response = await api.get<HomeworkPage>(API_ENDPOINTS.HOME_WORK.LIST, {
    params: { page, size, sort },
  });
  return response.data;
};

export const getHomework = async (id: number): Promise<Homework> => {
  const response = await api.get<Homework>(API_ENDPOINTS.HOME_WORK.GET(id));
  return response.data;
};

export const createHomework = async (data: HomeworkPayload): Promise<Homework> => {
  const response = await api.post<Homework>(API_ENDPOINTS.HOME_WORK.CREATE, data);
  return response.data;
};

export interface DailyNotePayload {
  /** Which homework record this note is appended to — sent as a query param, not in the body. */
  homeworkId: number;
  homeworkDate: string;
  questions: string[];
}

/** Appends one daily note to an existing homework record. */
export const addDailyHomework = async ({ homeworkId, ...body }: DailyNotePayload): Promise<Homework> => {
  const response = await api.post<Homework>(API_ENDPOINTS.HOME_WORK.ADD_DAILY, body, {
    params: { homeworkId },
  });
  return response.data;
};

export const deleteHomework = async (id: number): Promise<void> => {
  await api.delete(API_ENDPOINTS.HOME_WORK.DELETE(id));
};
