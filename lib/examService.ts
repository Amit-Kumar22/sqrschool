import { api } from './api';
import { API_ENDPOINTS } from './config';

// ─── Exam service ────────────────────────────────────────────────────────────
// Dedicated service for the exam-controller endpoints. Every endpoint here
// returns/accepts the raw entity — no {result} envelope.

// All 5 values are confirmed by the exam API spec's "Available values" list
// (ACTIVE replaces the older ONGOING value this app used previously).
export type ExamStatus = 'DRAFT' | 'PUBLISHED' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';

export const EXAM_STATUS_OPTIONS: ExamStatus[] = ['DRAFT', 'PUBLISHED', 'ACTIVE', 'COMPLETED', 'CANCELLED'];

// All 19 values are confirmed by the exam API spec's "Available values" list.
export type ExamType =
  | 'CLASS_TEST'
  | 'UNIT_TEST'
  | 'PERIODIC_TEST'
  | 'MID_TERM_EXAM'
  | 'HALF_YEARLY_EXAM'
  | 'ANNUAL_EXAM'
  | 'PRE_BOARD_EXAM'
  | 'BOARD_EXAM'
  | 'PRACTICAL_EXAM'
  | 'INTERNAL_ASSESSMENT'
  | 'PROJECT_ASSESSMENT'
  | 'VIVA'
  | 'ENTRANCE_EXAM'
  | 'SCHOLARSHIP_EXAM'
  | 'OLYMPIAD'
  | 'COMPETITIVE_EXAM'
  | 'MOCK_EXAM'
  | 'RE_EXAM'
  | 'SUPPLEMENTARY_EXAM';

export const EXAM_TYPE_OPTIONS: ExamType[] = [
  'CLASS_TEST',
  'UNIT_TEST',
  'PERIODIC_TEST',
  'MID_TERM_EXAM',
  'HALF_YEARLY_EXAM',
  'ANNUAL_EXAM',
  'PRE_BOARD_EXAM',
  'BOARD_EXAM',
  'PRACTICAL_EXAM',
  'INTERNAL_ASSESSMENT',
  'PROJECT_ASSESSMENT',
  'VIVA',
  'ENTRANCE_EXAM',
  'SCHOLARSHIP_EXAM',
  'OLYMPIAD',
  'COMPETITIVE_EXAM',
  'MOCK_EXAM',
  'RE_EXAM',
  'SUPPLEMENTARY_EXAM',
];

// A multi-subject exam's per-subject schedule entry — attached/replaced via
// the separate EXAM.SUBJECTS endpoint rather than living on ExamPayload.
export interface ExamSubjectPayload {
  subjectId: number;
  /** ISO date string. */
  examDate: string;
  durationMinutes: number;
  totalMarks: number;
  passingMarks: number;
}

export interface ExamSubjectSchedule extends ExamSubjectPayload {
  id: number;
  subjectName: string;
}

export interface Exam {
  id: number;
  title: string;
  examType: ExamType;
  description: string;
  classId: number;
  className: string;
  startDate: string;
  endDate: string;
  status: ExamStatus;
  subjects: ExamSubjectSchedule[];
  createdAt: string;
}

// Exam "header" only — subjects are attached separately via setExamSubjects,
// since the backend exposes them as their own sub-resource.
export interface ExamPayload {
  title: string;
  examType: ExamType;
  description: string;
  classId: number;
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
  classId?: number;
  examType?: ExamType;
  status?: ExamStatus;
  search?: string;
  page?: number;
  size?: number;
  sort?: string[];
}

// Fetched with a generous page size since the tab lists sort/render
// client-side over the full result set, same as getClasses/getSchools.
/** Paginated exam list, optionally filtered by class/type/status/search. Returns the raw Page<Exam> shape — no envelope. */
export const getExams = async ({
  classId,
  examType,
  status,
  search,
  page = 0,
  size = 200,
  sort,
}: ExamListParams = {}): Promise<ExamPage> => {
  const response = await api.get<ExamPage>(API_ENDPOINTS.EXAM.LIST, {
    params: { classId, examType, status, search, page, size, sort },
  });
  return response.data;
};

export const getExam = async (id: number): Promise<Exam> => {
  const response = await api.get<Exam>(API_ENDPOINTS.EXAM.GET(id));
  return response.data;
};

// Some POST/mutating endpoints in this API wrap their response in
// {result: ...} while others return the raw entity (already true of
// SCHOOL.CREATE/THEMES.CREATE elsewhere in this app) — the exam spec didn't
// document a response shape for these, so unwrap defensively rather than
// assume and risk `.id` silently coming back undefined (which then breaks
// EXAM.SUBJECTS's Long path variable downstream).
function unwrapExam(data: Exam | { result: Exam }): Exam {
  return (data as { result: Exam })?.result ?? (data as Exam);
}

export const createExam = async (data: ExamPayload): Promise<Exam> => {
  const response = await api.post<Exam | { result: Exam }>(API_ENDPOINTS.EXAM.CREATE, data);
  return unwrapExam(response.data);
};

export const updateExam = async (id: number, data: ExamPayload): Promise<Exam> => {
  const response = await api.put<Exam | { result: Exam }>(API_ENDPOINTS.EXAM.UPDATE(id), data);
  return unwrapExam(response.data);
};

export const deleteExam = async (id: number): Promise<void> => {
  await api.delete(API_ENDPOINTS.EXAM.DELETE(id));
};

/** Replaces the exam's full per-subject schedule — pair with clearExamSubjects on edit to avoid appending duplicates. */
export const setExamSubjects = async (examId: number, subjects: ExamSubjectPayload[]): Promise<Exam> => {
  const response = await api.post<Exam | { result: Exam }>(API_ENDPOINTS.EXAM.SUBJECTS(examId), subjects);
  return unwrapExam(response.data);
};

export const clearExamSubjects = async (examId: number): Promise<void> => {
  await api.delete(API_ENDPOINTS.EXAM.SUBJECTS(examId));
};

// ─── Question service ────────────────────────────────────────────────────────
// Dedicated section for the question-controller endpoints — the question
// bank an exam draws from. Every endpoint here returns/accepts the raw
// entity — no {result} envelope.
//
// The list endpoints (LIST/BY_SUBJECT/BY_SUBJECT_AND_TYPE) have no examId
// filter and the returned Question shape carries no examId either — only
// POST/PUT take one, to tag which exam a question was authored for. So
// "list questions for exam X" isn't something the backend supports directly;
// callers instead browse the exam's *subject* question bank (BY_SUBJECT /
// BY_SUBJECT_AND_TYPE) — see the Manage Questions page for how this plays out.

export type QuestionType = 'MCQ' | 'TRUE_FALSE' | 'SHORT_ANSWER' | 'LONG_ANSWER';

// Only "EASY" is confirmed by the API spec — MEDIUM/HARD are the expected
// remaining levels. Unrecognized values still render fine (see
// DifficultyBadge's fallback in components/ui/Badge.tsx) rather than erroring.
export type QuestionDifficulty = 'EASY' | 'MEDIUM' | 'HARD';

export interface QuestionOptionPayload {
  optionText: string;
  correct: boolean;
  optionOrder: number;
}

export interface QuestionOption extends QuestionOptionPayload {
  id: number;
}

export interface Question {
  id: number;
  questionText: string;
  type: QuestionType;
  marks: number;
  difficulty: QuestionDifficulty;
  subjectId: number;
  subjectName: string;
  modelAnswer: string;
  // The backend returns null (not []) for question types with no options,
  // e.g. SHORT_ANSWER/LONG_ANSWER, which just use modelAnswer instead.
  options: QuestionOption[] | null;
}

export interface QuestionPayload {
  examId: number;
  questionOrder: number;
  questionText: string;
  type: QuestionType;
  marks: number;
  difficulty: QuestionDifficulty;
  subjectId: number;
  modelAnswer: string;
  options: QuestionOptionPayload[];
}

export interface QuestionPage {
  content: Question[];
  totalElements: number;
  totalPages: number;
  pageNumber: number;
  pageSize: number;
  last: boolean;
}

export interface QuestionListParams {
  page?: number;
  size?: number;
  sort?: string[];
}

/** Every question in the school's bank. Returns the raw Page<Question> shape — no envelope. */
export const getQuestions = async ({ page = 0, size = 200, sort }: QuestionListParams = {}): Promise<QuestionPage> => {
  const response = await api.get<QuestionPage>(API_ENDPOINTS.QUESTION.LIST, {
    params: { page, size, sort },
  });
  return response.data;
};

export const getQuestion = async (id: number): Promise<Question> => {
  const response = await api.get<Question>(API_ENDPOINTS.QUESTION.GET(id));
  return response.data;
};

export const createQuestion = async (data: QuestionPayload): Promise<Question> => {
  const response = await api.post<Question>(API_ENDPOINTS.QUESTION.CREATE, data);
  return response.data;
};

export const updateQuestion = async (id: number, data: QuestionPayload): Promise<Question> => {
  const response = await api.put<Question>(API_ENDPOINTS.QUESTION.UPDATE(id), data);
  return response.data;
};

export const deleteQuestion = async (id: number): Promise<void> => {
  await api.delete(API_ENDPOINTS.QUESTION.DELETE(id));
};

export interface QuestionsBySubjectParams {
  subjectId: number;
  page?: number;
  size?: number;
  sort?: string[];
}

/** The question bank for one subject — used to browse/manage questions for an exam via its subject. Returns the raw Page<Question> shape — no envelope. */
export const getQuestionsBySubject = async ({
  subjectId,
  page = 0,
  size = 200,
  sort,
}: QuestionsBySubjectParams): Promise<QuestionPage> => {
  const response = await api.get<QuestionPage>(API_ENDPOINTS.QUESTION.BY_SUBJECT(subjectId), {
    params: { subjectId, page, size, sort },
  });
  return response.data;
};

export interface QuestionsBySubjectAndTypeParams {
  subjectId: number;
  type: QuestionType;
  page?: number;
  size?: number;
  sort?: string[];
}

/** The question bank for one subject, filtered to one question type. Returns the raw Page<Question> shape — no envelope. */
export const getQuestionsBySubjectAndType = async ({
  subjectId,
  type,
  page = 0,
  size = 200,
  sort,
}: QuestionsBySubjectAndTypeParams): Promise<QuestionPage> => {
  const response = await api.get<QuestionPage>(API_ENDPOINTS.QUESTION.BY_SUBJECT_AND_TYPE(subjectId, type), {
    params: { subjectId, type, page, size, sort },
  });
  return response.data;
};
