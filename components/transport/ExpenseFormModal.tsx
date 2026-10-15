'use client';

import { FormEvent, useState } from 'react';
import { Fuel } from 'lucide-react';
import { apiErrorMessage } from '@/lib/api';
import {
  createExpense,
  EXPENSE_TYPES,
  PAYMENT_MODES,
  updateExpense,
  type ExpenseType,
  type TransportPaymentMode,
  type Vehicle,
  type VehicleExpense,
  type VehicleExpensePayload,
} from '@/lib/transportService';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import { SelectField, TextField, TextareaField } from '@/components/ui/FormField';
import { enumLabel, FormError, FormSection, todayInput } from './transportUi';

function toForm(e: VehicleExpense | null): VehicleExpensePayload {
  return {
    vehicleId: e?.vehicleId ?? 0,
    expenseDate: e?.expenseDate ?? todayInput(),
    expenseType: e?.expenseType ?? 'FUEL',
    amount: e?.amount ?? 0,
    fuelLitres: e?.fuelLitres ?? null,
    odometerReading: e?.odometerReading ?? null,
    vendor: e?.vendor ?? '',
    billNumber: e?.billNumber ?? '',
    paymentMode: e?.paymentMode ?? 'CASH',
    remarks: e?.remarks ?? '',
  };
}

const numOrNull = (v: string) => (v === '' ? null : Number(v));

/** Log or edit one vehicle running cost — fuel fills also capture litres and odometer. */
export default function ExpenseFormModal({
  item,
  vehicles,
  onClose,
  onSaved,
}: {
  item: VehicleExpense | null;
  vehicles: Vehicle[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState<VehicleExpensePayload>(() => toForm(item));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const isEditing = !!item;
  const isFuel = form.expenseType === 'FUEL';

  const setField = <K extends keyof VehicleExpensePayload>(key: K, value: VehicleExpensePayload[K]) => setForm((f) => ({ ...f, [key]: value }));

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.vehicleId) return setError('Choose a vehicle.');
    if (!form.amount || form.amount <= 0) return setError('Amount must be greater than zero.');
    setSaving(true);
    setError('');
    const payload = { ...form, fuelLitres: isFuel ? form.fuelLitres : null };
    try {
      if (isEditing) await updateExpense(item!.id, payload);
      else await createExpense(payload);
      onSaved();
    } catch (err) {
      setError(apiErrorMessage(err, `Failed to ${isEditing ? 'update' : 'record'} expense.`));
    } finally {
      setSaving(false);
    }
  };

  const perLitre = isFuel && form.fuelLitres && form.amount ? form.amount / form.fuelLitres : null;

  return (
    <Modal
      icon={Fuel}
      accent="emerald"
      title={isEditing ? 'Edit expense' : 'Record expense'}
      subtitle="Fuel, servicing, repairs, renewals and other running costs."
      size="lg"
      onClose={onClose}
      footer={
        <>
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form="expense-form" loading={saving}>
            {isEditing ? 'Save changes' : 'Record expense'}
          </Button>
        </>
      }
    >
      <form id="expense-form" onSubmit={handleSubmit} className="grid gap-5">
        <FormSection title="Expense">
          <div className="grid gap-3.5 sm:grid-cols-2">
            <SelectField label="Vehicle" required value={form.vehicleId || ''} onChange={(e) => setField('vehicleId', Number(e.target.value))}>
              <option value="" disabled>
                {vehicles.length ? 'Select a vehicle' : 'No vehicles found'}
              </option>
              {vehicles.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.registrationNumber} — {enumLabel(v.vehicleType)}
                </option>
              ))}
            </SelectField>
            <SelectField label="Expense type" required value={form.expenseType} onChange={(e) => setField('expenseType', e.target.value as ExpenseType)}>
              {EXPENSE_TYPES.map((t) => (
                <option key={t} value={t}>
                  {enumLabel(t)}
                </option>
              ))}
            </SelectField>
            <TextField label="Date" type="date" required value={form.expenseDate} onChange={(e) => setField('expenseDate', e.target.value)} />
            <TextField
              label="Amount (₹)"
              type="number"
              min={0.01}
              step={0.01}
              required
              value={form.amount || ''}
              onChange={(e) => setField('amount', Number(e.target.value))}
            />
            {isFuel && (
              <TextField
                label="Fuel (litres)"
                type="number"
                min={0}
                step={0.01}
                hint={perLitre ? `≈ ₹${perLitre.toFixed(2)} per litre` : undefined}
                value={form.fuelLitres ?? ''}
                onChange={(e) => setField('fuelLitres', numOrNull(e.target.value))}
              />
            )}
            <TextField
              label="Odometer reading (km)"
              type="number"
              min={0}
              value={form.odometerReading ?? ''}
              onChange={(e) => setField('odometerReading', numOrNull(e.target.value))}
            />
          </div>
        </FormSection>

        <FormSection title="Billing">
          <div className="grid gap-3.5 sm:grid-cols-3">
            <TextField label="Vendor" placeholder="e.g. HP Petrol Pump" value={form.vendor} onChange={(e) => setField('vendor', e.target.value)} />
            <TextField label="Bill number" value={form.billNumber} onChange={(e) => setField('billNumber', e.target.value)} />
            <SelectField label="Payment mode" value={form.paymentMode} onChange={(e) => setField('paymentMode', e.target.value as TransportPaymentMode)}>
              {PAYMENT_MODES.map((m) => (
                <option key={m} value={m}>
                  {enumLabel(m)}
                </option>
              ))}
            </SelectField>
          </div>
          <TextareaField label="Remarks" rows={2} value={form.remarks} onChange={(e) => setField('remarks', e.target.value)} />
        </FormSection>

        <FormError message={error} />
      </form>
    </Modal>
  );
}
