'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Banknote, Check, MapPin, Pencil, Plus, Search, Trash2, UserPlus, Users } from 'lucide-react';
import { apiErrorMessage } from '@/lib/api';
import { getClasses, type SchoolClass } from '@/lib/classService';
import { getStudentAdmissions, type StudentAdmission } from '@/lib/studentService';
import {
  getRouteStudents,
  removeStudentRouteAssignment,
  type StudentRouteAssignment,
  type TransportRoute,
} from '@/lib/transportService';
import Modal from '@/components/ui/Modal';
import Button, { IconButton } from '@/components/ui/Button';
import { StatusBadge } from '@/components/ui/Badge';
import StudentAssignmentFormModal from './StudentAssignmentFormModal';
import GenerateTransportFeeModal from './GenerateTransportFeeModal';
import { ErrorBanner, formatDate, Pill } from './transportUi';

type View = 'boarded' | 'add';

const inputClass =
  'h-9 w-full rounded-lg border border-slate-200 bg-white text-sm text-slate-700 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 focus:outline-none';

/** Roster of students boarded on one route — add (class-wise from the student list), move, remove, or bill them. */
export default function RouteStudentsModal({
  route,
  routes,
  onClose,
  onChanged,
}: {
  route: TransportRoute;
  routes: TransportRoute[];
  onClose: () => void;
  onChanged: () => void;
}) {
  const [rows, setRows] = useState<StudentRouteAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [view, setView] = useState<View>('boarded');
  const [query, setQuery] = useState('');
  const [editing, setEditing] = useState<StudentRouteAssignment | null>(null);
  const [adding, setAdding] = useState<StudentAdmission | null>(null);
  const [billing, setBilling] = useState<StudentRouteAssignment | null>(null);
  const [removingId, setRemovingId] = useState<number | null>(null);
  const [notice, setNotice] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const list = await getRouteStudents(route.id);
      setRows(list);
      return list;
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not load students on this route.'));
      return [];
    } finally {
      setLoading(false);
    }
  }, [route.id]);

  // An empty route opens straight on "Add students" — there's nothing to show on the roster yet.
  useEffect(() => {
    load().then((list) => {
      if (list.length === 0) setView('add');
    });
  }, [load]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) => [r.studentName, r.admissionNumber, r.stopName, r.boardingPoint].some((v) => v?.toLowerCase().includes(q)));
  }, [rows, query]);

  const stopCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const r of rows) counts.set(r.stopName || 'No stop', (counts.get(r.stopName || 'No stop') ?? 0) + 1);
    return [...counts.entries()];
  }, [rows]);

  const boardedIds = useMemo(() => new Set(rows.filter((r) => r.active !== false).map((r) => r.studentId)), [rows]);

  const handleRemove = async (a: StudentRouteAssignment) => {
    if (!confirm(`Remove ${a.studentName} from ${route.routeName}?`)) return;
    setRemovingId(a.id);
    setError('');
    try {
      await removeStudentRouteAssignment(a.id);
      setRows((prev) => prev.filter((r) => r.id !== a.id));
      onChanged();
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not remove the student.'));
    } finally {
      setRemovingId(null);
    }
  };

  const capacity = route.seatingCapacity ?? 0;
  const seatsLeft = capacity ? capacity - boardedIds.size : null;

  return (
    <>
      <Modal
        icon={Users}
        title={`${route.routeName} — students`}
        subtitle={`${rows.length} boarded${capacity ? ` · ${capacity} seats` : ''}`}
        size="lg"
        onClose={onClose}
      >
        <div className="grid gap-3">
          <div className="flex rounded-xl bg-brand-50/70 p-1 ring-1 ring-inset ring-brand-100">
            {(
              [
                { key: 'boarded', label: `On this route (${rows.length})`, icon: Users },
                { key: 'add', label: 'Add students', icon: UserPlus },
              ] as const
            ).map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                type="button"
                onClick={() => setView(key)}
                className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold transition-all ${
                  view === key ? 'bg-white text-brand-700 shadow-premium-sm' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                <Icon size={15} />
                {label}
              </button>
            ))}
          </div>

          {notice && <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-700">{notice}</div>}
          <ErrorBanner message={error} />

          {view === 'add' ? (
            <AddStudentsPanel boardedIds={boardedIds} seatsLeft={seatsLeft} onPick={setAdding} />
          ) : (
            <>
              {stopCounts.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {stopCounts.map(([stop, count]) => (
                    <span key={stop} className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-600">
                      <MapPin size={11} />
                      {stop} · {count}
                    </span>
                  ))}
                </div>
              )}

              {rows.length > 0 && (
                <div className="relative">
                  <Search size={14} className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-slate-400" />
                  <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search boarded students by name, admission no. or stop" className={`${inputClass} pr-3 pl-8`} />
                </div>
              )}

              {loading ? (
                <div className="space-y-2">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="skeleton h-14 rounded-lg" />
                  ))}
                </div>
              ) : filtered.length === 0 ? (
                <div className="flex flex-col items-center gap-3 py-10 text-center">
                  <p className="text-sm text-slate-400">{rows.length ? 'No boarded students match your search.' : 'No students on this route yet.'}</p>
                  {!rows.length && (
                    <Button size="sm" icon={UserPlus} onClick={() => setView('add')}>
                      Add students
                    </Button>
                  )}
                </div>
              ) : (
                <ul className="divide-y divide-slate-100 rounded-xl border border-slate-200">
                  {filtered.map((a) => (
                    <li key={a.id} className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-brand-50/30">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="truncate text-sm font-semibold text-slate-900">{a.studentName}</p>
                          {!a.active && <StatusBadge active={false} />}
                        </div>
                        <p className="truncate text-xs text-slate-500">
                          {a.admissionNumber || '—'} · {a.stopName || 'No stop'}
                          {a.boardingPoint ? ` (${a.boardingPoint})` : ''} · from {formatDate(a.effectiveFrom)}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-0.5">
                        <IconButton icon={Banknote} label="Generate transport fee" variant="primary" onClick={() => setBilling(a)} />
                        <IconButton icon={Pencil} label="Edit / move" variant="primary" onClick={() => setEditing(a)} />
                        <IconButton icon={Trash2} label="Remove from route" variant="danger" loading={removingId === a.id} onClick={() => handleRemove(a)} />
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}
        </div>
      </Modal>

      {(editing || adding) && (
        <StudentAssignmentFormModal
          route={route}
          routes={routes}
          item={editing}
          presetStudent={
            adding
              ? { id: adding.id, name: adding.studentUser?.fullName ?? `Student #${adding.id}`, admissionNumber: adding.admissionNumber, className: adding.schoolClass?.className }
              : undefined
          }
          onClose={() => {
            setEditing(null);
            setAdding(null);
          }}
          onSaved={() => {
            if (adding) setNotice(`${adding.studentUser?.fullName ?? 'Student'} added to ${route.routeName}.`);
            setEditing(null);
            setAdding(null);
            load();
            onChanged();
          }}
        />
      )}
      {billing && (
        <GenerateTransportFeeModal
          routes={routes}
          preset={{ studentId: billing.studentId, studentName: billing.studentName, routeId: billing.routeId }}
          onClose={() => setBilling(null)}
          onSaved={() => {
            setNotice(`Transport fee generated for ${billing.studentName}.`);
            setBilling(null);
          }}
        />
      )}
    </>
  );
}

/**
 * The school's student list — same source as the Students page — filterable
 * by class (server-side ?classId=) and by name/admission no. Students already
 * on this route are marked instead of offered again.
 */
function AddStudentsPanel({
  boardedIds,
  seatsLeft,
  onPick,
}: {
  boardedIds: Set<number>;
  seatsLeft: number | null;
  onPick: (student: StudentAdmission) => void;
}) {
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [classId, setClassId] = useState<number | ''>('');
  const [search, setSearch] = useState('');
  const [students, setStudents] = useState<StudentAdmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    getClasses()
      .then((page) => setClasses(page.content ?? []))
      .catch(() => setClasses([]));
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');
    getStudentAdmissions({ classId: classId || undefined })
      .then((page) => !cancelled && setStudents((page.content ?? []).filter((s) => s.active !== false)))
      .catch((err) => {
        if (cancelled) return;
        setStudents([]);
        setError(apiErrorMessage(err, 'Could not load students.'));
      })
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [classId]);

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return students
      .filter((s) => !q || [s.studentUser?.fullName, s.admissionNumber, s.fatherName].some((v) => v?.toLowerCase().includes(q)))
      .sort((a, b) => (a.studentUser?.fullName ?? '').localeCompare(b.studentUser?.fullName ?? ''));
  }, [students, search]);

  return (
    <div className="grid gap-3">
      <div className="grid gap-2 sm:grid-cols-[12rem_1fr]">
        <select aria-label="Class" value={classId} onChange={(e) => setClassId(e.target.value ? Number(e.target.value) : '')} className={`${inputClass} px-3`}>
          <option value="">All classes</option>
          {classes.map((c) => (
            <option key={c.id} value={c.id}>
              {c.className}
            </option>
          ))}
        </select>
        <div className="relative">
          <Search size={14} className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-slate-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search name, admission no. or father's name" className={`${inputClass} pr-3 pl-8`} />
        </div>
      </div>

      <div className="flex items-center justify-between text-xs text-slate-500">
        <span>{loading ? 'Loading students…' : `${visible.length} student${visible.length === 1 ? '' : 's'}`}</span>
        {seatsLeft !== null && <span className={seatsLeft <= 0 ? 'font-semibold text-red-600' : ''}>{seatsLeft > 0 ? `${seatsLeft} seats left` : 'Vehicle is full'}</span>}
      </div>

      <ErrorBanner message={error} />

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="skeleton h-12 rounded-lg" />
          ))}
        </div>
      ) : visible.length === 0 ? (
        !error && <p className="py-8 text-center text-sm text-slate-400">No students found{classId || search ? ' for this filter' : ''}.</p>
      ) : (
        <ul className="scrollbar-thin max-h-[45vh] divide-y divide-slate-100 overflow-y-auto rounded-xl border border-slate-200">
          {visible.map((s) => {
            const onRoute = boardedIds.has(s.id);
            return (
              <li key={s.id} className="flex items-center justify-between gap-3 px-4 py-2.5 hover:bg-brand-50/30">
                <div className="flex min-w-0 items-center gap-3">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-50 text-xs font-bold text-brand-700">
                    {s.studentUser?.fullName?.charAt(0) ?? '?'}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-900">{s.studentUser?.fullName ?? `Student #${s.id}`}</p>
                    <p className="truncate text-xs text-slate-500">
                      {s.schoolClass?.className ?? '—'} · Adm. {s.admissionNumber || '—'}
                    </p>
                  </div>
                </div>
                {onRoute ? (
                  <Pill tone="emerald">
                    <Check size={11} />
                    On route
                  </Pill>
                ) : (
                  <Button size="sm" variant="secondary" icon={Plus} onClick={() => onPick(s)}>
                    Add
                  </Button>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
