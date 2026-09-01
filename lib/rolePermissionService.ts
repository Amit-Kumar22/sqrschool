import { api } from './api';
import { API_ENDPOINTS } from './config';
import type { Role } from './auth';

// ─── Access Attribute service ───────────────────────────────────────────────
// Dedicated service for the access-attribute-controller endpoints — the
// catalog of permission "modules" (e.g. Students, Attendance, Exams) that
// staff-permissions grant canRead/canAdd/canUpdate/canDelete against. Every
// endpoint here returns/accepts the raw entity — no {result} envelope.

export interface AccessAttribute {
  id: number;
  created: string;
  updated: string;
  attributeName: string;
  active: boolean;
}

export interface AccessAttributePayload {
  attributeName: string;
  active: boolean;
}

/** Full attribute catalog — a plain array, no pagination/envelope. */
export const getAccessAttributes = async (): Promise<AccessAttribute[]> => {
  const response = await api.get<AccessAttribute[]>(API_ENDPOINTS.ACCESS_ATTRIBUTE.LIST);
  return response.data;
};

export const getAccessAttribute = async (attributeId: number): Promise<AccessAttribute> => {
  const response = await api.get<AccessAttribute>(API_ENDPOINTS.ACCESS_ATTRIBUTE.GET(attributeId));
  return response.data;
};

export const createAccessAttribute = async (data: AccessAttributePayload): Promise<AccessAttribute> => {
  const response = await api.post<AccessAttribute>(API_ENDPOINTS.ACCESS_ATTRIBUTE.ADD, data);
  return response.data;
};

export const updateAccessAttribute = async (attributeId: number, data: AccessAttributePayload): Promise<AccessAttribute> => {
  const response = await api.put<AccessAttribute>(API_ENDPOINTS.ACCESS_ATTRIBUTE.UPDATE(attributeId), data);
  return response.data;
};

export const deleteAccessAttribute = async (attributeId: number): Promise<void> => {
  await api.delete(API_ENDPOINTS.ACCESS_ATTRIBUTE.DELETE(attributeId));
};

// ─── Staff Permission service ───────────────────────────────────────────────
// Dedicated service for the staff-permission-controller endpoints — each
// record grants one staff user CRUD-style access (canRead/canAdd/canUpdate/
// canDelete) per attribute. Every endpoint here returns/accepts the raw
// entity — no {result} envelope.

/** Lightweight user reference — same {id, fullName, email, phone, city, role} shape used by NoticeAuthor. */
export interface PermissionStaffRef {
  id: number;
  fullName: string;
  email: string;
  phone: string;
  city: string;
  role: Role;
}

export interface StaffPermissionEntry {
  id: number;
  created: string;
  updated: string;
  // Nullable in practice — same caveat as StaffPermissionRecord.staff below.
  attribute: AccessAttribute | null;
  canAdd: boolean;
  canUpdate: boolean;
  canDelete: boolean;
  canRead: boolean;
  active: boolean;
}

export interface StaffPermissionRecord {
  id: number;
  created: string;
  updated: string;
  // Nullable in practice even though the API spec's example always shows it
  // populated — seen null on at least one real record.
  staff: PermissionStaffRef | null;
  permissions: StaffPermissionEntry[];
}

export interface StaffPermissionPage {
  content: StaffPermissionRecord[];
  totalElements: number;
  totalPages: number;
  pageNumber: number;
  pageSize: number;
  last: boolean;
}

export interface StaffPermissionListParams {
  page?: number;
  size?: number;
  sort?: string[];
}

// Fetched with a generous page size since the page matches records
// client-side against the loaded teacher roster, same as getFeeStructures.
/** Paginated staff-permission list — one record per staff user who has been granted any permissions. Returns the raw Page shape — no envelope. */
export const getStaffPermissions = async ({
  page = 0,
  size = 200,
  sort,
}: StaffPermissionListParams = {}): Promise<StaffPermissionPage> => {
  const response = await api.get<StaffPermissionPage>(API_ENDPOINTS.STAFF_PERMISSION.LIST, {
    params: { page, size, sort },
  });
  return response.data;
};

export const getStaffPermission = async (id: number): Promise<StaffPermissionRecord> => {
  const response = await api.get<StaffPermissionRecord>(API_ENDPOINTS.STAFF_PERMISSION.GET(id));
  return response.data;
};

export interface PermissionInput {
  attributeId: number;
  canAdd: boolean;
  canUpdate: boolean;
  canDelete: boolean;
  canRead: boolean;
}

// userId is the staff member's underlying USER account id (teacher.teacherUser.id
// from getAllTeacherStaff) — NOT the teacher-profile id (teacher.id) that
// weekly-timetable assignments use as teacherId. Mixing these up is a known
// gotcha in this codebase (see the student-class-section teacherId comment).
export interface SaveStaffPermissionsPayload {
  userId: number;
  permissions: PermissionInput[];
}

/** Grants a first-time permission set to a staff user. */
export const saveStaffPermissions = async (data: SaveStaffPermissionsPayload): Promise<StaffPermissionRecord> => {
  const response = await api.post<StaffPermissionRecord>(API_ENDPOINTS.STAFF_PERMISSION.ADD, data);
  return response.data;
};

// PUT /staff-permissions/update takes no {id} in the path — the backend
// resolves which record to update from userId in the body, same shape as add.
/** Replaces the full permission set for a staff user who already has a record. */
export const updateStaffPermissions = async (data: SaveStaffPermissionsPayload): Promise<StaffPermissionRecord> => {
  const response = await api.put<StaffPermissionRecord>(API_ENDPOINTS.STAFF_PERMISSION.UPDATE, data);
  return response.data;
};
