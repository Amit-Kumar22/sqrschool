import { api } from './api';
import { API_ENDPOINTS } from './config';

// ─── Exam service ────────────────────────────────────────────────────────────
// Dedicated service for the exam-controller endpoints. Every endpoint here
// returns/accepts the raw entity — no {result} envelope.

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
  classId?: number;
  subjectId?: number;
  sectionId?: number;
  page?: number;
  size?: number;
  sort?: string[];
}

// Fetched with a generous page size since DataTable sorts/paginates
// client-side over the full result set, same as getClasses/getSchools.
/** Paginated exam list, optionally filtered by class/subject/section. Returns the raw Page<Exam> shape — no envelope. */
export const getExams = async ({
  classId,
  subjectId,
  sectionId,
  page = 0,
  size = 200,
  sort,
}: ExamListParams = {}): Promise<ExamPage> => {
  const response = await api.get<ExamPage>(API_ENDPOINTS.EXAM.LIST, {
    params: { classId, subjectId, sectionId, page, size, sort },
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
  options: QuestionOption[];
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
