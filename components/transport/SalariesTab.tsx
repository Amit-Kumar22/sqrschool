'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { FileText, HandCoins, ListChecks, Pencil, Plus, RefreshCw, Trash2 } from 'lucide-react';
import { apiErrorMessage } from '@/lib/api';
import {
  deleteTransportSalary,
  getTransportSalaries,
  getTransportStaff,
  SALARY_STATUSES,
  type TransportSalary,
  type TransportSalaryStatus,
  type TransportStaff,
} from '@/lib/transportService';
import DataTable, { type DataTableColumn } from '@/components/ui/DataTable';
import Button, { IconButton } from '@/components/ui/Button';
import { SelectField, TextField } from '@/components/ui/FormField';
import TransportSalaryFormModal from './TransportSalaryFormModal';
import PaySalaryModal from './PaySalaryModal';
import SalarySlipModal from './SalarySlipModal';
import SalaryStatusModal from './SalaryStatusModal';
import { EnumBadge, enumLabel, ErrorBanner, FilterBar, formatMoney, formatMonth, MiniStat, monthInputToDate } from './transportUi';

const isSettled = (s: TransportSalary) => s.status === 'PAID' || s.status === 'CANCELLED';

/** Transport crew payroll — generate monthly salaries, approve, pay and print slips. */
export default function SalariesTab() {
  const [staff, setStaff] = useState<TransportStaff[]>([]);
  const [salaries, setSalaries] = useState<TransportSalary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [status, setStatus] = useState<TransportSalaryStatus | ''>('');
  const [fromMonth, setFromMonth] = useState('');
  const [toMonth, setToMonth] = useState('');

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<TransportSalary | null>(null);
  const [paying, setPaying] = useState<TransportSalary | null>(null);
  const [slipFor, setSlipFor] = useState<TransportSalary | null>(null);
  const [statusFor, setStatusFor] = useState<TransportSalary | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  useEffect(() => {
    getTransportStaff({ employmentStatus: 'ACTIVE' })
      .then((p) => setStaff(p.content))
      .catch(() => setStaff([]));
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const page = await getTransportSalaries({
        status: status || undefined,
        fromMonth: fromMonth ? monthInputToDate(fromMonth) : undefined,
        toMonth: toMonth ? monthInputToDate(toMonth) : undefined,
      });
      setSalaries(page.content);
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not load salaries.'));
    } finally {
      setLoading(false);
    }
  }, [status, fromMonth, toMonth]);

  useEffect(() => {
    load();
  }, [load]);

  const stats = useMemo(() => {
    const paid = salaries.filter((s) => s.status === 'PAID');
    const due = salaries.filter((s) => !isSettled(s));
    return {
      count: salaries.length,
      paid: paid.reduce((sum, s) => sum + (s.netPayable || 0), 0),
      due: due.reduce((sum, s) => sum + (s.netPayable || 0), 0),
      dueCount: due.length,
      advances: salaries.reduce((sum, s) => sum + (s.salaryAdvance || 0), 0),
    };
  }, [salaries]);

  const handleDelete = async (s: TransportSalary) => {
    if (!confirm(`Delete the ${formatMonth(s.salaryMonth)} salary for ${s.staffName}?`)) return;
    setDeletingId(s.id);
    setError('');
    try {
      await deleteTransportSalary(s.id);
      setSalaries((prev) => prev.filter((x) => x.id !== s.id));
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not delete the salary.'));
    } finally {
      setDeletingId(null);
    }
  };

  const afterSave = (close: () => void) => () => {
    close();
    load();
  };

  const columns: DataTableColumn<TransportSalary>[] = [
    {
      key: 'staffName',
      header: 'Staff',
      sortable: true,
      accessor: (s) => s.staffName,
      render: (s) => (
        <div className="min-w-0">
          <p className="truncate font-semibold text-slate-900">{s.staffName}</p>
          <p className="truncate text-xs text-slate-400">{enumLabel(s.designation)}</p>
        </div>
      ),
    },
    { key: 'salaryMonth', header: 'Month', sortable: true, accessor: (s) => s.salaryMonth, render: (s) => <span className="whitespace-nowrap">{formatMonth(s.salaryMonth)}</span> },
    { key: 'basicSalary', header: 'Basic', align: 'right', sortable: true, accessor: (s) => s.basicSalary, render: (s) => formatMoney(s.basicSalary) },
    {
      key: 'additions',
      header: 'Additions',
      align: 'right',
      sortable: true,
      accessor: (s) => s.allowances + s.overtimeAmount + s.bonus,
      render: (s) => <span className="text-emerald-600">+ {formatMoney((s.allowances || 0) + (s.overtimeAmount || 0) + (s.bonus || 0))}</span>,
    },
    {
      key: 'less',
      header: 'Deductions',
      align: 'right',
      sortable: true,
      accessor: (s) => s.deductions + s.salaryAdvance,
      render: (s) => <span className="text-red-600">− {formatMoney((s.deductions || 0) + (s.salaryAdvance || 0))}</span>,
    },
    {
      key: 'netPayable',
      header: 'Net',
      align: 'right',
      sortable: true,
      accessor: (s) => s.netPayable,
      render: (s) => <span className="font-bold text-brand-700">{formatMoney(s.netPayable)}</span>,
    },
    { key: 'status', header: 'Status', sortable: true, accessor: (s) => s.status, render: (s) => <EnumBadge value={s.status} /> },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      render: (s) => (
        <div className="flex items-center justify-end gap-0.5">
          {!isSettled(s) && (
            <Button size="sm" icon={HandCoins} className="mr-1" onClick={() => setPaying(s)}>
              Pay
            </Button>
          )}
          <IconButton icon={FileText} label="Salary slip" onClick={() => setSlipFor(s)} />
          <IconButton icon={ListChecks} label="Change status" variant="primary" onClick={() => setStatusFor(s)} />
          <IconButton
            icon={Pencil}
            label="Edit"
            variant="primary"
            disabled={s.status === 'PAID'}
            onClick={() => {
              setEditing(s);
              setFormOpen(true);
            }}
          />
          <IconButton icon={Trash2} label="Delete" variant="danger" disabled={s.status === 'PAID'} loading={deletingId === s.id} onClick={() => handleDelete(s)} />
        </div>
      ),
    },
  ];

  const hasFilters = status || fromMonth || toMonth;

  return (
    <div className="space-y-4">
      {/* Stat cards — hidden for now, kept for later.
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <MiniStat label="Salary records" value={String(stats.count)} />
        <MiniStat label="Paid out" value={formatMoney(stats.paid)} tone="emerald" />
        <MiniStat label="Awaiting payment" value={formatMoney(stats.due)} tone={stats.dueCount ? 'amber' : 'emerald'} hint={`${stats.dueCount} salar${stats.dueCount === 1 ? 'y' : 'ies'}`} />
        <MiniStat label="Advances recovered" value={formatMoney(stats.advances)} tone="violet" />
      </div>
      */}

      <ErrorBanner message={error} />

      <FilterBar>
        <SelectField label="Status" wrapperClassName="w-40" value={status} onChange={(e) => setStatus(e.target.value as TransportSalaryStatus | '')}>
          <option value="">All statuses</option>
          {SALARY_STATUSES.map((s) => (
            <option key={s} value={s}>
              {enumLabel(s)}
            </option>
          ))}
        </SelectField>
        <TextField label="From month" type="month" wrapperClassName="w-44" value={fromMonth} max={toMonth || undefined} onChange={(e) => setFromMonth(e.target.value)} />
        <TextField label="To month" type="month" wrapperClassName="w-44" value={toMonth} min={fromMonth || undefined} onChange={(e) => setToMonth(e.target.value)} />
        {hasFilters && (
          <Button
            variant="ghost"
            size="sm"
            className="mb-0.5"
            onClick={() => {
              setStatus('');
              setFromMonth('');
              setToMonth('');
            }}
          >
            Clear filters
          </Button>
        )}
        <div className="mb-0.5 ml-auto flex flex-wrap items-center gap-2">
          <Button variant="secondary" size="sm" icon={RefreshCw} onClick={load} disabled={loading}>
            Refresh
          </Button>
          <Button
            size="sm"
            icon={Plus}
            onClick={() => {
              setEditing(null);
              setFormOpen(true);
            }}
          >
            Generate Salary
          </Button>
        </div>
      </FilterBar>

      <DataTable
        columns={columns}
        data={salaries}
        rowKey={(s) => s.id}
        loading={loading}
        emptyTitle="No salaries found"
        emptyDescription={hasFilters ? 'No salaries match the current filters.' : 'Generate the first monthly salary for your transport crew.'}
      />

      {formOpen && <TransportSalaryFormModal item={editing} staff={staff} onClose={() => setFormOpen(false)} onSaved={afterSave(() => setFormOpen(false))} />}
      {paying && <PaySalaryModal salary={paying} onClose={() => setPaying(null)} onSaved={afterSave(() => setPaying(null))} />}
      {statusFor && <SalaryStatusModal salary={statusFor} onClose={() => setStatusFor(null)} onSaved={afterSave(() => setStatusFor(null))} />}
      {slipFor && <SalarySlipModal salary={slipFor} onClose={() => setSlipFor(null)} />}
    </div>
  );
}
