'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { BadgeIndianRupee, CalendarDays, Download, Eye, HandCoins, RefreshCw, Wallet } from 'lucide-react';
import { apiErrorMessage } from '@/lib/api';
import {
  getMyStaffSalaries,
  STAFF_SALARY_STATUSES,
  type StaffSalary,
  type StaffSalaryStatus,
} from '@/lib/salaryTemplateService';
import SetPageTitle from '@/components/dashboard/SetPageTitle';
import StatCard from '@/components/dashboard/StatCard';
import PageHeader from '@/components/ui/PageHeader';
import DataTable, { type DataTableColumn } from '@/components/ui/DataTable';
import { StaffSalaryStatusBadge } from '@/components/ui/Badge';
import Button, { IconButton } from '@/components/ui/Button';
import { SelectField } from '@/components/ui/FormField';
import StaffSalaryDetailModal from './StaffSalaryDetailModal';
import { downloadSalaryPdf, formatDate, formatMoney, formatSalaryMonth, STATUS_LABELS } from './salaryUtils';

/**
 * The signed-in staff member's own payslips — read-only counterpart to the
 * Principal's Staff Salary page. Backed by /my-salaries, so no user filter:
 * the backend scopes the list to the caller's own records.
 */
export default function MySalaryPageContent() {
  const [salaries, setSalaries] = useState<StaffSalary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState<StaffSalaryStatus | ''>('');
  const [detailItem, setDetailItem] = useState<StaffSalary | null>(null);
  const [downloadingId, setDownloadingId] = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const page = await getMyStaffSalaries({ status: statusFilter || undefined });
      setSalaries(page.content);
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not load your salary records from the server.'));
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    load();
  }, [load]);

  const stats = useMemo(() => {
    const paid = salaries.filter((s) => s.status === 'PAID');
    const pending = salaries.filter((s) => s.status !== 'PAID' && s.status !== 'CANCELLED');
    // Newest payslip by salary month — what the hero card above the table shows.
    const latest = [...salaries].sort((a, b) => (a.salaryMonth < b.salaryMonth ? 1 : -1))[0] ?? null;
    return {
      count: salaries.length,
      paidTotal: paid.reduce((sum, s) => sum + (s.netSalary || 0), 0),
      pendingTotal: pending.reduce((sum, s) => sum + (s.netSalary || 0), 0),
      latest,
    };
  }, [salaries]);

  const handleDownload = async (salary: StaffSalary) => {
    setDownloadingId(salary.id);
    setError('');
    try {
      await downloadSalaryPdf(salary);
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not download your payslip PDF.'));
    } finally {
      setDownloadingId(null);
    }
  };

  const columns: DataTableColumn<StaffSalary>[] = [
    {
      key: 'salaryMonth',
      header: 'Salary month',
      sortable: true,
      accessor: (s) => s.salaryMonth,
      render: (s) => (
        <div>
          <p className="font-semibold whitespace-nowrap text-slate-900">{formatSalaryMonth(s.salaryMonth)}</p>
          <p className="text-xs text-slate-400">Payslip #{s.id}</p>
        </div>
      ),
    },
    {
      key: 'basicSalary',
      header: 'Basic',
      align: 'right',
      sortable: true,
      accessor: (s) => s.basicSalary,
      render: (s) => <span className="text-slate-600">{formatMoney(s.basicSalary)}</span>,
    },
    {
      key: 'totalAllowances',
      header: 'Allowances',
      align: 'right',
      sortable: true,
      accessor: (s) => s.totalAllowances,
      render: (s) => <span className="text-emerald-600">+ {formatMoney(s.totalAllowances)}</span>,
    },
    {
      key: 'totalDeductions',
      header: 'Deductions',
      align: 'right',
      sortable: true,
      accessor: (s) => s.totalDeductions,
      render: (s) => <span className="text-red-600">− {formatMoney(s.totalDeductions)}</span>,
    },
    {
      key: 'days',
      header: 'Paid days',
      align: 'center',
      sortable: true,
      accessor: (s) => s.paidDays,
      render: (s) => (
        <span className="text-slate-600">
          {s.paidDays}
          <span className="text-slate-400">/{s.workingDays}</span>
        </span>
      ),
    },
    {
      key: 'netSalary',
      header: 'Net pay',
      align: 'right',
      sortable: true,
      accessor: (s) => s.netSalary,
      render: (s) => <span className="font-bold text-brand-700">{formatMoney(s.netSalary)}</span>,
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      accessor: (s) => s.status,
      render: (s) => <StaffSalaryStatusBadge status={s.status} />,
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      widthClassName: 'w-20',
      render: (s) => (
        <div className="flex items-center justify-end gap-1">
          <IconButton
            icon={Eye}
            label="View payslip"
            onClick={(e) => {
              e.stopPropagation();
              setDetailItem(s);
            }}
          />
          <IconButton
            icon={Download}
            label="Download PDF"
            variant="primary"
            loading={downloadingId === s.id}
            onClick={(e) => {
              e.stopPropagation();
              handleDownload(s);
            }}
          />
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <SetPageTitle title="My Salary" />

   

      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
      )}

      {/* <div className="grid gap-3 sm:grid-cols-3">
        <StatCard icon={BadgeIndianRupee} label="Payslips" value={String(stats.count)} index={0} />
        <StatCard icon={HandCoins} label="Total received" value={formatMoney(stats.paidTotal)} index={1} color="emerald" />
        <StatCard icon={Wallet} label="Pending" value={formatMoney(stats.pendingTotal)} index={2} color="amber" />
      </div> */}

      {!loading && stats.latest && <LatestPayslipCard salary={stats.latest} onView={() => setDetailItem(stats.latest)} />}

      <div className="card-premium flex flex-wrap items-end gap-3 px-4 py-3.5">
        <SelectField
          label="Status"
          value={statusFilter}
          wrapperClassName="w-44"
          onChange={(e) => setStatusFilter(e.target.value as StaffSalaryStatus | '')}
        >
          <option value="">All statuses</option>
          {STAFF_SALARY_STATUSES.map((status) => (
            <option key={status} value={status}>
              {STATUS_LABELS[status]}
            </option>
          ))}
        </SelectField>
        {statusFilter && (
          <Button variant="ghost" size="sm" className="mb-0.5" onClick={() => setStatusFilter('')}>
            Clear filter
          </Button>
        )}
      </div>

      <DataTable
        columns={columns}
        data={salaries}
        rowKey={(s) => s.id}
        loading={loading}
        onRowClick={(s) => setDetailItem(s)}
        emptyTitle="No payslips yet"
        emptyDescription={
          statusFilter
            ? 'No payslips match the selected status.'
            : 'Your payslips will appear here once the school generates them.'
        }
      />

      {detailItem && <StaffSalaryDetailModal salary={detailItem} onClose={() => setDetailItem(null)} />}
    </div>
  );
}

/** Highlight panel for the most recent payslip, so the current month is visible without opening a row. */
function LatestPayslipCard({ salary, onView }: { salary: StaffSalary; onView: () => void }) {
  return (
    <div className="card-premium animate-fade-in-up relative overflow-hidden p-5">
      <span className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-brand-500 via-brand-300 to-brand-500" />
      <span className="pointer-events-none absolute -top-16 -right-12 h-40 w-40 rounded-full bg-brand-400/10 blur-3xl" />

      <div className="relative flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-glow-brand">
            <CalendarDays size={18} />
          </span>
          <div>
            <p className="text-sm font-bold text-slate-900">Latest payslip — {formatSalaryMonth(salary.salaryMonth)}</p>
            <p className="text-xs text-slate-500">
              {salary.paymentDate ? `Paid on ${formatDate(salary.paymentDate)}` : 'Payment date not set'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <StaffSalaryStatusBadge status={salary.status} />
          <Button variant="secondary" size="sm" icon={Eye} onClick={onView}>
            View
          </Button>
        </div>
      </div>

      <div className="relative mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Metric label="Basic salary" value={formatMoney(salary.basicSalary)} />
        <Metric label="Allowances" value={formatMoney(salary.totalAllowances)} tone="positive" />
        <Metric label="Deductions" value={formatMoney(salary.totalDeductions)} tone="negative" />
        <Metric label="Net pay" value={formatMoney(salary.netSalary)} tone="brand" />
      </div>
    </div>
  );
}

function Metric({ label, value, tone }: { label: string; value: string; tone?: 'positive' | 'negative' | 'brand' }) {
  const toneClass =
    tone === 'positive'
      ? 'text-emerald-600'
      : tone === 'negative'
        ? 'text-red-600'
        : tone === 'brand'
          ? 'text-brand-700'
          : 'text-slate-900';
  return (
    <div className="rounded-xl border border-slate-100 bg-slate-50/60 px-3.5 py-3">
      <p className="text-[11px] font-medium tracking-wide text-slate-500 uppercase">{label}</p>
      <p className={`mt-1 text-lg font-bold tracking-tight tabular-nums ${toneClass}`}>{value}</p>
    </div>
  );
}
