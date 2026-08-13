import { api } from './api';
import { API_ENDPOINTS } from './config';

// ─── Class service ───────────────────────────────────────────────────────────
// Dedicated service for the class-controller endpoints, scoped per school
// (schoolCode is required on both list and save). Every endpoint here
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
  schoolCode: string;
  className: string;
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
  /** Required by the backend — classes are always scoped to one school. */
  schoolCode: string;
  isActive?: boolean;
  page?: number;
  size?: number;
}

// Fetched with a generous page size since DataTable sorts/paginates
// client-side over the full result set, same as getSchools/getAcademicYears.
/** Paginated class list for one school. Returns the raw Page<SchoolClass> shape — no envelope. */
export const getClasses = async ({
  schoolCode,
  isActive = true,
  page = 0,
  size = 200,
}: ClassListParams): Promise<ClassPage> => {
  const response = await api.get<ClassPage>(API_ENDPOINTS.CLASS.LIST, {
    params: { schoolCode, isActive, page, size },
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
