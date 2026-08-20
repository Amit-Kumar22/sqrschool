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
  SCHOOL: {
    LIST: '/v1/school',
    CREATE: '/v1/school',
    UPDATE: (id: number) => `/v1/school/${id}`,
    DELETE: (id: number) => `/v1/school/${id}`,
    DETAIL: (schoolId: number) => `/v1/school/detail/${schoolId}`,
  },
  ADMIN: {
    ADD_STAFF: '/v1/admin/add-staff',
    ALL_STAFF: '/v1/admin/all-staff',
  },
  STUDENT_ADMISSION: {
    CREATE: '/v1/student-admissions/new-addmission',
    LIST: '/v1/student-admissions/all-student',
  },
  ACADEMIC_YEAR: {
    LIST: '/v1/academic-year',
    CREATE: '/v1/academic-year',
    GET: (id: number) => `/v1/academic-year/${id}`,
    UPDATE: (id: number) => `/v1/academic-year/${id}`,
    DELETE: (id: number) => `/v1/academic-year/${id}`,
  },
  CLASS: {
    SAVE: '/v1/class/save',
    LIST: '/v1/class/list',
    // Same path serves both GET (fetch current values) and POST (update).
    UPDATE: (id: number) => `/v1/class/update/${id}`,
    DELETE: (id: number) => `/v1/class/delete/${id}`,
  },
  CLASS_SECTION: {
    SAVE: '/v1/class/section/save',
    LIST: '/v1/class/section/list',
    UPDATE: (id: number) => `/v1/class/section/update/${id}`,
    GET: (id: number) => `/v1/class/section/${id}`,
    DELETE: (id: number) => `/v1/class/section/delete/${id}`,
  },
  INFRASTRUCTURE: {
    LIST: '/v1/infrastructure',
    CREATE: '/v1/infrastructure',
    GET: (id: number) => `/v1/infrastructure/${id}`,
    UPDATE: (id: number) => `/v1/infrastructure/${id}`,
    DELETE: (id: number) => `/v1/infrastructure/${id}`,
  },
  YOUTUBE_TESTIMONIAL: {
    LIST: '/v1/youtube-testimonial',
    CREATE: '/v1/youtube-testimonial',
    GET: (id: number) => `/v1/youtube-testimonial/${id}`,
    UPDATE: (id: number) => `/v1/youtube-testimonial/${id}`,
    DELETE: (id: number) => `/v1/youtube-testimonial/${id}`,
  },
  CHATBOT: {
    LIST: '/v1/chatbot',
    CREATE: '/v1/chatbot',
    GET: (id: number) => `/v1/chatbot/${id}`,
    UPDATE: (id: number) => `/v1/chatbot/${id}`,
    DELETE: (id: number) => `/v1/chatbot/${id}`,
    SEARCH: '/v1/chatbot/search',
  },
  SCHOOL_LEADS: {
    LIST: '/v1/school-leads',
  },
  // Public/unauthenticated endpoints consumed by the marketing home page —
  // no session required, see lib/freeService.ts.
  FREE: {
    INFRASTRUCTURE: '/v1/free/infrastructure',
    ANNOUNCEMENTS_ACTIVE: '/v1/free/announcements/active',
    ABOUT_US: '/v1/free/about-us',
  },
} as const;
