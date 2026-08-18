import axios from 'axios';
import { API_ENDPOINTS, BACKEND_API_BASE_URL } from './config';
import { getAuthToken, normalizeRole, type Role } from './auth';

// ─── Axios instance ───────────────────────────────────────────────────────────

export const api = axios.create({
  baseURL: BACKEND_API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000,
});

/** Pulls the backend's {message} out of an axios error, falling back when the shape is unexpected. */
export function apiErrorMessage(err: unknown, fallback: string): string {
  return (err as { response?: { data?: { message?: string } } })?.response?.data?.message || fallback;
}

// Attach Bearer token from cookie on every request
api.interceptors.request.use((config) => {
  const token = getAuthToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// On 401, clear session and redirect to login
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && typeof window !== 'undefined') {
      document.cookie = 'accessToken=; path=/; max-age=0; SameSite=Lax';
      document.cookie = 'userRole=; path=/; max-age=0; SameSite=Lax';
      localStorage.removeItem('user');
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  },
);

// ─── Shared envelope shape used by every backend response ────────────────────

export interface ApiEnvelope<T> {
  statusCode: string;
  message: string;
  result: T;
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

export interface LoginPayload {
  email: string;
  password: string;
}

// Login does NOT use the {statusCode, message, result} envelope the other
// endpoints use — it returns the token and user data flat, confirmed against
// a real response:
// { accessToken: "...", data: { fullName, email, phone, role } }
export interface LoginResponse {
  accessToken: string;
  data: {
    fullName: string;
    email: string;
    phone: string;
    role: string;
  };
}

export const loginUser = async (email: string, password: string): Promise<LoginResponse> => {
  const response = await api.post<LoginResponse>(API_ENDPOINTS.AUTH.LOGIN, { email, password });
  return response.data;
};

export const logoutUser = async (): Promise<void> => {
  await api.delete(API_ENDPOINTS.AUTH.LOGOUT);
};

// ─── Profile ──────────────────────────────────────────────────────────────────

export interface Profile {
  id: number;
  fullName: string;
  email: string;
  phone: string;
  role: Role;
  status: string;
  schoolCode?: string;
  createdAt: string;
}

export const getProfile = async (): Promise<Profile> => {
  const response = await api.get<ApiEnvelope<Profile>>(API_ENDPOINTS.PROFILE.GET);
  const profile = response.data.result;
  return { ...profile, role: normalizeRole(profile.role) };
};

export interface ProfileAddress {
  buildingName: string;
  streetName: string;
  landmark: string;
  district: string;
  city: string;
  pin: string;
  stateName: string;
}

export interface UpdateProfilePayload {
  name: string;
  phone: string;
  address: ProfileAddress;
}

export const updateProfile = async (data: UpdateProfilePayload) => {
  const response = await api.put<ApiEnvelope<Profile>>(API_ENDPOINTS.PROFILE.UPDATE, data);
  return response.data;
};

export interface UpdatePasswordPayload {
  password: string;
  confirmPassword: string;
  code: string;
}

export const updatePassword = async (data: UpdatePasswordPayload) => {
  const response = await api.put<ApiEnvelope<null>>(API_ENDPOINTS.PROFILE.UPDATE_PASSWORD, data);
  return response.data;
};

// ─── Themes ───────────────────────────────────────────────────────────────────

export interface Theme {
  id: number;
  themeName: string;
  themeType: string;
  companyName: string;
  primaryColor: string;
  secondaryColor: string;
  backgroundColor: string;
  textColor: string;
  headingColor: string;
  linkColor: string;
  buttonBgColor: string;
  buttonTextColor: string;
  navbarBgColor: string;
  navbarTextColor: string;
  footerBgColor: string;
  footerTextColor: string;
  isActive: boolean;
  bottomNavBgColor: string;
  bottomNavTextColor: string;
}

export type ThemePayload = Omit<Theme, 'id' | 'isActive'> & { id?: number };

export const getThemes = async (): Promise<Theme[]> => {
  const response = await api.get<ApiEnvelope<Theme[]>>(API_ENDPOINTS.THEMES.LIST);
  return Array.isArray(response.data.result) ? response.data.result : [];
};

/**
 * Some theme endpoints don't consistently return the {statusCode, message,
 * result} envelope (PUBLIC_ACTIVE never does — see getPublicActiveTheme).
 * This unwraps whichever shape comes back so a missing/differently-shaped
 * envelope can't silently produce `undefined`.
 */
function unwrapTheme(data: ApiEnvelope<Theme> | Theme): Theme {
  return (data as ApiEnvelope<Theme>)?.result ?? (data as Theme);
}

export const getTheme = async (id: number): Promise<Theme> => {
  const response = await api.get<ApiEnvelope<Theme> | Theme>(API_ENDPOINTS.THEMES.GET(id));
  return unwrapTheme(response.data);
};

export const getActiveTheme = async (): Promise<Theme> => {
  const response = await api.get<ApiEnvelope<Theme>>(API_ENDPOINTS.THEMES.ACTIVE);
  return response.data.result;
};

/**
 * Public/unauthenticated counterpart to getActiveTheme — for the landing
 * and login pages, before any session exists. Unlike every other theme
 * endpoint, this one returns the Theme object directly (no envelope).
 */
export const getPublicActiveTheme = async (): Promise<Theme> => {
  const response = await api.get<Theme>(API_ENDPOINTS.THEMES.PUBLIC_ACTIVE);
  return response.data;
};

export const createTheme = async (data: ThemePayload): Promise<Theme> => {
  const response = await api.post<ApiEnvelope<Theme> | Theme>(API_ENDPOINTS.THEMES.CREATE, {
    id: 0,
    ...data,
    isActive: false,
  });
  return unwrapTheme(response.data);
};

export const updateTheme = async (id: number, data: ThemePayload): Promise<Theme> => {
  const response = await api.put<ApiEnvelope<Theme> | Theme>(API_ENDPOINTS.THEMES.UPDATE(id), {
    ...data,
    id,
  });
  return unwrapTheme(response.data);
};

export const deleteTheme = async (id: number): Promise<void> => {
  await api.delete(API_ENDPOINTS.THEMES.DELETE(id));
};

/** Marks a theme as the active/default theme applied across the whole app. */
export const activateTheme = async (id: number): Promise<Theme> => {
  const response = await api.put<ApiEnvelope<Theme> | Theme>(API_ENDPOINTS.THEMES.ACTIVATE(id), {});
  return unwrapTheme(response.data);
};
