'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { apiErrorMessage } from '@/lib/api';
import { getAllTeacherStaff, type TeacherStaffMember } from '@/lib/schoolService';
import { getAttendanceByDate, type Attendance, type AttendanceStatus } from '@/lib/attendanceService';
import SetPageTitle from '@/components/dashboard/SetPageTitle';
import Modal from '@/components/ui/Modal';
import { IconButton } from '@/components/ui/Button';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const STATUS_DOT: Record<AttendanceStatus, string> = {
  PRESENT: 'bg-emerald-500',
  LATE: 'bg-amber-500',
  HALF_DAY: 'bg-amber-500',
  LOGOUT: 'bg-sky-500',
  ABSENT: 'bg-red-500',
  HOLIDAY: 'bg-slate-400',
  WEEKEND: 'bg-slate-300',
};

const STATUS_STYLES: Record<AttendanceStatus, string> = {
  PRESENT: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  LATE: 'bg-amber-50 text-amber-700 ring-amber-600/20',
  HALF_DAY: 'bg-amber-50 text-amber-700 ring-amber-600/20',
  LOGOUT: 'bg-sky-50 text-sky-700 ring-sky-600/20',
  ABSENT: 'bg-red-50 text-red-700 ring-red-600/20',
  HOLIDAY: 'bg-slate-100 text-slate-600 ring-slate-500/20',
  WEEKEND: 'bg-slate-100 text-slate-600 ring-slate-500/20',
};

const formatEnumLabel = (value: string) =>
  value
    .toLowerCase()
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

/** Backend sends a display-ready string like "10 September 2026 03:03 PM" — pull just the trailing time. */
const formatTime = (value: string | null) => {
  if (!value) return '—';
  const match = value.match(/\d{1,2}:\d{2}\s*[AP]M$/i);
  return match ? match[0] : value;
};

const pad2 = (n: number) => String(n).padStart(2, '0');
const toDateInput = (y: number, m: number, d: number) => `${y}-${pad2(m + 1)}-${pad2(d)}`;
const todayInput = () => {
  const d = new Date();
  return toDateInput(d.getFullYear(), d.getMonth(), d.getDate());
};

/**
 * One teacher's attendance as a month calendar — a dedicated page rather than
 * a modal since a month grid plus a day-detail popup doesn't fit comfortably
 * inside one dialog.
 *
 * There's no backend endpoint that filters attendance by teacher — the only
 * reliable one (GET /attendance/date/{date}) returns every record for a
 * single day, school-wide, keyed by a plain `name` string rather than a
 * user id. So this fetches that endpoint once per day of the visible month
 * (in parallel) and keeps only the row whose name matches this teacher,
 * client-side. (The bulk /attendance/user-wise-all endpoint looked like a
 * better fit but returns an empty page even for dates with confirmed
 * records — not usable against the live backend.)
 */
export default function TeacherAttendanceCalendarPageContent({ teacherId }: { teacherId: number }) {
  const router = useRouter();
  const backToAttendance = () => router.push('/principal/attedance');

  const [teacher, setTeacher] = useState<TeacherStaffMember | null>(null);
  const [teacherLoading, setTeacherLoading] = useState(true);
  const [teacherError, setTeacherError] = useState('');

  useEffect(() => {
    setTeacherLoading(true);
    getAllTeacherStaff()
      .then((page) => {
        const found = (page.content ?? []).find((t) => t.id === teacherId);
        setTeacher(found ?? null);
        if (!found) setTeacherError('Teacher not found.');
      })
      .catch((err) => setTeacherError(apiErrorMessage(err, 'Could not load this teacher.')))
      .finally(() => setTeacherLoading(false));
  }, [teacherId]);

  const now = new Date();
  const [viewYear, setViewYear] = useState(now.getFullYear());
  const [viewMonth, setViewMonth] = useState(now.getMonth());

  const [records, setRecords] = useState<Record<string, Attendance | null>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const teacherName = teacher?.teacherUser.fullName.trim().toLowerCase() ?? '';
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstWeekday = new Date(viewYear, viewMonth, 1).getDay();
  const monthDates = Array.from({ length: daysInMonth }, (_, i) => toDateInput(viewYear, viewMonth, i + 1));
  const today = todayInput();
  const canGoNext = !(viewYear === now.getFullYear() && viewMonth === now.getMonth());

  useEffect(() => {
    if (!teacher) return;
    let cancelled = false;
    setLoading(true);
    setError('');
    Promise.all(monthDates.map((date) => getAttendanceByDate(date).then((list) => [date, list] as const)))
      .then((results) => {
        if (cancelled) return;
        const byDate: Record<string, Attendance | null> = {};
        for (const [date, list] of results) {
          byDate[date] = list.find((r) => r.name.trim().toLowerCase() === teacherName) ?? null;
        }
        setRecords(byDate);
      })
      .catch((err) => {
        if (!cancelled) setError(apiErrorMessage(err, 'Could not load attendance for this month.'));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [teacher, viewYear, viewMonth]);

  const goPrevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const goNextMonth = () => {
    if (!canGoNext) return;
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  if (teacherLoading) {
    return (
      <div className="flex items-center gap-2 text-sm text-slate-500">
        <Loader2 size={16} className="animate-spin" /> Loading teacher…
      </div>
    );
  }

  if (!teacher) {
    return (
      <div className="space-y-4">
        <BackButton onClick={backToAttendance} />
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{teacherError || 'Teacher not found.'}</div>
      </div>
    );
  }

  const selectedRecord = selectedDate ? (records[selectedDate] ?? null) : null;

  return (
    <div className="space-y-4">
      <SetPageTitle title="Attendance History" />
      <BackButton onClick={backToAttendance} />

      <div className="card-premium p-4">
        <p className="text-sm font-semibold text-slate-900">{teacher.teacherUser.fullName}</p>
        <p className="text-xs text-slate-500">{teacher.teacherUser.email}</p>
      </div>

      <div className="card-premium overflow-hidden">
        <div className="flex items-center justify-between gap-2 border-b border-slate-100 px-4 py-3">
          <p className="text-sm font-semibold text-slate-900">
            {MONTH_NAMES[viewMonth]} {viewYear}
          </p>
          <div className="flex items-center gap-1">
            <IconButton icon={ChevronLeft} label="Previous month" size="sm" onClick={goPrevMonth} />
            <IconButton icon={ChevronRight} label="Next month" size="sm" disabled={!canGoNext} onClick={goNextMonth} />
          </div>
        </div>

        {error && <p className="mx-4 mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">{error}</p>}

        <div className="p-4">
          <div className="grid grid-cols-7 gap-1.5 text-center text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
            {WEEKDAYS.map((day) => (
              <div key={day} className="py-1">
                {day}
              </div>
            ))}
          </div>

          {loading ? (
            <div className="flex items-center justify-center gap-2 py-10 text-sm text-slate-500">
              <Loader2 size={15} className="animate-spin" /> Loading…
            </div>
          ) : (
            <div className="mt-1 grid grid-cols-7 gap-1.5">
              {Array.from({ length: firstWeekday }).map((_, i) => (
                <div key={`blank-${i}`} />
              ))}
              {monthDates.map((date) => {
                const day = Number(date.slice(-2));
                const record = records[date];
                const isFuture = date > today;
                const isToday = date === today;
                return (
                  <button
                    key={date}
                    type="button"
                    disabled={isFuture}
                    onClick={() => setSelectedDate(date)}
                    className={`flex h-14 flex-col items-center justify-center gap-1 rounded-lg border text-sm transition-colors ${
                      isFuture
                        ? 'cursor-not-allowed border-transparent text-slate-300'
                        : isToday
                          ? 'border-amber-400 bg-amber-50/60 text-amber-800 hover:bg-amber-50'
                          : 'border-slate-100 text-slate-700 hover:border-amber-200 hover:bg-amber-50/40'
                    }`}
                  >
                    <span className="font-medium">{day}</span>
                    {record ? (
                      <span className={`h-1.5 w-1.5 rounded-full ${STATUS_DOT[record.status] ?? 'bg-slate-400'}`} />
                    ) : (
                      <span className="h-1.5 w-1.5" />
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {selectedDate && (
        <Modal
          title="Attendance detail"
          subtitle={new Date(`${selectedDate}T00:00:00`).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          size="sm"
          onClose={() => setSelectedDate(null)}
        >
          {selectedRecord ? (
            <div className="space-y-3 text-sm">
              <span
                className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 ring-inset ${
                  STATUS_STYLES[selectedRecord.status] ?? 'bg-slate-100 text-slate-600 ring-slate-500/20'
                }`}
              >
                {formatEnumLabel(selectedRecord.status)}
              </span>
              <dl className="grid grid-cols-2 gap-x-3 gap-y-2.5">
                <div>
                  <dt className="text-xs text-slate-400">Login time</dt>
                  <dd className="font-medium text-slate-800">{formatTime(selectedRecord.loginTime)}</dd>
                </div>
                <div>
                  <dt className="text-xs text-slate-400">Logout time</dt>
                  <dd className="font-medium text-slate-800">{formatTime(selectedRecord.logoutTime)}</dd>
                </div>
                <div>
                  <dt className="text-xs text-slate-400">Working minutes</dt>
                  <dd className="font-medium text-slate-800">{selectedRecord.totalWorkingMinutes ?? '—'}</dd>
                </div>
                <div>
                  <dt className="text-xs text-slate-400">Minutes late</dt>
                  <dd className="font-medium text-slate-800">{selectedRecord.minutesLate ?? '—'}</dd>
                </div>
                <div>
                  <dt className="text-xs text-slate-400">Source</dt>
                  <dd className="font-medium text-slate-800">{selectedRecord.attendanceSource}</dd>
                </div>
              </dl>
              {selectedRecord.remarks && <p className="rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-600">{selectedRecord.remarks}</p>}
            </div>
          ) : (
            <p className="py-6 text-center text-sm text-slate-400">No attendance record for this date.</p>
          )}
        </Modal>
      )}
    </div>
  );
}

function BackButton({ onClick }: { onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 transition-colors hover:text-amber-700">
      <ArrowLeft size={15} /> Back to attendance
    </button>
  );
}
