'use client';

import { FormEvent, useState } from 'react';
import { UserPlus } from 'lucide-react';
import { apiErrorMessage } from '@/lib/api';
import {
  assignStudentToRoute,
  formatTime,
  updateStudentRouteAssignment,
  type StudentRouteAssignment,
  type TransportRoute,
} from '@/lib/transportService';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import { SelectField, TextField } from '@/components/ui/FormField';
import TransportStudentPicker from './TransportStudentPicker';
import { FormError, todayInput } from './transportUi';

/**
 * Boards a student onto a route (or edits an existing boarding). The route
 * itself can be changed on edit, which moves the student to another route.
 */
export default function StudentAssignmentFormModal({
  route,
  routes,
  item,
  presetStudent,
  onClose,
  onSaved,
}: {
  route: TransportRoute;
  routes: TransportRoute[];
  item: StudentRouteAssignment | null;
  /** Student already chosen from the roster's "Add students" list — skips the picker. */
  presetStudent?: { id: number; name: string; admissionNumber: string; className?: string };
  onClose: () => void;
  onSaved: () => void;
}) {
  const isEditing = !!item;
  const [classId, setClassId] = useState<number | ''>('');
  const [studentId, setStudentId] = useState<number | ''>(item?.studentId ?? presetStudent?.id ?? '');
  const [routeId, setRouteId] = useState<number>(item?.routeId ?? route.id);
  const [stopId, setStopId] = useState<number | ''>(item?.stopId ?? '');
  const [effectiveFrom, setEffectiveFrom] = useState(item?.effectiveFrom ?? todayInput());
  const [boardingPoint, setBoardingPoint] = useState(item?.boardingPoint ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const selectedRoute = routes.find((r) => r.id === routeId) ?? route;
  const stops = [...(selectedRoute.stops ?? [])].sort((a, b) => (a.stopOrder ?? 0) - (b.stopOrder ?? 0));

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!studentId) return setError('Choose a student.');
    if (!effectiveFrom) return setError('Choose the date boarding starts.');
    setSaving(true);
    setError('');
    const payload = { studentId, routeId, stopId: stopId || null, effectiveFrom, boardingPoint: boardingPoint.trim() };
    try {
      if (isEditing) await updateStudentRouteAssignment(item!.id, payload);
      else await assignStudentToRoute(payload);
      onSaved();
    } catch (err) {
      setError(apiErrorMessage(err, `Could not ${isEditing ? 'update' : 'add'} the student assignment.`));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      icon={UserPlus}
      title={isEditing ? `Edit boarding — ${item!.studentName}` : presetStudent ? `Add ${presetStudent.name}` : 'Add student to route'}
      subtitle={selectedRoute.routeName}
      onClose={onClose}
      footer={
        <>
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form="student-assign-form" loading={saving}>
            {isEditing ? 'Save changes' : 'Add student'}
          </Button>
        </>
      }
    >
      <form id="student-assign-form" onSubmit={handleSubmit} className="grid gap-4">
        {isEditing || presetStudent ? (
          <div className="rounded-xl border border-slate-200 bg-slate-50/70 px-3.5 py-2.5">
            <p className="text-sm font-semibold text-slate-900">{item?.studentName ?? presetStudent!.name}</p>
            <p className="text-xs text-slate-500">
              Admission no. {(item?.admissionNumber ?? presetStudent!.admissionNumber) || '—'}
              {presetStudent?.className ? ` · ${presetStudent.className}` : ''}
            </p>
          </div>
        ) : (
          <TransportStudentPicker
            classId={classId}
            studentId={studentId}
            onChange={(c, s) => {
              setClassId(c);
              setStudentId(s);
            }}
          />
        )}

        <div className="grid gap-3.5 sm:grid-cols-2">
          {isEditing && (
            <SelectField
              label="Route"
              wrapperClassName="sm:col-span-2"
              value={routeId}
              onChange={(e) => {
                setRouteId(Number(e.target.value));
                setStopId('');
              }}
            >
              {routes.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.routeName}
                </option>
              ))}
            </SelectField>
          )}
          <SelectField label="Stop" value={stopId} onChange={(e) => setStopId(e.target.value ? Number(e.target.value) : '')}>
            <option value="">{stops.length ? 'Select a stop' : 'Route has no stops'}</option>
            {stops
              .filter((s) => s.id)
              .map((s) => (
                <option key={s.id!} value={s.id!}>
                  {s.stopOrder}. {s.stopName}
                  {s.pickupTime ? ` — ${formatTime(s.pickupTime)}` : ''}
                </option>
              ))}
          </SelectField>
          <TextField label="Effective from" type="date" required value={effectiveFrom} onChange={(e) => setEffectiveFrom(e.target.value)} />
        </div>
        <TextField
          label="Boarding point"
          placeholder="Landmark near the stop, e.g. Gate 2, Shanti Apartments"
          value={boardingPoint}
          onChange={(e) => setBoardingPoint(e.target.value)}
        />
        <FormError message={error} />
      </form>
    </Modal>
  );
}
