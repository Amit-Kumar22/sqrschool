import { api } from './api';
import { API_ENDPOINTS } from './config';
import type { Role } from './auth';
import type { Coordinates } from './geo';

// ─── Attendance service ──────────────────────────────────────────────────────
// Dedicated service for the attendance-controller endpoints — the class
// teacher's roster lookup plus GPS-based check-in/check-out for both
// teachers and students. Every endpoint here returns/accepts the raw shape —
// no {result} envelope.

/** Only "GPS" is documented today; kept as a union with a string fallback in case another source is added later. */
export type AttendanceSource = 'GPS' | (string & {});

/** Same shape as RosterStudent (lib/studentService.ts) — the class-teacher roster reuses it verbatim. */
export interface ClassTeacherStudent {
  id: number;
  fullName: string;
  email: string;
  phone: string;
  role: Role;
}

export interface ClassTeacherStudentPage {
  content: ClassTeacherStudent[];
  totalElements: number;
  totalPages: number;
  pageNumber: number;
  pageSize: number;
  last: boolean;
}

export interface ClassTeacherStudentParams {
  /** The class teacher's email — whose class roster to fetch. Omit to fetch every student across all classes. */
  reqEmail?: string;
  page?: number;
  size?: number;
  sort?: string[];
}

/** Students in the class taught by the class teacher matching reqEmail, or every student when reqEmail is omitted. Returns the raw Page shape — no envelope. */
export const getStudentsByClassTeacher = async ({
  reqEmail,
  page = 0,
  size = 10,
  sort,
}: ClassTeacherStudentParams): Promise<ClassTeacherStudentPage> => {
  const response = await api.get<ClassTeacherStudentPage>(API_ENDPOINTS.ATTENDANCE.ALL_STUDENTS_BY_CLASS_TEACHER, {
    params: { reqEmail: reqEmail || undefined, page, size, sort },
  });
  return response.data;
};

interface AttendanceBody extends Coordinates {
  attendanceSource: AttendanceSource;
}

/** Checks a student in — called by that student's class teacher, using the teacher's own GPS position. */
export const checkInStudent = async (studentUserId: number, coords: Coordinates): Promise<void> => {
  const body: AttendanceBody = { attendanceSource: 'GPS', ...coords };
  await api.post(API_ENDPOINTS.ATTENDANCE.STUDENT_CHECK_IN, body, { params: { studentUserId } });
};

/** Checks the currently signed-in teacher in. */
export const checkInTeacher = async (coords: Coordinates): Promise<void> => {
  const body: AttendanceBody = { attendanceSource: 'GPS', ...coords };
  await api.post(API_ENDPOINTS.ATTENDANCE.TEACHER_CHECK_IN, body);
};

/**
 * Checks the currently signed-in user out. The endpoint carries no student
 * identifier, so it only ever applies to the caller's own attendance — used
 * here for the teacher's self check-out.
 */
export const checkOut = async (coords: Coordinates): Promise<void> => {
  const body: AttendanceBody = { attendanceSource: 'GPS', ...coords };
  await api.post(API_ENDPOINTS.ATTENDANCE.CHECK_OUT, body);
};

export type AttendanceStatus = 'PRESENT' | 'ABSENT' | 'HALF_DAY' | 'LATE' | 'HOLIDAY' | 'LOGOUT' | 'WEEKEND';

/** A single day's attendance record. Carries `name` (not a user id) as the only link back to the person it belongs to. */
export interface Attendance {
  id: number;
  name: string;
  attendanceDate: string;
  loginTime: string | null;
  logoutTime: string | null;
  totalWorkingMinutes: number | null;
  minutesLate: number | null;
  status: AttendanceStatus;
  attendanceSource: AttendanceSource;
  remarks: string | null;
}

interface AttendanceListResponse {
  statusCode: number;
  message: string;
  result: Attendance[];
}

/**
 * Every attendance record (teachers and students) for one calendar date
 * (`YYYY-MM-DD`), admin-wide. There's no per-teacher filter on this
 * endpoint or a user-id field on the record, so to build one teacher's
 * history, call this per date and match rows where `name` equals that
 * teacher's fullName. Wrapped in {statusCode, message, result} — confirmed
 * against the live API, unlike the rest of this file's endpoints.
 */
export const getAttendanceByDate = async (date: string): Promise<Attendance[]> => {
  const response = await api.get<AttendanceListResponse>(API_ENDPOINTS.ATTENDANCE.BY_DATE(date));
  return response.data.result;
};
