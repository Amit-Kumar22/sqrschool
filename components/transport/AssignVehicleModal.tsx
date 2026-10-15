'use client';

import { FormEvent, useState } from 'react';
import { AlertTriangle, Bus } from 'lucide-react';
import { apiErrorMessage } from '@/lib/api';
import { assignStaffVehicle, type TransportStaff, type Vehicle } from '@/lib/transportService';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import { SelectField } from '@/components/ui/FormField';
import { enumLabel, FormError } from './transportUi';

/** Puts one crew member on a vehicle. The backend refuses drivers with an expired licence. */
export default function AssignVehicleModal({
  staff,
  vehicles,
  onClose,
  onSaved,
}: {
  staff: TransportStaff;
  vehicles: Vehicle[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [vehicleId, setVehicleId] = useState<number | ''>(staff.assignedVehicleId ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!vehicleId) return setError('Choose a vehicle.');
    setSaving(true);
    setError('');
    try {
      await assignStaffVehicle(staff.id, vehicleId);
      onSaved();
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not assign the vehicle.'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      icon={Bus}
      title="Assign vehicle"
      subtitle={`${staff.name} · ${enumLabel(staff.designation)}`}
      size="sm"
      onClose={onClose}
      footer={
        <>
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form="assign-vehicle-form" loading={saving} disabled={staff.licenceExpired}>
            Assign
          </Button>
        </>
      }
    >
      <form id="assign-vehicle-form" onSubmit={handleSubmit} className="grid gap-4">
        {staff.licenceExpired && (
          <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
            <AlertTriangle size={14} className="mt-0.5 shrink-0" />
            This driver&apos;s licence has expired. Renew it on their profile before assigning a vehicle.
          </div>
        )}
        <SelectField label="Vehicle" required value={vehicleId} onChange={(e) => setVehicleId(e.target.value ? Number(e.target.value) : '')}>
          <option value="" disabled>
            {vehicles.length ? 'Select a vehicle' : 'No active vehicles'}
          </option>
          {vehicles.map((v) => (
            <option key={v.id} value={v.id}>
              {v.registrationNumber} — {enumLabel(v.vehicleType)} · {v.seatingCapacity} seats
            </option>
          ))}
        </SelectField>
        <FormError message={error} />
      </form>
    </Modal>
  );
}
