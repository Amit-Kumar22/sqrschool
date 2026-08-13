'use client';

import { FormEvent, useState } from 'react';
import { CheckCircle2, Loader2, X } from 'lucide-react';
import { addStaff, type AddStaffPayload, type School, type StaffRole } from '@/lib/schoolService';
import { apiErrorMessage } from '@/lib/api';

function emptyForm(defaultSchoolCode: string): AddStaffPayload {
  return {
    name: '',
    schoolCode: defaultSchoolCode,
    password: '',
    role: 'TEACHER',
    email: '',
    phoneNumber: '',
  };
}

export default function StaffFormModal({
  schools,
  defaultSchoolCode = '',
  onClose,
  onSaved,
}: {
  schools: School[];
  defaultSchoolCode?: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState<AddStaffPayload>(() => emptyForm(defaultSchoolCode));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const setField = (key: keyof AddStaffPayload, value: string) => setForm((f) => ({ ...f, [key]: value }));

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      setError('Name is required.');
      return;
    }
    if (!form.schoolCode) {
      setError('Please select a school.');
      return;
    }
    if (!form.password.trim()) {
      setError('Password is required.');
      return;
    }

    setSaving(true);
    setError('');
    try {
      const result = await addStaff(form);
      setSuccessMessage(result || 'Staff member added successfully.');
    } catch (err) {
      setError(apiErrorMessage(err, 'Failed to add staff member.'));
    } finally {
      setSaving(false);
    }
  };

  if (successMessage) {
    return (
      <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-950/60 p-4 py-8 backdrop-blur-sm">
        <div className="animate-scale-in w-full max-w-md rounded-2xl bg-white p-6 text-center shadow-premium-lg">
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
            <CheckCircle2 size={24} />
          </span>
          <h2 className="mt-3 text-base font-semibold text-slate-900">Staff added</h2>
          <p className="mt-1.5 text-sm text-slate-500">{successMessage}</p>
          <button
            onClick={onSaved}
            className="mt-5 w-full rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-premium-sm transition-all hover:-translate-y-0.5 hover:bg-indigo-700 hover:shadow-premium"
          >
            Done
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-950/60 p-4 py-8 backdrop-blur-sm">
      <div className="animate-scale-in w-full max-w-xl rounded-2xl bg-white shadow-premium-lg">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <h2 className="text-base font-semibold text-slate-900">Add new staff</h2>
          <button
            onClick={onClose}
            aria-label="Close"
            className="rounded-md p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="scrollbar-thin max-h-[75vh] overflow-y-auto px-5 py-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Full name *" value={form.name} onChange={(v) => setField('name', v)} required />

            <label className="block text-sm">
              <span className="mb-1.5 block font-medium text-slate-900">School *</span>
              <select
                value={form.schoolCode}
                required
                onChange={(e) => setField('schoolCode', e.target.value)}
                className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-700 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 focus:outline-none"
              >
                <option value="" disabled>
                  Select a school
                </option>
                {schools.map((school) => (
                  <option key={school.id} value={school.schoolCode}>
                    {school.schoolName} ({school.schoolCode})
                  </option>
                ))}
              </select>
            </label>

            <label className="block text-sm">
              <span className="mb-1.5 block font-medium text-slate-900">Role</span>
              <select
                value={form.role}
                onChange={(e) => setField('role', e.target.value as StaffRole)}
                className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-700 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 focus:outline-none"
              >
                <option value="TEACHER">Teacher</option>
                <option value="STAFF">Staff</option>
              </select>
            </label>

            <Field label="Email" type="email" value={form.email} onChange={(v) => setField('email', v)} required />
            <Field label="Phone number" value={form.phoneNumber} onChange={(v) => setField('phoneNumber', v)} />
            <Field
              label="Password *"
              type="password"
              value={form.password}
              onChange={(v) => setField('password', v)}
              required
            />
          </div>

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
              {saving ? 'Saving…' : 'Add staff'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = 'text',
  required = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  required?: boolean;
}) {
  return (
    <label className="block text-sm">
      <span className="mb-1.5 block font-medium text-slate-900">{label}</span>
      <input
        type={type}
        value={value}
        required={required}
        onChange={(e) => onChange(e.target.value)}
        className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-700 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 focus:outline-none"
      />
    </label>
  );
}
