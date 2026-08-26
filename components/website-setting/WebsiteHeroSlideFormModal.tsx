'use client';

import { FormEvent, useState } from 'react';
import { GalleryHorizontal } from 'lucide-react';
import {
  createWebsiteHeroSlide,
  updateWebsiteHeroSlide,
  type WebsiteHeroSlide,
  type WebsiteHeroSlidePayload,
} from '@/lib/websiteSettingService';
import { apiErrorMessage } from '@/lib/api';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import { CheckboxField, TextareaField, TextField } from '@/components/ui/FormField';

function toFormState(item: WebsiteHeroSlide | null): WebsiteHeroSlidePayload {
  if (!item) {
    return {
      backgroundImageUrl: '',
      badge: '',
      title: '',
      subtitle: '',
      description: '',
      displayOrder: 0,
      active: true,
    };
  }
  const { id: _id, ...rest } = item;
  return rest;
}

export default function WebsiteHeroSlideFormModal({
  item,
  onClose,
  onSaved,
}: {
  item: WebsiteHeroSlide | null;
  onClose: () => void;
  onSaved: (item: WebsiteHeroSlide) => void;
}) {
  const [form, setForm] = useState<WebsiteHeroSlidePayload>(() => toFormState(item));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const isEditing = !!item;
  const setField = <K extends keyof WebsiteHeroSlidePayload>(key: K, value: WebsiteHeroSlidePayload[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) {
      setError('Title is required.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const saved = isEditing ? await updateWebsiteHeroSlide(item!.id, form) : await createWebsiteHeroSlide(form);
      onSaved(saved);
    } catch (err) {
      setError(apiErrorMessage(err, `Failed to ${isEditing ? 'update' : 'create'} hero slide.`));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      icon={GalleryHorizontal}
      title={isEditing ? 'Edit hero slide' : 'Add hero slide'}
      subtitle="A slide shown in the homepage hero carousel."
      size="lg"
      onClose={onClose}
      footer={
        <>
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form="website-hero-slide-form" loading={saving}>
            {isEditing ? 'Save changes' : 'Create'}
          </Button>
        </>
      }
    >
      <form id="website-hero-slide-form" onSubmit={handleSubmit} className="grid gap-3.5">
        <TextField
          label="Background image URL"
          value={form.backgroundImageUrl}
          onChange={(e) => setField('backgroundImageUrl', e.target.value)}
        />
        <div className="grid grid-cols-2 gap-3.5">
          <TextField label="Badge" value={form.badge} onChange={(e) => setField('badge', e.target.value)} />
          <TextField
            label="Display order"
            type="number"
            value={form.displayOrder}
            onChange={(e) => setField('displayOrder', Number(e.target.value))}
          />
        </div>
        <TextField label="Title" required value={form.title} onChange={(e) => setField('title', e.target.value)} />
        <TextField label="Subtitle" value={form.subtitle} onChange={(e) => setField('subtitle', e.target.value)} />
        <TextareaField label="Description" value={form.description} onChange={(e) => setField('description', e.target.value)} rows={2} />
        <CheckboxField label="Active" checked={form.active} onChange={(e) => setField('active', e.target.checked)} />
        {error && <div className="animate-fade-in-up rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">{error}</div>}
      </form>
    </Modal>
  );
}
