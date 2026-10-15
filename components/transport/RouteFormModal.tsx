'use client';

import { FormEvent, useEffect, useState } from 'react';
import { ArrowDown, ArrowUp, MapPin, Plus, Route as RouteIcon, Trash2 } from 'lucide-react';
import { apiErrorMessage } from '@/lib/api';
import {
  createRoute,
  getRoute,
  inputToTime,
  timeToInput,
  updateRoute,
  type TransportRoute,
  type TransportStaff,
  type Vehicle,
} from '@/lib/transportService';
import Modal from '@/components/ui/Modal';
import Button, { IconButton } from '@/components/ui/Button';
import { SelectField, TextField, TextareaField } from '@/components/ui/FormField';
import { enumLabel, FormError, FormSection } from './transportUi';

interface StopDraft {
  key: string;
  id: number | null;
  stopName: string;
  pickupTime: string;
}

interface RouteDraft {
  routeName: string;
  transportFee: number;
  pickupTime: string;
  dropTime: string;
  vehicleId: number | null;
  driverId: number | null;
  description: string;
  stops: StopDraft[];
}

let stopSeq = 0;
const newStopKey = () => `stop-${++stopSeq}`;

function toDraft(r: TransportRoute | null): RouteDraft {
  return {
    routeName: r?.routeName ?? '',
    transportFee: r?.transportFee ?? 0,
    pickupTime: timeToInput(r?.pickupTime),
    dropTime: timeToInput(r?.dropTime),
    vehicleId: r?.vehicleId ?? null,
    driverId: r?.driverId ?? null,
    description: r?.description ?? '',
    stops: [...(r?.stops ?? [])]
      .sort((a, b) => (a.stopOrder ?? 0) - (b.stopOrder ?? 0))
      .map((s) => ({ key: newStopKey(), id: s.id ?? null, stopName: s.stopName, pickupTime: timeToInput(s.pickupTime) })),
  };
}

/** Create/edit a route: timings, fee, vehicle & driver, and its ordered list of stops. */
export default function RouteFormModal({
  item,
  vehicles,
  drivers,
  onClose,
  onSaved,
}: {
  item: TransportRoute | null;
  vehicles: Vehicle[];
  drivers: TransportStaff[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState<RouteDraft>(() => toDraft(item));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const isEditing = !!item;

  useEffect(() => {
    if (!item) return;
    getRoute(item.id)
      .then((fresh) => fresh && setForm(toDraft(fresh)))
      .catch(() => {});
  }, [item]);

  const setField = <K extends keyof RouteDraft>(key: K, value: RouteDraft[K]) => setForm((f) => ({ ...f, [key]: value }));

  const updateStop = (key: string, patch: Partial<StopDraft>) =>
    setForm((f) => ({ ...f, stops: f.stops.map((s) => (s.key === key ? { ...s, ...patch } : s)) }));

  const moveStop = (index: number, dir: -1 | 1) =>
    setForm((f) => {
      const stops = [...f.stops];
      const target = index + dir;
      if (target < 0 || target >= stops.length) return f;
      [stops[index], stops[target]] = [stops[target], stops[index]];
      return { ...f, stops };
    });

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.routeName.trim()) return setError('Route name is required.');
    if (form.transportFee < 0) return setError('Transport fee cannot be negative.');
    if (form.stops.some((s) => !s.stopName.trim())) return setError('Every stop needs a name — remove empty stops.');

    setSaving(true);
    setError('');
    const payload = {
      routeName: form.routeName.trim(),
      transportFee: form.transportFee || 0,
      pickupTime: inputToTime(form.pickupTime),
      dropTime: inputToTime(form.dropTime),
      vehicleId: form.vehicleId,
      driverId: form.driverId,
      description: form.description,
      stops: form.stops.map((s, i) => ({
        ...(s.id ? { id: s.id } : {}),
        stopName: s.stopName.trim(),
        stopOrder: i + 1,
        pickupTime: inputToTime(s.pickupTime),
      })),
    };
    try {
      if (isEditing) await updateRoute(item!.id, payload);
      else await createRoute(payload);
      onSaved();
    } catch (err) {
      setError(apiErrorMessage(err, `Failed to ${isEditing ? 'update' : 'create'} route.`));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      icon={RouteIcon}
      title={isEditing ? `Edit ${item!.routeName}` : 'New route'}
      subtitle="Timings, fee, vehicle, driver and stops."
      size="lg"
      onClose={onClose}
      footer={
        <>
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form="route-form" loading={saving}>
            {isEditing ? 'Save changes' : 'Create route'}
          </Button>
        </>
      }
    >
      <form id="route-form" onSubmit={handleSubmit} className="grid gap-5">
        <FormSection title="Route">
          <div className="grid gap-3.5 sm:grid-cols-2">
            <TextField label="Route name" required placeholder="e.g. Route 4 — Kothrud" value={form.routeName} onChange={(e) => setField('routeName', e.target.value)} />
            <TextField
              label="Transport fee (₹)"
              type="number"
              min={0}
              step={0.01}
              required
              hint="Charged per fee cycle for each student on this route"
              value={form.transportFee || ''}
              onChange={(e) => setField('transportFee', Number(e.target.value))}
            />
            <TextField label="Morning pickup starts" type="time" value={form.pickupTime} onChange={(e) => setField('pickupTime', e.target.value)} />
            <TextField label="Afternoon drop starts" type="time" value={form.dropTime} onChange={(e) => setField('dropTime', e.target.value)} />
            <SelectField label="Vehicle" value={form.vehicleId ?? ''} onChange={(e) => setField('vehicleId', e.target.value ? Number(e.target.value) : null)}>
              <option value="">Not assigned</option>
              {vehicles.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.registrationNumber} — {enumLabel(v.vehicleType)} · {v.seatingCapacity} seats
                </option>
              ))}
            </SelectField>
            <SelectField label="Driver" value={form.driverId ?? ''} onChange={(e) => setField('driverId', e.target.value ? Number(e.target.value) : null)}>
              <option value="">Not assigned</option>
              {drivers.map((d) => (
                <option key={d.id} value={d.id} disabled={d.licenceExpired}>
                  {d.name} — {enumLabel(d.designation)}
                  {d.licenceExpired ? ' (licence expired)' : ''}
                </option>
              ))}
            </SelectField>
          </div>
          <TextareaField label="Description" rows={2} value={form.description} onChange={(e) => setField('description', e.target.value)} />
        </FormSection>

        <FormSection title={`Stops (${form.stops.length})`}>
          {form.stops.length === 0 ? (
            <p className="rounded-xl border border-dashed border-slate-200 px-4 py-5 text-center text-xs text-slate-400">
              No stops yet — add the pickup points in the order the vehicle reaches them.
            </p>
          ) : (
            <ol className="relative space-y-2 before:absolute before:top-4 before:bottom-4 before:left-[15px] before:w-px before:bg-brand-200">
              {form.stops.map((stop, i) => (
                <li key={stop.key} className="relative flex items-center gap-2">
                  <span className="z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-600 text-xs font-bold text-white ring-4 ring-white">
                    {i + 1}
                  </span>
                  <input
                    aria-label={`Stop ${i + 1} name`}
                    placeholder="Stop name"
                    value={stop.stopName}
                    onChange={(e) => updateStop(stop.key, { stopName: e.target.value })}
                    className="h-9 min-w-0 flex-1 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 focus:outline-none"
                  />
                  <input
                    aria-label={`Stop ${i + 1} pickup time`}
                    type="time"
                    value={stop.pickupTime}
                    onChange={(e) => updateStop(stop.key, { pickupTime: e.target.value })}
                    className="h-9 w-28 shrink-0 rounded-lg border border-slate-200 bg-white px-2 text-sm text-slate-700 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 focus:outline-none"
                  />
                  <IconButton icon={ArrowUp} label="Move up" size="sm" disabled={i === 0} onClick={() => moveStop(i, -1)} />
                  <IconButton icon={ArrowDown} label="Move down" size="sm" disabled={i === form.stops.length - 1} onClick={() => moveStop(i, 1)} />
                  <IconButton
                    icon={Trash2}
                    label="Remove stop"
                    size="sm"
                    variant="danger"
                    onClick={() => setForm((f) => ({ ...f, stops: f.stops.filter((s) => s.key !== stop.key) }))}
                  />
                </li>
              ))}
            </ol>
          )}
          <div>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              icon={form.stops.length ? Plus : MapPin}
              onClick={() => setForm((f) => ({ ...f, stops: [...f.stops, { key: newStopKey(), id: null, stopName: '', pickupTime: '' }] }))}
            >
              Add stop
            </Button>
          </div>
        </FormSection>

        <FormError message={error} />
      </form>
    </Modal>
  );
}
