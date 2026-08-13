'use client';

import { FormEvent, useState } from 'react';
import { Loader2, X } from 'lucide-react';
import {
  createYoutubeTestimonial,
  updateYoutubeTestimonial,
  type YoutubeTestimonial,
  type YoutubeTestimonialPayload,
} from '@/lib/youtubeTestimonialService';
import { apiErrorMessage } from '@/lib/api';

const EMPTY_FORM: YoutubeTestimonialPayload = {
  videoTitle: '',
  videoUrl: '',
  isActive: true,
};

function toFormState(item: YoutubeTestimonial | null): YoutubeTestimonialPayload {
  if (!item) return EMPTY_FORM;
  const { id: _id, createdAt: _createdAt, ...rest } = item;
  return rest;
}

export default function YoutubeTestimonialFormModal({
  item,
  onClose,
  onSaved,
}: {
  item: YoutubeTestimonial | null;
  onClose: () => void;
  onSaved: (item: YoutubeTestimonial) => void;
}) {
  const [form, setForm] = useState<YoutubeTestimonialPayload>(() => toFormState(item));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const isEditing = !!item;
  const setField = (key: keyof Omit<YoutubeTestimonialPayload, 'isActive'>, value: string) =>
    setForm((f) => ({ ...f, [key]: value }));

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.videoTitle.trim() || !form.videoUrl.trim()) {
      setError('Video title and URL are required.');
      return;
    }

    setSaving(true);
    setError('');
    try {
      const saved = isEditing
        ? await updateYoutubeTestimonial(item!.id, form)
        : await createYoutubeTestimonial(form);
      onSaved(saved);
    } catch (err) {
      setError(apiErrorMessage(err, `Failed to ${isEditing ? 'update' : 'create'} testimonial.`));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-950/60 p-4 py-8 backdrop-blur-sm">
      <div className="animate-scale-in w-full max-w-lg rounded-2xl bg-white shadow-premium-lg">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <h2 className="text-base font-semibold text-slate-900">
            {isEditing ? 'Edit testimonial' : 'Add YouTube testimonial'}
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
          <div className="grid gap-3">
            <Field label="Video title *" value={form.videoTitle} onChange={(v) => setField('videoTitle', v)} required />
            <Field
              label="Video URL *"
              value={form.videoUrl}
              onChange={(v) => setField('videoUrl', v)}
              placeholder="https://youtube.com/watch?v=..."
              required
            />
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))}
                className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500/30"
              />
              <span className="font-medium text-slate-900">Active</span>
            </label>
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
              {saving ? 'Saving…' : isEditing ? 'Save changes' : 'Create'}
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
  required = false,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  placeholder?: string;
}) {
  return (
    <label className="block text-sm">
      <span className="mb-1.5 block font-medium text-slate-900">{label}</span>
      <input
        type="text"
        value={value}
        required={required}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-700 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 focus:outline-none"
      />
    </label>
  );
}
