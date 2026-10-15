'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { BarChart3, Bus, Fuel, Pencil, PieChart, Plus, RefreshCw, Trash2 } from 'lucide-react';
import { apiErrorMessage } from '@/lib/api';
import {
  deleteExpense,
  EXPENSE_TYPES,
  getExpenseReportByType,
  getExpenseReportByVehicle,
  getExpenses,
  getVehicles,
  type ExpenseByType,
  type ExpenseByVehicle,
  type ExpenseType,
  type Vehicle,
  type VehicleExpense,
} from '@/lib/transportService';
import PageHeader from '@/components/ui/PageHeader';
import DataTable, { type DataTableColumn } from '@/components/ui/DataTable';
import Button, { IconButton } from '@/components/ui/Button';
import { SelectField, TextField } from '@/components/ui/FormField';
import SectionCard from '@/components/dashboard/SectionCard';
import { categoryColor } from '@/components/dashboard/chartColors';
import ExpenseFormModal from './ExpenseFormModal';
import { EnumBadge, enumLabel, ErrorBanner, FilterBar, formatDate, formatMoney, MiniStat, monthStartInput, todayInput } from './transportUi';

/** Running-cost ledger for the fleet with per-vehicle and per-category breakdowns over the same date range. */
export default function ExpensesTab() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [expenses, setExpenses] = useState<VehicleExpense[]>([]);
  const [byVehicle, setByVehicle] = useState<ExpenseByVehicle[]>([]);
  const [byType, setByType] = useState<ExpenseByType[]>([]);
  const [loading, setLoading] = useState(true);
  const [reportsLoading, setReportsLoading] = useState(true);
  const [error, setError] = useState('');

  const [vehicleId, setVehicleId] = useState<number | ''>('');
  const [expenseType, setExpenseType] = useState<ExpenseType | ''>('');
  const [from, setFrom] = useState(monthStartInput());
  const [to, setTo] = useState(todayInput());

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<VehicleExpense | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  useEffect(() => {
    getVehicles()
      .then((p) => setVehicles(p.content))
      .catch(() => setVehicles([]));
  }, []);

  const loadLedger = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const page = await getExpenses({
        vehicleId: vehicleId || undefined,
        expenseType: expenseType || undefined,
        from: from || undefined,
        to: to || undefined,
      });
      setExpenses(page.content);
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not load expenses.'));
    } finally {
      setLoading(false);
    }
  }, [vehicleId, expenseType, from, to]);

  const loadReports = useCallback(async () => {
    setReportsLoading(true);
    try {
      const [v, t] = await Promise.all([
        getExpenseReportByVehicle({ from: from || undefined, to: to || undefined }),
        getExpenseReportByType({ from: from || undefined, to: to || undefined }),
      ]);
      setByVehicle([...v].sort((a, b) => b.totalAmount - a.totalAmount));
      setByType([...t].sort((a, b) => b.totalAmount - a.totalAmount));
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not load expense reports.'));
    } finally {
      setReportsLoading(false);
    }
  }, [from, to]);

  useEffect(() => {
    loadLedger();
  }, [loadLedger]);

  useEffect(() => {
    loadReports();
  }, [loadReports]);

  const refreshAll = () => {
    loadLedger();
    loadReports();
  };

  const stats = useMemo(() => {
    const total = expenses.reduce((s, e) => s + (e.amount || 0), 0);
    const fuel = expenses.filter((e) => e.expenseType === 'FUEL');
    const fuelAmount = fuel.reduce((s, e) => s + (e.amount || 0), 0);
    const litres = fuel.reduce((s, e) => s + (e.fuelLitres || 0), 0);
    return { total, count: expenses.length, fuelAmount, litres };
  }, [expenses]);

  const handleDelete = async (e: VehicleExpense) => {
    if (!confirm(`Delete this ${enumLabel(e.expenseType).toLowerCase()} expense of ${formatMoney(e.amount)}?`)) return;
    setDeletingId(e.id);
    setError('');
    try {
      await deleteExpense(e.id);
      setExpenses((prev) => prev.filter((x) => x.id !== e.id));
      loadReports();
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not delete the expense.'));
    } finally {
      setDeletingId(null);
    }
  };

  const columns: DataTableColumn<VehicleExpense>[] = [
    { key: 'expenseDate', header: 'Date', sortable: true, accessor: (e) => e.expenseDate, render: (e) => <span className="whitespace-nowrap">{formatDate(e.expenseDate)}</span> },
    {
      key: 'registrationNumber',
      header: 'Vehicle',
      sortable: true,
      accessor: (e) => e.registrationNumber,
      render: (e) => <span className="font-semibold tracking-wide text-slate-900">{e.registrationNumber}</span>,
    },
    { key: 'expenseType', header: 'Type', sortable: true, accessor: (e) => e.expenseType, render: (e) => <EnumBadge value={e.expenseType} /> },
    {
      key: 'details',
      header: 'Details',
      render: (e) => (
        <div className="text-xs text-slate-500">
          <p className="text-slate-700">{e.vendor || '—'}</p>
          <p>
            {[e.billNumber && `Bill ${e.billNumber}`, e.fuelLitres ? `${e.fuelLitres} L` : null, e.odometerReading ? `${e.odometerReading.toLocaleString('en-IN')} km` : null]
              .filter(Boolean)
              .join(' · ') || '—'}
          </p>
        </div>
      ),
    },
    { key: 'paymentMode', header: 'Paid via', sortable: true, accessor: (e) => e.paymentMode, render: (e) => <span className="text-xs text-slate-600">{enumLabel(e.paymentMode)}</span> },
    {
      key: 'amount',
      header: 'Amount',
      align: 'right',
      sortable: true,
      accessor: (e) => e.amount,
      render: (e) => <span className="font-bold text-slate-900">{formatMoney(e.amount)}</span>,
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      render: (e) => (
        <div className="flex items-center justify-end gap-1">
          <IconButton
            icon={Pencil}
            label="Edit"
            variant="primary"
            onClick={() => {
              setEditing(e);
              setFormOpen(true);
            }}
          />
          <IconButton icon={Trash2} label="Delete" variant="danger" loading={deletingId === e.id} onClick={() => handleDelete(e)} />
        </div>
      ),
    },
  ];

  const hasFilters = vehicleId || expenseType;

  return (
    <div className="space-y-4">
      <PageHeader
        icon={Fuel}
        title="Vehicle Expenses"
        description="Fuel, maintenance and renewal costs with fleet-wide breakdowns."
        actions={
          <>
            <Button variant="secondary" size="sm" icon={RefreshCw} onClick={refreshAll} disabled={loading}>
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
              Record Expense
            </Button>
          </>
        }
      />

      <FilterBar>
        <TextField label="From" type="date" wrapperClassName="w-40" value={from} max={to || undefined} onChange={(e) => setFrom(e.target.value)} />
        <TextField label="To" type="date" wrapperClassName="w-40" value={to} min={from || undefined} onChange={(e) => setTo(e.target.value)} />
        <SelectField label="Vehicle" wrapperClassName="w-48" value={vehicleId} onChange={(e) => setVehicleId(e.target.value ? Number(e.target.value) : '')}>
          <option value="">All vehicles</option>
          {vehicles.map((v) => (
            <option key={v.id} value={v.id}>
              {v.registrationNumber}
            </option>
          ))}
        </SelectField>
        <SelectField label="Type" wrapperClassName="w-44" value={expenseType} onChange={(e) => setExpenseType(e.target.value as ExpenseType | '')}>
          <option value="">All types</option>
          {EXPENSE_TYPES.map((t) => (
            <option key={t} value={t}>
              {enumLabel(t)}
            </option>
          ))}
        </SelectField>
        {hasFilters && (
          <Button
            variant="ghost"
            size="sm"
            className="mb-0.5"
            onClick={() => {
              setVehicleId('');
              setExpenseType('');
            }}
          >
            Clear filters
          </Button>
        )}
      </FilterBar>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <MiniStat label="Total spend" value={formatMoney(stats.total)} tone="indigo" hint={hasFilters ? 'Filtered ledger' : 'Selected period'} />
        <MiniStat label="Entries" value={String(stats.count)} />
        <MiniStat label="Fuel spend" value={formatMoney(stats.fuelAmount)} tone="amber" />
        <MiniStat label="Fuel filled" value={`${stats.litres.toLocaleString('en-IN', { maximumFractionDigits: 1 })} L`} tone="emerald" />
      </div>

      <ErrorBanner message={error} />

      <div className="grid gap-4 lg:grid-cols-2">
        <SectionCard title="Spend by vehicle" subtitle="Whole fleet, selected period" icon={Bus}>
          <BarList
            loading={reportsLoading}
            rows={byVehicle.map((r) => ({ key: String(r.vehicleId), label: r.registrationNumber, amount: r.totalAmount, count: r.expenseCount }))}
          />
        </SectionCard>
        <SectionCard title="Spend by category" subtitle="Whole fleet, selected period" icon={PieChart}>
          <BarList
            loading={reportsLoading}
            rows={byType.map((r) => ({ key: r.expenseType, label: enumLabel(r.expenseType), amount: r.totalAmount, count: r.expenseCount }))}
          />
        </SectionCard>
      </div>

      <div className="flex items-center gap-2 pt-1">
        <BarChart3 size={15} className="text-brand-600" />
        <h3 className="text-sm font-semibold text-slate-900">Expense ledger</h3>
      </div>
      <DataTable
        columns={columns}
        data={expenses}
        rowKey={(e) => e.id}
        loading={loading}
        emptyTitle="No expenses in this period"
        emptyDescription="Record fuel fills, services and repairs to track running costs."
      />

      {formOpen && (
        <ExpenseFormModal
          item={editing}
          vehicles={vehicles}
          onClose={() => setFormOpen(false)}
          onSaved={() => {
            setFormOpen(false);
            refreshAll();
          }}
        />
      )}
    </div>
  );
}

function BarList({ rows, loading }: { rows: { key: string; label: string; amount: number; count: number }[]; loading: boolean }) {
  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="skeleton h-8 rounded-lg" />
        ))}
      </div>
    );
  }
  if (rows.length === 0) return <p className="py-8 text-center text-sm text-slate-400">No expenses in this period.</p>;

  const max = Math.max(...rows.map((r) => r.amount || 0), 1);
  const total = rows.reduce((s, r) => s + (r.amount || 0), 0);
  return (
    <ul className="space-y-3">
      {rows.map((r, i) => (
        <li key={r.key}>
          <div className="mb-1 flex items-center justify-between gap-3 text-xs">
            <span className="truncate font-medium text-slate-700">{r.label}</span>
            <span className="shrink-0 tabular-nums text-slate-500">
              <span className="font-semibold text-slate-900">{formatMoney(r.amount)}</span> · {r.count} entr{r.count === 1 ? 'y' : 'ies'} ·{' '}
              {total ? Math.round((r.amount / total) * 100) : 0}%
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-slate-100">
            <div className="h-full rounded-full transition-all duration-700" style={{ width: `${(r.amount / max) * 100}%`, backgroundColor: categoryColor(i) }} />
          </div>
        </li>
      ))}
    </ul>
  );
}
