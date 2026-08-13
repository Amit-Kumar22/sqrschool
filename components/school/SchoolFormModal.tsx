'use client';

import { FormEvent, useState } from 'react';
import { Loader2, X } from 'lucide-react';
import { createSchool, updateSchool, type School, type SchoolAddress, type SchoolPayload } from '@/lib/schoolService';
import { apiErrorMessage } from '@/lib/api';

const EMPTY_ADDRESS: SchoolAddress = {
  buildingName: '',
  streetName: '',
  landmark: '',
  district: '',
  city: '',
  pin: '',
  stateName: '',
};

const EMPTY_FORM: SchoolPayload = {
  schoolName: '',
  schoolCode: '',
  registrationNumber: '',
  affiliationBoard: '',
  establishedYear: new Date().getFullYear(),
  email: '',
  phoneNumber: '',
  alternatePhone: '',
  website: '',
  logoUrl: '',
  principalName: '',
  totalStudents: 0,
  totalTeachers: 0,
  address: EMPTY_ADDRESS,
};

function toFormState(school: School | null): SchoolPayload {
  if (!school) return EMPTY_FORM;
  const { id: _id, created: _created, updated: _updated, active: _active, ...rest } = school;
  return rest;
}

export default function SchoolFormModal({
  school,
  onClose,
  onSaved,
}: {
  school: School | null;
  onClose: () => void;
  onSaved: (school: School) => void;
}) {
  const [form, setForm] = useState<SchoolPayload>(() => toFormState(school));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const isEditing = !!school;
  const setField = (key: keyof Omit<SchoolPayload, 'address'>, value: string) => setForm((f) => ({ ...f, [key]: value }));
  const setNumberField = (key: keyof Omit<SchoolPayload, 'address'>, value: string) =>
    setForm((f) => ({ ...f, [key]: value === '' ? 0 : Number(value) }));
  const setAddressField = (key: keyof SchoolAddress, value: string) =>
    setForm((f) => ({ ...f, address: { ...f.address, [key]: value } }));

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.schoolName.trim()) {
      setError('School name is required.');
      return;
    }

    setSaving(true);
    setError('');
    try {
      const saved = isEditing ? await updateSchool(school!.id, form) : await createSchool(form);
      onSaved(saved);
    } catch (err) {
      setError(apiErrorMessage(err, `Failed to ${isEditing ? 'update' : 'create'} school.`));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-950/60 p-4 py-8 backdrop-blur-sm">
      <div className="animate-scale-in w-full max-w-2xl rounded-2xl bg-white shadow-premium-lg">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <h2 className="text-base font-semibold text-slate-900">
            {isEditing ? `Edit "${school!.schoolName}"` : 'Add new school'}
          </h2>
          <button
            onClick={onClose}
            aria-label="Close"
            className="rounded-md p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="scrollbar-thin max-h-[75vh] overflow-y-auto px-5 py-4">
          <FieldGroup title="Basic information">
            <Field label="School name *" value={form.schoolName} onChange={(v) => setField('schoolName', v)} required />
            <Field label="School code" value={form.schoolCode} onChange={(v) => setField('schoolCode', v)} />
            <Field
              label="Registration number"
              value={form.registrationNumber}
              onChange={(v) => setField('registrationNumber', v)}
            />
            <Field
              label="Affiliation board"
              value={form.affiliationBoard}
              onChange={(v) => setField('affiliationBoard', v)}
              placeholder="e.g. CBSE"
            />
            <Field
              label="Established year"
              type="number"
              value={String(form.establishedYear)}
              onChange={(v) => setNumberField('establishedYear', v)}
            />
            <Field label="Principal name" value={form.principalName} onChange={(v) => setField('principalName', v)} />
          </FieldGroup>

          <FieldGroup title="Contact & web">
            <Field label="Email" type="email" value={form.email} onChange={(v) => setField('email', v)} />
            <Field label="Phone number" value={form.phoneNumber} onChange={(v) => setField('phoneNumber', v)} />
            <Field label="Alternate phone" value={form.alternatePhone} onChange={(v) => setField('alternatePhone', v)} />
            <Field label="Website" value={form.website} onChange={(v) => setField('website', v)} placeholder="https://" />
            <Field
              label="Logo URL"
              value={form.logoUrl}
              onChange={(v) => setField('logoUrl', v)}
              className="sm:col-span-2"
            />
          </FieldGroup>

          <FieldGroup title="Statistics">
            <Field
              label="Total students"
              type="number"
              value={String(form.totalStudents)}
              onChange={(v) => setNumberField('totalStudents', v)}
            />
            <Field
              label="Total teachers"
              type="number"
              value={String(form.totalTeachers)}
              onChange={(v) => setNumberField('totalTeachers', v)}
            />
          </FieldGroup>

          <FieldGroup title="Address" last>
            <Field
              label="Building name"
              value={form.address.buildingName}
              onChange={(v) => setAddressField('buildingName', v)}
            />
            <Field label="Street name" value={form.address.streetName} onChange={(v) => setAddressField('streetName', v)} />
            <Field label="Landmark" value={form.address.landmark} onChange={(v) => setAddressField('landmark', v)} />
            <Field label="District" value={form.address.district} onChange={(v) => setAddressField('district', v)} />
            <Field label="City" value={form.address.city} onChange={(v) => setAddressField('city', v)} />
            <Field label="State" value={form.address.stateName} onChange={(v) => setAddressField('stateName', v)} />
            <Field label="PIN code" value={form.address.pin} onChange={(v) => setAddressField('pin', v)} />
          </FieldGroup>

          {error && (
            <div className="mt-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
          )}

          <div className="mt-6 flex justify-end gap-2 border-t border-slate-100 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-premium-sm transition-all hover:-translate-y-0.5 hover:bg-indigo-700 hover:shadow-premium disabled:translate-y-0 disabled:opacity-60 disabled:shadow-none"
            >
              {saving && <Loader2 size={15} className="animate-spin" />}
              {saving ? 'Saving…' : isEditing ? 'Save changes' : 'Create school'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function FieldGroup({ title, last = false, children }: { title: string; last?: boolean; children: React.ReactNode }) {
  return (
    <div className={last ? '' : 'mb-5'}>
      <p className="mb-2 text-xs font-semibold tracking-wide text-slate-400 uppercase">{title}</p>
      <div className="grid gap-3 sm:grid-cols-2">{children}</div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = 'text',
  required = false,
  placeholder,
  className = '',
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  required?: boolean;
  placeholder?: string;
  className?: string;
}) {
  return (
    <label className={`block text-sm ${className}`}>
      <span className="mb-1.5 block font-medium text-slate-900">{label}</span>
      <input
        type={type}
        value={value}
        required={required}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-700 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 focus:outline-none"
      />
    </label>
  );
}
