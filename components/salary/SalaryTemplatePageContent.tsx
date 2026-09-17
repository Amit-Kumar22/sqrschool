'use client';

import { useCallback, useEffect, useState } from 'react';
import { Pencil, Plus, Power, ReceiptIndianRupee, RefreshCw, Star, Trash2 } from 'lucide-react';
import { apiErrorMessage } from '@/lib/api';
import {
  activateSalaryTemplate,
  deleteSalaryTemplate,
  getActiveSalaryTemplate,
  getSalaryTemplates,
  templateAllowances,
  templateDeductions,
  type SalaryTemplate,
} from '@/lib/salaryTemplateService';
import SetPageTitle from '@/components/dashboard/SetPageTitle';
import PageHeader from '@/components/ui/PageHeader';
import DataTable, { type DataTableColumn } from '@/components/ui/DataTable';
import { StatusBadge } from '@/components/ui/Badge';
import Button, { IconButton } from '@/components/ui/Button';
import SalaryTemplateFormModal from './SalaryTemplateFormModal';
import { formatDate, formatMoney } from './salaryUtils';

const grossOf = (t: SalaryTemplate) => t.basicSalary + templateAllowances(t);
const netOf = (t: SalaryTemplate) => grossOf(t) - templateDeductions(t);

/**
 * Salary Template management — the global pay structures every staff payslip
 * is generated from. Exactly one template is active at a time; that one is
 * pulled separately from /active and pinned above the list.
 */
export default function SalaryTemplatePageContent() {
  const [templates, setTemplates] = useState<SalaryTemplate[]>([]);
  const [activeTemplate, setActiveTemplate] = useState<SalaryTemplate | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [formModalOpen, setFormModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<SalaryTemplate | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [togglingId, setTogglingId] = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      // The active template is requested alongside the list rather than picked
      // out of it — /active is the backend's own source of truth, and it 404s
      // when nothing is active yet, which is a normal state, not an error.
      const [list, active] = await Promise.all([
        getSalaryTemplates(),
        getActiveSalaryTemplate().catch(() => null),
      ]);
      setTemplates(list);
      setActiveTemplate(active ?? list.find((t) => t.active) ?? null);
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not load salary templates from the server.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const openCreateModal = () => {
    setEditingItem(null);
    setFormModalOpen(true);
  };

  const openEditModal = (item: SalaryTemplate) => {
    setEditingItem(item);
    setFormModalOpen(true);
  };

  const handleToggleActive = async (item: SalaryTemplate) => {
    setTogglingId(item.id);
    setError('');
    try {
      await activateSalaryTemplate(item.id);
      // Reloaded rather than patched locally: activating one template
      // deactivates whichever other one was active on the backend.
      await load();
    } catch (err) {
      setError(apiErrorMessage(err, `Could not ${item.active ? 'deactivate' : 'activate'} that template.`));
    } finally {
      setTogglingId(null);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this salary template? Payslips already generated from it are not affected.')) return;
    setDeletingId(id);
    setError('');
    try {
      await deleteSalaryTemplate(id);
      setTemplates((prev) => prev.filter((t) => t.id !== id));
      setActiveTemplate((prev) => (prev?.id === id ? null : prev));
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not delete that salary template.'));
    } finally {
      setDeletingId(null);
    }
  };

  const handleSaved = async () => {
    setFormModalOpen(false);
    setEditingItem(null);
    await load();
  };

  const columns: DataTableColumn<SalaryTemplate>[] = [
    {
      key: 'id',
      header: 'Template',
      sortable: true,
      accessor: (t) => t.id,
      render: (t) => (
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-xs font-bold text-brand-700">
            #{t.id}
          </span>
          {t.active && <Star size={13} className="fill-amber-400 text-amber-400" />}
        </div>
      ),
    },
    {
      key: 'basicSalary',
      header: 'Basic',
      align: 'right',
      sortable: true,
      accessor: (t) => t.basicSalary,
      render: (t) => <span className="font-medium text-slate-700">{formatMoney(t.basicSalary)}</span>,
    },
    {
      key: 'allowances',
      header: 'Allowances',
      align: 'right',
      sortable: true,
      accessor: (t) => templateAllowances(t),
      render: (t) => <span className="text-emerald-600">+ {formatMoney(templateAllowances(t))}</span>,
    },
    {
      key: 'deductions',
      header: 'Deductions',
      align: 'right',
      sortable: true,
      accessor: (t) => templateDeductions(t),
      render: (t) => <span className="text-red-600">− {formatMoney(templateDeductions(t))}</span>,
    },
    {
      key: 'gross',
      header: 'Gross',
      align: 'right',
      sortable: true,
      accessor: (t) => grossOf(t),
      render: (t) => <span className="text-slate-600">{formatMoney(grossOf(t))}</span>,
    },
    {
      key: 'net',
      header: 'Net',
      align: 'right',
      sortable: true,
      accessor: (t) => netOf(t),
      render: (t) => <span className="font-bold text-brand-700">{formatMoney(netOf(t))}</span>,
    },
    {
      key: 'active',
      header: 'Status',
      sortable: true,
      accessor: (t) => (t.active ? 1 : 0),
      render: (t) => <StatusBadge active={t.active} />,
    },
    {
      key: 'createdAt',
      header: 'Created',
      sortable: true,
      accessor: (t) => t.createdAt,
      render: (t) => <span className="text-slate-500">{formatDate(t.createdAt)}</span>,
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      widthClassName: 'w-28',
      render: (t) => (
        <div className="flex items-center justify-end gap-1">
          <IconButton
            icon={Power}
            label={t.active ? 'Deactivate' : 'Set as active'}
            variant={t.active ? 'default' : 'primary'}
            loading={togglingId === t.id}
            onClick={(e) => {
              e.stopPropagation();
              handleToggleActive(t);
            }}
          />
          <IconButton
            icon={Pencil}
            label="Edit"
            variant="primary"
            onClick={(e) => {
              e.stopPropagation();
              openEditModal(t);
            }}
          />
          <IconButton
            icon={Trash2}
            label="Delete"
            variant="danger"
            loading={deletingId === t.id}
            onClick={(e) => {
              e.stopPropagation();
              handleDelete(t.id);
            }}
          />
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <SetPageTitle title="Salary Template" />


      <ActiveTemplateCard template={activeTemplate} loading={loading} onEdit={openEditModal} />

      <div>
        <p className="mb-2 px-1 text-sm font-semibold text-slate-900">All templates</p>
        <DataTable
          columns={columns}
          data={templates}
          rowKey={(t) => t.id}
          loading={loading}
          emptyTitle="No salary templates yet"
          emptyDescription="Create a template to define the pay structure staff payslips are generated from."
        />
      </div>

      {formModalOpen && (
        <SalaryTemplateFormModal
          item={editingItem}
          onClose={() => {
            setFormModalOpen(false);
            setEditingItem(null);
          }}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
}

/** Hero panel for the one template currently in force, with its full component breakdown. */
function ActiveTemplateCard({
  template,
  loading,
  onEdit,
}: {
  template: SalaryTemplate | null;
  loading: boolean;
  onEdit: (item: SalaryTemplate) => void;
}) {
  if (loading) {
    return (
      <div className="card-premium p-5">
        <div className="skeleton h-4 w-40 rounded-md" />
        <div className="mt-4 grid gap-3 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="skeleton h-14 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  if (!template) {
    return (
      <div className="card-premium flex flex-wrap items-center gap-3 border-dashed p-5">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
          <Star size={18} />
        </span>
        <div>
          <p className="text-sm font-semibold text-slate-900">No active template</p>
          <p className="text-xs text-slate-500">
            Activate a template below — staff payslips default to whichever one is active.
          </p>
        </div>
      </div>
    );
  }

  const allowances = templateAllowances(template);
  const deductions = templateDeductions(template);

  return (
    <div className="card-premium animate-fade-in-up relative overflow-hidden p-5">
      <span className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-brand-500 via-brand-300 to-brand-500" />
      <span className="pointer-events-none absolute -top-16 -right-12 h-40 w-40 rounded-full bg-brand-400/10 blur-3xl" />

      <div className="relative flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-glow-brand">
            <Star size={18} />
          </span>
          <div>
            <p className="text-sm font-bold text-slate-900">Active template #{template.id}</p>
            <p className="text-xs text-slate-500">Last updated {formatDate(template.updatedAt)}</p>
          </div>
        </div>
        <Button variant="secondary" size="sm" icon={Pencil} onClick={() => onEdit(template)}>
          Edit
        </Button>
      </div>

      <div className="relative mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Metric label="Basic salary" value={formatMoney(template.basicSalary)} />
        <Metric label="Total allowances" value={formatMoney(allowances)} tone="positive" />
        <Metric label="Total deductions" value={formatMoney(deductions)} tone="negative" />
        <Metric label="Net salary" value={formatMoney(template.basicSalary + allowances - deductions)} tone="brand" />
      </div>

      <div className="relative mt-4 grid gap-4 border-t border-slate-100 pt-4 sm:grid-cols-2">
        <ComponentList
          title="Allowances"
          rows={[
            ['HRA', template.hra],
            ['Transport', template.transportAllowance],
            ['Medical', template.medicalAllowance],
            ['Other', template.otherAllowance],
          ]}
        />
        <ComponentList
          title="Deductions"
          rows={[
            ['Provident fund', template.pf],
            ['Professional tax', template.professionalTax],
            ['Other', template.otherDeduction],
          ]}
        />
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

function ComponentList({ title, rows }: { title: string; rows: [string, number][] }) {
  return (
    <div>
      <p className="mb-2 text-[11px] font-semibold tracking-wide text-slate-400 uppercase">{title}</p>
      <dl className="grid gap-1.5">
        {rows.map(([label, value]) => (
          <div key={label} className="flex items-center justify-between text-sm">
            <dt className="text-slate-500">{label}</dt>
            <dd className="font-medium text-slate-800 tabular-nums">{formatMoney(value)}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
