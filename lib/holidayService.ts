import { api } from './api';
import { API_ENDPOINTS } from './config';

// ─── Holiday service ─────────────────────────────────────────────────────────
// Dedicated service for the holiday-controller endpoints. Every endpoint here
// returns/accepts the raw entity — no {result} envelope.

export interface Holiday {
  id: number;
  created: string;
  updated: string;
  holidayName: string;
  holidayDate: string;
  description: string;
  active: boolean;
}

export interface HolidayPayload {
  holidayName: string;
  holidayDate: string;
  description: string;
  validHolidayRequest: boolean;
}

export interface HolidayPage {
  content: Holiday[];
  totalElements: number;
  totalPages: number;
  pageNumber: number;
  pageSize: number;
  last: boolean;
}

export interface HolidayListParams {
  page?: number;
  size?: number;
  sort?: string[];
}

// Fetched with a generous page size since DataTable sorts/paginates
// client-side over the full result set, same as getExams/getAcademicYears.
/** Paginated holiday list. Returns the raw Page<Holiday> shape — no envelope. */
export const getHolidays = async ({ page = 0, size = 200, sort }: HolidayListParams = {}): Promise<HolidayPage> => {
  const response = await api.get<HolidayPage>(API_ENDPOINTS.HOLIDAY.LIST, {
    params: { page, size, sort },
  });
  return response.data;
};

export const getHoliday = async (id: number): Promise<Holiday> => {
  const response = await api.get<Holiday>(API_ENDPOINTS.HOLIDAY.GET(id));
  return response.data;
};

// The add endpoint takes an array of holidays (bulk-capable), so a single
// create wraps its payload in a one-item array and unwraps the response.
export const createHoliday = async (data: HolidayPayload): Promise<Holiday> => {
  const response = await api.post<Holiday[]>(API_ENDPOINTS.HOLIDAY.ADD, [data]);
  return response.data[0];
};

export const updateHoliday = async (id: number, data: HolidayPayload): Promise<Holiday> => {
  const response = await api.put<Holiday>(API_ENDPOINTS.HOLIDAY.UPDATE(id), data);
  return response.data;
};

export const deleteHoliday = async (id: number): Promise<void> => {
  await api.delete(API_ENDPOINTS.HOLIDAY.DELETE(id));
};
