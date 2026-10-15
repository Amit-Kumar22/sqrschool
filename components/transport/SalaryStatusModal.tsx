'use client';

import { FormEvent, useState } from 'react';
import { ListChecks } from 'lucide-react';
import { apiErrorMessage } from '@/lib/api';
import { SALARY_STATUSES, updateTransportSalaryStatus, type TransportSalary, type TransportSalaryStatus } from '@/lib/transportService';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import { EnumBadge, enumLabel, formatMonth, FormError } from './transportUi';

/** Moves a salary along DRAFT → GENERATED → PENDING → APPROVED → PAID (or CANCELLED). */
export default function SalaryStatusModal({ salary, onClose, onSaved }: { salary: TransportSalary; onClose: () => void; onSaved: () => void }) {
  const [status, setStatus] = useState<TransportSalaryStatus>(salary.status);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (status === salary.status) return onClose();
    setSaving(true);
    setError('');
    try {
      await updateTransportSalaryStatus(salary.id, status);
      onSaved();
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not change the status.'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      icon={ListChecks}
      title="Change status"
      subtitle={`${salary.staffName} · ${formatMonth(salary.salaryMonth)}`}
      size="sm"
      onClose={onClose}
      footer={
        <>
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form="salary-status-form" loading={saving}>
            Update
          </Button>
        </>
      }
    >
      <form id="salary-status-form" onSubmit={handleSubmit} className="grid gap-2">
        {SALARY_STATUSES.map((s) => (
          <label
            key={s}
            className={`flex cursor-pointer items-center justify-between rounded-xl border px-3.5 py-2.5 transition-colors ${
              status === s ? 'border-brand-400 bg-brand-50/60 ring-2 ring-brand-500/15' : 'border-slate-200 hover:border-slate-300'
            }`}
          >
            <span className="flex items-center gap-2.5">
              <input type="radio" name="status" value={s} checked={status === s} onChange={() => setStatus(s)} className="text-brand-600 focus:ring-brand-500/30" />
              <span className="text-sm font-medium text-slate-800">{enumLabel(s)}</span>
            </span>
            {s === salary.status && <EnumBadge value={s} />}
          </label>
        ))}
        <FormError message={error} />
      </form>
    </Modal>
  );
}
