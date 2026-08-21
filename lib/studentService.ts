import { api } from './api';
import { API_ENDPOINTS } from './config';
import type { Role } from './auth';
import type { AcademicYear } from './academicYearService';
import type { SchoolClass } from './classService';

// ─── Student Admission service ──────────────────────────────────────────────
// Dedicated service for the student-admissions-controller endpoints, scoped
// per school (schoolCode is required on both create and list). Every
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
  schoolCode: string;
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
  schoolCode: string;
  createdAt: string;
}

export interface StudentSection {
  id: number;
  sectionName: string;
  schoolClass: SchoolClass;
}

export interface StudentAdmission {
  id: number;
  created: string;
  updated: string;
  user: StudentUser;
  admissionNumber: string;
  admissionSequence: number;
  admissionYear: string;
  academicYear: AcademicYear;
  section: StudentSection;
  admissionDate: string;
  fatherName: string;
  parentPhoneNumber: string;
  password: string;
  active: boolean;
  motherName: string;
}

export interface StudentAdmissionPage {
  content: StudentAdmission[];
  totalElements: number;
  totalPages: number;
  pageNumber: number;
  pageSize: number;
  last: boolean;
}

export interface StudentAdmissionListParams {
  /** Required by the backend — admissions are always scoped to one school. */
  schoolCode: string;
  page?: number;
  size?: number;
  sort?: string[];
}

// Fetched with a generous page size since DataTable sorts/paginates
// client-side over the full result set, same as getStaffMembers/getClasses.
/** Paginated student admission list for one school. Returns the raw Page<StudentAdmission> shape — no envelope. */
export const getStudentAdmissions = async ({
  schoolCode,
  page = 0,
  size = 200,
  sort,
}: StudentAdmissionListParams): Promise<StudentAdmissionPage> => {
  const response = await api.get<StudentAdmissionPage>(API_ENDPOINTS.STUDENT_ADMISSION.LIST, {
    params: { schoolCode, page, size, sort },
  });
  return response.data;
};

// The create response shape isn't documented — this call is fire-and-forget
// from the caller's point of view, which then reloads the list.
export const createStudentAdmission = async (data: NewAdmissionPayload): Promise<void> => {
  await api.post(API_ENDPOINTS.STUDENT_ADMISSION.CREATE, data);
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

/** One roster member as returned by the class roster endpoint — a lighter shape than StudentUser (no status/schoolCode/createdAt). */
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
