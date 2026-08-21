import { api } from './api';
import { API_ENDPOINTS } from './config';
import type { Role } from './auth';
import type { StudentAdmissionPage } from './studentService';

// ─── School service ─────────────────────────────────────────────────────────
// Dedicated service for the school-detail-controller endpoints, kept separate
// from lib/api.ts since it's its own resource with its own response quirks
// (see the per-call comments below — unlike most endpoints, only POST wraps
// its result in the {statusCode, success, message, result} envelope).

export interface SchoolAddress {
  buildingName: string;
  streetName: string;
  landmark: string;
  district: string;
  city: string;
  pin: string;
  stateName: string;
}

export interface School {
  id: number;
  created: string;
  updated: string;
  schoolName: string;
  schoolCode: string;
  registrationNumber: string;
  affiliationBoard: string;
  establishedYear: number;
  email: string;
  phoneNumber: string;
  alternatePhone: string;
  website: string;
  logoUrl: string;
  principalName: string;
  totalStudents: number;
  totalTeachers: number;
  address: SchoolAddress;
  active: boolean;
}

export type SchoolPayload = Omit<School, 'id' | 'created' | 'updated' | 'active'>;

export interface SchoolPage {
  content: School[];
  totalElements: number;
  totalPages: number;
  pageNumber: number;
  pageSize: number;
  last: boolean;
}

/** Paginated list of every school. Returns the raw Page<School> shape — no envelope. */
export const getSchools = async (): Promise<SchoolPage> => {
  const response = await api.get<SchoolPage>(API_ENDPOINTS.SCHOOL.LIST);
  return response.data;
};

/**
 * The school-scoped list endpoints (classes, academic years, staff) require
 * a real schoolCode on GET and have no "every school" query mode (a literal
 * schoolCode=null 0-results on the live API). For an account with no linked
 * school, this is the only way to show cross-school data: list every school,
 * then fetch each one's records and merge them client-side.
 */
export async function fetchAcrossAllSchools<T>(
  fetchForSchool: (schoolCode: string) => Promise<{ content: T[] }>,
): Promise<T[]> {
  const schools = await getSchools();
  const pages = await Promise.all(
    schools.content.map((school) => fetchForSchool(school.schoolCode).catch(() => ({ content: [] as T[] }))),
  );
  return pages.flatMap((page) => page.content);
}

/** Full detail for a single school. Returns the raw entity — no envelope. */
export const getSchoolDetail = async (schoolId: number): Promise<School> => {
  const response = await api.get<School>(API_ENDPOINTS.SCHOOL.DETAIL(schoolId));
  return response.data;
};

// Unlike every other school endpoint, create responds wrapped in
// {statusCode, success, message, result} — confirmed against the API docs.
interface CreateSchoolResponse {
  statusCode: number;
  success: boolean;
  message: string;
  result: School;
}

export const createSchool = async (data: SchoolPayload): Promise<School> => {
  const response = await api.post<CreateSchoolResponse>(API_ENDPOINTS.SCHOOL.CREATE, data);
  return response.data.result;
};

/** Returns the raw updated entity — no envelope. */
export const updateSchool = async (id: number, data: SchoolPayload): Promise<School> => {
  const response = await api.put<School>(API_ENDPOINTS.SCHOOL.UPDATE(id), data);
  return response.data;
};

export const deleteSchool = async (id: number): Promise<void> => {
  await api.delete(API_ENDPOINTS.SCHOOL.DELETE(id));
};

// ─── Staff (Super Admin User APIs) ──────────────────────────────────────────
// Staff are added and listed against the logged-in principal's own school —
// only create + list are exposed by the backend today, no update/delete.

/** Roles assignable when adding a staff member from the school's Staff panel. */
export type StaffRole = 'TEACHER' | 'STAFF';

export interface AddStaffPayload {
  name: string;
  schoolCode: string;
  password: string;
  role: StaffRole;
  email: string;
  phoneNumber: string;
}

// Wrapped in {statusCode, success, message, result} — result is the plain
// success message/temp-password string returned by the backend, not an entity.
interface AddStaffResponse {
  statusCode: number;
  success: boolean;
  message: string;
  result: string;
}

export const addStaff = async (data: AddStaffPayload): Promise<string> => {
  const response = await api.post<AddStaffResponse>(API_ENDPOINTS.ADMIN.ADD_STAFF, data);
  return response.data.result;
};

export interface StaffMember {
  id: number;
  fullName: string;
  email: string;
  phone: string;
  role: Role;
}

export interface StaffPage {
  content: StaffMember[];
  totalElements: number;
  totalPages: number;
  pageNumber: number;
  pageSize: number;
  last: boolean;
}

export interface StaffListParams {
  /**
   * Required by the backend on GET — a literal string like "null" does NOT
   * mean "every school" (confirmed: GET /admin/all-staff?schoolCode=null
   * returns zero rows, a literal WHERE school_code = 'null' match). Callers
   * must have a real schoolCode; skip the call entirely if they don't.
   */
  schoolCode: string;
  role?: StaffRole;
  search?: string;
  page?: number;
  size?: number;
}

// Fetched with a generous page size since DataTable sorts/paginates
// client-side over the full result set, same as getSchools/getAcademicYears.
/** Paginated staff list for one school. Returns the raw Page<StaffMember> shape — no envelope. */
export const getStaffMembers = async ({
  schoolCode,
  role,
  search,
  page = 0,
  size = 200,
}: StaffListParams): Promise<StaffPage> => {
  const response = await api.get<StaffPage>(API_ENDPOINTS.ADMIN.ALL_STAFF, {
    params: { schoolCode, role, search, page, size },
  });
  return response.data;
};

// /v1/teacher/all-student reuses the exact same DTO as student admissions
// (admissionNumber, academicYear, section, parentPhoneNumber, etc.) even
// though it lists teachers — confirmed against the API docs. The top-level
// `id` is the teacher record's own id (what other endpoints' teacherId
// expects — confirmed by the backend rejecting the nested user.id with
// "Teacher detail not found"); `user.fullName` is still fine for display.
export interface TeacherListParams {
  /** Required by the backend — same schoolCode requirement as every other school-scoped list here. */
  schoolCode: string;
  page?: number;
  size?: number;
}

/** Paginated teacher list for one school, shaped like StudentAdmissionPage (see comment above). Returns the raw Page shape — no envelope. */
export const getAllTeachers = async ({ schoolCode, page = 0, size = 200 }: TeacherListParams): Promise<StudentAdmissionPage> => {
  const response = await api.get<StudentAdmissionPage>(API_ENDPOINTS.TEACHER.ALL_STUDENT, {
    params: { schoolCode, page, size },
  });
  return response.data;
};
