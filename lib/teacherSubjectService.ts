import { api } from './api';
import { API_ENDPOINTS } from './config';
import type { Role } from './auth';
import type { SchoolClass } from './classService';

// ─── Teacher-Subject-Section mapping service ────────────────────────────────
// Dedicated service for the student-subject-section-mapping-controller
// endpoints — assigns a teacher to a subject for a class section. Every
// endpoint here returns/accepts the raw entity — no {result} envelope.
//
// Unlike every other list endpoint in this codebase, the plain LIST endpoint
// takes no schoolCode — confirmed against the API docs, presumably scoped
// server-side from the caller's own school. The /admin variant (for
// principal-level cross-school viewing) does require schoolCode explicitly.

export interface MappingTeacher {
  id: number;
  fullName: string;
  email: string;
  phone: string;
  role: Role;
  status: string;
  schoolCode: string;
  createdAt: string;
}

export interface MappingSection {
  id: number;
  sectionName: string;
  schoolClass: SchoolClass;
}

export interface MappingSubject {
  id: number;
  subjectName: string;
  subjectCode: string;
}

export interface TeacherSubjectMapping {
  id: number;
  created: string;
  updated: string;
  teacher: MappingTeacher;
  section: MappingSection;
  subject: MappingSubject;
  active: boolean;
}

export interface TeacherSubjectMappingPayload {
  subjectId: number;
  sectionId: number;
  teacherId: number;
  schoolCode: string;
}

export interface TeacherSubjectMappingPage {
  content: TeacherSubjectMapping[];
  totalElements: number;
  totalPages: number;
  pageNumber: number;
  pageSize: number;
  last: boolean;
}

export interface TeacherSubjectMappingListParams {
  page?: number;
  size?: number;
  sort?: string[];
}

/** Paginated mapping list, scoped server-side to the caller's own school. Returns the raw Page shape — no envelope. */
export const getTeacherSubjectMappings = async ({
  page = 0,
  size = 200,
  sort,
}: TeacherSubjectMappingListParams = {}): Promise<TeacherSubjectMappingPage> => {
  const response = await api.get<TeacherSubjectMappingPage>(API_ENDPOINTS.TEACHER_SUBJECT_MAPPING.LIST, {
    params: { page, size, sort },
  });
  return response.data;
};

export const getTeacherSubjectMapping = async (id: number): Promise<TeacherSubjectMapping> => {
  const response = await api.get<TeacherSubjectMapping>(API_ENDPOINTS.TEACHER_SUBJECT_MAPPING.GET(id));
  return response.data;
};

export const createTeacherSubjectMapping = async (data: TeacherSubjectMappingPayload): Promise<TeacherSubjectMapping> => {
  const response = await api.post<TeacherSubjectMapping>(API_ENDPOINTS.TEACHER_SUBJECT_MAPPING.CREATE, data);
  return response.data;
};

export const updateTeacherSubjectMapping = async (id: number, data: TeacherSubjectMappingPayload): Promise<TeacherSubjectMapping> => {
  const response = await api.put<TeacherSubjectMapping>(API_ENDPOINTS.TEACHER_SUBJECT_MAPPING.UPDATE(id), data);
  return response.data;
};

export const deleteTeacherSubjectMapping = async (id: number): Promise<void> => {
  await api.delete(API_ENDPOINTS.TEACHER_SUBJECT_MAPPING.DELETE(id));
};

export interface TeacherSubjectMappingAdminListParams {
  /** Required by the backend — lets a principal view mappings for a specific school. */
  schoolCode: string;
  page?: number;
  size?: number;
  sort?: string[];
}

/** Cross-school-capable admin view of the same mapping list — for the Principal panel. Returns the raw Page shape — no envelope. */
export const getTeacherSubjectMappingsAdmin = async ({
  schoolCode,
  page = 0,
  size = 200,
  sort,
}: TeacherSubjectMappingAdminListParams): Promise<TeacherSubjectMappingPage> => {
  const response = await api.get<TeacherSubjectMappingPage>(API_ENDPOINTS.TEACHER_SUBJECT_MAPPING.ADMIN_LIST, {
    params: { schoolCode, page, size, sort },
  });
  return response.data;
};
