// lib/auth.ts — cookie-backed session storage + role helpers.
//
// The access token and role live in cookies (not just localStorage) so that
// proxy.ts (Next's server-side request hook) can read them and enforce
// role-based routing before a page ever renders.

export type Role = 'SUPERADMIN' | 'PRINCIPAL' | 'TEACHER' | 'STAFF' | 'STUDENT';

export interface SessionUser {
  id: number;
  fullName: string;
  email: string;
  phone?: string;
  role: Role;
  status?: string;
}

const COOKIE_OPTIONS = '; path=/; SameSite=Lax; max-age=86400'; // 24h

function buildCookieString(name: string, value: string): string {
  const secure =
    typeof window !== 'undefined' && window.location.protocol === 'https:' ? '; Secure' : '';
  return `${name}=${encodeURIComponent(value)}${COOKIE_OPTIONS}${secure}`;
}

function deleteCookie(name: string): void {
  if (typeof document !== 'undefined') {
    document.cookie = `${name}=; path=/; max-age=0; SameSite=Lax`;
  }
}

function readCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp(`(^| )${name}=([^;]+)`));
  return match ? decodeURIComponent(match[2]) : null;
}

// ─── Token ────────────────────────────────────────────────────────────────────

export const setAuthToken = (token: string) => {
  if (typeof window !== 'undefined') {
    document.cookie = buildCookieString('accessToken', token);
  }
};

export const getAuthToken = (): string | null => readCookie('accessToken');

// ─── User ─────────────────────────────────────────────────────────────────────

export const setUser = (user: SessionUser) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('user', JSON.stringify(user));
    document.cookie = buildCookieString('userRole', (user.role ?? '').toUpperCase());
    window.dispatchEvent(new CustomEvent('userUpdated', { detail: user }));
  }
};

export const getUser = (): SessionUser | null => {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem('user');
  if (!raw) return null;
  try {
    return JSON.parse(raw) as SessionUser;
  } catch {
    localStorage.removeItem('user');
    return null;
  }
};

export const getUserRole = (): Role | null => (getUser()?.role ?? null);

// ─── Logout / session clear ───────────────────────────────────────────────────

export const clearAuth = () => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('user');
    deleteCookie('accessToken');
    deleteCookie('userRole');
  }
};

export const isAuthenticated = (): boolean => !!getAuthToken();

// ─── Role-based routing ───────────────────────────────────────────────────────

/** Returns the home dashboard path for a role. Used by login, proxy, and dashboard links. */
export function getDashboardByRole(role: string): string {
  switch (role?.toUpperCase()) {
    case 'SUPERADMIN': return '/superadmin/dashboard';
    case 'PRINCIPAL' : return '/principal/dashboard';
    case 'TEACHER'   : return '/teacher/dashboard';
    case 'STAFF'     : return '/staff/dashboard';
    case 'STUDENT'   : return '/student/dashboard';
    default          : return '/login';
  }
}

/** Base route segment owned by a role, e.g. SUPERADMIN -> "superadmin". */
export function getRoleBasePath(role: string): string {
  return role?.toLowerCase();
}
