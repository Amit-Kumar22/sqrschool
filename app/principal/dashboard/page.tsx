'use client';

import { useEffect, useState } from 'react';
import { BookOpen, GraduationCap, IndianRupee, Layers, Loader2, PieChart, Users } from 'lucide-react';
import SetPageTitle from '@/components/dashboard/SetPageTitle';
import StatCard from '@/components/dashboard/StatCard';
import SectionCard from '@/components/dashboard/SectionCard';
import NoticeListPanel from '@/components/dashboard/NoticeListPanel';
import AreaTrendChart from '@/components/dashboard/charts/AreaTrendChart';
import SimpleBarChart from '@/components/dashboard/charts/SimpleBarChart';
import DonutStat from '@/components/dashboard/charts/DonutStat';
import { STATUS_COLORS } from '@/components/dashboard/chartColors';
import { getUser, type SessionUser } from '@/lib/auth';
import {
  getAdminAttendanceOverview,
  getAdminClassStats,
  getAdminDashboardSummary,
  getAdminFeeOverview,
  getAdminRecentNotices,
  getAdminRevenueTrend,
  type AdminDashboardSummary,
  type ClassStat,
  type DashboardNotice,
  type FinanceOverview,
  type RevenueTrendPoint,
} from '@/lib/dashboardService';

const formatCurrency = (value: number | undefined | null) => `₹${(value ?? 0).toLocaleString('en-IN')}`;

function settle<T>(result: PromiseSettledResult<T>): T | null {
  return result.status === 'fulfilled' ? result.value : null;
}

function FinanceOverviewPanel({ title, data }: { title: string; data: FinanceOverview | null }) {
  return (
    <SectionCard title={title} icon={IndianRupee}>
      {!data ? (
        <p className="py-6 text-center text-sm text-slate-400">Couldn&apos;t load this section.</p>
      ) : (
        <div className="flex flex-col items-center gap-5 sm:flex-row sm:justify-around">
          <DonutStat percentage={data.collectionPercentage} label="Collected" color={STATUS_COLORS.good} />
          <ul className="w-full max-w-[240px] space-y-2 text-sm">
            <li className="flex items-center justify-between">
              <span className="text-slate-500">Collected</span>
              <span className="font-semibold text-emerald-700">{formatCurrency(data.totalCollectedAmount)}</span>
            </li>
            <li className="flex items-center justify-between">
              <span className="text-slate-500">Pending ({data.pendingCount})</span>
              <span className="font-semibold text-amber-700">{formatCurrency(data.totalPendingAmount)}</span>
            </li>
            <li className="flex items-center justify-between">
              <span className="text-slate-500">Overdue ({data.overdueCount})</span>
              <span className="font-semibold text-rose-700">{formatCurrency(data.totalOverdueAmount)}</span>
            </li>
            <li className="flex items-center justify-between">
              <span className="text-slate-500">Partial</span>
              <span className="font-semibold text-slate-700">{data.partialCount}</span>
            </li>
          </ul>
        </div>
      )}
    </SectionCard>
  );
}

export default function PrincipalDashboard() {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<AdminDashboardSummary | null>(null);
  const [feeOverview, setFeeOverview] = useState<FinanceOverview | null>(null);
  const [collectionsSnapshot, setCollectionsSnapshot] = useState<FinanceOverview | null>(null);
  const [classStats, setClassStats] = useState<ClassStat[]>([]);
  const [revenueTrend, setRevenueTrend] = useState<RevenueTrendPoint[]>([]);
  const [notices, setNotices] = useState<DashboardNotice[]>([]);

  useEffect(() => {
    setUser(getUser());

    Promise.allSettled([
      getAdminDashboardSummary(),
      getAdminFeeOverview(),
      getAdminAttendanceOverview(),
      getAdminClassStats(),
      getAdminRevenueTrend(6),
      getAdminRecentNotices(5),
    ]).then(([summaryRes, feeRes, attendanceRes, classStatsRes, revenueRes, noticesRes]) => {
      setSummary(settle(summaryRes));
      setFeeOverview(settle(feeRes));
      setCollectionsSnapshot(settle(attendanceRes));
      setClassStats(settle(classStatsRes) ?? []);
      setRevenueTrend(settle(revenueRes) ?? []);
      setNotices(settle(noticesRes) ?? []);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 size={28} className="animate-spin text-amber-700" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <SetPageTitle title="Principal Dashboard" />

      <div>
        <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-sm text-slate-500">Welcome back{user?.fullName ? `, ${user.fullName}` : ''}! Here&apos;s what&apos;s happening today.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <StatCard index={0} icon={GraduationCap} label="Total Students" value={`${summary?.totalStudents ?? '—'}`} />
        <StatCard index={1} icon={Users} label="Total Teachers" value={`${summary?.totalTeachers ?? '—'}`} />
        <StatCard index={2} icon={BookOpen} label="Total Classes" value={`${summary?.totalClasses ?? '—'}`} />
        <StatCard index={3} icon={Layers} label="Total Subjects" value={`${summary?.totalSubjects ?? '—'}`} />
        <StatCard
          index={4}
          icon={IndianRupee}
          label="Fee Collected"
          value={feeOverview ? formatCurrency(feeOverview.totalCollectedAmount) : '—'}
        />
        <StatCard
          index={5}
          icon={PieChart}
          label="Collection Rate"
          value={feeOverview ? `${Math.round(feeOverview.collectionPercentage ?? 0)}%` : '—'}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <SectionCard title="Revenue Trend" subtitle="Last 6 months">
          <AreaTrendChart
            data={revenueTrend.map((p) => ({ label: p.monthName, value: p.revenue, secondary: p.paymentCount, secondaryLabel: 'payments' }))}
            valueFormatter={formatCurrency}
          />
        </SectionCard>

        <SectionCard title="Class-wise Students" subtitle="Enrolled students per class">
          <SimpleBarChart data={classStats.map((c) => ({ label: c.className, value: c.studentCount }))} />
        </SectionCard>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <FinanceOverviewPanel title="Fee Overview" data={feeOverview} />
        <FinanceOverviewPanel title="Collections Snapshot" data={collectionsSnapshot} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <SectionCard title="Class Overview" icon={BookOpen}>
          {classStats.length === 0 ? (
            <p className="py-6 text-center text-sm text-slate-400">No classes found.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 text-left text-xs text-slate-400">
                    <th className="pb-2 font-medium">Class</th>
                    <th className="pb-2 font-medium">Students</th>
                    <th className="pb-2 font-medium">Teachers</th>
                    <th className="pb-2 font-medium">Fee Structures</th>
                  </tr>
                </thead>
                <tbody>
                  {classStats.map((c) => (
                    <tr key={c.classId} className="border-b border-slate-50 last:border-0">
                      <td className="py-2.5 font-medium text-slate-800">{c.className}</td>
                      <td className="py-2.5 text-slate-600">{c.studentCount}</td>
                      <td className="py-2.5 text-slate-600">{c.teacherCount}</td>
                      <td className="py-2.5 text-slate-600">{c.feeStructureCount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </SectionCard>

        <NoticeListPanel notices={notices} />
      </div>
    </div>
  );
}
