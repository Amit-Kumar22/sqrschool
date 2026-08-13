import { api } from './api';
import { API_ENDPOINTS } from './config';

// ─── Academic Year service ──────────────────────────────────────────────────
// Dedicated service for the academic-year-controller endpoints, scoped per
// school (schoolCode is required on both list and create/update). Every
// endpoint here returns/accepts the raw entity — no {result} envelope.

export interface AcademicYear {
  id: number;
  created: string;
  updated: string;
  yearCode: string;
  startDate: string;
  endDate: string;
  locked: boolean;
  description: string;
  active: boolean;
}

export interface AcademicYearPayload {
  schoolCode: string;
  startDate: string;
  endDate: string;
  description: string;
}

export interface AcademicYearPage {
  content: AcademicYear[];
  totalElements: number;
  totalPages: number;
  pageNumber: number;
  pageSize: number;
  last: boolean;
}

export interface AcademicYearListParams {
  /** Required by the backend — academic years are always scoped to one school. */
  schoolCode: string;
  page?: number;
  size?: number;
}

// Fetched with a generous page size since DataTable sorts/paginates
// client-side over the full result set, same as getSchools/getStaffMembers.
/** Paginated academic-year list for one school. Returns the raw Page<AcademicYear> shape — no envelope. */
export const getAcademicYears = async ({
  schoolCode,
  page = 0,
  size = 200,
}: AcademicYearListParams): Promise<AcademicYearPage> => {
  const response = await api.get<AcademicYearPage>(API_ENDPOINTS.ACADEMIC_YEAR.LIST, {
    params: { schoolCode, page, size },
  });
  return response.data;
};

export const getAcademicYear = async (id: number): Promise<AcademicYear> => {
  const response = await api.get<AcademicYear>(API_ENDPOINTS.ACADEMIC_YEAR.GET(id));
  return response.data;
};

export const createAcademicYear = async (data: AcademicYearPayload): Promise<AcademicYear> => {
  const response = await api.post<AcademicYear>(API_ENDPOINTS.ACADEMIC_YEAR.CREATE, data);
  return response.data;
};

export const updateAcademicYear = async (id: number, data: AcademicYearPayload): Promise<AcademicYear> => {
  const response = await api.put<AcademicYear>(API_ENDPOINTS.ACADEMIC_YEAR.UPDATE(id), data);
  return response.data;
};

export const deleteAcademicYear = async (id: number): Promise<void> => {
  await api.delete(API_ENDPOINTS.ACADEMIC_YEAR.DELETE(id));
};
