'use client';

import { FormEvent, useEffect, useState } from 'react';
import { HardHat } from 'lucide-react';
import { apiErrorMessage } from '@/lib/api';
import {
  createTransportStaff,
  DRIVER_DESIGNATIONS,
  EMPLOYMENT_STATUSES,
  getTransportStaffMember,
  STAFF_DESIGNATIONS,
  updateTransportStaff,
  type EmploymentStatus,
  type StaffDesignation,
  type TransportStaff,
  type TransportStaffPayload,
  type Vehicle,
} from '@/lib/transportService';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import { SelectField, TextField, TextareaField } from '@/components/ui/FormField';
import { enumLabel, FormError, FormSection } from './transportUi';

function toForm(s: TransportStaff | null): TransportStaffPayload {
  return {
    name: s?.name ?? '',
    mobileNumber: s?.mobileNumber ?? '',
    address: s?.address ?? '',
    joiningDate: s?.joiningDate ?? '',
    designation: s?.designation ?? 'BUS_DRIVER',
    licenceNumber: s?.licenceNumber ?? '',
    licenceExpiry: s?.licenceExpiry ?? '',
    monthlySalary: s?.monthlySalary ?? 0,
    employmentStatus: s?.employmentStatus ?? 'ACTIVE',
    assignedVehicleId: s?.assignedVehicleId ?? null,
  };
}

/** Create/edit a transport crew member — drivers additionally carry licence details. */
export default function TransportStaffFormModal({
  item,
  vehicles,
  onClose,
  onSaved,
}: {
  item: TransportStaff | null;
  vehicles: Vehicle[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState<TransportStaffPayload>(() => toForm(item));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const isEditing = !!item;
  const isDriver = DRIVER_DESIGNATIONS.includes(form.designation);

  useEffect(() => {
    if (!item) return;
    getTransportStaffMember(item.id)
      .then((fresh) => fresh && setForm(toForm(fresh)))
      .catch(() => {});
  }, [item]);

  const setField = <K extends keyof TransportStaffPayload>(key: K, value: TransportStaffPayload[K]) => setForm((f) => ({ ...f, [key]: value }));

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return setError('Name is required.');
    if (!/^\d{10}$/.test(form.mobileNumber.trim())) return setError('Enter a valid 10-digit mobile number.');
    if (isDriver && (!form.licenceNumber.trim() || !form.licenceExpiry)) return setError('Drivers need a licence number and expiry date.');

    setSaving(true);
    setError('');
    const payload: TransportStaffPayload = {
      ...form,
      name: form.name.trim(),
      mobileNumber: form.mobileNumber.trim(),
      joiningDate: form.joiningDate || null,
      licenceExpiry: form.licenceExpiry || null,
    };
    try {
      if (isEditing) await updateTransportStaff(item!.id, payload);
      else await createTransportStaff(payload);
      onSaved();
    } catch (err) {
      setError(apiErrorMessage(err, `Failed to ${isEditing ? 'update' : 'add'} staff member.`));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      icon={HardHat}
      title={isEditing ? `Edit ${item!.name}` : 'Add transport staff'}
      subtitle="Drivers, conductors, helpers and the transport in-charge."
      size="lg"
      onClose={onClose}
      footer={
        <>
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form="transport-staff-form" loading={saving}>
            {isEditing ? 'Save changes' : 'Add staff'}
          </Button>
        </>
      }
    >
      <form id="transport-staff-form" onSubmit={handleSubmit} className="grid gap-5">
        <FormSection title="Personal">
          <div className="grid gap-3.5 sm:grid-cols-2">
            <TextField label="Full name" required value={form.name} onChange={(e) => setField('name', e.target.value)} />
            <TextField
              label="Mobile number"
              required
              inputMode="numeric"
              maxLength={10}
              placeholder="10-digit mobile"
              value={form.mobileNumber}
              onChange={(e) => setField('mobileNumber', e.target.value.replace(/\D/g, ''))}
            />
          </div>
          <TextareaField label="Address" rows={2} value={form.address} onChange={(e) => setField('address', e.target.value)} />
        </FormSection>

        <FormSection title="Employment">
          <div className="grid gap-3.5 sm:grid-cols-2">
            <SelectField label="Designation" required value={form.designation} onChange={(e) => setField('designation', e.target.value as StaffDesignation)}>
              {STAFF_DESIGNATIONS.map((d) => (
                <option key={d} value={d}>
                  {enumLabel(d)}
                </option>
              ))}
            </SelectField>
            <SelectField
              label="Employment status"
              required
              value={form.employmentStatus}
              onChange={(e) => setField('employmentStatus', e.target.value as EmploymentStatus)}
            >
              {EMPLOYMENT_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {enumLabel(s)}
                </option>
              ))}
            </SelectField>
            <TextField label="Joining date" type="date" value={form.joiningDate ?? ''} onChange={(e) => setField('joiningDate', e.target.value)} />
            <TextField
              label="Monthly salary (₹)"
              type="number"
              min={0}
              step={0.01}
              value={form.monthlySalary || ''}
              onChange={(e) => setField('monthlySalary', Number(e.target.value))}
            />
            <SelectField
              label="Assigned vehicle"
              wrapperClassName="sm:col-span-2"
              value={form.assignedVehicleId ?? ''}
              onChange={(e) => setField('assignedVehicleId', e.target.value ? Number(e.target.value) : null)}
            >
              <option value="">Not assigned</option>
              {vehicles.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.registrationNumber} — {enumLabel(v.vehicleType)}
                  {v.model ? ` (${v.model})` : ''}
                </option>
              ))}
            </SelectField>
          </div>
        </FormSection>

        <FormSection title={isDriver ? 'Driving licence (required)' : 'Driving licence (optional)'}>
          <div className="grid gap-3.5 sm:grid-cols-2">
            <TextField
              label="Licence number"
              required={isDriver}
              value={form.licenceNumber}
              onChange={(e) => setField('licenceNumber', e.target.value.toUpperCase())}
            />
            <TextField
              label="Licence expiry"
              type="date"
              required={isDriver}
              value={form.licenceExpiry ?? ''}
              onChange={(e) => setField('licenceExpiry', e.target.value)}
            />
          </div>
        </FormSection>

        <FormError message={error} />
      </form>
    </Modal>
  );
}
