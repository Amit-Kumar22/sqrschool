'use client';

import { FormEvent, useState } from 'react';
import { HandCoins } from 'lucide-react';
import { apiErrorMessage } from '@/lib/api';
import { PAYMENT_MODES, payTransportSalary, type TransportPaymentMode, type TransportSalary } from '@/lib/transportService';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import { SelectField, TextField, TextareaField } from '@/components/ui/FormField';
import { salaryToPayload } from './TransportSalaryFormModal';
import { enumLabel, formatMoney, formatMonth, FormError, todayInput } from './transportUi';

/** Records payment of a salary — date, mode and reference — and marks it PAID. */
export default function PaySalaryModal({ salary, onClose, onSaved }: { salary: TransportSalary; onClose: () => void; onSaved: () => void }) {
  const [paymentDate, setPaymentDate] = useState(todayInput());
  const [paymentMode, setPaymentMode] = useState<TransportPaymentMode>(salary.paymentMode ?? 'CASH');
  const [reference, setReference] = useState(salary.transactionReference ?? '');
  const [remarks, setRemarks] = useState(salary.remarks ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (paymentMode !== 'CASH' && !reference.trim()) return setError('Add the transaction reference for non-cash payments.');
    setSaving(true);
    setError('');
    try {
      await payTransportSalary(salary.id, {
        ...salaryToPayload(salary),
        status: 'PAID',
        paymentDate,
        paymentMode,
        transactionReference: reference.trim(),
        remarks,
      });
      onSaved();
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not record the payment.'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      icon={HandCoins}
      accent="emerald"
      title="Pay salary"
      subtitle={`${salary.staffName} · ${formatMonth(salary.salaryMonth)}`}
      onClose={onClose}
      footer={
        <>
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form="pay-salary-form" loading={saving}>
            Confirm payment
          </Button>
        </>
      }
    >
      <form id="pay-salary-form" onSubmit={handleSubmit} className="grid gap-4">
        <div className="flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50/60 px-4 py-3">
          <span className="text-sm text-emerald-800">Net payable</span>
          <span className="text-2xl font-bold tracking-tight text-emerald-700 tabular-nums">{formatMoney(salary.netPayable)}</span>
        </div>
        <div className="grid gap-3.5 sm:grid-cols-2">
          <TextField label="Payment date" type="date" required value={paymentDate} onChange={(e) => setPaymentDate(e.target.value)} />
          <SelectField label="Payment mode" required value={paymentMode} onChange={(e) => setPaymentMode(e.target.value as TransportPaymentMode)}>
            {PAYMENT_MODES.map((m) => (
              <option key={m} value={m}>
                {enumLabel(m)}
              </option>
            ))}
          </SelectField>
        </div>
        <TextField
          label="Transaction reference"
          required={paymentMode !== 'CASH'}
          placeholder="UTR / cheque no."
          value={reference}
          onChange={(e) => setReference(e.target.value)}
        />
        <TextareaField label="Remarks" rows={2} value={remarks} onChange={(e) => setRemarks(e.target.value)} />
        <FormError message={error} />
      </form>
    </Modal>
  );
}
