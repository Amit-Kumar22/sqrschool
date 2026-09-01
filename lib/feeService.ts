import { api } from './api';
import { API_ENDPOINTS } from './config';

// ─── Fee Structure service ───────────────────────────────────────────────────
// Dedicated service for the fee-structure-controller endpoints. Every
// endpoint here returns/accepts the raw entity — no {result} envelope.

// Only "TUITION_FEE" is confirmed by the API spec — the rest are the usual
// fee categories for a school. Unrecognized values still render fine (see
// FeeTypeBadge's fallback in components/ui/Badge.tsx) rather than erroring.
export type FeeType = 'TUITION_FEE' | 'ADMISSION_FEE' | 'EXAM_FEE' | 'TRANSPORT_FEE' | 'LIBRARY_FEE' | 'MISCELLANEOUS_FEE';

// Only "ONE_TIME" is confirmed by the API spec — the rest are the usual
// billing cadences for a school fee. Unrecognized values still render fine
// (see FeeFrequencyBadge's fallback in components/ui/Badge.tsx) rather than erroring.
export type FeeFrequency = 'ONE_TIME' | 'MONTHLY' | 'QUARTERLY' | 'HALF_YEARLY' | 'ANNUALLY';

export interface FeeStructure {
  id: number;
  title: string;
  classId: number;
  className: string;
  academicYear: string;
  feeType: FeeType;
  frequency: FeeFrequency;
  amount: number;
  description: string;
  createdAt: string;
}

export interface FeeStructurePayload {
  title: string;
  classId: number;
  academicYear: string;
  frequency: FeeFrequency;
  feeType: FeeType;
  amount: number;
  description: string;
}

export interface FeeStructurePage {
  content: FeeStructure[];
  totalElements: number;
  totalPages: number;
  pageNumber: number;
  pageSize: number;
  last: boolean;
}

export interface FeeStructureListParams {
  classId?: number;
  page?: number;
  size?: number;
  sort?: string[];
}

// Fetched with a generous page size since DataTable sorts/paginates
// client-side over the full result set, same as getClasses/getSchools.
/** Paginated fee structure list, optionally filtered by class. Returns the raw Page<FeeStructure> shape — no envelope. */
export const getFeeStructures = async ({
  classId,
  page = 0,
  size = 200,
  sort,
}: FeeStructureListParams = {}): Promise<FeeStructurePage> => {
  const response = await api.get<FeeStructurePage>(API_ENDPOINTS.FEE_STRUCTURE.LIST, {
    params: { classId, page, size, sort },
  });
  return response.data;
};

export const getFeeStructure = async (id: number): Promise<FeeStructure> => {
  const response = await api.get<FeeStructure>(API_ENDPOINTS.FEE_STRUCTURE.GET(id));
  return response.data;
};

export const createFeeStructure = async (data: FeeStructurePayload): Promise<FeeStructure> => {
  const response = await api.post<FeeStructure>(API_ENDPOINTS.FEE_STRUCTURE.CREATE, data);
  return response.data;
};

export const updateFeeStructure = async (id: number, data: FeeStructurePayload): Promise<FeeStructure> => {
  const response = await api.put<FeeStructure>(API_ENDPOINTS.FEE_STRUCTURE.UPDATE(id), data);
  return response.data;
};

export const deleteFeeStructure = async (id: number): Promise<void> => {
  await api.delete(API_ENDPOINTS.FEE_STRUCTURE.DELETE(id));
};

// ─── Student Fee service ─────────────────────────────────────────────────────
// Dedicated service for the student-fees-controller endpoints — a student
// fee is one instance of a fee structure billed to a student (generated,
// paid against, tracked to PAID/OVERDUE). Every endpoint here
// returns/accepts the raw entity — no {result} envelope.

export type StudentFeeStatus = 'PENDING' | 'PARTIAL' | 'PAID' | 'OVERDUE';

// Only "CASH" is confirmed by the API spec — the rest are the usual payment
// modes for a school. Unrecognized values still render as plain text since
// this isn't shown as a tinted badge.
export type PaymentMode = 'CASH' | 'CARD' | 'UPI' | 'NET_BANKING' | 'CHEQUE';

export interface StudentFee {
  id: number;
  studentId: number;
  studentName: string;
  classId: number;
  className: string;
  feeStructureId: number;
  feeType: FeeType;
  amount: number;
  paidAmount: number;
  dueAmount: number;
  dueDate: string;
  status: StudentFeeStatus;
}

export interface StudentFeePage {
  content: StudentFee[];
  totalElements: number;
  totalPages: number;
  pageNumber: number;
  pageSize: number;
  last: boolean;
}

export interface StudentFeeListParams {
  classId?: number;
  studentId?: number;
  status?: StudentFeeStatus;
  page?: number;
  size?: number;
  sort?: string[];
}

// Fetched with a generous page size since DataTable/report views sort and
// total client-side over the full result set, same as getFeeStructures.
/** Paginated student fee list, optionally filtered by class/student/status. Returns the raw Page<StudentFee> shape — no envelope. */
export const getStudentFees = async ({
  classId,
  studentId,
  status,
  page = 0,
  size = 200,
  sort,
}: StudentFeeListParams = {}): Promise<StudentFeePage> => {
  const response = await api.get<StudentFeePage>(API_ENDPOINTS.STUDENT_FEE.LIST, {
    params: { classId, studentId, status, page, size, sort },
  });
  return response.data;
};

export const getStudentFee = async (id: number): Promise<StudentFee> => {
  const response = await api.get<StudentFee>(API_ENDPOINTS.STUDENT_FEE.GET(id));
  return response.data;
};

export const deleteStudentFee = async (id: number): Promise<void> => {
  await api.delete(API_ENDPOINTS.STUDENT_FEE.DELETE(id));
};

export interface GenerateStudentFeePayload {
  feeStructureId: number;
  studentId: number;
  /** ISO date string (yyyy-mm-dd). */
  feeDate: string;
}

/** Generates one student fee instance from a fee structure template for a student. */
export const generateStudentFee = async (data: GenerateStudentFeePayload): Promise<StudentFee> => {
  const response = await api.post<StudentFee>(API_ENDPOINTS.STUDENT_FEE.GENERATE, data);
  return response.data;
};

/** Flags all PENDING/PARTIAL student fees past their due date as OVERDUE. Returns the number marked. */
export const markOverdueStudentFees = async (): Promise<number> => {
  const response = await api.post<number>(API_ENDPOINTS.STUDENT_FEE.MARK_OVERDUE);
  return response.data;
};

export interface RecordFeePaymentPayload {
  amount: number;
  paymentMode: PaymentMode;
  transactionId: string;
  remark: string;
}

export interface FeePayment {
  id: number;
  receiptNumber: string;
  studentId: number;
  studentFeeId: number;
  totalAmount: number;
  paymentMode: PaymentMode;
  transactionId: string;
  remark: string;
  status: string;
  paidAt: string;
}

/** Records a payment against one student fee. */
export const recordFeePayment = async (studentFeeId: number, data: RecordFeePaymentPayload): Promise<FeePayment> => {
  const response = await api.post<FeePayment>(API_ENDPOINTS.STUDENT_FEE.PAYMENTS(studentFeeId), data);
  return response.data;
};

/** Full payment history recorded against one student fee. */
export const getFeePayments = async (studentFeeId: number): Promise<FeePayment[]> => {
  const response = await api.get<FeePayment[]>(API_ENDPOINTS.STUDENT_FEE.PAYMENTS(studentFeeId));
  return response.data;
};

export interface FeePaymentPage {
  content: FeePayment[];
  totalElements: number;
  totalPages: number;
  pageNumber: number;
  pageSize: number;
  last: boolean;
}

export interface FeePaymentListParams {
  studentId?: number;
  classId?: number;
  /** ISO date string (yyyy-mm-dd) — used by the Day Book report. */
  feeDate?: string;
  page?: number;
  size?: number;
  sort?: string[];
}

/** Every payment recorded across students, optionally filtered by student/class/date. Returns the raw Page<FeePayment> shape — no envelope. */
export const getAllFeePayments = async ({
  studentId,
  classId,
  feeDate,
  page = 0,
  size = 200,
  sort,
}: FeePaymentListParams = {}): Promise<FeePaymentPage> => {
  const response = await api.get<FeePaymentPage>(API_ENDPOINTS.STUDENT_FEE.ALL_PAYMENTS, {
    params: { studentId, classId, feeDate, page, size, sort },
  });
  return response.data;
};

// ─── Student Concession service ─────────────────────────────────────────────
// Dedicated service for the student-concessions-controller endpoints — a
// concession is a discount granted to a student against one of their fee
// structures (sibling discount, staff-ward waiver, scholarship, etc). Every
// endpoint here returns/accepts the raw entity — no {result} envelope.

// Only "SIBLING" is confirmed by the API spec — the rest are the usual
// concession categories for a school. Unrecognized values still render fine
// (see ConcessionTypeBadge's fallback in components/ui/Badge.tsx) rather than
// erroring.
export type ConcessionType = 'SIBLING' | 'STAFF_WARD' | 'SCHOLARSHIP' | 'FINANCIAL_AID' | 'OTHER';

// Only "FIXED_AMOUNT" is confirmed by the API spec — "PERCENTAGE" is the
// obvious counterpart given discountValue is paired with this field.
export type DiscountType = 'FIXED_AMOUNT' | 'PERCENTAGE';

// Only "ACTIVE" is confirmed by the API spec — the rest are the usual
// lifecycle states for a granted concession. Unrecognized values still
// render fine (see ConcessionStatusBadge's fallback in components/ui/Badge.tsx)
// rather than erroring.
export type ConcessionStatus = 'ACTIVE' | 'INACTIVE' | 'EXPIRED';

export interface StudentConcession {
  id: number;
  studentId: number;
  feeStructureId: number;
  type: ConcessionType;
  discountType: DiscountType;
  discountValue: number;
  maxDiscountAmount: number;
  status: ConcessionStatus;
  remarks: string;
  createdAt: string;
}

export interface StudentConcessionPayload {
  studentId: number;
  feeStructureId: number;
  type: ConcessionType;
  discountType: DiscountType;
  discountValue: number;
  remarks: string;
}

export interface StudentConcessionPage {
  content: StudentConcession[];
  totalElements: number;
  totalPages: number;
  pageNumber: number;
  pageSize: number;
  last: boolean;
}

export interface StudentConcessionListParams {
  studentId?: number;
  feeStructureId?: number;
  page?: number;
  size?: number;
  sort?: string[];
}

// Fetched with a generous page size since DataTable sorts/paginates
// client-side over the full result set, same as getFeeStructures/getStudentFees.
/** Paginated concession list, optionally filtered by student/fee structure. Returns the raw Page<StudentConcession> shape — no envelope. */
export const getStudentConcessions = async ({
  studentId,
  feeStructureId,
  page = 0,
  size = 200,
  sort,
}: StudentConcessionListParams = {}): Promise<StudentConcessionPage> => {
  const response = await api.get<StudentConcessionPage>(API_ENDPOINTS.STUDENT_CONCESSION.LIST, {
    params: { studentId, feeStructureId, page, size, sort },
  });
  return response.data;
};

export const getStudentConcession = async (id: number): Promise<StudentConcession> => {
  const response = await api.get<StudentConcession>(API_ENDPOINTS.STUDENT_CONCESSION.GET(id));
  return response.data;
};

export const createStudentConcession = async (data: StudentConcessionPayload): Promise<StudentConcession> => {
  const response = await api.post<StudentConcession>(API_ENDPOINTS.STUDENT_CONCESSION.CREATE, data);
  return response.data;
};

export const updateStudentConcession = async (id: number, data: StudentConcessionPayload): Promise<StudentConcession> => {
  const response = await api.put<StudentConcession>(API_ENDPOINTS.STUDENT_CONCESSION.UPDATE(id), data);
  return response.data;
};

export const deleteStudentConcession = async (id: number): Promise<void> => {
  await api.delete(API_ENDPOINTS.STUDENT_CONCESSION.DELETE(id));
};
