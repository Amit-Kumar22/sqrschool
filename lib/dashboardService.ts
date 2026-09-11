import { api } from './api';
import type { ApiEnvelope } from './api';
import { API_ENDPOINTS } from './config';
import type { AttendanceStatus } from './attendanceService';
import type { ExamResult } from './examService';
import type { NoticeAudience, NoticePriority, NoticeStatus } from './noticeService';

// ─── Dashboard service ────────────────────────────────────────────────────────
// Dedicated service for the four dashboard-controller groups (admin, teacher,
// parent, student). Every endpoint here uses the standard {statusCode,
// message, result} envelope.

// ─── Shared sub-shapes ────────────────────────────────────────────────────────

/**
 * Notice summary embedded in every dashboard payload. Deliberately not the
 * full `Notice` entity (lib/noticeService.ts) — that nests `author` as an
 * object and carries attachment/remarks fields no dashboard needs; this is
 * the flattened `authorName` shape every dashboard endpoint actually returns.
 */
export interface DashboardNotice {
  id: number;
  title: string;
  content: string;
  audience: NoticeAudience;
  priority: NoticePriority;
  status: NoticeStatus;
  authorName: string;
  publishDate: string;
  expiryDate: string;
}

export interface DashboardTimetableEntry {
  periodName: string;
  subjectName: string;
  teacherName: string;
  startTime: string;
  endTime: string;
  dayOfWeek: string;
  breakPeriod: boolean;
}

/**
 * Shared shape for the admin's attendance-overview and fee-overview
 * endpoints — both are confirmed to return this identical fee-shaped
 * structure (the attendance-overview name doesn't carry a percentage/
 * present-count field, per the confirmed API spec).
 */
export interface FinanceOverview {
  totalFeeAmount: number;
  totalCollectedAmount: number;
  totalPendingAmount: number;
  totalOverdueAmount: number;
  paidCount: number;
  pendingCount: number;
  partialCount: number;
  overdueCount: number;
  collectionPercentage: number;
}

// Only "PENDING"/"APPROVED"/"REJECTED" are the usual lifecycle states for a
// leave request; kept as a union with a string fallback since no dedicated
// leave service exists yet to confirm the full enum against.
export type LeaveType = 'SICK' | (string & {});
export type LeaveStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | (string & {});

export interface LeaveRecord {
  leaveId: number;
  leaveType: LeaveType;
  status: LeaveStatus;
  fromDate: string;
  toDate: string;
  numberOfDays: number;
  reason: string;
}

export interface LeaveSummary {
  approvedDays: number;
  pendingCount: number;
  rejectedCount: number;
  recentLeaves: LeaveRecord[];
}

// ─── Admin / Principal dashboard ─────────────────────────────────────────────

/** Fee-shaped overview — see FinanceOverview's doc comment for why this is not attendance-shaped. */
export const getAdminAttendanceOverview = async (): Promise<FinanceOverview> => {
  const response = await api.get<ApiEnvelope<FinanceOverview>>(API_ENDPOINTS.DASHBOARD.ADMIN_ATTENDANCE_OVERVIEW);
  return response.data.result;
};

export interface ClassStat {
  classId: number;
  className: string;
  studentCount: number;
  teacherCount: number;
  feeStructureCount: number;
}

export const getAdminClassStats = async (): Promise<ClassStat[]> => {
  const response = await api.get<ApiEnvelope<ClassStat[]>>(API_ENDPOINTS.DASHBOARD.ADMIN_CLASS_STATS);
  return response.data.result ?? [];
};

export const getAdminFeeOverview = async (): Promise<FinanceOverview> => {
  const response = await api.get<ApiEnvelope<FinanceOverview>>(API_ENDPOINTS.DASHBOARD.ADMIN_FEE_OVERVIEW);
  return response.data.result;
};

/** Most recent notices for the admin dashboard feed, newest first. */
export const getAdminRecentNotices = async (limit = 5): Promise<DashboardNotice[]> => {
  const response = await api.get<ApiEnvelope<DashboardNotice[]>>(API_ENDPOINTS.DASHBOARD.ADMIN_RECENT_NOTICES, {
    params: { limit },
  });
  return response.data.result ?? [];
};

export interface RevenueTrendPoint {
  month: number;
  year: number;
  monthName: string;
  revenue: number;
  paymentCount: number;
}

export const getAdminRevenueTrend = async (months = 6): Promise<RevenueTrendPoint[]> => {
  const response = await api.get<ApiEnvelope<RevenueTrendPoint[]>>(API_ENDPOINTS.DASHBOARD.ADMIN_REVENUE_TREND, {
    params: { months },
  });
  return response.data.result ?? [];
};

export interface AdminDashboardSummary {
  totalStudents: number;
  totalTeachers: number;
  totalClasses: number;
  totalSubjects: number;
  totalActiveUsers: number;
  totalNotices: number;
  totalExams: number;
}

export const getAdminDashboardSummary = async (): Promise<AdminDashboardSummary> => {
  const response = await api.get<ApiEnvelope<AdminDashboardSummary>>(API_ENDPOINTS.DASHBOARD.ADMIN_SUMMARY);
  return response.data.result;
};

// ─── Teacher dashboard ────────────────────────────────────────────────────────

export interface TeacherDashboardProfile {
  teacherId: number;
  fullName: string;
  employeeCode: string;
  email: string;
  phone: string;
  primarySubject: string;
  qualification: string;
  experienceYears: number;
  assignedClassNames: string[];
}

export interface TeacherAssignedClass {
  classId: number;
  className: string;
  studentCount: number;
  isClassTeacher: boolean;
}

export interface TeacherStudentOverview {
  totalStudents: number;
  activeStudents: number;
  totalClasses: number;
}

export interface TeacherAttendanceOverview {
  date: string;
  presentCount: number;
  absentCount: number;
  lateCount: number;
  totalRecords: number;
  attendancePercentage: number;
}

export interface TeacherExamSummary {
  upcomingExams: number;
  completedExams: number;
  pendingResults: number;
}

export interface TeacherHomeworkSummary {
  totalHomework: number;
  thisWeekHomework: number;
}

export interface TeacherDashboard {
  profile: TeacherDashboardProfile;
  assignedClasses: TeacherAssignedClass[];
  studentOverview: TeacherStudentOverview;
  attendanceOverview: TeacherAttendanceOverview;
  examSummary: TeacherExamSummary;
  todayTimetable: DashboardTimetableEntry[];
  recentNotices: DashboardNotice[];
  homeworkSummary: TeacherHomeworkSummary;
}

export const getTeacherDashboard = async (): Promise<TeacherDashboard> => {
  const response = await api.get<ApiEnvelope<TeacherDashboard>>(API_ENDPOINTS.DASHBOARD.TEACHER);
  return response.data.result;
};

// ─── Student dashboard (bundle shape reused by the parent's selectedChildDetail) ───

export interface StudentDashboardProfile {
  studentId: number;
  fullName: string;
  admissionNumber: string;
  rollNumber: string;
  className: string;
  academicYear: string;
  dateOfBirth: string;
  gender: string;
  fatherName: string;
  motherName: string;
  parentEmail: string;
  studentEmail: string;
  phone: string;
}

export interface AttendanceRecordEntry {
  date: string;
  status: AttendanceStatus;
  loginTime: string;
  logoutTime: string;
  totalWorkingMinutes: number;
}

export interface StudentAttendanceSummary {
  totalDays: number;
  presentDays: number;
  absentDays: number;
  lateDays: number;
  halfDays: number;
  attendancePercentage: number;
  recentAttendance: AttendanceRecordEntry[];
}

export interface StudentFeeSummary {
  totalFees: number;
  paidAmount: number;
  pendingAmount: number;
  paidCount: number;
  pendingCount: number;
  overdueCount: number;
  collectionPercentage: number;
}

export interface UpcomingExamEntry {
  examId: number;
  title: string;
  examType: string;
  startDate: string;
  endDate: string;
  status: string;
  className: string;
}

export interface StudentExamSummary {
  totalExams: number;
  passedExams: number;
  failedExams: number;
  upcomingExams: number;
  averagePercentage: number;
  upcomingExamList: UpcomingExamEntry[];
}

/** The shared bundle behind both the student dashboard and the parent dashboard's selectedChildDetail. */
export interface StudentDetailBundle {
  profile: StudentDashboardProfile;
  attendance: StudentAttendanceSummary;
  fees: StudentFeeSummary;
  exams: StudentExamSummary;
  todayTimetable: DashboardTimetableEntry[];
  leave: LeaveSummary;
  recentResults: ExamResult[];
}

export interface StudentDashboard extends StudentDetailBundle {
  recentNotices: DashboardNotice[];
}

export const getStudentDashboard = async (): Promise<StudentDashboard> => {
  const response = await api.get<ApiEnvelope<StudentDashboard>>(API_ENDPOINTS.DASHBOARD.STUDENT);
  return response.data.result;
};

// ─── Parent dashboard ─────────────────────────────────────────────────────────

export interface ParentProfile {
  userId: number;
  fullName: string;
  email: string;
  phone: string;
  numberOfChildren: number;
}

export interface ParentChild {
  studentId: number;
  fullName: string;
  admissionNumber: string;
  className: string;
  rollNumber: string;
}

export type ParentChildDetail = StudentDetailBundle;

export interface ParentDashboard {
  profile: ParentProfile;
  children: ParentChild[];
  selectedChildDetail?: ParentChildDetail;
  recentNotices: DashboardNotice[];
}

/** `studentId` selects which child's detail comes back in `selectedChildDetail`; omit for the parent's default/first child. */
export const getParentDashboard = async (studentId?: number): Promise<ParentDashboard> => {
  const response = await api.get<ApiEnvelope<ParentDashboard>>(API_ENDPOINTS.DASHBOARD.PARENT, {
    params: { studentId },
  });
  return response.data.result;
};
