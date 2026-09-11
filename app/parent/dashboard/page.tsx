'use client';

import { useEffect, useState } from 'react';
import { Loader2, User } from 'lucide-react';
import SetPageTitle from '@/components/dashboard/SetPageTitle';
import NoticeListPanel from '@/components/dashboard/NoticeListPanel';
import StudentDashboardBody from '@/components/dashboard/StudentDashboardBody';
import SegmentedTabs from '@/components/ui/SegmentedTabs';
import { apiErrorMessage } from '@/lib/api';
import { getParentDashboard, type ParentChildDetail, type ParentDashboard } from '@/lib/dashboardService';

export default function ParentDashboardPage() {
  const [dashboard, setDashboard] = useState<ParentDashboard | null>(null);
  const [childDetail, setChildDetail] = useState<ParentChildDetail | null>(null);
  const [selectedStudentId, setSelectedStudentId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [childLoading, setChildLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    getParentDashboard()
      .then((data) => {
        setDashboard(data);
        const firstChildId = data.selectedChildDetail?.profile.studentId ?? data.children[0]?.studentId ?? null;
        setSelectedStudentId(firstChildId);

        if (data.selectedChildDetail) {
          setChildDetail(data.selectedChildDetail);
        } else if (firstChildId) {
          setChildLoading(true);
          getParentDashboard(firstChildId)
            .then((withChild) => setChildDetail(withChild.selectedChildDetail ?? null))
            .catch(() => {})
            .finally(() => setChildLoading(false));
        }
      })
      .catch((err) => setError(apiErrorMessage(err, 'Could not load your dashboard.')))
      .finally(() => setLoading(false));
  }, []);

  const handleSelectChild = (studentId: number) => {
    if (studentId === selectedStudentId) return;
    setSelectedStudentId(studentId);
    setChildLoading(true);
    getParentDashboard(studentId)
      .then((data) => setChildDetail(data.selectedChildDetail ?? null))
      .catch((err) => setError(apiErrorMessage(err, 'Could not load this child’s details.')))
      .finally(() => setChildLoading(false));
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 size={28} className="animate-spin text-amber-700" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <SetPageTitle title="Parent Dashboard" />

      <div>
        <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-sm text-slate-500">
          Welcome back{dashboard?.profile.fullName ? `, ${dashboard.profile.fullName}` : ''}! Here&apos;s how your {dashboard && dashboard.children.length > 1 ? 'children are' : 'child is'} doing.
        </p>
      </div>

      {error && <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}

      {dashboard && dashboard.children.length > 1 && (
        <SegmentedTabs
          tabs={dashboard.children.map((child) => ({ key: `${child.studentId}`, label: `${child.fullName} (${child.className})`, icon: User }))}
          active={`${selectedStudentId}`}
          onChange={(key) => handleSelectChild(Number(key))}
        />
      )}

      {dashboard && dashboard.children.length === 0 && (
        <div className="card-premium p-6 text-center text-sm text-slate-500">No children are linked to your account yet.</div>
      )}

      {childLoading && !childDetail && (
        <div className="flex h-48 items-center justify-center">
          <Loader2 size={24} className="animate-spin text-amber-700" />
        </div>
      )}

      {childDetail && (
        <div className={childLoading ? 'opacity-60 transition-opacity' : 'transition-opacity'}>
          <StudentDashboardBody bundle={childDetail} />
        </div>
      )}

      {dashboard && <NoticeListPanel notices={dashboard.recentNotices ?? []} />}
    </div>
  );
}
