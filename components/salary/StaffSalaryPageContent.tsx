'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  BadgeIndianRupee,
  Download,
  Eye,
  HandCoins,
  Pencil,
  Plus,
  ReceiptIndianRupee,
  RefreshCw,
  Trash2,
  Users,
  Wallet,
} from 'lucide-react';
import { apiErrorMessage } from '@/lib/api';
import {
  deleteStaffSalary,
  getSalaryTemplates,
  getStaffSalaries,
  STAFF_SALARY_STATUSES,
  type SalaryTemplate,
  type StaffSalary,
  type StaffSalaryStatus,
} from '@/lib/salaryTemplateService';
import { getAllTeacherStaff, type TeacherStaffMember } from '@/lib/schoolService';
import SetPageTitle from '@/components/dashboard/SetPageTitle';
import StatCard from '@/components/dashboard/StatCard';
import PageHeader from '@/components/ui/PageHeader';
import DataTable, { type DataTableColumn } from '@/components/ui/DataTable';
import { StaffSalaryStatusBadge } from '@/components/ui/Badge';
import Button, { IconButton } from '@/components/ui/Button';
import { SelectField } from '@/components/ui/FormField';
import StaffSalaryFormModal from './StaffSalaryFormModal';
import StaffSalaryDetailModal from './StaffSalaryDetailModal';
import { downloadSalaryPdf, formatMoney, formatSalaryMonth, STATUS_LABELS } from './salaryUtils';

/**
 * Staff Salary management — monthly payslips generated from the global salary
 * templates (see SalaryTemplatePageContent). Filtering by staff member and
 * status is done server-side, since the API exposes both as query params.
 */
export default function StaffSalaryPageContent() {
  const [staff, setStaff] = useState<TeacherStaffMember[]>([]);
  const [templates, setTemplates] = useState<SalaryTemplate[]>([]);
  // Starts true so the salaries effect below skips its first run and only
  // fires once the filter dropdowns have their real options — same guard as
  // FeeStructurePageContent's classesLoading.
  const [optionsLoading, setOptionsLoading] = useState(true);

  const [salaries, setSalaries] = useState<StaffSalary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [userFilter, setUserFilter] = useState<number | ''>('');
  const [statusFilter, setStatusFilter] = useState<StaffSalaryStatus | ''>('');

  const [formModalOpen, setFormModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<StaffSalary | null>(null);
  const [detailItem, setDetailItem] = useState<StaffSalary | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [downloadingId, setDownloadingId] = useState<number | null>(null);

  useEffect(() => {
    const loadOptions = async () => {
      setOptionsLoading(true);
      try {
        const [staffPage, templateList] = await Promise.all([getAllTeacherStaff(), getSalaryTemplates()]);
        setStaff(staffPage.content);
        setTemplates(templateList);
      } catch (err) {
        setError(apiErrorMessage(err, 'Could not load staff and salary templates from the server.'));
      } finally {
        setOptionsLoading(false);
      }
    };
    loadOptions();
  }, []);

  const loadSalaries = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const page = await getStaffSalaries({
        userId: userFilter || undefined,
        status: statusFilter || undefined,
      });
      setSalaries(page.content);
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not load staff salaries from the server.'));
    } finally {
      setLoading(false);
    }
  }, [userFilter, statusFilter]);

  useEffect(() => {
    if (optionsLoading) return;
    loadSalaries();
  }, [optionsLoading, loadSalaries]);

  const stats = useMemo(() => {
    const paid = salaries.filter((s) => s.status === 'PAID');
    const pending = salaries.filter((s) => s.status !== 'PAID' && s.status !== 'CANCELLED');
    return {
      count: salaries.length,
      staffCount: new Set(salaries.map((s) => s.userId)).size,
      paidTotal: paid.reduce((sum, s) => sum + (s.netSalary || 0), 0),
      pendingTotal: pending.reduce((sum, s) => sum + (s.netSalary || 0), 0),
    };
  }, [salaries]);

  const openCreateModal = () => {
    setEditingItem(null);
    setFormModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this payslip? This cannot be undone.')) return;
    setDeletingId(id);
    setError('');
    try {
      await deleteStaffSalary(id);
      setSalaries((prev) => prev.filter((s) => s.id !== id));
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not delete that payslip.'));
    } finally {
      setDeletingId(null);
    }
  };

  const handleDownload = async (salary: StaffSalary) => {
    setDownloadingId(salary.id);
    setError('');
    try {
      await downloadSalaryPdf(salary);
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not download the payslip PDF.'));
    } finally {
      setDownloadingId(null);
    }
  };

  const handleSaved = async () => {
    setFormModalOpen(false);
    setEditingItem(null);
    await loadSalaries();
  };

  const handleStatusChanged = (updated: StaffSalary) => {
    setSalaries((prev) => prev.map((s) => (s.id === updated.id ? { ...s, ...updated } : s)));
    setDetailItem((prev) => (prev && prev.id === updated.id ? { ...prev, ...updated } : prev));
  };

  const columns: DataTableColumn<StaffSalary>[] = [
    {
      key: 'userName',
      header: 'Staff',
      sortable: true,
      accessor: (s) => s.userName,
      render: (s) => (
        <div className="min-w-0">
          <p className="truncate font-semibold text-slate-900">{s.userName || `Staff #${s.userId}`}</p>
          <p className="truncate text-xs text-slate-400">{s.userEmail || '—'}</p>
        </div>
      ),
    },
    {
      key: 'salaryMonth',
      header: 'Month',
      sortable: true,
      accessor: (s) => s.salaryMonth,
      render: (s) => <span className="whitespace-nowrap text-slate-600">{formatSalaryMonth(s.salaryMonth)}</span>,
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
      header: 'Net',
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
      widthClassName: 'w-36',
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
          <IconButton
            icon={Pencil}
            label="Edit"
            variant="primary"
            onClick={(e) => {
              e.stopPropagation();
              setEditingItem(s);
              setFormModalOpen(true);
            }}
          />
          <IconButton
            icon={Trash2}
            label="Delete"
            variant="danger"
            loading={deletingId === s.id}
            onClick={(e) => {
              e.stopPropagation();
              handleDelete(s.id);
            }}
          />
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <SetPageTitle title="Staff Salary" />

      <PageHeader
        icon={Wallet}
        title="Staff Salary"
        description="Monthly payslips generated from the active salary template."
        actions={
          <>
            <Button variant="secondary" size="sm" icon={RefreshCw} onClick={loadSalaries} disabled={loading}>
              Refresh
            </Button>
            <Button size="sm" icon={Plus} onClick={openCreateModal} disabled={optionsLoading || templates.length === 0}>
              New Salary
            </Button>
          </>
        }
      />

      {!optionsLoading && templates.length === 0 && (
        <div className="card-premium flex flex-wrap items-center justify-between gap-3 border-dashed px-4 py-3.5">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
              <ReceiptIndianRupee size={18} />
            </span>
            <div>
              <p className="text-sm font-semibold text-slate-900">No salary template yet</p>
              <p className="text-xs text-slate-500">
                A payslip is generated from a salary template — create one before adding salaries.
              </p>
            </div>
          </div>
          <Link
            href="/principal/salary-template"
            className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-semibold text-slate-600 transition-colors hover:border-brand-200 hover:bg-brand-50/50 hover:text-brand-700"
          >
            <ReceiptIndianRupee size={13} />
            Manage templates
          </Link>
        </div>
      )}

      {/* <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={BadgeIndianRupee} label="Payslips" value={String(stats.count)} index={0} />
        <StatCard icon={Users} label="Staff covered" value={String(stats.staffCount)} index={1} color="indigo" />
        <StatCard icon={HandCoins} label="Paid out" value={formatMoney(stats.paidTotal)} index={2} color="emerald" />
        <StatCard icon={Wallet} label="Pending" value={formatMoney(stats.pendingTotal)} index={3} color="amber" />
      </div> */}

      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
      )}

      <div className="card-premium flex flex-wrap items-end gap-3 px-4 py-3.5">
        <SelectField
          label="Staff member"
          value={userFilter}
          wrapperClassName="w-56"
          disabled={optionsLoading}
          onChange={(e) => setUserFilter(e.target.value ? Number(e.target.value) : '')}
        >
          <option value="">All staff</option>
          {staff.map((member) => (
            <option key={member.teacherUser.id} value={member.teacherUser.id}>
              {member.teacherUser.fullName}
            </option>
          ))}
        </SelectField>

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

        {(userFilter || statusFilter) && (
          <Button
            variant="ghost"
            size="sm"
            className="mb-0.5"
            onClick={() => {
              setUserFilter('');
              setStatusFilter('');
            }}
          >
            Clear filters
          </Button>
        )}

        <Link
          href="/principal/salary-template"
          className="mb-0.5 ml-auto inline-flex h-8 shrink-0 items-center gap-1.5 rounded-lg px-2.5 text-xs font-semibold text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800"
        >
          <ReceiptIndianRupee size={13} />
          Salary templates
        </Link>
      </div>

      <DataTable
        columns={columns}
        data={salaries}
        rowKey={(s) => s.id}
        loading={loading || optionsLoading}
        onRowClick={(s) => setDetailItem(s)}
        emptyTitle="No payslips found"
        emptyDescription={
          userFilter || statusFilter
            ? 'No payslips match the current filters.'
            : 'Create the first staff salary to get started.'
        }
      />

      {formModalOpen && (
        <StaffSalaryFormModal
          item={editingItem}
          staff={staff}
          templates={templates}
          onClose={() => {
            setFormModalOpen(false);
            setEditingItem(null);
          }}
          onSaved={handleSaved}
        />
      )}

      {detailItem && (
        <StaffSalaryDetailModal
          salary={detailItem}
          canManageStatus
          onClose={() => setDetailItem(null)}
          onStatusChanged={handleStatusChanged}
        />
      )}
    </div>
  );
}
