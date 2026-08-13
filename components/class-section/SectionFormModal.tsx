'use client';

import { FormEvent, useState } from 'react';
import { Loader2, X } from 'lucide-react';
import { createSection, updateSection, type Section, type SectionPayload } from '@/lib/classSectionService';
import type { SchoolClass } from '@/lib/classService';
import { apiErrorMessage } from '@/lib/api';

function toFormState(item: Section | null, defaultClassId: number | ''): SectionPayload {
  return { classId: (defaultClassId || 0) as number, sectionName: item?.sectionName ?? '' };
}

export default function SectionFormModal({
  item,
  classes,
  defaultClassId,
  onClose,
  onSaved,
}: {
  item: Section | null;
  classes: SchoolClass[];
  defaultClassId: number | '';
  onClose: () => void;
  onSaved: (item: Section) => void;
}) {
  const [form, setForm] = useState<SectionPayload>(() => toFormState(item, defaultClassId));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const isEditing = !!item;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.classId) {
      setError('Please select a class.');
      return;
    }
    if (!form.sectionName.trim()) {
      setError('Section name is required.');
      return;
    }

    setSaving(true);
    setError('');
    try {
      const saved = isEditing ? await updateSection(item!.id, form) : await createSection(form);
      onSaved(saved);
    } catch (err) {
      setError(apiErrorMessage(err, `Failed to ${isEditing ? 'update' : 'create'} section.`));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-950/60 p-4 py-8 backdrop-blur-sm">
      <div className="animate-scale-in w-full max-w-md rounded-xl bg-white shadow-premium-lg">
        <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
          <h2 className="text-sm font-semibold text-slate-900">
            {isEditing ? `Edit ${item!.sectionName}` : 'Add section'}
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
              <span className="mb-1 block text-xs font-medium text-slate-900">Class *</span>
              <select
                value={form.classId || ''}
                required
                onChange={(e) => setForm((f) => ({ ...f, classId: Number(e.target.value) }))}
                className="h-9 w-full rounded-md border border-slate-200 bg-white px-2.5 text-sm text-slate-700 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 focus:outline-none"
              >
                <option value="" disabled>
                  Select a class
                </option>
                {classes.map((cls) => (
                  <option key={cls.id} value={cls.id}>
                    {cls.className}
                  </option>
                ))}
              </select>
            </label>

            <label className="block text-sm">
              <span className="mb-1 block text-xs font-medium text-slate-900">Section name *</span>
              <input
                type="text"
                value={form.sectionName}
                required
                placeholder="e.g. A"
                onChange={(e) => setForm((f) => ({ ...f, sectionName: e.target.value }))}
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
