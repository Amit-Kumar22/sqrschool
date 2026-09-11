import { api, type ApiEnvelope } from './api';
import { API_ENDPOINTS } from './config';
import type { DayOfWeek } from './timetableService';

// ─── Homework service ────────────────────────────────────────────────────────
// Dedicated service for the home-work-controller endpoints. A homework record
// is anchored to one weekly-timetable slot (class + subject + period + day)
// and carries one or more dated notes. Every endpoint here returns/accepts
// the raw entity — no {result} envelope — except the admin list, which does.

export interface HomeworkNotePayload {
  homeworkDate: string;
  questions: string[];
}

export interface HomeworkPayload {
  /** The weekly-timetable slot (class/subject/period/day) this homework is for — see getTeacherWeeklyTimetable. */
  weeklyTimetableId: number;
  notes: HomeworkNotePayload[];
  homeworkDate: string;
  dueDate: string;
}

// Only "ACTIVE" is confirmed by the API spec for a note's status.
// Unrecognized values still render fine (neutral badge) rather than erroring.
export type HomeworkNoteStatus = 'ACTIVE' | 'INACTIVE';

export interface HomeworkNote {
  id: number;
  homeworkDate: string;
  questions: string[];
  status: HomeworkNoteStatus;
}

export interface Homework {
  id: number;
  weeklyTimetableId: number;
  homeworkDate: string;
  dueDate: string;
  className: string;
  subjectName: string;
  teacherName: string;
  dayOfWeek: string;
  periodName: string;
  notes: HomeworkNote[];
}

export interface HomeworkPage {
  content: Homework[];
  totalElements: number;
  totalPages: number;
  pageNumber: number;
  pageSize: number;
  last: boolean;
}

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

// ─── Teacher panel list ───────────────────────────────────────────────────────

export interface TeacherHomeworkListParams {
  teacherId: number;
  /** Named per the API spec; in this app's class model the closest available id is a class's own id (there's no separate section concept for periods/homework). */
  sectionId?: number;
  subjectId?: number;
  fromDate?: string;
  toDate?: string;
  page?: number;
  size?: number;
  sort?: string[];
}

/** Paginated homework list scoped to one teacher. Returns the raw Page shape — no envelope. */
export const getTeacherHomeworks = async ({
  page = 0,
  size = 10,
  sort,
  ...params
}: TeacherHomeworkListParams): Promise<HomeworkPage> => {
  const response = await api.get<HomeworkPage>(API_ENDPOINTS.HOME_WORK.TEACHER_LIST, {
    params: { ...params, page, size, sort },
  });
  return response.data;
};

// ─── Principal/Admin panel list ───────────────────────────────────────────────

export interface AdminHomeworkListParams {
  classId?: number;
  subjectId?: number;
  teacherId?: number;
  dayOfWeek?: DayOfWeek;
  periodId?: number;
  homeworkDateFrom?: string;
  homeworkDateTo?: string;
  dueDateFrom?: string;
  dueDateTo?: string;
  noteStatus?: HomeworkNoteStatus;
  keyword?: string;
  page?: number;
  size?: number;
  sort?: string[];
}

/** Paginated, filterable homework list across every teacher — Principal panel only. Wrapped in {statusCode, message, result}. */
export const getAdminHomeworks = async ({
  page = 0,
  size = 10,
  sort,
  ...params
}: AdminHomeworkListParams = {}): Promise<HomeworkPage> => {
  const response = await api.get<ApiEnvelope<HomeworkPage>>(API_ENDPOINTS.HOME_WORK.ADMIN_LIST, {
    params: { ...params, page, size, sort },
  });
  return response.data.result;
};
