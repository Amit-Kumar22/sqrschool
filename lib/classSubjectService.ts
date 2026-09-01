import { api } from './api';
import { API_ENDPOINTS } from './config';

// ─── Class-Subject service ───────────────────────────────────────────────────
// Dedicated service for the class-subject-controller endpoints — assigns
// subjects to a class. Every endpoint here returns/accepts the raw entity —
// no {result} envelope.

export interface ClassSubject {
  id: number;
  classId: number;
  className: string;
  subjectId: number;
  subjectName: string;
}

export interface ClassSubjectPayload {
  classId: number;
  subjectId: number;
}

export interface ClassSubjectPage {
  content: ClassSubject[];
  totalElements: number;
  totalPages: number;
  pageNumber: number;
  pageSize: number;
  last: boolean;
}

export interface ClassSubjectListParams {
  classId?: number;
  subjectId?: number;
  page?: number;
  size?: number;
  sort?: string[];
}

// Fetched with a generous page size since the Assign Subjects and Summary
// tabs both sort/cross-reference client-side over the full result set, same
// as getClasses/getSubjects.
/** Paginated class-subject list, optionally filtered by class and/or subject. Returns the raw Page<ClassSubject> shape — no envelope. */
export const getClassSubjects = async ({
  classId,
  subjectId,
  page = 0,
  size = 200,
  sort,
}: ClassSubjectListParams = {}): Promise<ClassSubjectPage> => {
  const response = await api.get<ClassSubjectPage>(API_ENDPOINTS.CLASS_SUBJECT.LIST, {
    params: { classId, subjectId, page, size, sort },
  });
  return response.data;
};

export const getClassSubject = async (id: number): Promise<ClassSubject> => {
  const response = await api.get<ClassSubject>(API_ENDPOINTS.CLASS_SUBJECT.GET(id));
  return response.data;
};

export const createClassSubject = async (data: ClassSubjectPayload): Promise<ClassSubject> => {
  const response = await api.post<ClassSubject>(API_ENDPOINTS.CLASS_SUBJECT.CREATE, data);
  return response.data;
};

export const updateClassSubject = async (id: number, data: ClassSubjectPayload): Promise<ClassSubject> => {
  const response = await api.put<ClassSubject>(API_ENDPOINTS.CLASS_SUBJECT.UPDATE(id), data);
  return response.data;
};

export const deleteClassSubject = async (id: number): Promise<void> => {
  await api.delete(API_ENDPOINTS.CLASS_SUBJECT.DELETE(id));
};

export interface BulkClassSubjectPayload {
  classId: number;
  subjectIds: number[];
}

// The backend deserializes this into a BulkClassSubjectRequest object (one
// class, many subject ids) — NOT a bare array of {classId, subjectId} pairs,
// confirmed by a "Cannot deserialize ... from Array value" error when an
// array was posted. Only used when assigning more than one subject at once;
// a single subject goes through createClassSubject instead.
export const bulkUpdateClassSubjects = async (data: BulkClassSubjectPayload): Promise<ClassSubject[]> => {
  const response = await api.post<ClassSubject[]>(API_ENDPOINTS.CLASS_SUBJECT.BULK_UPDATE, data);
  return response.data;
};
