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
    LIST: '/v1/colour-theme',
    CREATE: '/v1/colour-theme',
    GET: (id: number) => `/v1/colour-theme/${id}`,
    UPDATE: (id: number) => `/v1/colour-theme/${id}`,
    DELETE: (id: number) => `/v1/colour-theme/${id}`,
    ACTIVE: '/v1/colour-theme/active',
    ACTIVATE: (id: number) => `/v1/colour-theme/activate-color-theme/${id}`,
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
    ALL_TEACHER: '/v1/admin/all-teacher',
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
    CREATE: '/v1/student/new-addmission',
    LIST: '/v1/student/all-student',
    UPDATE: (studentId: number) => `/v1/student/update-student/${studentId}`,
    DELETE: (studentId: number) => `/v1/student/delete-student/${studentId}`,
    RAW_FILE_UPLOAD: '/v1/student/student-raw-file-upload',
  },
  STUDENT_CLASS_SECTION: {
    CREATE: '/v1/student-class-sections',
    ROSTER: (classId: number) => `/v1/student-class-sections/class/${classId}/students`,
    GET: (id: number) => `/v1/student-class-sections/${id}`,
    UPDATE: (id: number) => `/v1/student-class-sections/${id}`,
    DELETE: (id: number) => `/v1/student-class-sections/${id}`,
  },
  HOLIDAY: {
    LIST: '/v1/holiday',
    ADD: '/v1/holiday/add',
    GET: (id: number) => `/v1/holiday/${id}`,
    UPDATE: (id: number) => `/v1/holiday/${id}`,
    DELETE: (id: number) => `/v1/holiday/${id}`,
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
    SUBJECTS: (examId: number) => `/v1/exams/${examId}/subjects`,
  },
  // Unlike every other controller, this one isn't versioned under /v1 on the
  // backend — its path is /api/exam-results, and BACKEND_API_BASE_URL above
  // already ends in /api, so the route here is bare. This 404s until the
  // controller is deployed on a given environment — that's a backend/deploy
  // state issue, not a wrong path (confirmed: /v1/exam-results 404s too).
  EXAM_RESULT: {
    LIST: '/v1/exam-results',
    CREATE: '/v1/exam-results',
    GET: (id: number) => `/v1/exam-results/${id}`,
    UPDATE: (id: number) => `/v1/exam-results/${id}`,
    DELETE: (id: number) => `/v1/exam-results/${id}`,
    UPDATE_STATUS: (id: number) => `/v1/exam-results/${id}/status`,
  },
  TEST_EXAM: {
    LIST: '/v1/test-exam',
    CREATE: '/v1/test-exam',
    GET: (id: number) => `/v1/test-exam/${id}`,
    UPDATE: (id: number) => `/v1/test-exam/${id}`,
    DELETE: (id: number) => `/v1/test-exam/${id}`,
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
  CLASS_SUBJECT: {
    LIST: '/v1/class-subjects',
    CREATE: '/v1/class-subjects',
    GET: (id: number) => `/v1/class-subjects/${id}`,
    UPDATE: (id: number) => `/v1/class-subjects/${id}`,
    DELETE: (id: number) => `/v1/class-subjects/${id}`,
    BULK_UPDATE: '/v1/class-subjects/bulk-update',
  },
  FEE_STRUCTURE: {
    LIST: '/v1/fee-structures',
    CREATE: '/v1/fee-structures',
    GET: (id: number) => `/v1/fee-structures/${id}`,
    UPDATE: (id: number) => `/v1/fee-structures/${id}`,
    DELETE: (id: number) => `/v1/fee-structures/${id}`,
  },
  STUDENT_FEE: {
    LIST: '/v1/student-fees',
    GET: (id: number) => `/v1/student-fees/${id}`,
    DELETE: (id: number) => `/v1/student-fees/${id}`,
    GENERATE: '/v1/student-fees/generate',
    MARK_OVERDUE: '/v1/student-fees/overdue/mark',
    PAYMENTS: (id: number) => `/v1/student-fees/${id}/payments`,
    ALL_PAYMENTS: '/v1/student-fees/all-payment',
  },
  STUDENT_CONCESSION: {
    LIST: '/v1/student-concessions',
    CREATE: '/v1/student-concessions',
    GET: (id: number) => `/v1/student-concessions/${id}`,
    UPDATE: (id: number) => `/v1/student-concessions/${id}`,
    DELETE: (id: number) => `/v1/student-concessions/${id}`,
  },
  PERIOD: {
    LIST: '/v1/periods',
    CREATE: '/v1/periods',
    GET: (id: number) => `/v1/periods/${id}`,
    UPDATE: (id: number) => `/v1/periods/${id}`,
    DELETE: (id: number) => `/v1/periods/${id}`,
  },
  WEEKLY_TIMETABLE: {
    LIST: '/v1/weekly-timetables',
    CREATE: '/v1/weekly-timetables',
    UPDATE: (id: number) => `/v1/weekly-timetables/${id}`,
    DELETE: (id: number) => `/v1/weekly-timetables/${id}`,
  },
  NOTICE_BOARD: {
    LIST: '/v1/notice-boards',
    CREATE: '/v1/notice-boards',
    GET: (id: number) => `/v1/notice-boards/${id}`,
    UPDATE: (id: number) => `/v1/notice-boards/${id}`,
    DELETE: (id: number) => `/v1/notice-boards/${id}`,
  },
  STAFF_PERMISSION: {
    LIST: '/v1/staff-permissions',
    ADD: '/v1/staff-permissions/add',
    GET: (id: number) => `/v1/staff-permissions/${id}`,
    UPDATE: '/v1/staff-permissions/update',
  },
  ACCESS_ATTRIBUTE: {
    LIST: '/v1/access-attribute',
    ADD: '/v1/access-attribute/add',
    GET: (attributeId: number) => `/v1/access-attribute/${attributeId}`,
    UPDATE: (attributeId: number) => `/v1/access-attribute/update/${attributeId}`,
    DELETE: (attributeId: number) => `/v1/access-attribute/delete/${attributeId}`,
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
