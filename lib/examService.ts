import { api } from './api';
import { API_ENDPOINTS } from './config';

// ─── Exam service ────────────────────────────────────────────────────────────
// Dedicated service for the exam-controller endpoints, scoped per school
// (schoolCode is required on create/update and as a list filter). Every
// endpoint here returns/accepts the raw entity — no {result} envelope.

// Only "DRAFT" is confirmed by the API spec — the rest are the expected
// lifecycle stages. Unrecognized values still render fine (see
// ExamStatusBadge's fallback in components/ui/Badge.tsx) rather than erroring.
export type ExamStatus = 'DRAFT' | 'PUBLISHED' | 'ONGOING' | 'COMPLETED' | 'CANCELLED';

export interface ExamSection {
  id: number;
  name: string;
}

export interface Exam {
  id: number;
  name: string;
  description: string;
  schoolId: number;
  schoolName: string;
  schoolCode: string;
  schoolClassId: number;
  schoolClassName: string;
  subjectId: number;
  subjectName: string;
  sections: ExamSection[];
  durationMinutes: number;
  totalMarks: number;
  passingMarks: number;
  startDate: string;
  endDate: string;
  status: ExamStatus;
}

export interface ExamPayload {
  name: string;
  description: string;
  schoolCode: string;
  schoolClassId: number;
  subjectId: number;
  sectionIds: number[];
  durationMinutes: number;
  totalMarks: number;
  passingMarks: number;
  startDate: string;
  endDate: string;
  status: ExamStatus;
}

export interface ExamPage {
  content: Exam[];
  totalElements: number;
  totalPages: number;
  pageNumber: number;
  pageSize: number;
  last: boolean;
}

export interface ExamListParams {
  /** Required by the backend — exams are always scoped to one school. */
  schoolCode: string;
  classId?: number;
  subjectId?: number;
  sectionId?: number;
  page?: number;
  size?: number;
  sort?: string[];
}

// Fetched with a generous page size since DataTable sorts/paginates
// client-side over the full result set, same as getClasses/getAcademicYears.
/** Paginated exam list for one school, optionally filtered by class/subject/section. Returns the raw Page<Exam> shape — no envelope. */
export const getExams = async ({
  schoolCode,
  classId,
  subjectId,
  sectionId,
  page = 0,
  size = 200,
  sort,
}: ExamListParams): Promise<ExamPage> => {
  const response = await api.get<ExamPage>(API_ENDPOINTS.EXAM.LIST, {
    params: { schoolCode, classId, subjectId, sectionId, page, size, sort },
  });
  return response.data;
};

export const getExam = async (id: number): Promise<Exam> => {
  const response = await api.get<Exam>(API_ENDPOINTS.EXAM.GET(id));
  return response.data;
};

export const createExam = async (data: ExamPayload): Promise<Exam> => {
  const response = await api.post<Exam>(API_ENDPOINTS.EXAM.CREATE, data);
  return response.data;
};

export const updateExam = async (id: number, data: ExamPayload): Promise<Exam> => {
  const response = await api.put<Exam>(API_ENDPOINTS.EXAM.UPDATE(id), data);
  return response.data;
};

export const deleteExam = async (id: number): Promise<void> => {
  await api.delete(API_ENDPOINTS.EXAM.DELETE(id));
};
