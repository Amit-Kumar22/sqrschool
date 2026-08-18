'use client';

import { FormEvent, useState } from 'react';
import { Loader2, X } from 'lucide-react';
import { createClass, updateClass, type ClassPayload, type SchoolClass } from '@/lib/classService';
import type { School } from '@/lib/schoolService';
import { apiErrorMessage } from '@/lib/api';

function toFormState(item: SchoolClass | null, schoolCode: string): ClassPayload {
  return { schoolCode, className: item?.className ?? '' };
}

export default function ClassFormModal({
  item,
  schoolCode,
  schools,
  onClose,
  onSaved,
}: {
  item: SchoolClass | null;
  /** The account's own school — auto-fills and hides the school field when set. */
  schoolCode: string;
  /** Only needed (and only shown) when schoolCode is empty — lets the admin pick which school this class belongs to. */
  schools?: School[];
  onClose: () => void;
  onSaved: (item: SchoolClass) => void;
}) {
  const [form, setForm] = useState<ClassPayload>(() => toFormState(item, schoolCode));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const isEditing = !!item;
  const needsSchoolPicker = !schoolCode;
  const setField = (key: keyof ClassPayload, value: string) => setForm((f) => ({ ...f, [key]: value }));

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (needsSchoolPicker && !form.schoolCode) {
      setError('Please select a school.');
      return;
    }
    if (!form.className.trim()) {
      setError('Class name is required.');
      return;
    }

    setSaving(true);
    setError('');
    try {
      const saved = isEditing ? await updateClass(item!.id, form) : await createClass(form);
      onSaved(saved);
    } catch (err) {
      setError(apiErrorMessage(err, `Failed to ${isEditing ? 'update' : 'create'} class.`));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-950/60 p-4 py-8 backdrop-blur-sm">
      <div className="animate-scale-in w-full max-w-md rounded-xl bg-white shadow-premium-lg">
        <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
          <h2 className="text-sm font-semibold text-slate-900">
            {isEditing ? `Edit ${item!.className}` : 'Add class'}
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
            {needsSchoolPicker && (
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
                  {(schools ?? []).map((school) => (
                    <option key={school.id} value={school.schoolCode}>
                      {school.schoolName} ({school.schoolCode})
                    </option>
                  ))}
                </select>
              </label>
            )}

            <label className="block text-sm">
              <span className="mb-1 block text-xs font-medium text-slate-900">Class name *</span>
              <input
                type="text"
                value={form.className}
                required
                placeholder="e.g. Class 5"
                onChange={(e) => setField('className', e.target.value)}
                className="h-9 w-full rounded-md border border-slate-200 bg-white px-2.5 text-sm text-slate-700 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 focus:outline-none"
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
