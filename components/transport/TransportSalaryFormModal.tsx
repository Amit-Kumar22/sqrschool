'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { Wallet } from 'lucide-react';
import { apiErrorMessage } from '@/lib/api';
import {
  computeNetPayable,
  generateTransportSalary,
  getTransportSalary,
  PAYMENT_MODES,
  SALARY_STATUSES,
  updateTransportSalary,
  type TransportPaymentMode,
  type TransportSalary,
  type TransportSalaryPayload,
  type TransportSalaryStatus,
  type TransportStaff,
} from '@/lib/transportService';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import { SelectField, TextField, TextareaField } from '@/components/ui/FormField';
import { enumLabel, formatMoney, FormError, FormSection, monthInputToDate, monthStartInput } from './transportUi';

export function salaryToPayload(s: TransportSalary): TransportSalaryPayload {
  return {
    staffId: s.staffId,
    salaryMonth: s.salaryMonth,
    basicSalary: s.basicSalary,
    allowances: s.allowances,
    overtimeAmount: s.overtimeAmount,
    bonus: s.bonus,
    deductions: s.deductions,
    salaryAdvance: s.salaryAdvance,
    status: s.status,
    paymentDate: s.paymentDate,
    paymentMode: s.paymentMode,
    transactionReference: s.transactionReference ?? '',
    remarks: s.remarks ?? '',
  };
}

const EMPTY: TransportSalaryPayload = {
  staffId: 0,
  salaryMonth: monthStartInput(),
  basicSalary: 0,
  allowances: 0,
  overtimeAmount: 0,
  bonus: 0,
  deductions: 0,
  salaryAdvance: 0,
  status: 'GENERATED',
  paymentDate: null,
  paymentMode: null,
  transactionReference: '',
  remarks: '',
};

const EARNINGS = [
  { key: 'basicSalary', label: 'Basic salary', required: true },
  { key: 'allowances', label: 'Allowances' },
  { key: 'overtimeAmount', label: 'Overtime' },
  { key: 'bonus', label: 'Bonus' },
] as const;

const DEDUCTIONS = [
  { key: 'deductions', label: 'Deductions' },
  { key: 'salaryAdvance', label: 'Salary advance recovered' },
] as const;

/** Generate (or edit) one crew member's monthly salary — basic pay defaults from their profile. */
export default function TransportSalaryFormModal({
  item,
  staff,
  onClose,
  onSaved,
}: {
  item: TransportSalary | null;
  staff: TransportStaff[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState<TransportSalaryPayload>(() => (item ? salaryToPayload(item) : EMPTY));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const isEditing = !!item;

  useEffect(() => {
    if (!item) return;
    getTransportSalary(item.id)
      .then((fresh) => fresh && setForm(salaryToPayload(fresh)))
      .catch(() => {});
  }, [item]);

  const setField = <K extends keyof TransportSalaryPayload>(key: K, value: TransportSalaryPayload[K]) => setForm((f) => ({ ...f, [key]: value }));
  const net = useMemo(() => computeNetPayable(form), [form]);
  const selected = staff.find((s) => s.id === form.staffId);

  const pickStaff = (id: number) =>
    setForm((f) => {
      const member = staff.find((s) => s.id === id);
      return { ...f, staffId: id, basicSalary: f.basicSalary || member?.monthlySalary || 0 };
    });

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.staffId) return setError('Choose a staff member.');
    if (!form.salaryMonth) return setError('Choose the salary month.');
    if (!form.basicSalary || form.basicSalary <= 0) return setError('Basic salary must be greater than zero.');
    if (net < 0) return setError('Deductions exceed earnings — net payable cannot be negative.');
    setSaving(true);
    setError('');
    const payload = { ...form, paymentDate: form.paymentDate || null };
    try {
      if (isEditing) await updateTransportSalary(item!.id, payload);
      else await generateTransportSalary(payload);
      onSaved();
    } catch (err) {
      setError(apiErrorMessage(err, `Failed to ${isEditing ? 'update' : 'generate'} salary.`));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      icon={Wallet}
      title={isEditing ? `Edit salary — ${item!.staffName}` : 'Generate salary'}
      subtitle="Monthly pay for transport crew."
      size="lg"
      onClose={onClose}
      footer={
        <>
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form="transport-salary-form" loading={saving}>
            {isEditing ? 'Save changes' : 'Generate'}
          </Button>
        </>
      }
    >
      <form id="transport-salary-form" onSubmit={handleSubmit} className="grid gap-5">
        <div className="grid gap-3.5 sm:grid-cols-3">
          <SelectField
            label="Staff member"
            required
            wrapperClassName="sm:col-span-2"
            disabled={isEditing}
            hint={selected ? `${enumLabel(selected.designation)} · profile salary ${formatMoney(selected.monthlySalary)}` : undefined}
            value={form.staffId || ''}
            onChange={(e) => pickStaff(Number(e.target.value))}
          >
            <option value="" disabled>
              {staff.length ? 'Select staff' : 'No active staff'}
            </option>
            {staff.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} — {enumLabel(s.designation)}
              </option>
            ))}
          </SelectField>
          <TextField
            label="Salary month"
            type="month"
            required
            value={form.salaryMonth.slice(0, 7)}
            onChange={(e) => setField('salaryMonth', monthInputToDate(e.target.value))}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <FormSection title="Earnings">
            {EARNINGS.map(({ key, label, ...rest }) => (
              <TextField
                key={key}
                label={`${label} (₹)`}
                type="number"
                min={0}
                step={0.01}
                required={'required' in rest}
                value={form[key] || ''}
                placeholder="0"
                onChange={(e) => setField(key, Number(e.target.value))}
              />
            ))}
          </FormSection>
          <FormSection title="Deductions">
            {DEDUCTIONS.map(({ key, label }) => (
              <TextField
                key={key}
                label={`${label} (₹)`}
                type="number"
                min={0}
                step={0.01}
                value={form[key] || ''}
                placeholder="0"
                onChange={(e) => setField(key, Number(e.target.value))}
              />
            ))}
            <div className="mt-auto rounded-xl border border-brand-200 bg-brand-50/50 p-4">
              <p className="text-xs text-slate-500">Net payable</p>
              <p className={`text-2xl font-bold tracking-tight tabular-nums ${net < 0 ? 'text-red-600' : 'text-brand-700'}`}>{formatMoney(net)}</p>
              <p className="mt-1 text-[11px] text-slate-400">Final figure is calculated by the server on save.</p>
            </div>
          </FormSection>
        </div>

        <FormSection title="Status & payment">
          <div className="grid gap-3.5 sm:grid-cols-2">
            <SelectField label="Status" value={form.status} onChange={(e) => setField('status', e.target.value as TransportSalaryStatus)}>
              {SALARY_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {enumLabel(s)}
                </option>
              ))}
            </SelectField>
            <TextField label="Payment date" type="date" value={form.paymentDate ?? ''} onChange={(e) => setField('paymentDate', e.target.value || null)} />
            <SelectField
              label="Payment mode"
              value={form.paymentMode ?? ''}
              onChange={(e) => setField('paymentMode', (e.target.value || null) as TransportPaymentMode | null)}
            >
              <option value="">—</option>
              {PAYMENT_MODES.map((m) => (
                <option key={m} value={m}>
                  {enumLabel(m)}
                </option>
              ))}
            </SelectField>
            <TextField label="Transaction reference" value={form.transactionReference} onChange={(e) => setField('transactionReference', e.target.value)} />
          </div>
          <TextareaField label="Remarks" rows={2} value={form.remarks} onChange={(e) => setField('remarks', e.target.value)} />
        </FormSection>

        <FormError message={error} />
      </form>
    </Modal>
  );
}
