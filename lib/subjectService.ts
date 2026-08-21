import { api } from './api';
import { API_ENDPOINTS } from './config';

// ─── Subject service ─────────────────────────────────────────────────────────
// Dedicated service for the subject-controller endpoints, scoped per school
// (schoolCode is required on both list and save). Every endpoint here
// returns/accepts the raw entity — no {result} envelope.

export interface Subject {
  id: number;
  subjectName: string;
  subjectCode: string;
}

export interface SubjectPayload {
  subjectName: string;
  subjectCode: string;
  schoolCode: string;
}

export interface SubjectPage {
  content: Subject[];
  totalElements: number;
  totalPages: number;
  pageNumber: number;
  pageSize: number;
  last: boolean;
}

export interface SubjectListParams {
  /** Required by the backend — subjects are always scoped to one school. */
  schoolCode: string;
  subjectName?: string;
  page?: number;
  size?: number;
  sort?: string[];
}

// Fetched with a generous page size since DataTable sorts/paginates
// client-side over the full result set, same as getClasses/getAcademicYears.
/** Paginated subject list for one school, optionally filtered by name. Returns the raw Page<Subject> shape — no envelope. */
export const getSubjects = async ({
  schoolCode,
  subjectName,
  page = 0,
  size = 200,
  sort,
}: SubjectListParams): Promise<SubjectPage> => {
  const response = await api.get<SubjectPage>(API_ENDPOINTS.SUBJECT.LIST, {
    params: { schoolCode, subjectName, page, size, sort },
  });
  return response.data;
};

export const getSubject = async (id: number): Promise<Subject> => {
  const response = await api.get<Subject>(API_ENDPOINTS.SUBJECT.GET(id));
  return response.data;
};

export const createSubject = async (data: SubjectPayload): Promise<Subject> => {
  const response = await api.post<Subject>(API_ENDPOINTS.SUBJECT.SAVE, data);
  return response.data;
};

export const updateSubject = async (id: number, data: SubjectPayload): Promise<Subject> => {
  const response = await api.post<Subject>(API_ENDPOINTS.SUBJECT.UPDATE(id), data);
  return response.data;
};

export const deleteSubject = async (id: number): Promise<void> => {
  await api.delete(API_ENDPOINTS.SUBJECT.DELETE(id));
};
