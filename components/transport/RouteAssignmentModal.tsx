'use client';

import { FormEvent, useState } from 'react';
import { UserCog } from 'lucide-react';
import { apiErrorMessage } from '@/lib/api';
import { assignRouteVehicleDriver, type TransportRoute, type TransportStaff, type Vehicle } from '@/lib/transportService';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import { SelectField } from '@/components/ui/FormField';
import { enumLabel, FormError } from './transportUi';

/** Quick swap of a route's vehicle and/or driver without opening the full route form. */
export default function RouteAssignmentModal({
  route,
  vehicles,
  drivers,
  onClose,
  onSaved,
}: {
  route: TransportRoute;
  vehicles: Vehicle[];
  drivers: TransportStaff[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [vehicleId, setVehicleId] = useState<number | ''>(route.vehicleId ?? '');
  const [driverId, setDriverId] = useState<number | ''>(route.driverId ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const selectedVehicle = vehicles.find((v) => v.id === vehicleId);
  const overCapacity = selectedVehicle && route.assignedStudentCount > selectedVehicle.seatingCapacity;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!vehicleId && !driverId) return setError('Pick a vehicle, a driver, or both.');
    setSaving(true);
    setError('');
    try {
      await assignRouteVehicleDriver(route.id, { vehicleId: vehicleId || undefined, driverId: driverId || undefined });
      onSaved();
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not update the route assignment.'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      icon={UserCog}
      title="Vehicle & driver"
      subtitle={route.routeName}
      size="sm"
      onClose={onClose}
      footer={
        <>
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form="route-assign-form" loading={saving}>
            Save
          </Button>
        </>
      }
    >
      <form id="route-assign-form" onSubmit={handleSubmit} className="grid gap-4">
        <SelectField label="Vehicle" value={vehicleId} onChange={(e) => setVehicleId(e.target.value ? Number(e.target.value) : '')}>
          <option value="">Keep current / none</option>
          {vehicles.map((v) => (
            <option key={v.id} value={v.id}>
              {v.registrationNumber} — {enumLabel(v.vehicleType)} · {v.seatingCapacity} seats
            </option>
          ))}
        </SelectField>
        {overCapacity && (
          <p className="-mt-2 text-xs text-amber-700">
            {route.assignedStudentCount} students are on this route but the vehicle seats {selectedVehicle!.seatingCapacity}.
          </p>
        )}
        <SelectField label="Driver" value={driverId} onChange={(e) => setDriverId(e.target.value ? Number(e.target.value) : '')}>
          <option value="">Keep current / none</option>
          {drivers.map((d) => (
            <option key={d.id} value={d.id} disabled={d.licenceExpired}>
              {d.name} — {enumLabel(d.designation)}
              {d.licenceExpired ? ' (licence expired)' : ''}
            </option>
          ))}
        </SelectField>
        <FormError message={error} />
      </form>
    </Modal>
  );
}
