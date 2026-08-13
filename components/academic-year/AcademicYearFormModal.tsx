'use client';

import { FormEvent, useState } from 'react';
import { Loader2, X } from 'lucide-react';
import {
  createAcademicYear,
  updateAcademicYear,
  type AcademicYear,
  type AcademicYearPayload,
} from '@/lib/academicYearService';
import type { School } from '@/lib/schoolService';
import { apiErrorMessage } from '@/lib/api';

function toFormState(item: AcademicYear | null, defaultSchoolCode: string): AcademicYearPayload {
  if (!item) return { schoolCode: defaultSchoolCode, startDate: '', endDate: '', description: '' };
  return {
    schoolCode: defaultSchoolCode,
    startDate: item.startDate,
    endDate: item.endDate,
    description: item.description,
  };
}

export default function AcademicYearFormModal({
  item,
  schools,
  defaultSchoolCode,
  onClose,
  onSaved,
}: {
  item: AcademicYear | null;
  schools: School[];
  defaultSchoolCode: string;
  onClose: () => void;
  onSaved: (item: AcademicYear) => void;
}) {
  const [form, setForm] = useState<AcademicYearPayload>(() => toFormState(item, defaultSchoolCode));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const isEditing = !!item;
  const setField = (key: keyof AcademicYearPayload, value: string) => setForm((f) => ({ ...f, [key]: value }));

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.schoolCode) {
      setError('Please select a school.');
      return;
    }
    if (!form.startDate || !form.endDate) {
      setError('Start and end date are required.');
      return;
    }
    if (form.endDate < form.startDate) {
      setError('End date cannot be before the start date.');
      return;
    }

    setSaving(true);
    setError('');
    try {
      const saved = isEditing ? await updateAcademicYear(item!.id, form) : await createAcademicYear(form);
      onSaved(saved);
    } catch (err) {
      setError(apiErrorMessage(err, `Failed to ${isEditing ? 'update' : 'create'} academic year.`));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-950/60 p-4 py-8 backdrop-blur-sm">
      <div className="animate-scale-in w-full max-w-md rounded-xl bg-white shadow-premium-lg">
        <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
          <h2 className="text-sm font-semibold text-slate-900">
            {isEditing ? `Edit ${item!.yearCode}` : 'Add academic year'}
          </h2>
          <button
            onClick={onClose}
            aria-label="Close"
            className="rounded-md p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-4 py-3">
          <div className="grid gap-2.5">
            <label className="block text-sm">
              <span className="mb-1 block text-xs font-medium text-slate-900">School *</span>
              <select
                value={form.schoolCode}
                required
                onChange={(e) => setField('schoolCode', e.target.value)}
                className="h-9 w-full rounded-md border border-slate-200 bg-white px-2.5 text-sm text-slate-700 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 focus:outline-none"
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

            <div className="grid grid-cols-2 gap-2.5">
              <label className="block text-sm">
                <span className="mb-1 block text-xs font-medium text-slate-900">Start date *</span>
                <input
                  type="date"
                  value={form.startDate}
                  required
                  onChange={(e) => setField('startDate', e.target.value)}
                  className="h-9 w-full rounded-md border border-slate-200 bg-white px-2.5 text-sm text-slate-700 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 focus:outline-none"
                />
              </label>
              <label className="block text-sm">
                <span className="mb-1 block text-xs font-medium text-slate-900">End date *</span>
                <input
                  type="date"
                  value={form.endDate}
                  required
                  onChange={(e) => setField('endDate', e.target.value)}
                  className="h-9 w-full rounded-md border border-slate-200 bg-white px-2.5 text-sm text-slate-700 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 focus:outline-none"
                />
              </label>
            </div>

            <label className="block text-sm">
              <span className="mb-1 block text-xs font-medium text-slate-900">Description</span>
              <textarea
                value={form.description}
                onChange={(e) => setField('description', e.target.value)}
                rows={2}
                className="w-full rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-sm text-slate-700 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 focus:outline-none"
              />
            </label>
          </div>

          {error && (
            <div className="mt-3 rounded-md border border-red-200 bg-red-50 px-2.5 py-1.5 text-xs text-red-700">
              {error}
            </div>
          )}

          <div className="mt-4 flex justify-end gap-2 border-t border-slate-100 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-1.5 rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-semibold text-white shadow-premium-sm transition-all hover:bg-indigo-700 disabled:opacity-60"
            >
              {saving && <Loader2 size={14} className="animate-spin" />}
              {saving ? 'Saving…' : isEditing ? 'Save changes' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
