// ─── Backend Base URL ─────────────────────────────────────────────────────────
// Set NEXT_PUBLIC_API_BASE_URL in .env.local once the backend URL is known.
// Includes the /api prefix — every endpoint below is otherwise a bare /v1/...
// path, so the prefix lives here once instead of on each individual route.

export const BACKEND_API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080/api';

// ─── API Endpoints ────────────────────────────────────────────────────────────

export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/v1/auth/login',
    LOGOUT: '/v1/auth/logout',
  },
  THEMES: {
    LIST: '/v1/themes',
    CREATE: '/v1/themes',
    GET: (id: number) => `/v1/themes/${id}`,
    UPDATE: (id: number) => `/v1/themes/${id}`,
    DELETE: (id: number) => `/v1/themes/${id}`,
    ACTIVE: '/v1/themes/active',
    ACTIVATE: (id: number) => `/v1/themes/activate-color-theme/${id}`,
    // Unauthenticated variant of ACTIVE — used for public pages (landing, login)
    // so they don't need a session just to paint the right colors.
    PUBLIC_ACTIVE: '/v1/free/colour-theme',
  },
  PROFILE: {
    GET: '/v1/profile',
    UPDATE: '/v1/profile/update',
    UPDATE_PASSWORD: '/v1/profile/update-password',
  },
} as const;
