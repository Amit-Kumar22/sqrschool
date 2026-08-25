import { api } from './api';
import { API_ENDPOINTS } from './config';

// ─── Fee Structure service ───────────────────────────────────────────────────
// Dedicated service for the fee-structure-controller endpoints. Every
// endpoint here returns/accepts the raw entity — no {result} envelope.

// Only "TUITION_FEE" is confirmed by the API spec — the rest are the usual
// fee categories for a school. Unrecognized values still render fine (see
// FeeTypeBadge's fallback in components/ui/Badge.tsx) rather than erroring.
export type FeeType = 'TUITION_FEE' | 'ADMISSION_FEE' | 'EXAM_FEE' | 'TRANSPORT_FEE' | 'LIBRARY_FEE' | 'MISCELLANEOUS_FEE';

export interface FeeStructure {
  id: number;
  classId: number;
  className: string;
  academicYearId: number;
  yearCode: string;
  feeType: FeeType;
  amount: number;
  dueMonth: number;
  optional: boolean;
  createdAt: string;
}

export interface FeeStructurePayload {
  classId: number;
  academicYearId: number;
  feeType: FeeType;
  amount: number;
  dueMonth: number;
  optional: boolean;
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
  academicYearId?: number;
  page?: number;
  size?: number;
  sort?: string[];
}

// Fetched with a generous page size since DataTable sorts/paginates
// client-side over the full result set, same as getClasses/getAcademicYears.
/** Paginated fee structure list, optionally filtered by class/academic year. Returns the raw Page<FeeStructure> shape — no envelope. */
export const getFeeStructures = async ({
  classId,
  academicYearId,
  page = 0,
  size = 200,
  sort,
}: FeeStructureListParams = {}): Promise<FeeStructurePage> => {
  const response = await api.get<FeeStructurePage>(API_ENDPOINTS.FEE_STRUCTURE.LIST, {
    params: { classId, academicYearId, page, size, sort },
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
