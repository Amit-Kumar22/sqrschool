'use client';

import { FormEvent, useState } from 'react';
import { MousePointerClick } from 'lucide-react';
import {
  createWebsiteHeroButton,
  updateWebsiteHeroButton,
  type WebsiteHeroButton,
  type WebsiteHeroButtonPayload,
  type WebsiteHeroSlide,
} from '@/lib/websiteSettingService';
import { apiErrorMessage } from '@/lib/api';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import { SelectField, TextField } from '@/components/ui/FormField';

const STYLE_SUGGESTIONS = ['PRIMARY', 'SECONDARY', 'OUTLINE', 'GHOST'];

function toFormState(item: WebsiteHeroButton | null, defaultHeroSlideId: number | ''): WebsiteHeroButtonPayload {
  if (!item) {
    return {
      heroSlideId: (defaultHeroSlideId || 0) as number,
      label: '',
      url: '',
      style: 'PRIMARY',
      icon: '',
      displayOrder: 0,
    };
  }
  return {
    heroSlideId: item.heroSlideId,
    label: item.label,
    url: item.url,
    style: item.style,
    icon: item.icon,
    displayOrder: item.displayOrder,
  };
}

export default function WebsiteHeroButtonFormModal({
  item,
  heroSlides,
  defaultHeroSlideId,
  onClose,
  onSaved,
}: {
  item: WebsiteHeroButton | null;
  heroSlides: WebsiteHeroSlide[];
  defaultHeroSlideId: number | '';
  onClose: () => void;
  onSaved: (item: WebsiteHeroButton) => void;
}) {
  const [form, setForm] = useState<WebsiteHeroButtonPayload>(() => toFormState(item, defaultHeroSlideId));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const isEditing = !!item;
  const setField = <K extends keyof WebsiteHeroButtonPayload>(key: K, value: WebsiteHeroButtonPayload[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.heroSlideId) {
      setError('Please select a hero slide.');
      return;
    }
    if (!form.label.trim()) {
      setError('Label is required.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const saved = isEditing ? await updateWebsiteHeroButton(item!.id, form) : await createWebsiteHeroButton(form);
      onSaved(saved);
    } catch (err) {
      setError(apiErrorMessage(err, `Failed to ${isEditing ? 'update' : 'create'} hero button.`));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      icon={MousePointerClick}
      title={isEditing ? 'Edit hero button' : 'Add hero button'}
      subtitle="A call-to-action button on a hero slide."
      size="lg"
      onClose={onClose}
      footer={
        <>
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form="website-hero-button-form" loading={saving}>
            {isEditing ? 'Save changes' : 'Create'}
          </Button>
        </>
      }
    >
      <form id="website-hero-button-form" onSubmit={handleSubmit} className="grid gap-3.5">
        <SelectField
          label="Hero slide"
          required
          value={form.heroSlideId || ''}
          onChange={(e) => setField('heroSlideId', Number(e.target.value))}
        >
          <option value="" disabled>
            Select a hero slide
          </option>
          {heroSlides.map((slide) => (
            <option key={slide.id} value={slide.id}>
              {slide.title}
            </option>
          ))}
        </SelectField>

        <div className="grid grid-cols-2 gap-3.5">
          <TextField label="Label" required value={form.label} onChange={(e) => setField('label', e.target.value)} />
          <TextField label="URL" value={form.url} onChange={(e) => setField('url', e.target.value)} />
        </div>
        <div className="grid grid-cols-3 gap-3.5">
          <TextField label="Style" list="website-hero-button-style-options" value={form.style} onChange={(e) => setField('style', e.target.value)} />
          <TextField label="Icon" value={form.icon} onChange={(e) => setField('icon', e.target.value)} />
          <TextField
            label="Display order"
            type="number"
            value={form.displayOrder}
            onChange={(e) => setField('displayOrder', Number(e.target.value))}
          />
        </div>
        <datalist id="website-hero-button-style-options">
          {STYLE_SUGGESTIONS.map((option) => (
            <option key={option} value={option} />
          ))}
        </datalist>

        {error && <div className="animate-fade-in-up rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">{error}</div>}
      </form>
    </Modal>
  );
}
