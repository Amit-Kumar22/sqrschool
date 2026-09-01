import { api } from './api';
import { API_ENDPOINTS } from './config';
import type { Role } from './auth';
import type { SchoolClass } from './classService';

// ─── Student Admission service ──────────────────────────────────────────────
// Dedicated service for the student-admissions-controller endpoints. Every
// endpoint here returns/accepts the raw entity — no {result} envelope.

export interface StudentUser {
  id: number;
  fullName: string;
  email: string;
  phone: string;
  role: Role;
  status: string;
  createdAt: string;
}

export interface StudentSection {
  id: number;
  sectionName: string;
  schoolClass: SchoolClass;
}

/** Lighter shape than SchoolClass — the admission list's nested class has no created/updated. */
export interface AdmissionSchoolClass {
  id: number;
  className: string;
  description: string | null;
  active: boolean;
}

export interface StudentAdmission {
  id: number;
  created: string;
  updated: string;
  studentUser: StudentUser;
  parentUser: StudentUser;
  admissionNumber: string;
  studentCode: string;
  rollNumber: string | null;
  schoolClass: AdmissionSchoolClass;
  admissionDate: string;
  fatherName: string;
  motherName: string;
  bloodGroup: string | null;
  dob: string | null;
  address: string;
  pincode: string;
  gender: string;
  active: boolean;
}

export interface StudentAdmissionPage {
  content: StudentAdmission[];
  totalElements: number;
  totalPages: number;
  pageNumber: number;
  pageSize: number;
  last: boolean;
}

export type FeeStatus = 'PENDING' | 'DUES' | 'PAID';

export interface StudentAdmissionListParams {
  page?: number;
  size?: number;
  sort?: string[];
  classId?: number;
  search?: string;
  feeStatus?: FeeStatus;
}

// Fetched with a generous page size since DataTable sorts/paginates
// client-side over the full result set, same as getStaffMembers/getClasses.
/** Paginated student admission list. Returns the raw Page<StudentAdmission> shape — no envelope. */
export const getStudentAdmissions = async ({
  page = 0,
  size = 200,
  sort,
  classId,
  search,
  feeStatus,
}: StudentAdmissionListParams = {}): Promise<StudentAdmissionPage> => {
  const response = await api.get<StudentAdmissionPage>(API_ENDPOINTS.STUDENT_ADMISSION.LIST, {
    params: { page, size, sort, classId, search, feeStatus },
  });
  return response.data;
};

// New admission and update now share one DTO on the backend — no password/
// section at creation time; class-section assignment is its own flow (see
// Student Class Section service below).
export interface StudentPayload {
  name: string;
  fatherName: string;
  motherName: string;
  parentEmail: string;
  parentPhone: string;
  classId: number;
  dob: string;
  address: string;
  pincode: string;
  gender: string;
}

export type NewAdmissionPayload = StudentPayload;
export type UpdateStudentPayload = StudentPayload;

// The create response shape isn't documented — this call is fire-and-forget
// from the caller's point of view, which then reloads the list.
export const createStudentAdmission = async (data: NewAdmissionPayload): Promise<void> => {
  await api.post(API_ENDPOINTS.STUDENT_ADMISSION.CREATE, data);
};

export const updateStudent = async (studentId: number, data: UpdateStudentPayload): Promise<void> => {
  await api.put(API_ENDPOINTS.STUDENT_ADMISSION.UPDATE(studentId), data);
};

export const deleteStudent = async (studentId: number): Promise<void> => {
  await api.put(API_ENDPOINTS.STUDENT_ADMISSION.DELETE(studentId));
};

// Bulk-imports students from a raw file (multipart/form-data, single `file`
// field). `api`'s instance default sets Content-Type: application/json —
// axios's transformRequest checks that against the current header and, if
// it matches, JSON.stringifies a FormData body instead of sending it as
// multipart (see defaults/index.js's isFormData branch), silently breaking
// the upload. Clearing Content-Type per-request avoids that; the browser
// then sets the correct multipart boundary itself. Response shape isn't
// documented by the API spec.
export const uploadStudentRawFile = async (file: File): Promise<unknown> => {
  const formData = new FormData();
  formData.append('file', file);
  const response = await api.post(API_ENDPOINTS.STUDENT_ADMISSION.RAW_FILE_UPLOAD, formData, {
    headers: { 'Content-Type': undefined },
  });
  return response.data;
};

// ─── Student Class Section service ──────────────────────────────────────────
// Dedicated service for the student-class-section-controller endpoints —
// assigns a student to a class + section. Every endpoint here
// returns/accepts the raw entity — no {result} envelope.

export interface StudentClassSectionPayload {
  studentId: number;
  classId: number;
  sectionId: number;
}

export interface StudentClassSection {
  id: number;
  student: StudentUser;
  schoolClass: SchoolClass;
  section: StudentSection;
}

export const createStudentClassSection = async (data: StudentClassSectionPayload): Promise<StudentClassSection> => {
  const response = await api.post<StudentClassSection>(API_ENDPOINTS.STUDENT_CLASS_SECTION.CREATE, data);
  return response.data;
};

export const getStudentClassSection = async (id: number): Promise<StudentClassSection> => {
  const response = await api.get<StudentClassSection>(API_ENDPOINTS.STUDENT_CLASS_SECTION.GET(id));
  return response.data;
};

export const updateStudentClassSection = async (id: number, data: StudentClassSectionPayload): Promise<StudentClassSection> => {
  const response = await api.put<StudentClassSection>(API_ENDPOINTS.STUDENT_CLASS_SECTION.UPDATE(id), data);
  return response.data;
};

export const deleteStudentClassSection = async (id: number): Promise<void> => {
  await api.delete(API_ENDPOINTS.STUDENT_CLASS_SECTION.DELETE(id));
};

/** One roster member as returned by the class roster endpoint — a lighter shape than StudentUser (no status/createdAt). */
export interface RosterStudent {
  id: number;
  fullName: string;
  email: string;
  phone: string;
  role: Role;
}

/** One section's roster for a class. */
export interface ClassSectionRoster {
  classId: number;
  className: string;
  sectionName: string;
  students: RosterStudent[];
}

export interface ClassSectionRosterPage {
  content: ClassSectionRoster[];
  totalElements: number;
  totalPages: number;
  pageNumber: number;
  pageSize: number;
  last: boolean;
}

export interface ClassSectionRosterParams {
  /** Required by the backend — the roster is always scoped to one class. */
  classId: number;
  page?: number;
  size?: number;
  sort?: string[];
}

/** Every section of a class, each with its rostered students. Returns the raw Page shape — no envelope. */
export const getClassSectionRoster = async ({
  classId,
  page = 0,
  size = 200,
  sort,
}: ClassSectionRosterParams): Promise<ClassSectionRosterPage> => {
  const response = await api.get<ClassSectionRosterPage>(API_ENDPOINTS.STUDENT_CLASS_SECTION.ROSTER(classId), {
    params: { classId, page, size, sort },
  });
  return response.data;
};
