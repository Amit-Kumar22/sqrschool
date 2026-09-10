import { api } from './api';
import { API_ENDPOINTS } from './config';

// ─── Class service ───────────────────────────────────────────────────────────
// Dedicated service for the class-controller endpoints. Every endpoint here
// returns/accepts the raw entity — no {result} envelope. Named SchoolClass
// since `class` is a reserved word.

export interface SchoolClass {
  id: number;
  created: string;
  updated: string;
  className: string;
  description: string;
  active: boolean;
}

export interface ClassPayload {
  className: string;
  description: string;
}

export interface ClassPage {
  content: SchoolClass[];
  totalElements: number;
  totalPages: number;
  pageNumber: number;
  pageSize: number;
  last: boolean;
}

export interface ClassListParams {
  isActive?: boolean;
  page?: number;
  size?: number;
}

// Fetched with a generous page size since DataTable sorts/paginates
// client-side over the full result set, same as getSchools/getExams.
/** Paginated class list. Returns the raw Page<SchoolClass> shape — no envelope. */
export const getClasses = async ({
  isActive = true,
  page = 0,
  size = 200,
}: ClassListParams = {}): Promise<ClassPage> => {
  const response = await api.get<ClassPage>(API_ENDPOINTS.CLASS.LIST, {
    params: { isActive, page, size },
  });
  return response.data;
};

/** Fetches current values for the edit form — GET on the same /update/{id} path as the save call. */
export const getClass = async (id: number): Promise<SchoolClass> => {
  const response = await api.get<SchoolClass>(API_ENDPOINTS.CLASS.UPDATE(id));
  return response.data;
};

export const createClass = async (data: ClassPayload): Promise<SchoolClass> => {
  const response = await api.post<SchoolClass>(API_ENDPOINTS.CLASS.SAVE, data);
  return response.data;
};

export const updateClass = async (id: number, data: ClassPayload): Promise<SchoolClass> => {
  const response = await api.post<SchoolClass>(API_ENDPOINTS.CLASS.UPDATE(id), data);
  return response.data;
};

export const deleteClass = async (id: number): Promise<void> => {
  await api.delete(API_ENDPOINTS.CLASS.DELETE(id));
};

/**
 * Assigns a class teacher. classId is embedded in the URL (as the spec's
 * `{classId}` denotes) but is also sent as a query param alongside
 * teacherId, matching the endpoint's documented parameter list exactly.
 * teacherId is the teacher-record id (TeacherStaffMember.id), same
 * convention as every other teacher assignment in this app.
 */
export const assignClassTeacher = async (classId: number, teacherId: number): Promise<void> => {
  await api.put(API_ENDPOINTS.CLASS.ASSIGN_TEACHER(classId), null, { params: { classId, teacherId } });
};
