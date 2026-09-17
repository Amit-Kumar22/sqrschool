'use client';

import { FormEvent, useMemo, useState } from 'react';
import { ReceiptIndianRupee } from 'lucide-react';
import { apiErrorMessage } from '@/lib/api';
import {
  createSalaryTemplate,
  templateAllowances,
  templateDeductions,
  updateSalaryTemplate,
  type SalaryTemplate,
  type SalaryTemplatePayload,
} from '@/lib/salaryTemplateService';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import { CheckboxField, TextField } from '@/components/ui/FormField';
import { formatMoney } from './salaryUtils';

type MoneyKey = Exclude<keyof SalaryTemplatePayload, 'active'>;

const ALLOWANCE_FIELDS: { key: MoneyKey; label: string }[] = [
  { key: 'hra', label: 'HRA' },
  { key: 'transportAllowance', label: 'Transport' },
  { key: 'medicalAllowance', label: 'Medical' },
  { key: 'otherAllowance', label: 'Other allowance' },
];

const DEDUCTION_FIELDS: { key: MoneyKey; label: string }[] = [
  { key: 'pf', label: 'Provident fund' },
  { key: 'professionalTax', label: 'Professional tax' },
  { key: 'otherDeduction', label: 'Other deduction' },
];

function toFormState(item: SalaryTemplate | null): SalaryTemplatePayload {
  return {
    basicSalary: item?.basicSalary ?? 0,
    hra: item?.hra ?? 0,
    transportAllowance: item?.transportAllowance ?? 0,
    medicalAllowance: item?.medicalAllowance ?? 0,
    otherAllowance: item?.otherAllowance ?? 0,
    pf: item?.pf ?? 0,
    professionalTax: item?.professionalTax ?? 0,
    otherDeduction: item?.otherDeduction ?? 0,
    active: item?.active ?? true,
  };
}

/** Create/edit form for a global salary template, with a live gross/net preview of the entered components. */
export default function SalaryTemplateFormModal({
  item,
  onClose,
  onSaved,
}: {
  item: SalaryTemplate | null;
  onClose: () => void;
  onSaved: (item: SalaryTemplate) => void;
}) {
  const [form, setForm] = useState<SalaryTemplatePayload>(() => toFormState(item));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const isEditing = !!item;
  const setField = <K extends keyof SalaryTemplatePayload>(key: K, value: SalaryTemplatePayload[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const totals = useMemo(() => {
    const allowances = templateAllowances(form);
    const deductions = templateDeductions(form);
    const gross = (form.basicSalary || 0) + allowances;
    return { allowances, deductions, gross, net: gross - deductions };
  }, [form]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.basicSalary || form.basicSalary <= 0) {
      setError('Basic salary must be greater than zero.');
      return;
    }
    if (totals.net < 0) {
      setError('Deductions exceed gross salary — net pay would be negative.');
      return;
    }

    setSaving(true);
    setError('');
    try {
      const saved = isEditing ? await updateSalaryTemplate(item!.id, form) : await createSalaryTemplate(form);
      onSaved(saved);
    } catch (err) {
      setError(apiErrorMessage(err, `Failed to ${isEditing ? 'update' : 'create'} salary template.`));
    } finally {
      setSaving(false);
    }
  };

  const moneyField = ({ key, label }: { key: MoneyKey; label: string }) => (
    <TextField
      key={key}
      label={label}
      type="number"
      min={0}
      step={0.01}
      value={form[key] || ''}
      placeholder="0"
      onChange={(e) => setField(key, Number(e.target.value))}
    />
  );

  return (
    <Modal
      icon={ReceiptIndianRupee}
      title={isEditing ? `Edit template #${item!.id}` : 'New salary template'}
      subtitle="Components below apply to every payslip generated from this template."
      size="lg"
      onClose={onClose}
      footer={
        <>
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form="salary-template-form" loading={saving}>
            {isEditing ? 'Save changes' : 'Create template'}
          </Button>
        </>
      }
    >
      <form id="salary-template-form" onSubmit={handleSubmit} className="grid gap-4">
        <section className="grid gap-3">
          <SectionTitle label="Earnings" hint="Basic pay plus every allowance component." />
          <div className="grid gap-3.5 sm:grid-cols-2">
            <TextField
              label="Basic salary"
              type="number"
              min={0.01}
              step={0.01}
              required
              value={form.basicSalary || ''}
              placeholder="0"
              onChange={(e) => setField('basicSalary', Number(e.target.value))}
            />
            {ALLOWANCE_FIELDS.map(moneyField)}
          </div>
        </section>

        <section className="grid gap-3">
          <SectionTitle label="Deductions" hint="Subtracted from gross pay to arrive at net pay." />
          <div className="grid gap-3.5 sm:grid-cols-3">{DEDUCTION_FIELDS.map(moneyField)}</div>
        </section>

        <div className="grid gap-2 rounded-xl border border-slate-200 bg-slate-50/70 p-3.5">
          <SummaryRow label="Basic salary" value={formatMoney(form.basicSalary)} />
          <SummaryRow label="Total allowances" value={`+ ${formatMoney(totals.allowances)}`} tone="positive" />
          <SummaryRow label="Total deductions" value={`− ${formatMoney(totals.deductions)}`} tone="negative" />
          <div className="mt-1 flex items-center justify-between border-t border-slate-200 pt-2.5">
            <div>
              <p className="text-xs text-slate-500">Gross {formatMoney(totals.gross)}</p>
              <p className="text-sm font-semibold text-slate-900">Net salary</p>
            </div>
            <p className="text-lg font-bold tracking-tight text-brand-700">{formatMoney(totals.net)}</p>
          </div>
        </div>

        <CheckboxField
          label="Set as the active template"
          hint="The active template is the one new payslips are generated from."
          checked={form.active}
          onChange={(e) => setField('active', e.target.checked)}
        />

        {error && (
          <div className="animate-fade-in-up rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
            {error}
          </div>
        )}
      </form>
    </Modal>
  );
}

function SectionTitle({ label, hint }: { label: string; hint: string }) {
  return (
    <div className="flex flex-wrap items-baseline gap-2 border-b border-slate-100 pb-1.5">
      <h3 className="text-sm font-semibold text-slate-900">{label}</h3>
      <p className="text-xs text-slate-400">{hint}</p>
    </div>
  );
}

function SummaryRow({ label, value, tone }: { label: string; value: string; tone?: 'positive' | 'negative' }) {
  const toneClass = tone === 'positive' ? 'text-emerald-600' : tone === 'negative' ? 'text-red-600' : 'text-slate-700';
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-slate-500">{label}</span>
      <span className={`font-semibold tabular-nums ${toneClass}`}>{value}</span>
    </div>
  );
}
