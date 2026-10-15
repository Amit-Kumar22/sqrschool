'use client';

import { FormEvent, useEffect, useState } from 'react';
import { Bus } from 'lucide-react';
import { apiErrorMessage } from '@/lib/api';
import {
  createVehicle,
  getVehicle,
  updateVehicle,
  VEHICLE_TYPES,
  type Vehicle,
  type VehiclePayload,
  type VehicleType,
} from '@/lib/transportService';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import { SelectField, TextField, TextareaField } from '@/components/ui/FormField';
import { enumLabel, FormError, FormSection } from './transportUi';

function toForm(v: Vehicle | null): VehiclePayload {
  return {
    registrationNumber: v?.registrationNumber ?? '',
    vehicleType: v?.vehicleType ?? 'BUS',
    model: v?.model ?? '',
    seatingCapacity: v?.seatingCapacity ?? 0,
    insuranceExpiry: v?.insuranceExpiry ?? '',
    fitnessExpiry: v?.fitnessExpiry ?? '',
    permitExpiry: v?.permitExpiry ?? '',
    pucExpiry: v?.pucExpiry ?? '',
    remarks: v?.remarks ?? '',
  };
}

const DOC_FIELDS: { key: 'insuranceExpiry' | 'fitnessExpiry' | 'permitExpiry' | 'pucExpiry'; label: string }[] = [
  { key: 'insuranceExpiry', label: 'Insurance expiry' },
  { key: 'fitnessExpiry', label: 'Fitness certificate expiry' },
  { key: 'permitExpiry', label: 'Permit expiry' },
  { key: 'pucExpiry', label: 'PUC expiry' },
];

/** Create/edit a fleet vehicle along with the expiry dates of its four statutory documents. */
export default function VehicleFormModal({
  item,
  onClose,
  onSaved,
}: {
  item: Vehicle | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState<VehiclePayload>(() => toForm(item));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const isEditing = !!item;

  // The list row can be stale (another user may have edited it) — pull the
  // latest record when editing so the form never overwrites newer data.
  useEffect(() => {
    if (!item) return;
    getVehicle(item.id)
      .then((fresh) => fresh && setForm(toForm(fresh)))
      .catch(() => {});
  }, [item]);

  const setField = <K extends keyof VehiclePayload>(key: K, value: VehiclePayload[K]) => setForm((f) => ({ ...f, [key]: value }));

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.registrationNumber.trim()) return setError('Registration number is required.');
    if (!form.seatingCapacity || form.seatingCapacity < 1) return setError('Seating capacity must be at least 1.');

    setSaving(true);
    setError('');
    const payload: VehiclePayload = {
      ...form,
      registrationNumber: form.registrationNumber.trim().toUpperCase(),
      insuranceExpiry: form.insuranceExpiry || null,
      fitnessExpiry: form.fitnessExpiry || null,
      permitExpiry: form.permitExpiry || null,
      pucExpiry: form.pucExpiry || null,
    };
    try {
      if (isEditing) await updateVehicle(item!.id, payload);
      else await createVehicle(payload);
      onSaved();
    } catch (err) {
      setError(apiErrorMessage(err, `Failed to ${isEditing ? 'update' : 'add'} vehicle.`));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      icon={Bus}
      title={isEditing ? `Edit ${item!.registrationNumber}` : 'Add vehicle'}
      subtitle="Fleet details and statutory document validity."
      size="lg"
      onClose={onClose}
      footer={
        <>
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form="vehicle-form" loading={saving}>
            {isEditing ? 'Save changes' : 'Add vehicle'}
          </Button>
        </>
      }
    >
      <form id="vehicle-form" onSubmit={handleSubmit} className="grid gap-5">
        <FormSection title="Vehicle">
          <div className="grid gap-3.5 sm:grid-cols-2">
            <TextField
              label="Registration number"
              required
              placeholder="e.g. MH12AB1234"
              value={form.registrationNumber}
              onChange={(e) => setField('registrationNumber', e.target.value)}
            />
            <SelectField label="Vehicle type" required value={form.vehicleType} onChange={(e) => setField('vehicleType', e.target.value as VehicleType)}>
              {VEHICLE_TYPES.map((t) => (
                <option key={t} value={t}>
                  {enumLabel(t)}
                </option>
              ))}
            </SelectField>
            <TextField label="Make / model" placeholder="e.g. Tata Starbus 40" value={form.model} onChange={(e) => setField('model', e.target.value)} />
            <TextField
              label="Seating capacity"
              type="number"
              min={1}
              required
              value={form.seatingCapacity || ''}
              onChange={(e) => setField('seatingCapacity', Number(e.target.value))}
            />
          </div>
        </FormSection>

        <FormSection title="Document validity">
          <div className="grid gap-3.5 sm:grid-cols-2">
            {DOC_FIELDS.map(({ key, label }) => (
              <TextField key={key} label={label} type="date" value={form[key] ?? ''} onChange={(e) => setField(key, e.target.value)} />
            ))}
          </div>
        </FormSection>

        <TextareaField label="Remarks" rows={2} placeholder="Optional notes" value={form.remarks} onChange={(e) => setField('remarks', e.target.value)} />

        <FormError message={error} />
      </form>
    </Modal>
  );
}
