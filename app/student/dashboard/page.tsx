'use client';

import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import SetPageTitle from '@/components/dashboard/SetPageTitle';
import NoticeListPanel from '@/components/dashboard/NoticeListPanel';
import StudentDashboardBody from '@/components/dashboard/StudentDashboardBody';
import { getUser, type SessionUser } from '@/lib/auth';
import { apiErrorMessage } from '@/lib/api';
import { getStudentDashboard, type StudentDashboard } from '@/lib/dashboardService';

export default function StudentDashboardPage() {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [dashboard, setDashboard] = useState<StudentDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setUser(getUser());
    getStudentDashboard()
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

  return (
    <div className="space-y-6">
      <SetPageTitle title="Student Dashboard" />

      <div>
        <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-sm text-slate-500">Welcome back{user?.fullName ? `, ${user.fullName}` : ''}! Here&apos;s what&apos;s happening today.</p>
      </div>

      {error && <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}

      {dashboard && (
        <>
          <StudentDashboardBody bundle={dashboard} />
          <NoticeListPanel notices={dashboard.recentNotices ?? []} />
        </>
      )}
    </div>
  );
}
