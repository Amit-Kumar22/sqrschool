import { api } from './api';
import { API_ENDPOINTS } from './config';
import type { Role } from './auth';
import type { SchoolClass } from './classService';

// ─── Student Admission service ──────────────────────────────────────────────
// Dedicated service for the student-admissions-controller endpoints. Every
// endpoint here returns/accepts the raw entity — no {result} envelope.

export interface StudentAddress {
  buildingName: string;
  streetName: string;
  landmark: string;
  district: string;
  city: string;
  pin: string;
  stateName: string;
}

export interface NewAdmissionPayload {
  academicYearId: number;
  name: string;
  phone: string;
  fatherName: string;
  motherName: string;
  password: string;
  sectionId: number;
  address: StudentAddress;
}

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

/** Lighter shape than SchoolClass — the admission list's nested class has no created/updated/active. */
export interface AdmissionSchoolClass {
  id: number;
  className: string;
  description: string | null;
}

export interface StudentAdmission {
  id: number;
  created: string;
  updated: string;
  studentUser: StudentUser;
  parentUser: StudentUser;
  admissionNumber: string;
  studentCode: string;
  academicYear: string;
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

// The create response shape isn't documented — this call is fire-and-forget
// from the caller's point of view, which then reloads the list.
export const createStudentAdmission = async (data: NewAdmissionPayload): Promise<void> => {
  await api.post(API_ENDPOINTS.STUDENT_ADMISSION.CREATE, data);
};

export interface UpdateStudentPayload {
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

export const updateStudent = async (studentId: number, data: UpdateStudentPayload): Promise<void> => {
  await api.put(API_ENDPOINTS.STUDENT_ADMISSION.UPDATE(studentId), data);
};

export const deleteStudent = async (studentId: number): Promise<void> => {
  await api.put(API_ENDPOINTS.STUDENT_ADMISSION.DELETE(studentId));
};

// ─── Student Class Section service ──────────────────────────────────────────
// Dedicated service for the student-class-section-controller endpoints —
// assigns a student to a class + section for an academic year. Every
// endpoint here returns/accepts the raw entity — no {result} envelope.

export interface StudentClassSectionPayload {
  studentId: number;
  classId: number;
  sectionId: number;
  academicYear: string;
}

export interface StudentClassSection {
  id: number;
  student: StudentUser;
  schoolClass: SchoolClass;
  section: StudentSection;
  academicYear: string;
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

/** One section's roster for a class + academic year. */
export interface ClassSectionRoster {
  classId: number;
  className: string;
  sectionName: string;
  academicYear: string;
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
  academicYear?: string;
  page?: number;
  size?: number;
  sort?: string[];
}

/** Every section of a class, each with its rostered students for an academic year. Returns the raw Page shape — no envelope. */
export const getClassSectionRoster = async ({
  classId,
  academicYear,
  page = 0,
  size = 200,
  sort,
}: ClassSectionRosterParams): Promise<ClassSectionRosterPage> => {
  const response = await api.get<ClassSectionRosterPage>(API_ENDPOINTS.STUDENT_CLASS_SECTION.ROSTER(classId), {
    params: { classId, academicYear, page, size, sort },
  });
  return response.data;
};
