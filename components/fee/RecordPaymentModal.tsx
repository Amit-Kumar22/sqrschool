'use client';

import { FormEvent, useState } from 'react';
import { CircleDollarSign } from 'lucide-react';
import { recordFeePayment, type PaymentMode, type StudentFee } from '@/lib/feeService';
import { apiErrorMessage } from '@/lib/api';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import { SelectField, TextareaField, TextField } from '@/components/ui/FormField';

const PAYMENT_MODE_OPTIONS: PaymentMode[] = ['CASH', 'CARD', 'UPI', 'NET_BANKING', 'CHEQUE'];

const formatEnumLabel = (value: string) =>
  value
    .toLowerCase()
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

export default function RecordPaymentModal({
  fee,
  onClose,
  onSaved,
}: {
  fee: StudentFee;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [amount, setAmount] = useState(fee.dueAmount || fee.amount);
  const [paymentMode, setPaymentMode] = useState<PaymentMode>('CASH');
  const [transactionId, setTransactionId] = useState('');
  const [remark, setRemark] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!amount || amount <= 0) {
      setError('Amount must be greater than zero.');
      return;
    }

    setSaving(true);
    setError('');
    try {
      await recordFeePayment(fee.id, { amount, paymentMode, transactionId, remark });
      onSaved();
    } catch (err) {
      setError(apiErrorMessage(err, 'Failed to record this payment.'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      icon={CircleDollarSign}
      title="Collect payment"
      subtitle={`${fee.studentName} · ${formatEnumLabel(fee.feeType)} · Due ₹${fee.dueAmount.toLocaleString('en-IN')}`}
      accent="emerald"
      size="sm"
      onClose={onClose}
      footer={
        <>
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form="record-payment-form" loading={saving}>
            Record payment
          </Button>
        </>
      }
    >
      <form id="record-payment-form" onSubmit={handleSubmit} className="grid gap-3.5">
        <div className="grid grid-cols-2 gap-3.5">
          <TextField
            label="Amount"
            type="number"
            min={0.01}
            step={0.01}
            required
            value={amount || ''}
            onChange={(e) => setAmount(Number(e.target.value))}
          />
          <SelectField label="Payment mode" required value={paymentMode} onChange={(e) => setPaymentMode(e.target.value as PaymentMode)}>
            {PAYMENT_MODE_OPTIONS.map((mode) => (
              <option key={mode} value={mode}>
                {formatEnumLabel(mode)}
              </option>
            ))}
          </SelectField>
        </div>

        <TextField
          label="Transaction ID"
          hint="Optional — leave blank for cash."
          value={transactionId}
          onChange={(e) => setTransactionId(e.target.value)}
        />

        <TextareaField
          label="Remark"
          hint="Optional note for this payment."
          rows={2}
          value={remark}
          onChange={(e) => setRemark(e.target.value)}
        />

        {error && <div className="animate-fade-in-up rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">{error}</div>}
      </form>
    </Modal>
  );
}
