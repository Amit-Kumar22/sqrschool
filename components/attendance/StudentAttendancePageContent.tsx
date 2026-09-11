'use client';

import { useEffect, useState } from 'react';
import { CalendarCheck, Loader2 } from 'lucide-react';
import { getProfile, apiErrorMessage } from '@/lib/api';
import { getUserTodayAttendance, type Attendance } from '@/lib/attendanceService';
import SetPageTitle from '@/components/dashboard/SetPageTitle';
import PersonAttendanceCalendar from './PersonAttendanceCalendar';
import { STATUS_STYLES, formatClockTime, formatEnumLabel } from './attendanceDisplay';

/**
 * Read-only attendance view for the Student panel — today's status plus the
 * full history calendar, both keyed by this student's own user id (from the
 * profile endpoint, not the cached session user, so it's always current).
 */
export default function StudentAttendancePageContent() {
  const [userId, setUserId] = useState<number | null>(null);
  const [today, setToday] = useState<Attendance | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');
    (async () => {
      try {
        const profile = await getProfile();
        if (cancelled) return;
        setUserId(profile.id);
        const record = await getUserTodayAttendance(profile.id);
        if (!cancelled) setToday(record);
      } catch (err) {
        if (!cancelled) setError(apiErrorMessage(err, 'Could not load your attendance.'));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="space-y-4">
      <SetPageTitle title="Attendance" />

      <div className="card-premium animate-fade-in-up relative overflow-hidden p-4">
        <span className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-amber-500 via-orange-400 to-amber-400" />
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-amber-400 to-amber-600 text-white shadow-premium-sm">
            <CalendarCheck size={15} />
          </span>
          <p className="text-sm font-semibold text-slate-900">Today</p>
        </div>

        {error && <p className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">{error}</p>}

        {loading ? (
          <div className="mt-3 flex items-center gap-2 text-sm text-slate-500">
            <Loader2 size={15} className="animate-spin" /> Loading…
          </div>
        ) : today ? (
          <div className="mt-3 space-y-3">
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 ring-inset ${
                STATUS_STYLES[today.status] ?? 'bg-slate-100 text-slate-600 ring-slate-500/20'
              }`}
            >
              {formatEnumLabel(today.status)}
            </span>
            <dl className="grid grid-cols-2 gap-x-3 gap-y-2.5 sm:grid-cols-3">
              <div>
                <dt className="text-xs text-slate-400">Login time</dt>
                <dd className="text-sm font-medium text-slate-800">{formatClockTime(today.loginTime)}</dd>
              </div>
              <div>
                <dt className="text-xs text-slate-400">Logout time</dt>
                <dd className="text-sm font-medium text-slate-800">{formatClockTime(today.logoutTime)}</dd>
              </div>
              <div>
                <dt className="text-xs text-slate-400">Source</dt>
                <dd className="text-sm font-medium text-slate-800">{formatEnumLabel(today.attendanceSource)}</dd>
              </div>
            </dl>
          </div>
        ) : (
          !error && <p className="mt-3 text-sm text-slate-400">Not marked yet today.</p>
        )}
      </div>

      {userId && <PersonAttendanceCalendar userId={userId} />}
    </div>
  );
}
