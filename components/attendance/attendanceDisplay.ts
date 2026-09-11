import type { AttendanceStatus } from '@/lib/attendanceService';

// ─── Shared attendance display helpers ────────────────────────────────────────
// Status colors/labels used by both the calendar (PersonAttendanceCalendar)
// and any standalone "today" summary (e.g. StudentAttendancePageContent).

export const STATUS_DOT: Record<AttendanceStatus, string> = {
  PRESENT: 'bg-emerald-500',
  LATE: 'bg-amber-500',
  HALF_DAY: 'bg-amber-500',
  LOGOUT: 'bg-sky-500',
  ABSENT: 'bg-red-500',
  HOLIDAY: 'bg-slate-400',
  WEEKEND: 'bg-slate-300',
};

export const STATUS_STYLES: Record<AttendanceStatus, string> = {
  PRESENT: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  LATE: 'bg-amber-50 text-amber-700 ring-amber-600/20',
  HALF_DAY: 'bg-amber-50 text-amber-700 ring-amber-600/20',
  LOGOUT: 'bg-sky-50 text-sky-700 ring-sky-600/20',
  ABSENT: 'bg-red-50 text-red-700 ring-red-600/20',
  HOLIDAY: 'bg-slate-100 text-slate-600 ring-slate-500/20',
  WEEKEND: 'bg-slate-100 text-slate-600 ring-slate-500/20',
};

export const formatEnumLabel = (value: string) =>
  value
    .toLowerCase()
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

/** loginTime/logoutTime come back as ISO datetimes. */
export const formatClockTime = (value: string | null) => {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};
