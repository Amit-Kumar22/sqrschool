'use client';

import { useEffect, useState } from 'react';
import { ChevronDown, Clock, Plus, Settings } from 'lucide-react';
import { apiErrorMessage } from '@/lib/api';
import { getClasses, type SchoolClass } from '@/lib/classService';
import { getSubjects, type Subject } from '@/lib/subjectService';
import { getAllTeacherStaff, type TeacherStaffMember } from '@/lib/schoolService';
import {
  DAYS_OF_WEEK,
  formatTime,
  getPeriods,
  getWeeklyTimetable,
  type DayOfWeek,
  type Period,
  type WeeklyTimetableEntry,
} from '@/lib/timetableService';
import SetPageTitle from '@/components/dashboard/SetPageTitle';
import Button from '@/components/ui/Button';
import ManagePeriodsModal from './ManagePeriodsModal';
import AssignmentFormModal from './AssignmentFormModal';
import { subjectColor } from './subjectColors';

// Grid only shows the six teaching days — Sunday is supported by the API
// but not part of a school's weekly timetable display.
const GRID_DAYS = DAYS_OF_WEEK.filter((day) => day !== 'SUNDAY');

const JS_DAY_TO_ENUM: DayOfWeek[] = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];

const dayLabel = (day: DayOfWeek) => day.charAt(0) + day.slice(1).toLowerCase();

interface AssignTarget {
  period: Period;
  day: DayOfWeek;
  entry: WeeklyTimetableEntry | null;
}

/** Weekly Timetable — per-class period grid with subject/teacher assignments, plus period management. */
export default function TimetablePageContent() {
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [teachers, setTeachers] = useState<TeacherStaffMember[]>([]);
  const [classId, setClassId] = useState<number | ''>('');
  const [initialLoading, setInitialLoading] = useState(true);

  const [periods, setPeriods] = useState<Period[]>([]);
  const [entries, setEntries] = useState<WeeklyTimetableEntry[]>([]);
  const [gridLoading, setGridLoading] = useState(false);
  const [error, setError] = useState('');

  const [activeSubjectId, setActiveSubjectId] = useState<number | null>(null);
  const [manageOpen, setManageOpen] = useState(false);
  const [assignTarget, setAssignTarget] = useState<AssignTarget | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [classesRes, subjectsRes, teachersRes] = await Promise.all([getClasses(), getSubjects(), getAllTeacherStaff()]);
        if (cancelled) return;
        const classList = classesRes.content ?? [];
        setClasses(classList);
        setSubjects(subjectsRes.content ?? []);
        setTeachers(teachersRes.content ?? []);
        setClassId((prev) => prev || (classList[0]?.id ?? ''));
      } catch (err) {
        if (!cancelled) setError(apiErrorMessage(err, 'Could not load timetable data.'));
      } finally {
        if (!cancelled) setInitialLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const loadGrid = async (id: number) => {
    setGridLoading(true);
    setError('');
    try {
      const [periodsRes, entriesRes] = await Promise.all([getPeriods({ classId: id }), getWeeklyTimetable({ classId: id })]);
      setPeriods(periodsRes ?? []);
      setEntries(entriesRes ?? []);
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not load the timetable for this class.'));
    } finally {
      setGridLoading(false);
    }
  };

  useEffect(() => {
    if (!classId) return;
    loadGrid(classId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [classId]);

  const sortedPeriods = [...periods].sort((a, b) => a.periodOrder - b.periodOrder);
  const entryMap = new Map(entries.map((e) => [`${e.periodId}-${e.dayOfWeek}`, e]));
  const today = JS_DAY_TO_ENUM[new Date().getDay()];

  const refreshGrid = () => {
    if (classId) loadGrid(classId);
  };

  return (
    <div className="space-y-4">
      <SetPageTitle title="Weekly Timetable" />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">Weekly Timetable</h1>
          <p className="text-sm text-slate-500">View and manage class schedules</p>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <select
              value={classId}
              disabled={classes.length === 0}
              onChange={(e) => setClassId(Number(e.target.value))}
              className="h-9 appearance-none rounded-full border border-amber-300 bg-white pr-9 pl-4 text-sm font-semibold text-slate-800 shadow-premium-sm transition-colors hover:border-amber-400 focus:border-amber-400 focus:ring-2 focus:ring-amber-400/25 focus:outline-none disabled:opacity-50"
            >
              {classes.length === 0 && <option>No classes</option>}
              {classes.map((cls) => (
                <option key={cls.id} value={cls.id}>
                  Class {cls.className}
                </option>
              ))}
            </select>
            <ChevronDown size={14} className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-amber-500" />
          </div>

          <Button variant="secondary" size="sm" icon={Settings} disabled={!classId} onClick={() => setManageOpen(true)}>
            Manage Periods
          </Button>
        </div>
      </div>

      <div className="scrollbar-thin flex flex-wrap gap-2 overflow-x-auto">
        {subjects.map((subject) => {
          const color = subjectColor(subject.id);
          const active = activeSubjectId === subject.id;
          return (
            <button
              key={subject.id}
              type="button"
              onClick={() => setActiveSubjectId((prev) => (prev === subject.id ? null : subject.id))}
              className={`h-8 shrink-0 rounded-full px-3.5 text-sm font-medium transition-colors ${
                active ? 'border-2 border-slate-900 bg-white text-slate-900' : `border border-transparent ${color.bg} ${color.text} hover:opacity-80`
              }`}
            >
              {subject.subjectName}
            </button>
          );
        })}
      </div>

      {error && <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}

      <div className="card-premium overflow-hidden">
        <div className="scrollbar-thin overflow-x-auto">
          <table className="w-full min-w-[900px] border-collapse text-sm">
            <thead>
              <tr>
                <th className="w-36 border-b border-amber-100 bg-amber-50/70 px-3 py-3 text-left text-xs font-semibold tracking-wide text-amber-700 uppercase">
                  <span className="inline-flex items-center gap-1.5">
                    <Clock size={13} /> Time
                  </span>
                </th>
                {GRID_DAYS.map((day) => (
                  <th
                    key={day}
                    className={`border-b border-amber-100 px-3 py-3 text-center text-xs font-semibold tracking-wide uppercase ${
                      day === today ? 'bg-amber-100 text-amber-700' : 'bg-amber-50/70 text-amber-600'
                    }`}
                  >
                    {dayLabel(day)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {initialLoading || gridLoading ? (
                <tr>
                  <td colSpan={GRID_DAYS.length + 1} className="px-4 py-16 text-center text-sm text-slate-400">
                    Loading timetable…
                  </td>
                </tr>
              ) : sortedPeriods.length === 0 ? (
                <tr>
                  <td colSpan={GRID_DAYS.length + 1} className="px-4 py-16 text-center">
                    <p className="text-sm font-semibold text-slate-900">No periods yet</p>
                    <p className="text-xs text-slate-500">Click Manage Periods to set up this class&apos;s schedule.</p>
                  </td>
                </tr>
              ) : (
                sortedPeriods.map((period) =>
                  period.breakPeriod ? (
                    <tr key={period.id} className="border-b border-slate-100 bg-amber-50/40">
                      <td className="px-3 py-2.5 align-middle">
                        <p className="text-xs font-semibold text-slate-700">{period.name}</p>
                        <p className="text-[11px] text-slate-400">
                          {formatTime(period.startTime)} – {formatTime(period.endTime)}
                        </p>
                      </td>
                      <td colSpan={GRID_DAYS.length} className="px-3 py-2.5 text-center text-xs font-medium text-slate-400 italic">
                        {period.name}
                      </td>
                    </tr>
                  ) : (
                    <tr key={period.id} className="border-b border-slate-100">
                      <td className="px-3 py-2.5 align-top">
                        <p className="text-xs font-semibold text-slate-900">{period.name}</p>
                        <p className="text-[11px] text-slate-400">
                          {formatTime(period.startTime)} – {formatTime(period.endTime)}
                        </p>
                      </td>
                      {GRID_DAYS.map((day) => {
                        const entry = entryMap.get(`${period.id}-${day}`) ?? null;
                        const color = entry ? subjectColor(entry.subjectId) : null;
                        const highlighted = !!entry && activeSubjectId === entry.subjectId;
                        return (
                          <td key={day} className={`px-1.5 py-1.5 align-top ${day === today ? 'bg-amber-50/40' : ''}`}>
                            {entry && color ? (
                              <button
                                type="button"
                                onClick={() => setAssignTarget({ period, day, entry })}
                                className={`block w-full rounded-lg border px-2.5 py-2 text-left transition-transform hover:-translate-y-0.5 ${color.bg} ${
                                  highlighted ? 'border-slate-900 ring-2 ring-slate-900' : color.border
                                }`}
                              >
                                <p className={`text-xs font-semibold ${color.text}`}>{entry.subjectName}</p>
                                <p className="truncate text-[11px] text-slate-500">{entry.teacherName}</p>
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => setAssignTarget({ period, day, entry: null })}
                                className="flex h-[46px] w-full items-center justify-center rounded-lg border border-dashed border-slate-200 text-slate-300 transition-colors hover:border-amber-300 hover:text-amber-600"
                                aria-label={`Assign a subject for ${dayLabel(day)}, ${period.name}`}
                              >
                                <Plus size={14} />
                              </button>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ),
                )
              )}
            </tbody>
          </table>
        </div>
      </div>

      {manageOpen && classId && (
        <ManagePeriodsModal
          classId={classId}
          periods={periods}
          onClose={() => setManageOpen(false)}
          onChanged={refreshGrid}
        />
      )}

      {assignTarget && (
        <AssignmentFormModal
          period={assignTarget.period}
          dayOfWeek={assignTarget.day}
          item={assignTarget.entry}
          subjects={subjects}
          teachers={teachers}
          onClose={() => setAssignTarget(null)}
          onSaved={() => {
            setAssignTarget(null);
            refreshGrid();
          }}
          onDeleted={() => {
            setAssignTarget(null);
            refreshGrid();
          }}
        />
      )}
    </div>
  );
}
