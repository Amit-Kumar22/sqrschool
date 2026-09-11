'use client';

import { useEffect, useMemo, useState } from 'react';
import { CalendarClock, Clock, Users } from 'lucide-react';
import { apiErrorMessage } from '@/lib/api';
import {
  DAYS_OF_WEEK,
  formatTime,
  getTeacherWeeklyTimetable,
  type DayOfWeek,
  type TeacherWeeklyTimetableEntry,
} from '@/lib/timetableService';
import SetPageTitle from '@/components/dashboard/SetPageTitle';
import { SelectField } from '@/components/ui/FormField';
import Button from '@/components/ui/Button';
import { subjectColor } from './subjectColors';

const GRID_DAYS = DAYS_OF_WEEK.filter((day) => day !== 'SUNDAY');
const JS_DAY_TO_ENUM: DayOfWeek[] = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
const dayLabel = (day: DayOfWeek) => day.charAt(0) + day.slice(1).toLowerCase();

function distinctOptions(entries: TeacherWeeklyTimetableEntry[], idKey: 'classId' | 'subjectId', nameKey: 'className' | 'subjectName') {
  const map = new Map<number, string>();
  entries.forEach((entry) => map.set(entry[idKey], entry[nameKey]));
  return Array.from(map, ([id, name]) => ({ id, name }));
}

/** Read-only "My Weekly Timetable" for the Teacher panel — one card per assigned period, grouped by day. */
export default function TeacherTimetablePageContent() {
  const [allEntries, setAllEntries] = useState<TeacherWeeklyTimetableEntry[]>([]);
  const [entries, setEntries] = useState<TeacherWeeklyTimetableEntry[]>([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [classFilter, setClassFilter] = useState<number | ''>('');
  const [subjectFilter, setSubjectFilter] = useState<number | ''>('');
  const [dayFilter, setDayFilter] = useState<DayOfWeek | ''>('');

  useEffect(() => {
    getTeacherWeeklyTimetable()
      .then(setAllEntries)
      .catch((err) => setError(apiErrorMessage(err, 'Could not load your timetable.')))
      .finally(() => setInitialLoading(false));
  }, []);

  useEffect(() => {
    if (initialLoading) return;
    let cancelled = false;
    setLoading(true);
    setError('');
    getTeacherWeeklyTimetable({
      classId: classFilter || undefined,
      subjectId: subjectFilter || undefined,
      dayOfWeek: dayFilter || undefined,
    })
      .then((res) => !cancelled && setEntries(res))
      .catch((err) => !cancelled && setError(apiErrorMessage(err, 'Could not load your timetable.')))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [classFilter, subjectFilter, dayFilter, initialLoading]);

  const classOptions = useMemo(() => distinctOptions(allEntries, 'classId', 'className'), [allEntries]);
  const subjectOptions = useMemo(() => distinctOptions(allEntries, 'subjectId', 'subjectName'), [allEntries]);
  const hasActiveFilter = !!(classFilter || subjectFilter || dayFilter);
  const resetFilters = () => {
    setClassFilter('');
    setSubjectFilter('');
    setDayFilter('');
  };

  const today = JS_DAY_TO_ENUM[new Date().getDay()];
  const days = dayFilter ? [dayFilter] : GRID_DAYS;

  const entriesByDay = (day: DayOfWeek) =>
    entries.filter((e) => e.dayOfWeek === day).sort((a, b) => a.periodOrder - b.periodOrder);

  return (
    <div className="space-y-4">
      <SetPageTitle title="Weekly Timetable" />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">My Weekly Timetable</h1>
          <p className="text-sm text-slate-500">Your scheduled class periods for the week</p>
        </div>
      </div>

      <div className="card-premium p-4">
        <div className="flex flex-wrap items-end gap-1.5">
          <SelectField
            label="Class"
            uiSize="sm"
            wrapperClassName="w-36"
            value={classFilter}
            disabled={initialLoading || classOptions.length === 0}
            onChange={(e) => setClassFilter(e.target.value ? Number(e.target.value) : '')}
          >
            <option value="">All classes</option>
            {classOptions.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </SelectField>

          <SelectField
            label="Subject"
            uiSize="sm"
            wrapperClassName="w-36"
            value={subjectFilter}
            disabled={initialLoading || subjectOptions.length === 0}
            onChange={(e) => setSubjectFilter(e.target.value ? Number(e.target.value) : '')}
          >
            <option value="">All subjects</option>
            {subjectOptions.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </SelectField>

          <SelectField
            label="Day"
            uiSize="sm"
            wrapperClassName="w-32"
            value={dayFilter}
            onChange={(e) => setDayFilter(e.target.value as DayOfWeek | '')}
          >
            <option value="">All days</option>
            {GRID_DAYS.map((day) => (
              <option key={day} value={day}>
                {dayLabel(day)}
              </option>
            ))}
          </SelectField>

          {hasActiveFilter && (
            <Button type="button" variant="ghost" size="sm" onClick={resetFilters}>
              Clear
            </Button>
          )}
        </div>
      </div>

      {error && <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}

      {initialLoading || loading ? (
        <div className="card-premium px-4 py-16 text-center text-sm text-slate-400">Loading timetable…</div>
      ) : entries.length === 0 ? (
        <div className="card-premium flex flex-col items-center gap-2 px-4 py-16 text-center">
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-amber-50 text-amber-700">
            <CalendarClock size={20} />
          </span>
          <p className="text-sm font-semibold text-slate-900">No periods found</p>
          <p className="text-xs text-slate-500">
            {allEntries.length === 0 ? "You don't have any class periods assigned yet." : 'No periods match these filters.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {days
            .filter((day) => entriesByDay(day).length > 0)
            .map((day) => (
              <div key={day} className="card-premium overflow-hidden">
                <div
                  className={`flex items-center justify-between border-b border-amber-100 px-4 py-2.5 ${
                    day === today ? 'bg-amber-100' : 'bg-amber-50/70'
                  }`}
                >
                  <span className={`text-xs font-semibold tracking-wide uppercase ${day === today ? 'text-amber-700' : 'text-amber-600'}`}>
                    {dayLabel(day)}
                    {day === today && <span className="ml-1.5 font-normal normal-case text-amber-500">· Today</span>}
                  </span>
                  <span className="text-xs text-slate-400">
                    {entriesByDay(day).length} period{entriesByDay(day).length === 1 ? '' : 's'}
                  </span>
                </div>
                <div className="grid grid-cols-1 gap-2.5 p-3 sm:grid-cols-2 lg:grid-cols-3">
                  {entriesByDay(day).map((entry) => {
                    const color = subjectColor(entry.subjectId);
                    return (
                      <div key={entry.id} className={`rounded-lg border px-3 py-2.5 ${color.bg} ${color.border}`}>
                        <div className="flex items-start justify-between gap-2">
                          <p className={`text-sm font-semibold ${color.text}`}>{entry.subjectName}</p>
                          <span className="flex shrink-0 items-center gap-1 text-[11px] text-slate-500">
                            <Clock size={11} />
                            {formatTime(entry.startTime)}
                          </span>
                        </div>
                        <p className="mt-0.5 flex items-center gap-1 text-xs text-slate-600">
                          <Users size={11} className="shrink-0 text-slate-400" />
                          {entry.className} · {entry.periodName}
                        </p>
                        {entry.otherTeacherName && (
                          <p className="mt-1 text-[11px] text-slate-400">with {entry.otherTeacherName}</p>
                        )}
                        {entry.remarks && <p className="mt-1 text-[11px] text-slate-400 italic">{entry.remarks}</p>}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
        </div>
      )}
    </div>
  );
}
