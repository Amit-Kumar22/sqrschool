import { api } from './api';
import { API_ENDPOINTS } from './config';
import type { ExamStatus } from './examService';

// ─── Test service ────────────────────────────────────────────────────────────
// Dedicated service for the test-exam-controller endpoints — a single-subject
// unit test for one class, distinct from the multi-subject Exam resource in
// examService.ts. Every endpoint here returns/accepts the raw entity — no
// {result} envelope. Shares its status lifecycle with Exam (see ExamStatus).

export interface Test {
  id: number;
  titleName: string;
  description: string;
  schoolClassId: number;
  schoolClassName: string;
  subjectId: number;
  subjectName: string;
  durationMinutes: number;
  totalMarks: number;
  passingMarks: number;
  /** ISO date string. */
  startDate: string;
  status: ExamStatus;
}

export interface TestPayload {
  titleName: string;
  schoolClassId: number;
  subjectId: number;
  durationMinutes: number;
  totalMarks: number;
  passingMarks: number;
  startDate: string;
  status: ExamStatus;
  description: string;
}

export interface TestPage {
  content: Test[];
  totalElements: number;
  totalPages: number;
  pageNumber: number;
  pageSize: number;
  last: boolean;
}

export interface TestListParams {
  classId?: number;
  subjectId?: number;
  sectionId?: number;
  status?: ExamStatus;
  page?: number;
  size?: number;
  sort?: string[];
}

// Fetched with a generous page size since the Tests tab renders client-side
// over the full result set, same as getClasses/getExams.
/** Paginated test list, optionally filtered by class/subject/section/status. Returns the raw Page<Test> shape — no envelope. */
export const getTests = async ({
  classId,
  subjectId,
  sectionId,
  status,
  page = 0,
  size = 200,
  sort,
}: TestListParams = {}): Promise<TestPage> => {
  const response = await api.get<TestPage>(API_ENDPOINTS.TEST_EXAM.LIST, {
    params: { classId, subjectId, sectionId, status, page, size, sort },
  });
  return response.data;
};

export const getTest = async (id: number): Promise<Test> => {
  const response = await api.get<Test>(API_ENDPOINTS.TEST_EXAM.GET(id));
  return response.data;
};

// Some POST/mutating endpoints in this API wrap their response in
// {result: ...} while others return the raw entity — see the matching
// comment on examService.ts's unwrapExam for why this guards defensively.
function unwrapTest(data: Test | { result: Test }): Test {
  return (data as { result: Test })?.result ?? (data as Test);
}

export const createTest = async (data: TestPayload): Promise<Test> => {
  const response = await api.post<Test | { result: Test }>(API_ENDPOINTS.TEST_EXAM.CREATE, data);
  return unwrapTest(response.data);
};

export const updateTest = async (id: number, data: TestPayload): Promise<Test> => {
  const response = await api.put<Test | { result: Test }>(API_ENDPOINTS.TEST_EXAM.UPDATE(id), data);
  return unwrapTest(response.data);
};

export const deleteTest = async (id: number): Promise<void> => {
  await api.delete(API_ENDPOINTS.TEST_EXAM.DELETE(id));
};
