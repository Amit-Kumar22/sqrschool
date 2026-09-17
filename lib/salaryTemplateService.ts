import { api } from './api';
import { API_ENDPOINTS } from './config';

// ─── Payroll service ─────────────────────────────────────────────────────────
// Covers both payroll controllers, which are two halves of one feature:
//   • staff-salary-template-controller — the global pay structure
//   • staff-salary-controller          — the per-staff monthly payslips
//     generated from a template (globalTemplateId).
// Every endpoint here returns/accepts the raw entity — no {result} envelope.

// ─── Salary templates ────────────────────────────────────────────────────────

export interface SalaryTemplate {
  id: number;
  basicSalary: number;
  hra: number;
  transportAllowance: number;
  medicalAllowance: number;
  otherAllowance: number;
  pf: number;
  professionalTax: number;
  otherDeduction: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export type SalaryTemplatePayload = Omit<SalaryTemplate, 'id' | 'createdAt' | 'updatedAt'>;

/** The three allowance components a template adds on top of basic pay. */
export const TEMPLATE_ALLOWANCE_KEYS = [
  'hra',
  'transportAllowance',
  'medicalAllowance',
  'otherAllowance',
] as const;

/** The three statutory/other deductions a template subtracts from gross pay. */
export const TEMPLATE_DEDUCTION_KEYS = ['pf', 'professionalTax', 'otherDeduction'] as const;

/** Sum of every allowance line on a template — the "total allowances" a payslip inherits. */
export const templateAllowances = (t: Pick<SalaryTemplate, (typeof TEMPLATE_ALLOWANCE_KEYS)[number]>): number =>
  TEMPLATE_ALLOWANCE_KEYS.reduce((sum, key) => sum + (t[key] || 0), 0);

/** Sum of every deduction line on a template. */
export const templateDeductions = (t: Pick<SalaryTemplate, (typeof TEMPLATE_DEDUCTION_KEYS)[number]>): number =>
  TEMPLATE_DEDUCTION_KEYS.reduce((sum, key) => sum + (t[key] || 0), 0);

/** Full template list. Unlike most list endpoints this one returns a bare array, not a Page. */
export const getSalaryTemplates = async (): Promise<SalaryTemplate[]> => {
  const response = await api.get<SalaryTemplate[]>(API_ENDPOINTS.STAFF_SALARY_TEMPLATE.LIST);
  return Array.isArray(response.data) ? response.data : [];
};

export const getSalaryTemplate = async (id: number): Promise<SalaryTemplate> => {
  const response = await api.get<SalaryTemplate>(API_ENDPOINTS.STAFF_SALARY_TEMPLATE.GET(id));
  return response.data;
};

/**
 * The single template currently marked active — what new payslips default to.
 * 404s (or returns nothing) when no template has been activated yet, so
 * callers should treat a failure here as "none active", not an error.
 */
export const getActiveSalaryTemplate = async (): Promise<SalaryTemplate> => {
  const response = await api.get<SalaryTemplate>(API_ENDPOINTS.STAFF_SALARY_TEMPLATE.ACTIVE);
  return response.data;
};

export const createSalaryTemplate = async (data: SalaryTemplatePayload): Promise<SalaryTemplate> => {
  const response = await api.post<SalaryTemplate>(API_ENDPOINTS.STAFF_SALARY_TEMPLATE.CREATE, data);
  return response.data;
};

export const updateSalaryTemplate = async (id: number, data: SalaryTemplatePayload): Promise<SalaryTemplate> => {
  const response = await api.put<SalaryTemplate>(API_ENDPOINTS.STAFF_SALARY_TEMPLATE.UPDATE(id), data);
  return response.data;
};

export const deleteSalaryTemplate = async (id: number): Promise<void> => {
  await api.delete(API_ENDPOINTS.STAFF_SALARY_TEMPLATE.DELETE(id));
};

/**
 * Flips a template's active flag. The same endpoint serves both directions
 * (activate an inactive template / deactivate the active one), matching the
 * activate-theme endpoint's shape — an empty PUT body.
 */
export const activateSalaryTemplate = async (id: number): Promise<SalaryTemplate> => {
  const response = await api.put<SalaryTemplate>(API_ENDPOINTS.STAFF_SALARY_TEMPLATE.ACTIVATE(id), {});
  return response.data;
};

// ─── Staff salaries (payslips) ───────────────────────────────────────────────

// All 5 values are confirmed by the staff-salary API spec's "Available
// values" list.
export type StaffSalaryStatus = 'DRAFT' | 'GENERATED' | 'APPROVED' | 'PAID' | 'CANCELLED';

export const STAFF_SALARY_STATUSES: StaffSalaryStatus[] = [
  'DRAFT',
  'GENERATED',
  'APPROVED',
  'PAID',
  'CANCELLED',
];

export interface StaffSalary {
  id: number;
  userId: number;
  userName: string;
  userEmail: string;
  globalTemplateId: number;
  /** "yyyy-mm-dd" — the first of the month the payslip covers. */
  salaryMonth: string;
  basicSalary: number;
  totalAllowances: number;
  totalDeductions: number;
  grossSalary: number;
  netSalary: number;
  workingDays: number;
  paidDays: number;
  unpaidDays: number;
  status: StaffSalaryStatus;
  paymentDate: string | null;
  paymentReference: string | null;
  remarks: string | null;
  createdAt: string;
  updatedAt: string;
}

// The derived money fields (totalAllowances/totalDeductions/gross/net) are
// computed by the backend from the chosen template — the client only sends
// the inputs below.
export interface StaffSalaryPayload {
  userId: number;
  globalTemplateId: number;
  salaryMonth: string;
  basicSalary: number;
  workingDays: number;
  paidDays: number;
  unpaidDays: number;
  status: StaffSalaryStatus;
  paymentDate: string;
  paymentReference: string;
  remarks: string;
}

export interface StaffSalaryPage {
  content: StaffSalary[];
  totalElements: number;
  totalPages: number;
  pageNumber: number;
  pageSize: number;
  last: boolean;
}

export interface StaffSalaryListParams {
  userId?: number;
  status?: StaffSalaryStatus;
  page?: number;
  size?: number;
  sort?: string[];
}

// Fetched with a generous page size since DataTable sorts/paginates
// client-side over the full result set, same as getFeeStructures/getHolidays.
/** Paginated payslip list across all staff, optionally filtered by user and/or status. */
export const getStaffSalaries = async ({
  userId,
  status,
  page = 0,
  size = 200,
  sort,
}: StaffSalaryListParams = {}): Promise<StaffSalaryPage> => {
  const response = await api.get<StaffSalaryPage>(API_ENDPOINTS.STAFF_SALARY.LIST, {
    params: { userId, status, page, size, sort },
  });
  return response.data;
};

/** The signed-in staff member's own payslips — same Page shape, no userId param. */
export const getMyStaffSalaries = async ({
  status,
  page = 0,
  size = 200,
  sort,
}: Omit<StaffSalaryListParams, 'userId'> = {}): Promise<StaffSalaryPage> => {
  const response = await api.get<StaffSalaryPage>(API_ENDPOINTS.STAFF_SALARY.MY_SALARIES, {
    params: { status, page, size, sort },
  });
  return response.data;
};

export const getStaffSalary = async (id: number): Promise<StaffSalary> => {
  const response = await api.get<StaffSalary>(API_ENDPOINTS.STAFF_SALARY.GET(id));
  return response.data;
};

export const createStaffSalary = async (data: StaffSalaryPayload): Promise<StaffSalary> => {
  const response = await api.post<StaffSalary>(API_ENDPOINTS.STAFF_SALARY.CREATE, data);
  return response.data;
};

export const updateStaffSalary = async (id: number, data: StaffSalaryPayload): Promise<StaffSalary> => {
  const response = await api.put<StaffSalary>(API_ENDPOINTS.STAFF_SALARY.UPDATE(id), data);
  return response.data;
};

export const deleteStaffSalary = async (id: number): Promise<void> => {
  await api.delete(API_ENDPOINTS.STAFF_SALARY.DELETE(id));
};

/** Moves a payslip along its lifecycle (DRAFT → GENERATED → APPROVED → PAID, or CANCELLED). */
export const updateStaffSalaryStatus = async (id: number, status: StaffSalaryStatus): Promise<StaffSalary> => {
  const response = await api.put<StaffSalary>(
    API_ENDPOINTS.STAFF_SALARY.UPDATE_STATUS(id),
    {},
    { params: { status } },
  );
  return response.data;
};

/**
 * Downloads a payslip as a PDF. Unlike every other endpoint here this one
 * returns binary, so it asks axios for a Blob — leaving the default JSON
 * parsing on would corrupt the bytes.
 */
export const getStaffSalaryPdf = async (id: number): Promise<Blob> => {
  const response = await api.get<Blob>(API_ENDPOINTS.STAFF_SALARY.PDF(id), {
    responseType: 'blob',
  });
  return response.data;
};
