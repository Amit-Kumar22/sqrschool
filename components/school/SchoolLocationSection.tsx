'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { Crosshair, MapPinned, Navigation, Save } from 'lucide-react';
import { updateSchoolCoordinates, type School } from '@/lib/schoolService';
import { getCurrentPosition, reverseGeocode } from '@/lib/geo';
import { apiErrorMessage } from '@/lib/api';
import Button from '@/components/ui/Button';
import { TextareaField, TextField } from '@/components/ui/FormField';

const SchoolLocationMap = dynamic(() => import('./SchoolLocationMap'), { ssr: false });
const SchoolLocationPicker = dynamic(() => import('./SchoolLocationPicker'), { ssr: false });

interface LocationForm {
  latitude: string;
  longitude: string;
  allowedRadiusMeters: string;
}

function toLocationForm(school: School): LocationForm {
  return {
    latitude: school.latitude != null ? String(school.latitude) : '',
    longitude: school.longitude != null ? String(school.longitude) : '',
    allowedRadiusMeters: school.allowedRadiusMeters != null ? String(school.allowedRadiusMeters) : '200',
  };
}

/**
 * Attendance geofence editor — shown inside SchoolFormModal only when
 * editing an existing school (the coordinate endpoint needs an id). Saves
 * independently of the main "Save changes" button since it's a separate
 * backend call (PUT /v1/school/{id}/cordinate).
 */
export default function SchoolLocationSection({ school }: { school: School }) {
  const [form, setForm] = useState<LocationForm>(() => toLocationForm(school));
  const [address, setAddress] = useState('');
  const [resolvingAddress, setResolvingAddress] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [locating, setLocating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);

  const latitude = Number(form.latitude);
  const longitude = Number(form.longitude);
  const hasValidPosition = form.latitude !== '' && form.longitude !== '' && !Number.isNaN(latitude) && !Number.isNaN(longitude);

  const setField = (key: keyof LocationForm, value: string) => {
    setForm((f) => ({ ...f, [key]: value }));
    setSaved(false);
  };

  const applyPosition = (lat: number, lng: number) => {
    setForm((f) => ({ ...f, latitude: String(lat), longitude: String(lng) }));
    setSaved(false);
  };

  const resolveAddressNow = async (lat: number, lng: number) => {
    setResolvingAddress(true);
    try {
      const result = await reverseGeocode(lat, lng);
      setAddress(result || 'No address found for this point.');
    } catch {
      setAddress('Could not resolve an address for this point.');
    } finally {
      setResolvingAddress(false);
    }
  };

  // Auto-resolves the address whenever the coordinates settle on a valid
  // point, however they got there (typed manually, auto-fetched, or picked
  // on the map) — debounced so manual typing doesn't fire a request per
  // keystroke. handleAutoFetch/the map picker also resolve immediately (see
  // below) for a snappier result; this effect is the catch-all, including
  // for plain manual typing which has no other trigger.
  useEffect(() => {
    if (!hasValidPosition) {
      setAddress('');
      setResolvingAddress(false);
      return;
    }
    setResolvingAddress(true);
    const timer = setTimeout(() => {
      resolveAddressNow(latitude, longitude);
    }, 600);
    return () => clearTimeout(timer);
  }, [latitude, longitude, hasValidPosition]);

  const handleAutoFetch = async () => {
    setLocating(true);
    setError('');
    try {
      const coords = await getCurrentPosition();
      applyPosition(coords.latitude, coords.longitude);
      await resolveAddressNow(coords.latitude, coords.longitude);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not fetch your current location.');
    } finally {
      setLocating(false);
    }
  };

  const handleSaveLocation = async () => {
    const radius = Number(form.allowedRadiusMeters);
    if (!hasValidPosition) {
      setError('Set a latitude and longitude first — use the map picker or auto-fetch.');
      return;
    }
    if (!form.allowedRadiusMeters || Number.isNaN(radius) || radius <= 0) {
      setError('Enter a valid allowed radius in meters.');
      return;
    }

    setSaving(true);
    setError('');
    try {
      await updateSchoolCoordinates(school.id, { latitude, longitude, allowedRadiusMeters: radius });
      setSaved(true);
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not save the school location.'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <p className="mb-2 text-xs font-semibold tracking-wide text-slate-400 uppercase">Attendance location</p>

      <div className="mb-3 flex flex-wrap gap-2">
        <Button type="button" variant="secondary" size="sm" icon={MapPinned} onClick={() => setPickerOpen(true)}>
          Change Location on Map
        </Button>
        <Button type="button" variant="secondary" size="sm" icon={Crosshair} loading={locating} onClick={handleAutoFetch}>
          Auto Fetch
        </Button>
      </div>

      {hasValidPosition && (
        <div className="mb-3 overflow-hidden rounded-lg border border-slate-100">
          <SchoolLocationMap
            latitude={latitude}
            longitude={longitude}
            radiusMeters={Number(form.allowedRadiusMeters) || undefined}
            className="h-44 w-full"
          />
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-3">
        <TextField
          label="Latitude"
          value={form.latitude}
          onChange={(e) => setField('latitude', e.target.value)}
          placeholder="e.g. 25.633321"
        />
        <TextField
          label="Longitude"
          value={form.longitude}
          onChange={(e) => setField('longitude', e.target.value)}
          placeholder="e.g. 85.091955"
        />
        <TextField
          label="Allowed radius (meters)"
          type="number"
          min={1}
          value={form.allowedRadiusMeters}
          onChange={(e) => setField('allowedRadiusMeters', e.target.value)}
          hint="Attendance can be marked within this radius"
        />
      </div>

      <div className="mt-3 flex items-end gap-2">
        <TextareaField
          label="Address"
          rows={2}
          readOnly
          value={resolvingAddress ? 'Resolving address…' : address}
          placeholder="Resolved automatically from the latitude/longitude above."
          wrapperClassName="flex-1"
          className="cursor-default bg-slate-50 text-slate-600"
        />
        <Button
          type="button"
          variant="secondary"
          size="sm"
          icon={resolvingAddress ? undefined : Navigation}
          loading={resolvingAddress}
          disabled={!hasValidPosition}
          onClick={() => resolveAddressNow(latitude, longitude)}
        >
          Fetch Address
        </Button>
      </div>

      {error && <div className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">{error}</div>}
      {saved && !error && (
        <div className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-700">
          Location saved.
        </div>
      )}

      <div className="mt-3 flex justify-end">
        <Button type="button" size="sm" icon={Save} loading={saving} onClick={handleSaveLocation}>
          Save Location
        </Button>
      </div>

      {pickerOpen && (
        <SchoolLocationPicker
          initialLatitude={hasValidPosition ? latitude : undefined}
          initialLongitude={hasValidPosition ? longitude : undefined}
          onCancel={() => setPickerOpen(false)}
          onConfirm={(lat, lng, resolvedAddress) => {
            applyPosition(lat, lng);
            // The picker already resolved this address while the user was
            // picking — apply it immediately instead of waiting on the
            // debounced effect above to redo the same lookup.
            setAddress(resolvedAddress);
            setResolvingAddress(false);
            setPickerOpen(false);
          }}
        />
      )}
    </div>
  );
}
