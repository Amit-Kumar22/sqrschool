import { api } from './api';
import { API_ENDPOINTS } from './config';
import type { Role } from './auth';
import type { Coordinates } from './geo';

// ─── Attendance service ──────────────────────────────────────────────────────
// Dedicated service for the attendance-controller endpoints — the class
// teacher's roster lookup, GPS-based check-in/check-out for both teachers
// and students, and per-user attendance history/today-status lookups. Most
// endpoints return/accept the raw shape (no envelope); getUserTodayAttendance
// is the one exception, wrapped in {statusCode, message, result}.

/** "GPS" and "QR_CODE" are documented today; kept as a union with a string fallback in case another source is added later. */
export type AttendanceSource = 'GPS' | 'QR_CODE' | (string & {});

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

/** One day's attendance record for one user. */
export interface Attendance {
  id: number;
  created: string;
  updated: string;
  name: string;
  attendanceDate: string;
  loginTime: string | null;
  logoutTime: string | null;
  checkinScanLatitude: number | null;
  checkinScanLongitude: number | null;
  checkoutScanLatitude: number | null;
  checkoutScanLongitude: number | null;
  attendanceQRCode: string | null;
  checkIndistanceFromOffice: string | null;
  checkOutdistanceFromOffice: string | null;
  totalWorkingMinutes: number | null;
  minutesLate: number | null;
  status: AttendanceStatus;
  attendanceSource: AttendanceSource;
  remarks: string | null;
  updateBy: string | null;
  active: boolean;
}

export interface AttendancePage {
  content: Attendance[];
  totalElements: number;
  totalPages: number;
  pageNumber: number;
  pageSize: number;
  last: boolean;
}

export interface UserAttendanceParams {
  userId: number;
  /** Inclusive range bounds, `YYYY-MM-DD`. Omit either to leave that side open. */
  startDate?: string;
  endDate?: string;
  page?: number;
  size?: number;
  sort?: string[];
}

/** One user's (teacher or student) attendance history, optionally bounded by a date range. Returns the raw Page shape — no envelope. */
export const getUserAttendance = async ({
  userId,
  startDate,
  endDate,
  page = 0,
  size = 31,
  sort,
}: UserAttendanceParams): Promise<AttendancePage> => {
  const response = await api.get<AttendancePage>(API_ENDPOINTS.ATTENDANCE.USER_ALL(userId), {
    params: { startDate, endDate, page, size, sort },
  });
  return response.data;
};

interface AttendanceResultResponse {
  statusCode: number;
  message: string;
  result: Attendance | null;
}

/** Today's attendance record for one user, or null if they haven't checked in yet today. */
export const getUserTodayAttendance = async (userId: number): Promise<Attendance | null> => {
  try {
    const response = await api.get<AttendanceResultResponse>(API_ENDPOINTS.ATTENDANCE.USER_TODAY(userId));
    return response.data.result ?? null;
  } catch (err) {
    if ((err as { response?: { status?: number } })?.response?.status === 404) return null;
    throw err;
  }
};
