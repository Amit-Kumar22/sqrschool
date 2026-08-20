'use client';

import { FormEvent, useState } from 'react';
import { PlaySquare } from 'lucide-react';
import {
  createYoutubeTestimonial,
  updateYoutubeTestimonial,
  type YoutubeTestimonial,
  type YoutubeTestimonialPayload,
} from '@/lib/youtubeTestimonialService';
import { apiErrorMessage } from '@/lib/api';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import { TextField } from '@/components/ui/FormField';

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
    <Modal
      icon={PlaySquare}
      title={isEditing ? 'Edit testimonial' : 'Add YouTube testimonial'}
      subtitle={isEditing ? 'Update this testimonial video.' : 'Feature a testimonial video.'}
      accent="rose"
      size="md"
      onClose={onClose}
      footer={
        <>
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form="youtube-testimonial-form" loading={saving}>
            {isEditing ? 'Save changes' : 'Create'}
          </Button>
        </>
      }
    >
      <form id="youtube-testimonial-form" onSubmit={handleSubmit} className="grid gap-3">
        <TextField label="Video title" required value={form.videoTitle} onChange={(e) => setField('videoTitle', e.target.value)} />
        <TextField
          label="Video URL"
          required
          value={form.videoUrl}
          onChange={(e) => setField('videoUrl', e.target.value)}
          placeholder="https://youtube.com/watch?v=..."
        />
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={form.isActive}
            onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))}
            className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500/30"
          />
          <span className="font-medium text-slate-700">Active</span>
        </label>

        {error && <div className="animate-fade-in-up rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">{error}</div>}
      </form>
    </Modal>
  );
}
