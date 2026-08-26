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
  TEACHER: {
    ALL_STUDENT: '/v1/teacher/all-student',
  },
  TEACHER_SUBJECT_MAPPING: {
    LIST: '/v1/student-subject-section-mapping',
    CREATE: '/v1/student-subject-section-mapping',
    GET: (id: number) => `/v1/student-subject-section-mapping/${id}`,
    UPDATE: (id: number) => `/v1/student-subject-section-mapping/${id}`,
    DELETE: (id: number) => `/v1/student-subject-section-mapping/${id}`,
    ADMIN_LIST: '/v1/student-subject-section-mapping/admin',
  },
  STUDENT_ADMISSION: {
    CREATE: '/v1/student-admissions/new-addmission',
    LIST: '/v1/student-admissions/all-student',
  },
  STUDENT_CLASS_SECTION: {
    CREATE: '/v1/student-class-sections',
    ROSTER: (classId: number) => `/v1/student-class-sections/class/${classId}/students`,
    GET: (id: number) => `/v1/student-class-sections/${id}`,
    UPDATE: (id: number) => `/v1/student-class-sections/${id}`,
    DELETE: (id: number) => `/v1/student-class-sections/${id}`,
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
  EXAM: {
    LIST: '/v1/exams',
    CREATE: '/v1/exams',
    GET: (id: number) => `/v1/exams/${id}`,
    UPDATE: (id: number) => `/v1/exams/${id}`,
    DELETE: (id: number) => `/v1/exams/${id}`,
  },
  HOME_WORK: {
    LIST: '/v1/home-work',
    CREATE: '/v1/home-work',
    ADD_DAILY: '/v1/home-work/add-daily',
    GET: (id: number) => `/v1/home-work/${id}`,
    DELETE: (id: number) => `/v1/home-work/${id}`,
  },
  QUESTION: {
    LIST: '/v1/questions',
    CREATE: '/v1/questions',
    GET: (id: number) => `/v1/questions/${id}`,
    UPDATE: (id: number) => `/v1/questions/${id}`,
    DELETE: (id: number) => `/v1/questions/${id}`,
    BY_SUBJECT: (subjectId: number) => `/v1/questions/subject/${subjectId}`,
    BY_SUBJECT_AND_TYPE: (subjectId: number, type: string) => `/v1/questions/subject/${subjectId}/type/${type}`,
  },
  SUBJECT: {
    SAVE: '/v1/subject/save',
    LIST: '/v1/subject/list',
    GET: (id: number) => `/v1/subject/${id}`,
    UPDATE: (id: number) => `/v1/subject/update/${id}`,
    DELETE: (id: number) => `/v1/subject/delete/${id}`,
  },
  FEE_STRUCTURE: {
    LIST: '/v1/fee-structures',
    CREATE: '/v1/fee-structures',
    GET: (id: number) => `/v1/fee-structures/${id}`,
    UPDATE: (id: number) => `/v1/fee-structures/${id}`,
    DELETE: (id: number) => `/v1/fee-structures/${id}`,
  },
  // Public/unauthenticated endpoints consumed by the marketing home page —
  // no session required, see lib/freeService.ts.
  FREE: {
    INFRASTRUCTURE: '/v1/free/infrastructure',
    ANNOUNCEMENTS_ACTIVE: '/v1/free/announcements/active',
    ABOUT_US: '/v1/free/about-us',
  },
  // Website Settings — CMS-style endpoints behind the marketing site, all
  // sharing the same LIST/CREATE/GET/UPDATE/DELETE shape. See lib/websiteSettingService.ts.
  WEBSITE_HEADER: {
    LIST: '/v1/website-header',
    CREATE: '/v1/website-header',
    GET: (id: number) => `/v1/website-header/${id}`,
    UPDATE: (id: number) => `/v1/website-header/${id}`,
    DELETE: (id: number) => `/v1/website-header/${id}`,
  },
  WEBSITE_HERO_SLIDE: {
    LIST: '/v1/website-hero-slide',
    CREATE: '/v1/website-hero-slide',
    GET: (id: number) => `/v1/website-hero-slide/${id}`,
    UPDATE: (id: number) => `/v1/website-hero-slide/${id}`,
    DELETE: (id: number) => `/v1/website-hero-slide/${id}`,
  },
  WEBSITE_HERO_BUTTON: {
    LIST: '/v1/website-hero-button',
    CREATE: '/v1/website-hero-button',
    GET: (id: number) => `/v1/website-hero-button/${id}`,
    UPDATE: (id: number) => `/v1/website-hero-button/${id}`,
    DELETE: (id: number) => `/v1/website-hero-button/${id}`,
  },
  WEBSITE_SECTION: {
    LIST: '/v1/website-section',
    CREATE: '/v1/website-section',
    GET: (id: number) => `/v1/website-section/${id}`,
    UPDATE: (id: number) => `/v1/website-section/${id}`,
    DELETE: (id: number) => `/v1/website-section/${id}`,
  },
  WEBSITE_FEATURE: {
    LIST: '/v1/website-feature',
    CREATE: '/v1/website-feature',
    GET: (id: number) => `/v1/website-feature/${id}`,
    UPDATE: (id: number) => `/v1/website-feature/${id}`,
    DELETE: (id: number) => `/v1/website-feature/${id}`,
  },
  WEBSITE_STATISTIC: {
    LIST: '/v1/website-statistic',
    CREATE: '/v1/website-statistic',
    GET: (id: number) => `/v1/website-statistic/${id}`,
    UPDATE: (id: number) => `/v1/website-statistic/${id}`,
    DELETE: (id: number) => `/v1/website-statistic/${id}`,
  },
  WEBSITE_WHY_CHOOSE_POINT: {
    LIST: '/v1/website-why-choose-point',
    CREATE: '/v1/website-why-choose-point',
    GET: (id: number) => `/v1/website-why-choose-point/${id}`,
    UPDATE: (id: number) => `/v1/website-why-choose-point/${id}`,
    DELETE: (id: number) => `/v1/website-why-choose-point/${id}`,
  },
  WEBSITE_TOPPER: {
    LIST: '/v1/website-topper',
    CREATE: '/v1/website-topper',
    GET: (id: number) => `/v1/website-topper/${id}`,
    UPDATE: (id: number) => `/v1/website-topper/${id}`,
    DELETE: (id: number) => `/v1/website-topper/${id}`,
  },
  WEBSITE_GALLERY_ITEM: {
    LIST: '/v1/website-gallery-item',
    CREATE: '/v1/website-gallery-item',
    GET: (id: number) => `/v1/website-gallery-item/${id}`,
    UPDATE: (id: number) => `/v1/website-gallery-item/${id}`,
    DELETE: (id: number) => `/v1/website-gallery-item/${id}`,
  },
  WEBSITE_SOCIAL_LINK: {
    LIST: '/v1/website-social-link',
    CREATE: '/v1/website-social-link',
    GET: (id: number) => `/v1/website-social-link/${id}`,
    UPDATE: (id: number) => `/v1/website-social-link/${id}`,
    DELETE: (id: number) => `/v1/website-social-link/${id}`,
  },
  WEBSITE_CONTACT: {
    LIST: '/v1/website-contact',
    CREATE: '/v1/website-contact',
    GET: (id: number) => `/v1/website-contact/${id}`,
    UPDATE: (id: number) => `/v1/website-contact/${id}`,
    DELETE: (id: number) => `/v1/website-contact/${id}`,
  },
  WEBSITE_FLOATING_SETTING: {
    LIST: '/v1/website-floating-setting',
    CREATE: '/v1/website-floating-setting',
    GET: (id: number) => `/v1/website-floating-setting/${id}`,
    UPDATE: (id: number) => `/v1/website-floating-setting/${id}`,
    DELETE: (id: number) => `/v1/website-floating-setting/${id}`,
  },
} as const;
