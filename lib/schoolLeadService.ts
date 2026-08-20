import { api } from './api';
import { API_ENDPOINTS } from './config';

// ─── School Leads service ───────────────────────────────────────────────────
// Read-only CRM-style list of prospective schools (sales/outreach pipeline).
// Only a paginated GET is exposed by the backend today — no create/update.

export interface SchoolLead {
  id: number;
  created: string;
  updated: string;
  schoolName: string;
  address: string;
  locality: string;
  city: string;
  state: string;
  pincode: string;
  phone: string;
  alternatePhone: string;
  email: string;
  website: string;
  category: string;
  board: string;
  schoolType: string;
  status: string;
  notes: string;
  lastContactedAt: string;
  nextFollowUpAt: string;
  active: boolean;
}

export interface SchoolLeadPage {
  content: SchoolLead[];
  totalElements: number;
  totalPages: number;
  pageNumber: number;
  pageSize: number;
  last: boolean;
}

export interface SchoolLeadListParams {
  page?: number;
  size?: number;
  sort?: string[];
}

// Fetched with a generous page size since DataTable sorts/paginates
// client-side over the full result set, same as getSchools/getStaffMembers.
// Sorted newest-first at fetch time so the freshest leads surface first if
// the pipeline ever grows past a single fetch.
/** Paginated school leads list. Returns the raw Page<SchoolLead> shape — no envelope. */
export const getSchoolLeads = async ({
  page = 0,
  size = 200,
  sort = ['created,desc'],
}: SchoolLeadListParams = {}): Promise<SchoolLeadPage> => {
  const response = await api.get<SchoolLeadPage>(API_ENDPOINTS.SCHOOL_LEADS.LIST, {
    params: { page, size, sort },
  });
  return response.data;
};
