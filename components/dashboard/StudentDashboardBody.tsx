import { Award, CalendarCheck, ClipboardList, FileText, PlaneTakeoff, Wallet } from 'lucide-react';
import StatCard from './StatCard';
import SectionCard from './SectionCard';
import TimetableListPanel from './TimetableListPanel';
import DonutStat from './charts/DonutStat';
import SimpleBarChart from './charts/SimpleBarChart';
import { STATUS_COLORS } from './chartColors';
import type { StudentDetailBundle } from '@/lib/dashboardService';

const formatCurrency = (value: number | undefined | null) => `₹${(value ?? 0).toLocaleString('en-IN')}`;
const formatDate = (value: string) => (value ? new Date(value).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : '—');

const LEAVE_STATUS_STYLES: Record<string, string> = {
  APPROVED: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  PENDING: 'bg-amber-50 text-amber-700 ring-amber-600/20',
  REJECTED: 'bg-red-50 text-red-700 ring-red-600/20',
};

function Pill({ label, tone = 'bg-slate-100 text-slate-600 ring-slate-200' }: { label: string; tone?: string }) {
  return <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 ring-inset ${tone}`}>{label}</span>;
}

/**
 * Shared visual body for a single student's dashboard data — used verbatim
 * by both app/student/dashboard (the student's own bundle) and
 * app/parent/dashboard (the selected child's bundle), so both stay visually
 * identical by construction.
 */
export default function StudentDashboardBody({ bundle }: { bundle: StudentDetailBundle }) {
  // Nested sections can arrive null despite the declared type (seen in practice on the admin
  // dashboard's finance fields) — default each one so a missing section degrades to empty state
  // instead of throwing when this body is rendered for either the student or parent dashboard.
  const attendance = bundle.attendance ?? { totalDays: 0, presentDays: 0, absentDays: 0, lateDays: 0, halfDays: 0, attendancePercentage: 0, recentAttendance: [] };
  const fees = bundle.fees ?? { totalFees: 0, paidAmount: 0, pendingAmount: 0, paidCount: 0, pendingCount: 0, overdueCount: 0, collectionPercentage: 0 };
  const exams = bundle.exams ?? { totalExams: 0, passedExams: 0, failedExams: 0, upcomingExams: 0, averagePercentage: 0, upcomingExamList: [] };
  const leave = bundle.leave ?? { approvedDays: 0, pendingCount: 0, rejectedCount: 0, recentLeaves: [] };
  const recentResults = bundle.recentResults ?? [];
  const todayTimetable = bundle.todayTimetable ?? [];

  const attendanceLegend = [
    { label: 'Present', value: attendance.presentDays ?? 0, color: STATUS_COLORS.good },
    { label: 'Absent', value: attendance.absentDays ?? 0, color: STATUS_COLORS.critical },
    { label: 'Late', value: attendance.lateDays ?? 0, color: STATUS_COLORS.warning },
    { label: 'Half day', value: attendance.halfDays ?? 0, color: STATUS_COLORS.neutral },
  ];

  const resultBars = recentResults.map((r) => ({
    label: r.subjectName,
    value: Math.round(r.percentage ?? 0),
    color: r.absent ? STATUS_COLORS.neutral : r.passed ? STATUS_COLORS.good : STATUS_COLORS.critical,
  }));

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard index={0} icon={CalendarCheck} label="Attendance" value={`${Math.round(attendance.attendancePercentage ?? 0)}%`} />
        <StatCard index={1} icon={Wallet} label="Fee Pending" value={formatCurrency(fees.pendingAmount)} />
        <StatCard index={2} icon={FileText} label="Upcoming Exams" value={`${exams.upcomingExams}`} />
        <StatCard index={3} icon={Award} label="Average Score" value={`${Math.round(exams.averagePercentage ?? 0)}%`} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <SectionCard title="Attendance Overview" subtitle={`${attendance.totalDays} days on record`}>
          <div className="flex flex-col items-center gap-5 sm:flex-row sm:justify-around">
            <DonutStat percentage={attendance.attendancePercentage} label="Present rate" color={STATUS_COLORS.good} />
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

        <SectionCard title="Recent Results" subtitle="Percentage scored per subject">
          <SimpleBarChart data={resultBars} valueFormatter={(v) => `${v}%`} />
        </SectionCard>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <SectionCard title="Fee Summary" icon={Wallet}>
          <div className="flex items-center justify-center pb-2">
            <DonutStat percentage={fees.collectionPercentage} label="Collected" size={104} color={STATUS_COLORS.good} />
          </div>
          <ul className="space-y-2 text-sm">
            <li className="flex items-center justify-between">
              <span className="text-slate-500">Paid</span>
              <span className="font-semibold text-emerald-700">{formatCurrency(fees.paidAmount)}</span>
            </li>
            <li className="flex items-center justify-between">
              <span className="text-slate-500">Pending</span>
              <span className="font-semibold text-amber-700">{formatCurrency(fees.pendingAmount)}</span>
            </li>
            <li className="flex items-center justify-between">
              <span className="text-slate-500">Overdue</span>
              <span className="font-semibold text-rose-700">{fees.overdueCount}</span>
            </li>
          </ul>
        </SectionCard>

        <SectionCard title="Upcoming Exams" icon={ClipboardList}>
          {exams.upcomingExamList.length === 0 ? (
            <p className="py-6 text-center text-sm text-slate-400">No upcoming exams.</p>
          ) : (
            <ul className="space-y-3">
              {exams.upcomingExamList.map((exam) => (
                <li key={exam.examId} className="rounded-lg border border-slate-100 bg-slate-50/60 p-3">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-medium text-slate-900">{exam.title}</p>
                    <Pill label={exam.status} />
                  </div>
                  <p className="mt-1 text-xs text-slate-400">
                    {exam.examType} · {exam.className} · {formatDate(exam.startDate)} – {formatDate(exam.endDate)}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </SectionCard>

        <SectionCard title="Leave Summary" icon={PlaneTakeoff}>
          <div className="mb-3 flex justify-between text-center text-sm">
            <div>
              <p className="font-bold text-slate-900">{leave.approvedDays}</p>
              <p className="text-xs text-slate-400">Approved</p>
            </div>
            <div>
              <p className="font-bold text-slate-900">{leave.pendingCount}</p>
              <p className="text-xs text-slate-400">Pending</p>
            </div>
            <div>
              <p className="font-bold text-slate-900">{leave.rejectedCount}</p>
              <p className="text-xs text-slate-400">Rejected</p>
            </div>
          </div>
          {leave.recentLeaves.length === 0 ? (
            <p className="py-4 text-center text-sm text-slate-400">No leave requests yet.</p>
          ) : (
            <ul className="space-y-2">
              {leave.recentLeaves.map((l) => (
                <li key={l.leaveId} className="rounded-lg border border-slate-100 bg-slate-50/60 p-2.5 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-slate-800">{l.leaveType}</span>
                    <Pill label={l.status} tone={LEAVE_STATUS_STYLES[l.status] ?? undefined} />
                  </div>
                  <p className="mt-1 text-slate-500">
                    {formatDate(l.fromDate)} – {formatDate(l.toDate)} · {l.numberOfDays}d
                  </p>
                </li>
              ))}
            </ul>
          )}
        </SectionCard>
      </div>

      <TimetableListPanel entries={todayTimetable} />
    </div>
  );
}
