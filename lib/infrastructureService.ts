import { api } from './api';
import { API_ENDPOINTS } from './config';

// ─── School Infrastructure service ──────────────────────────────────────────
// Dedicated service for the school-infrastructure-controller endpoints.
// Every endpoint here returns/accepts the raw entity — no {result} envelope.

export interface Infrastructure {
  id: number;
  created: string;
  updated: string;
  name: string;
  icon: string;
  description: string;
  active: boolean;
}

export type InfrastructurePayload = Omit<Infrastructure, 'id' | 'created' | 'updated'>;

export interface InfrastructurePage {
  content: Infrastructure[];
  totalElements: number;
  totalPages: number;
  pageNumber: number;
  pageSize: number;
  last: boolean;
}

/** Paginated list of every infrastructure record. Returns the raw Page<Infrastructure> shape — no envelope. */
export const getInfrastructureList = async (): Promise<InfrastructurePage> => {
  const response = await api.get<InfrastructurePage>(API_ENDPOINTS.INFRASTRUCTURE.LIST);
  return response.data;
};

export const getInfrastructure = async (id: number): Promise<Infrastructure> => {
  const response = await api.get<Infrastructure>(API_ENDPOINTS.INFRASTRUCTURE.GET(id));
  return response.data;
};

export const createInfrastructure = async (data: InfrastructurePayload): Promise<Infrastructure> => {
  const response = await api.post<Infrastructure>(API_ENDPOINTS.INFRASTRUCTURE.CREATE, data);
  return response.data;
};

export const updateInfrastructure = async (id: number, data: InfrastructurePayload): Promise<Infrastructure> => {
  const response = await api.put<Infrastructure>(API_ENDPOINTS.INFRASTRUCTURE.UPDATE(id), { ...data, id });
  return response.data;
};

export const deleteInfrastructure = async (id: number): Promise<void> => {
  await api.delete(API_ENDPOINTS.INFRASTRUCTURE.DELETE(id));
};
