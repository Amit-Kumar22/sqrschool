'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle2, ChevronLeft, ChevronRight, Circle, Clock, GraduationCap, History, Inbox, LogIn, LogOut, MapPin, Users } from 'lucide-react';
import { getUser, type Role } from '@/lib/auth';
import { getAllTeacherStaff, type TeacherStaffMember } from '@/lib/schoolService';
import {
  checkInStudent,
  checkInTeacher,
  checkOut,
  getStudentsByClassTeacher,
  type ClassTeacherStudent,
} from '@/lib/attendanceService';
import { getCurrentPosition, type Coordinates } from '@/lib/geo';
import { apiErrorMessage } from '@/lib/api';
import SetPageTitle from '@/components/dashboard/SetPageTitle';
import Button, { IconButton } from '@/components/ui/Button';
import { SelectField } from '@/components/ui/FormField';
import SegmentedTabs, { type SegmentedTabItem } from '@/components/ui/SegmentedTabs';

const PAGE_SIZE = 10;

type PrincipalTab = 'teachers' | 'students';

const PRINCIPAL_TABS: SegmentedTabItem[] = [
  { key: 'teachers', label: 'Teachers', icon: Users },
  { key: 'students', label: 'Students', icon: GraduationCap },
];

const formatNow = () => new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

/** Resolves the browser's current GPS position, routing failures to the given error setter. Returns null on failure. */
async function resolveCoords(setError: (message: string) => void): Promise<Coordinates | null> {
  try {
    return await getCurrentPosition();
  } catch (err) {
    setError(err instanceof Error ? err.message : 'Could not determine your location.');
    return null;
  }
}

/**
 * Attendance workspace shared by the Principal and Teacher panels.
 * - Principal: two tabs — "Teachers" (attendance-history lookup per teacher) and
 *   "Students" (pick a class teacher via reqEmail, view their roster, read-only).
 * - Teacher: reqEmail is their own email — checks themself in/out and checks their students in, class-wise.
 *
 * `role` comes in as a prop (each page passes it statically — see
 * app/teacher/attedance/page.tsx / app/principal/attedance/page.tsx) rather
 * than being read here via getUserRole(). That call returns null during
 * server rendering (no cookies/localStorage) but the real role on the
 * client's first paint, which is a hydration mismatch — React discards the
 * server-rendered branch and can silently drop content like the "My
 * attendance" card. Same reasoning as AppShell.tsx, which only ever reads
 * getUser() inside a useEffect, never at render time.
 */
export default function AttendancePageContent({ role }: { role: Role }) {
  const router = useRouter();
  const isTeacher = role === 'TEACHER';

  const [allTeachers, setAllTeachers] = useState<TeacherStaffMember[]>([]);
  const [teachersLoading, setTeachersLoading] = useState(false);
  const [reqEmail, setReqEmail] = useState('');
  const [principalTab, setPrincipalTab] = useState<PrincipalTab>('teachers');

  // Only teachers who actually have a class assigned can be picked from the
  // roster dropdown below — the roster endpoint needs reqEmail to resolve to
  // a real class teacher. The Teachers tab further down has no such
  // restriction and lists everyone in allTeachers.
  const classTeachers = allTeachers.filter((t) => t.assignedClasses.length > 0);

  const [students, setStudents] = useState<ClassTeacherStudent[]>([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [rosterLoading, setRosterLoading] = useState(false);
  const [rosterError, setRosterError] = useState('');

  const [checkedInIds, setCheckedInIds] = useState<Set<number>>(new Set());
  const [checkingInId, setCheckingInId] = useState<number | null>(null);

  const [selfStatus, setSelfStatus] = useState<'idle' | 'checked-in' | 'checked-out'>('idle');
  const [selfTime, setSelfTime] = useState('');
  const [selfBusy, setSelfBusy] = useState<'in' | 'out' | null>(null);
  const [selfError, setSelfError] = useState('');

  useEffect(() => {
    if (isTeacher) {
      setReqEmail(getUser()?.email ?? '');
      return;
    }
    setTeachersLoading(true);
    getAllTeacherStaff()
      .then((res) => setAllTeachers(res.content))
      .catch(() => setAllTeachers([]))
      .finally(() => setTeachersLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isTeacher]);

  useEffect(() => {
    if (isTeacher && !reqEmail) {
      setStudents([]);
      setTotalPages(0);
      setTotalElements(0);
      return;
    }
    let cancelled = false;
    setRosterLoading(true);
    setRosterError('');
    // Principal: an empty reqEmail means "all class teachers" — the roster
    // endpoint returns every student when reqEmail is omitted.
    getStudentsByClassTeacher({ reqEmail: reqEmail || undefined, page, size: PAGE_SIZE })
      .then((res) => {
        if (cancelled) return;
        setStudents(res.content ?? []);
        setTotalPages(res.totalPages ?? 0);
        setTotalElements(res.totalElements ?? 0);
      })
      .catch((err) => {
        if (cancelled) return;
        setStudents([]);
        setTotalPages(0);
        setRosterError(apiErrorMessage(err, 'Could not load the class roster.'));
      })
      .finally(() => {
        if (!cancelled) setRosterLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [reqEmail, page]);

  const handleTeacherSelect = (email: string) => {
    setReqEmail(email);
    setPage(0);
  };

  const handleSelfCheckIn = async () => {
    setSelfBusy('in');
    setSelfError('');
    const coords = await resolveCoords(setSelfError);
    if (!coords) {
      setSelfBusy(null);
      return;
    }
    try {
      await checkInTeacher(coords);
      setSelfStatus('checked-in');
      setSelfTime(formatNow());
    } catch (err) {
      setSelfError(apiErrorMessage(err, 'Check-in failed.'));
    } finally {
      setSelfBusy(null);
    }
  };

  const handleSelfCheckOut = async () => {
    setSelfBusy('out');
    setSelfError('');
    const coords = await resolveCoords(setSelfError);
    if (!coords) {
      setSelfBusy(null);
      return;
    }
    try {
      await checkOut(coords);
      setSelfStatus('checked-out');
      setSelfTime(formatNow());
    } catch (err) {
      setSelfError(apiErrorMessage(err, 'Check-out failed.'));
    } finally {
      setSelfBusy(null);
    }
  };

  const handleStudentCheckIn = async (student: ClassTeacherStudent) => {
    setCheckingInId(student.id);
    setRosterError('');
    const coords = await resolveCoords(setRosterError);
    if (!coords) {
      setCheckingInId(null);
      return;
    }
    try {
      await checkInStudent(student.id, coords);
      setCheckedInIds((prev) => new Set(prev).add(student.id));
    } catch (err) {
      setRosterError(apiErrorMessage(err, `Could not check in ${student.fullName}.`));
    } finally {
      setCheckingInId(null);
    }
  };

  return (
    <div className="space-y-4">
      <SetPageTitle title="Attendance" />

      {isTeacher && (
        <div className="card-premium p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-amber-400 to-amber-600 text-white shadow-premium-sm">
                <MapPin size={15} />
              </span>
              <div>
                <p className="text-sm font-semibold text-slate-900">My attendance</p>
                <p className="text-xs text-slate-500">
                  {selfStatus === 'idle' && 'Not checked in yet today.'}
                  {selfStatus === 'checked-in' && `Checked in at ${selfTime}`}
                  {selfStatus === 'checked-out' && `Checked out at ${selfTime}`}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                icon={LogIn}
                size="sm"
                loading={selfBusy === 'in'}
                disabled={selfBusy !== null || selfStatus === 'checked-in'}
                onClick={handleSelfCheckIn}
              >
                Check In
              </Button>
              <Button
                icon={LogOut}
                variant="secondary"
                size="sm"
                loading={selfBusy === 'out'}
                disabled={selfBusy !== null || selfStatus !== 'checked-in'}
                onClick={handleSelfCheckOut}
              >
                Check Out
              </Button>
            </div>
          </div>
          {selfError && <p className="mt-2.5 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">{selfError}</p>}
        </div>
      )}

      {!isTeacher && <SegmentedTabs tabs={PRINCIPAL_TABS} active={principalTab} onChange={(key) => setPrincipalTab(key as PrincipalTab)} />}

      {!isTeacher && principalTab === 'teachers' && (
        <div className="card-premium overflow-hidden">
          <div className="flex items-center gap-2 border-b border-slate-100 px-4 py-3 text-sm font-semibold text-slate-900">
            <Users size={15} className="text-slate-400" />
            Teachers
          </div>
          {teachersLoading ? (
            <div className="space-y-2 p-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="skeleton h-10 w-full rounded-lg" />
              ))}
            </div>
          ) : allTeachers.length === 0 ? (
            <EmptyState title="No teachers found" description="Add staff with the Teacher role to see them here." />
          ) : (
            <div className="scrollbar-thin overflow-x-auto">
              <table className="w-full min-w-full border-collapse text-left text-sm">
                <thead>
                  <tr className="bg-gradient-to-r from-amber-950 via-amber-800 to-amber-950">
                    <th className="px-4 py-2.5 text-xs font-semibold tracking-wider text-white/90 uppercase">Teacher</th>
                    <th className="px-4 py-2.5 text-xs font-semibold tracking-wider text-white/90 uppercase">Contact</th>
                    <th className="px-4 py-2.5 text-right text-xs font-semibold tracking-wider text-white/90 uppercase">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {allTeachers.map((teacher) => (
                    <tr key={teacher.id} className="even:bg-slate-50/70">
                      <td className="px-4 py-2.5 font-medium text-slate-800">{teacher.teacherUser.fullName}</td>
                      <td className="px-4 py-2.5 text-xs text-slate-500">
                        <p>{teacher.teacherUser.email || '—'}</p>
                        <p>{teacher.teacherUser.phone || '—'}</p>
                      </td>
                      <td className="px-4 py-2.5 text-right">
                        <Button size="sm" variant="secondary" icon={History} onClick={() => router.push(`/principal/attedance/${teacher.id}`)}>
                          Attendance history
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {!isTeacher && principalTab === 'students' && (
        <div className="card-premium p-4">
          <SelectField
            label="Class teacher"
            value={reqEmail}
            disabled={teachersLoading}
            onChange={(e) => handleTeacherSelect(e.target.value)}
            hint="Showing all students by default — pick a teacher to narrow the roster to their class."
          >
            <option value="">{teachersLoading ? 'Loading teachers…' : 'All students'}</option>
            {classTeachers.map((teacher) => (
              <option key={teacher.id} value={teacher.teacherUser.email}>
                {teacher.teacherUser.fullName} ({teacher.teacherUser.email})
              </option>
            ))}
          </SelectField>
          {!teachersLoading && classTeachers.length === 0 && (
            <p className="mt-2 text-xs text-slate-400">No class teachers assigned yet — assign a teacher to a class first.</p>
          )}
        </div>
      )}

      {(isTeacher || principalTab === 'students') && (
        <div className="card-premium overflow-hidden">
          <div className="flex items-center justify-between gap-2 border-b border-slate-100 px-4 py-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
              <Users size={15} className="text-slate-400" />
              Class roster
              {totalElements > 0 && <span className="font-normal text-slate-400">· {totalElements} students</span>}
            </div>
          </div>

          {rosterError && <p className="mx-4 mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">{rosterError}</p>}

          {isTeacher && !reqEmail ? (
            <EmptyState title="No class teacher selected" description="Select a class teacher above to load their students." />
          ) : rosterLoading ? (
            <div className="space-y-2 p-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="skeleton h-10 w-full rounded-lg" />
              ))}
            </div>
          ) : students.length === 0 ? (
            <EmptyState title="No students found" description="This class doesn't have any students yet." />
          ) : (
            <div className="scrollbar-thin overflow-x-auto">
              <table className="w-full min-w-full border-collapse text-left text-sm">
                <thead>
                  <tr className="bg-gradient-to-r from-amber-950 via-amber-800 to-amber-950">
                    <th className="px-4 py-2.5 text-xs font-semibold tracking-wider text-white/90 uppercase">Student</th>
                    <th className="px-4 py-2.5 text-xs font-semibold tracking-wider text-white/90 uppercase">Contact</th>
                    {isTeacher && <th className="px-4 py-2.5 text-right text-xs font-semibold tracking-wider text-white/90 uppercase">Attendance</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {students.map((student) => {
                    const checkedIn = checkedInIds.has(student.id);
                    return (
                      <tr key={student.id} className="even:bg-slate-50/70">
                        <td className="px-4 py-2.5 font-medium text-slate-800">{student.fullName}</td>
                        <td className="px-4 py-2.5 text-xs text-slate-500">
                          <p>{student.email || '—'}</p>
                          <p>{student.phone || '—'}</p>
                        </td>
                        {isTeacher && (
                          <td className="px-4 py-2.5 text-right">
                            {checkedIn ? (
                              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700 ring-1 ring-emerald-600/20 ring-inset">
                                <CheckCircle2 size={12} />
                                Checked in
                              </span>
                            ) : (
                              <Button
                                size="sm"
                                variant="secondary"
                                icon={Circle}
                                loading={checkingInId === student.id}
                                disabled={checkingInId !== null}
                                onClick={() => handleStudentCheckIn(student)}
                              >
                                Check in
                              </Button>
                            )}
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {reqEmail && !rosterLoading && students.length > 0 && totalPages > 1 && (
            <div className="flex items-center justify-between gap-3 border-t border-slate-100 px-4 py-3">
              <span className="flex items-center gap-1.5 text-xs text-slate-500">
                <Clock size={13} />
                Page {page + 1} of {totalPages}
              </span>
              <div className="flex items-center gap-1">
                <IconButton icon={ChevronLeft} label="Previous page" size="sm" disabled={page === 0} onClick={() => setPage((p) => Math.max(0, p - 1))} />
                <IconButton
                  icon={ChevronRight}
                  label="Next page"
                  size="sm"
                  disabled={page + 1 >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <div className="flex flex-col items-center gap-2 px-4 py-12 text-center">
      <span className="flex h-11 w-11 items-center justify-center rounded-full bg-amber-50 text-amber-700">
        <Inbox size={20} />
      </span>
      <p className="text-sm font-semibold text-slate-900">{title}</p>
      <p className="text-xs text-slate-500">{description}</p>
    </div>
  );
}
