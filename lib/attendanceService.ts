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
  /** The class teacher's email — whose class roster to fetch. */
  reqEmail: string;
  page?: number;
  size?: number;
  sort?: string[];
}

/** Every student in the class taught by the class teacher matching reqEmail. Returns the raw Page shape — no envelope. */
export const getStudentsByClassTeacher = async ({
  reqEmail,
  page = 0,
  size = 10,
  sort,
}: ClassTeacherStudentParams): Promise<ClassTeacherStudentPage> => {
  const response = await api.get<ClassTeacherStudentPage>(API_ENDPOINTS.ATTENDANCE.ALL_STUDENTS_BY_CLASS_TEACHER, {
    params: { reqEmail, page, size, sort },
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
