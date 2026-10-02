import { api } from './api';
import { API_ENDPOINTS, BACKEND_API_BASE_URL } from './config';

// ─── Document service ───────────────────────────────────────────────────────
// Dedicated service for the document-controller endpoints. Every endpoint
// here returns/accepts the raw entity — no {result} envelope.

// All values are confirmed by the documents API spec's "Available values" list.
export const DOCUMENT_TYPES = [
  'AADHAAR_CARD',
  'PAN_CARD',
  'BIRTH_CERTIFICATE',
  'PASSPORT',
  'PASSPORT_PHOTO',
  'ADDRESS_PROOF',
  'TRANSFER_CERTIFICATE',
  'MIGRATION_CERTIFICATE',
  'PREVIOUS_SCHOOL_MARKSHEET',
  'CASTE_CERTIFICATE',
  'DISABILITY_CERTIFICATE',
  'MEDICAL_CERTIFICATE',
  'MEDICAL_FITNESS_CERTIFICATE',
  'EDUCATIONAL_CERTIFICATE',
  'DEGREE_CERTIFICATE',
  'PROFESSIONAL_QUALIFICATION',
  'BED_CERTIFICATE',
  'D_EL_ED_CERTIFICATE',
  'TET_CERTIFICATE',
  'CTET_CERTIFICATE',
  'EXPERIENCE_CERTIFICATE',
  'RELIEVING_CERTIFICATE',
  'POLICE_VERIFICATION',
  'BANK_PROOF',
  'CANCELLED_CHEQUE',
  'APPOINTMENT_LETTER',
  'JOINING_DOCUMENT',
  'OTHER',
] as const;

export type DocumentType = (typeof DOCUMENT_TYPES)[number];

// Acronyms that a plain Title Case conversion would mangle.
const DOCUMENT_TYPE_LABEL_OVERRIDES: Partial<Record<DocumentType, string>> = {
  PAN_CARD: 'PAN Card',
  BED_CERTIFICATE: 'B.Ed Certificate',
  D_EL_ED_CERTIFICATE: 'D.El.Ed Certificate',
  TET_CERTIFICATE: 'TET Certificate',
  CTET_CERTIFICATE: 'CTET Certificate',
};

export const documentTypeLabel = (type: string): string =>
  DOCUMENT_TYPE_LABEL_OVERRIDES[type as DocumentType] ??
  type
    .toLowerCase()
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

export interface UserDocument {
  id: number;
  userId: number;
  userFullName: string;
  userEmail: string;
  documentType: DocumentType;
  documentName: string;
  fileUrl: string | null;
  documentNumber: string | null;
  verified: boolean;
  verifiedBy: number | null;
  verifiedAt: string | null;
  remarks: string | null;
  created: string;
  updated: string;
}

export interface UserDocumentPage {
  content: UserDocument[];
  totalElements: number;
  totalPages: number;
  pageNumber: number;
  pageSize: number;
  last: boolean;
}

export interface DocumentPayload {
  documentType: DocumentType;
  documentName: string;
  documentNumber?: string;
  remarks?: string;
  /** Optional on both create and update — omitted on update keeps the existing file. */
  file?: File | null;
}

interface PageableParams {
  page?: number;
  size?: number;
  sort?: string[];
}

export interface DocumentListParams extends PageableParams {
  userId?: number;
  documentType?: DocumentType;
  verified?: boolean;
  search?: string;
}

const toFormData = ({ documentType, documentName, documentNumber, remarks, file }: DocumentPayload): FormData => {
  const formData = new FormData();
  formData.append('documentType', documentType);
  formData.append('documentName', documentName);
  if (documentNumber) formData.append('documentNumber', documentNumber);
  if (remarks) formData.append('remarks', remarks);
  if (file) formData.append('file', file);
  return formData;
};

// Fetched with a generous page size since DataTable sorts/paginates
// client-side over the full result set, same as getStudentAdmissions.
/** Cross-user document search for the admin panel. */
export const getDocuments = async ({
  userId,
  documentType,
  verified,
  search,
  page = 0,
  size = 200,
  sort,
}: DocumentListParams = {}): Promise<UserDocumentPage> => {
  const response = await api.get<UserDocumentPage>(API_ENDPOINTS.DOCUMENT.LIST, {
    params: { userId, documentType, verified, search, page, size, sort },
  });
  return response.data;
};

/** The signed-in user's own documents — the backend resolves the user from the auth token. */
export const getMyDocuments = async ({
  documentType,
  page = 0,
  size = 200,
  sort,
}: Pick<DocumentListParams, 'documentType' | keyof PageableParams> = {}): Promise<UserDocumentPage> => {
  const response = await api.get<UserDocumentPage>(API_ENDPOINTS.DOCUMENT.MY, {
    params: { documentType, page, size, sort },
  });
  return response.data;
};

export const getDocument = async (id: number): Promise<UserDocument> => {
  const response = await api.get<UserDocument>(API_ENDPOINTS.DOCUMENT.GET(id));
  return response.data;
};

// Multipart bodies need Content-Type cleared per-request — see
// bulkImportStudents in studentService.ts for why.
export const createDocument = async (data: DocumentPayload): Promise<UserDocument> => {
  const response = await api.post<UserDocument>(API_ENDPOINTS.DOCUMENT.CREATE, toFormData(data), {
    headers: { 'Content-Type': undefined },
  });
  return response.data;
};

export const updateDocument = async (id: number, data: DocumentPayload): Promise<UserDocument> => {
  const response = await api.put<UserDocument>(API_ENDPOINTS.DOCUMENT.UPDATE(id), toFormData(data), {
    headers: { 'Content-Type': undefined },
  });
  return response.data;
};

export const deleteDocument = async (id: number): Promise<void> => {
  await api.delete(API_ENDPOINTS.DOCUMENT.DELETE(id));
};

export const verifyDocument = async (id: number, remarks?: string): Promise<UserDocument> => {
  const response = await api.post<UserDocument>(API_ENDPOINTS.DOCUMENT.VERIFY(id), null, {
    params: { remarks: remarks || undefined },
  });
  return response.data;
};

/** fileUrl may come back relative to the backend host — resolve it so it opens from the frontend origin too. */
export const resolveDocumentUrl = (fileUrl: string | null): string | null => {
  if (!fileUrl) return null;
  if (/^(https?:|blob:|data:)/i.test(fileUrl)) return fileUrl;
  try {
    return new URL(fileUrl, BACKEND_API_BASE_URL).toString();
  } catch {
    return fileUrl;
  }
};
