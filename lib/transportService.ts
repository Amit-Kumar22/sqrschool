import { api } from './api';
import { API_ENDPOINTS } from './config';

// ─── Transport service ───────────────────────────────────────────────────────
// Covers the whole transport module: vehicles (+ document compliance), crew,
// routes & student boarding, running expenses, crew payroll and transport
// fees, plus the module dashboard. The spec documents raw entities (no
// {result} envelope); `unwrap` still tolerates an envelope so a controller
// that does wrap its response can't silently produce `undefined`.

function unwrap<T>(data: T | { result: T }): T {
  if (data && typeof data === 'object' && !Array.isArray(data) && 'result' in data) {
    return (data as { result: T }).result;
  }
  return data as T;
}

const asArray = <T>(data: T[] | { result: T[] } | null | undefined): T[] => {
  const value = data ? unwrap(data) : [];
  return Array.isArray(value) ? value : [];
};

export interface Page<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  pageNumber: number;
  pageSize: number;
  last: boolean;
}

export interface PageParams {
  page?: number;
  size?: number;
  sort?: string[];
}

// Fetched with a generous page size since DataTable sorts/paginates
// client-side over the full result set, same as getStaffSalaries.
const DEFAULT_PAGE = { page: 0, size: 200 };

const emptyPage = <T>(): Page<T> => ({
  content: [],
  totalElements: 0,
  totalPages: 0,
  pageNumber: 0,
  pageSize: 0,
  last: true,
});

const asPage = <T>(data: Page<T> | { result: Page<T> }): Page<T> => {
  const page = unwrap(data);
  return page && Array.isArray(page.content) ? page : emptyPage<T>();
};

/** Drops undefined/'' params so they aren't sent as empty query strings. */
function clean(params: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(Object.entries(params).filter(([, v]) => v !== undefined && v !== ''));
}

// ─── Time-of-day (LocalTime) ─────────────────────────────────────────────────
// The spec renders java.time.LocalTime as {hour, minute, second, nano}, but
// Jackson (de)serializes it as an "HH:mm:ss" string on the wire. Requests send
// the string form; responses are read in either shape.

export interface LocalTimeObject {
  hour: number;
  minute: number;
  second?: number;
  nano?: number;
}

export type ApiTime = string | LocalTimeObject | null;

/** Any API time value -> "HH:mm" for <input type="time">. */
export function timeToInput(value: ApiTime | undefined): string {
  if (!value) return '';
  if (typeof value === 'string') return value.slice(0, 5);
  const pad = (n: number) => String(n ?? 0).padStart(2, '0');
  return `${pad(value.hour)}:${pad(value.minute)}`;
}

/** "HH:mm" from a time input -> "HH:mm:ss" for the API, or null when blank. */
export const inputToTime = (value: string): string | null => (value ? `${value}:00` : null);

/** Any API time value -> "7:45 AM". */
export function formatTime(value: ApiTime | undefined): string {
  const hhmm = timeToInput(value);
  if (!hhmm) return '—';
  const [h, m] = hhmm.split(':').map(Number);
  const suffix = h >= 12 ? 'PM' : 'AM';
  return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${suffix}`;
}

// ─── Enums ───────────────────────────────────────────────────────────────────

export const VEHICLE_TYPES = ['BUS', 'MINI_BUS', 'TRAVELLER', 'VAN', 'AUTO_RICKSHAW', 'CAR', 'OTHER'] as const;
export type VehicleType = (typeof VEHICLE_TYPES)[number];

export const DOCUMENT_TYPES = ['INSURANCE', 'FITNESS', 'PERMIT', 'PUC'] as const;
export type VehicleDocumentType = (typeof DOCUMENT_TYPES)[number];

export const STAFF_DESIGNATIONS = [
  'BUS_DRIVER',
  'TRAVELLER_DRIVER',
  'VAN_DRIVER',
  'CONDUCTOR',
  'TRANSPORT_IN_CHARGE',
  'HELPER',
] as const;
export type StaffDesignation = (typeof STAFF_DESIGNATIONS)[number];

/** Designations that drive a vehicle — these need a licence and can be put on a route as its driver. */
export const DRIVER_DESIGNATIONS: StaffDesignation[] = ['BUS_DRIVER', 'TRAVELLER_DRIVER', 'VAN_DRIVER'];

export const EMPLOYMENT_STATUSES = ['ACTIVE', 'ON_LEAVE', 'SUSPENDED', 'RELIEVED'] as const;
export type EmploymentStatus = (typeof EMPLOYMENT_STATUSES)[number];

export const EXPENSE_TYPES = [
  'FUEL',
  'SERVICING',
  'REPAIR',
  'SPARE_PARTS',
  'INSURANCE',
  'PERMIT_RENEWAL',
  'PUC',
  'TYRE',
  'FASTAG_TOLL',
  'OTHER',
] as const;
export type ExpenseType = (typeof EXPENSE_TYPES)[number];

// Only CASH is shown in the spec; the rest mirror the student-fee PaymentMode
// enum the backend already uses (lib/feeService.ts).
export const PAYMENT_MODES = ['CASH', 'UPI', 'NET_BANKING', 'CHEQUE', 'CARD'] as const;
export type TransportPaymentMode = (typeof PAYMENT_MODES)[number];

export const SALARY_STATUSES = ['DRAFT', 'GENERATED', 'PENDING', 'APPROVED', 'PAID', 'CANCELLED'] as const;
export type TransportSalaryStatus = (typeof SALARY_STATUSES)[number];

// ─── Dashboard ───────────────────────────────────────────────────────────────

export interface DocumentExpiry {
  vehicleId: number;
  registrationNumber: string;
  documentType: VehicleDocumentType;
  expiryDate: string;
  daysRemaining: number;
  expired: boolean;
}

export interface TransportDashboard {
  totalVehicles: number;
  activeVehicles: number;
  activeDrivers: number;
  activeRoutes: number;
  transportStudents: number;
  monthlySalaryExpense: number;
  monthlyVehicleExpense: number;
  outstandingTransportFees: number;
  expiredDocumentCount: number;
  upcomingExpiries: DocumentExpiry[];
}

export const getTransportDashboard = async (expiryWithinDays = 30): Promise<TransportDashboard> => {
  const response = await api.get(API_ENDPOINTS.TRANSPORT.DASHBOARD, { params: { expiryWithinDays } });
  const data = unwrap<TransportDashboard>(response.data);
  return { ...data, upcomingExpiries: Array.isArray(data?.upcomingExpiries) ? data.upcomingExpiries : [] };
};

// ─── Vehicles ────────────────────────────────────────────────────────────────

export interface Vehicle {
  id: number;
  registrationNumber: string;
  vehicleType: VehicleType;
  model: string;
  seatingCapacity: number;
  insuranceExpiry: string | null;
  fitnessExpiry: string | null;
  permitExpiry: string | null;
  pucExpiry: string | null;
  remarks: string | null;
  active: boolean;
}

export interface VehiclePayload {
  registrationNumber: string;
  vehicleType: VehicleType;
  model: string;
  seatingCapacity: number;
  insuranceExpiry: string | null;
  fitnessExpiry: string | null;
  permitExpiry: string | null;
  pucExpiry: string | null;
  remarks: string;
}

export interface VehicleListParams extends PageParams {
  vehicleType?: VehicleType;
  active?: boolean;
  search?: string;
}

export const getVehicles = async ({ vehicleType, active, search, ...page }: VehicleListParams = {}): Promise<Page<Vehicle>> => {
  const response = await api.get(API_ENDPOINTS.TRANSPORT.VEHICLES, {
    params: clean({ vehicleType, active, search, ...DEFAULT_PAGE, ...page }),
  });
  return asPage<Vehicle>(response.data);
};

export const getVehicle = async (id: number): Promise<Vehicle> => {
  const response = await api.get(API_ENDPOINTS.TRANSPORT.VEHICLE(id));
  return unwrap<Vehicle>(response.data);
};

export const createVehicle = async (data: VehiclePayload): Promise<Vehicle> => {
  const response = await api.post(API_ENDPOINTS.TRANSPORT.VEHICLES, data);
  return unwrap<Vehicle>(response.data);
};

export const updateVehicle = async (id: number, data: VehiclePayload): Promise<Vehicle> => {
  const response = await api.put(API_ENDPOINTS.TRANSPORT.VEHICLE(id), data);
  return unwrap<Vehicle>(response.data);
};

export const deactivateVehicle = async (id: number): Promise<void> => {
  await api.put(API_ENDPOINTS.TRANSPORT.VEHICLE_DEACTIVATE(id), {});
};

/** Reactivates a previously deactivated vehicle. */
export const reactivateVehicle = async (id: number): Promise<void> => {
  await api.put(API_ENDPOINTS.TRANSPORT.VEHICLE_REACTIVATE(id), {});
};

export interface DocumentRule {
  id: number;
  vehicleType: VehicleType;
  requireInsurance: boolean;
  requireFitness: boolean;
  requirePermit: boolean;
  requirePuc: boolean;
  alertDaysBefore: number;
}

export type DocumentRulePayload = Omit<DocumentRule, 'id'>;

export const getDocumentRules = async (): Promise<DocumentRule[]> => {
  const response = await api.get(API_ENDPOINTS.TRANSPORT.VEHICLE_DOCUMENT_RULES);
  return asArray<DocumentRule>(response.data);
};

/** Upserts the compliance rule for one vehicle type. */
export const saveDocumentRule = async (data: DocumentRulePayload): Promise<DocumentRule> => {
  const response = await api.put(API_ENDPOINTS.TRANSPORT.VEHICLE_DOCUMENT_RULES, data);
  return unwrap<DocumentRule>(response.data);
};

export const getDocumentExpiries = async (withinDays = 30): Promise<DocumentExpiry[]> => {
  const response = await api.get(API_ENDPOINTS.TRANSPORT.VEHICLE_DOCUMENT_EXPIRIES, { params: { withinDays } });
  return asArray<DocumentExpiry>(response.data);
};

// ─── Transport staff ─────────────────────────────────────────────────────────

export interface TransportStaff {
  id: number;
  name: string;
  mobileNumber: string;
  address: string | null;
  joiningDate: string | null;
  designation: StaffDesignation;
  licenceNumber: string | null;
  licenceExpiry: string | null;
  licenceExpired: boolean;
  monthlySalary: number;
  employmentStatus: EmploymentStatus;
  assignedVehicleId: number | null;
  assignedVehicleNumber: string | null;
  active: boolean;
}

export interface TransportStaffPayload {
  name: string;
  mobileNumber: string;
  address: string;
  joiningDate: string | null;
  designation: StaffDesignation;
  licenceNumber: string;
  licenceExpiry: string | null;
  monthlySalary: number;
  employmentStatus: EmploymentStatus;
  assignedVehicleId: number | null;
}

export interface TransportStaffListParams extends PageParams {
  designation?: StaffDesignation;
  employmentStatus?: EmploymentStatus;
  search?: string;
}

export const getTransportStaff = async ({
  designation,
  employmentStatus,
  search,
  ...page
}: TransportStaffListParams = {}): Promise<Page<TransportStaff>> => {
  const response = await api.get(API_ENDPOINTS.TRANSPORT.STAFF, {
    params: clean({ designation, employmentStatus, search, ...DEFAULT_PAGE, ...page }),
  });
  return asPage<TransportStaff>(response.data);
};

export const getTransportStaffMember = async (id: number): Promise<TransportStaff> => {
  const response = await api.get(API_ENDPOINTS.TRANSPORT.STAFF_MEMBER(id));
  return unwrap<TransportStaff>(response.data);
};

export const createTransportStaff = async (data: TransportStaffPayload): Promise<TransportStaff> => {
  const response = await api.post(API_ENDPOINTS.TRANSPORT.STAFF, data);
  return unwrap<TransportStaff>(response.data);
};

export const updateTransportStaff = async (id: number, data: TransportStaffPayload): Promise<TransportStaff> => {
  const response = await api.put(API_ENDPOINTS.TRANSPORT.STAFF_MEMBER(id), data);
  return unwrap<TransportStaff>(response.data);
};

/** Drivers with an expired licence are rejected by the backend. */
export const assignStaffVehicle = async (id: number, vehicleId: number): Promise<void> => {
  await api.put(API_ENDPOINTS.TRANSPORT.STAFF_ASSIGN_VEHICLE(id), {}, { params: { vehicleId } });
};

export const unassignStaffVehicle = async (id: number): Promise<void> => {
  await api.put(API_ENDPOINTS.TRANSPORT.STAFF_UNASSIGN_VEHICLE(id), {});
};

/** Soft-deactivates: marks the staff member as RELIEVED. */
export const deactivateTransportStaff = async (id: number): Promise<void> => {
  await api.put(API_ENDPOINTS.TRANSPORT.STAFF_DEACTIVATE(id), {});
};

// ─── Expenses ────────────────────────────────────────────────────────────────

export interface VehicleExpense {
  id: number;
  vehicleId: number;
  registrationNumber: string;
  expenseDate: string;
  expenseType: ExpenseType;
  amount: number;
  fuelLitres: number | null;
  odometerReading: number | null;
  vendor: string | null;
  billNumber: string | null;
  paymentMode: TransportPaymentMode;
  remarks: string | null;
}

export interface VehicleExpensePayload {
  vehicleId: number;
  expenseDate: string;
  expenseType: ExpenseType;
  amount: number;
  fuelLitres: number | null;
  odometerReading: number | null;
  vendor: string;
  billNumber: string;
  paymentMode: TransportPaymentMode;
  remarks: string;
}

export interface ExpenseListParams extends PageParams {
  vehicleId?: number;
  expenseType?: ExpenseType;
  from?: string;
  to?: string;
}

export const getExpenses = async ({ vehicleId, expenseType, from, to, ...page }: ExpenseListParams = {}): Promise<Page<VehicleExpense>> => {
  const response = await api.get(API_ENDPOINTS.TRANSPORT.EXPENSES, {
    params: clean({ vehicleId, expenseType, from, to, ...DEFAULT_PAGE, ...page }),
  });
  return asPage<VehicleExpense>(response.data);
};

export const createExpense = async (data: VehicleExpensePayload): Promise<VehicleExpense> => {
  const response = await api.post(API_ENDPOINTS.TRANSPORT.EXPENSES, data);
  return unwrap<VehicleExpense>(response.data);
};

export const updateExpense = async (id: number, data: VehicleExpensePayload): Promise<VehicleExpense> => {
  const response = await api.put(API_ENDPOINTS.TRANSPORT.EXPENSE(id), data);
  return unwrap<VehicleExpense>(response.data);
};

export const deleteExpense = async (id: number): Promise<void> => {
  await api.delete(API_ENDPOINTS.TRANSPORT.EXPENSE(id));
};

export interface ExpenseByVehicle {
  vehicleId: number;
  registrationNumber: string;
  totalAmount: number;
  expenseCount: number;
}

export interface ExpenseByType {
  expenseType: ExpenseType;
  totalAmount: number;
  expenseCount: number;
}

export interface DateRange {
  from?: string;
  to?: string;
}

export const getExpenseReportByVehicle = async ({ from, to }: DateRange = {}): Promise<ExpenseByVehicle[]> => {
  const response = await api.get(API_ENDPOINTS.TRANSPORT.EXPENSE_REPORT_BY_VEHICLE, { params: clean({ from, to }) });
  return asArray<ExpenseByVehicle>(response.data);
};

export const getExpenseReportByType = async ({ from, to }: DateRange = {}): Promise<ExpenseByType[]> => {
  const response = await api.get(API_ENDPOINTS.TRANSPORT.EXPENSE_REPORT_BY_TYPE, { params: clean({ from, to }) });
  return asArray<ExpenseByType>(response.data);
};

// ─── Transport fees ──────────────────────────────────────────────────────────

export interface GenerateTransportFeePayload {
  studentId: number;
  routeId: number;
  feeDate: string;
  dueDate: string;
  academicYear: string;
}

export interface OutstandingTransportFee {
  id: number;
  studentId: number;
  studentName: string;
  classId: number;
  className: string;
  feeStructureId: number | null;
  feeType: string;
  amount: number;
  paidAmount: number;
  dueAmount: number;
  dueDate: string;
  status: string;
}

/**
 * Creates a TRANSPORT_FEE student fee priced from the route's transport fee.
 * Collection and receipts then go through the shared /v1/student-fees APIs.
 */
export const generateTransportFee = async (data: GenerateTransportFeePayload): Promise<OutstandingTransportFee> => {
  const response = await api.post(API_ENDPOINTS.TRANSPORT.FEES_GENERATE, data);
  return unwrap<OutstandingTransportFee>(response.data);
};

export const getOutstandingTransportFees = async ({
  studentId,
  ...page
}: PageParams & { studentId?: number } = {}): Promise<Page<OutstandingTransportFee>> => {
  const response = await api.get(API_ENDPOINTS.TRANSPORT.FEES_OUTSTANDING, {
    params: clean({ studentId, ...DEFAULT_PAGE, ...page }),
  });
  return asPage<OutstandingTransportFee>(response.data);
};

// ─── Routes & student assignments ────────────────────────────────────────────

export interface RouteStop {
  id?: number | null;
  stopName: string;
  stopOrder: number;
  pickupTime: ApiTime;
}

export interface TransportRoute {
  id: number;
  routeName: string;
  transportFee: number;
  pickupTime: ApiTime;
  dropTime: ApiTime;
  vehicleId: number | null;
  vehicleNumber: string | null;
  seatingCapacity: number | null;
  driverId: number | null;
  driverName: string | null;
  description: string | null;
  assignedStudentCount: number;
  active: boolean;
  stops: RouteStop[];
}

export interface TransportRoutePayload {
  routeName: string;
  transportFee: number;
  pickupTime: ApiTime;
  dropTime: ApiTime;
  vehicleId: number | null;
  driverId: number | null;
  description: string;
  stops: RouteStop[];
}

export const getRoutes = async ({ active, ...page }: PageParams & { active?: boolean } = {}): Promise<Page<TransportRoute>> => {
  const response = await api.get(API_ENDPOINTS.TRANSPORT.ROUTES, { params: clean({ active, ...DEFAULT_PAGE, ...page }) });
  const result = asPage<TransportRoute>(response.data);
  return { ...result, content: result.content.map((r) => ({ ...r, stops: Array.isArray(r.stops) ? r.stops : [] })) };
};

export const getRoute = async (id: number): Promise<TransportRoute> => {
  const response = await api.get(API_ENDPOINTS.TRANSPORT.ROUTE(id));
  const route = unwrap<TransportRoute>(response.data);
  return { ...route, stops: Array.isArray(route?.stops) ? route.stops : [] };
};

export const createRoute = async (data: TransportRoutePayload): Promise<TransportRoute> => {
  const response = await api.post(API_ENDPOINTS.TRANSPORT.ROUTES, data);
  return unwrap<TransportRoute>(response.data);
};

export const updateRoute = async (id: number, data: TransportRoutePayload): Promise<TransportRoute> => {
  const response = await api.put(API_ENDPOINTS.TRANSPORT.ROUTE(id), data);
  return unwrap<TransportRoute>(response.data);
};

/** Puts a vehicle and/or driver on a route without touching the rest of it. */
export const assignRouteVehicleDriver = async (
  id: number,
  { vehicleId, driverId }: { vehicleId?: number; driverId?: number },
): Promise<void> => {
  await api.put(API_ENDPOINTS.TRANSPORT.ROUTE_ASSIGNMENT(id), {}, { params: clean({ vehicleId, driverId }) });
};

/** Soft-deactivates a route. */
export const deactivateRoute = async (id: number): Promise<void> => {
  await api.put(API_ENDPOINTS.TRANSPORT.ROUTE_DEACTIVATE(id), {});
};

export interface StudentRouteAssignment {
  id: number;
  studentId: number;
  studentName: string;
  admissionNumber: string;
  routeId: number;
  routeName: string;
  stopId: number | null;
  stopName: string | null;
  effectiveFrom: string;
  boardingPoint: string | null;
  active: boolean;
}

export interface StudentRouteAssignmentPayload {
  studentId: number;
  routeId: number;
  stopId: number | null;
  effectiveFrom: string;
  boardingPoint: string;
}

export const getRouteStudents = async (routeId: number): Promise<StudentRouteAssignment[]> => {
  const response = await api.get(API_ENDPOINTS.TRANSPORT.ROUTE_STUDENTS(routeId));
  return asArray<StudentRouteAssignment>(response.data);
};

/** A student's current route assignment — 404s when the student doesn't use school transport. */
export const getStudentRouteAssignment = async (studentId: number): Promise<StudentRouteAssignment> => {
  const response = await api.get(API_ENDPOINTS.TRANSPORT.STUDENT_ASSIGNMENT_BY_STUDENT(studentId));
  return unwrap<StudentRouteAssignment>(response.data);
};

export const assignStudentToRoute = async (data: StudentRouteAssignmentPayload): Promise<StudentRouteAssignment> => {
  const response = await api.post(API_ENDPOINTS.TRANSPORT.STUDENT_ASSIGNMENTS, data);
  return unwrap<StudentRouteAssignment>(response.data);
};

export const updateStudentRouteAssignment = async (
  assignmentId: number,
  data: StudentRouteAssignmentPayload,
): Promise<StudentRouteAssignment> => {
  const response = await api.put(API_ENDPOINTS.TRANSPORT.STUDENT_ASSIGNMENT(assignmentId), data);
  return unwrap<StudentRouteAssignment>(response.data);
};

export const removeStudentRouteAssignment = async (assignmentId: number): Promise<void> => {
  await api.delete(API_ENDPOINTS.TRANSPORT.STUDENT_ASSIGNMENT(assignmentId));
};

// ─── Transport staff salaries ────────────────────────────────────────────────

export interface TransportSalary {
  id: number;
  staffId: number;
  staffName: string;
  designation: string;
  /** "yyyy-mm-dd" — the first of the month the salary covers. */
  salaryMonth: string;
  basicSalary: number;
  allowances: number;
  overtimeAmount: number;
  bonus: number;
  deductions: number;
  salaryAdvance: number;
  netPayable: number;
  status: TransportSalaryStatus;
  paymentDate: string | null;
  paymentMode: TransportPaymentMode | null;
  transactionReference: string | null;
  remarks: string | null;
}

export interface TransportSalaryPayload {
  staffId: number;
  salaryMonth: string;
  basicSalary: number;
  allowances: number;
  overtimeAmount: number;
  bonus: number;
  deductions: number;
  salaryAdvance: number;
  status: TransportSalaryStatus;
  paymentDate: string | null;
  paymentMode: TransportPaymentMode | null;
  transactionReference: string;
  remarks: string;
}

/** Mirrors the backend's net-payable formula so forms can preview it before saving. */
export const computeNetPayable = (s: Pick<TransportSalaryPayload, 'basicSalary' | 'allowances' | 'overtimeAmount' | 'bonus' | 'deductions' | 'salaryAdvance'>): number =>
  (s.basicSalary || 0) + (s.allowances || 0) + (s.overtimeAmount || 0) + (s.bonus || 0) - (s.deductions || 0) - (s.salaryAdvance || 0);

export interface TransportSalaryListParams extends PageParams {
  status?: TransportSalaryStatus;
  fromMonth?: string;
  toMonth?: string;
}

export const getTransportSalaries = async ({
  status,
  fromMonth,
  toMonth,
  ...page
}: TransportSalaryListParams = {}): Promise<Page<TransportSalary>> => {
  const response = await api.get(API_ENDPOINTS.TRANSPORT.SALARIES, {
    params: clean({ status, fromMonth, toMonth, ...DEFAULT_PAGE, ...page }),
  });
  return asPage<TransportSalary>(response.data);
};

export const getTransportSalariesByStaff = async (
  staffId: number,
  { status, ...page }: PageParams & { status?: TransportSalaryStatus } = {},
): Promise<Page<TransportSalary>> => {
  const response = await api.get(API_ENDPOINTS.TRANSPORT.SALARIES_BY_STAFF(staffId), {
    params: clean({ status, ...DEFAULT_PAGE, ...page }),
  });
  return asPage<TransportSalary>(response.data);
};

export const getTransportSalary = async (id: number): Promise<TransportSalary> => {
  const response = await api.get(API_ENDPOINTS.TRANSPORT.SALARY(id));
  return unwrap<TransportSalary>(response.data);
};

export const generateTransportSalary = async (data: TransportSalaryPayload): Promise<TransportSalary> => {
  const response = await api.post(API_ENDPOINTS.TRANSPORT.SALARY_GENERATE, data);
  return unwrap<TransportSalary>(response.data);
};

export const updateTransportSalary = async (id: number, data: TransportSalaryPayload): Promise<TransportSalary> => {
  const response = await api.put(API_ENDPOINTS.TRANSPORT.SALARY(id), data);
  return unwrap<TransportSalary>(response.data);
};

export const deleteTransportSalary = async (id: number): Promise<void> => {
  await api.delete(API_ENDPOINTS.TRANSPORT.SALARY(id));
};

/** Records payment — the body carries the payment date/mode/reference alongside the salary figures. */
export const payTransportSalary = async (id: number, data: TransportSalaryPayload): Promise<TransportSalary> => {
  const response = await api.post(API_ENDPOINTS.TRANSPORT.SALARY_PAY(id), data);
  return unwrap<TransportSalary>(response.data);
};

export const updateTransportSalaryStatus = async (id: number, status: TransportSalaryStatus): Promise<TransportSalary> => {
  const response = await api.put(API_ENDPOINTS.TRANSPORT.SALARY_STATUS(id), {}, { params: { status } });
  return unwrap<TransportSalary>(response.data);
};

/** Salary slip as pre-formatted text lines. */
export const getTransportSalarySlip = async (id: number): Promise<string[]> => {
  const response = await api.get(API_ENDPOINTS.TRANSPORT.SALARY_SLIP(id));
  return asArray<string>(response.data);
};
