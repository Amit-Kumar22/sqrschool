'use client';

import { useEffect, useState } from 'react';
import { BookOpen, CalendarCheck, ClipboardList, GraduationCap, Loader2, NotebookPen, Users } from 'lucide-react';
import SetPageTitle from '@/components/dashboard/SetPageTitle';
import StatCard from '@/components/dashboard/StatCard';
import SectionCard from '@/components/dashboard/SectionCard';
import NoticeListPanel from '@/components/dashboard/NoticeListPanel';
import TimetableListPanel from '@/components/dashboard/TimetableListPanel';
import DonutStat from '@/components/dashboard/charts/DonutStat';
import SimpleBarChart from '@/components/dashboard/charts/SimpleBarChart';
import { STATUS_COLORS } from '@/components/dashboard/chartColors';
import { apiErrorMessage } from '@/lib/api';
import { getTeacherDashboard, type TeacherDashboard } from '@/lib/dashboardService';

export default function TeacherDashboardPage() {
  const [dashboard, setDashboard] = useState<TeacherDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    getTeacherDashboard()
      .then(setDashboard)
      .catch((err) => setError(apiErrorMessage(err, 'Could not load your dashboard.')))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 size={28} className="animate-spin text-amber-700" />
      </div>
    );
  }

  const { profile, assignedClasses, studentOverview, attendanceOverview, examSummary, todayTimetable, recentNotices, homeworkSummary } =
    dashboard ?? {};

  const attendanceLegend = attendanceOverview
    ? [
        { label: 'Present', value: attendanceOverview.presentCount, color: STATUS_COLORS.good },
        { label: 'Absent', value: attendanceOverview.absentCount, color: STATUS_COLORS.critical },
        { label: 'Late', value: attendanceOverview.lateCount, color: STATUS_COLORS.warning },
      ]
    : [];

  return (
    <div className="space-y-6">
      <SetPageTitle title="Teacher Dashboard" />

      <div>
        <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-sm text-slate-500">Welcome back{profile?.fullName ? `, ${profile.fullName}` : ''}! Here&apos;s what&apos;s happening today.</p>
      </div>

      {error && <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}

      {dashboard && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard index={0} icon={BookOpen} label="My Classes" value={`${studentOverview?.totalClasses ?? 0}`} />
            <StatCard index={1} icon={Users} label="My Students" value={`${studentOverview?.totalStudents ?? 0}`} />
            <StatCard index={2} icon={CalendarCheck} label="Attendance Today" value={`${Math.round(attendanceOverview?.attendancePercentage ?? 0)}%`} />
            <StatCard index={3} icon={NotebookPen} label="Homework This Week" value={`${homeworkSummary?.thisWeekHomework ?? 0}`} />
          </div>

          <SectionCard title={profile?.fullName ?? 'Profile'} subtitle={profile?.employeeCode} icon={GraduationCap}>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <p className="text-xs text-slate-400">Primary Subject</p>
                <p className="text-sm font-medium text-slate-800">{profile?.primarySubject || '—'}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400">Qualification</p>
                <p className="text-sm font-medium text-slate-800">{profile?.qualification || '—'}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400">Experience</p>
                <p className="text-sm font-medium text-slate-800">{profile?.experienceYears ?? 0} yrs</p>
              </div>
              <div>
                <p className="text-xs text-slate-400">Contact</p>
                <p className="text-sm font-medium text-slate-800">{profile?.phone || profile?.email || '—'}</p>
              </div>
            </div>
            {profile?.assignedClassNames && profile.assignedClassNames.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-1.5">
                {profile.assignedClassNames.map((name) => (
                  <span key={name} className="rounded-full bg-indigo-50 px-2.5 py-1 text-[11px] font-semibold text-indigo-700 ring-1 ring-inset ring-indigo-600/20">
                    {name}
                  </span>
                ))}
              </div>
            )}
          </SectionCard>

          <div className="grid gap-4 lg:grid-cols-2">
            <SectionCard title="Today's Attendance" subtitle={attendanceOverview?.date}>
              <div className="flex flex-col items-center gap-5 sm:flex-row sm:justify-around">
                <DonutStat percentage={attendanceOverview?.attendancePercentage ?? 0} label="Present rate" color={STATUS_COLORS.good} />
                <ul className="w-full max-w-[220px] space-y-2">
                  {attendanceLegend.map((item) => (
                    <li key={item.label} className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2 text-slate-600">
                        <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                        {item.label}
                      </span>
                      <span className="font-semibold text-slate-900">{item.value}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </SectionCard>

            <SectionCard title="Exam Summary" icon={ClipboardList}>
              <SimpleBarChart
                data={[
                  { label: 'Upcoming', value: examSummary?.upcomingExams ?? 0, color: '#0ea5e9' },
                  { label: 'Completed', value: examSummary?.completedExams ?? 0, color: STATUS_COLORS.good },
                  { label: 'Pending Results', value: examSummary?.pendingResults ?? 0, color: STATUS_COLORS.warning },
                ]}
              />
            </SectionCard>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <TimetableListPanel entries={todayTimetable ?? []} />
            <NoticeListPanel notices={recentNotices ?? []} />
          </div>

          <SectionCard title="Assigned Classes" icon={BookOpen}>
            {!assignedClasses || assignedClasses.length === 0 ? (
              <p className="py-6 text-center text-sm text-slate-400">No classes assigned yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 text-left text-xs text-slate-400">
                      <th className="pb-2 font-medium">Class</th>
                      <th className="pb-2 font-medium">Students</th>
                      <th className="pb-2 font-medium">Role</th>
                    </tr>
                  </thead>
                  <tbody>
                    {assignedClasses.map((c) => (
                      <tr key={c.classId} className="border-b border-slate-50 last:border-0">
                        <td className="py-2.5 font-medium text-slate-800">{c.className}</td>
                        <td className="py-2.5 text-slate-600">{c.studentCount}</td>
                        <td className="py-2.5">
                          {c.isClassTeacher ? (
                            <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-600/20">
                              Class Teacher
                            </span>
                          ) : (
                            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-600 ring-1 ring-inset ring-slate-200">
                              Subject Teacher
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </SectionCard>
        </>
      )}
    </div>
  );
}
